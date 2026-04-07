import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import pino from 'pino';

const logger = pino({ name: 'snapshot' });

export interface SnapshotDiff {
  changed: boolean;
  addedLines: number;
  removedLines: number;
  changedSections: string[];
}

function contentHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

function snapshotPath(dataDir: string, sourceKey: string, pageId: string): string {
  // Sanitize to avoid path traversal
  const safeSource = sourceKey.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safePageId = pageId.replace(/[^a-zA-Z0-9_.-]/g, '_');
  return join(dataDir, 'snapshots', safeSource, `${safePageId}.md`);
}

/**
 * Save a page snapshot to disk.
 * @returns The content hash (SHA-256 hex) of the saved content.
 */
export async function saveSnapshot(
  sourceKey: string,
  pageId: string,
  content: string,
  dataDir: string,
): Promise<string> {
  const filePath = snapshotPath(dataDir, sourceKey, pageId);
  const dir = dirname(filePath);

  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(filePath, content, 'utf-8');
  const hash = contentHash(content);

  logger.debug({ sourceKey, pageId, hash }, 'Snapshot saved');
  return hash;
}

/**
 * Load a previously saved page snapshot.
 * @returns The snapshot content, or null if no snapshot exists.
 */
export async function loadSnapshot(
  sourceKey: string,
  pageId: string,
  dataDir: string,
): Promise<string | null> {
  const filePath = snapshotPath(dataDir, sourceKey, pageId);

  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch {
    return null;
  }
}

/**
 * Compare two content strings and produce a diff summary.
 */
export function diffSnapshots(oldContent: string, newContent: string): SnapshotDiff {
  if (oldContent === newContent) {
    return { changed: false, addedLines: 0, removedLines: 0, changedSections: [] };
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  let addedLines = 0;
  let removedLines = 0;

  for (const line of newLines) {
    if (!oldSet.has(line)) addedLines++;
  }

  for (const line of oldLines) {
    if (!newSet.has(line)) removedLines++;
  }

  const changedSections = detectChangedSections(oldLines, newLines);

  return { changed: true, addedLines, removedLines, changedSections };
}

/**
 * Identify which markdown sections (by header) had changes.
 */
function detectChangedSections(oldLines: string[], newLines: string[]): string[] {
  const oldSections = buildSectionMap(oldLines);
  const newSections = buildSectionMap(newLines);
  const changed: string[] = [];

  // Check for modified or added sections
  for (const [heading, newBody] of newSections) {
    const oldBody = oldSections.get(heading);
    if (oldBody === undefined || oldBody !== newBody) {
      changed.push(heading);
    }
  }

  // Check for removed sections
  for (const [heading] of oldSections) {
    if (!newSections.has(heading)) {
      changed.push(heading);
    }
  }

  return changed;
}

/**
 * Build a map from section heading to concatenated body text.
 */
function buildSectionMap(lines: string[]): Map<string, string> {
  const sections = new Map<string, string>();
  let currentHeading = '_preamble';
  let bodyLines: string[] = [];

  for (const line of lines) {
    const headerMatch = /^(#{1,6})\s+(.+)$/.exec(line);
    if (headerMatch?.[2]) {
      // Save previous section
      sections.set(currentHeading, bodyLines.join('\n'));
      currentHeading = headerMatch[2].trim();
      bodyLines = [];
    } else {
      bodyLines.push(line);
    }
  }

  // Save last section
  sections.set(currentHeading, bodyLines.join('\n'));

  return sections;
}
