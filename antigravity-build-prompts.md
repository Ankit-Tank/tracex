# Void Hacks 8.0 — Cyber Fraud Correlator: Antigravity Build Prompts

**How to use this doc:** Paste each phase's prompt into Antigravity **in order**, one at a time. Let it finish and check the output before pasting the next one — don't paste two phases back to back, since later phases assume earlier files already exist. Each prompt is fully self-contained: Antigravity should create every folder, file, and piece of logic described, not just talk about it.

Two rules baked into almost every prompt on purpose:
1. **Officer-first UI/output.** Every screen and every generated report has to be readable in seconds by a cyber cell officer who is not a data scientist — plain words, color instead of jargon, one clear "what to do next" action. No raw JSON dumps, no unexplained scores, no dense tables as the *first* thing an officer sees.
2. **Explainability + offline-first.** Every score and every link the tool draws must be traceable to a plain-English reason, and the whole thing must run locally with no internet dependency.

---

## Phase 0 — Project Bootstrap & Folder Structure

```
Create a new project called "cyber-fraud-correlator" for a 36-hour cybersecurity hackathon (Void Hacks 8.0). This is an AI-powered forensic tool that helps police cyber cell officers automatically correlate fraud evidence (telecom records, bank/UPI logs, phishing emails, Android app dumps) and produce a court-ready investigative brief.

Set up this exact folder structure and initialize each with empty/starter files (don't skip any folder, create __init__.py where needed for Python packages):

cyber-fraud-correlator/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entrypoint
│   │   ├── config.py                   # paths, constants, risk thresholds
│   │   ├── ingestion/
│   │   │   ├── __init__.py
│   │   │   ├── telecom_parser.py
│   │   │   ├── bank_parser.py
│   │   │   ├── email_parser.py
│   │   │   ├── android_dump_parser.py
│   │   │   └── normalizer.py
│   │   ├── forensics/
│   │   │   ├── __init__.py
│   │   │   ├── hasher.py
│   │   │   └── integrity_log.py
│   │   ├── correlation/
│   │   │   ├── __init__.py
│   │   │   ├── entity_linker.py
│   │   │   └── graph_builder.py
│   │   ├── scoring/
│   │   │   ├── __init__.py
│   │   │   ├── risk_scorer.py
│   │   │   └── rules_config.py
│   │   ├── reporting/
│   │   │   ├── __init__.py
│   │   │   ├── brief_generator.py
│   │   │   └── templates/
│   │   ├── features/
│   │   │   ├── __init__.py
│   │   │   ├── narrative_generator.py
│   │   │   ├── glossary.py
│   │   │   ├── mo_matcher.py
│   │   │   ├── freeze_letter.py
│   │   │   └── mo_library.json
│   │   └── api/
│   │       ├── __init__.py
│   │       └── routes.py
│   ├── tests/
│   │   └── __init__.py
│   ├── mock_data/
│   │   ├── telecom/
│   │   ├── bank/
│   │   ├── email/
│   │   └── android/
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── architecture.md
│   └── technical-proposal.md
├── .gitignore
└── README.md

Tech stack decisions to lock in now:
- Backend: Python 3.11, FastAPI, pandas, networkx, fpdf2, hashlib, python-dotenv. No ML/deep learning — everything must be rule-based and explainable since this evidence may end up in court.
- Frontend: React + Vite, plain CSS (no heavy component library) so the whole thing stays lightweight and installs fast on an offline machine.
- Everything must run fully offline after `pip install` / `npm install` — no calls to external APIs at runtime.

Write a root README.md explaining: what the project does in 3 plain sentences, the folder structure, and how to run backend (`uvicorn app.main:app --reload` from /backend) and frontend (`npm run dev` from /frontend).

Also write backend/requirements.txt with: fastapi, uvicorn, pandas, networkx, fpdf2, python-multipart, python-dotenv, pytest.

Do not write any business logic yet — this phase is only the skeleton, config, and README/docs stubs (docs/architecture.md and docs/technical-proposal.md can just have section headings for now, we'll fill them in a later phase).
```

