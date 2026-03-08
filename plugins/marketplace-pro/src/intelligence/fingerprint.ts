/**
 * Contextual Plugin Intelligence — Fingerprinting, Association Mining & Recommendations
 *
 * This module implements three core classes:
 *
 * 1. **ProjectFingerprinter** — Scans a project directory to produce a feature vector
 *    describing its frameworks, languages, infrastructure, and architectural patterns.
 *
 * 2. **AprioriMiner** — Implements the Apriori algorithm for association rule mining.
 *    Given a dataset of project profiles (transactions), it discovers which features
 *    frequently co-occur and generates rules like "{kubernetes, helm} => {ci-cd}" with
 *    confidence scores. These rules power gap detection.
 *
 * 3. **RecommendationEngine** — Takes a project fingerprint and a catalog of available
 *    plugins, then ranks them using cosine similarity and gap analysis.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ProjectFingerprint,
  AssociationRule,
  PluginRecommendation,
  RecommendationReport,
  PluginCapability,
  ProjectProfile,
  FrequentItemset,
  Itemset,
} from './types.js';

// ============================================================================
// Constants — Detection Maps
// ============================================================================

/** Maps package.json dependency names to canonical framework identifiers */
const FRAMEWORK_DEPS: Record<string, string> = {
  'next': 'nextjs',
  'react': 'react',
  'react-dom': 'react',
  'vue': 'vue',
  '@angular/core': 'angular',
  'express': 'express',
  'fastify': 'fastify',
  'nestjs': 'nestjs',
  '@nestjs/core': 'nestjs',
  'nuxt': 'nuxt',
  'svelte': 'svelte',
  '@sveltejs/kit': 'sveltekit',
  'gatsby': 'gatsby',
  'remix': 'remix',
  '@remix-run/node': 'remix',
  'koa': 'koa',
  'hapi': 'hapi',
  '@hapi/hapi': 'hapi',
  'graphql': 'graphql',
  'apollo-server': 'graphql',
  '@apollo/server': 'graphql',
  'prisma': 'prisma',
  '@prisma/client': 'prisma',
  'rxjs': 'rxjs',
  'tailwindcss': 'tailwind',
  'vite': 'vite',
};

/** Maps file/directory patterns to infrastructure identifiers */
const INFRA_PATTERNS: Array<{ pattern: string; type: 'file' | 'dir' | 'glob'; infra: string }> = [
  { pattern: 'Dockerfile', type: 'file', infra: 'docker' },
  { pattern: 'docker-compose.yml', type: 'file', infra: 'docker' },
  { pattern: 'docker-compose.yaml', type: 'file', infra: 'docker' },
  { pattern: 'Chart.yaml', type: 'file', infra: 'helm' },
  { pattern: 'helmfile.yaml', type: 'file', infra: 'helm' },
  { pattern: '.github/workflows', type: 'dir', infra: 'ci-cd' },
  { pattern: '.gitlab-ci.yml', type: 'file', infra: 'ci-cd' },
  { pattern: 'Jenkinsfile', type: 'file', infra: 'ci-cd' },
  { pattern: '.circleci', type: 'dir', infra: 'ci-cd' },
  { pattern: 'azure-pipelines.yml', type: 'file', infra: 'ci-cd' },
  { pattern: 'terraform', type: 'dir', infra: 'terraform' },
  { pattern: 'main.tf', type: 'file', infra: 'terraform' },
  { pattern: 'pulumi', type: 'dir', infra: 'pulumi' },
  { pattern: 'Pulumi.yaml', type: 'file', infra: 'pulumi' },
  { pattern: 'vercel.json', type: 'file', infra: 'vercel' },
  { pattern: 'netlify.toml', type: 'file', infra: 'netlify' },
  { pattern: 'firebase.json', type: 'file', infra: 'firebase' },
  { pattern: '.firebaserc', type: 'file', infra: 'firebase' },
  { pattern: 'serverless.yml', type: 'file', infra: 'serverless' },
  { pattern: 'serverless.yaml', type: 'file', infra: 'serverless' },
  { pattern: 'k8s', type: 'dir', infra: 'kubernetes' },
  { pattern: 'kubernetes', type: 'dir', infra: 'kubernetes' },
  { pattern: 'nginx.conf', type: 'file', infra: 'nginx' },
  { pattern: 'prometheus.yml', type: 'file', infra: 'monitoring' },
  { pattern: 'grafana', type: 'dir', infra: 'monitoring' },
  { pattern: '.eslintrc', type: 'file', infra: 'eslint' },
  { pattern: '.eslintrc.js', type: 'file', infra: 'eslint' },
  { pattern: '.eslintrc.json', type: 'file', infra: 'eslint' },
  { pattern: '.eslintrc.cjs', type: 'file', infra: 'eslint' },
  { pattern: 'eslint.config.js', type: 'file', infra: 'eslint' },
  { pattern: 'eslint.config.mjs', type: 'file', infra: 'eslint' },
  { pattern: 'jest.config.js', type: 'file', infra: 'jest' },
  { pattern: 'jest.config.ts', type: 'file', infra: 'jest' },
  { pattern: 'vitest.config.ts', type: 'file', infra: 'vitest' },
  { pattern: 'vitest.config.js', type: 'file', infra: 'vitest' },
  { pattern: 'pytest.ini', type: 'file', infra: 'pytest' },
  { pattern: 'setup.cfg', type: 'file', infra: 'pytest' },
  { pattern: 'vault', type: 'dir', infra: 'vault' },
];

