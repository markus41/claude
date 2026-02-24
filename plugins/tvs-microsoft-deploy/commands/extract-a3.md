---
name: tvs:extract-a3
description: A3 Firebase extraction - bulk extract brokers, commissions, carriers, contacts, activities to OneLake. CRITICAL PATH WEEK 1.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# A3 Firebase Extraction

CRITICAL PATH - WEEK 1 PRIORITY. Bulk extracts all data from the A3 Firebase database (brokers, commissions, carriers, contacts, activities) and loads it into the `tvs-a3-archive` OneLake lakehouse. This is the foundational data migration step for TAIA wind-down and carrier normalization.

## Usage

```
/tvs:extract-a3 [--collection brokers|commissions|carriers|contacts|activities|all] [--batch-size 500] [--since DATE]
```

## Prerequisites

```bash
# 1. Firebase service account credentials
[ -z "$FIREBASE_SERVICE_ACCOUNT" ] && { echo "FAIL: FIREBASE_SERVICE_ACCOUNT not set (path to JSON key file)"; exit 1; }
[ -f "$FIREBASE_SERVICE_ACCOUNT" ] && echo "OK: Service account file exists" \
  || { echo "FAIL: Service account file not found at $FIREBASE_SERVICE_ACCOUNT"; exit 1; }

# 2. Fabric API token
[ -z "$FABRIC_TOKEN" ] && { echo "FAIL: FABRIC_TOKEN not set"; exit 1; }

# 3. TVS workspace ID (for a3_archive lakehouse)
[ -z "$TVS_WS_ID" ] && { echo "FAIL: TVS_WS_ID not set (tvs-a3-archive workspace ID)"; exit 1; }

# 4. Verify Firebase connectivity
python3 -c "
import json
cred = json.load(open('$FIREBASE_SERVICE_ACCOUNT'))
print(f'Project: {cred.get(\"project_id\", \"UNKNOWN\")}')
" || { echo "FAIL: Cannot parse Firebase service account JSON"; exit 1; }

# 5. Verify OneLake lakehouse is accessible
curl -sf -H "Authorization: Bearer $FABRIC_TOKEN" \
  "https://api.fabric.microsoft.com/v1/workspaces/$TVS_WS_ID/lakehouses" > /dev/null \
  || { echo "FAIL: Cannot access a3-archive lakehouse"; exit 1; }

# 6. Python dependencies
python3 -c "import firebase_admin; import pandas" 2>/dev/null \
  || { echo "FAIL: pip install firebase-admin pandas required"; exit 1; }
```

## 6-Phase Protocol

### Phase 1: EXPLORE (2 agents)

**Agent 1 - Firebase Collection Scanner:**
- Initialize Firebase Admin SDK with service account credentials
- Enumerate all top-level collections: brokers, commissions, carriers, contacts, activities
- Count documents per collection (estimate extraction time)
- Sample 5 documents per collection to capture schema (field names, types, nesting)
- Identify subcollections (e.g., brokers/{id}/commission_history)
- Check for Firestore security rules that may restrict service account access

**Agent 2 - OneLake Target Validator:**
- Verify `tvs-a3-archive` workspace and lakehouse exist in Fabric
- Check existing tables in lakehouse (from prior extraction runs)
- Estimate storage requirements: document count x avg document size
- Verify lakehouse Tables directory is writable via Spark or REST API
- Check for existing delta tables that need append vs. overwrite strategy

### Phase 2: PLAN (1 agent)

**Agent 3 - Extraction Planner:**
- Build extraction manifest per collection:
  - `brokers`: ~5,000 docs, fields: name, npn, email, phone, agency, status, licenses[], appointments[]
  - `commissions`: ~50,000 docs, fields: broker_id, carrier, policy_number, amount, date, type, status
  - `carriers`: ~200 docs, fields: name, carrier_code, products[], commission_schedules[], contacts[]
  - `contacts`: ~10,000 docs, fields: name, email, phone, type, broker_ref, carrier_ref, notes
  - `activities`: ~100,000 docs, fields: type, date, broker_id, subject, description, outcome
- Design batch extraction strategy (500 docs per batch to avoid Firestore limits)
- Plan data type mapping: Firestore types to Delta Lake/Parquet types
- Design incremental extraction: use `_updated_at` field for subsequent runs
- Plan error handling: retry failed batches, log skipped documents
- Estimate total extraction time: ~2-4 hours for full extraction

### Phase 3: CODE (2 agents)

