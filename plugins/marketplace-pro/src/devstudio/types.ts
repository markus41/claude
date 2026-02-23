/**
 * Plugin Dev Studio with Hot-Reload - Type Definitions
 *
 * Defines the contracts for file watching, hot-reload validation,
 * interactive playground testing, and dependency graph rendering.
 *
 * Part of the marketplace-pro plugin's dev-studio module.
 */

// ---------------------------------------------------------------------------
// File watching types
// ---------------------------------------------------------------------------

/** Classification of a changed file within the plugin directory structure. */
export type ResourceType = 'command' | 'skill' | 'agent' | 'config' | 'source' | 'other';

/** Classification of how a file changed on disk. */
export type ChangeType = 'added' | 'modified' | 'deleted';

/** Represents a single file change detected by the FileWatcher. */
export interface FileChange {
  /** Absolute or plugin-relative path to the changed file. */
  path: string;
  /** What kind of change was detected. */
  type: ChangeType;
  /** FNV-1a content hash of the file after the change (empty string for deletions). */
  hash: string;
  /** FNV-1a content hash before the change (undefined for newly added files). */
  previousHash?: string;
  /** Which resource category this file belongs to within the plugin. */
  resourceType: ResourceType;
}

/** Callback signature for file change events. */
export type FileChangeCallback = (changes: FileChange[]) => void;

/** Configuration options for the FileWatcher. */
export interface WatcherOptions {
  /** Root directory of the plugin to watch. */
  pluginPath: string;
  /** Debounce window in milliseconds (default: 100). */
  debounceMs?: number;
  /** Glob patterns to ignore (e.g. node_modules, .git). */
  ignorePatterns?: string[];
  /** Whether to perform an initial scan on start (default: true). */
  initialScan?: boolean;
}

// ---------------------------------------------------------------------------
// Validation types
// ---------------------------------------------------------------------------

/** Severity level for validation messages. */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** A single validation issue tied to a specific location in a file. */
export interface ValidationIssue {
  /** 1-based line number where the issue was found. */
  line: number;
  /** Human-readable description of the issue. */
  message: string;
  /** Severity classification. */
  severity: ValidationSeverity;
}

/** Result of validating a single file. */
export interface ValidationResult {
  /** Path to the validated file. */
  file: string;
  /** Whether the file passed all validation checks. */
  valid: boolean;
  /** List of issues found during validation. */
  errors: ValidationIssue[];
}

// ---------------------------------------------------------------------------
// Hot-reload resource registry types
// ---------------------------------------------------------------------------

/** A resource tracked by the HotReloader's internal registry. */
export interface RegisteredResource {
  /** Resource type (command, skill, or agent). */
  type: ResourceType;
  /** Resource name (e.g. slash command trigger, skill name). */
  name: string;
  /** Path to the resource file. */
  path: string;
  /** FNV-1a hash of the file content when last loaded. */
  hash: string;
  /** ISO 8601 timestamp of when this resource was last loaded/reloaded. */
  loadedAt: string;
  /** Whether the resource is currently in a valid state. */
  valid: boolean;
  /** Validation issues from the most recent load. */
  validationIssues: ValidationIssue[];
}