/** Maps file extensions to language identifiers */
const EXTENSION_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.go': 'golang',
  '.rs': 'rust',
  '.java': 'java',
  '.kt': 'kotlin',
  '.rb': 'ruby',
  '.php': 'php',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.dart': 'dart',
  '.scala': 'scala',
  '.clj': 'clojure',
  '.ex': 'elixir',
  '.exs': 'elixir',
};

/** Directories to skip during file scanning */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  '.venv', 'venv', 'vendor', 'target', '.cache', '.turbo',
  'coverage', '.nyc_output', '.terraform', '.pulumi',
]);


// ============================================================================
// ProjectFingerprinter
// ============================================================================

/**
 * Scans a project directory and produces a feature vector (ProjectFingerprint)
 * describing its technology stack, languages, infrastructure, and patterns.
 *
 * The fingerprint is used by the RecommendationEngine to match plugins and
 * by the AprioriMiner to detect capability gaps.
 */
export class ProjectFingerprinter {
  private readonly projectDir: string;

  constructor(projectDir: string) {
    this.projectDir = path.resolve(projectDir);
  }

  /**
   * Perform a full project scan and return the fingerprint.
   *
   * Steps:
   * 1. Detect frameworks from package.json / pyproject.toml / go.mod
   * 2. Count file extensions to compute language distribution
   * 3. Detect infrastructure from config files/directories
   * 4. Detect architectural patterns from workspace configs, deps
   * 5. Run Apriori mining to identify missing capabilities
   */
  async scan(profilesPath?: string): Promise<ProjectFingerprint> {
    const frameworks = await this.detectFrameworks();
    const languages = await this.detectLanguages();
    const { infrastructure, detectedFiles } = await this.detectInfrastructure();
    const patterns = await this.detectPatterns(frameworks, infrastructure);

    // Load profiles for gap detection
    // ESM-compatible path resolution (no __dirname in ESM modules)
    const currentFileUrl = new URL(import.meta.url);
    const currentDir = path.dirname(currentFileUrl.pathname);
    const resolvedProfilesPath = profilesPath
      ?? path.resolve(currentDir, '../../config/project-profiles.json');

    let missing: ProjectFingerprint['missing'] = [];
    try {
      const profileData = JSON.parse(fs.readFileSync(resolvedProfilesPath, 'utf-8'));
      const profiles: ProjectProfile[] = profileData.profiles;

      // Combine all detected features into a single set
      const allFeatures = new Set([
        ...frameworks,
        ...Object.keys(languages),
        ...infrastructure,
        ...patterns,
      ]);

      // Mine association rules and find gaps
      const miner = new AprioriMiner(profiles);
      const rules = miner.mineRules();
      missing = this.findGaps(allFeatures, rules);
    } catch {
      // If profiles file is missing or invalid, continue without gap detection
    }

    return {
      frameworks,
      languages,
      infrastructure,
      patterns,
      missing,
      detectedFiles,
    };
  }

  // --------------------------------------------------------------------------
  // Framework Detection
  // --------------------------------------------------------------------------

