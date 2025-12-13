/**
 * Intent Recognition System
 * Pattern-based intent matching with keyword scoring and multi-intent detection
 */

import type {
  Intent,
  IntentPattern,
  IntentPatternRecord,
  IntentCategory,
} from './types.js';
import Database from 'better-sqlite3';

export class IntentRecognizer {
  private db: Database.Database;
  private patterns: IntentPattern[] = [];
  private keywordIndex: Map<string, IntentPattern[]> = new Map();

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.loadPatterns();
    this.buildKeywordIndex();
  }

  /**
   * Recognize intent from user input
   */
  recognizeIntent(input: string, maxIntents: number = 1): Intent[] {
    const normalizedInput = this.normalizeInput(input);
    const words = this.tokenize(normalizedInput);
    const results: Array<{ pattern: IntentPattern; score: number; keywords: string[] }> = [];

    // Score all patterns
    for (const pattern of this.patterns) {
      const score = this.scorePattern(pattern, normalizedInput, words);
      if (score.total > 0) {
        results.push({
          pattern,
          score: score.total,
          keywords: score.matchedKeywords,
        });
      }
    }

    // Sort by score and return top intents
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, maxIntents);

    return topResults.map((result) => ({
      name: result.pattern.intent,
      confidence: Math.min(100, result.score),
      category: result.pattern.category,
      keywords: result.keywords,
      pattern: result.pattern.pattern.source,
    }));
  }

  /**
   * Score a pattern against input
   */
  private scorePattern(
    pattern: IntentPattern,
    input: string,
    words: string[]
  ): { total: number; matchedKeywords: string[] } {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Check regex pattern
    const regexMatch = pattern.pattern.test(input);
    if (regexMatch) {
      score += pattern.baseConfidence;
    }

    // Check required keywords (all must be present)
    const requiredPresent = pattern.requiredKeywords.every((keyword) => {
      const present = this.containsKeyword(input, words, keyword);
      if (present) {
        matchedKeywords.push(keyword);
      }
      return present;
    });

    if (!requiredPresent) {
      return { total: 0, matchedKeywords: [] }; // Disqualify if required keywords missing
    }

    // Boost for required keywords
    score += pattern.requiredKeywords.length * 10;

    // Check optional keywords (boost confidence)
    let optionalMatches = 0;
    for (const keyword of pattern.optionalKeywords) {
      if (this.containsKeyword(input, words, keyword)) {
        optionalMatches++;
        matchedKeywords.push(keyword);
      }
    }
    score += optionalMatches * 5;

    // Check negative keywords (disqualify if present)
    for (const keyword of pattern.negativeKeywords) {
      if (this.containsKeyword(input, words, keyword)) {
        return { total: 0, matchedKeywords: [] }; // Disqualify
      }
    }

    // Apply priority multiplier
    score *= 1 + pattern.priority * 0.1;

    return { total: score, matchedKeywords };
  }

  /**
   * Check if keyword is in input
   */
  private containsKeyword(input: string, words: string[], keyword: string): boolean {
    const normalizedKeyword = keyword.toLowerCase();

    // Exact phrase match
    if (input.includes(normalizedKeyword)) {
      return true;
    }

    // Word-level match with stemming
    const keywordWords = normalizedKeyword.split(/\s+/);
    if (keywordWords.length === 1) {
      return words.some((word) => this.stem(word) === this.stem(normalizedKeyword));
    }

    // Multi-word phrase match
    const inputText = words.join(' ');
    return inputText.includes(keywordWords.join(' '));
  }

  /**
   * Simple stemming (remove common suffixes)
   */
  private stem(word: string): string {
    return word
      .replace(/ing$/, '')
      .replace(/ed$/, '')
      .replace(/s$/, '')
      .replace(/ly$/, '')
      .replace(/er$/, '')
      .replace(/est$/, '');
  }

  /**
   * Normalize input text
   */
  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ') // Remove punctuation except hyphens
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tokenize input into words
   */
  private tokenize(input: string): string[] {
    return input.split(/\s+/).filter((word) => word.length > 0);
  }

  /**
   * Load patterns from database
   */
  private loadPatterns(): void {
    const rows = this.db
      .prepare(
        `SELECT * FROM intent_patterns WHERE enabled = 1 ORDER BY priority DESC`
      )
      .all() as IntentPatternRecord[];

    this.patterns = rows.map((row) => ({
      id: row.id,
      intent: row.intent_name,
      category: row.category as IntentCategory,
      pattern: new RegExp(row.pattern, 'i'),
      requiredKeywords: JSON.parse(row.required_keywords),
      optionalKeywords: JSON.parse(row.optional_keywords),
      negativeKeywords: JSON.parse(row.negative_keywords),
      baseConfidence: row.base_confidence,
      priority: row.priority,
      examples: JSON.parse(row.examples),
    }));
  }

  /**
   * Build keyword index for fast lookup
   */
  private buildKeywordIndex(): void {
    this.keywordIndex.clear();

    for (const pattern of this.patterns) {
      for (const keyword of [...pattern.requiredKeywords, ...pattern.optionalKeywords]) {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, []);
        }
        this.keywordIndex.get(keyword)!.push(pattern);
      }
    }
  }

  /**
   * Add a new pattern
   */
  addPattern(pattern: Omit<IntentPattern, 'id'>): string {
    const id = `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db
      .prepare(
        `INSERT INTO intent_patterns (
          id, intent_name, category, pattern,
          required_keywords, optional_keywords, negative_keywords,
          base_confidence, priority, examples
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        pattern.intent,
        pattern.category,
        pattern.pattern.source,
        JSON.stringify(pattern.requiredKeywords),
        JSON.stringify(pattern.optionalKeywords),
        JSON.stringify(pattern.negativeKeywords),
        pattern.baseConfidence,
        pattern.priority,
        JSON.stringify(pattern.examples)
      );

    this.loadPatterns();
    this.buildKeywordIndex();

    return id;
  }

  /**
   * Update a pattern
   */
  updatePattern(id: string, updates: Partial<IntentPattern>): void {
    const sets: string[] = [];
    const values: any[] = [];

    if (updates.intent) {
      sets.push('intent_name = ?');
      values.push(updates.intent);
    }
    if (updates.category) {
      sets.push('category = ?');
      values.push(updates.category);
    }
    if (updates.pattern) {
      sets.push('pattern = ?');
      values.push(updates.pattern.source);
    }
    if (updates.requiredKeywords) {
      sets.push('required_keywords = ?');
      values.push(JSON.stringify(updates.requiredKeywords));
    }
    if (updates.optionalKeywords) {
      sets.push('optional_keywords = ?');
      values.push(JSON.stringify(updates.optionalKeywords));
    }
    if (updates.negativeKeywords) {
      sets.push('negative_keywords = ?');
      values.push(JSON.stringify(updates.negativeKeywords));
    }
    if (updates.baseConfidence !== undefined) {
      sets.push('base_confidence = ?');
      values.push(updates.baseConfidence);
    }
    if (updates.priority !== undefined) {
      sets.push('priority = ?');
      values.push(updates.priority);
    }

    if (sets.length > 0) {
      values.push(id);
      this.db.prepare(`UPDATE intent_patterns SET ${sets.join(', ')} WHERE id = ?`).run(...values);
      this.loadPatterns();
      this.buildKeywordIndex();
    }
  }

  /**
   * Delete a pattern
   */
  deletePattern(id: string): void {
    this.db.prepare(`DELETE FROM intent_patterns WHERE id = ?`).run(id);
    this.loadPatterns();
    this.buildKeywordIndex();
  }

  /**
   * Get all patterns
   */
  getPatterns(): IntentPattern[] {
    return this.patterns;
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: IntentCategory): IntentPattern[] {
    return this.patterns.filter((p) => p.category === category);
  }

  /**
   * Get patterns by intent
   */
  getPatternsByIntent(intent: string): IntentPattern[] {
    return this.patterns.filter((p) => p.intent === intent);
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

/**
 * Pre-defined orchestration intent patterns
 */
export const DEFAULT_PATTERNS: Array<Omit<IntentPattern, 'id'>> = [
  // Deploy intents
  {
    intent: 'deploy_application',
    category: 'command',
    pattern: /deploy|deployment|push.*production|release/i,
    requiredKeywords: ['deploy'],
    optionalKeywords: ['production', 'staging', 'environment', 'kubernetes', 'helm'],
    negativeKeywords: ['rollback', 'undo'],
    baseConfidence: 70,
    priority: 9,
    examples: ['Deploy to production', 'Deploy the application', 'Push to staging'],
  },
  {
    intent: 'rollback_deployment',
    category: 'command',
    pattern: /rollback|revert.*deployment|undo.*deploy/i,
    requiredKeywords: ['rollback'],
    optionalKeywords: ['deployment', 'previous', 'version'],
    negativeKeywords: [],
    baseConfidence: 75,
    priority: 10,
    examples: ['Rollback the deployment', 'Revert to previous version'],
  },

  // Build intents
  {
    intent: 'build_project',
    category: 'command',
    pattern: /build|compile|make/i,
    requiredKeywords: ['build'],
    optionalKeywords: ['project', 'docker', 'image', 'container'],
    negativeKeywords: ['test', 'deploy'],
    baseConfidence: 70,
    priority: 8,
    examples: ['Build the project', 'Build Docker image', 'Compile the code'],
  },

  // Test intents
  {
    intent: 'run_tests',
    category: 'command',
    pattern: /test|testing|run.*test/i,
    requiredKeywords: ['test'],
    optionalKeywords: ['unit', 'integration', 'e2e', 'suite', 'run'],
    negativeKeywords: [],
    baseConfidence: 75,
    priority: 9,
    examples: ['Run tests', 'Run unit tests', 'Execute test suite'],
  },

  // Review intents
  {
    intent: 'review_code',
    category: 'command',
    pattern: /review|analyze.*code|check.*quality/i,
    requiredKeywords: ['review'],
    optionalKeywords: ['code', 'pull request', 'pr', 'changes'],
    negativeKeywords: [],
    baseConfidence: 70,
    priority: 8,
    examples: ['Review the code', 'Code review', 'Review pull request'],
  },

  // Create intents
  {
    intent: 'create_resource',
    category: 'command',
    pattern: /create|new|add|generate/i,
    requiredKeywords: ['create'],
    optionalKeywords: ['file', 'component', 'service', 'resource'],
    negativeKeywords: ['delete', 'remove'],
    baseConfidence: 65,
    priority: 7,
    examples: ['Create a new component', 'Add a service', 'Generate file'],
  },

  // Update intents
  {
    intent: 'update_resource',
    category: 'command',
    pattern: /update|modify|change|edit/i,
    requiredKeywords: ['update'],
    optionalKeywords: ['configuration', 'settings', 'file', 'resource'],
    negativeKeywords: ['delete', 'create'],
    baseConfidence: 65,
    priority: 7,
    examples: ['Update configuration', 'Modify settings', 'Change the file'],
  },

  // Delete intents
  {
    intent: 'delete_resource',
    category: 'command',
    pattern: /delete|remove|drop/i,
    requiredKeywords: ['delete'],
    optionalKeywords: ['file', 'resource', 'service', 'component'],
    negativeKeywords: ['create', 'add'],
    baseConfidence: 70,
    priority: 8,
    examples: ['Delete the file', 'Remove service', 'Drop resource'],
  },

  // Status query intents
  {
    intent: 'check_status',
    category: 'query',
    pattern: /status|state|health|running/i,
    requiredKeywords: ['status'],
    optionalKeywords: ['check', 'what', 'deployment', 'service', 'application'],
    negativeKeywords: [],
    baseConfidence: 75,
    priority: 9,
    examples: ['Check status', 'What is the status', 'Show deployment status'],
  },
  {
    intent: 'list_resources',
    category: 'query',
    pattern: /list|show.*all|what.*are/i,
    requiredKeywords: ['list'],
    optionalKeywords: ['all', 'resources', 'services', 'deployments', 'files'],
    negativeKeywords: [],
    baseConfidence: 70,
    priority: 8,
    examples: ['List all services', 'Show resources', 'What are the deployments'],
  },

  // Configuration intents
  {
    intent: 'configure_setting',
    category: 'configuration',
    pattern: /configure|set.*up|setup|config/i,
    requiredKeywords: ['configure'],
    optionalKeywords: ['setting', 'configuration', 'environment', 'variable'],
    negativeKeywords: [],
    baseConfidence: 70,
    priority: 8,
    examples: ['Configure the setting', 'Set up environment', 'Config variables'],
  },

  // Help intents
  {
    intent: 'get_help',
    category: 'query',
    pattern: /help|how.*do|what.*can|guide/i,
    requiredKeywords: ['help'],
    optionalKeywords: ['how', 'what', 'guide', 'tutorial'],
    negativeKeywords: [],
    baseConfidence: 80,
    priority: 10,
    examples: ['Help me', 'How do I deploy', 'What can you do', 'Show guide'],
  },

  // Debug intents
  {
    intent: 'debug_issue',
    category: 'command',
    pattern: /debug|troubleshoot|diagnose|fix/i,
    requiredKeywords: ['debug'],
    optionalKeywords: ['issue', 'problem', 'error', 'bug', 'troubleshoot'],
    negativeKeywords: [],
    baseConfidence: 75,
    priority: 9,
    examples: ['Debug the issue', 'Troubleshoot error', 'Diagnose problem'],
  },

  // Monitor intents
  {
    intent: 'monitor_system',
    category: 'query',
    pattern: /monitor|watch|observe|track/i,
    requiredKeywords: ['monitor'],
    optionalKeywords: ['logs', 'metrics', 'performance', 'system'],
    negativeKeywords: [],
    baseConfidence: 70,
    priority: 8,
    examples: ['Monitor logs', 'Watch metrics', 'Track performance'],
  },
];