---

## Phase 1 — Mock Forensic Dataset Generator

```
In backend/mock_data/, we need realistic-looking but synthetic sample evidence files so we can build and demo the pipeline without real case data. Create a script backend/mock_data/generate_mock_data.py that generates:

1. mock_data/telecom/cdr_sample.csv — Call Detail Records with columns: call_id, caller_number, callee_number, imei, imsi, tower_id, timestamp, duration_sec, call_type (voice/sms).
2. mock_data/bank/upi_settlement.csv — bank/UPI settlement sheet with columns: txn_id, sender_account, sender_upi_handle, receiver_account, receiver_upi_handle, amount, timestamp, ifsc_code, bank_name.
3. mock_data/email/phishing_sample.eml — a realistic raw .eml file with headers (From, To, Received, X-Originating-IP, Message-ID) representing a phishing email, including a spoofed sender header and a real originating IP hidden in a Received header (this is a classic email-header forensic pattern — make it realistic).
4. mock_data/android/app_dump_sample.json — an Android forensic dump with fields: device_imei, installed_apps (list, include at least one obviously fake/cloned banking APK with a suspicious package name), mac_address, last_known_ip, sim_history (list of {imsi, activated_on, deactivated_on}).

Design the data so a "fraud story" is buried inside it: 
- One IMEI appears across 3 different phone numbers within a short time window (SIM-swap pattern).
- A chain of UPI handles moves money from 1 victim account through 2-3 "mule" accounts within minutes of each other (multi-hop fund routing pattern) before reaching a final cash-out account.
- The phishing email's spoofed header shares an IP subnet with one of the mule account holder's last_known_ip in the Android dump.
- Add plenty of unrelated "noise" records (normal calls, normal transactions, unrelated apps) so the correlation engine actually has to do work to find the real pattern, not just find the only data there is. Aim for roughly 150-250 telecom records, 100-150 transactions, and a handful of device dumps, with the fraud ring being a clear minority hidden in the noise.

Print a short summary at the end of the script (counts generated, and which IDs/handles/IMEIs make up the "planted" fraud ring) so we have an answer key for testing later phases.

Run the script and show me the first few rows/lines of each generated file to confirm it looks realistic.
```

---

## Phase 2 — Multi-Source Ingestion & Normalization

```
Build the ingestion layer in backend/app/ingestion/.

1. telecom_parser.py — function parse_telecom(filepath) that reads a CDR CSV/Excel file and returns a pandas DataFrame with a consistent internal schema: record_type="call", entity_a (caller), entity_b (callee), imei, imsi, timestamp, metadata (dict with tower_id, duration, call_type). Must handle both .csv and .xlsx. Force phone numbers, IMEI, and IMSI to be read as strings (not ints/floats) to avoid the classic pandas dtype bug where phone numbers lose leading digits or get read as floats.

2. bank_parser.py — function parse_bank(filepath) returning the same kind of normalized DataFrame but record_type="transaction", entity_a=sender_upi_handle/account, entity_b=receiver_upi_handle/account, timestamp, metadata (amount, ifsc_code, bank_name).

3. email_parser.py — function parse_email(filepath) that reads a raw .eml file using Python's built-in `email` module, extracts From, To, Message-ID, all Received headers, and specifically tries to extract an originating IP address by walking the Received header chain (explain in a code comment why the LAST Received header is usually closest to the true origin, and the FIRST is closest to the recipient — this matters for correlation later). Returns record_type="email", with metadata containing the extracted IP and any spoofing red flags (e.g., From domain doesn't match the IP's typical mail server pattern — simple heuristic is fine, no need for real DNS lookups since we're offline).

4. android_dump_parser.py — function parse_android_dump(filepath) that reads the JSON dump and returns one row per device with record_type="device", entity_a=device_imei, metadata containing mac_address, last_known_ip, installed_apps, and a flattened sim_history.

5. normalizer.py — function normalize_all(telecom_paths, bank_paths, email_paths, android_paths) that calls all four parsers, concatenates everything into one master DataFrame with a shared schema (record_type, entity_a, entity_b, timestamp, source_file, metadata), and returns it. Every row must also get a unique record_id (uuid4).

Write a quick backend/tests/test_ingestion.py using pytest that runs each parser against the Phase 1 mock files and asserts it returns a non-empty DataFrame with the expected columns and correct dtypes (especially confirming phone/IMEI/IMSI stayed as strings). Run the tests and show me they pass.
```

