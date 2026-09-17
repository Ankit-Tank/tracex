from typing import List, Dict, Tuple, Set, Optional, Any
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.models import Entity, EntityLink, Case, CaseStatus, RiskLevel


def is_same_subnet_24(ip1: str, ip2: str) -> bool:
    """Return True if two IPv4 addresses are distinct but share the same /24 subnet."""
    try:
        parts1 = [int(x) for x in ip1.strip().split(".")]
        parts2 = [int(x) for x in ip2.strip().split(".")]
        if len(parts1) == 4 and len(parts2) == 4:
            return parts1[:3] == parts2[:3] and parts1[3] != parts2[3]
    except Exception:
        pass
    return False


def get_confidence_and_basis(
    entity_type_str: str,
    is_multi_source: bool = False,
    is_subnet: bool = False,
) -> Tuple[float, str]:
    """Return (confidence, basis) based on core investigative rules."""
    et = entity_type_str.lower()

    if is_subnet:
        return 0.4, "shared_ip_subnet"

    if et in ["upi_handle", "upi"]:
        return 0.95, "shared_upi_handle"
    elif et in ["account", "bank_account"]:
        return 0.95, "shared_account"
    elif et == "phone":
        return 0.9, "shared_phone"
    elif et == "ip_address":
        return 0.7, "shared_ip_address"
    elif et == "imei":
        return 0.6, "shared_imei"
    elif et == "imsi":
        return 0.6, "shared_imsi"
    elif et == "email":
        return 0.85, "shared_email"
    elif et == "url":
        return 0.75, "shared_url"
    else:
        return 0.5, f"shared_{et}"


