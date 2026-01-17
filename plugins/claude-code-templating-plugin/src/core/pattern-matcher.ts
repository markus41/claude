/**
 * Pattern Matcher - Intent Detection and Routing
 *
 * Detects user intent and routes requests to appropriate template
 * engines and agents, streamlining the template selection process.
 */

import type {
  TemplateFormat,
  ProjectType,
  ProjectAnalysis,
} from '../types/scaffold.js';

/**
 * Pattern match result
 */
export interface PatternMatchResult {
  /** Matched pattern type */
  type: PatternType;
  /** Confidence score (0-1) */
  confidence: number;
  /** Detected template format */
  format?: TemplateFormat;
  /** Detected project type */
  projectType?: ProjectType;
  /** Suggested template */
  suggestedTemplate?: string;
  /** Extracted entities */
  entities: Record<string, string>;
  /** Match reasoning */
  reasoning: string;
}

/**
 * Pattern types
 */
export type PatternType =
  | 'scaffold'
  | 'pipeline'
  | 'template'
  | 'generate'
  | 'analyze'
  | 'unknown';

/**
 * Pattern definition
 */
interface Pattern {
  type: PatternType;
  keywords: string[];
  indicators: string[];
  weight: number;
}

/**
 * Template suggestion mapping
 */
interface TemplateSuggestion {
  keywords: string[];
  template: string;
  projectType: ProjectType;
  format: TemplateFormat;
}

/**
 * Pattern Matcher
 *
 * Analyzes user input and context to determine intent and route
 * to appropriate handlers for optimal workflow efficiency.
 */
export class PatternMatcher {
  private readonly patterns: Pattern[] = [
    {
      type: 'scaffold',
      keywords: ['scaffold', 'create', 'new', 'init', 'bootstrap', 'start'],
      indicators: ['project', 'app', 'service', 'microservice', 'api', 'library'],
      weight: 1.0,
    },
    {
      type: 'pipeline',
      keywords: ['pipeline', 'ci', 'cd', 'cicd', 'deploy', 'build', 'release'],
      indicators: ['harness', 'jenkins', 'github actions', 'gitlab', 'workflow'],
      weight: 1.0,
    },
    {
      type: 'template',
      keywords: ['template', 'step', 'stage', 'harness template'],
      indicators: ['reusable', 'shared', 'library', 'org', 'account'],
      weight: 0.9,
    },
    {
      type: 'generate',
      keywords: ['generate', 'gen', 'create', 'make'],
      indicators: ['api client', 'models', 'tests', 'migrations', 'schema'],
      weight: 0.8,
    },
    {
      type: 'analyze',
      keywords: ['analyze', 'scan', 'detect', 'check', 'review'],
      indicators: ['project', 'codebase', 'patterns', 'structure'],
      weight: 0.7,
    },
  ];

  private readonly templateSuggestions: TemplateSuggestion[] = [
    {
      keywords: ['fastapi', 'python', 'api', 'rest'],
      template: 'fastapi-microservice',
      projectType: 'api',
      format: 'cookiecutter',
    },
    {
      keywords: ['spring', 'java', 'boot', 'microservice'],
      template: 'spring-boot-service',
      projectType: 'microservice',
      format: 'maven-archetype',
    },
    {
      keywords: ['react', 'typescript', 'frontend', 'webapp', 'ui'],
      template: 'react-typescript',
      projectType: 'webapp',
      format: 'copier',
    },
    {
      keywords: ['etl', 'data', 'pipeline', 'airflow', 'spark'],
      template: 'etl-pipeline',
      projectType: 'etl-pipeline',
      format: 'cookiecutter',
    },
    {
      keywords: ['node', 'express', 'typescript', 'api'],
      template: 'node-typescript-api',
      projectType: 'api',
      format: 'handlebars',
    },
    {
      keywords: ['go', 'golang', 'microservice', 'service'],
      template: 'go-microservice',
      projectType: 'microservice',
      format: 'handlebars',
    },
    {
      keywords: ['terraform', 'infrastructure', 'iac', 'cloud'],
      template: 'terraform-module',
      projectType: 'infrastructure',
      format: 'handlebars',
    },
    {
      keywords: ['cli', 'command', 'tool', 'utility'],
      template: 'cli-tool',
      projectType: 'cli',
      format: 'cookiecutter',
    },
  ];