---

## Phase 3 — Chain-of-Custody Hashing (Forensic Integrity Layer)

```
Build backend/app/forensics/hasher.py and integrity_log.py. This is what makes the tool's output usable as evidence, so treat it carefully.

hasher.py:
- function hash_file(filepath) -> returns SHA-256 hex digest of the raw file bytes (not the parsed data — the original file, so any post-parsing tampering is detectable).
- function hash_record(record_dict) -> returns SHA-256 hex digest of a canonical JSON serialization of a single normalized record (sort keys, so hashing is deterministic).

integrity_log.py:
- A ChainOfCustodyLog class that, for every ingested file, stores: filename, sha256_hash, ingestion_timestamp, ingested_by (placeholder "system" for now), and a running log written to backend/app/forensics/custody_log.json (append-only — never overwrite existing entries).
- Method log_ingestion(filepath) that hashes the file and appends an entry.
- Method verify_integrity(filepath) that re-hashes a file and checks it against the stored hash, returning True/False plus a plain-English message like "Integrity confirmed — file unchanged since ingestion on 2026-09-17 14:02" or "WARNING: file has changed since ingestion, chain of custody may be broken."

Wire this into normalizer.py from Phase 2 so that every file processed through normalize_all() automatically gets logged to the chain-of-custody log before parsing.

Write a short test that ingests a mock file, verifies integrity passes, then modifies one byte of a copy of that file and confirms verify_integrity correctly flags it as broken.
```

---

## Phase 4 — Entity Correlation Engine

```
Build backend/app/correlation/entity_linker.py. This is the most important piece of logic in the whole project — it finds hidden links between fraud evidence artifacts.

Given the master normalized DataFrame from Phase 2, implement find_links(df) that detects these link types (return a list of link dicts: {entity_1, entity_2, link_type, evidence, confidence}):

1. shared_imei_multiple_numbers — same IMEI appears with 2+ different phone numbers (classic SIM-swap indicator). Confidence should scale with how many distinct numbers share the IMEI and how tight the time window is.
2. recurring_upi_beneficiary — a UPI handle or account receives funds from multiple distinct senders within a short window (fan-in / mule pattern), OR forwards funds onward within minutes of receiving them (multi-hop pattern — this is the highest-confidence mule signal, prioritize it).
3. shared_ip_subnet — two entities (e.g., an email's originating IP and a device's last_known_ip) fall in the same /24 subnet. Write a small helper to compare subnets without needing external libraries beyond Python's built-in ipaddress module.
4. shared_mac_address — same MAC address appears across records tied to different accounts/numbers (device reuse across identities).

For every link, "evidence" must be a short plain-English explanation an officer can read directly, e.g. "IMEI 356938035643809 was used with 3 different SIM numbers between 14:02 and 14:19 on 12 Sep — consistent with SIM-swap fraud" — not just raw field names.

Then build graph_builder.py: function build_graph(links) using networkx to construct a directed graph where nodes are entities (phone numbers, UPI handles, IMEIs, IPs, devices) tagged with entity_type, and edges are the links found above, each edge carrying link_type, evidence, and confidence as attributes.

Test this against the Phase 1 mock data and confirm the planted fraud ring (the SIM-swap IMEI, the multi-hop UPI chain, the shared IP subnet) is actually detected, and that normal/noise records do NOT get flagged as false links. Print the detected links in plain English so I can eyeball-verify correctness.
```

