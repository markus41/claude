---
name: Firebase Bulk Extraction
description: This skill should be used when working with functions/firebase-**, a3_archive/**, or firebase-* prefixed files. It provides Firebase Admin SDK patterns for bulk data extraction from the A3 legacy system, including batch reads with pagination, data transformation to OneLake-compatible formats, incremental extraction with timestamp markers, and validation/reconciliation counts. References customer-data-migration-orchestrator plugin's Firebase adapter if available.
version: 1.0.0
---

# Firebase Bulk Extraction (A3 Legacy System)

Complete reference for extracting data from the A3 Archive Firebase/Firestore system and migrating to Microsoft Fabric OneLake.

## A3 Archive Collections

| Collection | Est. Documents | Key Fields | Sync Priority |
|-----------|---------------|------------|---------------|
| `brokers` | ~15,000 | id, name, status, tier, region, onboardedAt | P0 - Critical |
| `commissions` | ~250,000 | id, brokerId, carrierId, amount, period, status | P0 - Critical |
| `carriers` | ~500 | id, name, products, regions, status | P1 - High |
| `contacts` | ~45,000 | id, brokerId, name, email, phone, role | P1 - High |
| `activities` | ~1,200,000 | id, brokerId, type, description, timestamp | P2 - Medium |

## Authentication Setup

```typescript
import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Service account from Key Vault (kv-tvs-holdings/firebase-service-account)
const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_SA_PATH || './secrets/firebase-sa.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'a3-archive-legacy',
});

const db = admin.firestore();
```

## Batch Read with Pagination

### Core Extraction Function (500 docs per batch)

```typescript
interface ExtractionOptions {
  collection: string;
  batchSize: number;         // Default: 500
  lastTimestamp?: Date;       // For incremental extraction
  outputDir: string;          // Local staging directory
}

interface ExtractionResult {
  collection: string;
  totalDocuments: number;
  batchesProcessed: number;
  outputFiles: string[];
  errors: string[];
  durationMs: number;
}

async function extractCollection(options: ExtractionOptions): Promise<ExtractionResult> {
  const { collection, batchSize = 500, lastTimestamp, outputDir } = options;
  const startTime = Date.now();
  const result: ExtractionResult = {
    collection,
    totalDocuments: 0,
    batchesProcessed: 0,
    outputFiles: [],
    errors: [],
    durationMs: 0,
  };

  let query: admin.firestore.Query = db.collection(collection)
    .orderBy('__name__');

  // Incremental: only docs modified since last extraction
  if (lastTimestamp) {
    query = db.collection(collection)
      .where('updatedAt', '>', lastTimestamp)
      .orderBy('updatedAt');
  }

  let lastDoc: admin.firestore.DocumentSnapshot | null = null;
  let batchIndex = 0;

  while (true) {
    let batchQuery = query.limit(batchSize);
    if (lastDoc) {
      batchQuery = batchQuery.startAfter(lastDoc);
    }

    const snapshot = await batchQuery.get();

    if (snapshot.empty) {
      console.log(`Collection ${collection}: no more documents after batch ${batchIndex}`);
      break;
    }

    // Transform and write batch
    const documents = snapshot.docs.map(doc => ({
      _id: doc.id,
      _extractedAt: new Date().toISOString(),
      _source: 'a3-archive-legacy',
      ...doc.data(),
      // Normalize Firestore timestamps to ISO strings
      ...normalizeTimestamps(doc.data()),
    }));

    const outputFile = `${outputDir}/${collection}_batch_${String(batchIndex).padStart(5, '0')}.json`;
    fs.writeFileSync(outputFile, JSON.stringify(documents, null, 2));
    result.outputFiles.push(outputFile);

    result.totalDocuments += documents.length;
    result.batchesProcessed++;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    batchIndex++;

    console.log(
      `${collection}: batch ${batchIndex}, docs ${result.totalDocuments}, ` +
      `last_id=${lastDoc.id}`
    );

    // Rate limiting: avoid Firestore quota exhaustion
    if (batchIndex % 10 === 0) {
      console.log(`${collection}: pause 2s after 10 batches (quota protection)`);
      await sleep(2000);
    }
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

function normalizeTimestamps(data: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && typeof value.toDate === 'function') {
      normalized[key] = value.toDate().toISOString();
    }
  }
  return normalized;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Data Transformation to OneLake Format

```typescript
interface TransformConfig {
  collection: string;
  inputDir: string;
  outputDir: string;
  format: 'parquet' | 'json' | 'csv';
}

// Schema mappings: Firebase field -> OneLake column
const SCHEMA_MAPS: Record<string, Record<string, string>> = {
  brokers: {
    '_id': 'broker_id',
    'name': 'broker_name',
    'status': 'broker_status',
    'tier': 'service_tier',
    'region': 'operating_region',
    'onboardedAt': 'onboarded_date',
    'email': 'primary_email',
    'phone': 'primary_phone',
    'address.street': 'address_street',
    'address.city': 'address_city',
    'address.state': 'address_state',
    'address.zip': 'address_zip',
  },
  commissions: {
    '_id': 'commission_id',
    'brokerId': 'broker_id',
    'carrierId': 'carrier_id',
    'amount': 'commission_amount',
    'period': 'commission_period',
    'status': 'payment_status',
    'paidAt': 'paid_date',
    'createdAt': 'created_date',
  },
  carriers: {
    '_id': 'carrier_id',
    'name': 'carrier_name',
    'products': 'product_lines',
    'regions': 'operating_regions',
    'status': 'carrier_status',
    'contractStart': 'contract_start_date',
  },
  contacts: {
    '_id': 'contact_id',
    'brokerId': 'broker_id',
    'name': 'contact_name',
    'email': 'contact_email',
    'phone': 'contact_phone',
    'role': 'contact_role',
  },
  activities: {
    '_id': 'activity_id',
    'brokerId': 'broker_id',
    'type': 'activity_type',
    'description': 'activity_description',
    'timestamp': 'activity_timestamp',
    'userId': 'performed_by',
  },
};

function transformDocument(
  collection: string,
  doc: Record<string, any>
): Record<string, any> {
  const schemaMap = SCHEMA_MAPS[collection];
  if (!schemaMap) throw new Error(`No schema map for collection: ${collection}`);

  const transformed: Record<string, any> = {
    _extracted_at: doc._extractedAt,
    _source_system: 'a3_archive_firebase',
    _migration_version: '1.0.0',
  };

  for (const [firebaseField, onelakeColumn] of Object.entries(schemaMap)) {
    // Handle nested fields (e.g., address.street)
    const value = firebaseField.includes('.')
      ? getNestedValue(doc, firebaseField)
      : doc[firebaseField];

    transformed[onelakeColumn] = value ?? null;
  }

  return transformed;
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
```

## Incremental Extraction with Timestamp Markers

```typescript
interface ExtractionMarker {
  collection: string;
  lastExtractedAt: string;       // ISO timestamp
  lastDocumentId: string;
  totalExtracted: number;
  runId: string;
}

const MARKER_FILE = './extraction-state/markers.json';

function loadMarkers(): Record<string, ExtractionMarker> {
  try {
    return JSON.parse(fs.readFileSync(MARKER_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveMarker(marker: ExtractionMarker): void {
  const markers = loadMarkers();
  markers[marker.collection] = marker;
  fs.mkdirSync('./extraction-state', { recursive: true });
  fs.writeFileSync(MARKER_FILE, JSON.stringify(markers, null, 2));
}

async function incrementalExtract(collection: string): Promise<ExtractionResult> {
  const markers = loadMarkers();
  const lastMarker = markers[collection];
  const runId = `run_${Date.now()}`;

  console.log(
    lastMarker
      ? `Incremental extract for ${collection} since ${lastMarker.lastExtractedAt}`
      : `Full extract for ${collection} (no prior marker)`
  );

  const result = await extractCollection({
    collection,
    batchSize: 500,
    lastTimestamp: lastMarker ? new Date(lastMarker.lastExtractedAt) : undefined,
    outputDir: `./staging/${collection}/${runId}`,
  });

  // Save marker for next incremental run
  saveMarker({
    collection,
    lastExtractedAt: new Date().toISOString(),
    lastDocumentId: 'batch-end',
    totalExtracted: result.totalDocuments,
    runId,
  });

  return result;
}
```

## Validation and Reconciliation

```typescript
interface ReconciliationReport {
  collection: string;
  sourceCount: number;         // Firestore document count
  extractedCount: number;      // Documents in staging files
  transformedCount: number;    // Documents after transformation
  loadedCount: number;         // Documents in OneLake
  missingIds: string[];        // IDs in source but not extracted
  duplicateIds: string[];      // IDs appearing multiple times
  status: 'PASS' | 'FAIL' | 'WARNING';
}

async function reconcile(collection: string, outputDir: string): Promise<ReconciliationReport> {
  // Count source documents in Firestore
  const countQuery = await db.collection(collection).count().get();
  const sourceCount = countQuery.data().count;

  // Count extracted documents from staging files
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
  let extractedCount = 0;
  const extractedIds = new Set<string>();
  const duplicateIds: string[] = [];

  for (const file of files) {
    const docs = JSON.parse(fs.readFileSync(`${outputDir}/${file}`, 'utf8'));
    extractedCount += docs.length;

    for (const doc of docs) {
      if (extractedIds.has(doc._id)) {
        duplicateIds.push(doc._id);
      }
      extractedIds.add(doc._id);
    }
  }

  // Determine status
  const matchRate = extractedCount / sourceCount;
  let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  if (matchRate < 0.99) status = 'FAIL';
  else if (matchRate < 1.0) status = 'WARNING';
  if (duplicateIds.length > 0) status = 'WARNING';

  const report: ReconciliationReport = {
    collection,
    sourceCount,
    extractedCount,
    transformedCount: extractedCount, // same if no transform errors
    loadedCount: 0,                   // updated after OneLake upload
    missingIds: [],                   // populated by spot-check sampling
    duplicateIds,
    status,
  };

  console.log(`
=== RECONCILIATION: ${collection} ===
Source count:     ${sourceCount}
Extracted count:  ${extractedCount}
Match rate:       ${(matchRate * 100).toFixed(2)}%
Duplicates:       ${duplicateIds.length}
Status:           ${status}
===================================
  `);

  return report;
}
```

## Full Extraction Orchestrator

```typescript
async function runFullExtraction(): Promise<void> {
  const collections = ['brokers', 'commissions', 'carriers', 'contacts', 'activities'];
  const results: ExtractionResult[] = [];
  const reports: ReconciliationReport[] = [];

  for (const collection of collections) {
    console.log(`\n>>> Starting extraction: ${collection}`);

    const result = await incrementalExtract(collection);
    results.push(result);

    console.log(
      `${collection}: ${result.totalDocuments} docs in ${result.batchesProcessed} batches ` +
      `(${result.durationMs}ms)`
    );

    // Reconcile
    const outputDir = result.outputFiles[0]
      ? result.outputFiles[0].substring(0, result.outputFiles[0].lastIndexOf('/'))
      : `./staging/${collection}`;
    const report = await reconcile(collection, outputDir);
    reports.push(report);
  }

  // Summary
  console.log('\n=== EXTRACTION SUMMARY ===');
  for (const r of results) {
    const report = reports.find(rp => rp.collection === r.collection)!;
    console.log(
      `${r.collection.padEnd(15)} | ` +
      `docs: ${String(r.totalDocuments).padStart(8)} | ` +
      `batches: ${String(r.batchesProcessed).padStart(4)} | ` +
      `time: ${String(r.durationMs).padStart(7)}ms | ` +
      `status: ${report.status}`
    );
  }
}
```

## Upload to OneLake

```bash
# Upload extracted JSON batches to OneLake staging area
for file in ./staging/brokers/run_*/*.json; do
  BASENAME=$(basename "${file}")
  curl -s -X PUT \
    -H "Authorization: Bearer ${FABRIC_TOKEN}" \
    -H "Content-Type: application/octet-stream" \
    "https://onelake.dfs.fabric.microsoft.com/${WORKSPACE_ID}/${LAKEHOUSE_ID}/Files/staging/a3_archive/brokers/${BASENAME}" \
    --data-binary @"${file}"
  echo "Uploaded: ${BASENAME}"