  /**
   * Match input against patterns
   */
  match(input: string, context?: MatchContext): PatternMatchResult {
    const normalizedInput = input.toLowerCase();
    const tokens = this.tokenize(normalizedInput);

    // Score each pattern
    const scores = this.patterns.map((pattern) => ({
      pattern,
      score: this.scorePattern(pattern, tokens, normalizedInput),
    }));

    // Find best match
    const bestMatch = scores.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // Extract entities
    const entities = this.extractEntities(normalizedInput, tokens);

    // Get template suggestion if scaffold type
    let suggestedTemplate: string | undefined;
    let format: TemplateFormat | undefined;
    let projectType: ProjectType | undefined;

    if (bestMatch.pattern.type === 'scaffold') {
      const suggestion = this.suggestTemplate(tokens);
      if (suggestion) {
        suggestedTemplate = suggestion.template;
        format = suggestion.format;
        projectType = suggestion.projectType;
      }
    }

    // Incorporate context
    if (context) {
      if (context.projectAnalysis) {
        projectType = context.projectAnalysis.projectType;
      }
      if (context.currentFormat) {
        format = context.currentFormat;
      }
    }

    return {
      type: bestMatch.score > 0.3 ? bestMatch.pattern.type : 'unknown',
      confidence: bestMatch.score,
      format,
      projectType,
      suggestedTemplate,
      entities,
      reasoning: this.generateReasoning(bestMatch.pattern, bestMatch.score, tokens),
    };
  }

  /**
   * Detect template format from source path or content
   */
  detectTemplateFormat(source: string): TemplateFormat {
    const normalized = source.toLowerCase();

    // Check for format indicators in path/URL
    if (normalized.includes('cookiecutter')) return 'cookiecutter';
    if (normalized.includes('copier')) return 'copier';
    if (normalized.includes('archetype')) return 'maven-archetype';
    if (normalized.includes('.harness') || normalized.includes('harness')) return 'harness';
    if (normalized.endsWith('.hbs')) return 'handlebars';

    // Default
    return 'handlebars';
  }

  /**
   * Detect project type from analysis
   */
  detectProjectType(analysis: ProjectAnalysis): ProjectType {
    // Use analysis results
    if (analysis.projectType !== 'unknown') {
      return analysis.projectType;
    }

    // Infer from frameworks
    const frameworks = analysis.frameworks.map((f) => f.toLowerCase());

    if (frameworks.some((f) => ['react', 'vue', 'angular', 'svelte'].includes(f))) {
      return 'webapp';
    }
    if (frameworks.some((f) => ['express', 'fastify', 'koa', 'nest'].includes(f))) {
      return 'api';
    }
    if (frameworks.some((f) => ['spring', 'quarkus', 'micronaut'].includes(f))) {
      return 'microservice';
    }
    if (analysis.language === 'hcl' || frameworks.includes('terraform')) {
      return 'infrastructure';
    }

    return 'unknown';
  }

  /**
   * Get template suggestions for project type
   */
  getSuggestionsForType(projectType: ProjectType): TemplateSuggestion[] {
    return this.templateSuggestions.filter(
      (s) => s.projectType === projectType
    );
  }

  /**
   * Tokenize input string
   */
  private tokenize(input: string): string[] {
    return input
      .split(/[\s,.-]+/)
      .filter((token) => token.length > 1);
  }

