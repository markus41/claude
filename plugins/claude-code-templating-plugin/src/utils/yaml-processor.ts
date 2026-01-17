/**
 * YAML Processor - YAML parsing and generation utilities
 *
 * Provides YAML processing capabilities optimized for Harness configurations
 * with support for expressions, anchors, and custom tags.
 */

import { parse, stringify, Document } from 'yaml';

/**
 * YAML parse options
 */
export interface YamlParseOptions {
  /** Keep original key order */
  keepOrder?: boolean;
  /** Preserve blank lines */
  keepBlankLines?: boolean;
  /** Merge anchors */
  mergeAnchors?: boolean;
  /** Custom tag handlers */
  customTags?: CustomTagHandler[];
}

/**
 * YAML stringify options
 */
export interface YamlStringifyOptions {
  /** Indentation spaces */
  indent?: number;
  /** Line width before wrapping */
  lineWidth?: number;
  /** Quote style for strings */
  defaultStringType?: 'PLAIN' | 'QUOTE_SINGLE' | 'QUOTE_DOUBLE';
  /** Minimum length to use block scalar style */
  minContentWidth?: number;
  /** Sort keys */
  sortKeys?: boolean;
  /** Custom key order */
  keyOrder?: string[];
}

/**
 * Custom tag handler
 */
export interface CustomTagHandler {
  /** Tag identifier */
  tag: string;
  /** Parse function */
  parse: (value: string) => unknown;
  /** Stringify function */
  stringify: (value: unknown) => string;
}

/**
 * YAML validation result
 */
export interface YamlValidationResult {
  valid: boolean;
  errors: YamlError[];
  warnings: YamlWarning[];
  document?: unknown;
}

/**
 * YAML error
 */
export interface YamlError {
  message: string;
  line?: number;
  column?: number;
  path?: string;
}

/**
 * YAML warning
 */
export interface YamlWarning {
  message: string;
  line?: number;
  suggestion?: string;
}

/**
 * Default options
 */
const DEFAULT_PARSE_OPTIONS: Required<YamlParseOptions> = {
  keepOrder: true,
  keepBlankLines: false,
  mergeAnchors: true,
  customTags: [],
};

const DEFAULT_STRINGIFY_OPTIONS: Required<YamlStringifyOptions> = {
  indent: 2,
  lineWidth: 120,
  defaultStringType: 'PLAIN',
  minContentWidth: 80,
  sortKeys: false,
  keyOrder: [],
};

/**
 * Harness expression pattern
 */
const HARNESS_EXPRESSION_PATTERN = /<\+[a-zA-Z_][a-zA-Z0-9_.]*>/g;

/**
 * YAML Processor
 */
export class YamlProcessor {
  private readonly parseOptions: Required<YamlParseOptions>;
  private readonly stringifyOptions: Required<YamlStringifyOptions>;

  constructor(
    parseOptions?: YamlParseOptions,
    stringifyOptions?: YamlStringifyOptions
  ) {
    this.parseOptions = { ...DEFAULT_PARSE_OPTIONS, ...parseOptions };
    this.stringifyOptions = { ...DEFAULT_STRINGIFY_OPTIONS, ...stringifyOptions };
  }

