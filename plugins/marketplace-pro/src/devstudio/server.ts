/**
 * Plugin Dev Studio with Hot-Reload — Server Module
 *
 * Implements four core classes that together form a complete development
 * environment for building and testing Claude Code plugins:
 *
 *   1. FileWatcher      — Content-hash-based file change detection with debouncing
 *   2. HotReloader      — Manifest/markdown validation and resource registry management
 *   3. PluginPlayground  — Isolated command execution with fixture recording/replay
 *   4. DependencyGraphRenderer — ASCII + Mermaid dependency graph visualization
 *
 * This module uses only Node.js built-in APIs (fs, path, crypto) so it has
 * zero external dependencies. The FNV-1a hash implementation is inlined for
 * maximum speed on small-to-medium files.
 */

import * as fs from 'fs';
import * as path from 'path';

import type {
  FileChange,
  FileChangeCallback,
  WatcherOptions,
  ResourceType,
  ValidationResult,
  ValidationIssue,

  RegisteredResource,
  ReloadResult,
  TestFixture,
  FixtureReplayResult,
  MockCapability,
  ResourceNode,
  ResourceGraph,
  DevServerStatus,
  DevServerState,
  DevServerConfig,
} from './types.ts';

import {
  DevStudioError,
  DevStudioErrorCode,
} from './types.ts';

// ===========================================================================
// FNV-1a Hash — Non-cryptographic, extremely fast for change detection
// ===========================================================================

/**
 * FNV-1a 32-bit hash.
 *
 * The Fowler-Noll-Vo hash function (variant 1a) is a non-cryptographic hash
 * optimized for speed on short inputs. It processes one byte at a time with
 * XOR-then-multiply, which gives excellent avalanche characteristics for
 * change detection without the overhead of SHA/MD5.
 *
 * FNV parameters for 32-bit:
 *   - Offset basis: 0x811c9dc5 (2166136261)
 *   - Prime:        0x01000193 (16777619)
 *
 * We use 32-bit because we only need collision resistance within a single
 * plugin directory (~100s of files), not cryptographic security.
 *
 * @param data - Raw bytes to hash (Buffer or string encoded as UTF-8)
 * @returns 8-character lowercase hex string (32-bit hash)
 */
function fnv1aHash(data: Buffer | string): string {
  const FNV_OFFSET_BASIS = 0x811c9dc5;
  const FNV_PRIME = 0x01000193;

  const bytes = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < bytes.length; i++) {
    // XOR the byte into the lowest byte of the hash
    hash ^= bytes[i];
    // Multiply by the FNV prime. We use Math.imul for correct 32-bit
    // integer multiplication (JavaScript numbers are 64-bit floats, so
    // normal * would lose precision above 2^53).
    hash = Math.imul(hash, FNV_PRIME);
  }

  // Convert to unsigned 32-bit integer, then to hex
  return (hash >>> 0).toString(16).padStart(8, '0');
}


// ===========================================================================
// Utility: classify a file path into a resource type
// ===========================================================================

/**
 * Determines the resource type of a file based on its relative path within
 * the plugin directory structure.
 *
 * Plugin directory conventions:
 *   commands/   -> 'command'
 *   skills/     -> 'skill'
 *   agents/     -> 'agent'
 *   config/     -> 'config'
 *   .claude-plugin/ -> 'config'
 *   src/        -> 'source'
 *   everything else -> 'other'
 */
function classifyResource(relativePath: string): ResourceType {
  const normalized = relativePath.replace(/\\/g, '/');

  if (normalized.startsWith('commands/')) return 'command';
  if (normalized.startsWith('skills/')) return 'skill';
  if (normalized.startsWith('agents/')) return 'agent';
  if (normalized.startsWith('config/') || normalized.startsWith('.claude-plugin/')) return 'config';
  if (normalized.startsWith('src/')) return 'source';
  return 'other';
}


// ===========================================================================
// FileWatcher — Content-hash-based file change detection with debouncing
// ===========================================================================

/**
 * Watches a plugin directory for file changes, using content hashing to
 * distinguish real modifications from timestamp-only updates (e.g. from
 * editors that write-then-rename, or VCS operations).
 *
 * Design decisions:
 *   - Uses fs.watch (recursive) rather than polling for low CPU usage
 *   - Computes FNV-1a hashes per-file to detect actual content changes
 *   - Debounces rapid changes (editors often write multiple times in quick
 *     succession) using a configurable window (default 100ms)
 *   - Maintains an internal hash map to track file state between events
 *
 * Usage:
 *   const watcher = new FileWatcher({ pluginPath: '/path/to/plugin' });
 *   watcher.onChange((changes) => console.log(changes));
 *   await watcher.start();
 *   // ... later ...
 *   watcher.stop();
 */
export class FileWatcher {
  private readonly pluginPath: string;
  private readonly debounceMs: number;
  private readonly ignorePatterns: string[];
  private readonly initialScan: boolean;

  /** Map of relative file path -> FNV-1a hash of last known content. */
  private hashMap: Map<string, string> = new Map();

  /** Registered change callbacks. */
  private callbacks: FileChangeCallback[] = [];

  /** Active fs.watch handle (null when stopped). */
  private watcher: fs.FSWatcher | null = null;

  /** Pending changes accumulated during the debounce window. */
  private pendingChanges: Map<string, FileChange> = new Map();