done
```

## Plugin Interop

```typescript
// If customer-data-migration-orchestrator plugin is available,
// use its Firebase adapter for consistent connection pooling and retry logic.
//
// Check: plugins/customer-data-migration-orchestrator/adapters/firebase-adapter.ts
//
// Usage:
//   import { FirebaseAdapter } from '../../customer-data-migration-orchestrator/adapters/firebase-adapter';
//   const adapter = new FirebaseAdapter({ projectId: 'a3-archive-legacy' });
//   const docs = await adapter.batchRead('brokers', { batchSize: 500 });
//
// Falls back to direct Admin SDK usage (this file) if plugin is not installed.
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `PERMISSION_DENIED` | Service account lacks Firestore read access | Grant `roles/datastore.viewer` in Firebase console |
| `RESOURCE_EXHAUSTED` | Firestore read quota exceeded | Reduce batch size, add longer pauses between batches |
| `DEADLINE_EXCEEDED` | Query timeout (>60s) | Use smaller `limit()`, add index for query fields |
| `NOT_FOUND` | Collection doesn't exist | Verify collection name matches A3 schema exactly |
| `UNAVAILABLE` | Firestore temporarily unavailable | Implement retry with exponential backoff (max 5 retries) |
| `INVALID_ARGUMENT` | Bad query (e.g., inequality on multiple fields) | Firestore requires composite index; create via console |