---

## Phase 5 — Risk Scoring / Triage Engine

```
Build backend/app/scoring/rules_config.py and risk_scorer.py.

rules_config.py: a config dict of weighted rules, e.g.:
- multi_hop_fund_routing (fastest fund movement + most hops): highest weight
- high_velocity_sim_switching: high weight
- shared_ip_or_mac_across_identities: medium weight
- fan_in_only (receives from many but no evidence of onward movement): lower weight, since this alone is a weaker signal and shouldn't outrank real multi-hop chains
Make weights and thresholds easy to tune in one place — no magic numbers scattered in the scoring logic.

risk_scorer.py: function score_entities(graph) that walks the graph built in Phase 4 and, for every entity node, computes a risk_score (0-100) using the weighted rules, then buckets it into a plain LOW / MEDIUM / HIGH risk_label (this label — not the raw number — is what officers see first; the number is available on demand/hover for those who want it). For every HIGH-risk entity, also generate a one-line reason string combining the top contributing factors, e.g. "HIGH RISK — received funds from 4 sources and forwarded 92% of it onward within 8 minutes."

Guard explicitly against the two failure modes that showed up when this was built before: (1) a large pool of unrelated/noise accounts causing false HIGH scores purely from coincidental fan-in — fan-in alone should never be enough to reach HIGH without a velocity or multi-hop signal alongside it; (2) fan-in weight outranking real fast multi-hop mule chains — multi-hop velocity must dominate the score.

Test against the Phase 1 mock data: confirm the planted mule chain and SIM-swap IMEI score HIGH, and confirm noise entities stay LOW/MEDIUM. Print a ranked table (entity, risk_label, score, reason) for the top 15 entities.
```

---

## Phase 6 — Investigative Brief Generator (PDF/JSON)

```
Build backend/app/reporting/brief_generator.py using fpdf2. This must produce the "one-page timeline report" the problem statement asks for — it needs to work for a screen reader (officer glancing at a phone) as much as print.

Function generate_brief(graph, risk_scores, case_id) that produces two outputs:
1. A JSON brief (reports/{case_id}_brief.json) with: case_id, generated_at, prime_suspects (top HIGH-risk entities with reason + score), linked_clusters (grouped entities connected by links, with the link types connecting them), recommended_immediate_actions (see below), and a chain_of_custody_summary section pulling from Phase 3's log.
2. A ONE-PAGE PDF (reports/{case_id}_brief.pdf) laid out like a field-usable document, not a data dump:
   - Header: case ID, generation timestamp, and a chain-of-custody hash stamp.
   - A short plain-English paragraph (2-4 sentences) summarizing what happened — victim, money flow, endpoint — written for someone who has never seen this case before.
   - A simple color-coded suspect table: Name/Handle | Risk (colored HIGH/MED/LOW badge, not a raw number) | One-line reason | Recommended action.
   - A compact list of "Immediate Seizure Recommendations" (e.g., "Freeze account XXXX1234 (IFSC: ...) — active mule node, high velocity outflow detected").
   - Footer noting the SHA-256 verification hash so anyone can independently confirm the source evidence hasn't been altered.
   Since fpdf2's default font can't render the ₹ symbol, use "Rs." for currency everywhere.

Note: reports/ recommended_immediate_actions should be generated from simple rules (e.g., any HIGH-risk account with active onward-forwarding gets a "freeze account" recommendation; any HIGH-risk IMEI with SIM-swap pattern gets a "flag IMEI for tower dump cross-check" recommendation) — this becomes the seed for the freeze-letter feature we build in Phase 8, so keep the recommendation objects structured (action_type, target_entity, justification), not just free text.

Test end to end on the Phase 1 mock data and show me the generated PDF's text content and the JSON output.
```

