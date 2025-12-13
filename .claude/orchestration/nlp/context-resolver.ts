/**
 * Context Resolution System
 * Handles pronoun resolution, reference resolution, and context tracking
 */

import type {
  Entity,
  ConversationContext,
  ConversationTurn,
  Reference,
  ContextResolutionResult,
} from './types.js';
import { EntityExtractor } from './entity-extractor.js';

export class ContextResolver {
  private entityExtractor: EntityExtractor;
  private pronounPatterns: RegExp[];
  private demonstrativePatterns: RegExp[];

  constructor(entityExtractor: EntityExtractor) {
    this.entityExtractor = entityExtractor;

    this.pronounPatterns = [
      /\b(it|its|this|that|these|those)\b/gi,
      /\b(he|she|him|her|they|them)\b/gi,
    ];

    this.demonstrativePatterns = [
      /\b(the same|the previous|the last|the current)\b/gi,
    ];
  }

  /**
   * Resolve references in input using conversation context
   */
  resolveReferences(
    input: string,
    context: ConversationContext,
    history: ConversationTurn[]
  ): ContextResolutionResult {
    const references = this.findReferences(input);
    let resolvedText = input;
    const newEntities: Entity[] = [];

    // Resolve each reference
    for (const reference of references) {
      const resolved = this.resolveReference(reference, context, history);

      if (resolved.resolvedEntity) {
        // Replace reference with resolved entity
        resolvedText = this.replaceReference(resolvedText, reference, resolved.resolvedEntity);
        newEntities.push(resolved.resolvedEntity);
      }
    }

    // Extract additional entities from resolved text
    const extractedEntities = this.entityExtractor.extractEntities(resolvedText);
    newEntities.push(...extractedEntities);

    return {
      originalText: input,
      resolvedText,
      references,
      entities: newEntities,
      contextUsed: context,
    };
  }