  /**
   * Parse YAML string to object
   */
  parse<T = unknown>(yaml: string, options?: YamlParseOptions): T {
    const opts = { ...this.parseOptions, ...options };

    try {
      const document = parse(yaml, {
        keepSourceTokens: opts.keepOrder,
        merge: opts.mergeAnchors,
      });

      return document as T;
    } catch (error) {
      throw new YamlParseError(
        `Failed to parse YAML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Parse YAML with detailed error information
   */
  parseWithErrors<T = unknown>(yaml: string): YamlValidationResult {
    try {
      const document = this.parse<T>(yaml);
      return {
        valid: true,
        errors: [],
        warnings: this.checkWarnings(yaml),
        document,
      };
    } catch (error) {
      if (error instanceof YamlParseError) {
        return {
          valid: false,
          errors: [{ message: error.message }],
          warnings: [],
        };
      }

      // Extract line/column from yaml library errors
      const err = error as { mark?: { line: number; column: number } };
      return {
        valid: false,
        errors: [{
          message: error instanceof Error ? error.message : String(error),
          line: err.mark?.line,
          column: err.mark?.column,
        }],
        warnings: [],
      };
    }
  }

  /**
   * Stringify object to YAML
   */
  stringify(value: unknown, options?: YamlStringifyOptions): string {
    const opts = { ...this.stringifyOptions, ...options };

    // Apply key ordering if specified
    let processedValue = value;
    if (opts.keyOrder.length > 0) {
      processedValue = this.orderKeys(value, opts.keyOrder);
    }

    return stringify(processedValue, {
      indent: opts.indent,
      lineWidth: opts.lineWidth,
      defaultStringType: opts.defaultStringType as 'PLAIN' | 'QUOTE_SINGLE' | 'QUOTE_DOUBLE',
      minContentWidth: opts.minContentWidth,
      sortMapEntries: opts.sortKeys,
    });
  }

  /**
   * Validate YAML syntax
   */
  validate(yaml: string): YamlValidationResult {
    return this.parseWithErrors(yaml);
  }

  /**
   * Merge multiple YAML documents
   */
  merge(...documents: unknown[]): unknown {
    return documents.reduce((acc, doc) => this.deepMerge(acc, doc), {});
  }

  /**
   * Extract Harness expressions from YAML
   */
  extractExpressions(yaml: string): string[] {
    const matches = yaml.match(HARNESS_EXPRESSION_PATTERN);
    return matches ? [...new Set(matches)] : [];
  }

  /**
   * Replace Harness expressions with values
   */
  replaceExpressions(
    yaml: string,
    values: Record<string, string>
  ): string {
    let result = yaml;

    for (const [expression, value] of Object.entries(values)) {
      const pattern = expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(pattern, 'g'), value);
    }

    return result;
  }

  /**
   * Validate Harness expressions
   */
  validateExpressions(yaml: string): ExpressionValidationResult {
    const expressions = this.extractExpressions(yaml);
    const errors: ExpressionError[] = [];
    const valid: string[] = [];

    for (const expr of expressions) {
      const validation = this.validateExpression(expr);
      if (validation.valid) {
        valid.push(expr);
      } else {
        errors.push({ expression: expr, message: validation.error! });
      }
    }

    return {
      valid: errors.length === 0,
      expressions: valid,
      errors,
    };
  }

  /**
   * Pretty print YAML with comments
   */
  prettyPrint(value: unknown, comments?: Record<string, string>): string {
    const doc = new Document(value);

    // Add comments if provided
    if (comments) {
      this.addComments(doc, comments);
    }

    return doc.toString({
      indent: this.stringifyOptions.indent,
      lineWidth: this.stringifyOptions.lineWidth,
    });
  }

  /**
   * Convert JSON to YAML
   */
  fromJson(json: string): string {
    const obj = JSON.parse(json);
    return this.stringify(obj);
  }

  /**
   * Convert YAML to JSON
   */
  toJson(yaml: string, pretty = true): string {
    const obj = this.parse(yaml);
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  }

  /**
   * Get value at path
   */
  getPath(yaml: string, path: string): unknown {
    const obj = this.parse(yaml);
    return this.getValueAtPath(obj, path);
  }

  /**
   * Set value at path
   */
  setPath(yaml: string, path: string, value: unknown): string {
    const obj = this.parse(yaml);
    this.setValueAtPath(obj, path, value);
    return this.stringify(obj);
  }

  /**
   * Delete value at path
   */
  deletePath(yaml: string, path: string): string {
    const obj = this.parse(yaml);
    this.deleteValueAtPath(obj, path);
    return this.stringify(obj);
  }

  /**
   * Check for common warnings
   */
  private checkWarnings(yaml: string): YamlWarning[] {
    const warnings: YamlWarning[] = [];

    // Check for tabs
    if (yaml.includes('\t')) {
      warnings.push({
        message: 'YAML contains tab characters. Use spaces for indentation.',
        suggestion: 'Replace tabs with spaces.',
      });
    }

    // Check for trailing whitespace
    if (/[ \t]+$/m.test(yaml)) {
      warnings.push({
        message: 'YAML contains trailing whitespace.',
        suggestion: 'Remove trailing whitespace.',
      });
    }

    // Check for long lines
    const lines = yaml.split('\n');
    lines.forEach((line, index) => {
      if (line.length > 200) {
        warnings.push({
          message: `Line ${index + 1} is very long (${line.length} characters).`,
          line: index + 1,
          suggestion: 'Consider using block scalars for long strings.',
        });
      }
    });

    return warnings;
  }

  /**
   * Validate single expression
   */
  private validateExpression(expr: string): { valid: boolean; error?: string } {
    // Check basic format
    if (!expr.startsWith('<+') || !expr.endsWith('>')) {
      return { valid: false, error: 'Invalid expression format' };
    }

    // Extract inner content
    const inner = expr.slice(2, -1);

    // Check for valid characters
    if (!/^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(inner)) {
      return { valid: false, error: `Invalid characters in expression: ${inner}` };
    }

    // Check known expression prefixes
    const knownPrefixes = [
      'input',
      'pipeline',
      'stage',
      'step',
      'artifact',
      'manifest',
      'service',
      'env',
      'infra',
      'variable',
      'secrets',
    ];

    const prefix = inner.split('.')[0];
    if (!knownPrefixes.includes(prefix ?? '')) {
      return { valid: true }; // Valid but potentially unknown
    }

    return { valid: true };
  }

  /**
   * Deep merge objects
   */
  private deepMerge(target: unknown, source: unknown): unknown {
    if (!source) return target;
    if (!target) return source;

    if (typeof target !== 'object' || typeof source !== 'object') {
      return source;
    }

    if (Array.isArray(target) && Array.isArray(source)) {
      return [...target, ...source];
    }

    const result = { ...target as Record<string, unknown> };
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
      result[key] = this.deepMerge(result[key], value);
    }

    return result;
  }

  /**
   * Order keys according to preference
   */
  private orderKeys(value: unknown, order: string[]): unknown {
    if (!value || typeof value !== 'object') return value;

    if (Array.isArray(value)) {
      return value.map((item) => this.orderKeys(item, order));
    }

    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    // Add keys in specified order first
    for (const key of order) {
      if (key in obj) {
        result[key] = this.orderKeys(obj[key], order);
      }
    }

    // Add remaining keys
    for (const key of Object.keys(obj)) {
      if (!(key in result)) {
        result[key] = this.orderKeys(obj[key], order);
      }
    }

    return result;
  }

  /**
   * Add comments to document
   */
  private addComments(doc: Document, comments: Record<string, string>): void {
    // Implementation for adding comments to specific paths
    // This is a simplified version - sets document comment
    const paths = Object.keys(comments);
    if (paths.length > 0 && paths[0] === '') {
      doc.comment = comments[''] ?? null;
    }
    // Full implementation would traverse the document tree
    // and add comments to specific nodes based on path
  }

  /**
   * Get value at path in object
   */
  private getValueAtPath(obj: unknown, path: string): unknown {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;

      // Handle array index
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = (current as Record<string, unknown>)[key ?? ''];
        if (Array.isArray(current)) {
          current = current[parseInt(index ?? '0', 10)];
        } else {
          return undefined;
        }
      } else {
        current = (current as Record<string, unknown>)[part];
      }
    }

    return current;
  }

  /**
   * Set value at path in object
   */
  private setValueAtPath(obj: unknown, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj as Record<string, unknown>;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part) continue;

      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      current[lastPart] = value;
    }
  }

  /**
   * Delete value at path in object
   */
  private deleteValueAtPath(obj: unknown, path: string): void {
    const parts = path.split('.');
    let current = obj as Record<string, unknown>;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part || !(part in current)) return;
      current = current[part] as Record<string, unknown>;
    }

    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      delete current[lastPart];
    }
  }
}

/**
 * YAML parse error
 */
export class YamlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YamlParseError';
  }
}

/**
 * Expression validation result
 */
export interface ExpressionValidationResult {
  valid: boolean;
  expressions: string[];
  errors: ExpressionError[];
}

/**
 * Expression error
 */
export interface ExpressionError {
  expression: string;
  message: string;
}

/**
 * Create YAML processor instance
 */
export function createYamlProcessor(
  parseOptions?: YamlParseOptions,
  stringifyOptions?: YamlStringifyOptions
): YamlProcessor {
  return new YamlProcessor(parseOptions, stringifyOptions);
}

export default YamlProcessor;