---

## Phase 7 — Backend API Layer (wire everything together)

```
Build backend/app/api/routes.py and wire it into backend/app/main.py as a FastAPI app. Endpoints:

- POST /api/case/{case_id}/upload — accepts multipart file uploads for telecom/bank/email/android files, saves them under backend/mock_data/uploads/{case_id}/, and returns a manifest of what was received.
- POST /api/case/{case_id}/process — runs the full pipeline in order: normalize_all (Phase 2, which auto-logs chain of custody via Phase 3) -> find_links + build_graph (Phase 4) -> score_entities (Phase 5) -> generate_brief (Phase 6). Returns a JSON summary: entity/link counts, top suspects, and links to the generated PDF/JSON reports.
- GET /api/case/{case_id}/graph — returns the graph as JSON in a shape convenient for a frontend graph library (nodes: [{id, label, entity_type, risk_label}], edges: [{source, target, link_type, evidence, confidence}]).
- GET /api/case/{case_id}/report — returns the JSON brief; also add GET /api/case/{case_id}/report/pdf that streams the PDF file for download.
- GET /api/case/{case_id}/custody-log — returns the chain-of-custody log entries for that case.

Enable CORS for http://localhost:5173 (Vite's default dev port) so the frontend can call this without issues. Add basic error handling — if process is called before upload, return a clear 400 with a message like "No evidence uploaded yet for this case."

Run the server and show me a successful curl/test cycle: upload the Phase 1 mock files as a test case, call process, then fetch graph and report, and confirm the data looks correct end to end.
```

---

## Phase 8 — Extra Unique Features (the "stand out" layer)

```
Build backend/app/features/. These are small, focused features that make the tool obviously more usable for a real police officer than a typical "data dashboard" submission — keep every one of them simple to implement and simple to explain in a 3-minute demo video.

1. narrative_generator.py — function generate_narrative(graph, risk_scores) that turns the graph + scores into a short plain-English "case story" paragraph, e.g. "Victim complaint traces to account A9284, which received Rs. 48,000 and forwarded 91% of it within 6 minutes through two intermediary accounts before reaching UPI handle 'cashout99@upi', which has no prior legitimate transaction history." This is template-based (fill-in-the-blanks from the graph data), not a generic ML model — keep it fully rule-based and deterministic so it's explainable in court.

2. glossary.py — a small dict/JSON of ~15 forensic/technical terms an officer might not know (IMEI, IMSI, CDR, IPDR, hash/SHA-256, subnet, mule account, chain of custody, etc.) each with a one-sentence plain-English definition. Add a GET /api/glossary endpoint returning this so the frontend can show hover tooltips wherever these terms appear.

3. mo_library.json + mo_matcher.py — a small offline library (5-8 entries) of known fraud "modus operandi" patterns (SIM-swap-then-drain, APK-clone-banking-trojan, phishing-then-mule-chain, call-spoofing-OTP-theft, etc.), each with a short description and a simple signature (which link_types/patterns typically appear together). Function match_mo(graph, risk_scores) compares the current case's detected pattern combination against the library and returns the best match with a confidence label, e.g. "Matches known MO: 'SIM-Swap Drain' (seen in similar prior cases) — high pattern similarity." This gives officers instant context instead of a bare graph.

4. freeze_letter.py — function generate_freeze_letter(recommendation, case_id) that takes one of the recommended_immediate_actions from Phase 6 and fills a ready-to-sign bank account freeze request letter template (case reference, account number, IFSC, justification, requesting officer signature line) as a downloadable text/PDF, so seizure isn't just "recommended" in the abstract — the officer gets a document they can act on immediately.

5. Add a bilingual_report toggle: extend generate_brief (Phase 6) to optionally also produce a Hindi version of the plain-English summary paragraph and the risk labels/recommendation headings (a small static translation dict for report headings is fine, doesn't need to be dynamic translation of everything).

Wire new endpoints: GET /api/glossary, GET /api/case/{case_id}/narrative, GET /api/case/{case_id}/mo-match, POST /api/case/{case_id}/freeze-letter/{recommendation_index}, and a lang=en|hi query param on the existing report endpoint.

Test all five against the Phase 1 mock case and show me the narrative text, the MO match result, and one generated freeze letter.
```

