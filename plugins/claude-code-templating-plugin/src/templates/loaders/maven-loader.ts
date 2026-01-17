/**
 * Maven Archetype Loader
 *
 * Loads and processes Maven Archetype templates (archetype-metadata.xml format).
 * Supports:
 * - Apache Velocity template processing
 * - archetype-metadata.xml configuration
 * - Package structure transformation
 * - Filesets with includes/excludes
 * - Required properties validation
 */

import { readFile, readdir, stat, mkdir, writeFile } from 'fs/promises';
import { join, relative, sep } from 'path';
import * as xml2js from 'xml2js';
import type {
  ITemplateLoader,
  TemplateFormat,
  TemplateInfo,
  GeneratedFile,
  TemplateVariable
} from '../../types/scaffold.js';
import type {
  MavenArchetypeMetadata,
  MavenArchetypeProperty,
  MavenArchetypeFileSet
} from '../../types/template.js';

export class MavenArchetypeLoader implements ITemplateLoader {
  readonly format: TemplateFormat = 'maven-archetype';

  /**
   * Check if this loader can handle the given source
   */
  async canHandle(source: string): Promise<boolean> {
    try {
      const stats = await stat(source);
      if (!stats.isDirectory()) return false;

      // Check for archetype-metadata.xml in META-INF
      const metadataPath = join(source, 'META-INF', 'maven', 'archetype-metadata.xml');
      try {
        await stat(metadataPath);
        return true;
      } catch {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Load template metadata from archetype-metadata.xml
   */
  async loadMetadata(source: string): Promise<TemplateInfo> {
    const metadata = await this.loadArchetypeMetadata(source);

    // Convert Maven properties to template variables
    const variables: TemplateVariable[] = [
      // Standard Maven properties
      {
        name: 'groupId',
        type: 'string',
        prompt: 'Group ID (e.g., com.example)',
        required: true,
        validation: '^[a-z][a-z0-9_]*(\\.[a-z0-9_]+)+$',
        description: 'Maven group ID for the project'
      },
      {
        name: 'artifactId',
        type: 'string',
        prompt: 'Artifact ID (e.g., my-app)',
        required: true,
        validation: '^[a-z][a-z0-9-]*$',
        description: 'Maven artifact ID for the project'
      },
      {
        name: 'version',
        type: 'string',
        prompt: 'Version',
        default: '1.0.0-SNAPSHOT',
        required: true,
        description: 'Initial version of the project'
      },
      {
        name: 'package',
        type: 'string',
        prompt: 'Package name',
        required: false,
        description: 'Java package name (defaults to groupId)'
      }
    ];

    // Add custom required properties from metadata
    if (metadata.requiredProperties) {
      for (const prop of metadata.requiredProperties) {
        // Skip if already added
        if (variables.some(v => v.name === prop.key)) continue;

        variables.push({
          name: prop.key,
          type: 'string',
          prompt: prop.key.replace(/([A-Z])/g, ' $1').trim(),
          default: prop.defaultValue,
          required: prop.defaultValue === undefined,
          validation: prop.validationRegex
        });
      }
    }

    return {
      name: metadata.name || metadata.artifactId,
      description: metadata.description,
      source,
      format: this.format,
      variables,
      version: metadata.version
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
    const metadata = await this.loadArchetypeMetadata(source);

    // Set default package if not provided
    if (!variables.package) {
      variables.package = variables.groupId;
    }

    // Convert package name to path (e.g., com.example -> com/example)
    const packagePath = String(variables.package).replace(/\./g, sep);

    // Process file sets
    const archetypeResourcesDir = join(source, 'archetype-resources');

    if (metadata.fileSets) {
      for (const fileSet of metadata.fileSets) {
        await this.processFileSet(
          archetypeResourcesDir,
          outputPath,
          fileSet,
          variables,
          packagePath,
          files
        );
      }
    }

    return files;
  }

  /**
   * Load archetype metadata from XML
   */
  private async loadArchetypeMetadata(source: string): Promise<MavenArchetypeMetadata> {
    const metadataPath = join(source, 'META-INF', 'maven', 'archetype-metadata.xml');
    const content = await readFile(metadataPath, 'utf-8');
    const parser = new xml2js.Parser();
    const parsed = await parser.parseStringPromise(content);

    const archetype = parsed['archetype-descriptor'] || parsed['archetype'];

    return {
      name: this.getXmlValue(archetype, 'name') || this.getXmlValue(archetype, 'id') || '',
      artifactId: this.getXmlValue(archetype, 'id') || '',
      groupId: this.getXmlValue(archetype, 'groupId') || '',
      version: this.getXmlValue(archetype, 'version') || '',
      description: this.getXmlValue(archetype, 'description'),
      requiredProperties: this.parseRequiredProperties(archetype.requiredProperties),
      fileSets: this.parseFileSets(archetype.fileSets)
    };
  }

  /**
   * Get value from XML parsed object
   */
  private getXmlValue(obj: any, key: string): string | undefined {
    if (!obj || !obj[key]) return undefined;
    const value = obj[key];
    if (Array.isArray(value) && value.length > 0) {
      return String(value[0]);
    }
    return String(value);
  }

  /**
   * Parse required properties from XML
   */
  private parseRequiredProperties(props?: any): MavenArchetypeProperty[] | undefined {
    if (!props || !Array.isArray(props)) return undefined;

    const properties: MavenArchetypeProperty[] = [];
    for (const prop of props) {
      if (typeof prop === 'object' && prop !== null) {
        const requiredProperty = prop as any;
        const propList = requiredProperty.requiredProperty;

        if (Array.isArray(propList)) {
          for (const p of propList) {
            if (typeof p === 'object' && p !== null) {
              const property = p as any;
              properties.push({
                key: String(property.$ || property.key || ''),
                defaultValue: this.getXmlValue(property, 'defaultValue'),
                validationRegex: this.getXmlValue(property, 'validationRegex')
              });
            }
          }
        }
      }
    }

    return properties.length > 0 ? properties : undefined;
  }

  /**
   * Parse file sets from XML
   */
  private parseFileSets(sets?: any): MavenArchetypeFileSet[] | undefined {
    if (!sets || !Array.isArray(sets)) return undefined;

    const fileSets: MavenArchetypeFileSet[] = [];
    for (const set of sets) {
      if (typeof set === 'object' && set !== null) {
        const fileSetObj = set as any;
        const fileSetList = fileSetObj.fileSet;

        if (Array.isArray(fileSetList)) {
          for (const fs of fileSetList) {
            if (typeof fs === 'object' && fs !== null) {
              const fileSet = fs as any;
              fileSets.push({
                filtered: this.getXmlValue(fileSet, 'filtered') === 'true',
                packaged: this.getXmlValue(fileSet, 'packaged') === 'true',
                encoding: this.getXmlValue(fileSet, 'encoding'),
                directory: this.getXmlValue(fileSet, 'directory') || '',
                includes: this.getXmlArrayValue(fileSet, 'includes', 'include'),
                excludes: this.getXmlArrayValue(fileSet, 'excludes', 'exclude')
              });
            }
          }
        }
      }
    }

    return fileSets.length > 0 ? fileSets : undefined;
  }

  /**
   * Get array value from XML parsed object
   */
  private getXmlArrayValue(obj: any, parentKey: string, childKey: string): string[] | undefined {
    if (!obj || !obj[parentKey]) return undefined;
    const parent = obj[parentKey];
    if (!Array.isArray(parent) || parent.length === 0) return undefined;
    const child = parent[0][childKey];
    if (!child) return undefined;
    if (Array.isArray(child)) {
      return child.map(v => String(v));
    }
    return [String(child)];
  }

  /**
   * Process a file set
   */
  private async processFileSet(
    archetypeResourcesDir: string,
    outputPath: string,
    fileSet: MavenArchetypeFileSet,
    variables: Record<string, unknown>,
    packagePath: string,
    files: GeneratedFile[]
  ): Promise<void> {
    const sourceDir = join(archetypeResourcesDir, fileSet.directory);

    // Determine target directory
    let targetDir = join(outputPath, fileSet.directory);
    if (fileSet.packaged) {
      // Apply package structure
      targetDir = join(outputPath, fileSet.directory, packagePath);
    }

    // Create target directory
    await mkdir(targetDir, { recursive: true });

    // Process files in directory
    await this.processDirectory(
      sourceDir,
      targetDir,
      outputPath,
      fileSet,
      variables,
      files
    );
  }

  /**
   * Process a directory recursively
   */
  private async processDirectory(
    sourcePath: string,
    targetPath: string,
    outputPath: string,
    fileSet: MavenArchetypeFileSet,
    variables: Record<string, unknown>,
    files: GeneratedFile[]
  ): Promise<void> {
    try {
      const entries = await readdir(sourcePath, { withFileTypes: true });

      for (const entry of entries) {
        const sourceEntry = join(sourcePath, entry.name);
        const targetEntry = join(targetPath, entry.name);

        if (entry.isDirectory()) {
          await mkdir(targetEntry, { recursive: true });
          await this.processDirectory(sourceEntry, targetEntry, outputPath, fileSet, variables, files);
        } else {
          // Check if file matches includes/excludes
          if (!this.shouldIncludeFile(entry.name, fileSet.includes, fileSet.excludes)) {
            continue;
          }

          // Process file
          const content = await readFile(sourceEntry, 'utf-8');

          let processedContent: string;
          if (fileSet.filtered) {
            // Apply Velocity-style variable substitution
            processedContent = this.processVelocityTemplate(content, variables);
          } else {
            processedContent = content;
          }

          await writeFile(targetEntry, processedContent, 'utf-8');

          // Track generated file
          const stats = await stat(targetEntry);
          files.push({
            path: relative(outputPath, targetEntry),
            action: 'created',
            size: stats.size,
            type: this.getFileType(targetEntry)
          });
        }
      }
    } catch (error) {
      // Directory might not exist, skip
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Check if file should be included based on patterns
   */
  private shouldIncludeFile(
    filename: string,
    includes?: string[],
    excludes?: string[]
  ): boolean {
    // Check excludes first
    if (excludes) {
      for (const pattern of excludes) {
        if (this.matchesPattern(filename, pattern)) {
          return false;
        }
      }
    }

    // If no includes specified, include by default
    if (!includes || includes.length === 0) {
      return true;
    }

    // Check includes
    for (const pattern of includes) {
      if (this.matchesPattern(filename, pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Simple glob pattern matching
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    return regex.test(filename);
  }

  /**
   * Process Velocity template with simple variable substitution
   */
  private processVelocityTemplate(template: string, variables: Record<string, unknown>): string {
    let result = template;

    // Replace ${variable} patterns
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(pattern, String(value));
    }

    // Replace $variable patterns (without braces)
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\$${key}(?![a-zA-Z0-9_])`, 'g');
      result = result.replace(pattern, String(value));
    }

    return result;
  }

  /**
   * Determine file type from extension
   */
  private getFileType(filePath: string): GeneratedFile['type'] {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, GeneratedFile['type']> = {
      'java': 'source',
      'kt': 'source',
      'scala': 'source',
      'groovy': 'source',
      'xml': 'config',
      'properties': 'config',
      'yml': 'config',
      'yaml': 'config',
      'test': 'test',
      'md': 'docs',
      'txt': 'docs'
    };

    return typeMap[ext || ''] || 'other';
  }
}

/**
 * Create a Maven Archetype loader instance
 */
export function createMavenArchetypeLoader(): MavenArchetypeLoader {
  return new MavenArchetypeLoader();
}