  /**
   * Reads package.json (Node), pyproject.toml / requirements.txt (Python),
   * go.mod (Go), and Cargo.toml (Rust) to detect frameworks.
   */
  private async detectFrameworks(): Promise<string[]> {
    const frameworks = new Set<string>();

    // --- Node.js / package.json ---
    const pkgJsonPath = path.join(this.projectDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const allDeps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };
        for (const dep of Object.keys(allDeps)) {
          const framework = FRAMEWORK_DEPS[dep];
          if (framework) {
            frameworks.add(framework);
          }
        }
        // Mark nodejs if there's a package.json with a server-like setup
        if (allDeps['express'] || allDeps['fastify'] || allDeps['koa'] || allDeps['@nestjs/core']) {
          frameworks.add('nodejs');
        }
      } catch {
        // Malformed package.json — skip
      }
    }

    // --- Python / pyproject.toml ---
    const pyprojectPath = path.join(this.projectDir, 'pyproject.toml');
    if (fs.existsSync(pyprojectPath)) {
      try {
        const content = fs.readFileSync(pyprojectPath, 'utf-8');
        if (content.includes('fastapi')) frameworks.add('fastapi');
        if (content.includes('flask')) frameworks.add('flask');
        if (content.includes('django')) frameworks.add('django');
        if (content.includes('celery')) frameworks.add('celery');
      } catch { /* skip */ }
    }

    // --- Python / requirements.txt ---
    const requirementsPath = path.join(this.projectDir, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      try {
        const content = fs.readFileSync(requirementsPath, 'utf-8');
        const lines = content.toLowerCase().split('\n');
        for (const line of lines) {
          const pkg = line.split('==')[0].split('>=')[0].split('~=')[0].trim();
          if (pkg === 'fastapi') frameworks.add('fastapi');
          if (pkg === 'flask') frameworks.add('flask');
          if (pkg === 'django') frameworks.add('django');
          if (pkg === 'celery') frameworks.add('celery');
        }
      } catch { /* skip */ }
    }

    // --- Go / go.mod ---
    const goModPath = path.join(this.projectDir, 'go.mod');
    if (fs.existsSync(goModPath)) {
      try {
        const content = fs.readFileSync(goModPath, 'utf-8');
        if (content.includes('google.golang.org/grpc')) frameworks.add('grpc');
        if (content.includes('github.com/gin-gonic/gin')) frameworks.add('gin');
      } catch { /* skip */ }
    }

    // --- Rust / Cargo.toml ---
    const cargoPath = path.join(this.projectDir, 'Cargo.toml');
    if (fs.existsSync(cargoPath)) {
      try {
        const content = fs.readFileSync(cargoPath, 'utf-8');
        if (content.includes('actix')) frameworks.add('actix');
        if (content.includes('rocket')) frameworks.add('rocket');
        if (content.includes('axum')) frameworks.add('axum');
      } catch { /* skip */ }
    }

    return Array.from(frameworks).sort();
  }

  // --------------------------------------------------------------------------
  // Language Distribution
  // --------------------------------------------------------------------------

  /**
   * Recursively counts files by extension, then normalizes to proportions.
   * Skips node_modules, .git, dist, build, etc.
   *
   * Returns e.g. { typescript: 0.82, python: 0.12, javascript: 0.06 }
   */
  private async detectLanguages(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    let total = 0;

    const walk = (dir: string, depth: number): void => {
      // Limit recursion depth to avoid excessively deep trees
      if (depth > 10) return;

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return; // Permission denied or other I/O error
      }

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (!SKIP_DIRS.has(entry.name)) {
            walk(path.join(dir, entry.name), depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const lang = EXTENSION_LANG[ext];
          if (lang) {
            counts[lang] = (counts[lang] || 0) + 1;
            total++;
          }
        }
      }
    };

    walk(this.projectDir, 0);

    // Normalize to proportions (sum to 1.0)
    const languages: Record<string, number> = {};
    if (total > 0) {
      for (const [lang, count] of Object.entries(counts)) {
        languages[lang] = Math.round((count / total) * 1000) / 1000; // 3 decimal places
      }
    }

    return languages;
  }

  // --------------------------------------------------------------------------
  // Infrastructure Detection
  // --------------------------------------------------------------------------

  /**
   * Checks for the presence of known config files and directories
   * that indicate infrastructure tooling.
   */
  private async detectInfrastructure(): Promise<{ infrastructure: string[]; detectedFiles: string[] }> {
    const infra = new Set<string>();
    const detectedFiles: string[] = [];

    for (const probe of INFRA_PATTERNS) {
      const targetPath = path.join(this.projectDir, probe.pattern);
      try {
        const stat = fs.statSync(targetPath);
        if (probe.type === 'file' && stat.isFile()) {
          infra.add(probe.infra);
          detectedFiles.push(probe.pattern);
        } else if (probe.type === 'dir' && stat.isDirectory()) {
          infra.add(probe.infra);
          detectedFiles.push(probe.pattern + '/');
        }
      } catch {
        // File/dir doesn't exist — not an error
      }
    }

    // Check package.json for infrastructure-related deps
    const pkgJsonPath = path.join(this.projectDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps['kafkajs'] || allDeps['kafka-node']) infra.add('kafka');
        if (allDeps['amqplib'] || allDeps['amqp-connection-manager']) infra.add('rabbitmq');
        if (allDeps['redis'] || allDeps['ioredis']) infra.add('redis');
        if (allDeps['pg'] || allDeps['@prisma/client'] || allDeps['typeorm']) infra.add('postgresql');
        if (allDeps['mongoose'] || allDeps['mongodb']) infra.add('mongodb');
        if (allDeps['@aws-sdk/client-s3'] || allDeps['aws-sdk']) infra.add('aws');
        if (allDeps['@google-cloud/storage'] || allDeps['firebase-admin']) infra.add('gcp');
        if (allDeps['prom-client'] || allDeps['@opentelemetry/api']) infra.add('monitoring');
        if (allDeps['@sentry/node'] || allDeps['@sentry/react']) infra.add('monitoring');
      } catch { /* skip */ }
    }

    return {
      infrastructure: Array.from(infra).sort(),
      detectedFiles: detectedFiles.sort(),
    };
  }

  // --------------------------------------------------------------------------
  // Pattern Detection
  // --------------------------------------------------------------------------

  /**
   * Detects architectural patterns by combining framework/infra signals
   * with workspace and configuration analysis.
   */
  private async detectPatterns(
    frameworks: string[],
    infrastructure: string[]
  ): Promise<string[]> {
    const patterns = new Set<string>();
    const frameworkSet = new Set(frameworks);
    const infraSet = new Set(infrastructure);

    // --- Monorepo detection ---
    const pkgJsonPath = path.join(this.projectDir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        if (pkg.workspaces) {
          patterns.add('monorepo');
        }
      } catch { /* skip */ }
    }
    // pnpm workspaces
    if (fs.existsSync(path.join(this.projectDir, 'pnpm-workspace.yaml'))) {
      patterns.add('monorepo');
    }
    // Lerna
    if (fs.existsSync(path.join(this.projectDir, 'lerna.json'))) {
      patterns.add('monorepo');
    }
    // Nx
    if (fs.existsSync(path.join(this.projectDir, 'nx.json'))) {
      patterns.add('monorepo');
    }
    // Turborepo
    if (fs.existsSync(path.join(this.projectDir, 'turbo.json'))) {
      patterns.add('monorepo');
    }

    // --- Event-driven architecture ---
    if (infraSet.has('kafka') || infraSet.has('rabbitmq')) {
      patterns.add('event-driven');
    }

    // --- API Gateway pattern ---
    // Detected if there are proxy configs, API gateway services, or gateway deps
    const gatewayIndicators = [
      'api-gateway', 'gateway', 'kong.yml', 'kong.yaml',
      'traefik.yml', 'traefik.yaml', 'envoy.yaml',
    ];
    for (const indicator of gatewayIndicators) {
      if (fs.existsSync(path.join(this.projectDir, indicator))) {
        patterns.add('api-gateway');
        break;
      }
    }
    // Also check package.json for gateway-related deps
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (allDeps['http-proxy-middleware'] || allDeps['express-gateway']) {
          patterns.add('api-gateway');
        }
      } catch { /* skip */ }
    }

    // --- Microservices pattern ---
    // Multiple Dockerfiles or docker-compose with multiple services
    if (infraSet.has('docker') && (infraSet.has('kubernetes') || infraSet.has('helm'))) {
      // Check for multiple service directories
      const composeFile = path.join(this.projectDir, 'docker-compose.yml');
      const composeFileYaml = path.join(this.projectDir, 'docker-compose.yaml');
      const composePath = fs.existsSync(composeFile) ? composeFile
        : fs.existsSync(composeFileYaml) ? composeFileYaml : null;
      if (composePath) {
        try {
          const content = fs.readFileSync(composePath, 'utf-8');
          // Count services by looking for top-level service definitions
          const serviceMatches = content.match(/^\s{2}\w[\w-]*:/gm);
          if (serviceMatches && serviceMatches.length > 3) {
            patterns.add('microservices');
          }
        } catch { /* skip */ }
      }
    }

    // --- Serverless pattern ---
    if (infraSet.has('serverless') || infraSet.has('vercel') || infraSet.has('netlify')) {
      patterns.add('serverless');
    }

    // --- Full-stack pattern ---
    const hasFrontend = frameworkSet.has('react') || frameworkSet.has('vue')
      || frameworkSet.has('angular') || frameworkSet.has('svelte');
    const hasBackend = frameworkSet.has('express') || frameworkSet.has('fastify')
      || frameworkSet.has('nestjs') || frameworkSet.has('fastapi')
      || frameworkSet.has('django') || frameworkSet.has('flask');
    if (hasFrontend && hasBackend) {
      patterns.add('fullstack');
    }

    return Array.from(patterns).sort();
  }

  // --------------------------------------------------------------------------
  // Gap Detection via Association Rules
  // --------------------------------------------------------------------------

  /**
   * Given the project's detected features and a set of association rules,
   * identifies features that are "missing" — i.e., features that the rules
   * predict should be present given the other features.
   *
   * Only returns gaps with confidence >= 0.6 to avoid noisy suggestions.
   */
  private findGaps(
    projectFeatures: Set<string>,
    rules: AssociationRule[]
  ): ProjectFingerprint['missing'] {
    const gaps: Map<string, { confidence: number; associatedWith: string[] }> = new Map();

    for (const rule of rules) {
      // Check if the project has ALL antecedent features
      const hasAllAntecedents = rule.antecedent.every(f => projectFeatures.has(f));
      if (!hasAllAntecedents) continue;

      // Check if ANY consequent feature is missing
      for (const consequent of rule.consequent) {
        if (!projectFeatures.has(consequent)) {
          const existing = gaps.get(consequent);
          // Keep the highest confidence rule for each missing feature
          if (!existing || rule.confidence > existing.confidence) {
            gaps.set(consequent, {
              confidence: rule.confidence,
              associatedWith: [...rule.antecedent],
            });
          }
        }
      }
    }

    // Filter to high-confidence gaps and sort by confidence descending
    return Array.from(gaps.entries())
      .filter(([_, gap]) => gap.confidence >= 0.6)
      .map(([feature, gap]) => ({
        feature,
        confidence: gap.confidence,
        associatedWith: gap.associatedWith,
      }))
      .sort((a, b) => b.confidence - a.confidence);
  }
}


