import { createHash } from 'node:crypto';

// ── Types ──

export interface DocDiff {
  changed: boolean;
  addedLines: number;
  removedLines: number;
  changedSections: string[];
  similarity: number;
}

// ── Functions ──

export function computeContentHash(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

export function extractSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = markdown.split('\n');
  let currentHeader = '__preamble__';
  let currentLines: string[] = [];

  for (const line of lines) {
    const headerMatch = /^(#{2,3})\s+(.+)$/.exec(line);
    if (headerMatch) {
      // Flush previous section
      if (currentLines.length > 0 || currentHeader === '__preamble__') {
        sections.set(currentHeader, currentLines.join('\n').trim());
      }
      currentHeader = headerMatch[2]?.trim() ?? '';
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Flush last section
  sections.set(currentHeader, currentLines.join('\n').trim());

  return sections;
}

export function diffContent(oldContent: string, newContent: string): DocDiff {
  const oldHash = computeContentHash(oldContent);
  const newHash = computeContentHash(newContent);

  if (oldHash === newHash) {
    return {
      changed: false,
      addedLines: 0,
      removedLines: 0,
      changedSections: [],
      similarity: 1.0,
    };
  }

  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Compute added/removed using a set-based diff (line-level)
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  let addedLines = 0;
  for (const line of newLines) {
    if (!oldSet.has(line)) {
      addedLines++;
    }
  }

  let removedLines = 0;
  for (const line of oldLines) {
    if (!newSet.has(line)) {
      removedLines++;
    }
  }

  // Section-level diff
  const oldSections = extractSections(oldContent);
  const newSections = extractSections(newContent);
  const changedSections = findChangedSections(oldSections, newSections);

  // Similarity via Jaccard on trigrams
  const similarity = computeSimilarity(oldContent, newContent);

  return {
    changed: true,
    addedLines,
    removedLines,
    changedSections,
    similarity,
  };
}

// ── Helpers ──

function findChangedSections(
  oldSections: Map<string, string>,
  newSections: Map<string, string>,
): string[] {
  const changed: string[] = [];
  const allKeys = new Set([...oldSections.keys(), ...newSections.keys()]);

  for (const key of allKeys) {
    const oldVal = oldSections.get(key);
    const newVal = newSections.get(key);

    if (oldVal === undefined) {
      changed.push(key);
    } else if (newVal === undefined) {
      changed.push(key);
    } else if (computeContentHash(oldVal) !== computeContentHash(newVal)) {
      changed.push(key);
    }
  }

  return changed;
}

function computeSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const trigramsA = buildTrigrams(a);
  const trigramsB = buildTrigrams(b);

  if (trigramsA.size === 0 && trigramsB.size === 0) return 1.0;

  let intersection = 0;
  for (const tri of trigramsA) {
    if (trigramsB.has(tri)) {
      intersection++;
    }
  }

  const union = trigramsA.size + trigramsB.size - intersection;
  if (union === 0) return 1.0;

  return Math.round((intersection / union) * 1000) / 1000;
}

function buildTrigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  const trigrams = new Set<string>();
  for (let i = 0; i <= normalized.length - 3; i++) {
    trigrams.add(normalized.slice(i, i + 3));
  }
  return trigrams;
}
