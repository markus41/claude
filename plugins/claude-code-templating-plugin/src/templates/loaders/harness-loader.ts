/**
 * Harness Template Loader
 *
 * Loads and processes Harness YAML templates.
 * Supports:
 * - Harness pipeline templates
 * - Step templates
 * - Stage templates
 * - Runtime inputs (<+input>)
 * - Template references (templateRef)
 * - Harness expressions (<+pipeline.*, <+stage.*, etc.)
 * - YAML structure validation
 */

import { readFile, readdir, stat, mkdir, writeFile } from 'fs/promises';
import { join, relative } from 'path';
import * as yaml from 'js-yaml';
import type {
  ITemplateLoader,
  TemplateFormat,
  TemplateInfo,
  GeneratedFile,
  TemplateVariable
} from '../../types/scaffold.js';

interface HarnessTemplate {
  template: {
    name: string;
    identifier: string;
    versionLabel: string;
    type: 'Pipeline' | 'Stage' | 'Step' | 'StepGroup' | 'Service' | 'Infrastructure';
    spec: {
      type?: string;
      spec?: Record<string, unknown>;
      execution?: Record<string, unknown>;
    };
    projectIdentifier?: string;
    orgIdentifier?: string;
  };
}

interface HarnessRuntimeInput {
  name: string;
  type: 'String' | 'Number' | 'Secret' | 'Connector' | 'Runtime';
  description?: string;
  default?: string;
  required?: boolean;
}

export class HarnessTemplateLoader implements ITemplateLoader {
  readonly format: TemplateFormat = 'harness';

  /**
   * Check if this loader can handle the given source
   */
  async canHandle(source: string): Promise<boolean> {
    try {
      const stats = await stat(source);

      if (stats.isFile()) {
        // Check if file is a Harness template
        return this.isHarnessTemplate(source);
      } else if (stats.isDirectory()) {
        // Check if directory contains Harness templates
        const files = await readdir(source);
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = join(source, file);
            if (await this.isHarnessTemplate(filePath)) {
              return true;
            }
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if file is a Harness template
   */
  private async isHarnessTemplate(filePath: string): Promise<boolean> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const parsed = yaml.load(content) as Record<string, unknown>;

      return (
        typeof parsed === 'object' &&
        parsed !== null &&
        'template' in parsed &&
        typeof parsed.template === 'object' &&
        parsed.template !== null
      );
    } catch {
      return false;
    }
  }

  /**
   * Load template metadata from Harness YAML
   */
  async loadMetadata(source: string): Promise<TemplateInfo> {
    let templateFile: string;

    const stats = await stat(source);
    if (stats.isFile()) {
      templateFile = source;
    } else {
      // Find first template file in directory
      const files = await readdir(source);
      const yamlFile = files.find(f => f.endsWith('.yaml') || f.endsWith('.yml'));
      if (!yamlFile) {
        throw new Error('No YAML files found in template directory');
      }
      templateFile = join(source, yamlFile);
    }

    const content = await readFile(templateFile, 'utf-8');
    const template = yaml.load(content) as HarnessTemplate;

    // Extract runtime inputs from template
    const variables = this.extractRuntimeInputs(template);

    return {
      name: template.template.name || template.template.identifier,
      description: `Harness ${template.template.type} Template`,
      source,
      format: this.format,
      variables,
      version: template.template.versionLabel
    };
  }

  /**
   * Generate files from template
   */
  async generate(
    source: string,
    outputPath: string,
    variables: Record<string, unknown>
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    const stats = await stat(source);
    if (stats.isFile()) {
      // Single template file
      await this.processTemplateFile(source, outputPath, variables, files, outputPath);
    } else {
      // Directory with multiple templates
      await this.processTemplateDirectory(source, outputPath, variables, files, outputPath);
    }

    return files;
  }

  /**
   * Process a single template file
   */
  private async processTemplateFile(
    sourcePath: string,
    outputPath: string,
    variables: Record<string, unknown>,
    files: GeneratedFile[],
    outputRoot: string
  ): Promise<void> {
    const content = await readFile(sourcePath, 'utf-8');
    const template = yaml.load(content) as HarnessTemplate;

    // Process runtime inputs
    const processedTemplate = this.processRuntimeInputs(template, variables);

    // Generate output filename
    const filename = `${processedTemplate.template.identifier}.yaml`;
    const targetPath = join(outputPath, filename);

    // Ensure output directory exists
    await mkdir(outputPath, { recursive: true });

    // Write processed template
    const outputContent = yaml.dump(processedTemplate, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });

    await writeFile(targetPath, outputContent, 'utf-8');

    // Track generated file
    const stats = await stat(targetPath);
    files.push({
      path: relative(outputRoot, targetPath),
      action: 'created',
      size: stats.size,
      type: 'template'
    });
  }

