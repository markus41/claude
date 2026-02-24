/**
 * Federated Registry Protocol — Core Engine
 *
 * Implements multi-registry plugin resolution with policy enforcement,
 * conflict detection, and reproducible lockfile management.
 *
 * Architecture:
 *   RegistryClient  — Fetches and caches registry indexes
 *   RegistryResolver — Resolves plugin names across federated registries
 *   PolicyEngine    — Evaluates install/deny/require rules
 *   LockfileManager — Generates and verifies deterministic lockfiles
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

import type {
  RegistryConfig,
  FederationConfig,
  RegistryIndex,
  RegistryPluginEntry,
  CachedRegistry,
  ResolvedPlugin,
  RegistryConflict,
  PolicyRule,
  PolicyConfig,
  PolicyDecision,
  Lockfile,
  LockfileEntry,
  LockfileDiff,
} from './types.js';

import { FederationError, FederationErrorCode } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal glob matcher supporting `*` (any chars) and `?` (one char). */
function globMatch(pattern: string, value: string): boolean {
  // Escape regex-special chars except our glob wildcards
  const regex = pattern
    .replace(/([.+^${}()|[\]\\])/g, '\\$1')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regex}$`).test(value);
}

/** Parse a comparison expression like ">= 80" into operator and numeric value. */
function parseComparison(expr: string): { op: string; value: number } | null {
  const match = expr.trim().match(/^(>=|<=|>|<|==|!=)\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return { op: match[1], value: parseFloat(match[2]) };
}

/** Evaluate a comparison expression against a numeric value. */
function evalComparison(expr: string, actual: number): boolean {
  const parsed = parseComparison(expr);
  if (!parsed) return false;
  switch (parsed.op) {
    case '>=': return actual >= parsed.value;
    case '<=': return actual <= parsed.value;
    case '>':  return actual > parsed.value;
    case '<':  return actual < parsed.value;
    case '==': return actual === parsed.value;
    case '!=': return actual !== parsed.value;
    default:   return false;
  }
}

/** Compute SHA-256 hex digest of a string. */
function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/** Read a JSON file, returning null on failure. */
function readJsonFile<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Read a YAML-like policy file (simplified parser for the defined schema). */
function readPolicyFile(filePath: string): PolicyConfig | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return parseSimpleYaml(raw);
  } catch {
    return null;
  }
}

/**
 * Minimal YAML parser for the policy file format.
 *
 * Handles the specific structure defined in the spec:
 *   rules:
 *     - action: allow|deny|require
 *       plugins: ["pattern*"]
 *       source: "registry-name"
 *       unless:
 *         trust_score: ">= 80"
 *         signed: true
 *       reason: "explanation"
 *
 * This is intentionally minimal — not a full YAML parser. It handles
 * the defined schema reliably without requiring a YAML dependency.
 */
function parseSimpleYaml(content: string): PolicyConfig {
  const rules: PolicyRule[] = [];
  const lines = content.split('\n');

  let currentRule: Partial<PolicyRule> | null = null;
  let inUnless = false;
  let inPlugins = false;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip comments and blank lines
    if (/^\s*#/.test(line) || /^\s*$/.test(line)) continue;

    // Top-level "rules:" key
    if (/^rules:\s*$/.test(line)) continue;

    // New rule item
    if (/^\s{2,4}-\s+action:\s*(.+)$/.test(line)) {
      if (currentRule && currentRule.action) {
        rules.push(finalizeRule(currentRule));
      }
      const match = line.match(/action:\s*(.+)$/);
      currentRule = {
        action: match![1].trim().replace(/["']/g, '') as PolicyRule['action'],
        plugins: [],
      };
      inUnless = false;
      inPlugins = false;
      continue;
    }

    if (!currentRule) continue;

    // plugins as inline array: plugins: ["pattern1", "pattern2"]
    const inlinePlugins = line.match(/^\s+plugins:\s*\[([^\]]*)\]\s*$/);
    if (inlinePlugins) {
      currentRule.plugins = inlinePlugins[1]
        .split(',')
        .map(s => s.trim().replace(/["']/g, ''))
        .filter(Boolean);
      inPlugins = false;
      inUnless = false;
      continue;
    }

    // plugins as list header
    if (/^\s+plugins:\s*$/.test(line)) {
      inPlugins = true;
      inUnless = false;
      continue;
    }

    // plugins list item
    if (inPlugins && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').trim().replace(/["']/g, '');
      currentRule.plugins = currentRule.plugins || [];
      currentRule.plugins.push(val);
      continue;
    } else if (inPlugins && !/^\s+-/.test(line)) {
      inPlugins = false;
    }

    // source
    const sourceMatch = line.match(/^\s+source:\s*["']?([^"'\s]+)["']?\s*$/);
    if (sourceMatch) {
      currentRule.source = sourceMatch[1];
      inUnless = false;
      continue;
    }

    // unless block header
    if (/^\s+unless:\s*$/.test(line)) {
      currentRule.unless = {};
      inUnless = true;
      continue;
    }

    // unless properties
    if (inUnless) {
      const trustMatch = line.match(/^\s+trust_score:\s*["']?([^"'\n]+)["']?\s*$/);
      if (trustMatch) {
        currentRule.unless = currentRule.unless || {};
        currentRule.unless.trust_score = trustMatch[1].trim();
        continue;
      }
      const signedMatch = line.match(/^\s+signed:\s*(true|false)\s*$/);
      if (signedMatch) {
        currentRule.unless = currentRule.unless || {};
        currentRule.unless.signed = signedMatch[1] === 'true';
        continue;
      }
      // Any non-indented-enough line ends unless block
      if (!/^\s{6,}/.test(line)) {
        inUnless = false;
      }
    }

    // reason
    const reasonMatch = line.match(/^\s+reason:\s*["']?(.+?)["']?\s*$/);
    if (reasonMatch) {
      currentRule.reason = reasonMatch[1];
      inUnless = false;
      continue;
    }
  }

  // Push final rule
  if (currentRule && currentRule.action) {
    rules.push(finalizeRule(currentRule));
  }

  return { rules };
}

function finalizeRule(partial: Partial<PolicyRule>): PolicyRule {
  return {
    action: partial.action || 'deny',
    plugins: partial.plugins || ['*'],
    source: partial.source,
    unless: partial.unless,
    reason: partial.reason || 'No reason specified',
  };
}

// ---------------------------------------------------------------------------
// RegistryClient
// ---------------------------------------------------------------------------

/**
 * Fetches and caches plugin indexes from configured registry sources.
 *
 * Handles both local file paths and remote URLs. Failed fetches are
 * recorded but do not block resolution — unavailable registries are
 * skipped with a warning.
 */
export class RegistryClient {
  private cache: Map<string, CachedRegistry> = new Map();
  private config: FederationConfig;
  private projectRoot: string;
  private warnings: string[] = [];

  constructor(projectRoot: string, config?: FederationConfig) {
    this.projectRoot = projectRoot;

    if (config) {
      this.config = config;
    } else {
      this.config = this.loadConfig();
    }
  }

  /** Load federation configuration from the project. */
  private loadConfig(): FederationConfig {
    // Try project-level config first
    const projectConfig = path.join(this.projectRoot, '.claude', 'registries.json');
    const loaded = readJsonFile<FederationConfig>(projectConfig);
    if (loaded) return loaded;

    // Fall back to plugin-bundled default
    const defaultConfig = path.join(
      this.projectRoot, 'plugins', 'marketplace-pro', 'config', 'registries.default.json',
    );
    const fallback = readJsonFile<FederationConfig>(defaultConfig);
    if (fallback) return fallback;

    // Absolute minimum default
    return {
      registries: [
        {
          name: 'local',
          url: './plugins',
          priority: 100,
          policy: 'open' as const,
          enabled: true,
        },
      ],
      defaults: {
        cacheTTL: 3600,
        conflictResolution: 'highest-priority' as const,
      },
    };
  }

  /** Get the current federation configuration. */
  getConfig(): FederationConfig {
    return this.config;
  }

  /** Get accumulated warnings from fetch operations. */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /** Clear all cached data. */
  clearCache(): void {
    this.cache.clear();
  }

  /** Get all enabled registries sorted by priority (highest first). */
  getRegistries(): RegistryConfig[] {
    return this.config.registries
      .filter(r => r.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /** Add a registry to the configuration. */
  addRegistry(registry: RegistryConfig): void {
    // Remove existing with same name
    this.config.registries = this.config.registries.filter(r => r.name !== registry.name);
    this.config.registries.push(registry);
    // Invalidate cache for this registry
    this.cache.delete(registry.name);
  }

  /** Remove a registry from the configuration. */
  removeRegistry(name: string): boolean {
    const before = this.config.registries.length;
    this.config.registries = this.config.registries.filter(r => r.name !== name);
    this.cache.delete(name);
    return this.config.registries.length < before;
  }

  /** Save the current configuration back to the project. */
  saveConfig(): void {
    const configPath = path.join(this.projectRoot, '.claude', 'registries.json');
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2) + '\n', 'utf8');
  }

  /**
   * Fetch the plugin index from a single registry.
   *
   * For local paths, reads the directory or index file directly.
   * For remote URLs, performs an HTTP GET (using native fetch).
   * Results are cached according to the configured TTL.
   */
  async fetchRegistry(registry: RegistryConfig): Promise<CachedRegistry> {
    // Check cache first
    const cached = this.cache.get(registry.name);
    if (cached && Date.now() < cached.expiresAt) {
      return cached;
    }

    const ttl = this.config.defaults.cacheTTL * 1000;
    const now = Date.now();

    try {
      const index = await this.doFetch(registry);
      const entry: CachedRegistry = {
        config: registry,
        index,
        fetchedAt: now,
        expiresAt: now + ttl,
      };
      this.cache.set(registry.name, entry);
      return entry;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.warnings.push(`Registry "${registry.name}" unavailable: ${errorMsg}`);

      const entry: CachedRegistry = {
        config: registry,
        index: null,
        fetchedAt: now,
        expiresAt: now + ttl,
        error: errorMsg,
      };
      this.cache.set(registry.name, entry);
      return entry;
    }
  }

  /** Internal fetch dispatcher. */
  private async doFetch(registry: RegistryConfig): Promise<RegistryIndex> {
    const url = registry.url;

    // Local filesystem path
    if (url.startsWith('./') || url.startsWith('/') || url.startsWith('../')) {
      return this.fetchLocal(registry);
    }

    // Remote URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return this.fetchRemote(registry);
    }

    throw new FederationError(
      `Unsupported registry URL scheme: ${url}`,
      FederationErrorCode.CONFIG_ERROR,
    );
  }

  /** Fetch from a local filesystem path. */
  private fetchLocal(registry: RegistryConfig): RegistryIndex {
    const resolvedPath = path.resolve(this.projectRoot, registry.url);

    // If the path points to a JSON file, read it directly
    if (resolvedPath.endsWith('.json') && fs.existsSync(resolvedPath)) {
      const data = readJsonFile<RegistryIndex>(resolvedPath);
      if (data) return data;
      throw new Error(`Failed to parse registry index: ${resolvedPath}`);
    }

    // If it's a directory, scan for plugins with manifests
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
      return this.scanLocalDirectory(resolvedPath);
    }

    // Try as a file path without .json extension
    const withJson = resolvedPath + '/registry.json';
    if (fs.existsSync(withJson)) {
      const data = readJsonFile<RegistryIndex>(withJson);
      if (data) return data;
    }

    throw new Error(`Local registry path not found: ${resolvedPath}`);
  }

  /** Scan a local directory for plugin manifests and build an index. */
  private scanLocalDirectory(dirPath: string): RegistryIndex {
    const plugins: Record<string, RegistryPluginEntry> = {};

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      throw new Error(`Cannot read directory: ${dirPath}`);
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const manifestPath = path.join(dirPath, entry.name, '.claude-plugin', 'plugin.json');
      if (!fs.existsSync(manifestPath)) continue;

      const manifest = readJsonFile<Record<string, unknown>>(manifestPath);
      if (!manifest || typeof manifest.name !== 'string') continue;

      const name = manifest.name as string;
      const version = (manifest.version as string) || '0.0.0';
      const description = this.readContextDescription(dirPath, entry.name, manifest)
        || (manifest.description as string)
        || '';

      // Compute integrity from manifest content
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const integrity = 'sha256-' + sha256(manifestContent);

      plugins[name] = {
        name,
        version,
        description,
        integrity,
        resolved: path.join(dirPath, entry.name),
        dependencies: [],
        signed: false,
        trustScore: 50, // Local plugins get baseline trust
      };

      // Extract dependencies from capabilities.requires
      const capabilities = manifest.capabilities as Record<string, unknown> | undefined;
      if (capabilities && Array.isArray(capabilities.requires)) {
        plugins[name].dependencies = capabilities.requires as string[];
      }
    }

    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      plugins,
    };
  }


  /**
   * Read the plugin context entry and return a short description line.
   * Falls back to an empty string if the file is missing/unreadable.
   */
  private readContextDescription(dirPath: string, pluginDir: string, manifest: Record<string, unknown>): string {
    const contextPath = this.resolveBootstrapContextPath(dirPath, pluginDir, manifest);
    if (!contextPath || !fs.existsSync(contextPath)) return '';

    try {
      const lines = fs.readFileSync(contextPath, 'utf8')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));
      return lines[0] ?? '';
    } catch {
      return '';
    }
  }


  /** Resolve the first available bootstrap context file for registry indexing. */
  private resolveBootstrapContextPath(dirPath: string, pluginDir: string, manifest: Record<string, unknown>): string | null {
    const context = manifest.context as Record<string, unknown> | undefined;
    const bootstrapFiles = Array.isArray(context?.bootstrapFiles)
      ? context?.bootstrapFiles.filter((item): item is string => typeof item === 'string')
      : [];

    const candidates = [
      bootstrapFiles[0],
      typeof context?.entry === 'string' ? context.entry : undefined,
      typeof manifest.contextEntry === 'string' ? manifest.contextEntry : undefined,
      'CONTEXT_SUMMARY.md',
      'CONTEXT.md',
    ].filter((item): item is string => Boolean(item && item.trim()));

    for (const rel of candidates) {
      const fullPath = path.join(dirPath, pluginDir, rel);
      if (fs.existsSync(fullPath)) return fullPath;
    }

    return null;
  }

  /** Fetch from a remote URL. */
  private async fetchRemote(registry: RegistryConfig): Promise<RegistryIndex> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'marketplace-pro-federation/1.0',
    };

    // Add authentication headers
    if (registry.auth && registry.auth !== 'none') {
      const authHeader = this.resolveAuth(registry.auth);
      if (authHeader) {
        headers['Authorization'] = authHeader;
      }
    }

    const response = await fetch(registry.url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15_000), // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as RegistryIndex;

    // Validate basic structure
    if (!data.plugins || typeof data.plugins !== 'object') {
      throw new Error('Invalid registry index: missing "plugins" object');
    }

    return data;
  }

  /** Resolve an auth specification to an Authorization header value. */
  private resolveAuth(auth: string): string | null {
    if (auth.startsWith('token:')) {
      const envVar = auth.slice(6);
      const token = process.env[envVar];
      if (!token) {
        this.warnings.push(`Auth token env var "${envVar}" not set`);
        return null;
      }
      return `Bearer ${token}`;
    }

    if (auth.startsWith('oidc:')) {
      // OIDC would require a full OAuth flow — log warning for now
      this.warnings.push(`OIDC authentication not yet implemented for provider "${auth.slice(5)}"`);
      return null;
    }

    return null;
  }

  /**
   * Fetch all enabled registries concurrently.
   * Returns results in priority order (highest first).
   */
  async fetchAll(): Promise<CachedRegistry[]> {
    const registries = this.getRegistries();

    if (registries.length === 0) {
      throw new FederationError(
        'No registries configured',
        FederationErrorCode.NO_REGISTRIES,
      );
    }

    const results = await Promise.all(
      registries.map(r => this.fetchRegistry(r)),
    );

    // Check if all registries failed
    const available = results.filter(r => r.index !== null);
    if (available.length === 0) {
      throw new FederationError(
        'All registries are unavailable',
        FederationErrorCode.ALL_REGISTRIES_UNAVAILABLE,
        { errors: results.map(r => ({ name: r.config.name, error: r.error })) },
      );
    }

    return results;
  }

  /**
   * Sync (refresh) all registry caches, ignoring TTL.
   * Returns status for each registry.
   */
  async sync(): Promise<Array<{ name: string; status: 'ok' | 'error'; plugins?: number; error?: string }>> {
    // Clear cache to force re-fetch
    this.cache.clear();

    const registries = this.getRegistries();
    const results: Array<{ name: string; status: 'ok' | 'error'; plugins?: number; error?: string }> = [];

    for (const registry of registries) {
      const cached = await this.fetchRegistry(registry);
      if (cached.index) {
        results.push({
          name: registry.name,
          status: 'ok',
          plugins: Object.keys(cached.index.plugins).length,
        });
      } else {
        results.push({
          name: registry.name,
          status: 'error',
          error: cached.error,
        });
      }
    }

    return results;
  }
}

// ---------------------------------------------------------------------------
// RegistryResolver
// ---------------------------------------------------------------------------

/**
 * Resolves plugin names across multiple registries with conflict detection.
 *
 * Resolution order follows registry priority (highest first). When the same
 * plugin exists in multiple registries, conflicts are detected by comparing
 * SHA-256 content hashes. Resolution strategy is configurable:
 *   - highest-priority: use the first registry that has it
 *   - error: fail if there is a conflict
 *   - prompt: return conflict info for user decision
 */
export class RegistryResolver {
  private client: RegistryClient;

  constructor(client: RegistryClient) {
    this.client = client;
  }

  /**
   * Resolve a single plugin across all registries.
   *
   * @param pluginName — Name of the plugin to find
   * @returns Resolved plugin with provenance info, or throws if not found
   */
  async resolve(pluginName: string): Promise<ResolvedPlugin> {
    const allCached = await this.client.fetchAll();
    const config = this.client.getConfig();

    // Collect all sources that have this plugin
    const sources: Array<{
      registry: RegistryConfig;
      entry: RegistryPluginEntry;
    }> = [];

    for (const cached of allCached) {
      if (!cached.index) continue;
      const entry = cached.index.plugins[pluginName];
      if (entry) {
        sources.push({ registry: cached.config, entry });
      }
    }

    if (sources.length === 0) {
      throw new FederationError(
        `Plugin "${pluginName}" not found in any registry`,
        FederationErrorCode.PLUGIN_NOT_FOUND,
        { searched: allCached.map(c => c.config.name) },
      );
    }

    // Check for conflicts (different integrity hashes)
    const hasConflict = this.detectConflict(pluginName, sources);

    // Resolve based on strategy
    if (hasConflict && config.defaults.conflictResolution === 'error') {
      throw new FederationError(
        `Conflict: "${pluginName}" exists in multiple registries with different content`,
        FederationErrorCode.UNRESOLVED_CONFLICT,
        { conflict: hasConflict },
      );
    }

    // highest-priority (or prompt with fallback to highest)
    // Sources are already in priority order from fetchAll
    const winner = sources[0];

    return {
      name: pluginName,
      version: winner.entry.version,
      integrity: winner.entry.integrity,
      source: winner.registry.name,
      resolved: winner.entry.resolved,
      dependencies: winner.entry.dependencies || [],
      signed: winner.entry.signed || false,
      trustScore: winner.entry.trustScore || 0,
      hadConflicts: hasConflict !== null,
      conflicts: hasConflict || undefined,
    };
  }

  /**
   * Resolve multiple plugins, collecting results and errors.
   */
  async resolveAll(pluginNames: string[]): Promise<{
    resolved: ResolvedPlugin[];
    errors: Array<{ name: string; error: string }>;
    conflicts: RegistryConflict[];
  }> {
    const resolved: ResolvedPlugin[] = [];
    const errors: Array<{ name: string; error: string }> = [];
    const conflicts: RegistryConflict[] = [];

    for (const name of pluginNames) {
      try {
        const result = await this.resolve(name);
        resolved.push(result);
        if (result.conflicts) {
          conflicts.push(result.conflicts);
        }
      } catch (err) {
        errors.push({
          name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { resolved, errors, conflicts };
  }

  /**
   * Search for a plugin across all registries, returning all available
   * entries without resolving conflicts.
   */
  async search(pluginName: string): Promise<Array<{
    registry: string;
    entry: RegistryPluginEntry;
    priority: number;
  }>> {
    const allCached = await this.client.fetchAll();
    const results: Array<{
      registry: string;
      entry: RegistryPluginEntry;
      priority: number;
    }> = [];

    for (const cached of allCached) {
      if (!cached.index) continue;

      for (const [name, entry] of Object.entries(cached.index.plugins)) {
        if (globMatch(pluginName, name) || name.includes(pluginName)) {
          results.push({
            registry: cached.config.name,
            entry,
            priority: cached.config.priority,
          });
        }
      }
    }

    return results.sort((a, b) => b.priority - a.priority);
  }

  /** Detect if a plugin has conflicting content across sources. */
  private detectConflict(
    pluginName: string,
    sources: Array<{ registry: RegistryConfig; entry: RegistryPluginEntry }>,
  ): RegistryConflict | null {
    if (sources.length <= 1) return null;

    // Normalize integrity hashes for comparison
    const hashes = new Set(sources.map(s => s.entry.integrity));
    if (hashes.size <= 1) return null; // Same content everywhere

    return {
      pluginName,
      sources: sources.map(s => ({
        registry: s.registry.name,
        version: s.entry.version,
        integrity: s.entry.integrity,
      })),
      resolution: `Resolved to "${sources[0].registry.name}" (highest priority)`,
    };
  }
}

// ---------------------------------------------------------------------------
// PolicyEngine
// ---------------------------------------------------------------------------

/**
 * Evaluates policy rules to determine whether a plugin may be installed.
 *
 * Rules are evaluated top-to-bottom with short-circuit matching (first
 * match wins), similar to iptables/firewall rules. If no rule matches,
 * the default action is to allow the plugin.
 *
 * The `unless` clause provides an escape hatch: if ALL conditions in the
 * unless block are met, the rule is skipped and evaluation continues.
 *
 * The `require` action generates warnings for missing mandatory plugins
 * but does not block installation of other plugins.
 */
export class PolicyEngine {
  private config: PolicyConfig;
  private projectRoot: string;

  constructor(projectRoot: string, config?: PolicyConfig) {
    this.projectRoot = projectRoot;

    if (config) {
      this.config = config;
    } else {
      this.config = this.loadPolicy();
    }
  }

  /** Load policy from the project or fall back to plugin defaults. */
  private loadPolicy(): PolicyConfig {
    // Try project-level policy
    const projectPolicy = path.join(this.projectRoot, '.claude', 'policies', 'plugins.yaml');
    const loaded = readPolicyFile(projectPolicy);
    if (loaded && loaded.rules.length > 0) return loaded;

    // Fall back to plugin-bundled default
    const defaultPolicy = path.join(
      this.projectRoot, 'plugins', 'marketplace-pro', 'config', 'policies.default.yaml',
    );
    const fallback = readPolicyFile(defaultPolicy);
    if (fallback && fallback.rules.length > 0) return fallback;

    // No policy — allow everything
    return { rules: [] };
  }

  /** Get all policy rules. */
  getRules(): PolicyRule[] {
    return [...this.config.rules];
  }

  /**
   * Evaluate whether a plugin is allowed by the current policy.
   *
   * @param pluginName — Name of the plugin
   * @param source — Registry the plugin comes from
   * @param metadata — Additional plugin metadata for unless-clause evaluation
   */
  evaluate(
    pluginName: string,
    source?: string,
    metadata?: { trustScore?: number; signed?: boolean },
  ): PolicyDecision {
    const warnings: string[] = [];

    for (const rule of this.config.rules) {
      // Check if the plugin name matches any pattern in the rule
      const nameMatches = rule.plugins.some(pattern => globMatch(pattern, pluginName));
      if (!nameMatches) continue;

      // Check source filter
      if (rule.source && source && rule.source !== source) continue;

      // Check unless exemptions
      if (rule.unless && metadata) {
        const exempt = this.checkExemptions(rule.unless, metadata);
        if (exempt) continue; // Rule is bypassed — continue to next rule
      }

      // Rule matched
      switch (rule.action) {
        case 'allow':
          return {
            allowed: true,
            rule,
            reason: rule.reason,
            warnings,
          };

        case 'deny':
          return {
            allowed: false,
            rule,
            reason: rule.reason,
            warnings,
          };

        case 'require':
          // Require rules don't block — they generate warnings when the plugin is NOT installed
          // For evaluation purposes (plugin IS being evaluated), it's allowed
          warnings.push(`Required plugin "${pluginName}": ${rule.reason}`);
          return {
            allowed: true,
            rule,
            reason: `Required: ${rule.reason}`,
            warnings,
          };
      }
    }

    // No rule matched — default allow
    return {
      allowed: true,
      rule: null,
      reason: 'No matching policy rule — allowed by default',
      warnings,
    };
  }

  /**
   * Scan a list of installed plugins against the policy.
   * Returns violations and missing required plugins.
   */
  audit(
    installedPlugins: Array<{
      name: string;
      source: string;
      trustScore?: number;
      signed?: boolean;
    }>,
  ): {
    violations: Array<{ plugin: string; decision: PolicyDecision }>;
    missingRequired: Array<{ pattern: string; reason: string }>;
    compliant: string[];
  } {
    const violations: Array<{ plugin: string; decision: PolicyDecision }> = [];
    const compliant: string[] = [];

    // Check each installed plugin
    for (const plugin of installedPlugins) {
      const decision = this.evaluate(plugin.name, plugin.source, {
        trustScore: plugin.trustScore,
        signed: plugin.signed,
      });

      if (!decision.allowed) {
        violations.push({ plugin: plugin.name, decision });
      } else {
        compliant.push(plugin.name);
      }
    }

    // Find required plugins that are not installed
    const installedNames = new Set(installedPlugins.map(p => p.name));
    const missingRequired: Array<{ pattern: string; reason: string }> = [];

    for (const rule of this.config.rules) {
      if (rule.action !== 'require') continue;

      for (const pattern of rule.plugins) {
        // Check if any installed plugin matches the required pattern
        const hasMatch = installedPlugins.some(p => globMatch(pattern, p.name));
        if (!hasMatch) {
          missingRequired.push({
            pattern,
            reason: rule.reason,
          });
        }
      }
    }

    return { violations, missingRequired, compliant };
  }

  /** Check if all exemption conditions are met. */
  private checkExemptions(
    unless: NonNullable<PolicyRule['unless']>,
    metadata: { trustScore?: number; signed?: boolean },
  ): boolean {
    let allMet = true;

    if (unless.trust_score !== undefined) {
      if (metadata.trustScore === undefined) {
        allMet = false;
      } else if (!evalComparison(unless.trust_score, metadata.trustScore)) {
        allMet = false;
      }
    }

    if (unless.signed !== undefined) {
      if (metadata.signed === undefined) {
        allMet = false;
      } else if (metadata.signed !== unless.signed) {
        allMet = false;
      }
    }

    return allMet;
  }
}

// ---------------------------------------------------------------------------
// LockfileManager
// ---------------------------------------------------------------------------

/**
 * Manages deterministic lockfiles for reproducible plugin installations.
 *
 * The lockfile records exact versions, integrity hashes, and source registries
 * for all installed plugins. It supports:
 *   - Generating a lockfile from the current installed state
 *   - Verifying installed plugins against the lockfile (drift detection)
 *   - Producing human-readable diffs for PR reviews
 *   - Installing from a lockfile for reproducible environments
 */
export class LockfileManager {
  private projectRoot: string;
  private lockfilePath: string;

  constructor(projectRoot: string, lockfilePath?: string) {
    this.projectRoot = projectRoot;
    this.lockfilePath = lockfilePath || path.join(projectRoot, 'plugin-lock.json');
  }

  /** Read the current lockfile, or null if it does not exist. */
  readLockfile(): Lockfile | null {
    return readJsonFile<Lockfile>(this.lockfilePath);
  }

  /** Write a lockfile to disk. */
  writeLockfile(lockfile: Lockfile): void {
    const dir = path.dirname(this.lockfilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.lockfilePath, JSON.stringify(lockfile, null, 2) + '\n', 'utf8');
  }

  /**
   * Generate a lockfile from the current resolved state.
   *
   * @param resolvedPlugins — Plugins as resolved by RegistryResolver
   * @param registries — Registry configs for provenance
   */
  generate(
    resolvedPlugins: ResolvedPlugin[],
    registries: RegistryConfig[],
  ): Lockfile {
    const plugins: Record<string, LockfileEntry> = {};

    for (const plugin of resolvedPlugins) {
      plugins[plugin.name] = {
        version: plugin.version,
        integrity: plugin.integrity,
        source: plugin.source,
        resolved: plugin.resolved,
        dependencies: plugin.dependencies,
        installedAt: new Date().toISOString(),
      };
    }

    // Sort plugins by name for deterministic output
    const sortedPlugins: Record<string, LockfileEntry> = {};
    for (const name of Object.keys(plugins).sort()) {
      sortedPlugins[name] = plugins[name];
    }

    const registryMap: Record<string, string> = {};
    for (const reg of registries) {
      registryMap[reg.name] = reg.url;
    }

    return {
      lockVersion: 1,
      generatedAt: new Date().toISOString(),
      registries: registryMap,
      plugins: sortedPlugins,
    };
  }

  /**
   * Check installed plugins against the lockfile for drift.
   *
   * Returns a list of mismatches with details about what changed.
   */
  check(
    currentPlugins: Array<{ name: string; version: string; integrity: string; source: string }>,
  ): {
    status: 'ok' | 'drift' | 'no-lockfile';
    mismatches: Array<{
      plugin: string;
      field: string;
      expected: string;
      actual: string;
    }>;
    unlocked: string[];
    missing: string[];
  } {
    const lockfile = this.readLockfile();

    if (!lockfile) {
      return {
        status: 'no-lockfile',
        mismatches: [],
        unlocked: currentPlugins.map(p => p.name),
        missing: [],
      };
    }

    const mismatches: Array<{
      plugin: string;
      field: string;
      expected: string;
      actual: string;
    }> = [];

    const currentMap = new Map(currentPlugins.map(p => [p.name, p]));
    const lockedNames = new Set(Object.keys(lockfile.plugins));
    const currentNames = new Set(currentPlugins.map(p => p.name));

    // Plugins in lockfile but not installed
    const missing = [...lockedNames].filter(n => !currentNames.has(n));

    // Plugins installed but not in lockfile
    const unlocked = [...currentNames].filter(n => !lockedNames.has(n));

    // Compare locked plugins against current
    for (const [name, locked] of Object.entries(lockfile.plugins)) {
      const current = currentMap.get(name);
      if (!current) continue; // Already tracked in missing

      if (current.version !== locked.version) {
        mismatches.push({
          plugin: name,
          field: 'version',
          expected: locked.version,
          actual: current.version,
        });
      }

      if (current.integrity !== locked.integrity) {
        mismatches.push({
          plugin: name,
          field: 'integrity',
          expected: locked.integrity,
          actual: current.integrity,
        });
      }

      if (current.source !== locked.source) {
        mismatches.push({
          plugin: name,
          field: 'source',
          expected: locked.source,
          actual: current.source,
        });
      }
    }

    const hasDrift = mismatches.length > 0 || missing.length > 0 || unlocked.length > 0;

    return {
      status: hasDrift ? 'drift' : 'ok',
      mismatches,
      unlocked,
      missing,
    };
  }

  /**
   * Compute a diff between two lockfiles.
   * If `previous` is null, all plugins in `current` are treated as added.
   */
  diff(current: Lockfile, previous: Lockfile | null): LockfileDiff {
    const result: LockfileDiff = {
      added: [],
      removed: [],
      updated: [],
      sourceChanged: [],
    };

    if (!previous) {
      // Everything is new
      for (const [name, entry] of Object.entries(current.plugins)) {
        result.added.push({ name, version: entry.version, source: entry.source });
      }
      return result;
    }

    const prevNames = new Set(Object.keys(previous.plugins));
    const currNames = new Set(Object.keys(current.plugins));

    // Added plugins
    for (const name of currNames) {
      if (!prevNames.has(name)) {
        const entry = current.plugins[name];
        result.added.push({ name, version: entry.version, source: entry.source });
      }
    }

    // Removed plugins
    for (const name of prevNames) {
      if (!currNames.has(name)) {
        const entry = previous.plugins[name];
        result.removed.push({ name, version: entry.version });
      }
    }

    // Changed plugins
    for (const name of currNames) {
      if (!prevNames.has(name)) continue;

      const prev = previous.plugins[name];
      const curr = current.plugins[name];

      if (prev.version !== curr.version) {
        result.updated.push({ name, from: prev.version, to: curr.version });
      }

      if (prev.source !== curr.source) {
        result.sourceChanged.push({ name, from: prev.source, to: curr.source });
      }
    }

    return result;
  }

  /**
   * Format a lockfile diff as a human-readable markdown string
   * suitable for PR review comments.
   */
  formatDiff(d: LockfileDiff): string {
    const lines: string[] = [];

    if (d.added.length === 0 && d.removed.length === 0 &&
        d.updated.length === 0 && d.sourceChanged.length === 0) {
      return 'No changes to plugin lockfile.';
    }

    lines.push('## Plugin Lockfile Changes\n');

    if (d.added.length > 0) {
      lines.push('### Added');
      for (const p of d.added) {
        lines.push(`+ **${p.name}** v${p.version} (from ${p.source})`);
      }
      lines.push('');
    }

    if (d.removed.length > 0) {
      lines.push('### Removed');
      for (const p of d.removed) {
        lines.push(`- **${p.name}** v${p.version}`);
      }
      lines.push('');
    }

    if (d.updated.length > 0) {
      lines.push('### Updated');
      for (const p of d.updated) {
        lines.push(`~ **${p.name}** ${p.from} -> ${p.to}`);
      }
      lines.push('');
    }

    if (d.sourceChanged.length > 0) {
      lines.push('### Source Changed');
      for (const p of d.sourceChanged) {
        lines.push(`! **${p.name}** registry: ${p.from} -> ${p.to}`);
      }
      lines.push('');
    }

    const total = d.added.length + d.removed.length + d.updated.length + d.sourceChanged.length;
    lines.push(`---`);
    lines.push(`*${total} plugin(s) affected*`);

    return lines.join('\n');
  }

  /**
   * Read the lockfile and return the list of plugins for --from-lockfile install.
   * Each entry includes all information needed to install from the exact source.
   */
  getInstallPlan(): {
    entries: Array<LockfileEntry & { name: string }>;
    registries: Record<string, string>;
  } | null {
    const lockfile = this.readLockfile();
    if (!lockfile) return null;

    if (lockfile.lockVersion !== 1) {
      throw new FederationError(
        `Unsupported lockfile version: ${lockfile.lockVersion}`,
        FederationErrorCode.UNSUPPORTED_LOCK_VERSION,
      );
    }

    const entries = Object.entries(lockfile.plugins).map(([name, entry]) => ({
      name,
      ...entry,
    }));

    // Sort by dependencies (basic topological order)
    const sorted = this.topoSort(entries);

    return {
      entries: sorted,
      registries: lockfile.registries,
    };
  }

  /** Basic topological sort for install order based on dependencies. */
  private topoSort(
    entries: Array<LockfileEntry & { name: string }>,
  ): Array<LockfileEntry & { name: string }> {
    const entryMap = new Map(entries.map(e => [e.name, e]));
    const visited = new Set<string>();
    const sorted: Array<LockfileEntry & { name: string }> = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);

      const entry = entryMap.get(name);
      if (!entry) return;

      for (const dep of entry.dependencies) {
        visit(dep);
      }

      sorted.push(entry);
    };

    for (const entry of entries) {
      visit(entry.name);
    }

    return sorted;
  }
}
