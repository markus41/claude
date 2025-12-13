/**
 * Entity Extraction System
 * Pattern-based Named Entity Recognition with normalization and validation
 */

import type {
  Entity,
  EntityType,
  EntityDefinition,
  EntityDefinitionRecord,
} from './types.js';
import Database from 'better-sqlite3';
import * as path from 'path';

export class EntityExtractor {
  private db: Database.Database;
  private definitions: Map<EntityType, EntityDefinition> = new Map();

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.loadDefinitions();
  }

  /**
   * Extract all entities from input text
   */
  extractEntities(input: string): Entity[] {
    const entities: Entity[] = [];
    const processedRanges: Array<{ start: number; end: number }> = [];

    // Process each entity type
    for (const [type, definition] of this.definitions) {
      const typeEntities = this.extractByType(input, type, definition);

      // Filter out overlapping entities (keep higher confidence)
      for (const entity of typeEntities) {
        if (!this.overlaps(entity, processedRanges)) {
          entities.push(entity);
          processedRanges.push({ start: entity.start, end: entity.end });
        }
      }
    }

    // Sort by position
    entities.sort((a, b) => a.start - b.start);

    return entities;
  }

  /**
   * Extract entities of a specific type
   */
  extractByType(input: string, type: EntityType, definition: EntityDefinition): Entity[] {
    const entities: Entity[] = [];

    // Pattern-based extraction
    for (const pattern of definition.patterns) {
      const matches = Array.from(input.matchAll(new RegExp(pattern, 'gi')));

      for (const match of matches) {
        if (match.index === undefined) continue;

        const value = match[0];
        const normalized = this.normalize(type, value, definition);
        const confidence = this.calculateConfidence(type, value, definition);

        // Validate
        if (!this.validate(type, normalized, definition)) {
          continue;
        }

        entities.push({
          type,
          value,
          normalized,
          confidence,
          start: match.index,
          end: match.index + value.length,
        });
      }
    }

    // Known values matching
    if (definition.knownValues) {
      for (const knownValue of definition.knownValues) {
        const index = input.toLowerCase().indexOf(knownValue.toLowerCase());
        if (index !== -1) {
          entities.push({
            type,
            value: input.substring(index, index + knownValue.length),
            normalized: knownValue,
            confidence: 95, // High confidence for known values
            start: index,
            end: index + knownValue.length,
          });
        }
      }
    }

    return entities;
  }

  /**
   * Normalize entity value
   */
  private normalize(type: EntityType, value: string, definition: EntityDefinition): string {
    let normalized = value.trim();

    switch (type) {
      case 'file':
      case 'directory':
        normalized = path.normalize(normalized);
        break;

      case 'environment':
        normalized = normalized.toLowerCase();
        if (normalized === 'prod') normalized = 'production';
        if (normalized === 'dev') normalized = 'development';
        if (normalized === 'stg') normalized = 'staging';
        break;

      case 'agent':
      case 'workflow':
      case 'command':
        normalized = normalized.toLowerCase().replace(/\s+/g, '-');
        break;

      case 'model':
        normalized = normalized.toLowerCase();
        if (normalized.includes('opus')) normalized = 'opus';
        if (normalized.includes('sonnet')) normalized = 'sonnet';
        if (normalized.includes('haiku')) normalized = 'haiku';
        if (normalized.includes('gpt-4')) normalized = 'gpt-4';
        if (normalized.includes('gpt-3')) normalized = 'gpt-3.5';
        break;

      case 'date':
        normalized = this.normalizeDate(normalized);
        break;

      case 'number':
        normalized = normalized.replace(/,/g, '');
        break;

      default:
        normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  /**
   * Normalize date strings
   */
  private normalizeDate(value: string): string {
    // Handle relative dates
    const lowerValue = value.toLowerCase();
    const now = new Date();

    if (lowerValue.includes('today')) {
      return now.toISOString().split('T')[0];
    }
    if (lowerValue.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    if (lowerValue.includes('yesterday')) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }

    // Handle "in X days/hours/minutes"
    const inMatch = value.match(/in\s+(\d+)\s+(day|hour|minute|week)s?/i);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2].toLowerCase();
      const future = new Date(now);

      switch (unit) {
        case 'minute':
          future.setMinutes(future.getMinutes() + amount);
          break;
        case 'hour':
          future.setHours(future.getHours() + amount);
          break;
        case 'day':
          future.setDate(future.getDate() + amount);
          break;
        case 'week':
          future.setDate(future.getDate() + amount * 7);
          break;
      }

      return future.toISOString();
    }

    // Try parsing as ISO date
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      // Fall through
    }

    return value;
  }

  /**
   * Validate entity value
   */
  private validate(type: EntityType, value: string, definition: EntityDefinition): boolean {
    // Known values validation
    if (definition.knownValues && definition.knownValues.length > 0) {
      return definition.knownValues.includes(value);
    }

    // Type-specific validation
    switch (type) {
      case 'number':
        return !isNaN(parseFloat(value));

      case 'file':
        return value.length > 0 && !value.includes('..'); // Basic path validation

      case 'directory':
        return value.length > 0 && !value.includes('..');

      case 'environment':
        return ['development', 'staging', 'production', 'test'].includes(value);

      default:
        return value.length > 0;
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(type: EntityType, value: string, definition: EntityDefinition): number {
    let confidence = 70; // Base confidence

    // Boost for known values
    if (definition.knownValues && definition.knownValues.includes(value.toLowerCase())) {
      confidence += 25;
    }

    // Boost for strong patterns
    const strongPatterns: Record<EntityType, RegExp[]> = {
      file: [/\.(ts|js|json|md|sql|yaml|yml)$/i],
      directory: [/^(\/|\.\/|\.\.\/)/],
      environment: [/^(dev|staging|prod|production|development|test)$/i],
      model: [/^(opus|sonnet|haiku|gpt-[0-9])/i],
      date: [/^\d{4}-\d{2}-\d{2}$/],
      number: [/^\d+(\.\d+)?$/],
    } as any;

    const patterns = strongPatterns[type];
    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.test(value)) {
          confidence += 15;
          break;
        }
      }
    }

    return Math.min(100, confidence);
  }

  /**
   * Check if entity overlaps with existing ranges
   */
  private overlaps(entity: Entity, ranges: Array<{ start: number; end: number }>): boolean {
    return ranges.some(
      (range) =>
        (entity.start >= range.start && entity.start < range.end) ||
        (entity.end > range.start && entity.end <= range.end) ||
        (entity.start <= range.start && entity.end >= range.end)
    );
  }

  /**
   * Load entity definitions from database
   */
  private loadDefinitions(): void {
    const rows = this.db
      .prepare(`SELECT * FROM entity_definitions WHERE enabled = 1`)
      .all() as EntityDefinitionRecord[];

    for (const row of rows) {
      const patterns = JSON.parse(row.patterns).map((p: string) => new RegExp(p, 'gi'));
      const knownValues = row.known_values ? JSON.parse(row.known_values) : undefined;

      this.definitions.set(row.entity_type as EntityType, {
        type: row.entity_type as EntityType,
        patterns,
        knownValues,
        normalizer: row.normalizer,
        validator: row.validator,
      });
    }
  }

  /**
   * Add entity definition
   */
  addDefinition(definition: Omit<EntityDefinition, 'id'>): void {
    const id = `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db
      .prepare(
        `INSERT INTO entity_definitions (
          id, entity_type, patterns, known_values, normalizer, validator
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        definition.type,
        JSON.stringify(definition.patterns.map((p) => p.source)),
        definition.knownValues ? JSON.stringify(definition.knownValues) : null,
        definition.normalizer || null,
        definition.validator || null
      );

    this.loadDefinitions();
  }

  /**
   * Update entity definition
   */
  updateDefinition(type: EntityType, updates: Partial<EntityDefinition>): void {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.patterns) {
      sets.push('patterns = ?');
      values.push(JSON.stringify(updates.patterns.map((p) => p.source)));
    }
    if (updates.knownValues) {
      sets.push('known_values = ?');
      values.push(JSON.stringify(updates.knownValues));
    }

    if (sets.length > 0) {
      values.push(type);
      this.db.prepare(`UPDATE entity_definitions SET ${sets.join(', ')} WHERE entity_type = ?`).run(...values);
      this.loadDefinitions();
    }
  }

  /**
   * Get all definitions
   */
  getDefinitions(): Map<EntityType, EntityDefinition> {
    return this.definitions;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

/**
 * Default entity definitions for orchestration
 */
export const DEFAULT_ENTITY_DEFINITIONS: Array<Omit<EntityDefinition, 'id'>> = [
  {
    type: 'agent',
    patterns: [
      /\b([\w-]+)-agent\b/i,
      /agent\s+([\w-]+)/i,
    ],
    knownValues: [
      'frontend-agent',
      'backend-agent',
      'devops-agent',
      'testing-agent',
      'documentation-agent',
    ],
  },
  {
    type: 'workflow',
    patterns: [
      /\b([\w-]+)-workflow\b/i,
      /workflow\s+([\w-]+)/i,
    ],
    knownValues: [
      'deploy-workflow',
      'build-workflow',
      'test-workflow',
      'review-workflow',
    ],
  },
  {
    type: 'command',
    patterns: [
      /\b(npm|yarn|pnpm|docker|kubectl|helm|git)\s+[\w-]+/i,
    ],
  },
  {
    type: 'file',
    patterns: [
      /\b[\w\/-]+\.(ts|js|json|md|sql|yaml|yml|tsx|jsx|py|go|rs)\b/i,
      /['"]([\w\/-]+\.[\w]+)['"]/,
    ],
  },
  {
    type: 'directory',
    patterns: [
      /\b(\.?\/[\w\/-]+)\b/,
      /\b([\w-]+\/[\w\/-]+)\b/,
    ],
  },
  {
    type: 'environment',
    patterns: [
      /\b(development|staging|production|test|dev|stg|prod)\b/i,
    ],
    knownValues: ['development', 'staging', 'production', 'test'],
  },
  {
    type: 'service',
    patterns: [
      /\b([\w-]+)-service\b/i,
      /service\s+([\w-]+)/i,
    ],
  },
  {
    type: 'model',
    patterns: [
      /\b(opus|sonnet|haiku|gpt-4|gpt-3\.5|gemini-pro|gemini-flash)\b/i,
      /\b(claude-[\w-]+)\b/i,
    ],
    knownValues: ['opus', 'sonnet', 'haiku', 'gpt-4', 'gpt-3.5', 'gemini-pro'],
  },
  {
    type: 'date',
    patterns: [
      /\b\d{4}-\d{2}-\d{2}\b/,
      /\b(today|tomorrow|yesterday)\b/i,
      /\bin\s+\d+\s+(day|hour|minute|week)s?\b/i,
    ],
  },
  {
    type: 'number',
    patterns: [
      /\b\d+(\.\d+)?\b/,
    ],
  },
  {
    type: 'technology',
    patterns: [
      /\b(react|vue|angular|nextjs|express|fastapi|kubernetes|docker|postgres|mongodb|redis)\b/i,
    ],
    knownValues: [
      'react',
      'vue',
      'angular',
      'nextjs',
      'express',
      'fastapi',
      'kubernetes',
      'docker',
      'postgres',
      'mongodb',
      'redis',
    ],
  },
];
