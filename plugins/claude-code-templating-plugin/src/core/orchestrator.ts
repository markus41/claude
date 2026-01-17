/**
 * Template Orchestrator - Central Coordinator
 *
 * Orchestrates template operations across multiple engines and agents,
 * establishing scalable patterns for project generation and deployment
 * automation workflows.
 */

import { EventEmitter } from 'eventemitter3';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import type {
  ScaffoldSpec,
  ScaffoldResult,
  TemplateFormat,
  GeneratedFile,
  TemplateInfo,
  ProjectAnalysis,
  ITemplateLoader,
} from '../types/scaffold.js';
import type {
  HarnessPipelineConfig,
  HarnessTemplateConfig,
} from '../types/harness.js';
import type {
  PipelineCreationResult,
  TemplateCreationResult,
  ProjectPipelineParams,
} from '../types/agents.js';

/**
 * Orchestrator events
 */
export interface OrchestratorEvents {
  scaffoldStarted: [ScaffoldSpec];
  scaffoldCompleted: [ScaffoldResult];
  scaffoldFailed: [Error, ScaffoldSpec];
  fileGenerated: [GeneratedFile];
  pipelineCreated: [PipelineCreationResult];
  templateCreated: [TemplateCreationResult];
  analysisCompleted: [ProjectAnalysis];
  error: [Error];
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  /** Working directory */
  workingDir: string;
  /** Template cache directory */
  cacheDir?: string;
  /** Logger function */
  logger?: OrchestratorLogger;
  /** Default template format */
  defaultFormat?: TemplateFormat;
  /** Harness configuration */
  harnessConfig?: HarnessOrchestratorConfig;
}

/**
 * Harness orchestrator configuration
 */
export interface HarnessOrchestratorConfig {
  /** Account ID */
  accountId: string;
  /** Organization ID */
  orgId: string;
  /** Project ID */
  projectId: string;
}

/**
 * Logger interface
 */
export interface OrchestratorLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Default console logger
 */
const defaultLogger: OrchestratorLogger = {
  debug: (msg, ...args) => console.debug(`[orchestrator] ${msg}`, ...args),
  info: (msg, ...args) => console.info(`[orchestrator] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[orchestrator] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[orchestrator] ${msg}`, ...args),
};

/**
 * Template Orchestrator
 *
 * The central coordinator for template operations that streamlines
 * project generation and deployment automation workflows.
 */
export class TemplateOrchestrator extends EventEmitter<OrchestratorEvents> {
  private readonly config: Required<OrchestratorConfig>;
  private readonly loaders: Map<TemplateFormat, ITemplateLoader> = new Map();
  // @ts-expect-error Reserved for future template caching functionality
  private readonly templateCache: Map<string, TemplateInfo> = new Map();

  constructor(config: OrchestratorConfig) {
    super();
    this.config = {
      workingDir: config.workingDir,
      cacheDir: config.cacheDir || join(config.workingDir, '.template-cache'),
      logger: config.logger || defaultLogger,
      defaultFormat: config.defaultFormat || 'handlebars',
      harnessConfig: config.harnessConfig || {
        accountId: process.env.HARNESS_ACCOUNT_ID || '',
        orgId: process.env.HARNESS_ORG_ID || '',
        projectId: process.env.HARNESS_PROJECT_ID || '',
      },
    };
  }

  /**
   * Register a template loader for a specific format
   */
  registerLoader(format: TemplateFormat, loader: ITemplateLoader): void {
    this.loaders.set(format, loader);
    this.config.logger.debug(`Registered loader for format: ${format}`);
  }

  /**
   * Get registered loader for a format
   */
  getLoader(format: TemplateFormat): ITemplateLoader | undefined {
    return this.loaders.get(format);
  }

