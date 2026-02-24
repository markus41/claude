/**
 * Azure Function: firebase-extract
 * HTTP trigger that extracts Firebase collections in batches of 500,
 * transforms to Parquet-compatible JSON, and uploads to OneLake via Fabric REST API.
 *
 * Endpoint: POST /api/firebase-extract
 * Body: { "collection": "brokers|commissions|carriers|contacts|activities", "batchSize": 500 }
 */

const admin = require("firebase-admin");
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");
const fetch = require("node-fetch");

// ── Constants ───────────────────────────────────────────────────────────────

const VALID_COLLECTIONS = [
  "brokers",
  "commissions",
  "carriers",
  "contacts",
  "activities",
];
const DEFAULT_BATCH_SIZE = 500;
const MAX_BATCH_SIZE = 2000;
const ONELAKE_BASE_URL = "https://onelake.dfs.fabric.microsoft.com";

// ── Initialization ──────────────────────────────────────────────────────────

let firebaseInitialized = false;
let kvClient = null;

async function initializeFirebase() {
  if (firebaseInitialized) return;

  const credential = new DefaultAzureCredential();
  const kvName = process.env.KEY_VAULT_NAME || "kv-rosa-holdings-dev";
  const kvUrl = `https://${kvName}.vault.azure.net`;
  kvClient = new SecretClient(kvUrl, credential);

  const serviceAccountSecret = await kvClient.getSecret(
    "FIREBASE-SERVICE-ACCOUNT"
  );
  const serviceAccount = JSON.parse(serviceAccountSecret.value);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  firebaseInitialized = true;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function flattenFirestoreDoc(doc) {
  const data = doc.data();
  const flat = { _id: doc.id, _extractedAt: new Date().toISOString() };

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      flat[key] = null;
    } else if (value instanceof admin.firestore.Timestamp) {
      flat[key] = value.toDate().toISOString();
    } else if (value instanceof admin.firestore.GeoPoint) {
      flat[`${key}_lat`] = value.latitude;
      flat[`${key}_lng`] = value.longitude;
    } else if (value instanceof admin.firestore.DocumentReference) {
      flat[`${key}_ref`] = value.path;
    } else if (typeof value === "object" && !Array.isArray(value)) {
      for (const [nestedKey, nestedVal] of Object.entries(value)) {
        const flatKey = `${key}_${nestedKey}`;
        if (nestedVal instanceof admin.firestore.Timestamp) {
          flat[flatKey] = nestedVal.toDate().toISOString();
        } else if (typeof nestedVal !== "object") {
          flat[flatKey] = nestedVal;
        } else {
          flat[flatKey] = JSON.stringify(nestedVal);
        }
      }
    } else if (Array.isArray(value)) {
      flat[key] = JSON.stringify(value);
    } else {
      flat[key] = value;
    }
  }

  return flat;
}

async function getOneLakeToken() {
  const credential = new DefaultAzureCredential();
  const tokenResponse = await credential.getToken(
    "https://storage.azure.com/.default"
  );
  return tokenResponse.token;
}

