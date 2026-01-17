/**
 * Agent type definitions for the templating plugin
 *
 * Provides type-safe interfaces for agent orchestration that supports
 * scalable multi-agent collaboration across development workflows.
 */

import type { HarnessPipelineConfig, HarnessTemplateConfig } from './harness.js';
import type { ScaffoldSpec, ScaffoldResult, ProjectAnalysis, TemplateInfo } from './scaffold.js';

/**
 * Agent types in the templating plugin
 */
export type TemplatingAgentType =
  | 'harness-expert'
  | 'scaffold-agent'
  | 'codegen-agent'
  | 'database-agent'
  | 'testing-agent'
  | 'template-orchestrator';

/**
 * Agent execution status
 */
export type AgentStatus =
  | 'idle'
  | 'initializing'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Base agent configuration
 */
export interface AgentConfig {
  /** Agent type */
  type: TemplatingAgentType;
  /** Agent name */
  name: string;
  /** Agent description */
  description: string;
  /** Model to use */
  model?: 'opus' | 'sonnet' | 'haiku';
  /** Maximum execution time in milliseconds */
  timeout?: number;
  /** Maximum context tokens */
  maxContextTokens?: number;
  /** Retry configuration */
  retry?: AgentRetryConfig;
}

/**
 * Agent retry configuration
 */
export interface AgentRetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Retryable error types */
  retryableErrors?: string[];
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  /** Unique execution ID */
  executionId: string;
  /** Parent execution ID (if sub-agent) */
  parentExecutionId?: string;
  /** Working directory */
  workingDir: string;
  /** Environment variables */
  env: Record<string, string>;
  /** User-provided variables */
  variables: Record<string, unknown>;
  /** Execution metadata */
  metadata: AgentMetadata;
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  /** Start time */
  startTime: Date;
  /** End time */
  endTime?: Date;
  /** Status */
  status: AgentStatus;
  /** Progress (0-100) */
  progress: number;
  /** Current step description */
  currentStep?: string;
  /** Steps completed */
  stepsCompleted: number;
  /** Total steps */
  totalSteps?: number;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult<T = unknown> {
  /** Whether execution succeeded */
  success: boolean;
  /** Result data */
  data?: T;
  /** Error message */
  error?: string;
  /** Execution logs */
  logs: AgentLogEntry[];
  /** Files modified */
  filesModified: string[];
  /** Execution metrics */
  metrics: AgentMetrics;
}

/**
 * Agent log entry
 */
export interface AgentLogEntry {
  /** Timestamp */
  timestamp: Date;
  /** Log level */
  level: 'debug' | 'info' | 'warn' | 'error';
  /** Message */
  message: string;
  /** Additional data */
  data?: Record<string, unknown>;
}

/**
 * Agent execution metrics
 */
export interface AgentMetrics {
  /** Total execution time in milliseconds */
  durationMs: number;
  /** Tokens used */
  tokensUsed: number;
  /** API calls made */
  apiCalls: number;
  /** Files read */
  filesRead: number;
  /** Files written */
  filesWritten: number;
  /** Tool calls made */
  toolCalls: number;
}

/**
 * Harness Expert Agent interface
 */
export interface IHarnessExpertAgent {
  /** Create a Harness pipeline */
  createPipeline(config: HarnessPipelineConfig): Promise<AgentExecutionResult<PipelineCreationResult>>;
  /** Create a Harness template */
  createTemplate(config: HarnessTemplateConfig): Promise<AgentExecutionResult<TemplateCreationResult>>;
  /** Create pipeline for a scaffolded project */
  createPipelineForProject(params: ProjectPipelineParams): Promise<AgentExecutionResult<PipelineCreationResult>>;
  /** Suggest optimal pipeline based on project patterns */
  suggestPipeline(analysis: ProjectAnalysis): Promise<AgentExecutionResult<PipelineSuggestion>>;
  /** Validate pipeline YAML */
  validatePipeline(yaml: string): Promise<AgentExecutionResult<ValidationResult>>;
  /** Get available templates */
  listTemplates(scope: 'project' | 'org' | 'account'): Promise<AgentExecutionResult<HarnessTemplateInfo[]>>;
}

/**
 * Pipeline creation result
 */
export interface PipelineCreationResult {
  /** Pipeline identifier */
  pipelineId: string;
  /** Pipeline YAML content */
  yaml: string;
  /** File path where pipeline was saved */
  filePath: string;
  /** Pipeline URL in Harness UI */
  url?: string;
}

/**
 * Template creation result
 */
