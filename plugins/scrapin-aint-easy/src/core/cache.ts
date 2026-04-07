import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * LRU cache with TTL support, backed by in-memory Map + optional disk persistence.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessedAt: number;
}

export class Cache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly diskDir: string | undefined;

  constructor(
    private readonly maxSize: number = 1000,
    private readonly defaultTtlMs: number = 3600_000,
    diskDir?: string,
  ) {
    this.diskDir = diskDir;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    entry.accessedAt = Date.now();
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.store.size >= this.maxSize) {
      this.evictLRU();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      accessedAt: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evictLRU(): void {
    let oldestKey: string | undefined;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.accessedAt < oldestAccess) {
        oldestAccess = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }

  /** Persist cache to disk as JSON */
  async saveToDisk(filename: string): Promise<void> {
    if (!this.diskDir) return;

    const filePath = join(this.diskDir, filename);
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const entries: Record<string, CacheEntry<T>> = {};
    for (const [key, entry] of this.store) {
      if (Date.now() < entry.expiresAt) {
        entries[key] = entry;
      }
    }

    await writeFile(filePath, JSON.stringify(entries, null, 2), 'utf-8');
  }

  /** Load cache from disk */
  async loadFromDisk(filename: string): Promise<void> {
    if (!this.diskDir) return;

    const filePath = join(this.diskDir, filename);
    try {
      const raw = await readFile(filePath, 'utf-8');
      const entries = JSON.parse(raw) as Record<string, CacheEntry<T>>;
      const now = Date.now();

      for (const [key, entry] of Object.entries(entries)) {
        if (entry.expiresAt > now) {
          this.store.set(key, entry);
        }
      }
    } catch {
      // File doesn't exist or is corrupted — start fresh
    }
  }
}