// ============================================================================
// AprioriMiner — Association Rule Mining
// ============================================================================

/**
 * Implements the Apriori algorithm for discovering association rules
 * from a dataset of project profiles.
 *
 * The Apriori algorithm works by:
 * 1. Finding all "frequent itemsets" — sets of features that appear together
 *    in at least `minSupport` fraction of all profiles.
 * 2. From those frequent itemsets, generating association rules of the form
 *    A => B, where confidence(A => B) = support(A union B) / support(A).
 *
 * The KEY INSIGHT (Apriori principle / anti-monotone property):
 * If an itemset is infrequent, no superset of it can be frequent.
 * This allows massive pruning of the search space.
 *
 * Example: If {kubernetes} appears in 50% of profiles and {helm} in 40%,
 * but {kubernetes, helm} only in 35%, we still keep it (above threshold).
 * However, if {kubernetes, helm, vault} drops below threshold, we never
 * need to check {kubernetes, helm, vault, X} for any X.
 */
export class AprioriMiner {
  private readonly transactions: string[][];
  private readonly minSupport: number;
  private readonly minConfidence: number;

  /**
   * @param profiles      Array of project profiles (each is a set of feature strings)
   * @param minSupport    Minimum support threshold (default 0.3 = 30% of projects)
   * @param minConfidence Minimum confidence for generated rules (default 0.6)
   */
  constructor(
    profiles: ProjectProfile[],
    minSupport: number = 0.3,
    minConfidence: number = 0.6
  ) {
    // Extract feature arrays from profiles
    this.transactions = profiles.map(p => p.features);
    this.minSupport = minSupport;
    this.minConfidence = minConfidence;
  }