export interface TemplateCreationResult {
  /** Template identifier */
  templateId: string;
  /** Template version */
  versionLabel: string;
  /** Template YAML content */
  yaml: string;
  /** File path where template was saved */
  filePath: string;
  /** Template URL in Harness UI */
  url?: string;
}

/**
 * Project pipeline parameters
 */
export interface ProjectPipelineParams {
  /** Project path */
  projectPath: string;
  /** Detected or specified project type */
  projectType: string;
  /** Target environments */
  environments: string[];
  /** Include CI stages */
  includeCI?: boolean;
  /** Include CD stages */
  includeCD?: boolean;
  /** Deployment strategy */
  deploymentStrategy?: string;
  /** Additional pipeline configuration */
  config?: Partial<HarnessPipelineConfig>;
}

/**
 * Pipeline suggestion
 */
export interface PipelineSuggestion {
  /** Suggested pipeline configuration */
  pipeline: HarnessPipelineConfig;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reasoning for suggestion */
  reasoning: string;
  /** Alternative suggestions */
  alternatives?: PipelineSuggestion[];
  /** Detected patterns that influenced suggestion */
  detectedPatterns: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: ValidationError[];
  /** Validation warnings */
  warnings: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Path to problematic element */
  path?: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Harness template info
 */
export interface HarnessTemplateInfo {
  /** Template identifier */
  identifier: string;
  /** Template name */
  name: string;
  /** Template type */
  type: string;
  /** Template scope */
  scope: string;
  /** Version label */
  versionLabel: string;
  /** Description */
  description?: string;
  /** Last modified */
  lastModified?: Date;
}

/**
 * Scaffold Agent interface
 */
export interface IScaffoldAgent {
  /** Scaffold a new project */
  scaffold(spec: ScaffoldSpec): Promise<AgentExecutionResult<ScaffoldResult>>;
  /** Analyze existing project */
  analyzeProject(path: string): Promise<AgentExecutionResult<ProjectAnalysis>>;
  /** List available templates */
  listTemplates(): Promise<AgentExecutionResult<TemplateInfo[]>>;
  /** Get template details */
  getTemplate(name: string): Promise<AgentExecutionResult<TemplateInfo>>;
  /** Validate scaffold specification */
  validateSpec(spec: ScaffoldSpec): Promise<AgentExecutionResult<ValidationResult>>;
}

/**
 * Codegen Agent interface
 */
export interface ICodegenAgent {
  /** Generate code from specification */
  generate(spec: CodegenSpec): Promise<AgentExecutionResult<CodegenResult>>;
  /** Generate API client */
  generateApiClient(spec: ApiClientSpec): Promise<AgentExecutionResult<CodegenResult>>;
  /** Generate models from schema */
  generateModels(spec: ModelGenSpec): Promise<AgentExecutionResult<CodegenResult>>;
  /** Generate boilerplate code */
  generateBoilerplate(spec: BoilerplateSpec): Promise<AgentExecutionResult<CodegenResult>>;
}

/**
 * Code generation specification
 */
export interface CodegenSpec {
  /** Generation type */
  type: 'component' | 'service' | 'model' | 'api-client' | 'test' | 'custom';
  /** Target language */
  language: string;
  /** Output directory */
  outputDir: string;
  /** Template or pattern to use */
  template?: string;
  /** Schema or specification */
  schema?: unknown;
  /** Additional options */
  options?: Record<string, unknown>;
}

/**
 * API client generation specification
 */
export interface ApiClientSpec {
  /** API specification (OpenAPI/Swagger) */
  specPath: string;
  /** Target language */
  language: string;
  /** Output directory */
  outputDir: string;
  /** Client name */
  clientName: string;
  /** Package name */
  packageName?: string;
  /** Include models */
  includeModels?: boolean;
  /** Include tests */
  includeTests?: boolean;
}

/**
 * Model generation specification
 */
export interface ModelGenSpec {
  /** Schema source (path or URL) */
  schemaSource: string;
  /** Schema type */
  schemaType: 'json-schema' | 'graphql' | 'protobuf' | 'openapi' | 'prisma';
  /** Target language */
  language: string;
  /** Output directory */
  outputDir: string;
  /** Generate validation */
  includeValidation?: boolean;
  /** Generate serialization */
  includeSerialization?: boolean;
}

/**
 * Boilerplate generation specification
 */
export interface BoilerplateSpec {
  /** Boilerplate type */
  type: string;
  /** Target directory */
  targetDir: string;
  /** Variables */
  variables: Record<string, unknown>;
  /** File patterns to generate */
  patterns?: string[];
}

/**
 * Code generation result
 */
export interface CodegenResult {
  /** Generated files */
  files: GeneratedCodeFile[];
  /** Warnings */
  warnings: string[];
}

/**
 * Generated code file
 */
export interface GeneratedCodeFile {
  /** File path */
  path: string;
  /** File content */
  content: string;
  /** File type */
  type: 'source' | 'test' | 'config' | 'docs';
  /** Language */
  language: string;
}

/**
 * Database Agent interface
 */
export interface IDatabaseAgent {
  /** Generate database schema */
  generateSchema(spec: SchemaSpec): Promise<AgentExecutionResult<SchemaResult>>;
  /** Generate migrations */
  generateMigrations(spec: MigrationSpec): Promise<AgentExecutionResult<MigrationResult>>;
  /** Analyze existing schema */
  analyzeSchema(connectionString: string): Promise<AgentExecutionResult<SchemaAnalysis>>;
  /** Generate seed data */
  generateSeeds(spec: SeedSpec): Promise<AgentExecutionResult<SeedResult>>;
}

/**
 * Schema generation specification
 */
export interface SchemaSpec {
  /** Database type */
  database: 'postgres' | 'mysql' | 'sqlite' | 'mongodb' | 'dynamodb';
  /** ORM/ODM */
  orm?: 'prisma' | 'drizzle' | 'typeorm' | 'sequelize' | 'mongoose';
  /** Entity definitions */
  entities: EntityDefinition[];
  /** Output directory */
  outputDir: string;
}

/**
 * Entity definition
 */
export interface EntityDefinition {
  /** Entity name */
  name: string;
  /** Entity fields */
  fields: EntityField[];
  /** Relations */
  relations?: EntityRelation[];
  /** Indexes */
  indexes?: EntityIndex[];
}

/**
 * Entity field
 */
export interface EntityField {
  /** Field name */
  name: string;
  /** Field type */
  type: string;
  /** Is primary key */
  primaryKey?: boolean;
  /** Is unique */
  unique?: boolean;
  /** Is nullable */
  nullable?: boolean;
  /** Default value */
  default?: unknown;
  /** Is auto-generated */
  autoGenerate?: boolean;
}

/**
 * Entity relation
 */
export interface EntityRelation {
  /** Relation name */
  name: string;
  /** Relation type */
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  /** Target entity */
  target: string;
  /** Foreign key field */
  foreignKey?: string;
}

/**
 * Entity index
 */
export interface EntityIndex {
  /** Index name */
  name?: string;
  /** Indexed fields */
  fields: string[];
  /** Is unique index */
  unique?: boolean;
}

/**
 * Schema generation result
 */
export interface SchemaResult {
  /** Generated schema files */
  schemaFiles: GeneratedCodeFile[];
  /** Generated model files */
  modelFiles: GeneratedCodeFile[];
}

/**
 * Migration specification
 */
export interface MigrationSpec {
  /** Migration name */
  name: string;
  /** Source schema */
  fromSchema?: string;
  /** Target schema */
  toSchema: string;
  /** Migration type */
  type: 'sql' | 'orm';
  /** ORM-specific options */
  ormOptions?: Record<string, unknown>;
}

/**
 * Migration result
 */
export interface MigrationResult {
  /** Migration files */
  migrationFiles: GeneratedCodeFile[];
  /** SQL statements */
  sqlStatements?: string[];
}

/**
 * Schema analysis result
 */
export interface SchemaAnalysis {
  /** Tables/Collections */
  tables: TableAnalysis[];
  /** Relationships */
  relationships: RelationshipAnalysis[];
  /** Indexes */
  indexes: IndexAnalysis[];
  /** Issues found */
  issues: SchemaIssue[];
}

/**
 * Table analysis
 */
export interface TableAnalysis {
  /** Table name */
  name: string;
  /** Columns */
  columns: ColumnAnalysis[];
  /** Row count (estimated) */
  rowCount?: number;
  /** Size (estimated) */
  size?: string;
}

/**
 * Column analysis
 */
export interface ColumnAnalysis {
  /** Column name */
  name: string;
  /** Data type */
  dataType: string;
  /** Is nullable */
  nullable: boolean;
  /** Default value */
  default?: string;
  /** Is primary key */
  isPrimaryKey: boolean;
  /** Is foreign key */
  isForeignKey: boolean;
}

/**
 * Relationship analysis
 */
export interface RelationshipAnalysis {
  /** Source table */
  sourceTable: string;
  /** Source column */
  sourceColumn: string;
  /** Target table */
  targetTable: string;
  /** Target column */
  targetColumn: string;
  /** Relationship type */
  type: string;
}

/**
 * Index analysis
 */
export interface IndexAnalysis {
  /** Index name */
  name: string;
  /** Table name */
  table: string;
  /** Indexed columns */
  columns: string[];
  /** Is unique */
  unique: boolean;
  /** Index type */
  type: string;
}

/**
 * Schema issue
 */
export interface SchemaIssue {
  /** Issue severity */
  severity: 'error' | 'warning' | 'info';
  /** Issue type */
  type: string;
  /** Issue message */
  message: string;
  /** Affected object */
  affectedObject: string;
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Seed specification
 */
export interface SeedSpec {
  /** Target table/collection */
  target: string;
  /** Number of records */
  count: number;
  /** Field generators */
  generators: Record<string, SeedGenerator>;
  /** Output format */
  format: 'sql' | 'json' | 'csv';
}

/**
 * Seed generator
 */
export interface SeedGenerator {
  /** Generator type */
  type: 'faker' | 'enum' | 'sequence' | 'reference' | 'custom';
  /** Generator options */
  options?: Record<string, unknown>;
}

/**
 * Seed result
 */
export interface SeedResult {
  /** Seed files */
  seedFiles: GeneratedCodeFile[];
  /** Record count */
  recordCount: number;
}

/**
 * Testing Agent interface
 */
export interface ITestingAgent {
  /** Generate tests for code */
  generateTests(spec: TestGenSpec): Promise<AgentExecutionResult<TestGenResult>>;
  /** Generate test fixtures */
  generateFixtures(spec: FixtureSpec): Promise<AgentExecutionResult<FixtureResult>>;
  /** Analyze test coverage */
  analyzeCoverage(projectPath: string): Promise<AgentExecutionResult<CoverageAnalysis>>;
  /** Suggest tests for uncovered code */
  suggestTests(projectPath: string): Promise<AgentExecutionResult<TestSuggestions>>;
}

/**
 * Test generation specification
 */
export interface TestGenSpec {
  /** Source file or directory */
  source: string;
  /** Test framework */
  framework: 'jest' | 'vitest' | 'mocha' | 'pytest' | 'junit' | 'go-test';
  /** Test types to generate */
  testTypes: ('unit' | 'integration' | 'e2e')[];
  /** Output directory */
  outputDir: string;
  /** Include mocks */
  includeMocks?: boolean;
  /** Coverage target */
  coverageTarget?: number;
}

/**
 * Test generation result
 */
export interface TestGenResult {
  /** Generated test files */
  testFiles: GeneratedCodeFile[];
  /** Generated mock files */
  mockFiles: GeneratedCodeFile[];
  /** Estimated coverage */
  estimatedCoverage: number;
}

/**
 * Fixture specification
 */
export interface FixtureSpec {
  /** Target entities/types */
  targets: string[];
  /** Fixture format */
  format: 'json' | 'yaml' | 'factory';
  /** Output directory */
  outputDir: string;
  /** Number of fixtures per entity */
  count?: number;
}

/**
 * Fixture result
 */
export interface FixtureResult {
  /** Generated fixture files */
  fixtureFiles: GeneratedCodeFile[];
}

/**
 * Coverage analysis result
 */
export interface CoverageAnalysis {
  /** Overall coverage percentage */
  overall: number;
  /** Coverage by file */
  byFile: FileCoverage[];
  /** Coverage by type */
  byType: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  /** Uncovered areas */
  uncovered: UncoveredArea[];
}

/**
 * File coverage
 */
export interface FileCoverage {
  /** File path */
  path: string;
  /** Coverage percentage */
  coverage: number;
  /** Uncovered lines */
  uncoveredLines: number[];
}

/**
 * Uncovered area
 */
export interface UncoveredArea {
  /** File path */
  file: string;
  /** Start line */
  startLine: number;
  /** End line */
  endLine: number;
  /** Type of uncovered area */
  type: 'function' | 'branch' | 'statement';
  /** Code snippet */
  snippet?: string;
}

/**
 * Test suggestions
 */
export interface TestSuggestions {
  /** Suggested tests */
  suggestions: TestSuggestion[];
  /** Priority ranking */
  priorityRanking: string[];
}

/**
 * Test suggestion
 */
export interface TestSuggestion {
  /** Target file */
  targetFile: string;
  /** Target function/method */
  targetFunction?: string;
  /** Suggested test name */
  testName: string;
  /** Test description */
  description: string;
  /** Test type */
  testType: 'unit' | 'integration' | 'e2e';
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Generated test code */
  testCode?: string;
}