---

## Phase 9 — Frontend: Officer Dashboard Shell

```
Set up the React + Vite frontend in frontend/. This must look and feel like a tool built for a busy police officer, not a data-analyst BI dashboard: generous whitespace, large readable text, color used for meaning (green/amber/red for risk) rather than decoration, and never more than one primary action per screen.

Pages (frontend/src/pages/):
1. CaseUpload.jsx — a big, simple drag-and-drop zone with 4 clearly labeled slots ("Telecom Records", "Bank/UPI Records", "Email Evidence (.eml)", "Android Dump (.json)"), a case ID field, and one big "Analyze Case" button. No technical jargon on this screen at all.
2. Dashboard.jsx — after processing, shows (in this order, top to bottom): the plain-English case narrative (Phase 8) in large readable text, then a row of color-coded suspect cards (name/handle, risk badge, one-line reason), then the MO match callout if one was found, then a "Download Investigative Brief (PDF)" button front and center.
3. GraphView.jsx — the network graph (we'll wire the actual graph library in Phase 10), with a simple legend and a toggle to filter by risk level, plus click-to-expand on any node showing its plain-English evidence trail.
4. SuspectProfile.jsx — click into any suspect card to see full reasoning: every link involving that entity in plain English (using the evidence strings from Phase 4/6), the freeze-letter download button if applicable, and glossary tooltips (Phase 8) on any technical term shown.

Components (frontend/src/components/): RiskBadge (colored pill: HIGH=red, MEDIUM=amber, LOW=green, with the label as the main visible text, exact score as a subtle hover tooltip only), GlossaryTerm (wraps any technical word, shows the Phase 8 glossary definition on hover/tap), UploadSlot, Timeline (simple vertical event timeline component for the narrative), LoadingState (a friendly "Analyzing evidence..." state, since processing may take a few seconds).

Set up frontend/src/api/api.js with functions for each backend endpoint from Phase 7-8. Use React Router for the 4 pages. Keep styling in plain CSS (frontend/src/index.css or per-component CSS files) — no need for Tailwind/component libraries, this needs to stay lightweight and fast to build.

Don't wire real data yet — use placeholder/mock data matching the API's shape so we can see the UI render correctly first.
```

---

## Phase 10 — Frontend-Backend Integration

```
Replace all placeholder data in the frontend with real calls to the backend API (Phase 7-8 endpoints) via frontend/src/api/api.js. Specifically:

- CaseUpload.jsx: on submit, POST the 4 files to /api/case/{case_id}/upload, then call /api/case/{case_id}/process, show the LoadingState component while waiting, then navigate to Dashboard.jsx on success.
- Dashboard.jsx: fetch narrative, top suspects (from risk scores), MO match, and expose the PDF download button hitting /api/case/{case_id}/report/pdf.
- GraphView.jsx: fetch /api/case/{case_id}/graph and render it using a lightweight graph library (use react-force-graph or vis-network via a thin React wrapper — pick whichever integrates with the fewest dependencies). Color nodes by risk_label, and on edge hover/click show the plain-English evidence string, not just the link_type code.
- SuspectProfile.jsx: fetch the specific entity's links and, if a freeze recommendation exists for it, show a "Generate Freeze Letter" button calling the Phase 8 endpoint and downloading the result.
- Wire GlossaryTerm components to fetch /api/glossary once (cache it in a simple context or top-level state) rather than re-fetching per tooltip.

Handle loading and error states gracefully everywhere (e.g. backend not running yet, or a case that hasn't been processed) with plain-English messages, never a raw stack trace or raw JSON error shown to the user.

Run both backend and frontend together, walk through the full flow end to end using the Phase 1 mock files (upload -> process -> view dashboard -> view graph -> open a suspect profile -> download brief PDF -> download a freeze letter), and confirm every step works and every screen only shows officer-readable plain language, not raw technical output.
```