  /** Timer handle for the debounce window. */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: WatcherOptions) {
    this.pluginPath = path.resolve(options.pluginPath);
    this.debounceMs = options.debounceMs ?? 100;
    this.ignorePatterns = options.ignorePatterns ?? [
      'node_modules', '.git', '.DS_Store', 'tests/fixtures',
    ];
    this.initialScan = options.initialScan ?? true;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Register a callback to be invoked when file changes are detected.
   * Multiple callbacks can be registered; all are invoked in order.
   */
  onChange(callback: FileChangeCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Start watching the plugin directory. Performs an initial scan to
   * populate the hash map, then begins listening for filesystem events.
   */
  async start(): Promise<void> {
    // Verify the plugin directory exists
    if (!fs.existsSync(this.pluginPath)) {
      throw new DevStudioError(
        `Plugin directory not found: ${this.pluginPath}`,
        DevStudioErrorCode.PLUGIN_NOT_FOUND,
        { path: this.pluginPath },
      );
    }

    // Build the initial hash map by scanning all files
    if (this.initialScan) {
      await this.scanDirectory(this.pluginPath);
    }

    // Start the filesystem watcher in recursive mode
    try {
      this.watcher = fs.watch(
        this.pluginPath,
        { recursive: true },
        (eventType, filename) => {
          if (filename) {
            this.handleFsEvent(eventType, filename);
          }
        },
      );

      this.watcher.on('error', (error) => {
        console.error(`[FileWatcher] Watcher error: ${error.message}`);
      });
    } catch (error) {
      throw new DevStudioError(
        `Failed to start file watcher: ${(error as Error).message}`,
        DevStudioErrorCode.WATCHER_ERROR,
        { originalError: (error as Error).message },
      );
    }
  }

  /** Stop watching and clean up all resources. */
  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.pendingChanges.clear();
  }

  /** Get a snapshot of the current hash map (for testing/debugging). */
  getHashMap(): ReadonlyMap<string, string> {
    return this.hashMap;
  }

  // -------------------------------------------------------------------------
  // Internal: filesystem scanning
  // -------------------------------------------------------------------------

  /**
   * Recursively scan a directory and populate the hash map with FNV-1a
   * hashes of every file's content.
   */
  private async scanDirectory(dirPath: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return; // Directory may have been deleted between detection and scan
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(this.pluginPath, fullPath);

      // Skip ignored patterns
      if (this.shouldIgnore(relativePath)) continue;

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile()) {
        try {
          const content = fs.readFileSync(fullPath);
          const hash = fnv1aHash(content);
          this.hashMap.set(relativePath, hash);
        } catch {
          // File may have been deleted between readdir and readFile
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // Internal: event handling with debouncing
  // -------------------------------------------------------------------------

  /**
   * Handle a raw fs.watch event. Computes the new content hash and
   * determines whether the file was added, modified, or deleted.
   * Accumulates changes in the pending map and resets the debounce timer.
   */
  private handleFsEvent(_eventType: string, filename: string): void {
    const relativePath = filename.replace(/\\/g, '/');

    // Skip ignored patterns
    if (this.shouldIgnore(relativePath)) return;

    const fullPath = path.join(this.pluginPath, relativePath);
    const previousHash = this.hashMap.get(relativePath);

    let change: FileChange;

    if (!fs.existsSync(fullPath)) {
      // File was deleted
      if (!previousHash) return; // We never knew about this file, ignore

      change = {
        path: relativePath,
        type: 'deleted',
        hash: '',
        previousHash,
        resourceType: classifyResource(relativePath),
      };

      this.hashMap.delete(relativePath);
    } else {
      // File exists — check if it's actually a file (not a directory)
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) return;
      } catch {
        return;
      }

      // Read content and compute hash
      let content: Buffer;
      try {
        content = fs.readFileSync(fullPath);
      } catch {
        return; // File may have been deleted between exists check and read
      }

      const newHash = fnv1aHash(content);

      // Skip if content hasn't actually changed (timestamp-only update)
      if (previousHash === newHash) return;

      change = {
        path: relativePath,
        type: previousHash ? 'modified' : 'added',
        hash: newHash,
        previousHash,
        resourceType: classifyResource(relativePath),
      };

      this.hashMap.set(relativePath, newHash);
    }

    // Accumulate the change (later events for the same file overwrite earlier ones)
    this.pendingChanges.set(relativePath, change);

    // Reset the debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flushChanges();
    }, this.debounceMs);
  }

  /**
   * Flush all pending changes to registered callbacks. Called when the
   * debounce window expires without new events.
   */
  private flushChanges(): void {
    if (this.pendingChanges.size === 0) return;

    const changes = Array.from(this.pendingChanges.values());
    this.pendingChanges.clear();
    this.debounceTimer = null;

    // Invoke all registered callbacks
    for (const callback of this.callbacks) {
      try {
        callback(changes);
      } catch (error) {
        console.error(`[FileWatcher] Callback error: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Check whether a relative path should be ignored based on configured patterns.
   * Uses simple prefix/substring matching (not full glob support).
   */
  private shouldIgnore(relativePath: string): boolean {
    for (const pattern of this.ignorePatterns) {
      if (relativePath === pattern) return true;
      if (relativePath.startsWith(pattern + '/')) return true;
      if (relativePath.includes('/' + pattern + '/')) return true;
      if (relativePath.includes('/' + pattern)) return true;
    }
    return false;
  }
}


// ===========================================================================
// HotReloader — Manifest/markdown validation and resource registry
// ===========================================================================

/**
 * Manages the hot-reload lifecycle for a plugin. When the FileWatcher
 * reports changes, the HotReloader:
 *
 *   1. Re-reads the plugin manifest if it changed
 *   2. Validates manifest structure (required fields, valid JSON)
 *   3. Lints command/skill markdown files (frontmatter, required fields)
 *   4. Identifies which resources changed
 *   5. Updates the internal resource registry (add/update/remove)
 *   6. Reports inline validation results with file:line references
 *
 * The resource registry is the single source of truth for what is currently
 * "loaded" in the dev server — analogous to what would be registered in the
 * real plugin system at runtime.
 */
export class HotReloader {
  private readonly pluginPath: string;

  /** Currently loaded resources, keyed by relative file path. */
  private registry: Map<string, RegisteredResource> = new Map();

  /** Cached plugin manifest (re-read on config changes). */
  private manifest: Record<string, unknown> | null = null;

  /** Total number of reload cycles performed. */
  private reloadCount = 0;

  constructor(pluginPath: string) {
    this.pluginPath = path.resolve(pluginPath);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Process a batch of file changes from the FileWatcher. Validates affected
   * files, updates the resource registry, and returns a summary of what changed.
   */
  reload(changes: FileChange[]): ReloadResult {
    this.reloadCount++;
    const timestamp = new Date().toISOString();

    const added: RegisteredResource[] = [];
    const updated: RegisteredResource[] = [];
    const removed: string[] = [];
    const validations: ValidationResult[] = [];

    for (const change of changes) {
      // If the manifest changed, re-read and validate it
      if (change.path === '.claude-plugin/plugin.json') {
        const validation = this.validateManifest();
        validations.push(validation);

        if (validation.valid) {
          this.readManifest();
        }
        continue;
      }

      // Handle resource-level changes (commands, skills, agents)
      if (change.type === 'deleted') {
        const existing = this.registry.get(change.path);
        if (existing) {
          this.registry.delete(change.path);
          removed.push(existing.name);
        }
        continue;
      }

      // For added/modified files, validate and register
      const validation = this.validateFile(change);
      validations.push(validation);

      const resource = this.buildResource(change, validation);

      if (change.type === 'added' || !this.registry.has(change.path)) {
        this.registry.set(change.path, resource);
        added.push(resource);
      } else {
        this.registry.set(change.path, resource);
        updated.push(resource);
      }
    }

    const allValid = validations.every((v) => v.valid);

    return { added, updated, removed, validations, allValid, timestamp };
  }

  /**
   * Perform a full validation of the entire plugin directory. This is the
   * equivalent of a cold start — it scans everything and rebuilds the registry.
   */
  fullValidation(): ReloadResult {
    this.registry.clear();

    const timestamp = new Date().toISOString();
    const validations: ValidationResult[] = [];
    const added: RegisteredResource[] = [];

    // Validate manifest
    const manifestValidation = this.validateManifest();
    validations.push(manifestValidation);
    if (manifestValidation.valid) {
      this.readManifest();
    }

    // Scan and validate all resource files
    const resourceDirs = ['commands', 'skills', 'agents'];
    for (const dir of resourceDirs) {
      const dirPath = path.join(this.pluginPath, dir);
      if (!fs.existsSync(dirPath)) continue;

      const files = this.walkDirectory(dirPath);
      for (const filePath of files) {
        const relativePath = path.relative(this.pluginPath, filePath);
        const content = fs.readFileSync(filePath);
        const hash = fnv1aHash(content);

        const change: FileChange = {
          path: relativePath,
          type: 'added',
          hash,
          resourceType: classifyResource(relativePath),
        };

        const validation = this.validateFile(change);
        validations.push(validation);

        const resource = this.buildResource(change, validation);
        this.registry.set(relativePath, resource);
        added.push(resource);
      }
    }

    const allValid = validations.every((v) => v.valid);
    return { added, updated: [], removed: [], validations, allValid, timestamp };
  }

  /** Get a snapshot of the current resource registry. */
  getRegistry(): ReadonlyMap<string, RegisteredResource> {
    return this.registry;
  }

  /** Get the cached plugin manifest. */
  getManifest(): Record<string, unknown> | null {
    return this.manifest;
  }

  /** Get the total number of reload cycles. */
  getReloadCount(): number {
    return this.reloadCount;
  }

  // -------------------------------------------------------------------------
  // Internal: manifest handling
  // -------------------------------------------------------------------------

  /** Read and cache the plugin manifest from disk. */
  private readManifest(): void {
    const manifestPath = path.join(this.pluginPath, '.claude-plugin', 'plugin.json');
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      this.manifest = JSON.parse(raw);
    } catch {
      this.manifest = null;
    }
  }

  /**
   * Validate the plugin manifest for required fields and structure.
   * Returns inline validation results with line numbers derived from
   * scanning the raw JSON text.
   */
  private validateManifest(): ValidationResult {
    const manifestPath = path.join(this.pluginPath, '.claude-plugin', 'plugin.json');
    const relativePath = '.claude-plugin/plugin.json';
    const errors: ValidationIssue[] = [];

    // Check file existence
    if (!fs.existsSync(manifestPath)) {
      errors.push({
        line: 1,
        message: 'Plugin manifest file not found: .claude-plugin/plugin.json',
        severity: 'error',
      });
      return { file: relativePath, valid: false, errors };
    }

    // Read raw content
    let raw: string;
    try {
      raw = fs.readFileSync(manifestPath, 'utf-8');
    } catch (err) {
      errors.push({
        line: 1,
        message: `Cannot read manifest: ${(err as Error).message}`,
        severity: 'error',
      });
      return { file: relativePath, valid: false, errors };
    }

    // Parse JSON
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // Try to extract a line number from the JSON parse error
      const match = (err as Error).message.match(/position (\d+)/);
      const position = match ? parseInt(match[1], 10) : 0;
      const line = raw.substring(0, position).split('\n').length;

      errors.push({
        line,
        message: `Invalid JSON: ${(err as Error).message}`,
        severity: 'error',
      });
      return { file: relativePath, valid: false, errors };
    }

    // Validate required fields
    const lines = raw.split('\n');

    const requiredFields = ['name', 'version', 'description', 'contextEntry'];
    for (const field of requiredFields) {
      if (!parsed[field]) {
        const lineNum = this.findFieldLine(lines, field);
        errors.push({
          line: lineNum,
          message: `Required field "${field}" is missing or empty`,
          severity: 'error',
        });
      }
    }

    // Validate field types
    if (parsed['name'] && typeof parsed['name'] !== 'string') {
      errors.push({
        line: this.findFieldLine(lines, 'name'),
        message: '"name" must be a string',
        severity: 'error',
      });
    }

    if (parsed['version'] && typeof parsed['version'] !== 'string') {
      errors.push({
        line: this.findFieldLine(lines, 'version'),
        message: '"version" must be a string',
        severity: 'error',
      });
    }

    if (parsed['contextEntry'] && typeof parsed['contextEntry'] !== 'string') {
      errors.push({
        line: this.findFieldLine(lines, 'contextEntry'),
        message: '"contextEntry" must be a string',
        severity: 'error',
      });
    }

    if (typeof parsed['contextEntry'] === 'string') {
      const contextPath = path.join(this.pluginPath, parsed['contextEntry']);
      if (!fs.existsSync(contextPath)) {
        errors.push({
          line: this.findFieldLine(lines, 'contextEntry'),
          message: `contextEntry file not found: ${parsed['contextEntry']}`,
          severity: 'error',
        });
      }
    }

    // Validate capabilities structure if present
    if (parsed['capabilities']) {
      const caps = parsed['capabilities'] as Record<string, unknown>;
      if (caps['provides'] && !Array.isArray(caps['provides'])) {
        errors.push({
          line: this.findFieldLine(lines, 'provides'),
          message: '"capabilities.provides" must be an array',
          severity: 'error',
        });
      }
      if (caps['requires'] && !Array.isArray(caps['requires'])) {
        errors.push({
          line: this.findFieldLine(lines, 'requires'),
          message: '"capabilities.requires" must be an array',
          severity: 'error',
        });
      }
    }

    // Warn if no capabilities are declared
    if (!parsed['capabilities']) {
      errors.push({
        line: 1,
        message: 'No "capabilities" declared — plugin won\'t participate in composition',
        severity: 'warning',
      });
    }

    const hasErrors = errors.some((e) => e.severity === 'error');
    return { file: relativePath, valid: !hasErrors, errors };
  }

  // -------------------------------------------------------------------------
  // Internal: markdown file validation
  // -------------------------------------------------------------------------

  /**
   * Validate a file based on its resource type. Commands and skills are
   * expected to be markdown files with YAML frontmatter. Source files and
   * config files get basic structural checks.
   */
  private validateFile(change: FileChange): ValidationResult {
    const fullPath = path.join(this.pluginPath, change.path);
    const errors: ValidationIssue[] = [];

    // Only validate markdown files in detail
    if (!change.path.endsWith('.md')) {
      // For non-markdown source files, just check they're readable
      if (change.type !== 'deleted') {
        try {
          fs.accessSync(fullPath, fs.constants.R_OK);
        } catch {
          errors.push({
            line: 1,
            message: `File is not readable: ${change.path}`,
            severity: 'error',
          });
        }
      }
      return { file: change.path, valid: errors.length === 0, errors };
    }

    // Read the markdown file
    let content: string;
    try {
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch (err) {
      errors.push({
        line: 1,
        message: `Cannot read file: ${(err as Error).message}`,
        severity: 'error',
      });
      return { file: change.path, valid: false, errors };
    }

    const lines = content.split('\n');

    // Check for YAML frontmatter (must start with ---)
    if (lines[0] !== '---') {
      errors.push({
        line: 1,
        message: 'Missing YAML frontmatter (file must start with "---")',
        severity: 'error',
      });
      return { file: change.path, valid: false, errors };
    }

    // Find the closing --- of the frontmatter
    let frontmatterEnd = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        frontmatterEnd = i;
        break;
      }
    }

    if (frontmatterEnd === -1) {
      errors.push({
        line: 1,
        message: 'Unclosed YAML frontmatter (missing closing "---")',
        severity: 'error',
      });
      return { file: change.path, valid: false, errors };
    }

    // Parse the frontmatter (basic YAML key: value parsing)
    const frontmatterLines = lines.slice(1, frontmatterEnd);
    const frontmatter: Record<string, string> = {};
    for (let i = 0; i < frontmatterLines.length; i++) {
      const fmLine = frontmatterLines[i];
      const colonIdx = fmLine.indexOf(':');
      if (colonIdx > 0) {
        const key = fmLine.substring(0, colonIdx).trim();
        const value = fmLine.substring(colonIdx + 1).trim();
        frontmatter[key] = value;
      }
    }

    // Validate required frontmatter fields based on resource type
    if (change.resourceType === 'command') {
      // Commands require: name, description
      if (!frontmatter['name']) {
        errors.push({
          line: this.findFrontmatterFieldLine(lines, 'name', frontmatterEnd),
          message: 'Command is missing required frontmatter field "name"',
          severity: 'error',
        });
      }
      if (!frontmatter['description']) {
        errors.push({
          line: this.findFrontmatterFieldLine(lines, 'description', frontmatterEnd),
          message: 'Command is missing required frontmatter field "description"',
          severity: 'warning',
        });
      }
    }

    if (change.resourceType === 'skill') {
      // Skills require: name, description
      if (!frontmatter['name']) {
        errors.push({
          line: this.findFrontmatterFieldLine(lines, 'name', frontmatterEnd),
          message: 'Skill is missing required frontmatter field "name"',
          severity: 'error',
        });
      }
      if (!frontmatter['description']) {
        errors.push({
          line: this.findFrontmatterFieldLine(lines, 'description', frontmatterEnd),
          message: 'Skill is missing required frontmatter field "description"',
          severity: 'warning',
        });
      }
    }

    // Check for a top-level heading after the frontmatter (best practice)
    const bodyStart = frontmatterEnd + 1;
    let hasHeading = false;
    for (let i = bodyStart; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === '') continue;
      if (trimmed.startsWith('# ')) {
        hasHeading = true;
      }
      break; // Only check first non-empty line
    }
    if (!hasHeading) {
      errors.push({
        line: bodyStart + 1,
        message: 'Missing top-level heading (# Title) after frontmatter',
        severity: 'info',
      });
    }

    const hasErrors = errors.some((e) => e.severity === 'error');
    return { file: change.path, valid: !hasErrors, errors };
  }

  // -------------------------------------------------------------------------
  // Internal: resource building
  // -------------------------------------------------------------------------

  /**
   * Build a RegisteredResource from a file change and its validation result.
   * Extracts the resource name from the file path or frontmatter.
   */
  private buildResource(change: FileChange, validation: ValidationResult): RegisteredResource {
    // Derive name from file path: commands/dev.md -> "/mp:dev", skills/security/SKILL.md -> "security"
    let name = path.basename(change.path, path.extname(change.path));

    if (change.resourceType === 'command') {
      name = `/mp:${name}`;
    } else if (change.resourceType === 'skill' && name === 'SKILL') {
      // For SKILL.md files, use the parent directory name
      const parts = change.path.replace(/\\/g, '/').split('/');
      name = parts.length >= 2 ? parts[parts.length - 2] : name;
    }

    return {
      type: change.resourceType,
      name,
      path: change.path,
      hash: change.hash,
      loadedAt: new Date().toISOString(),
      valid: validation.valid,
      validationIssues: validation.errors,
    };
  }

  // -------------------------------------------------------------------------
  // Internal: helpers
  // -------------------------------------------------------------------------

  /** Find the 1-based line number where a JSON field key appears. */
  private findFieldLine(lines: string[], fieldName: string): number {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`"${fieldName}"`)) {
        return i + 1; // 1-based
      }
    }
    return 1; // Fallback to line 1
  }

  /** Find the line number for a frontmatter field, or return the end of frontmatter. */
  private findFrontmatterFieldLine(lines: string[], fieldName: string, frontmatterEnd: number): number {
    for (let i = 1; i < frontmatterEnd; i++) {
      if (lines[i].startsWith(fieldName + ':') || lines[i].startsWith(fieldName + ' :')) {
        return i + 1; // 1-based
      }
    }
    return frontmatterEnd + 1; // Insert point (after frontmatter)
  }

  /** Recursively list all files in a directory. */
  private walkDirectory(dirPath: string): string[] {
    const results: string[] = [];
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return results;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkDirectory(fullPath));
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }

    return results;
  }
}


// ===========================================================================
// PluginPlayground — Isolated command execution with fixture recording
// ===========================================================================

/**
 * Creates an isolated execution context for testing plugin commands without
 * affecting the real plugin registry. Records all invocations as test fixtures
 * that can be saved and replayed for regression testing.
 *
 * The playground maintains:
 *   - A mock capability registry (simulates external dependencies)
 *   - A command invocation log (input/output pairs)
 *   - A fixture store (persisted JSON files in tests/fixtures/)
 *
 * This enables "record-replay" testing: run a command interactively during
 * development, save the fixture, then replay it in CI to verify the command
 * still produces the same output after code changes.
 */
export class PluginPlayground {
  private readonly pluginPath: string;
  private readonly fixturesDir: string;

  /** Mock capabilities available in the playground environment. */
  private capabilities: Map<string, MockCapability> = new Map();

  /** In-memory log of all command invocations during this session. */
  private invocationLog: TestFixture[] = [];

  constructor(pluginPath: string) {
    this.pluginPath = path.resolve(pluginPath);
    this.fixturesDir = path.join(this.pluginPath, 'tests', 'fixtures');
  }

  // -------------------------------------------------------------------------
  // Mock capability management
  // -------------------------------------------------------------------------

  /**
   * Register a mock capability in the playground. This simulates an
   * external plugin providing a capability that the plugin-under-test
   * depends on.
   */
  registerCapability(capability: MockCapability): void {
    this.capabilities.set(capability.name, capability);
  }

  /** Remove a mock capability from the playground. */
  unregisterCapability(name: string): void {
    this.capabilities.delete(name);
  }

  /** Check if a capability is available (for command dependency resolution). */
  hasCapability(name: string): boolean {
    return this.capabilities.has(name);
  }

  /** Get all registered mock capabilities. */
  getCapabilities(): MockCapability[] {
    return Array.from(this.capabilities.values());
  }

  // -------------------------------------------------------------------------
  // Command execution with recording
  // -------------------------------------------------------------------------

  /**
   * Execute a plugin command in the isolated playground context. Records
   * the full invocation (input + output) and returns the result.
   *
   * In this implementation, "execution" is a simulation — we record the
   * command invocation metadata rather than actually running the command,
   * since real command execution requires the Claude Code runtime. The
   * recording can then be used for fixture-based testing.
   *
   * @param command  - Slash command name (e.g. "/mp:compose")
   * @param args     - Positional arguments
   * @param env      - Additional environment/context data
   * @returns The recorded test fixture
   */
  execute(
    command: string,
    args: string[] = [],
    env: Record<string, unknown> = {},
  ): TestFixture {
    const fixture: TestFixture = {
      id: this.generateId(),
      name: `${command} ${args.join(' ')}`.trim(),
      timestamp: new Date().toISOString(),
      command,
      arguments: args,
      input: {
        ...env,
        availableCapabilities: Array.from(this.capabilities.keys()),
        pluginPath: this.pluginPath,
      },
      output: {
        text: '',
        toolCalls: [],
        filesModified: [],
      },
    };

    this.invocationLog.push(fixture);
    return fixture;
  }

  /**
   * Update the output of a previously executed fixture. Called after the
   * command has finished executing to record its actual output.
   */
  recordOutput(
    fixtureId: string,
    output: { text: string; toolCalls: string[]; filesModified: string[] },
  ): void {
    const fixture = this.invocationLog.find((f) => f.id === fixtureId);
    if (fixture) {
      fixture.output = output;
    }
  }

  // -------------------------------------------------------------------------
  // Fixture persistence
  // -------------------------------------------------------------------------

  /**
   * Save a fixture to disk as a JSON file in tests/fixtures/.
   * Creates the directory if it doesn't exist.
   */
  saveFixture(fixture: TestFixture): string {
    // Ensure the fixtures directory exists
    if (!fs.existsSync(this.fixturesDir)) {
      fs.mkdirSync(this.fixturesDir, { recursive: true });
    }

    // Sanitize the fixture name for use as a filename
    const safeName = fixture.name
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 64);

    const filename = `${safeName}-${fixture.id.substring(0, 8)}.json`;
    const filePath = path.join(this.fixturesDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(fixture, null, 2), 'utf-8');
    return filePath;
  }

  /**
   * Load all fixtures from the tests/fixtures/ directory.
   */
  loadFixtures(): TestFixture[] {
    if (!fs.existsSync(this.fixturesDir)) {
      return [];
    }

    const files = fs.readdirSync(this.fixturesDir).filter((f) => f.endsWith('.json'));
    const fixtures: TestFixture[] = [];

    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(this.fixturesDir, file), 'utf-8');
        const parsed = JSON.parse(raw) as TestFixture;
        if (parsed.id && parsed.command) {
          fixtures.push(parsed);
        }
      } catch {
        // Skip corrupt fixture files
      }
    }

    return fixtures;
  }

  /**
   * Replay a saved fixture and compare its output against the recorded output.
   * This is a structural comparison — it checks that the output text,
   * tool calls, and files modified are the same.
   */
  replayFixture(fixture: TestFixture): FixtureReplayResult {
    // Re-execute the command in the playground
    const replayed = this.execute(fixture.command, fixture.arguments, fixture.input);

    // Compare outputs
    const diffs: Array<{ field: string; expected: unknown; actual: unknown }> = [];

    if (replayed.output.text !== fixture.output.text) {
      diffs.push({
        field: 'output.text',
        expected: fixture.output.text,
        actual: replayed.output.text,
      });
    }

    // Compare tool calls (order-sensitive)
    if (JSON.stringify(replayed.output.toolCalls) !== JSON.stringify(fixture.output.toolCalls)) {
      diffs.push({
        field: 'output.toolCalls',
        expected: fixture.output.toolCalls,
        actual: replayed.output.toolCalls,
      });
    }

    // Compare files modified (order-insensitive)
    const expectedFiles = [...fixture.output.filesModified].sort();
    const actualFiles = [...replayed.output.filesModified].sort();
    if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles)) {
      diffs.push({
        field: 'output.filesModified',
        expected: expectedFiles,
        actual: actualFiles,
      });
    }

    return {
      fixture,
      passed: diffs.length === 0,
      diffs,
    };
  }

  /** Get the invocation log from this session. */
  getInvocationLog(): TestFixture[] {
    return [...this.invocationLog];
  }

  /** Clear the invocation log. */
  clearLog(): void {
    this.invocationLog = [];
  }

  // -------------------------------------------------------------------------
  // Internal: ID generation
  // -------------------------------------------------------------------------

  /**
   * Generate a pseudo-random UUID v4 string. Uses Math.random because we
   * don't need cryptographic randomness for fixture IDs.
   */
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}


// ===========================================================================
// DependencyGraphRenderer — ASCII + Mermaid dependency visualization
// ===========================================================================

/**
 * Reads a plugin's manifest and resource files to build a comprehensive
 * dependency graph, then renders it as both ASCII art and a Mermaid diagram.
 *
 * The graph captures:
 *   - Plugin-level capability declarations (provides, requires, conflicts)
 *   - Inter-resource dependencies (commands -> agents -> skills)
 *   - Inferred from file content: agent references, skill references
 *
 * The ASCII output uses Unicode box-drawing characters for a clean tree view.
 * The Mermaid output can be pasted into any Mermaid-compatible renderer
 * (GitHub markdown, Notion, Mermaid Live Editor, etc.).
 */
export class DependencyGraphRenderer {
  private readonly pluginPath: string;

  constructor(pluginPath: string) {
    this.pluginPath = path.resolve(pluginPath);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Build the complete dependency graph for the plugin. Reads the manifest,
   * scans resource directories, and renders both ASCII and Mermaid output.
   */
  build(): ResourceGraph {
    const manifest = this.readManifest();
    const pluginName = (manifest['name'] as string) || path.basename(this.pluginPath);
    const capabilities = manifest['capabilities'] as Record<string, unknown> | undefined;

    const provides = (capabilities?.['provides'] as string[]) || [];
    const requires = (capabilities?.['requires'] as string[]) || [];
    const conflicts = (capabilities?.['conflicts'] as string[]) || [];

    // Scan resources and build dependency links
    const resources = this.scanResources();

    // Render both output formats
    const ascii = this.renderAscii(pluginName, provides, requires, conflicts, resources);
    const mermaid = this.renderMermaid(pluginName, provides, requires, conflicts, resources);

    return { plugin: pluginName, provides, requires, conflicts, resources, ascii, mermaid };
  }

  // -------------------------------------------------------------------------
  // Internal: manifest reading
  // -------------------------------------------------------------------------

  private readManifest(): Record<string, unknown> {
    const manifestPath = path.join(this.pluginPath, '.claude-plugin', 'plugin.json');

    if (!fs.existsSync(manifestPath)) {
      throw new DevStudioError(
        `Plugin manifest not found: ${manifestPath}`,
        DevStudioErrorCode.MANIFEST_MISSING,
        { path: manifestPath },
      );
    }

    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      throw new DevStudioError(
        `Invalid plugin manifest: ${(err as Error).message}`,
        DevStudioErrorCode.MANIFEST_INVALID,
        { path: manifestPath, error: (err as Error).message },
      );
    }
  }

  // -------------------------------------------------------------------------
  // Internal: resource scanning
  // -------------------------------------------------------------------------

  /**
   * Scan the plugin's commands/, skills/, and agents/ directories to discover
   * resources and infer their inter-dependencies from file content.
   *
   * Dependency inference heuristics:
   *   - If a command markdown mentions "agents/X" or "agent: X", it depends on agent X
   *   - If a command/agent mentions "skills/X" or "skill: X", it depends on skill X
   *   - These are best-effort heuristics; real resolution happens at runtime
   */
  private scanResources(): ResourceNode[] {
    const resources: ResourceNode[] = [];

    // Scan commands
    const commandsDir = path.join(this.pluginPath, 'commands');
    if (fs.existsSync(commandsDir)) {
      const commandFiles = this.walkMarkdownFiles(commandsDir);
      for (const filePath of commandFiles) {
        const name = '/mp:' + path.basename(filePath, '.md');
        const content = fs.readFileSync(filePath, 'utf-8');
        const deps = this.extractDependencies(content);
        resources.push({ type: 'command', name, dependsOn: deps });
      }
    }

    // Scan skills
    const skillsDir = path.join(this.pluginPath, 'skills');
    if (fs.existsSync(skillsDir)) {
      const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true });
      for (const entry of skillDirs) {
        if (entry.isDirectory()) {
          const skillMd = path.join(skillsDir, entry.name, 'SKILL.md');
          if (fs.existsSync(skillMd)) {
            const content = fs.readFileSync(skillMd, 'utf-8');
            const deps = this.extractDependencies(content);
            resources.push({ type: 'skill', name: entry.name, dependsOn: deps });
          }
        }
      }
    }

    // Scan agents
    const agentsDir = path.join(this.pluginPath, 'agents');
    if (fs.existsSync(agentsDir)) {
      const agentFiles = this.walkMarkdownFiles(agentsDir);
      for (const filePath of agentFiles) {
        const name = path.basename(filePath, '.md');
        const content = fs.readFileSync(filePath, 'utf-8');
        const deps = this.extractDependencies(content);
        resources.push({ type: 'agent', name, dependsOn: deps });
      }
    }

    return resources;
  }

  /**
   * Extract dependency references from markdown content using regex heuristics.
   *
   * Patterns matched:
   *   - agents/NAME   or  agent: NAME   or  agent-name: NAME
   *   - skills/NAME   or  skill: NAME
   *   - Related-skills frontmatter lists
   */
  private extractDependencies(content: string): string[] {
    const deps: Set<string> = new Set();

    // Match "agents/NAME" path references
    const agentPathRe = /agents\/([a-zA-Z0-9_-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = agentPathRe.exec(content)) !== null) {
      deps.add(`agents/${match[1]}`);
    }

    // Match "skills/NAME" path references
    const skillPathRe = /skills\/([a-zA-Z0-9_-]+)/g;
    while ((match = skillPathRe.exec(content)) !== null) {
      deps.add(`skills/${match[1]}`);
    }

    // Match "related-skills:" frontmatter (YAML list items)
    const relatedSkillsRe = /related-skills:\s*\n((?:\s*-\s*.+\n)*)/;
    const relatedMatch = relatedSkillsRe.exec(content);
    if (relatedMatch) {
      const items = relatedMatch[1].matchAll(/\s*-\s*([a-zA-Z0-9_-]+)/g);
      for (const item of items) {
        deps.add(`skills/${item[1]}`);
      }
    }

    return Array.from(deps);
  }

  // -------------------------------------------------------------------------
  // Internal: ASCII rendering
  // -------------------------------------------------------------------------

  /**
   * Render the dependency graph as an ASCII art tree using Unicode
   * box-drawing characters.
   *
   * Output format:
   *   plugin-name
   *   +-- provides: [cap1, cap2, ...]
   *   +-- requires: [cap1]
   *   +-- conflicts: []
   *   \-- resources:
   *       +-- /mp:compose --> agents/composer
   *       +-- /mp:trust --> skills/security
   *       \-- /mp:dev --> [hot-reload runtime]
   */
  private renderAscii(
    pluginName: string,
    provides: string[],
    requires: string[],
    conflicts: string[],
    resources: ResourceNode[],
  ): string {
    const lines: string[] = [];

    // Plugin name header
    lines.push(pluginName);

    // Capability declarations
    lines.push(`\u251C\u2500\u2500 provides: [${provides.join(', ')}]`);
    lines.push(`\u251C\u2500\u2500 requires: [${requires.join(', ')}]`);
    lines.push(`\u251C\u2500\u2500 conflicts: [${conflicts.join(', ')}]`);

    // Resources section
    if (resources.length === 0) {
      lines.push(`\u2514\u2500\u2500 resources: (none)`);
    } else {
      lines.push(`\u2514\u2500\u2500 resources:`);

      for (let i = 0; i < resources.length; i++) {
        const res = resources[i];
        const isLast = i === resources.length - 1;
        const prefix = isLast ? '    \u2514\u2500\u2500 ' : '    \u251C\u2500\u2500 ';

        if (res.dependsOn.length > 0) {
          const depStr = res.dependsOn.join(', ');
          lines.push(`${prefix}${res.name} \u2500\u2500\u2192 ${depStr}`);
        } else {
          lines.push(`${prefix}${res.name}`);
        }
      }
    }

    return lines.join('\n');
  }

  // -------------------------------------------------------------------------
  // Internal: Mermaid rendering
  // -------------------------------------------------------------------------

  /**
   * Render the dependency graph as a Mermaid diagram source string.
   * Uses a top-down flowchart layout.
   *
   * Output format:
   *   graph TD
   *     plugin["plugin-name"]
   *     plugin --> provides["provides: cap1, cap2"]
   *     plugin --> requires["requires: cap1"]
   *     plugin --> cmd1["/mp:compose"]
   *     cmd1 --> agents_composer["agents/composer"]
   */
  private renderMermaid(
    pluginName: string,
    provides: string[],
    requires: string[],
    conflicts: string[],
    resources: ResourceNode[],
  ): string {
    const lines: string[] = [];
    lines.push('graph TD');

    // Sanitize IDs for Mermaid (alphanumeric + underscore only)
    const sanitizeId = (s: string): string =>
      s.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

    const pluginId = sanitizeId(pluginName);

    // Plugin node (rounded box)
    lines.push(`  ${pluginId}["${pluginName}"]`);

    // Capability nodes
    if (provides.length > 0) {
      const provId = `${pluginId}_provides`;
      lines.push(`  ${provId}["provides: ${provides.join(', ')}"]`);
      lines.push(`  ${pluginId} --> ${provId}`);
    }

    if (requires.length > 0) {
      const reqId = `${pluginId}_requires`;
      lines.push(`  ${reqId}["requires: ${requires.join(', ')}"]`);
      lines.push(`  ${pluginId} -.-> ${reqId}`);
    }

    if (conflicts.length > 0) {
      const confId = `${pluginId}_conflicts`;
      lines.push(`  ${confId}["conflicts: ${conflicts.join(', ')}"]`);
      lines.push(`  ${pluginId} -.- ${confId}`);
    }

    // Resource nodes
    for (const res of resources) {
      const resId = sanitizeId(`${res.type}_${res.name}`);
      const shape = res.type === 'command' ? `[["${res.name}"]]`
        : res.type === 'agent' ? `(["${res.name}"])`
        : `("${res.name}")`;

      lines.push(`  ${resId}${shape}`);
      lines.push(`  ${pluginId} --> ${resId}`);

      // Dependency edges
      for (const dep of res.dependsOn) {
        const depId = sanitizeId(dep);
        // Ensure the dependency node exists (it might be an external reference)
        lines.push(`  ${depId}("${dep}")`);
        lines.push(`  ${resId} --> ${depId}`);
      }
    }

    // Style definitions
    lines.push('');
    lines.push(`  style ${pluginId} fill:#4a90d9,stroke:#2c5aa0,color:#fff`);

    // Style resource nodes by type
    for (const res of resources) {
      const resId = sanitizeId(`${res.type}_${res.name}`);
      if (res.type === 'command') {
        lines.push(`  style ${resId} fill:#27ae60,stroke:#1e8449,color:#fff`);
      } else if (res.type === 'agent') {
        lines.push(`  style ${resId} fill:#e67e22,stroke:#d35400,color:#fff`);
      } else if (res.type === 'skill') {
        lines.push(`  style ${resId} fill:#8e44ad,stroke:#6c3483,color:#fff`);
      }
    }

    return lines.join('\n');
  }

  // -------------------------------------------------------------------------
  // Internal: file system helpers
  // -------------------------------------------------------------------------

  /** Recursively find all .md files in a directory. */
  private walkMarkdownFiles(dirPath: string): string[] {
    const results: string[] = [];
    let entries: fs.Dirent[];

    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return results;
    }

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }

    return results;
  }
}