def correlate_case(case_id: int, db: Session) -> List[EntityLink]:
    """Execute entity correlation for a given case:
    1. Group entities by (entity_type, value) and identify multi-evidence appearances.
    2. Check cross-entity relationships (co-occurring IMEI/phone/IMSI, Account/UPI, IP subnets).
    3. Perform cross-case correlation against entities from other complaints.
    4. Persist and return new/existing EntityLink rows.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        return []

    # Update case status to correlating if currently open
    if case.status == CaseStatus.open:
        case.status = CaseStatus.correlating
        db.commit()

    entities: List[Entity] = db.query(Entity).filter(Entity.case_id == case_id).all()
    if not entities:
        return []

    # Load existing links for this case to prevent duplicates
    existing_links: List[EntityLink] = db.query(EntityLink).filter(EntityLink.case_id == case_id).all()
    existing_pairs: Set[Tuple[int, int, str]] = set()
    for link in existing_links:
        u, v = min(link.entity_a_id, link.entity_b_id), max(link.entity_a_id, link.entity_b_id)
        existing_pairs.add((u, v, link.basis))

    new_links: List[EntityLink] = []

    def add_link(
        e_a: Entity,
        e_b: Entity,
        basis: str,
        confidence: float,
        evidence_ids: List[int],
        extra: Optional[Dict[str, Any]] = None,
    ):
        if e_a.id == e_b.id:
            return
        pair_key = (min(e_a.id, e_b.id), max(e_a.id, e_b.id), basis)
        if pair_key not in existing_pairs:
            existing_pairs.add(pair_key)
            clean_evidence_ids = sorted(list({int(x) for x in evidence_ids if x is not None}))
            link_record = EntityLink(
                case_id=case_id,
                entity_a_id=e_a.id,
                entity_b_id=e_b.id,
                basis=basis,
                confidence=confidence,
                source_evidence_ids=clean_evidence_ids,
                extra=extra or {},
            )
            new_links.append(link_record)

    # 1. Group entities by (entity_type, value)
    by_type_and_val: Dict[Tuple[str, str], List[Entity]] = defaultdict(list)
    for ent in entities:
        type_str = ent.entity_type.value if hasattr(ent.entity_type, "value") else str(ent.entity_type)
        by_type_and_val[(type_str, ent.value)].append(ent)

    # For any group with multiple entities from different EvidenceFiles:
    for (type_str, val), group in by_type_and_val.items():
        evidence_sources = set()
        for e in group:
            if e.source_evidence_ids:
                evidence_sources.update(e.source_evidence_ids)
            elif e.evidence_file_id:
                evidence_sources.add(e.evidence_file_id)

        if len(group) > 1 or len(evidence_sources) > 1:
            conf, basis = get_confidence_and_basis(type_str, is_multi_source=True)
            all_evidence_ids = list(evidence_sources)
            # Link pairwise in the group
            for i in range(len(group)):
                for j in range(i + 1, len(group)):
                    add_link(group[i], group[j], basis, conf, all_evidence_ids)

    # 2. Intra-evidence co-occurrence and relational correlation:
    # Group entities by evidence_file_id
    by_file: Dict[Optional[int], List[Entity]] = defaultdict(list)
    for ent in entities:
        by_file[ent.evidence_file_id].append(ent)

    for file_id, file_entities in by_file.items():
        # Look for co-occurring IMEI and Phone / IMSI
        imeis = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "imei"]
        phones = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) in ["phone", "imsi"]]
        for imei_ent in imeis:
            for phone_ent in phones:
                ev_ids = list(set((imei_ent.source_evidence_ids or []) + (phone_ent.source_evidence_ids or [])))
                add_link(imei_ent, phone_ent, "shared_imei", 0.6, ev_ids)

        # Look for co-occurring Account and UPI
        accounts = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "account"]
        upis = [e for e in file_entities if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "upi_handle"]
        for acc_ent in accounts:
            for upi_ent in upis:
                ev_ids = list(set((acc_ent.source_evidence_ids or []) + (upi_ent.source_evidence_ids or [])))
                add_link(acc_ent, upi_ent, "shared_upi_handle", 0.95, ev_ids)

    # Look for IP /24 subnet correlation among all IP entities in the case
    ip_entities = [
        e for e in entities
        if (e.entity_type.value if hasattr(e.entity_type, "value") else str(e.entity_type)) == "ip_address"
    ]
    for i in range(len(ip_entities)):
        for j in range(i + 1, len(ip_entities)):
            if is_same_subnet_24(ip_entities[i].value, ip_entities[j].value):
                ev_ids = list(set((ip_entities[i].source_evidence_ids or []) + (ip_entities[j].source_evidence_ids or [])))
                add_link(ip_entities[i], ip_entities[j], "shared_ip_subnet", 0.4, ev_ids)

    # 3. Cross-case correlation:
    # Match any entity in the current case against entities from other cases
    other_entities: List[Entity] = (
        db.query(Entity)
        .filter(Entity.case_id != case_id)
        .all()
    )
    if other_entities:
        # Cache other cases for quick lookup
        other_cases: Dict[int, Case] = {
            c.id: c
            for c in db.query(Case).filter(Case.id != case_id).all()
        }

        # Index other entities by (entity_type, value)
        other_by_type_val: Dict[Tuple[str, str], List[Entity]] = defaultdict(list)
        for oe in other_entities:
            oe_type = oe.entity_type.value if hasattr(oe.entity_type, "value") else str(oe.entity_type)
            other_by_type_val[(oe_type, oe.value)].append(oe)

        for ent in entities:
            ent_type = ent.entity_type.value if hasattr(ent.entity_type, "value") else str(ent.entity_type)
            matches = other_by_type_val.get((ent_type, ent.value), [])
            for match in matches:
                other_case = other_cases.get(match.case_id)
                other_case_num = other_case.case_number if other_case else f"#{match.case_id}"
                conf, basis = get_confidence_and_basis(ent_type, is_multi_source=True)
                ev_ids = list(set((ent.source_evidence_ids or []) + (match.source_evidence_ids or [])))
                extra_payload = {
                    "cross_case": True,
                    "matched_case_id": match.case_id,
                    "matched_case_number": other_case_num,
                }
                add_link(ent, match, basis, conf, ev_ids, extra=extra_payload)

    if new_links:
        db.add_all(new_links)
        db.commit()

    # Automatically score the case and update risk metrics & why_flagged
    from app.services.risk.scoring import score_case
    score_case(case_id, db)

    all_case_links = db.query(EntityLink).filter(EntityLink.case_id == case_id).all()
    return all_case_links