  /**
   * Run the full Apriori pipeline: find frequent itemsets, then generate rules.
   */
  mineRules(): AssociationRule[] {
    // Step 1: Find all frequent itemsets using the level-wise Apriori approach
    const frequentItemsets = this.findFrequentItemsets();

    // Step 2: Generate association rules from the frequent itemsets
    const rules = this.generateRules(frequentItemsets);

    // Sort by confidence descending, then by lift descending
    return rules.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.lift - a.lift;
    });
  }

  // --------------------------------------------------------------------------
  // Step 1: Find Frequent Itemsets
  // --------------------------------------------------------------------------

  /**
   * Iteratively builds frequent itemsets of increasing size.
   *
   * L1 = frequent single items
   * L2 = frequent pairs (generated from L1)
   * L3 = frequent triples (generated from L2)
   * ... continues until no more frequent itemsets are found
   *
   * At each level k:
   * 1. Generate candidate k-itemsets from L(k-1) using the apriori-gen procedure
   * 2. Count support for each candidate by scanning all transactions
   * 3. Prune candidates below the support threshold
   */
  private findFrequentItemsets(): FrequentItemset[] {
    const allFrequent: FrequentItemset[] = [];
    const n = this.transactions.length;

    // ---- L1: Count individual items ----
    const itemCounts = new Map<string, number>();
    for (const transaction of this.transactions) {
      for (const item of transaction) {
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
      }
    }

    // Filter to items meeting minimum support
    let currentLevel: FrequentItemset[] = [];
    for (const [item, count] of itemCounts) {
      const support = count / n;
      if (support >= this.minSupport) {
        const itemset: FrequentItemset = { items: [item], support };
        currentLevel.push(itemset);
        allFrequent.push(itemset);
      }
    }

    // Sort L1 items for consistent candidate generation
    currentLevel.sort((a, b) => a.items[0].localeCompare(b.items[0]));

    // ---- Lk (k >= 2): Generate larger itemsets level by level ----
    let k = 2;
    while (currentLevel.length > 0) {
      // Generate candidate k-itemsets from the (k-1)-itemsets
      const candidates = this.aprioriGen(currentLevel, k);

      if (candidates.length === 0) break;

      // Count support for each candidate by scanning transactions
      const candidateSupport = new Map<string, number>();
      for (const candidate of candidates) {
        candidateSupport.set(this.itemsetKey(candidate), 0);
      }

      for (const transaction of this.transactions) {
        const transactionSet = new Set(transaction);
        for (const candidate of candidates) {
          // Check if ALL items in the candidate appear in the transaction
          if (candidate.every(item => transactionSet.has(item))) {
            const key = this.itemsetKey(candidate);
            candidateSupport.set(key, (candidateSupport.get(key) || 0) + 1);
          }
        }
      }

      // Filter candidates by minimum support
      const nextLevel: FrequentItemset[] = [];
      for (const candidate of candidates) {
        const key = this.itemsetKey(candidate);
        const count = candidateSupport.get(key) || 0;
        const support = count / n;
        if (support >= this.minSupport) {
          const itemset: FrequentItemset = { items: candidate, support };
          nextLevel.push(itemset);
          allFrequent.push(itemset);
        }
      }

      currentLevel = nextLevel;
      k++;

      // Safety: don't go beyond 5-itemsets (diminishing returns, performance)
      if (k > 5) break;
    }

    return allFrequent;
  }

  /**
   * Apriori candidate generation (apriori-gen).
   *
   * Generates candidate k-itemsets from frequent (k-1)-itemsets by joining
   * pairs that share the first (k-2) items.
   *
   * Example: From L2 = [{a,b}, {a,c}, {a,d}, {b,c}]
   * Candidates for L3: {a,b,c}, {a,b,d}, {a,c,d}
   * Then prune: check that all (k-1)-subsets are frequent.
   *
   * @param prevLevel  Frequent (k-1)-itemsets (sorted lexicographically)
   * @param k          The target itemset size
   */
  private aprioriGen(prevLevel: FrequentItemset[], k: number): Itemset[] {
    const candidates: Itemset[] = [];
    const prevItems = prevLevel.map(fi => fi.items);

    // Build a set of frequent (k-1)-itemset keys for fast subset checking
    const frequentKeys = new Set(prevItems.map(items => this.itemsetKey(items)));

    for (let i = 0; i < prevItems.length; i++) {
      for (let j = i + 1; j < prevItems.length; j++) {
        const a = prevItems[i];
        const b = prevItems[j];

        // Join condition: first (k-2) items must be identical
        // (items are sorted, so we compare prefixes)
        let canJoin = true;
        for (let p = 0; p < k - 2; p++) {
          if (a[p] !== b[p]) {
            canJoin = false;
            break;
          }
        }

        if (!canJoin) continue;

        // Create the candidate by merging (union of both, sorted)
        const candidate = [...new Set([...a, ...b])].sort();

        // Sanity check: candidate should have exactly k items
        if (candidate.length !== k) continue;

        // PRUNING (Apriori principle): check all (k-1)-subsets are frequent
        // If any (k-1)-subset is infrequent, this candidate cannot be frequent
        if (this.allSubsetsFrequent(candidate, frequentKeys)) {
          candidates.push(candidate);
        }
      }
    }

    // Deduplicate candidates (may arise from different join paths)
    const seen = new Set<string>();
    const deduplicated: Itemset[] = [];
    for (const candidate of candidates) {
      const key = this.itemsetKey(candidate);
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(candidate);
      }
    }

    return deduplicated;
  }

  /**
   * Check that all (k-1)-subsets of a k-itemset are in the frequent set.
   * This is the pruning step that makes Apriori efficient.
   *
   * For a k-itemset {a, b, c, d}, check that:
   * {a,b,c}, {a,b,d}, {a,c,d}, {b,c,d} are all frequent.
   */
  private allSubsetsFrequent(itemset: Itemset, frequentKeys: Set<string>): boolean {
    for (let i = 0; i < itemset.length; i++) {
      // Generate the (k-1)-subset by removing item at index i
      const subset = [...itemset.slice(0, i), ...itemset.slice(i + 1)];
      if (!frequentKeys.has(this.itemsetKey(subset))) {
        return false;
      }
    }
    return true;
  }

  // --------------------------------------------------------------------------
  // Step 2: Generate Association Rules
  // --------------------------------------------------------------------------

  /**
   * From the set of frequent itemsets, generates all valid association rules.
   *
   * For each frequent itemset S with |S| >= 2:
   *   For each non-empty proper subset A of S:
   *     B = S \ A
   *     confidence = support(S) / support(A)
   *     lift = confidence / support(B)
   *     If confidence >= minConfidence, emit rule A => B
   *
   * We only generate rules where the consequent has 1 item to keep
   * recommendations actionable (e.g., "you're missing X" not "you're missing X,Y,Z").
   */
  private generateRules(frequentItemsets: FrequentItemset[]): AssociationRule[] {
    const rules: AssociationRule[] = [];

    // Build a lookup map: itemset key => support
    const supportMap = new Map<string, number>();
    for (const fi of frequentItemsets) {
      supportMap.set(this.itemsetKey(fi.items), fi.support);
    }

    // Only consider itemsets of size >= 2 for rule generation
    const multiItemsets = frequentItemsets.filter(fi => fi.items.length >= 2);

    for (const fi of multiItemsets) {
      const { items, support: fullSupport } = fi;

      // Generate rules with single-item consequents for actionable recommendations
      for (let i = 0; i < items.length; i++) {
        const consequent = [items[i]];
        const antecedent = [...items.slice(0, i), ...items.slice(i + 1)];

        // Look up support(antecedent)
        const antecedentKey = this.itemsetKey(antecedent);
        const antecedentSupport = supportMap.get(antecedentKey);

        if (antecedentSupport === undefined) continue;

        // confidence = support(A ∪ B) / support(A)
        const confidence = fullSupport / antecedentSupport;

        if (confidence < this.minConfidence) continue;

        // Look up support(consequent) for lift calculation
        const consequentKey = this.itemsetKey(consequent);
        const consequentSupport = supportMap.get(consequentKey);

        if (consequentSupport === undefined || consequentSupport === 0) continue;

        // lift = confidence / P(consequent)
        // lift > 1 means positive association (A makes B more likely)
        const lift = confidence / consequentSupport;

        rules.push({
          antecedent,
          consequent,
          support: Math.round(fullSupport * 1000) / 1000,
          confidence: Math.round(confidence * 1000) / 1000,
          lift: Math.round(lift * 1000) / 1000,
        });
      }
    }

    return rules;
  }

  // --------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------

  /**
   * Creates a canonical string key for an itemset (sorted, comma-separated).
   * Used for deduplication and fast lookup in maps/sets.
   */
  private itemsetKey(items: Itemset): string {
    return [...items].sort().join(',');
  }

  /**
   * Expose frequent itemsets for diagnostic purposes.
   */
  getFrequentItemsets(): FrequentItemset[] {
    return this.findFrequentItemsets();
  }

  /**
   * Expose rules for diagnostic/verbose output.
   */
  getRules(): AssociationRule[] {
    return this.mineRules();
  }
}


