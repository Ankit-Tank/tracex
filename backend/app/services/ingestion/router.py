from pathlib import Path
from typing import List, Dict, Any, Tuple, Union
from sqlalchemy.orm import Session

from app.db.models import EvidenceFile, Entity, UploadStatus, RiskLevel
from app.services.ingestion.telecom_parser import parse_telecom
from app.services.ingestion.bank_parser import parse_bank_upi
from app.services.ingestion.email_parser import parse_email
from app.services.ingestion.apk_parser import parse_apk_dump


def normalize_file(file_path: Union[str, Path], evidence_category: str) -> Tuple[List[Dict[str, Any]], int]:
    """Pick the right parser based on file extension and evidence_category.
    Always returns a tuple of (normalized_rows, row_count).
    """
    path = Path(file_path)
    suffix = path.suffix.lower()
    cat = (evidence_category or "").strip().lower()

    if suffix == ".eml":
        return parse_email(path)
    elif suffix == ".json":
        return parse_apk_dump(path)
    elif cat == "telecom":
        return parse_telecom(path)
    elif cat == "bank_upi":
        return parse_bank_upi(path)
    elif suffix in [".csv", ".xlsx", ".xls"]:
        # Try bank parsing first if columns match, else telecom
        try:
            rows, count = parse_bank_upi(path)
            if rows:
                return rows, count
        except Exception:
            pass
        return parse_telecom(path)
    else:
        # Default fallback
        return parse_telecom(path)


def process_evidence_file(db: Session, evidence_file: EvidenceFile) -> int:
    """Normalize evidence file, persist unique Entity rows, and update EvidenceFile status."""
    try:
        evidence_file.upload_status = UploadStatus.processing
        db.commit()

        category_str = (
            evidence_file.evidence_category.value
            if hasattr(evidence_file.evidence_category, "value")
            else str(evidence_file.evidence_category)
        )
        normalized_rows, row_count = normalize_file(evidence_file.file_path, category_str)

        # Retrieve existing entities for this evidence file to deduplicate within the file
        existing_records = (
            db.query(Entity.entity_type, Entity.value)
            .filter(
                Entity.case_id == evidence_file.case_id,
                Entity.evidence_file_id == evidence_file.id,
            )
            .all()
        )
        existing_file_keys = {
            (
                e[0].value if hasattr(e[0], "value") else str(e[0]),
                str(e[1]).strip(),
            )
            for e in existing_records
        }

        new_entities = []
        for row in normalized_rows:
            ent_type = row["entity_type"]
            val = row["value"]
            if not val:
                continue

            pair = (ent_type, val)
            if pair not in existing_file_keys:
                existing_file_keys.add(pair)
                # Check anomaly reason or flags in extra
                anomaly_reason = None
                risk = RiskLevel.low
                extra = row.get("extra") or {}
                if "high_risk_permissions" in extra and extra["high_risk_permissions"]:
                    anomaly_reason = f"High-risk permissions detected: {', '.join(extra['high_risk_permissions'])}"
                    risk = RiskLevel.high
                elif extra.get("role") == "c2_server":
                    anomaly_reason = "Identified Command & Control (C2) endpoint"
                    risk = RiskLevel.high

                new_entities.append(
                    Entity(
                        case_id=evidence_file.case_id,
                        evidence_file_id=evidence_file.id,
                        entity_type=ent_type,
                        value=val,
                        risk_level=risk,
                        anomaly_reason=anomaly_reason,
                        source_evidence_ids=[evidence_file.id],
                        extra=extra,
                    )
                )

        if new_entities:
            db.add_all(new_entities)

        evidence_file.row_count = row_count
        evidence_file.upload_status = UploadStatus.processed
        db.commit()
        return len(new_entities)

    except Exception:
        db.rollback()
        evidence_file.upload_status = UploadStatus.failed
        db.commit()
        raise