---

## Phase 11 — Offline Packaging & Low-Resource Check

```
Since the tool must run on standard police workstation hardware, fully offline:

1. Confirm no code anywhere makes an external network call at runtime (search the codebase for requests., fetch(, axios, or any URL that isn't localhost) — flag and remove/replace anything found (fonts, CDN scripts, etc. must be local/bundled, not loaded from the internet).
2. Add a single script backend/run_offline_check.py that processes the full Phase 1 mock case end-to-end with the machine's network interface effectively unused, and reports total processing time and peak memory usage (use Python's time and resource/psutil modules) so we have a concrete "runs on a standard laptop in under N seconds" claim for the judges.
3. Write a single root-level start script (start.sh or a simple README section) that starts backend (uvicorn) and frontend (npm run dev / or a built static version served simply) with one command each, so this is easy to demo on stage without fumbling through multiple terminals.
4. Update docs/architecture.md with a real architecture diagram (as a simple mermaid diagram in markdown is fine) showing: ingestion sources -> normalization -> chain-of-custody hashing -> correlation engine -> risk scoring -> report/graph outputs -> officer dashboard, plus a short paragraph on why this is explainable and forensically sound (rule-based, not black-box ML) and why it's low-resource (no GPU, no external API calls, pure Python + lightweight React).

Report back the processing time/memory numbers so I can quote them in the pitch deck and demo video.
```

---

## Phase 12 — Final Test Pass, Demo Script & Technical Proposal

```
Final polish pass before submission:

1. Run the full pytest suite across backend/tests/ and fix any failures.
2. Do one full manual walkthrough of the entire flow using the Phase 1 mock data and list any UI text, error message, or report section that still uses raw technical jargon instead of plain language — fix those.
3. Write docs/technical-proposal.md (2-3 pages) covering: architecture (reuse the Phase 11 diagram), data ingestion pipeline, graph-modeling approach, evidentiary integrity/hash verification approach, and a short "why this is usable by field officers, not just analysts" section — this maps directly to the hackathon's evaluation criteria (technical feasibility, forensic accuracy/integrity, usability for field officers, innovation/practicality), so make sure each criterion is visibly addressed somewhere in the doc.
4. Write a docs/demo-script.md — a tight, timestamped script for a 3-minute demo video: (0:00-0:20) problem in one sentence, (0:20-1:00) upload evidence + process, (1:00-2:00) walk the officer dashboard — plain-English narrative, risk badges, graph, MO match, (2:00-2:40) download the PDF brief and a freeze letter, (2:40-3:00) one sentence on offline/low-resource + explainability, closing line.
5. Double check every screen one more time against this rule: could an officer with zero data-analysis background understand what to do next within 5 seconds of looking at it? Flag any screen where the answer is no, and fix it.

Show me the final project tree and confirm everything from Phase 0 through Phase 11 is present and working together.
```

---

### Notes for you (not for Antigravity)
- If Antigravity's output drifts from a phase's spec (skips a file, invents a different tech choice), just paste a short follow-up like "please also add X exactly as specified" rather than re-pasting the whole phase prompt.
- The 6 extra features in Phase 8 (plain-English narrative, glossary tooltips, MO matcher, freeze-letter generator, traffic-light risk badges, bilingual report) are deliberately small and demoable in seconds each — good material for the "innovation" slide without needing a live big reveal.
- Keep Phase 1's "answer key" printout handy — it's the fastest way to sanity-check Phases 4-6 actually found the planted fraud pattern instead of hallucinating a different one.
