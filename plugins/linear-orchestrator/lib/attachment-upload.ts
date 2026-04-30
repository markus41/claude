/**
 * Upload a file to Linear and attach it to an issue.
 *
 * Three-step flow:
 *  1. fileUpload mutation → reserve upload URL
 *  2. PUT bytes to that URL with returned headers
 *  3. attachmentCreate mutation → link the asset URL to the issue
 *
 * References:
 *  - https://linear.app/developers/how-to-upload-a-file-to-linear
 *  - https://linear.app/developers/file-storage-authentication
 */

import { LinearOrchestratorClient } from "./client.js";
import { readFile, stat } from "node:fs/promises";
import { basename } from "node:path";

export interface UploadOptions {
  contentType?: string;
  title?: string;
}

export async function uploadFileToLinear(
  client: LinearOrchestratorClient,
  issueId: string,
  filePath: string,
  opts: UploadOptions = {}
): Promise<{ attachmentId: string; assetUrl: string }> {
  const stats = await stat(filePath);
  const buf = await readFile(filePath);
  const contentType = opts.contentType ?? inferContentType(filePath);
  const filename = basename(filePath);

  // 1. Reserve
  const reserveQuery = `
    mutation FileUpload($contentType: String!, $filename: String!, $size: Int!) {
      fileUpload(contentType: $contentType, filename: $filename, size: $size) {
        success
        uploadFile {
          uploadUrl
          assetUrl
          headers { key value }
        }
      }
    }
  `;
  const reserve = await client.raw<{
    fileUpload: {
      success: boolean;
      uploadFile: {
        uploadUrl: string;
        assetUrl: string;
        headers: { key: string; value: string }[];
      };
    };
  }>(reserveQuery, { contentType, filename, size: stats.size });

  if (!reserve.fileUpload?.success) throw new Error("fileUpload reservation failed");
  const { uploadUrl, assetUrl, headers } = reserve.fileUpload.uploadFile;

  // 2. PUT bytes
  const putHeaders = Object.fromEntries(headers.map((h) => [h.key, h.value]));
  const putRes = await fetch(uploadUrl, { method: "PUT", body: buf, headers: putHeaders });
  if (!putRes.ok) throw new Error(`asset PUT failed: ${putRes.status}`);

  // 3. Attach
  const attachQuery = `
    mutation AttachmentCreate($issueId: String!, $url: String!, $title: String!, $contentType: String) {
      attachmentCreate(input: { issueId: $issueId, url: $url, title: $title, contentType: $contentType }) {
        success
        attachment { id }
      }
    }
  `;
  const attach = await client.raw<{
    attachmentCreate: { success: boolean; attachment: { id: string } };
  }>(attachQuery, {
    issueId,
    url: assetUrl,
    title: opts.title ?? filename,
    contentType,
  });

  if (!attach.attachmentCreate?.success) throw new Error("attachmentCreate failed");
  return { attachmentId: attach.attachmentCreate.attachment.id, assetUrl };
}

function inferContentType(filePath: string): string {
  const ext = filePath.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    zip: "application/zip",
    json: "application/json",
    txt: "text/plain",
    md: "text/markdown",
    csv: "text/csv",
    log: "text/plain",
    mp4: "video/mp4",
    mov: "video/quicktime",
  };
  return map[ext] ?? "application/octet-stream";
}