**Agent 4 - Firebase Extractor:**
- Initialize Firebase Admin SDK:
  ```python
  import firebase_admin
  from firebase_admin import credentials, firestore
  cred = credentials.Certificate(FIREBASE_SERVICE_ACCOUNT)
  firebase_admin.initialize_app(cred)
  db = firestore.client()
  ```
- Extract each collection in batches using paginated queries:
  ```python
  docs = db.collection('brokers').order_by('__name__').limit(500).stream()
  ```
- Flatten nested structures (licenses[], appointments[]) into separate tables or JSON columns
- Handle Firestore-specific types: GeoPoint, Timestamp, DocumentReference
- Write extracted data to local Parquet files: `brokers.parquet`, `commissions.parquet`, etc.
- Track extraction progress: documents extracted, bytes written, errors encountered
- Support resume from last checkpoint if extraction is interrupted

**Agent 5 - OneLake Loader:**
- Upload Parquet files to OneLake lakehouse Files directory via REST API:
  ```bash
  curl -X PUT -H "Authorization: Bearer $FABRIC_TOKEN" \
    -H "Content-Type: application/octet-stream" \
    --data-binary @brokers.parquet \
    "https://onelake.dfs.fabric.microsoft.com/$TVS_WS_ID/a3_archive.Lakehouse/Files/raw/brokers.parquet"
  ```
- Create Delta tables from Parquet files using Spark notebook or Lakehouse table load
- Build table schemas matching extraction schema:
  - `a3_brokers` - broker master records
  - `a3_commissions` - commission transaction records
  - `a3_carriers` - carrier reference data
  - `a3_contacts` - contact records
  - `a3_activities` - activity/interaction log
- Create metadata table: `a3_extraction_log` with run timestamp, doc counts, status
- Verify row counts match Firebase document counts

### Phase 4: TEST (2 agents)

**Agent 6 - Data Integrity Validator:**
- Compare document counts: Firebase collection count vs. OneLake table row count
- Spot-check 20 random records per table: query Firebase, compare to OneLake
- Verify no null primary keys (broker NPN, commission policy_number)
- Check date fields parsed correctly (Firestore Timestamp to Delta Lake timestamp)
- Validate referential integrity: all commission.broker_id values exist in brokers table
- Verify nested array fields (licenses, appointments) are properly flattened or stored as JSON

**Agent 7 - Downstream Readiness Tester:**
- Query OneLake tables via Spark SQL to confirm data is queryable
- Test that `tvs:normalize-carriers` can read from a3_carriers table
- Verify consolidated/ workspace can create shortcuts to a3_archive tables
- Run sample aggregation: total commissions by carrier, broker count by state
- Confirm extraction_log metadata is complete and accurate

### Phase 5: FIX (1 agent)

**Agent 8 - Extraction Remediator:**
- Re-extract failed batches identified in extraction log
- Fix data type conversion errors (e.g., string amounts to decimal)
- Handle documents with missing required fields (log and skip with warning)
- Fix OneLake upload failures from token expiry (refresh and retry)
- Resolve Delta table schema evolution issues (add new columns from schema drift)
- Reference `orchestration-protocol-enforcer` hook for retry policy

### Phase 6: DOCUMENT (1 agent)

**Agent 9 - Extraction Documenter:**
- Generate extraction report: collection counts, extraction duration, error summary
- Document schema mapping: Firebase field to Delta table column correspondence
- Record data quality metrics: null rates, duplicate counts, type conversion issues
- Note any Firebase collections or subcollections not extracted (with reason)
- Log deployment via `mcp__deploy-intelligence__deploy_record_build`
- Flag this extraction as prerequisite-complete for `tvs:normalize-carriers`

## Orchestration Hook

Governed by `orchestration-protocol-enforcer` hook. Minimum 6 sub-agents enforced. A3 extraction has no upstream TVS deployment dependencies but must complete before `tvs:normalize-carriers` can execute.

## A3 Firebase Schema Reference

| Collection | Est. Docs | Key Fields | Subcollections |
|-----------|-----------|------------|----------------|
| brokers | ~5,000 | npn, name, email, agency, status | commission_history, appointments |
| commissions | ~50,000 | broker_id, carrier, policy_number, amount, date | none |
| carriers | ~200 | name, carrier_code, products, commission_schedules | contacts |
| contacts | ~10,000 | name, email, type, broker_ref, carrier_ref | none |
| activities | ~100,000 | type, date, broker_id, subject, outcome | none |