  /**
   * Scaffold a new project from template
   *
   * This is the main entry point for project generation that orchestrates
   * template loading, variable processing, and file generation.
   */
  async scaffold(spec: ScaffoldSpec): Promise<ScaffoldResult> {
    const startTime = Date.now();
    this.config.logger.info(`Starting scaffold: ${spec.name} from ${spec.template}`);
    this.emit('scaffoldStarted', spec);

    try {
      // Detect template format if not specified
      const format = spec.format || await this.detectTemplateFormat(spec.template);
      this.config.logger.debug(`Template format: ${format}`);

      // Get appropriate loader
      const loader = this.loaders.get(format);
      if (!loader) {
        throw new Error(`No loader registered for format: ${format}`);
      }

      // Load template metadata
      const templateInfo = await loader.loadMetadata(spec.template);
      this.config.logger.debug(`Template loaded: ${templateInfo.name} v${templateInfo.version}`);

      // Determine output path
      const outputPath = spec.outputPath || join(this.config.workingDir, spec.name);

      // Create output directory
      if (!spec.dryRun) {
        await mkdir(outputPath, { recursive: true });
      }

      // Merge variables with defaults
      const variables = this.mergeVariables(templateInfo, spec.variables || {});

      // Generate files
      const files = await loader.generate(spec.template, outputPath, variables);

      // Emit events for each file
      for (const file of files) {
        this.emit('fileGenerated', file);
      }

      // Generate CLAUDE.md for the new project
      if (!spec.dryRun) {
        await this.generateClaudeMd(outputPath, spec, templateInfo);
      }

      // Handle Harness integration if requested
      let harnessResources;
      if (spec.harnessIntegration && !spec.dryRun) {
        harnessResources = await this.createHarnessIntegration(
          outputPath,
          spec,
          templateInfo
        );
      }

      const result: ScaffoldResult = {
        success: true,
        outputPath,
        files,
        warnings: [],
        harnessResources,
        templateInfo,
        durationMs: Date.now() - startTime,
      };

      this.emit('scaffoldCompleted', result);
      this.config.logger.info(
        `Scaffold completed: ${files.length} files generated in ${result.durationMs}ms`
      );

      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('scaffoldFailed', err, spec);
      this.config.logger.error(`Scaffold failed: ${err.message}`);

      return {
        success: false,
        outputPath: spec.outputPath || join(this.config.workingDir, spec.name),
        files: [],
        warnings: [],
        error: err.message,
        templateInfo: {
          name: spec.template,
          source: spec.template,
          format: spec.format || 'unknown' as TemplateFormat,
          variables: [],
        },
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Create a Harness pipeline
   */
  async createHarnessPipeline(
    config: HarnessPipelineConfig
  ): Promise<PipelineCreationResult> {
    this.config.logger.info(`Creating Harness pipeline: ${config.name}`);

    // Generate pipeline YAML
    const yaml = this.generatePipelineYaml(config);

    // Determine file path
    const filePath = join(
      this.config.workingDir,
      '.harness',
      `${config.identifier || this.toIdentifier(config.name)}.yaml`
    );

    // Ensure directory exists
    await mkdir(dirname(filePath), { recursive: true });

    // Write pipeline file
    await writeFile(filePath, yaml, 'utf-8');

    const result: PipelineCreationResult = {
      pipelineId: config.identifier || this.toIdentifier(config.name),
      yaml,
      filePath,
    };

    this.emit('pipelineCreated', result);
    return result;
  }

  /**
   * Create a Harness template
   */
  async createHarnessTemplate(
    config: HarnessTemplateConfig
  ): Promise<TemplateCreationResult> {
    this.config.logger.info(`Creating Harness template: ${config.name}`);

    // Generate template YAML
    const yaml = this.generateTemplateYaml(config);

    // Determine file path based on scope
    const scopeDir = config.scope === 'account'
      ? 'account'
      : config.scope === 'org'
        ? 'org'
        : 'project';

    const filePath = join(
      this.config.workingDir,
      '.harness',
      'templates',
      scopeDir,
      `${config.identifier || this.toIdentifier(config.name)}.yaml`
    );

    // Ensure directory exists
    await mkdir(dirname(filePath), { recursive: true });

    // Write template file
    await writeFile(filePath, yaml, 'utf-8');

    const result: TemplateCreationResult = {
      templateId: config.identifier || this.toIdentifier(config.name),
      versionLabel: config.versionLabel,
      yaml,
      filePath,
    };

    this.emit('templateCreated', result);
    return result;
  }

  /**
   * Create pipeline for a scaffolded project
   */
  async createPipelineForProject(
    params: ProjectPipelineParams
  ): Promise<PipelineCreationResult> {
    this.config.logger.info(`Creating pipeline for project: ${params.projectPath}`);

    // Determine pipeline pattern based on project type
    const pipelineConfig = this.buildPipelineConfig(params);

    return this.createHarnessPipeline(pipelineConfig);
  }

  /**
   * Analyze an existing project
   */
  async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    this.config.logger.info(`Analyzing project: ${projectPath}`);

    // Basic project analysis
    const analysis: ProjectAnalysis = {
      projectType: 'unknown',
      language: 'unknown',
      frameworks: [],
      patterns: [],
      suggestedVariables: {},
    };

    // Check for common project indicators
    const indicators = [
      { file: 'package.json', type: 'webapp', language: 'typescript' },
      { file: 'requirements.txt', type: 'api', language: 'python' },
      { file: 'pom.xml', type: 'microservice', language: 'java' },
      { file: 'go.mod', type: 'microservice', language: 'go' },
      { file: 'Cargo.toml', type: 'cli', language: 'rust' },
      { file: 'Dockerfile', type: 'microservice', language: 'unknown' },
      { file: 'terraform', type: 'infrastructure', language: 'hcl' },
    ];

    for (const indicator of indicators) {
      if (existsSync(join(projectPath, indicator.file))) {
        analysis.projectType = indicator.type as ProjectAnalysis['projectType'];
        analysis.language = indicator.language;
        break;
      }
    }

    // Check for specific frameworks
    if (existsSync(join(projectPath, 'package.json'))) {
      try {
        const pkg = JSON.parse(
          await readFile(join(projectPath, 'package.json'), 'utf-8')
        );
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };

        if (deps['react']) analysis.frameworks.push('react');
        if (deps['next']) analysis.frameworks.push('nextjs');
        if (deps['vue']) analysis.frameworks.push('vue');
        if (deps['express']) analysis.frameworks.push('express');
        if (deps['fastify']) analysis.frameworks.push('fastify');
        if (deps['prisma'] || deps['@prisma/client']) analysis.frameworks.push('prisma');
      } catch {
        // Ignore parsing errors
      }
    }

    this.emit('analysisCompleted', analysis);
    return analysis;
  }

  /**
   * Detect template format from source
   */
  private async detectTemplateFormat(source: string): Promise<TemplateFormat> {
    // Check for format-specific config files
    const formatIndicators: Array<{ pattern: string; format: TemplateFormat }> = [
      { pattern: 'cookiecutter.json', format: 'cookiecutter' },
      { pattern: 'copier.yml', format: 'copier' },
      { pattern: 'copier.yaml', format: 'copier' },
      { pattern: 'archetype-metadata.xml', format: 'maven-archetype' },
      { pattern: '.harness', format: 'harness' },
    ];

    for (const { pattern, format } of formatIndicators) {
      if (existsSync(join(source, pattern))) {
        return format;
      }
    }

    // Default to handlebars
    return this.config.defaultFormat;
  }

  /**
   * Merge user variables with template defaults
   */
  private mergeVariables(
    templateInfo: TemplateInfo,
    userVariables: Record<string, unknown>
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = {};

    // Apply defaults from template
    for (const variable of templateInfo.variables) {
      if (variable.default !== undefined) {
        merged[variable.name] = variable.default;
      }
    }

    // Override with user values
    Object.assign(merged, userVariables);

    return merged;
  }

  /**
   * Generate CLAUDE.md for a new project
   */
  private async generateClaudeMd(
    outputPath: string,
    spec: ScaffoldSpec,
    templateInfo: TemplateInfo
  ): Promise<void> {
    const claudeMd = `# ${spec.name}

**Generated from:** ${templateInfo.name} v${templateInfo.version || '1.0.0'}
**Created:** ${new Date().toISOString()}

## Overview

${spec.description || `Project scaffolded from ${templateInfo.name} template.`}

## Quick Reference

| Resource | Path |
|----------|------|
| Source | \`src/\` |
| Tests | \`test/\` |
| Config | \`config/\` |

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test
\`\`\`

## Template Variables Used

${templateInfo.variables.map(v => `- **${v.name}**: ${v.description || v.prompt}`).join('\n')}

## Harness Integration

${spec.harnessIntegration ? `
This project includes Harness CI/CD integration:
- Pipeline: \`.harness/${this.toIdentifier(spec.name)}.yaml\`
- Environments: ${(spec.environments || ['dev']).join(', ')}
` : 'Not configured. Use `/harness pipeline create` to add CI/CD.'}
`;

    await writeFile(join(outputPath, 'CLAUDE.md'), claudeMd, 'utf-8');
    this.config.logger.debug('Generated CLAUDE.md');
  }

  /**
   * Create Harness integration for a scaffolded project
   */
  private async createHarnessIntegration(
    outputPath: string,
    spec: ScaffoldSpec,
    _templateInfo: TemplateInfo
  ): Promise<ScaffoldResult['harnessResources']> {
    const params: ProjectPipelineParams = {
      projectPath: outputPath,
      projectType: spec.template,
      environments: spec.environments || ['dev', 'staging', 'prod'],
      includeCI: true,
      includeCD: true,
    };

    const result = await this.createPipelineForProject(params);

    return {
      pipelinePath: result.filePath,
      environments: params.environments,
    };
  }

  /**
   * Build pipeline configuration from project parameters
   */
  private buildPipelineConfig(params: ProjectPipelineParams): HarnessPipelineConfig {
    const identifier = this.toIdentifier(
      params.projectPath.split('/').pop() || 'pipeline'
    );

    const stages = [];

    // CI Stage
    if (params.includeCI !== false) {
      stages.push({
        name: 'Build',
        identifier: 'build',
        type: 'CI' as const,
        spec: {
          cloneCodebase: true,
          execution: {
            steps: [
              {
                name: 'Run Tests',
                identifier: 'run_tests',
                type: 'Run' as const,
                spec: {
                  shell: 'Bash' as const,
                  command: 'npm test',
                },
              },
              {
                name: 'Build',
                identifier: 'build',
                type: 'Run' as const,
                spec: {
                  shell: 'Bash' as const,
                  command: 'npm run build',
                },
              },
            ],
          },
        },
      });
    }

    // CD Stages for each environment
    if (params.includeCD !== false) {
      for (const env of params.environments) {
        stages.push({
          name: `Deploy ${env.charAt(0).toUpperCase() + env.slice(1)}`,
          identifier: `deploy_${env}`,
          type: 'Deployment' as const,
          spec: {
            deploymentType: 'Kubernetes',
            environment: {
              environmentRef: env,
              deployToAll: false,
              infrastructureDefinitions: [
                {
                  identifier: `${env}_infra`,
                },
              ],
            },
            execution: {
              steps: [
                {
                  name: 'Rolling Deployment',
                  identifier: 'rolling_deployment',
                  type: 'K8sRollingDeploy' as const,
                  spec: {},
                },
              ],
            },
          },
        });
      }
    }

    return {
      name: `${params.projectPath.split('/').pop()} Pipeline`,
      identifier,
      orgIdentifier: this.config.harnessConfig.orgId,
      projectIdentifier: this.config.harnessConfig.projectId,
      description: `CI/CD pipeline for ${params.projectPath}`,
      stages,
    };
  }

  /**
   * Generate pipeline YAML
   */
  private generatePipelineYaml(config: HarnessPipelineConfig): string {
    const pipeline = {
      pipeline: {
        name: config.name,
        identifier: config.identifier || this.toIdentifier(config.name),
        projectIdentifier: config.projectIdentifier,
        orgIdentifier: config.orgIdentifier,
        description: config.description,
        tags: config.tags,
        stages: config.stages.map((stage) => ({
          stage: {
            name: stage.name,
            identifier: stage.identifier || this.toIdentifier(stage.name),
            type: stage.type,
            spec: stage.spec,
          },
        })),
      },
    };

    return this.toYaml(pipeline);
  }

  /**
   * Generate template YAML
   */
  private generateTemplateYaml(config: HarnessTemplateConfig): string {
    const template = {
      template: {
        name: config.name,
        identifier: config.identifier || this.toIdentifier(config.name),
        versionLabel: config.versionLabel,
        type: config.type,
        ...(config.orgIdentifier && { orgIdentifier: config.orgIdentifier }),
        ...(config.projectIdentifier && { projectIdentifier: config.projectIdentifier }),
        description: config.description,
        tags: config.tags,
        spec: config.spec,
      },
    };

    return this.toYaml(template);
  }

  /**
   * Convert object to YAML string
   */
  private toYaml(obj: unknown): string {
    // Simple YAML serialization
    const serialize = (value: unknown, indent = 0): string => {
      const prefix = '  '.repeat(indent);

      if (value === null || value === undefined) {
        return 'null';
      }

      if (typeof value === 'string') {
        // Check if string needs quoting
        if (
          value.includes(':') ||
          value.includes('#') ||
          value.includes('\n') ||
          value.startsWith('<+')
        ) {
          return `"${value.replace(/"/g, '\\"')}"`;
        }
        return value;
      }

      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }

      if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return value
          .map((item) => {
            const serialized = serialize(item, indent + 1);
            if (typeof item === 'object' && item !== null) {
              return `${prefix}- ${serialized.trimStart()}`;
            }
            return `${prefix}- ${serialized}`;
          })
          .join('\n');
      }

      if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        if (entries.length === 0) return '{}';
        return entries
          .map(([key, val]) => {
            const serialized = serialize(val, indent + 1);
            if (
              typeof val === 'object' &&
              val !== null &&
              !Array.isArray(val) &&
              Object.keys(val as object).length > 0
            ) {
              return `${prefix}${key}:\n${serialized}`;
            }
            if (Array.isArray(val) && val.length > 0) {
              return `${prefix}${key}:\n${serialized}`;
            }
            return `${prefix}${key}: ${serialized}`;
          })
          .join('\n');
      }

      return String(value);
    };

    return serialize(obj);
  }

  /**
   * Convert string to valid identifier
   */
  private toIdentifier(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

/**
 * Create orchestrator instance
 */
export function createOrchestrator(
  config: OrchestratorConfig
): TemplateOrchestrator {
  return new TemplateOrchestrator(config);
}

export default TemplateOrchestrator;
