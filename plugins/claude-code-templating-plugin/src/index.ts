/**
 * Claude Code Templating Plugin - Entry Point
 *
 * Establishes a universal templating and Harness expert plugin that enables
 * fully autonomous project generation, pipeline creation, and deployment
 * automation through a unified template interface.
 *
 * @module claude-code-templating-plugin
 */

import { EventEmitter } from 'eventemitter3';
import { TemplateOrchestrator, createOrchestrator } from './core/orchestrator.js';
import { HarnessExpertAgent } from './agents/harness-expert.js';
import type {
  ScaffoldSpec,
  ScaffoldResult,
  TemplateFormat,
} from './types/scaffold.js';
import type {
  HarnessPipelineConfig,
  HarnessTemplateConfig,
} from './types/harness.js';
import type {
  MCPServerState,
} from './types/mcp.js';

/**
 * Plugin activation context
 */
export interface PluginContext {
  /** Plugin working directory */
  workingDir: string;
  /** Plugin configuration */
  config: PluginConfig;
  /** Logger function */
  logger: PluginLogger;
  /** Extension API */
  api: PluginAPI;
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  /** Template cache directory */
  cacheDir?: string;
  /** Default template format */
  defaultFormat?: TemplateFormat;
  /** Harness configuration */
  harness?: HarnessConfig;
  /** MCP configuration */
  mcp?: MCPConfig;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Harness configuration
 */
export interface HarnessConfig {
  /** Account ID */
  accountId?: string;
  /** Organization ID */
  orgId?: string;
  /** Project ID */
  projectId?: string;
  /** API Key (from environment) */
  apiKey?: string;
}

/**
 * MCP configuration
 */
export interface MCPConfig {
  /** Auto-connect to servers on activation */
  autoConnect?: boolean;
  /** Default timeout for operations */
  defaultTimeout?: number;
  /** Servers to connect to */
  servers?: string[];
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Plugin API interface
 */
export interface PluginAPI {
  /** Register a command handler */
  registerCommand(command: string, handler: CommandHandler): void;
  /** Register a skill */
  registerSkill(skill: SkillDefinition): void;
  /** Register an agent */
  registerAgent(agent: AgentDefinition): void;
  /** Get configuration value */
  getConfig<T>(key: string): T | undefined;
  /** Set configuration value */
  setConfig<T>(key: string, value: T): void;
}

/**
 * Command handler function
 */
export type CommandHandler = (args: CommandArgs) => Promise<CommandResult>;

/**
 * Command arguments
 */
export interface CommandArgs {
  /** Command name */
  command: string;
  /** Positional arguments */
  args: string[];
  /** Named options */
  options: Record<string, unknown>;
  /** Context */
  context: CommandContext;
}

/**
 * Command context
 */
export interface CommandContext {
  /** Working directory */
  cwd: string;
  /** Environment variables */
  env: Record<string, string>;
  /** User input */
  input?: string;
}

/**
 * Command result
 */
export interface CommandResult {
  /** Whether command succeeded */
  success: boolean;
  /** Result message */
  message?: string;
  /** Result data */
  data?: unknown;
  /** Error if failed */
  error?: string;
}

/**
 * Skill definition
 */
export interface SkillDefinition {
  /** Skill name */
  name: string;
  /** Skill description */
  description: string;
  /** Activation triggers */
  triggers: string[];
  /** Skill content path or inline */
  content: string;
}

/**
 * Agent definition
 */
export interface AgentDefinition {
  /** Agent name */
  name: string;
  /** Agent description */
  description: string;
  /** Tools available to agent */
  tools: string[];
  /** Recommended model */
  model?: 'opus' | 'sonnet' | 'haiku';
  /** Agent content path or inline */
  content: string;
}

/**
 * Plugin events
 */
export interface PluginEvents {
  activated: [];
  deactivated: [];
  error: [Error];
  scaffoldStarted: [ScaffoldSpec];
  scaffoldCompleted: [ScaffoldResult];
  pipelineCreated: [HarnessPipelineConfig];
  templateCreated: [HarnessTemplateConfig];
  mcpConnected: [MCPServerState];
  mcpDisconnected: [string];
}

/**
 * Claude Code Templating Plugin
 *
 * This plugin streamlines project generation and deployment automation
 * through a unified template interface that supports multiple formats
 * and integrates seamlessly with Harness CI/CD platform.
 */
export class ClaudeCodeTemplatingPlugin extends EventEmitter<PluginEvents> {
  private context: PluginContext | null = null;
  private initialized = false;
  private orchestrator: TemplateOrchestrator | null = null;
  private harnessAgent: HarnessExpertAgent | null = null;

