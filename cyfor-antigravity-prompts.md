# CyFOR — Antigravity Build Prompts (Phase 0 → Final)

**How to use this doc:** paste each phase's prompt into Antigravity **in order**, one at a time, and let it finish (files created, code written) before moving to the next. Each phase tells the agent exactly which files/folders to create and references what earlier phases already built, so the project stays consistent end-to-end. Don't skip ahead — later phases assume earlier folder paths and schemas already exist.

**Stack locked in across every phase** (so the agent doesn't improvise inconsistently):
- Backend: Python, FastAPI, SQLAlchemy, SQLite (swappable to Postgres later)
- Frontend: React + Vite + Tailwind CSS
- Auth: JWT, mock officer table
- File parsing: pandas / openpyxl (CDR, IPDR, bank/UPI sheets), Python `email` module (.eml), JSON (APK dumps)
- Graph: NetworkX on the backend, custom SVG rendering on the frontend
- PDF: WeasyPrint
- Design tokens: the approved light/official-portal look (Inter font, `#0F4C81` accent blue, white/`#F7F8FA` surfaces)

---

## Phase 0 — Project scaffolding

```
Create a monorepo project called "cyfor" with this exact structure. Create every folder and an empty or placeholder file where noted. Do not add extra framework boilerplate beyond what's listed.

cyfor/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   ├── schemas/
│   │   │   └── __init__.py
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── __init__.py
│   │   ├── services/
│   │   │   ├── ingestion/
│   │   │   │   └── __init__.py
│   │   │   ├── correlation/
│   │   │   │   └── __init__.py
│   │   │   ├── risk/
│   │   │   │   ├── __init__.py
│   │   │   │   └── profiles/
│   │   │   ├── geo/
│   │   │   │   ├── __init__.py
│   │   │   │   └── lookups/
│   │   │   ├── ai/
│   │   │   │   └── __init__.py
│   │   │   └── reports/
│   │   │       └── __init__.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── hashing.py
│   │       └── file_storage.py
│   ├── data/
│   │   ├── sample/
│   │   └── threat_intel/
│   ├── uploads/
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── styles/
│   │   │   └── tokens.css
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   └── routes/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── README.md
└── .gitignore

In requirements.txt, list: fastapi, uvicorn[standard], sqlalchemy, python-jose[cryptography], passlib[bcrypt], python-multipart, pandas, openpyxl, networkx, weasyprint, python-dotenv, pydantic.

In backend/.env.example, add: DATABASE_URL=sqlite:///./cyfor.db, JWT_SECRET=changeme, JWT_EXPIRE_MINUTES=480, AI_SUMMARY_API_KEY=your_key_here.

In frontend/.env.example, add: VITE_API_BASE_URL=http://localhost:8000/api.

In .gitignore, exclude: __pycache__/, *.db, .env, node_modules/, dist/, backend/uploads/*.

In README.md, write a short project description: "CyFOR — Cyber Fraud Operations Room. A unified evidence ingestion, entity correlation, and investigative reporting console for cyber-fraud investigating officers." Include setup instructions for running backend (`uvicorn app.main:app --reload`) and frontend (`npm install && npm run dev`) separately.

Do not write any business logic yet — this phase is scaffolding only.
```

---

## Phase 1 — Database models, schemas & auth

```
In the cyfor/backend project, implement the database layer and authentication.

In app/db/database.py: set up a SQLAlchemy engine and session using DATABASE_URL from app/core/config.py (load config from .env using python-dotenv and pydantic BaseSettings).

In app/db/models.py, create these SQLAlchemy models:

1. Officer: id (pk), badge_id (unique string), name, password_hash, station_name, created_at.
2. Case: id (pk), case_number (unique, auto-generated like "#4471"), victim_name, scam_type (enum: "digital_scam", "phishing_vishing", "malicious_apk"), status (enum: "open", "correlating", "under_review", "closed"), risk_level (enum: "low", "medium", "high", nullable until scored), risk_score (float, nullable), registered_by (fk -> Officer.id), registered_at, district (string, nullable, resolved later by the geo service).
3. EvidenceFile: id (pk), case_id (fk -> Case.id), original_filename, evidence_category (enum: "telecom", "bank_upi", "other"), file_path (string), sha256_hash (string), row_count (int, nullable), upload_status (enum: "queued", "processing", "processed", "failed"), uploaded_at.
4. Entity: id (pk), case_id (fk -> Case.id), entity_type (enum: "phone", "account", "upi_handle", "imei", "imsi", "ip_address", "email"), value (string), risk_level (enum: "low", "medium", "high"), anomaly_reason (string, nullable).
5. EntityLink: id (pk), case_id (fk -> Case.id), entity_a_id (fk -> Entity.id), entity_b_id (fk -> Entity.id), basis (string, e.g. "shared_imei", "shared_upi", "shared_ip_subnet"), confidence (float 0-1), source_evidence_ids (JSON list of EvidenceFile ids the link was derived from).
6. CaseSummary: id (pk), case_id (fk -> Case.id), narrative_text (text), generated_at.

Create matching Pydantic schemas in app/schemas/ (one file per model: officer.py, case.py, evidence.py, entity.py, report.py) with Create/Read variants.

In app/core/security.py: implement password hashing (passlib bcrypt), JWT creation and verification (python-jose) using JWT_SECRET and JWT_EXPIRE_MINUTES from config.

In app/api/routes/auth.py: implement POST /api/auth/login (accepts badge_id + password, returns a JWT + officer profile) and GET /api/auth/me (returns the current officer from a valid token). Add a FastAPI dependency get_current_officer that other routes will reuse.

In app/main.py: wire up the FastAPI app, create all tables on startup (Base.metadata.create_all), include the auth router under /api/auth, and enable CORS for http://localhost:5173 (the Vite dev server).

Also write a small seed script backend/app/db/seed.py that inserts one officer: badge_id "MP-IO-4471", name "A. Sharma", station_name "Bhopal Cyber Cell", password "demo1234" (hashed). Run it automatically on startup if the officers table is empty.
```

---

## Phase 2 — Evidence upload & ingestion/normalization engine

```
In the cyfor/backend project, implement case creation, evidence upload, and the normalization layer.

In app/api/routes/cases.py:
- POST /api/cases — creates a new Case (victim_name, scam_type, registered_by = current officer). Auto-generate case_number as "#" + a zero-padded incrementing number starting at 4471. Requires auth.
- GET /api/cases — returns all cases, sorted by risk_score descending (nulls last), for the priority queue. Include a computed "why_flagged" short string built from the case's highest-confidence EntityLink basis, if any exist yet, else null.
- GET /api/cases/{case_id} — full case detail.
- GET /api/cases/summary-stats — returns counts for the home page: critical_cases (risk_level="high"), active_cases (status != "closed"), awaiting_correlation (cases with evidence uploaded but zero EntityLinks), closed_this_month.

In app/api/routes/evidence.py:
- POST /api/cases/{case_id}/evidence — accepts a file upload + evidence_category ("telecom", "bank_upi", "other"). On upload: compute SHA-256 (use app/utils/hashing.py), save the raw file under backend/uploads/{case_id}/, create an EvidenceFile row with upload_status="queued", then immediately call the normalization service (below) and update status to "processed" or "failed".
- GET /api/cases/{case_id}/evidence — list evidence files for a case, including hash and row_count, for the upload table UI.

In app/services/ingestion/, build the normalization layer:
- normalizer.py — defines a common in-memory schema every parser outputs into: a list of dicts, each with keys: entity_type, value, timestamp (nullable), extra (dict of raw fields kept for traceability). This is the shared schema all evidence types map into, regardless of scam type — the same engine handles Digital Scam, Phishing/Vishing, and Malicious APK cases; only the risk-weight profile (built in a later phase) changes.
- telecom_parser.py — parses CDR/IPDR CSV/XLSX (using pandas). Expect flexible column names (try to match common variants like "caller_number"/"phone"/"msisdn", "imei", "imsi", "tower_id"/"cell_id", "ip_address", "timestamp"/"call_time"). Emit normalized rows for each phone/IMEI/IMSI/IP found.
- bank_parser.py — parses bank/UPI settlement CSV/XLSX. Expect flexible columns for account_number, ifsc_code, upi_handle, amount, transaction_time. Emit normalized rows for each account/UPI handle found, storing amount and ifsc in `extra`.
- email_parser.py — parses .eml files using Python's built-in email module. Extract sender, sender IP from Received headers if present, and any URLs found in the body. Emit normalized rows for email addresses, IPs, and URLs.
- apk_parser.py — parses a JSON Android-dump file with fields like package_name, permissions (list), c2_server (string, nullable), imei, contacted_ips (list). Emit normalized rows for the IMEI, C2 server IP, and flag high-risk permissions (SMS, ACCESSIBILITY, CALL_LOG) into `extra`.
- router.py — a dispatch function normalize_file(file_path, evidence_category) that picks the right parser by file extension and evidence_category, and always returns the same normalized row format. After parsing, persist the normalized rows as new Entity rows on the case (deduping by entity_type+value within the case), and update EvidenceFile.row_count with the row count parsed.

Add 4 small realistic sample files under backend/data/sample/ for local testing: mock_cdr.csv, mock_bank_upi.xlsx (write it as csv named .xlsx is fine to fake for now, note this in a comment), mock_email.eml, mock_apk_dump.json — each with enough fake rows to exercise the parsers (10-20 rows), including at least one deliberately overlapping IMEI and UPI handle across two of the files so later correlation phases have something real to find.
```

---

## Phase 3 — Entity correlation engine

```
In the cyfor/backend project, implement the entity correlation engine described below. This is the technical core of the project — it must work identically regardless of scam_type; scam_type never branches this logic.

In app/services/correlation/entity_correlation.py:
- Implement correlate_case(case_id): load every Entity row for the case, group by (entity_type, value), and for any group with more than one EvidenceFile source, or that matches an Entity from ANY OTHER case with the same entity_type+value, create an EntityLink row.
- Confidence rules (store as EntityLink.confidence, 0-1):
  - Same UPI handle or same account number shared across entities: 0.95
  - Same IMEI shared across different IMSIs/phone numbers: 0.6 (device reused across SIMs — worth flagging, not certain proof)
  - Same IP address (exact): 0.7
  - Same IP /24 subnet only (not exact match): 0.4
  - Same phone number appearing in two different evidence files: 0.9
- basis field should be a short machine string like "shared_upi_handle", "shared_imei", "shared_ip_subnet" etc. — the frontend will map these to readable labels.
- Always populate source_evidence_ids so every link can be traced back to the exact EvidenceFile rows it came from (needed for court-usable "why is this linked" inspection).
- Also implement cross-case correlation: if an entity value matches one in a DIFFERENT case, still create the link (case_id stays the current case, but note the other case's number in a new EntityLink.extra JSON field), since spotting the same UPI handle or IMEI reused across separate victim complaints is one of the most valuable signals.

In app/services/correlation/graph_builder.py:
- Implement build_case_graph(case_id): return a JSON structure { nodes: [...], edges: [...] } from the case's Entity and EntityLink rows, ready for the frontend graph renderer. Each node: id, label, entity_type, risk_level. Each edge: source, target, basis, confidence.

In app/api/routes/correlation.py:
- POST /api/cases/{case_id}/correlate — runs correlate_case(case_id), then returns updated counts (records_by_category: telecom/bank_upi/other/total, from EvidenceFile rows) plus the graph JSON. This is the endpoint the "Find connections & view graph" button calls.
- GET /api/cases/{case_id}/graph — returns the graph JSON again without re-running correlation (for reloading the page).
- GET /api/cases/{case_id}/entities/top-risk — returns the top 5 entities by risk_level (high first) for the sidebar panel.

Wire this router into app/main.py under /api.
```

---

## Phase 4 — Risk scoring engine (per scam-type weight profiles)

```
In the cyfor/backend project, implement risk scoring as a configuration-driven layer on top of the correlation engine — NOT a separate engine per scam type.

Create three JSON weight-profile files under app/services/risk/profiles/:
- digital_scam.json — weights: {"multi_hop_speed": 0.35, "shared_upi_handle": 0.3, "shared_account": 0.2, "shared_ip": 0.15}
- phishing_vishing.json — weights: {"spoofed_caller_pattern": 0.3, "high_call_velocity": 0.25, "shared_ip": 0.2, "shared_imei": 0.25}
- malicious_apk.json — weights: {"high_risk_permissions": 0.35, "known_c2_server": 0.3, "shared_imei": 0.2, "shared_ip": 0.15}

In app/services/risk/scoring.py:
- Implement score_case(case_id): load the case's scam_type, load the matching profile JSON, then compute a 0-100 risk_score from signals available in that case's EntityLink and Entity rows (e.g. count and confidence of shared_upi_handle links, whether any high-risk APK permission was flagged in Entity.extra, time-delta between linked transactions for "multi_hop_speed" if timestamps are close together, etc). Map score to risk_level: 0-39 low, 40-69 medium, 70-100 high. Also set individual Entity.risk_level values the same way, driven by which links they participate in.
- Write this as a single function that takes the profile as a parameter — do not fork the function per scam type. The profile is the only thing that changes behavior.

Call score_case(case_id) automatically at the end of correlate_case() from Phase 3 (import and invoke it there), and store the resulting risk_score/risk_level on the Case row.

Add a "why_flagged" generator: a short human-readable string built from the single highest-weighted signal found (e.g. "Multi-hop routing, N mule accounts in Xh"), stored back for the priority-queue endpoint from Phase 2 to use.
```

---

## Phase 5 — Geo resolution & district heatmap

```
In the cyfor/backend project, implement district-level geo resolution for the fraud density heatmap — using only static, locally bundled lookup data, no external API calls (this must work fully offline).

Create two small sample CSV lookup files under app/services/geo/lookups/:
- ifsc_district.csv — columns: ifsc_prefix, bank_name, district. Add ~15 sample rows covering a few real Indian bank IFSC prefixes (e.g. HDFC0, SBIN0, ICIC0) mapped to sample districts (Bhopal, Indore, Delhi NCR, Lucknow, Jaipur, etc). Add a comment at the top of the file noting this should be replaced with the full RBI IFSC database for production use.
- pin_district.csv — columns: pin_code_prefix (first 3 digits), district. Add ~15 sample rows. Note this should be replaced with the full India Post PIN-to-district mapping for production use.

In app/services/geo/heatmap.py:
- Implement resolve_district(case_id): look at the case's Entity rows for any account (via extra.ifsc) or use a stored victim PIN code if present, resolve to a district using the CSVs above (prefix match), and store it on Case.district. If no match, leave null.
- Implement get_district_heatmap(): group all Cases by district, count cases per district, bucket each into low/medium/high (e.g. <15 low, 15-40 medium, >40 high — tune thresholds to whatever produces a reasonable spread from the sample data), and return a list of {district, case_count, level}.

In app/api/routes/geo.py:
- GET /api/geo/heatmap — returns get_district_heatmap() output, used directly by the frontend's district-tile grid (the same tile-grid visual style already approved in the UI prototype — no map tiles or GeoJSON needed).

Call resolve_district(case_id) automatically whenever a new evidence file finishes processing in Phase 2's evidence upload route.

Wire the geo router into app/main.py under /api.
```

---

## Phase 6 — AI case summary generation

```
In the cyfor/backend project, implement the AI case-summary narrative feature.

In app/services/ai/case_summary.py:
- Implement generate_case_summary(case_id): build a structured prompt from the case's graph (nodes/edges from Phase 3), the case's scam_type, victim_name, and top risk entities — describing the actual linked entities and confidence levels in plain factual terms (e.g. "Entity X (upi_handle) linked to Entity Y (account) with confidence 0.95 via shared_upi_handle").
- Send this prompt to an LLM completion API using the AI_SUMMARY_API_KEY environment variable (structure the HTTP call generically — a POST to a configurable endpoint with the prompt as a user message, so any provider's chat-completion-style API can be dropped in). Ask explicitly for a 2-3 short paragraph plain-language narrative: what happened, which entities matter most and why, and what the officer should prioritise next (e.g. which account/handle to request a freeze on).
- If no API key is set, fall back to a deterministic template-based summary built from the same structured data (so the feature still demos offline without a key) — do not fail the request.
- Store the result in the CaseSummary table (Phase 1 model) with generated_at.

In app/api/routes/graph.py (or extend correlation.py from Phase 3):
- GET /api/cases/{case_id}/summary — returns the latest CaseSummary if one exists, else calls generate_case_summary(case_id) and returns the fresh one.
- POST /api/cases/{case_id}/summary/regenerate — force-regenerates it.

Make sure this only ever reads data already produced by the correlation and risk-scoring phases — it should not re-derive entity relationships itself, only narrate what's already been computed.
```

---

## Phase 7 — Report generation (investigative brief + takedown request)

```
In the cyfor/backend project, implement the two report-generation features.

Add two small sample CSV threat-intel files under backend/data/threat_intel/: known_bad_urls.csv (columns: url, source, date_added) and known_apk_hashes.csv (columns: sha256, malware_family, date_added). Add ~10 sample rows each. Note in a comment these should be swapped for real feeds (e.g. CERT-In advisories) in production.

In app/services/reports/pdf_generator.py:
- Implement generate_investigative_brief(case_id): gather case details, top risk entities, the graph summary, the AI case summary text (from Phase 6), and recommended freeze/seizure targets (the highest-confidence account/UPI-handle nodes). Render a clean one-page PDF using WeasyPrint (build an HTML template inline or under a templates/ subfolder, styled simply — case number, victim, risk level, entity table, narrative, recommended actions). Embed a SHA-256 hash of the generated PDF's content in a footer line, and also return that hash alongside the file for the API to show the officer.
- Implement generate_takedown_request(case_id): scan the case's Entity rows (URLs from email parsing, APK hashes from Phase 2's apk_parser) against the two threat-intel CSVs above. For each match, render a second simple PDF: matched indicator, matched source, a pre-filled "reported by / jurisdiction / case reference" block, and an explicit note "Matched against locally bundled indicator list — no live web request made." If there are zero matches, still generate the PDF but state clearly that no known indicators were matched in this case's evidence.

In app/api/routes/reports.py:
- POST /api/cases/{case_id}/reports/investigative-brief — generates and returns the PDF as a file download, saving a copy under backend/uploads/{case_id}/reports/.
- POST /api/cases/{case_id}/reports/takedown-request — same pattern for the takedown PDF.

Wire the reports router into app/main.py under /api.

At this point the entire backend should be feature-complete: auth, case creation, evidence upload + normalization, entity correlation, risk scoring, geo heatmap, AI summary, and both report types. Do a final pass and confirm every route from Phases 1-7 is registered in app/main.py under /api, and that FastAPI's auto-generated /docs page lists all of them.
```

---

## Phase 8 — Frontend setup & design system

```
In the cyfor/frontend project (React + Vite + Tailwind, already scaffolded), set up the design system and app shell first, matching this exact approved visual style — do not deviate from these tokens.

In src/styles/tokens.css, define CSS custom properties:
--bg:#FFFFFF; --bg-subtle:#F7F8FA; --bg-muted:#F1F3F5;
--border:#E4E7EB; --border-strong:#D3D8DE;
--text:#1F2733; --text-dim:#66707D; --text-faint:#98A1AB;
--accent:#0F4C81; --accent-hover:#0C3D68; --accent-soft:#E9F1F8; --accent-border:#BFD7EA;
--risk-high:#B42318; --risk-high-bg:#FDEDEC;
--risk-med:#AE5B0C; --risk-med-bg:#FDF3E7;
--risk-low:#166A3C; --risk-low-bg:#EAF7EF;
--urgent-bg:#FFF8E8; --urgent-border:#F0DBA0; --urgent-text:#7A5B0A;

Load the "Inter" font (via Google Fonts link in index.html) for all UI text and "IBM Plex Mono" for case IDs, hashes, IMEI/IMSI/UPI values specifically (anywhere a technical identifier is shown). Configure tailwind.config.js to expose these as theme colors (bg, bgSubtle, border, accent, riskHigh, riskMed, riskLow, etc.) so components can use Tailwind classes like `bg-accent` and `text-riskHigh` instead of inline styles.

Overall visual direction: clean, minimal, official-portal / calm-dashboard style (like Gmail or Notion) — white backgrounds, thin hairline dividers instead of boxed cards everywhere, one accent color used sparingly, generous whitespace, no shadows/gradients/dark theme. Sections are separated by a small header + thin border-bottom, not nested bordered panels.

Build the persistent app shell:
- src/components/Sidebar.jsx — 200px light-gray sidebar (bg-bgSubtle) with the CyFOR logo mark, and 3 nav items: Home, Connections & Graph, Reports. Active item: accent-soft background, left accent border, accent text color, bold.
- src/components/Topbar.jsx — 56px white topbar with a breadcrumb-style page title on the left, and on the right: a rounded search box, a notification icon button, and a profile avatar that toggles a dropdown menu (My profile / Preferences / Sign out).
- src/routes/AppRouter.jsx — use react-router-dom with routes: /login, / (Home), /cases/:caseId/graph, /cases/:caseId/reports. Wrap the authenticated routes in the Sidebar+Topbar shell layout; /login renders standalone, centered, on a --bg-subtle background.
- src/api/client.js — an axios (or fetch) wrapper reading VITE_API_BASE_URL from env, attaching the JWT from localStorage as a Bearer token automatically, and redirecting to /login on a 401 response.

Build src/pages/Login.jsx: a centered white card (max-width ~380px) with the shield-style logo mark, "CyFOR / Cyber Fraud Operations Room" title, Officer ID + Password fields, a solid accent "Secure login" button that calls POST /api/auth/login and stores the returned JWT, "Forgot password? / Contact administrator" links below, and a small "Authenticity & session integrity verified" note at the bottom with a lock icon. On success, redirect to /.

Do not build the Home/Graph/Reports page content yet — just the shell, routing, login, and design tokens in this phase.
```

---

## Phase 9 — Frontend: Home page, priority queue, new investigation flow, heatmap

```
In the cyfor/frontend project, build the Home page (src/pages/Home.jsx) and its components, wired to the real backend endpoints from earlier phases.

Layout, top to bottom, plain sectioned list (not boxed cards), each section separated by a header + thin bottom border:

1. Welcome row: "Welcome back, Officer {name}" + station/date subtext (from GET /api/auth/me), with a single solid accent "+ New investigation" button top-right that opens the modal below.
2. Urgent banner (src/components/UrgentBanner.jsx): only render if any case has risk_level "high" and a freeze-relevant flag — pale amber background (--urgent-bg), warning icon, text like "Case #{case_number} — {why_flagged}", with an "Open case" button linking to that case's graph page. If no urgent case exists, don't render this section at all — don't show an empty or fake banner.
3. Stat row (src/components/StatRow.jsx): 4 plain numbers with dividers between them, from GET /api/cases/summary-stats — Critical priority cases, Active case load, Awaiting correlation, Closed this month.
4. Priority cases table (src/components/PriorityTable.jsx): from GET /api/cases, columns Case ID (mono font) / Risk (colored dot + label from src/components/RiskTag.jsx) / Why flagged / Scam type / Open link. Clicking a row navigates to /cases/{id}/graph.
5. New/unprocessed evidence list (src/components/EvidenceTray.jsx): list evidence files across cases where upload_status is "queued" or "processing" — small dot, filename, "Case #{n} · {category} · uploaded {time}", a "Queued"/"Processing" pill on the right.
6. Fraud density heatmap (src/components/HeatmapGrid.jsx): from GET /api/geo/heatmap — a 6-column grid of pastel tiles (green/amber/red tint per level, using --risk-*-bg tokens), each showing district name + case count. Include the legend and the "runs fully offline, from locally bundled lookups" note text beneath it exactly as previously approved.
7. Quick actions row: small ghost buttons — New investigation, Search case, View network graph, Generate brief.

Build src/components/NewInvestigationModal.jsx:
- Victim's name + Date of case registration fields.
- Scam type selector: 3 cards (Digital scam / Phishing-Vishing / Malicious APK), single-select, matching the approved selected-state style (accent border + accent-soft background).
- Three upload zones (Telecom / Bank-UPI / Other), each a dashed-border drop zone calling POST /api/cases/{id}/evidence with the right evidence_category once a case has been created (create the Case first via POST /api/cases as soon as victim name + scam type are filled, before allowing uploads).
- An upload table beneath showing filename / type / row_count / sha256_hash (truncated) / status, populated live as each POST /api/cases/{id}/evidence call returns.
- "Find connections & view graph" button: calls POST /api/cases/{id}/correlate, then navigates to /cases/{id}/graph and closes the modal.

Wire everything to real API calls — no more hardcoded sample data in the frontend from this phase onward.
```

---

## Phase 10 — Frontend: Connections & graph page

```
In the cyfor/frontend project, build src/pages/ConnectionsGraph.jsx for route /cases/:caseId/graph.

1. Page head: "Case #{case_number} — connections & network graph", subtext "Victim: {name} · {scam_type} · registered {date}", a "← Back to home" ghost button.
2. Connection summary row: plain numbers with dividers — Telecom records / Bank-UPI records / Other records / Total records correlated — from the correlate/graph response's records_by_category (Phase 3).
3. Two-column layout: graph panel (flex, wider) + a 270px side column.

Graph panel (src/components/NetworkGraph.jsx):
- Toolbar: filter chips for All entities / Phone / Account / UPI handle / IMEI / IMSI / IP address (clicking one dims all SVG nodes/edges not matching that entity_type, exactly as previously prototyped), a spacer, then zoom-in/zoom-out icon buttons and a fullscreen toggle icon button.
- Render nodes/edges from GET /api/cases/{caseId}/graph as SVG circles + lines, colored by risk_level (use --risk-high/med/low). Edge line style: solid + thicker for confidence > 0.75, dashed + thinner for confidence <= 0.65, medium otherwise.
- On hovering a node: show a tooltip with entity type + value + how many cases it's linked across. On hovering an edge: show source entity → target entity, the `basis` field in readable form (e.g. "shared_imei" → "Shared IMEI"), the confidence percentage, and a small horizontal confidence bar. This is what makes the graph court-usable — every link must be inspectable back to its basis and confidence, not just visually drawn.
- Fullscreen toggle expands the graph canvas to fill the viewport; zoom buttons scale the SVG.

Side column:
- Top risk entities panel: from GET /api/cases/{caseId}/entities/top-risk, list of entity id (mono) + type + RiskTag.
- AI case summary panel: from GET /api/cases/{caseId}/summary — render the narrative_text as 2-3 paragraphs, calm gray body text. Add a small "Regenerate" text link that calls POST /api/cases/{caseId}/summary/regenerate and re-renders.

Keep the exact visual language from Phase 8-9: white background, thin dividers, accent blue, no heavy card shadows.
```

---

## Phase 11 — Frontend: Reports page

```
In the cyfor/frontend project, build src/pages/Reports.jsx for route /cases/:caseId/reports.

Page head: "Generate reports — case #{case_number}", subtext "Exports are hash-stamped at generation time for evidentiary integrity".

Two-column grid, two report cards (src/components/ReportCard.jsx):

1. Investigative brief card: icon, title, description, a bullet list (Case summary & risk-scored entity list / Network graph snapshot / Recommended freeze-seizure targets), a solid accent "Generate investigative brief" button that calls POST /api/cases/{caseId}/reports/investigative-brief, triggers a browser download of the returned PDF, and shows the returned SHA-256 hash in a small mono-font line at the bottom of the card once generated.

2. Takedown request card: same pattern, calling POST /api/cases/{caseId}/reports/takedown-request, bullet list showing the actual match counts returned by the API (not hardcoded numbers), and the "Matched against locally bundled indicator list — no live web call" note.

Add a top nav link/button to this page from both the Sidebar (already built in Phase 8) and from the graph page's back button area if not already present.
```

---

## Phase 12 — Final integration pass, seed data, and demo readiness

```
Now do a full integration pass across cyfor/backend and cyfor/frontend.

1. Confirm every frontend API call in Phases 9-11 matches an actual backend route from Phases 1-7 (method, path, request body, response shape) — fix any mismatches you find rather than leaving TODOs.
2. Add a backend script app/db/seed_demo.py that: creates 4 demo cases (one per risk level spread, using the 3 scam types) using the sample files from backend/data/sample/ (Phase 2) and backend/data/threat_intel/ (Phase 7), uploads them through the same ingestion pipeline the API uses (not a shortcut), runs correlation and risk scoring on each, and resolves districts — so the app has realistic data the moment both servers start, without needing a human to click through the New Investigation flow first. Run this seed automatically on backend startup only if the cases table is empty.
3. Add basic error handling across the frontend: failed API calls show a small inline error state instead of a blank page or unhandled exception, especially on the evidence upload table and the graph page.
4. Add a root-level README section titled "Running the demo" with exact steps: start backend (`cd backend && uvicorn app.main:app --reload`), start frontend (`cd frontend && npm run dev`), open the app, log in with badge ID MP-IO-4471 / password demo1234, and a one-paragraph walkthrough of the demo flow (Home → New Investigation → upload the 4 sample files → Find connections & view graph → Reports) for anyone presenting this live.
5. Do a final check that no page ever crashes on an empty state — a fresh case with zero entities should still render the graph page (empty graph + a "no correlations found yet" message) rather than erroring.

This completes the CyFOR build end-to-end: authentication, evidence ingestion and normalization, entity correlation, scam-type-aware risk scoring, the district heatmap, AI case narration, both report types, and the full frontend across login, home, new investigation, connections & graph, and reports — matching the approved UI design throughout.
```