async function uploadToOneLake(collection, batchIndex, records, context) {
  const token = await getOneLakeToken();
  const workspace = process.env.FABRIC_WORKSPACE_A3 || "Rosa Holdings - A3 Archive";
  const lakehouse = "lh-a3-extract";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = `Files/raw-json/${collection}/${collection}_batch${batchIndex}_${timestamp}.json`;

  const url = `${ONELAKE_BASE_URL}/${encodeURIComponent(workspace)}/${lakehouse}/${filePath}?resource=file`;

  // Create file
  const createResponse = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Length": "0",
    },
  });

  if (!createResponse.ok && createResponse.status !== 201) {
    throw new Error(
      `OneLake file create failed: ${createResponse.status} ${createResponse.statusText}`
    );
  }

  // Append content
  const content = JSON.stringify(records, null, 2);
  const contentBuffer = Buffer.from(content, "utf-8");

  const appendUrl = `${ONELAKE_BASE_URL}/${encodeURIComponent(workspace)}/${lakehouse}/${filePath}?action=append&position=0`;

  const appendResponse = await fetch(appendUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Length": contentBuffer.length.toString(),
      "Content-Type": "application/json",
    },
    body: contentBuffer,
  });

  if (!appendResponse.ok) {
    throw new Error(
      `OneLake append failed: ${appendResponse.status} ${appendResponse.statusText}`
    );
  }

  // Flush
  const flushUrl = `${ONELAKE_BASE_URL}/${encodeURIComponent(workspace)}/${lakehouse}/${filePath}?action=flush&position=${contentBuffer.length}`;

  const flushResponse = await fetch(flushUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!flushResponse.ok) {
    throw new Error(
      `OneLake flush failed: ${flushResponse.status} ${flushResponse.statusText}`
    );
  }

  context.log(
    `Uploaded batch ${batchIndex}: ${records.length} records to ${filePath}`
  );
  return filePath;
}

// ── Main Function ───────────────────────────────────────────────────────────

module.exports = async function (context, req) {
  const startTime = Date.now();

  try {
    // Validate request
    const collection = req.body?.collection;
    const batchSize = Math.min(
      req.body?.batchSize || DEFAULT_BATCH_SIZE,
      MAX_BATCH_SIZE
    );

    if (!collection || !VALID_COLLECTIONS.includes(collection)) {
      context.res = {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "Invalid collection",
          message: `Collection must be one of: ${VALID_COLLECTIONS.join(", ")}`,
          validCollections: VALID_COLLECTIONS,
        },
      };
      return;
    }

    context.log(`Starting extraction: collection=${collection}, batchSize=${batchSize}`);

    // Initialize Firebase
    await initializeFirebase();

    const db = admin.firestore();
    const collectionRef = db.collection(collection);

    // Get total count for progress tracking
    const countSnapshot = await collectionRef.count().get();
    const totalDocs = countSnapshot.data().count;
    context.log(`Total documents in ${collection}: ${totalDocs}`);

    // Extract in batches
    let lastDoc = null;
    let batchIndex = 0;
    let totalExtracted = 0;
    const uploadedFiles = [];
    const errors = [];

    while (true) {
      let query = collectionRef.orderBy("__name__").limit(batchSize);
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      if (snapshot.empty) break;

      const records = snapshot.docs.map(flattenFirestoreDoc);
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      batchIndex++;
      totalExtracted += records.length;

      try {
        const filePath = await uploadToOneLake(
          collection,
          batchIndex,
          records,
          context
        );
        uploadedFiles.push({
          batch: batchIndex,
          records: records.length,
          path: filePath,
        });
      } catch (uploadError) {
        context.log.error(
          `Upload failed for batch ${batchIndex}: ${uploadError.message}`
        );
        errors.push({
          batch: batchIndex,
          error: uploadError.message,
          records: records.length,
        });
      }

      // Log progress
      const progress = Math.round((totalExtracted / totalDocs) * 100);
      context.log(
        `Progress: ${totalExtracted}/${totalDocs} (${progress}%) - Batch ${batchIndex}`
      );
    }

    const duration = Date.now() - startTime;

    context.res = {
      status: errors.length > 0 && uploadedFiles.length === 0 ? 500 : 200,
      headers: { "Content-Type": "application/json" },
      body: {
        collection,
        totalDocuments: totalDocs,
        totalExtracted,
        batchCount: batchIndex,
        batchSize,
        uploadedFiles,
        errors,
        durationMs: duration,
        durationFormatted: `${Math.round(duration / 1000)}s`,
        completedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    context.log.error(`Firebase extract failed: ${error.message}`);
    context.log.error(error.stack);

    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        error: "Extraction failed",
        message: error.message,
        durationMs: Date.now() - startTime,
      },
    };
  }
};