// ============================================================================
// RecommendationEngine — Cosine Similarity + Gap Matching
// ============================================================================

/**
 * Ranks available plugins by relevance to a project fingerprint using:
 *
 * 1. **Cosine similarity** between the project's feature vector and each
 *    plugin's capability vector (both represented as binary vectors over
 *    a shared vocabulary of feature terms).
 *
 * 2. **Gap filling** — plugins that provide missing capabilities detected
 *    by association rules get a relevance boost.
 *
 * The final relevance score is:
 *   relevance = 0.6 * cosineSimilarity + 0.4 * gapCoverage
 * where gapCoverage = (gaps filled by plugin) / (total gaps), weighted
 * by confidence of each gap.
 */
export class RecommendationEngine {
  /**
   * Generate a ranked list of plugin recommendations.
   *
   * @param fingerprint  The project's fingerprint from ProjectFingerprinter
   * @param plugins      Available plugins with their capability descriptors
   * @param topN         Maximum number of recommendations to return (default 10)
   */
  recommend(
    fingerprint: ProjectFingerprint,
    plugins: PluginCapability[],
    topN: number = 10
  ): RecommendationReport {
    // Build the project's feature set (union of all detected features)
    const projectFeatures = new Set<string>([
      ...fingerprint.frameworks,
      ...Object.keys(fingerprint.languages),
      ...fingerprint.infrastructure,
      ...fingerprint.patterns,
    ]);

    // Build the shared vocabulary (all unique terms across project + plugins)
    const vocabulary = this.buildVocabulary(projectFeatures, plugins);

    // Convert project features to a binary vector
    const projectVector = this.toBinaryVector(projectFeatures, vocabulary);

    // Score each plugin
    const scored: PluginRecommendation[] = [];

    for (const plugin of plugins) {
      // Build the plugin's feature set from its capabilities + targets
      const pluginFeatures = new Set<string>([
        ...plugin.capabilities,
        ...(plugin.targetFrameworks || []),
        ...(plugin.targetInfrastructure || []),
      ]);

      // Convert plugin features to a binary vector
      const pluginVector = this.toBinaryVector(pluginFeatures, vocabulary);

      // Compute cosine similarity
      const similarity = this.cosineSimilarity(projectVector, pluginVector);

      // Compute gap coverage
      const { gapScore, gapsFilled } = this.computeGapCoverage(
        fingerprint.missing,
        pluginFeatures
      );

      // Compute matched features (intersection of project and plugin features)
      const matchedFeatures = [...projectFeatures].filter(f => pluginFeatures.has(f));

      // Combined relevance score: weighted blend of similarity and gap coverage
      const relevance = Math.round((0.6 * similarity + 0.4 * gapScore) * 1000) / 1000;

      // Skip plugins with zero relevance
      if (relevance <= 0) continue;

      // Generate human-readable reason
      const reason = this.generateReason(
        plugin.name,
        matchedFeatures,
        gapsFilled,
        similarity,
        gapScore
      );

      scored.push({
        pluginName: plugin.name,
        relevance,
        reason,
        gapsFilled,
        matchedFeatures,
      });
    }

    // Sort by relevance descending
    scored.sort((a, b) => b.relevance - a.relevance);

    // Determine primary language
    let primaryLanguage = 'unknown';
    let maxProportion = 0;
    for (const [lang, proportion] of Object.entries(fingerprint.languages)) {
      if (proportion > maxProportion) {
        maxProportion = proportion;
        primaryLanguage = lang;
      }
    }

    return {
      projectSummary: {
        frameworks: fingerprint.frameworks,
        primaryLanguage,
        infraStack: fingerprint.infrastructure,
        detectedPatterns: fingerprint.patterns,
      },
      recommendations: scored.slice(0, topN),
      gaps: fingerprint.missing.map(m => ({
        feature: m.feature,
        confidence: m.confidence,
      })),
      scanDate: new Date().toISOString(),
    };
  }

