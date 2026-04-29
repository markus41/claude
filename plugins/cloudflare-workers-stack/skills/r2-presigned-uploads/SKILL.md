---
name: R2 Presigned Uploads
description: Use when the user asks about R2 multipart uploads, presigned URLs, large file uploads, upload-proxy workers, or S3-compatible operations.
version: 0.1.0
---

# R2 Multipart + Presigned Uploads

For files > a few MB, upload from the browser directly to R2 — your Worker only mediates auth, not bytes. Two modes:

1. **Multipart via Worker proxy** — Worker creates the upload, returns part URLs, finalizes
2. **S3-compatible presigned URLs** — Browser uploads using AWS SDK or fetch with signed headers

## Mode 1: Worker-mediated multipart

### 1. Create an upload

```typescript
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (url.pathname === '/uploads' && req.method === 'POST') {
      const { key, contentType } = await req.json<{ key: string; contentType: string }>();
      // Authn/authz check first!
      const upload = await env.BUCKET.createMultipartUpload(key, {
        httpMetadata: { contentType }
      });
      return Response.json({
        uploadId: upload.uploadId,
        key: upload.key
      });
    }

    if (url.pathname === '/uploads/part' && req.method === 'PUT') {
      const uploadId = url.searchParams.get('uploadId')!;
      const key = url.searchParams.get('key')!;
      const partNumber = Number(url.searchParams.get('partNumber'));

      const upload = env.BUCKET.resumeMultipartUpload(key, uploadId);
      const part = await upload.uploadPart(partNumber, req.body!);
      return Response.json(part);   // { partNumber, etag }
    }

    if (url.pathname === '/uploads/complete' && req.method === 'POST') {
      const { uploadId, key, parts } = await req.json<{
        uploadId: string;
        key: string;
        parts: { partNumber: number; etag: string }[];
      }>();
      const upload = env.BUCKET.resumeMultipartUpload(key, uploadId);
      const obj = await upload.complete(parts);
      return Response.json({ key: obj.key, etag: obj.httpEtag });
    }

    return new Response('Not found', { status: 404 });
  }
};
```

### 2. Browser uploader

```typescript
async function uploadLarge(file: File, key: string) {
  const init = await (await fetch('/uploads', {
    method: 'POST',
    body: JSON.stringify({ key, contentType: file.type })
  })).json();

  const partSize = 5 * 1024 * 1024;     // 5 MB minimum (except last)
  const parts: { partNumber: number; etag: string }[] = [];

  for (let i = 0; i * partSize < file.size; i++) {
    const blob = file.slice(i * partSize, (i + 1) * partSize);
    const partNumber = i + 1;
    const r = await fetch(
      `/uploads/part?uploadId=${init.uploadId}&key=${encodeURIComponent(init.key)}&partNumber=${partNumber}`,
      { method: 'PUT', body: blob }
    );
    parts.push(await r.json());
  }

  await fetch('/uploads/complete', {
    method: 'POST',
    body: JSON.stringify({ uploadId: init.uploadId, key: init.key, parts })
  });
}
```

## Mode 2: S3-compatible presigned URLs

R2 exposes S3-compatible endpoints. Generate presigned URLs server-side, hand them to the browser.

```typescript
import { AwsClient } from 'aws4fetch';

async function presign(env: Env, key: string, expiresInSeconds = 3600): Promise<string> {
  const aws = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto'
  });

  const url = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${encodeURIComponent(key)}`;
  const signed = await aws.sign(
    new Request(url, { method: 'PUT' }),
    { aws: { signQuery: true }, headers: { 'X-Amz-Expires': String(expiresInSeconds) } }
  );
  return signed.url;
}
```

Get keys:
```bash
wrangler r2 bucket access-keys create
```
Store as Worker secrets, never in `vars`.

## Range / partial download

```typescript
const obj = await env.BUCKET.get(key, {
  range: { offset: 0, length: 1024 * 1024 }
});
return new Response(obj!.body, {
  status: 206,
  headers: {
    'Content-Range': `bytes 0-${1024*1024 - 1}/${obj!.size}`,
    'Content-Length': String(obj!.size)
  }
});
```

## Lifecycle and retention

Configure via dashboard or:
```bash
wrangler r2 bucket lifecycle add my-bucket --type abort-multipart --days 1
wrangler r2 bucket lifecycle add my-bucket --type delete --days 30 --prefix "tmp/"
```

## Pitfalls

- **Part size < 5 MB** (except final): `complete` rejects with `EntityTooSmall`.
- **Mixing the bucket's bytes through the Worker for huge files**: kills CPU budget. Use multipart or presigned.
- **Forgetting to `abort()` failed uploads**: parts cost money until aborted or expired by lifecycle rule.
- **Public bucket, no signed URLs, no auth check on Worker proxy**: data exfiltration. Always authn before issuing an upload id or presigned URL.
- **CORS on browser → R2 directly**: configure `r2 bucket cors put my-bucket --rules-file cors.json`.