  /**
   * Find all references in text
   */
  private findReferences(text: string): Reference[] {
    const references: Reference[] = [];

    // Find pronouns
    for (const pattern of this.pronounPatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined) {
          references.push({
            text: match[0],
            type: 'pronoun',
            position: match.index,
            confidence: 0,
          });
        }
      }
    }

    // Find demonstratives
    for (const pattern of this.demonstrativePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (match.index !== undefined) {
          references.push({
            text: match[0],
            type: 'demonstrative',
            position: match.index,
            confidence: 0,
          });
        }
      }
    }

    // Find definite references (the X)
    const definitePattern = /\bthe\s+([\w-]+)\b/gi;
    const definiteMatches = Array.from(text.matchAll(definitePattern));
    for (const match of definiteMatches) {
      if (match.index !== undefined) {
        references.push({
          text: match[0],
          type: 'definite',
          position: match.index,
          confidence: 0,
        });
      }
    }

    return references;
  }

  /**
   * Resolve a single reference
   */
  private resolveReference(
    reference: Reference,
    context: ConversationContext,
    history: ConversationTurn[]
  ): Reference {
    let resolvedEntity: Entity | undefined;
    let confidence = 0;

    switch (reference.type) {
      case 'pronoun':
        ({ resolvedEntity, confidence } = this.resolvePronoun(reference, context, history));
        break;

      case 'demonstrative':
        ({ resolvedEntity, confidence } = this.resolveDemonstrative(reference, context, history));
        break;

      case 'definite':
        ({ resolvedEntity, confidence } = this.resolveDefinite(reference, context, history));
        break;
    }

    return {
      ...reference,
      resolvedEntity,
      confidence,
    };
  }

  /**
   * Resolve pronoun reference
   */
  private resolvePronoun(
    reference: Reference,
    context: ConversationContext,
    history: ConversationTurn[]
  ): { resolvedEntity?: Entity; confidence: number } {
    const pronoun = reference.text.toLowerCase();

    // "it", "this", "that" -> most recent entity
    if (['it', 'this', 'that'].includes(pronoun)) {
      if (context.recentEntities.length > 0) {
        return {
          resolvedEntity: context.recentEntities[context.recentEntities.length - 1],
          confidence: 80,
        };
      }
    }

    // "these", "those" -> multiple recent entities
    if (['these', 'those'].includes(pronoun)) {
      // Return the most recent, but with lower confidence
      if (context.recentEntities.length > 0) {
        return {
          resolvedEntity: context.recentEntities[context.recentEntities.length - 1],
          confidence: 60,
        };
      }
    }

    return { confidence: 0 };
  }

  /**
   * Resolve demonstrative reference
   */
  private resolveDemonstrative(
    reference: Reference,
    context: ConversationContext,
    history: ConversationTurn[]
  ): { resolvedEntity?: Entity; confidence: number } {
    const text = reference.text.toLowerCase();

    // "the same", "the previous", "the last"
    if (text.includes('same') || text.includes('previous') || text.includes('last')) {
      // Look for entities in recent history
      for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i];
        if (turn.entities.length > 0) {
          return {
            resolvedEntity: turn.entities[0],
            confidence: 70,
          };
        }
      }
    }

    // "the current"
    if (text.includes('current')) {
      if (context.recentEntities.length > 0) {
        return {
          resolvedEntity: context.recentEntities[context.recentEntities.length - 1],
          confidence: 75,
        };
      }
    }

    return { confidence: 0 };
  }

  /**
   * Resolve definite reference ("the X")
   */
  private resolveDefinite(
    reference: Reference,
    context: ConversationContext,
    history: ConversationTurn[]
  ): { resolvedEntity?: Entity; confidence: number } {
    const match = reference.text.match(/\bthe\s+([\w-]+)\b/i);
    if (!match) return { confidence: 0 };

    const noun = match[1].toLowerCase();

    // Search for matching entities in context
    for (const entity of [...context.recentEntities].reverse()) {
      const entityValue = (entity.normalized || entity.value).toLowerCase();

      if (entityValue.includes(noun) || noun.includes(entityValue)) {
        return {
          resolvedEntity: entity,
          confidence: 85,
        };
      }
    }

    // Search in history
    for (let i = history.length - 1; i >= 0 && i >= history.length - 5; i--) {
      const turn = history[i];
      for (const entity of turn.entities) {
        const entityValue = (entity.normalized || entity.value).toLowerCase();

        if (entityValue.includes(noun) || noun.includes(entityValue)) {
          return {
            resolvedEntity: entity,
            confidence: 70,
          };
        }
      }
    }

    return { confidence: 0 };
  }

  /**
   * Replace reference with resolved entity in text
   */
  private replaceReference(text: string, reference: Reference, entity: Entity): string {
    const replacement = entity.normalized || entity.value;

    // Simple replacement at position
    return (
      text.substring(0, reference.position) +
      replacement +
      text.substring(reference.position + reference.text.length)
    );
  }

  /**
   * Update context with new entities
   */
  updateContext(
    context: ConversationContext,
    entities: Entity[],
    maxEntities: number = 20
  ): ConversationContext {
    // Add new entities to recent list
    const updated = {
      ...context,
      recentEntities: [...context.recentEntities, ...entities],
    };

    // Keep only most recent entities
    if (updated.recentEntities.length > maxEntities) {
      updated.recentEntities = updated.recentEntities.slice(-maxEntities);
    }

    return updated;
  }

  /**
   * Inherit context from previous turn
   */
  inheritContext(
    current: ConversationContext,
    previous: ConversationContext
  ): ConversationContext {
    return {
      ...current,
      workingDirectory: current.workingDirectory || previous.workingDirectory,
      activeWorkflow: current.activeWorkflow || previous.activeWorkflow,
      preferences: {
        ...previous.preferences,
        ...current.preferences,
      },
      metadata: {
        ...previous.metadata,
        ...current.metadata,
      },
    };
  }

  /**
   * Clear old context data
   */
  clearStaleContext(context: ConversationContext, maxAge: number = 300000): ConversationContext {
    const now = Date.now();

    // Filter out entities that are too old
    const freshEntities = context.recentEntities.filter((entity) => {
      const entityAge = entity.metadata?.timestamp
        ? now - new Date(entity.metadata.timestamp).getTime()
        : 0;
      return entityAge < maxAge;
    });

    return {
      ...context,
      recentEntities: freshEntities,
    };
  }

  /**
   * Get context summary
   */
  getContextSummary(context: ConversationContext): string {
    const parts: string[] = [];

    if (context.workingDirectory) {
      parts.push(`Working directory: ${context.workingDirectory}`);
    }

    if (context.activeWorkflow) {
      parts.push(`Active workflow: ${context.activeWorkflow}`);
    }

    if (context.recentEntities.length > 0) {
      const entityTypes = new Set(context.recentEntities.map((e) => e.type));
      parts.push(`Recent entities: ${Array.from(entityTypes).join(', ')}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'No context';
  }
}