// ===========================================================================
// DevServer — Top-level orchestrator that ties everything together
// ===========================================================================

/**
 * The DevServer is the main entry point for the dev studio. It creates and
 * coordinates the FileWatcher, HotReloader, PluginPlayground, and
 * DependencyGraphRenderer to provide a unified development experience.
 *
 * Lifecycle:
 *   1. start()  — Initializes all subsystems, performs initial validation
 *   2. Running  — FileWatcher detects changes -> HotReloader processes them
 *   3. stop()   — Tears down watchers and cleans up
 *
 * The dev server also exposes the playground and graph renderer for
 * interactive use through the /mp:dev command.
 */
export class DevServer {
  private readonly config: DevServerConfig;

  private watcher: FileWatcher | null = null;
  private reloader: HotReloader | null = null;
  private playground: PluginPlayground | null = null;
  private graphRenderer: DependencyGraphRenderer | null = null;

  private state: DevServerState = 'stopped';
  private startTime: number = 0;
  private lastReloadTimestamp: string | null = null;

  /** Accumulated log of all reload results for the session. */
  private reloadHistory: ReloadResult[] = [];

  constructor(config: DevServerConfig) {
    this.config = {
      ...config,
      pluginPath: path.resolve(config.pluginPath),
    };
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Start the dev server. Initializes all subsystems and begins watching
   * for file changes if enabled.
   */
  async start(): Promise<ReloadResult> {
    if (this.state === 'running') {
      throw new DevStudioError(
        'Dev server is already running',
        DevStudioErrorCode.ALREADY_RUNNING,
      );
    }

    this.state = 'starting';
    this.startTime = Date.now();

    try {
      // Initialize subsystems
      this.reloader = new HotReloader(this.config.pluginPath);
      this.graphRenderer = new DependencyGraphRenderer(this.config.pluginPath);

      if (this.config.playground) {
        this.playground = new PluginPlayground(this.config.pluginPath);
      }

      // Perform initial full validation
      const initialResult = this.reloader.fullValidation();
      this.reloadHistory.push(initialResult);
      this.lastReloadTimestamp = initialResult.timestamp;

      // Start file watcher if enabled
      if (this.config.watch) {
        this.watcher = new FileWatcher({
          pluginPath: this.config.pluginPath,
          debounceMs: 100,
        });

        this.watcher.onChange((changes) => {
          this.handleChanges(changes);
        });

        await this.watcher.start();
      }

      this.state = 'running';
      return initialResult;
    } catch (error) {
      this.state = 'error';
      throw error;
    }
  }

  /** Stop the dev server and clean up all resources. */
  stop(): void {
    if (this.watcher) {
      this.watcher.stop();
      this.watcher = null;
    }
    this.state = 'stopped';
  }

  // -------------------------------------------------------------------------
  // Status and introspection
  // -------------------------------------------------------------------------

  /** Get the current status of the dev server. */
  getStatus(): DevServerStatus {
    const registry = this.reloader?.getRegistry();
    const manifest = this.reloader?.getManifest();

    let errorCount = 0;
    let warningCount = 0;
    if (registry) {
      for (const resource of registry.values()) {
        for (const issue of resource.validationIssues) {
          if (issue.severity === 'error') errorCount++;
          if (issue.severity === 'warning') warningCount++;
        }
      }
    }

    return {
      state: this.state,
      pluginName: (manifest?.['name'] as string) || 'unknown',
      pluginPath: this.config.pluginPath,
      resourceCount: registry?.size || 0,
      errorCount,
      warningCount,
      reloadCount: this.reloader?.getReloadCount() || 0,
      lastReload: this.lastReloadTimestamp,
      uptimeMs: this.state === 'running' ? Date.now() - this.startTime : 0,
    };
  }

  /** Get the PluginPlayground instance (null if playground is disabled). */
  getPlayground(): PluginPlayground | null {
    return this.playground;
  }

  /** Get the DependencyGraphRenderer instance. */
  getGraphRenderer(): DependencyGraphRenderer | null {
    return this.graphRenderer;
  }

  /** Get the HotReloader instance. */
  getReloader(): HotReloader | null {
    return this.reloader;
  }

  /** Get the full reload history for this session. */
  getReloadHistory(): ReloadResult[] {
    return [...this.reloadHistory];
  }

  // -------------------------------------------------------------------------
  // Internal: change handling
  // -------------------------------------------------------------------------

  /**
   * Process file changes from the watcher through the hot-reloader.
   * Logs the result and updates the last reload timestamp.
   */
  private handleChanges(changes: FileChange[]): void {
    if (!this.reloader) return;

    try {
      const result = this.reloader.reload(changes);
      this.reloadHistory.push(result);
      this.lastReloadTimestamp = result.timestamp;

      // Log the reload summary to console
      this.logReloadResult(result, changes);
    } catch (error) {
      console.error(`[DevServer] Reload failed: ${(error as Error).message}`);
    }
  }

  /**
   * Print a human-readable summary of a reload cycle to the console.
   * Uses color-like prefixes for quick scanning.
   */
  private logReloadResult(result: ReloadResult, changes: FileChange[]): void {
    const changeTypes = changes.map((c) => `${c.type}:${c.path}`);
    console.log(`\n[DevServer] Hot-reload #${this.reloader?.getReloadCount()}`);
    console.log(`  Changes: ${changeTypes.join(', ')}`);

    if (result.added.length > 0) {
      console.log(`  + Added: ${result.added.map((r) => r.name).join(', ')}`);
    }
    if (result.updated.length > 0) {
      console.log(`  ~ Updated: ${result.updated.map((r) => r.name).join(', ')}`);
    }
    if (result.removed.length > 0) {
      console.log(`  - Removed: ${result.removed.join(', ')}`);
    }

    // Print validation issues with file:line references
    for (const validation of result.validations) {
      for (const issue of validation.errors) {
        const prefix =
          issue.severity === 'error' ? 'ERR' :
          issue.severity === 'warning' ? 'WRN' : 'INF';
        console.log(`  [${prefix}] ${validation.file}:${issue.line} ${issue.message}`);
      }
    }

    if (result.allValid) {
      console.log('  Status: All resources valid');
    } else {
      console.log('  Status: Validation errors detected');
    }
  }
}