  // --------------------------------------------------------------------------
  // Vector Operations
  // --------------------------------------------------------------------------

  /**
   * Build the shared vocabulary from all feature terms across the project
   * and all plugins. Each term gets a fixed index in the binary vector.
   */
  private buildVocabulary(
    projectFeatures: Set<string>,
    plugins: PluginCapability[]
  ): string[] {
    const terms = new Set<string>(projectFeatures);
    for (const plugin of plugins) {
      for (const cap of plugin.capabilities) terms.add(cap);
      for (const fw of plugin.targetFrameworks || []) terms.add(fw);
      for (const infra of plugin.targetInfrastructure || []) terms.add(infra);
    }
    return Array.from(terms).sort();
  }

  /**
   * Convert a set of features into a binary vector over the given vocabulary.
   * vector[i] = 1 if vocabulary[i] is in the feature set, else 0.
   */
  private toBinaryVector(features: Set<string>, vocabulary: string[]): number[] {
    return vocabulary.map(term => features.has(term) ? 1 : 0);
  }

  /**
   * Compute cosine similarity between two vectors.
   *
   * cosine(A, B) = (A . B) / (||A|| * ||B||)
   *
   * Where:
   *   A . B      = sum of element-wise products (dot product)
   *   ||A||      = sqrt(sum of squares of A)  (Euclidean norm)
   *
   * Returns 0 if either vector is all zeros (no features).
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  // --------------------------------------------------------------------------
  // Gap Coverage
  // --------------------------------------------------------------------------

  /**
   * Compute how well a plugin fills the project's detected capability gaps.
   *
   * Returns:
   * - gapScore: weighted proportion of gaps filled (0-1), weighted by confidence
   * - gapsFilled: list of gap feature names this plugin fills
   */
  private computeGapCoverage(
    gaps: ProjectFingerprint['missing'],
    pluginFeatures: Set<string>
  ): { gapScore: number; gapsFilled: string[] } {
    if (gaps.length === 0) return { gapScore: 0, gapsFilled: [] };

    const gapsFilled: string[] = [];
    let totalConfidence = 0;
    let filledConfidence = 0;

    for (const gap of gaps) {
      totalConfidence += gap.confidence;
      if (pluginFeatures.has(gap.feature)) {
        filledConfidence += gap.confidence;
        gapsFilled.push(gap.feature);
      }
    }

    const gapScore = totalConfidence > 0 ? filledConfidence / totalConfidence : 0;
    return { gapScore, gapsFilled };
  }