/** Summary of what changed during a hot-reload cycle. */
export interface ReloadResult {
  /** Resources that were newly registered. */
  added: RegisteredResource[];
  /** Resources that were updated in-place. */
  updated: RegisteredResource[];
  /** Resources that were unregistered (file deleted). */
  removed: string[];
  /** Validation results for all affected files. */
  validations: ValidationResult[];
  /** Whether all affected files passed validation. */
  allValid: boolean;
  /** ISO 8601 timestamp of this reload cycle. */
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Plugin playground / test fixture types
// ---------------------------------------------------------------------------

/** A recorded command invocation that can be replayed for regression testing. */
export interface TestFixture {
  /** Unique identifier for this fixture (UUID v4 format). */
  id: string;
  /** Human-readable name for this test case. */
  name: string;
  /** ISO 8601 timestamp of when the fixture was recorded. */
  timestamp: string;
  /** The slash command that was invoked (e.g. "/mp:compose"). */
  command: string;
  /** Positional arguments passed to the command. */
  arguments: string[];
  /** Full input context (environment, config, etc.). */
  input: Record<string, unknown>;
  /** Captured output from the command execution. */
  output: {
    /** Response text produced by the command. */
    text: string;
    /** Names of tool calls made during execution. */
    toolCalls: string[];
    /** Paths of files that were modified. */
    filesModified: string[];
  };
}

/** Result of replaying a fixture against the current plugin state. */
export interface FixtureReplayResult {
  /** The fixture that was replayed. */
  fixture: TestFixture;
  /** Whether the replay output matched the recorded output. */
  passed: boolean;
  /** Differences found between recorded and actual output. */
  diffs: Array<{
    field: string;
    expected: unknown;
    actual: unknown;
  }>;
}

/** Available capabilities registered in the playground mock registry. */
export interface MockCapability {
  /** Capability identifier (e.g. "plugin-registry"). */
  name: string;
  /** Mock implementation type. */
  type: 'stub' | 'mock' | 'passthrough';
  /** Mock return value or behavior specification. */
  behavior: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Dependency graph types
// ---------------------------------------------------------------------------

/** A single resource node in the dependency graph. */
export interface ResourceNode {
  /** Resource type. */
  type: 'command' | 'skill' | 'agent';
  /** Resource name (e.g. "/mp:compose", "security", "composer"). */
  name: string;
  /** Other resources this one depends on. */
  dependsOn: string[];
}

/** Complete dependency graph for a plugin. */
export interface ResourceGraph {
  /** Plugin name from the manifest. */
  plugin: string;
  /** Capabilities this plugin provides to the ecosystem. */
  provides: string[];
  /** Capabilities this plugin requires from other plugins. */
  requires: string[];
  /** Capabilities that conflict with this plugin. */
  conflicts: string[];
  /** All resources (commands, skills, agents) within the plugin. */
  resources: ResourceNode[];
  /** Pre-rendered ASCII art tree representation. */
  ascii: string;
  /** Pre-rendered Mermaid diagram source. */
  mermaid: string;
}

// ---------------------------------------------------------------------------
// Dev server orchestration types
// ---------------------------------------------------------------------------

/** Overall state of the dev server. */
export type DevServerState = 'stopped' | 'starting' | 'running' | 'error';

/** Configuration for launching the dev server. */
export interface DevServerConfig {
  /** Root directory of the plugin to serve. */
  pluginPath: string;
  /** Whether to enable file watching (default: true). */
  watch: boolean;
  /** Whether to enable the interactive playground (default: false). */
  playground: boolean;
  /** Port for the dev server status endpoint (0 = disabled). */
  port?: number;
}

/** Status snapshot of the running dev server. */
export interface DevServerStatus {
  /** Current server state. */
  state: DevServerState;
  /** Plugin being served. */
  pluginName: string;
  /** Plugin directory path. */
  pluginPath: string;
  /** Number of registered resources. */
  resourceCount: number;
  /** Number of detected validation errors. */
  errorCount: number;
  /** Number of detected validation warnings. */
  warningCount: number;
  /** Total number of hot-reload cycles completed. */
  reloadCount: number;
  /** ISO 8601 timestamp of the last reload. */
  lastReload: string | null;
  /** Uptime in milliseconds. */
  uptimeMs: number;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/** Error codes specific to the dev studio module. */
export enum DevStudioErrorCode {
  /** Plugin directory does not exist. */
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  /** Plugin manifest (plugin.json) is missing or unreadable. */
  MANIFEST_MISSING = 'MANIFEST_MISSING',
  /** Plugin manifest has invalid JSON or missing required fields. */
  MANIFEST_INVALID = 'MANIFEST_INVALID',
  /** File watcher encountered a filesystem error. */
  WATCHER_ERROR = 'WATCHER_ERROR',
  /** Fixture file is corrupt or has incompatible schema. */
  FIXTURE_INVALID = 'FIXTURE_INVALID',
  /** Dev server is already running for this plugin. */
  ALREADY_RUNNING = 'ALREADY_RUNNING',
}

/** Error thrown by dev studio operations. */
export class DevStudioError extends Error {
  constructor(
    message: string,
    public readonly code: DevStudioErrorCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'DevStudioError';
  }
}