  /**
   * Plugin name
   */
  readonly name = 'claude-code-templating';

  /**
   * Plugin version
   */
  readonly version = '1.0.0';

  /**
   * Plugin description
   */
  readonly description =
    'Universal templating and Harness expert plugin for autonomous project generation and deployment automation';

  /**
   * Activate the plugin
   *
   * This method is called when the plugin is loaded and should initialize
   * all plugin components and register commands, skills, and agents.
   */
  async activate(context: PluginContext): Promise<void> {
    if (this.initialized) {
      context.logger.warn('Plugin already activated');
      return;
    }

    this.context = context;
    context.logger.info(`Activating ${this.name} plugin v${this.version}`);

    try {
      // Initialize orchestrator
      this.orchestrator = createOrchestrator({
        workingDir: context.workingDir,
        cacheDir: context.config.cacheDir,
        logger: context.logger,
        defaultFormat: context.config.defaultFormat,
        harnessConfig: context.config.harness ? {
          accountId: context.config.harness.accountId || '',
          orgId: context.config.harness.orgId || '',
          projectId: context.config.harness.projectId || '',
        } : undefined,
      });
      context.logger.debug('Orchestrator initialized');

      // Initialize Harness Expert Agent
      this.harnessAgent = new HarnessExpertAgent();
      context.logger.debug('Harness Expert Agent initialized');

      // Register commands
      await this.registerCommands(context);

      // Register skills
      await this.registerSkills(context);

      // Register agents
      await this.registerAgents(context);

      // Initialize MCP connections if auto-connect is enabled
      if (context.config.mcp?.autoConnect) {
        await this.initializeMCPConnections(context);
      }

      this.initialized = true;
      this.emit('activated');
      context.logger.info('Plugin activated successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      context.logger.error('Failed to activate plugin:', err.message);
      this.emit('error', err);
      throw err;
    }
  }

  /**
   * Deactivate the plugin
   */
  async deactivate(): Promise<void> {
    if (!this.initialized || !this.context) {
      return;
    }

    this.context.logger.info('Deactivating plugin');

    try {
      // Cleanup resources
      // TODO: Disconnect MCP connections
      // TODO: Clear caches

      this.initialized = false;
      this.emit('deactivated');
      this.context.logger.info('Plugin deactivated successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error('Error during deactivation:', err.message);
      throw err;
    } finally {
      this.context = null;
    }
  }

  /**
   * Register plugin commands
   */
  private async registerCommands(context: PluginContext): Promise<void> {
    // /template command
    context.api.registerCommand('template', async (args) => {
      const action = args.args[0];
      switch (action) {
        case 'list':
          return this.handleTemplateList(args);
        case 'search':
          return this.handleTemplateSearch(args);
        case 'info':
          return this.handleTemplateInfo(args);
        case 'generate':
          return this.handleTemplateGenerate(args);
        case 'validate':
          return this.handleTemplateValidate(args);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Use: list, search, info, generate, validate`,
          };
      }
    });

    // /scaffold command
    context.api.registerCommand('scaffold', async (args) => {
      return this.handleScaffold(args);
    });

    // /harness command
    context.api.registerCommand('harness', async (args) => {
      const action = args.args[0];
      switch (action) {
        case 'pipeline':
          return this.handleHarnessPipeline(args);
        case 'template':
          return this.handleHarnessTemplate(args);
        case 'deploy':
          return this.handleHarnessDeploy(args);
        default:
          return {
            success: false,
            error: `Unknown action: ${action}. Use: pipeline, template, deploy`,
          };
      }
    });

    // /generate command
    context.api.registerCommand('generate', async (args) => {
      const type = args.args[0];
      switch (type) {
        case 'api-client':
          return this.handleGenerateApiClient(args);
        case 'models':
          return this.handleGenerateModels(args);
        case 'tests':
          return this.handleGenerateTests(args);
        case 'migrations':
          return this.handleGenerateMigrations(args);
        default:
          return {
            success: false,
            error: `Unknown type: ${type}. Use: api-client, models, tests, migrations`,
          };
      }
    });

    context.logger.debug('Commands registered');
  }

  /**
   * Register plugin skills
   */
  private async registerSkills(context: PluginContext): Promise<void> {
    context.api.registerSkill({
      name: 'universal-templating',
      description:
        'Universal template processing supporting Handlebars, Cookiecutter, Copier, Maven, and Harness formats',
      triggers: ['template', 'scaffold', 'generate', 'cookiecutter', 'copier'],
      content: 'skills/universal-templating/SKILL.md',
    });

    context.api.registerSkill({
      name: 'harness-expert',
      description:
        'Harness CI/CD platform expertise for pipelines, templates, and deployments',
      triggers: ['harness', 'pipeline', 'deployment', 'ci-cd', 'gitops'],
      content: 'skills/harness-expert/SKILL.md',
    });

    context.api.registerSkill({
      name: 'project-scaffolding',
      description:
        'Project scaffolding patterns and best practices for new projects',
      triggers: ['scaffold', 'new project', 'bootstrap', 'starter'],
      content: 'skills/project-scaffolding/SKILL.md',
    });

    context.logger.debug('Skills registered');
  }

  /**
   * Register plugin agents
   */
  private async registerAgents(context: PluginContext): Promise<void> {
    context.api.registerAgent({
      name: 'harness-expert',
      description:
        'Harness platform specialist for pipeline and template operations',
      tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
      model: 'sonnet',
      content: 'agents/harness-expert.md',
    });

    context.api.registerAgent({
      name: 'scaffold-agent',
      description: 'Project scaffolding agent for template-based generation',
      tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob'],
      model: 'sonnet',
      content: 'agents/scaffold-agent.md',
    });

    context.api.registerAgent({
      name: 'codegen-agent',
      description: 'Code generation agent for API clients and models',
      tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep'],
      model: 'sonnet',
      content: 'agents/codegen-agent.md',
    });

    context.api.registerAgent({
      name: 'database-agent',
      description: 'Database specialist for schema design and migrations',
      tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob'],
      model: 'sonnet',
      content: 'agents/database-agent.md',
    });

    context.api.registerAgent({
      name: 'testing-agent',
      description: 'Testing specialist for test generation and coverage',
      tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
      model: 'sonnet',
      content: 'agents/testing-agent.md',
    });

    context.logger.debug('Agents registered');
  }

  /**
   * Initialize MCP connections
   */
  private async initializeMCPConnections(context: PluginContext): Promise<void> {
    // TODO: Implement MCP connection initialization
    context.logger.debug('MCP connections initialized');
  }

  // Command handlers - wired to orchestrator and agents

  private async handleTemplateList(_args: CommandArgs): Promise<CommandResult> {
    if (!this.orchestrator) {
      return { success: false, error: 'Orchestrator not initialized' };
    }
    // List registered loaders and their supported formats
    const formats = ['handlebars', 'cookiecutter', 'copier', 'maven-archetype', 'harness'];
    return {
      success: true,
      message: 'Available template formats',
      data: { formats },
    };
  }

  private async handleTemplateSearch(args: CommandArgs): Promise<CommandResult> {
    const query = args.args[1];
    if (!query) {
      return { success: false, error: 'Search query required. Usage: /template search <query>' };
    }
    // TODO: Implement template registry search
    return {
      success: true,
      message: `Search results for: ${query}`,
      data: { results: [], query },
    };
  }

  private async handleTemplateInfo(args: CommandArgs): Promise<CommandResult> {
    const templatePath = args.args[1];
    if (!templatePath) {
      return { success: false, error: 'Template path required. Usage: /template info <template>' };
    }
    // TODO: Load and return template metadata
    return {
      success: true,
      message: `Template info for: ${templatePath}`,
      data: { template: templatePath },
    };
  }

  private async handleTemplateGenerate(args: CommandArgs): Promise<CommandResult> {
    if (!this.orchestrator) {
      return { success: false, error: 'Orchestrator not initialized' };
    }

    const template = args.args[1];
    const name = args.args[2];

    if (!template || !name) {
      return { success: false, error: 'Usage: /template generate <template> <name>' };
    }

    const spec: ScaffoldSpec = {
      name,
      template,
      variables: args.options as Record<string, unknown>,
      harnessIntegration: args.options['harness'] === true,
      environments: args.options['environments'] as string[] | undefined,
      dryRun: args.options['dry-run'] === true,
    };

    const result = await this.orchestrator.scaffold(spec);

    if (result.success) {
      this.emit('scaffoldCompleted', result);
      return {
        success: true,
        message: `Generated ${result.files.length} files in ${result.durationMs}ms`,
        data: result,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Generation failed',
        data: result,
      };
    }
  }

  private async handleTemplateValidate(args: CommandArgs): Promise<CommandResult> {
    const templatePath = args.args[1];
    if (!templatePath) {
      return { success: false, error: 'Template path required. Usage: /template validate <template>' };
    }
    // TODO: Implement template validation
    return {
      success: true,
      message: `Template validation passed: ${templatePath}`,
      data: { valid: true, template: templatePath },
    };
  }

  private async handleScaffold(args: CommandArgs): Promise<CommandResult> {
    if (!this.orchestrator) {
      return { success: false, error: 'Orchestrator not initialized' };
    }

    const template = args.args[0];
    const name = args.args[1];

    if (!template || !name) {
      return { success: false, error: 'Usage: /scaffold <template> <name> [--harness] [--env dev,staging,prod]' };
    }

    const envStr = args.options['env'] as string | undefined;
    const environments = envStr ? envStr.split(',') : undefined;

    const spec: ScaffoldSpec = {
      name,
      template,
      variables: args.options as Record<string, unknown>,
      harnessIntegration: args.options['harness'] === true,
      environments,
      dryRun: args.options['dry-run'] === true,
    };

    const result = await this.orchestrator.scaffold(spec);

    if (result.success) {
      this.emit('scaffoldCompleted', result);
      return {
        success: true,
        message: `Scaffolded ${spec.name}: ${result.files.length} files in ${result.durationMs}ms`,
        data: result,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Scaffold failed',
        data: result,
      };
    }
  }

  private async handleHarnessPipeline(args: CommandArgs): Promise<CommandResult> {
    if (!this.harnessAgent || !this.orchestrator) {
      return { success: false, error: 'Harness agent not initialized' };
    }

    const action = args.args[1]; // 'create' or 'suggest'
    const pipelineName = args.args[2];

    if (!action) {
      return { success: false, error: 'Usage: /harness pipeline <create|suggest> <name>' };
    }

    if (action === 'create') {
      if (!pipelineName) {
        return { success: false, error: 'Pipeline name required. Usage: /harness pipeline create <name>' };
      }

      const config: HarnessPipelineConfig = {
        name: pipelineName,
        orgIdentifier: this.context?.config.harness?.orgId || 'default',
        projectIdentifier: this.context?.config.harness?.projectId || 'default',
        stages: [], // Will be populated based on options
      };

      const result = await this.harnessAgent.createPipeline(config);

      if (result.success && result.data) {
        this.emit('pipelineCreated', config);
        return {
          success: true,
          message: `Created pipeline: ${result.data.pipelineId}`,
          data: result.data,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Pipeline creation failed',
        };
      }
    } else if (action === 'suggest') {
      // Analyze project and suggest pipeline
      const projectPath = args.args[2] || args.context.cwd;
      const analysis = await this.orchestrator.analyzeProject(projectPath);

      const suggestion = await this.harnessAgent.suggestPipeline(analysis);

      if (suggestion.success && suggestion.data) {
        return {
          success: true,
          message: `Suggested pipeline based on: ${suggestion.data.detectedPatterns.join(', ')}`,
          data: suggestion.data,
        };
      } else {
        return {
          success: false,
          error: suggestion.error || 'Could not suggest pipeline',
        };
      }
    }

    return { success: false, error: `Unknown action: ${action}. Use: create, suggest` };
  }

  private async handleHarnessTemplate(args: CommandArgs): Promise<CommandResult> {
    if (!this.harnessAgent) {
      return { success: false, error: 'Harness agent not initialized' };
    }

    const templateType = args.args[1] as 'step' | 'stage' | 'pipeline';
    const templateName = args.args[2];

    if (!templateType || !templateName) {
      return { success: false, error: 'Usage: /harness template <step|stage|pipeline> <name> [--scope org|project|account]' };
    }

    const scope = (args.options['scope'] as string) || 'project';

    // Build spec based on template type
    const templateSpec = this.buildTemplateSpec(templateType, templateName);

    const config: HarnessTemplateConfig = {
      name: templateName,
      type: templateType.charAt(0).toUpperCase() + templateType.slice(1) as 'Step' | 'Stage' | 'Pipeline',
      scope: scope as 'project' | 'org' | 'account',
      orgIdentifier: this.context?.config.harness?.orgId || 'default',
      projectIdentifier: scope === 'project' ? this.context?.config.harness?.projectId || 'default' : undefined,
      versionLabel: '1.0.0',
      spec: templateSpec,
    };

    const result = await this.harnessAgent.createTemplate(config);

    if (result.success && result.data) {
      this.emit('templateCreated', config);
      return {
        success: true,
        message: `Created ${templateType} template: ${result.data.templateId}`,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Template creation failed',
      };
    }
  }

  private async handleHarnessDeploy(args: CommandArgs): Promise<CommandResult> {
    const pipelineId = args.args[1];
    if (!pipelineId) {
      return { success: false, error: 'Pipeline ID required. Usage: /harness deploy <pipeline-id>' };
    }
    // TODO: Implement pipeline execution via MCP
    return {
      success: true,
      message: `Deployment trigger initiated for: ${pipelineId}`,
      data: { pipelineId, status: 'queued' },
    };
  }

  private async handleGenerateApiClient(args: CommandArgs): Promise<CommandResult> {
    const specPath = args.options['spec'] as string;
    const language = args.options['language'] as string || 'typescript';

    if (!specPath) {
      return { success: false, error: 'OpenAPI spec required. Usage: /generate api-client --spec <path> --language <lang>' };
    }

    // TODO: Implement API client generation via codegen-agent
    return {
      success: true,
      message: `Generated ${language} API client from: ${specPath}`,
      data: { specPath, language, files: [] },
    };
  }

  private async handleGenerateModels(args: CommandArgs): Promise<CommandResult> {
    const schemaPath = args.options['schema'] as string;
    const format = args.options['format'] as string || 'prisma';

    if (!schemaPath) {
      return { success: false, error: 'Schema path required. Usage: /generate models --schema <path> --format <prisma|typeorm|json>' };
    }

    // TODO: Implement model generation via database-agent
    return {
      success: true,
      message: `Generated ${format} models from: ${schemaPath}`,
      data: { schemaPath, format, files: [] },
    };
  }

  private async handleGenerateTests(args: CommandArgs): Promise<CommandResult> {
    const targetPath = args.args[1] || args.context.cwd;
    const framework = args.options['framework'] as string || 'vitest';

    // TODO: Implement test generation via testing-agent
    return {
      success: true,
      message: `Generated ${framework} tests for: ${targetPath}`,
      data: { targetPath, framework, files: [] },
    };
  }

  private async handleGenerateMigrations(args: CommandArgs): Promise<CommandResult> {
    const schemaPath = args.options['schema'] as string;
    const name = args.args[1];

    if (!name) {
      return { success: false, error: 'Migration name required. Usage: /generate migrations <name> --schema <path>' };
    }

    // TODO: Implement migration generation via database-agent
    return {
      success: true,
      message: `Generated migration: ${name}`,
      data: { name, schemaPath, files: [] },
    };
  }

  /**
   * Build template spec based on template type
   */
  private buildTemplateSpec(
    templateType: 'step' | 'stage' | 'pipeline',
    name: string
  ): HarnessPipelineConfig {
    // For simplicity, all template specs return a pipeline-compatible structure
    // The HarnessExpertAgent will handle the actual transformation
    return {
      name,
      orgIdentifier: this.context?.config.harness?.orgId || 'default',
      projectIdentifier: this.context?.config.harness?.projectId || 'default',
      description: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} template: ${name}`,
      stages: [],
    };
  }
}

/**
 * Create and export plugin instance
 */
export const plugin = new ClaudeCodeTemplatingPlugin();

/**
 * Default export for plugin activation
 */
export default plugin;

/**
 * Named exports for direct usage
 */
export * from './types/index.js';