  // --------------------------------------------------------------------------
  // Human-Readable Reasons
  // --------------------------------------------------------------------------

  /**
   * Generate a plain-English explanation of why a plugin is recommended.
   */
  private generateReason(
    pluginName: string,
    matchedFeatures: string[],
    gapsFilled: string[],
    similarity: number,
    gapScore: number
  ): string {
    const parts: string[] = [];

    if (matchedFeatures.length > 0) {
      const top = matchedFeatures.slice(0, 4);
      parts.push(
        `Matches your ${top.join(', ')} stack` +
        (matchedFeatures.length > 4 ? ` (+${matchedFeatures.length - 4} more)` : '')
      );
    }

    if (gapsFilled.length > 0) {
      parts.push(`Fills detected gaps: ${gapsFilled.join(', ')}`);
    }

    if (similarity >= 0.7) {
      parts.push('High feature overlap with your project');
    } else if (similarity >= 0.4) {
      parts.push('Moderate feature overlap with your project');
    }

    if (parts.length === 0) {
      parts.push(`May complement your project setup (relevance: ${Math.round(similarity * 100)}%)`);
    }

    return parts.join('. ') + '.';
  }
}


// ============================================================================
// Convenience: run a full analysis from the command line or as a module
// ============================================================================

/**
 * Run a complete fingerprint + recommendation analysis on a project directory.
 *
 * @param projectDir     Path to the project to analyze
 * @param plugins        Available plugin descriptors
 * @param profilesPath   Path to the project profiles JSON (optional)
 */
export async function analyzeProject(
  projectDir: string,
  plugins: PluginCapability[],
  profilesPath?: string
): Promise<RecommendationReport> {
  const fingerprinter = new ProjectFingerprinter(projectDir);
  const fingerprint = await fingerprinter.scan(profilesPath);

  const engine = new RecommendationEngine();
  return engine.recommend(fingerprint, plugins);
}