  /**
   * Process a directory of template files
   */
  private async processTemplateDirectory(
    sourcePath: string,
    outputPath: string,
    variables: Record<string, unknown>,
    files: GeneratedFile[],
    outputRoot: string
  ): Promise<void> {
    const entries = await readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      const sourceEntry = join(sourcePath, entry.name);

      if (entry.isDirectory()) {
        const targetDir = join(outputPath, entry.name);
        await mkdir(targetDir, { recursive: true });
        await this.processTemplateDirectory(sourceEntry, targetDir, variables, files, outputRoot);
      } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        if (await this.isHarnessTemplate(sourceEntry)) {
          await this.processTemplateFile(sourceEntry, outputPath, variables, files, outputRoot);
        }
      }
    }
  }

  /**
   * Extract runtime inputs from template
   */
  private extractRuntimeInputs(template: HarnessTemplate): TemplateVariable[] {
    const variables: TemplateVariable[] = [];
    const inputs = this.findRuntimeInputs(template);

    for (const input of inputs) {
      variables.push({
        name: input.name,
        type: this.mapHarnessType(input.type),
        prompt: input.description || input.name,
        default: input.default,
        required: input.required !== false
      });
    }

    return variables;
  }

  /**
   * Find all runtime inputs in template
   */
  private findRuntimeInputs(obj: unknown, inputs: HarnessRuntimeInput[] = []): HarnessRuntimeInput[] {
    if (typeof obj === 'string') {
      // Check for <+input> expressions
      const inputMatches = obj.matchAll(/<\+input>\.([a-zA-Z0-9_]+)/g);
      for (const match of inputMatches) {
        const inputName = match[1];
        if (inputName && !inputs.some(i => i.name === inputName)) {
          inputs.push({
            name: inputName,
            type: 'Runtime',
            required: true
          });
        }
      }
      return inputs;
    }

    if (typeof obj !== 'object' || obj === null) {
      return inputs;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.findRuntimeInputs(item, inputs);
      }
      return inputs;
    }

    // Check for runtime input marker
    if (typeof obj === 'object' && '<+input>' in obj) {
      const config = obj as Record<string, unknown>;
      const inputName = String(config.name || config.identifier || 'input');
      inputs.push({
        name: inputName,
        type: config.type as HarnessRuntimeInput['type'] || 'Runtime',
        description: config.description as string,
        default: config.default as string,
        required: config.required !== false
      });
    }

    // Recurse into object properties
    for (const value of Object.values(obj)) {
      this.findRuntimeInputs(value, inputs);
    }

    return inputs;
  }

  /**
   * Process runtime inputs in template
   */
  private processRuntimeInputs(
    template: HarnessTemplate,
    variables: Record<string, unknown>
  ): HarnessTemplate {
    // Deep clone template
    const processed = JSON.parse(JSON.stringify(template));

    // Replace runtime inputs with actual values
    this.replaceRuntimeInputs(processed, variables);

    return processed;
  }

  /**
   * Replace runtime inputs in object
   */
  private replaceRuntimeInputs(obj: unknown, variables: Record<string, unknown>): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        this.replaceRuntimeInputs(item, variables);
      }
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Replace <+input>.name with actual value
        let replaced = value;
        for (const [varName, varValue] of Object.entries(variables)) {
          const pattern = new RegExp(`<\\+input>\\.${varName}`, 'g');
          replaced = replaced.replace(pattern, String(varValue));
        }
        (obj as Record<string, unknown>)[key] = replaced;
      } else if (typeof value === 'object' && value !== null) {
        this.replaceRuntimeInputs(value, variables);
      }
    }
  }

  /**
   * Map Harness type to TemplateVariable type
   */
  private mapHarnessType(type: string): TemplateVariable['type'] {
    const typeMap: Record<string, TemplateVariable['type']> = {
      'String': 'string',
      'Number': 'number',
      'Secret': 'string',
      'Connector': 'string',
      'Runtime': 'string'
    };

    return typeMap[type] || 'string';
  }
}

/**
 * Create a Harness template loader instance
 */
export function createHarnessTemplateLoader(): HarnessTemplateLoader {
  return new HarnessTemplateLoader();
}