  /**
   * Score a pattern against tokens
   */
  private scorePattern(
    pattern: Pattern,
    tokens: string[],
    input: string
  ): number {
    let score = 0;

    // Check keywords
    for (const keyword of pattern.keywords) {
      if (input.includes(keyword)) {
        score += 0.3;
      }
      if (tokens.includes(keyword)) {
        score += 0.2;
      }
    }

    // Check indicators
    for (const indicator of pattern.indicators) {
      if (input.includes(indicator)) {
        score += 0.2;
      }
    }

    // Apply weight
    score *= pattern.weight;

    // Normalize
    return Math.min(1, score);
  }

  /**
   * Extract entities from input
   */
  private extractEntities(
    input: string,
    tokens: string[]
  ): Record<string, string> {
    const entities: Record<string, string> = {};

    // Extract project name - prefer "called" or "named" patterns first
    const calledMatch = input.match(/(?:called|named)\s+["']?([a-z0-9-_]+)["']?/i);
    if (calledMatch?.[1]) {
      entities['name'] = calledMatch[1];
    } else {
      // Fallback: look for name at end after common patterns
      const endNameMatch = input.match(/(?:create|scaffold|new)\s+(?:a\s+)?(?:new\s+)?(?:\w+\s+)*?["']?([a-z0-9-_]+)["']?\s*$/i);
      if (endNameMatch?.[1]) {
        entities['name'] = endNameMatch[1];
      }
    }

    // Extract template name
    const templateMatch = input.match(/(?:from|using|template)\s+["']?([a-z0-9-_]+)["']?/i);
    if (templateMatch?.[1]) {
      entities['template'] = templateMatch[1];
    }

    // Extract environments
    const envMatch = input.match(/(?:env|environment|deploy to)\s+([a-z,\s]+)/i);
    if (envMatch?.[1]) {
      entities['environments'] = envMatch[1].replace(/\s+/g, '');
    }

    // Extract language
    const languages = ['typescript', 'javascript', 'python', 'java', 'go', 'rust', 'ruby'];
    for (const lang of languages) {
      if (tokens.includes(lang)) {
        entities['language'] = lang;
        break;
      }
    }

    return entities;
  }

  /**
   * Suggest template based on tokens
   */
  private suggestTemplate(tokens: string[]): TemplateSuggestion | undefined {
    let bestMatch: TemplateSuggestion | undefined;
    let bestScore = 0;

    for (const suggestion of this.templateSuggestions) {
      let score = 0;
      for (const keyword of suggestion.keywords) {
        if (tokens.includes(keyword)) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = suggestion;
      }
    }

    return bestScore > 0 ? bestMatch : undefined;
  }

  /**
   * Generate reasoning for match
   */
  private generateReasoning(
    pattern: Pattern,
    score: number,
    tokens: string[]
  ): string {
    const matchedKeywords = pattern.keywords.filter((k) =>
      tokens.some((t) => t.includes(k))
    );
    const matchedIndicators = pattern.indicators.filter((i) =>
      tokens.some((t) => t.includes(i))
    );

    if (score < 0.3) {
      return 'No strong pattern match detected';
    }

    const parts: string[] = [];
    if (matchedKeywords.length > 0) {
      parts.push(`keywords: ${matchedKeywords.join(', ')}`);
    }
    if (matchedIndicators.length > 0) {
      parts.push(`indicators: ${matchedIndicators.join(', ')}`);
    }

    return `Matched ${pattern.type} pattern (${(score * 100).toFixed(0)}% confidence) based on ${parts.join('; ')}`;
  }
}

/**
 * Match context for enhanced detection
 */
export interface MatchContext {
  /** Current working directory */
  cwd?: string;
  /** Previously analyzed project */
  projectAnalysis?: ProjectAnalysis;
  /** Current template format being used */
  currentFormat?: TemplateFormat;
  /** User preferences */
  preferences?: Record<string, unknown>;
}

/**
 * Create pattern matcher instance
 */
export function createPatternMatcher(): PatternMatcher {
  return new PatternMatcher();
}

export default PatternMatcher;
