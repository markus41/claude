/**
 * Intent-Based Composition Engine
 *
 * Resolves a high-level intent specification into an ordered composition plan
 * of plugins by:
 *   1. CapabilityMatcher  - greedy set cover to find the minimum plugin set
 *   2. DependencyResolver - Kahn's algorithm for topological ordering
 *   3. ConfigurationInferrer - project fingerprinting for auto-config
 *   4. CompositionEngine  - orchestrates the full pipeline
 *
 * Algorithms are documented inline so future maintainers can follow the logic.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  type PluginManifest,
  type PluginCapabilities,
  type IntentSpec,
  type CapabilityRequirement,
  type CompositionPlan,
  type PlannedPlugin,
  type DependencyGraph,
  type DependencyEdge,
  type MatchResult,
  type MatchedPlugin,
  type ProjectFingerprint,
  type InferredConfig,
  CompositionError,
  CompositionErrorCode,
} from './types.ts';

// ===========================================================================
// CapabilityMatcher
// ===========================================================================

/**
 * Finds the minimum set of plugins that covers a given set of required
 * capabilities using the **greedy set cover** heuristic.
 *
 * Algorithm (greedy set cover):
 *   1. Start with the full set of uncovered capabilities U.
 *   2. While U is non-empty:
 *      a. For each candidate plugin, compute |provides ∩ U| (coverage).
 *      b. Pick the plugin with the largest coverage (ties broken by
 *         preferred-provider hints, then alphabetical name for stability).
 *      c. Remove its provided capabilities from U and add it to the result.
 *   3. If U is still non-empty after all candidates are exhausted, report
 *      the remaining capabilities as unsatisfiable.
 *
 * The greedy approach gives a ln(n)+1 approximation to optimal set cover,
 * which is good enough for typical plugin counts (dozens, not thousands).
 */
export class CapabilityMatcher {
  private manifests: PluginManifest[] = [];

  constructor(private readonly pluginsDir: string) {}

  // ---- Public API ---------------------------------------------------------

  /**
   * Load all plugin manifests from the plugins directory.
   * Each plugin is expected at <pluginsDir>/<name>/.claude-plugin/plugin.json.
   */
  async loadManifests(): Promise<PluginManifest[]> {
    this.manifests = [];

    let entries: string[];
    try {
      entries = fs.readdirSync(this.pluginsDir);
    } catch {
      throw new CompositionError(
        `Cannot read plugins directory: ${this.pluginsDir}`,
        CompositionErrorCode.NO_PLUGINS_FOUND,
      );
    }

    for (const entry of entries) {
      const manifestPath = path.join(
        this.pluginsDir,
        entry,
        '.claude-plugin',
        'plugin.json',
      );

      if (!fs.existsSync(manifestPath)) {
        continue; // not a plugin directory
      }

      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const parsed = JSON.parse(raw) as PluginManifest;
        parsed.contextSummary = this.loadContextSummary(entry, parsed.contextEntry);

        // Normalise: ensure capabilities always has provides/requires arrays
        if (!parsed.capabilities) {
          parsed.capabilities = { provides: [], requires: [] };
        }
        parsed.capabilities.provides = parsed.capabilities.provides ?? [];
        parsed.capabilities.requires = parsed.capabilities.requires ?? [];
        parsed.capabilities.conflicts = parsed.capabilities.conflicts ?? [];

        this.manifests.push(parsed);
      } catch (err) {
        throw new CompositionError(
          `Failed to read manifest at ${manifestPath}: ${String(err)}`,
          CompositionErrorCode.MANIFEST_READ_ERROR,
          { manifestPath },
        );
      }
    }

    if (this.manifests.length === 0) {
      throw new CompositionError(
        'No plugin manifests found in ' + this.pluginsDir,
        CompositionErrorCode.NO_PLUGINS_FOUND,
      );
    }

    return this.manifests;
  }

  /**
   * Load a compact context summary for the plugin.
   * The context entry is expected to be a concise operator-facing markdown file.
   */
  private loadContextSummary(pluginDirName: string, contextEntry?: string): string {
    const contextPath = path.join(
      this.pluginsDir,
      pluginDirName,
      contextEntry || 'CONTEXT.md',
    );

    if (!fs.existsSync(contextPath)) return '';

    const content = fs.readFileSync(contextPath, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 12)
      .join(' ')
      .slice(0, 800);
  }

  /** Return all loaded manifests. */
  getManifests(): PluginManifest[] {
    return [...this.manifests];
  }

  /**
   * Run the greedy set cover algorithm to find a minimal set of plugins
   * that satisfies the given capability requirements.
   */
  match(requirements: CapabilityRequirement[]): MatchResult {
    if (this.manifests.length === 0) {
      throw new CompositionError(
        'No manifests loaded. Call loadManifests() first.',
        CompositionErrorCode.NO_PLUGINS_FOUND,
      );
    }

    // Build the set of required capabilities we must cover
    const uncovered = new Set<string>(requirements.map((r) => r.capability));

    // Build a provider-preference map: capability -> preferred plugin name
    const preferredProviders = new Map<string, string>();
    for (const req of requirements) {
      if (req.provider) {
        preferredProviders.set(req.capability, req.provider);
      }
    }

    // Candidate pool: plugins that provide at least one capability
    const candidates = this.manifests.filter(
      (m) => (m.capabilities?.provides?.length ?? 0) > 0,
    );

    const selected: MatchedPlugin[] = [];
    const usedPlugins = new Set<string>();

    // ----- Greedy set cover loop -------------------------------------------
    while (uncovered.size > 0) {
      let bestCandidate: PluginManifest | null = null;
      let bestCoverage: string[] = [];
      let bestIsPreferred = false;

      for (const candidate of candidates) {
        if (usedPlugins.has(candidate.name)) continue;

        const provides = candidate.capabilities?.provides ?? [];
        const coverage = provides.filter((cap) => uncovered.has(cap));

        if (coverage.length === 0) continue;

        // Check if this candidate is a preferred provider for any uncovered cap
        const isPreferred = coverage.some(
          (cap) => preferredProviders.get(cap) === candidate.name,
        );

        // Selection priority:
        // 1. Preferred provider wins over non-preferred
        // 2. More coverage wins
        // 3. Alphabetical name for deterministic output
        const dominated =
          bestCandidate === null ||
          (isPreferred && !bestIsPreferred) ||
          (isPreferred === bestIsPreferred &&
            coverage.length > bestCoverage.length) ||
          (isPreferred === bestIsPreferred &&
            coverage.length === bestCoverage.length &&
            candidate.name < bestCandidate.name);

        if (dominated) {
          bestCandidate = candidate;
          bestCoverage = coverage;
          bestIsPreferred = isPreferred;
        }
      }

      if (bestCandidate === null) {
        // No candidate can cover any remaining capability => unsatisfiable
        break;
      }

      // Select this plugin and remove its capabilities from the uncovered set
      usedPlugins.add(bestCandidate.name);
      for (const cap of bestCoverage) {
        uncovered.delete(cap);
      }

      selected.push({
        manifest: bestCandidate,
        coveredCapabilities: bestCoverage,
        isPreferred: bestIsPreferred,
      });
    }

    // ----- Conflict detection ----------------------------------------------
    const conflicts = this.detectConflicts(selected);

    return {
      selected,
      uncoveredCapabilities: Array.from(uncovered),
      conflicts,
    };
  }

  // ---- Private helpers ----------------------------------------------------

  /**
   * Check whether any pair of selected plugins declares a conflict.
   * A conflict exists when plugin A lists capability X in its conflicts[]
   * and plugin B provides capability X (or vice versa).
   */
  private detectConflicts(
    selected: MatchedPlugin[],
  ): Array<{ capability: string; plugins: string[] }> {
    const conflicts: Array<{ capability: string; plugins: string[] }> = [];

    // Build a map: capability -> list of plugins that provide it
    const providerMap = new Map<string, string[]>();
    for (const mp of selected) {
      for (const cap of mp.manifest.capabilities?.provides ?? []) {
        const list = providerMap.get(cap) ?? [];
        list.push(mp.manifest.name);
        providerMap.set(cap, list);
      }
    }

    // Check each selected plugin's conflicts list
    const seen = new Set<string>();
    for (const mp of selected) {
      for (const conflictCap of mp.manifest.capabilities?.conflicts ?? []) {
        const providers = providerMap.get(conflictCap);
        if (providers && providers.length > 0) {
          const key = `${conflictCap}:${[mp.manifest.name, ...providers].sort().join(',')}`;
          if (!seen.has(key)) {
            seen.add(key);
            conflicts.push({
              capability: conflictCap,
              plugins: [mp.manifest.name, ...providers],
            });
          }
        }
      }
    }

    return conflicts;
  }
}

// ===========================================================================
// DependencyResolver
// ===========================================================================

/**
 * Builds a directed acyclic graph (DAG) from plugin dependency relationships
 * and produces a topological ordering using **Kahn's algorithm** (BFS-based).
 *
 * Kahn's algorithm:
 *   1. Compute in-degree for every node.
 *   2. Initialise a queue with all nodes whose in-degree is 0.
 *   3. While the queue is non-empty:
 *      a. Dequeue node n, append it to the sorted output.
 *      b. For each edge n -> m, decrement in-degree of m.
 *         If in-degree of m becomes 0, enqueue m.
 *   4. If the sorted output contains fewer nodes than the graph,
 *      a cycle exists among the remaining nodes.
 */
export class DependencyResolver {
  /**
   * Build a dependency graph and return the topological order.
   *
   * @param selected  - Plugins selected by the capability matcher.
   * @param allManifests - All loaded manifests (needed to resolve transitive deps).
   * @returns The dependency graph including ordered node list and cycle info.
   */
  resolve(
    selected: MatchedPlugin[],
    allManifests: PluginManifest[],
  ): DependencyGraph {
    // Build a lookup: capability -> plugin name that provides it
    // (among the selected set and all manifests as fallback)
    const capabilityProviders = new Map<string, string>();

    // First pass: selected plugins take priority
    for (const mp of selected) {
      for (const cap of mp.manifest.capabilities?.provides ?? []) {
        capabilityProviders.set(cap, mp.manifest.name);
      }
    }

    // Second pass: fill in from all manifests for transitive dependencies
    for (const m of allManifests) {
      for (const cap of m.capabilities?.provides ?? []) {
        if (!capabilityProviders.has(cap)) {
          capabilityProviders.set(cap, m.name);
        }
      }
    }

    // Collect all node names from the selected set
    const nodeSet = new Set<string>(selected.map((mp) => mp.manifest.name));

    // Build edges: if plugin A requires capability X and plugin B provides X,
    // then B must come before A => edge from B to A.
    const edges: DependencyEdge[] = [];

    for (const mp of selected) {
      const requires = mp.manifest.capabilities?.requires ?? [];

      for (const reqCap of requires) {
        const provider = capabilityProviders.get(reqCap);
        if (provider && provider !== mp.manifest.name) {
          // Ensure the provider is in our node set
          nodeSet.add(provider);

          edges.push({
            from: provider,
            to: mp.manifest.name,
            capability: reqCap,
          });
        }
      }
    }

    const nodes = Array.from(nodeSet);

    // ----- Kahn's algorithm ------------------------------------------------
    const { sorted, hasCycles, cycleDetails } = this.kahnSort(nodes, edges);

    return {
      nodes: sorted.length === nodes.length ? sorted : nodes,
      edges,
      hasCycles,
      cycleDetails,
    };
  }

  /**
   * Kahn's topological sort (BFS-based).
   *
   * Returns the sorted order if the graph is acyclic, or reports cycle
   * details if one or more cycles exist.
   */
  private kahnSort(
    nodes: string[],
    edges: DependencyEdge[],
  ): { sorted: string[]; hasCycles: boolean; cycleDetails: string[] } {
    // Step 1: compute in-degree for every node
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>(); // from -> [to]

    for (const node of nodes) {
      inDegree.set(node, 0);
      adjacency.set(node, []);
    }

    for (const edge of edges) {
      const currentDegree = inDegree.get(edge.to) ?? 0;
      inDegree.set(edge.to, currentDegree + 1);

      const neighbours = adjacency.get(edge.from) ?? [];
      neighbours.push(edge.to);
      adjacency.set(edge.from, neighbours);
    }

    // Step 2: seed the queue with zero-in-degree nodes
    // Use an array as a FIFO queue (shift from front, push to back).
    const queue: string[] = [];
    for (const node of nodes) {
      if ((inDegree.get(node) ?? 0) === 0) {
        queue.push(node);
      }
    }

    // Sort the initial queue alphabetically for deterministic output
    queue.sort();

    // Step 3: BFS
    const sorted: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      const neighbours = adjacency.get(current) ?? [];

      // Collect newly-freed neighbours so we can sort them before enqueuing
      const newlyFree: string[] = [];

      for (const neighbour of neighbours) {
        const deg = (inDegree.get(neighbour) ?? 1) - 1;
        inDegree.set(neighbour, deg);
        if (deg === 0) {
          newlyFree.push(neighbour);
        }
      }

      // Alphabetical for determinism
      newlyFree.sort();
      for (const n of newlyFree) {
        queue.push(n);
      }
    }

    // Step 4: cycle detection
    if (sorted.length < nodes.length) {
      const remaining = nodes.filter((n) => !sorted.includes(n));
      const cycleDetails = this.describeCycles(remaining, edges);

      return { sorted, hasCycles: true, cycleDetails };
    }

    return { sorted, hasCycles: false, cycleDetails: [] };
  }

  /**
   * Produce human-readable descriptions of cycles among the remaining
   * (unsorted) nodes by following edges within the remaining set.
   */
  private describeCycles(
    remainingNodes: string[],
    edges: DependencyEdge[],
  ): string[] {
    const remaining = new Set(remainingNodes);
    const descriptions: string[] = [];

    // Filter edges to only those within the remaining set
    const cycleEdges = edges.filter(
      (e) => remaining.has(e.from) && remaining.has(e.to),
    );

    // Build adjacency for the remaining subgraph
    const adj = new Map<string, Array<{ to: string; cap: string }>>();
    for (const node of remainingNodes) {
      adj.set(node, []);
    }
    for (const edge of cycleEdges) {
      adj.get(edge.from)!.push({ to: edge.to, cap: edge.capability });
    }

    // DFS to find at least one cycle per connected component
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const pathStack: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      inStack.add(node);
      pathStack.push(node);

      for (const { to, cap } of adj.get(node) ?? []) {
        if (!visited.has(to)) {
          if (dfs(to)) return true;
        } else if (inStack.has(to)) {
          // Found a cycle - extract it
          const cycleStart = pathStack.indexOf(to);
          const cyclePath = pathStack.slice(cycleStart);
          cyclePath.push(to); // close the cycle
          descriptions.push(
            `Cycle: ${cyclePath.join(' -> ')} (via capability "${cap}")`,
          );
          return true;
        }
      }

      pathStack.pop();
      inStack.delete(node);
      return false;
    };

    for (const node of remainingNodes) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    if (descriptions.length === 0 && remainingNodes.length > 0) {
      descriptions.push(
        `Circular dependency among: ${remainingNodes.join(', ')}`,
      );
    }

    return descriptions;
  }
}

// ===========================================================================
// ConfigurationInferrer
// ===========================================================================

/**
 * Scans the project root for well-known files and directories to build a
 * technology fingerprint, then generates sensible default configuration
 * for each selected plugin based on the detected stack.
 */
export class ConfigurationInferrer {
  /**
   * Map of detection rules: filename/pattern -> technology tags.
   *
   * When a file matching the key exists at the project root, the
   * corresponding technology tags are added to the fingerprint.
   */
  private static readonly DETECTION_RULES: Record<string, string[]> = {
    'package.json': ['node', 'javascript'],
    'tsconfig.json': ['typescript'],
    'Dockerfile': ['docker', 'containers'],
    'docker-compose.yml': ['docker', 'docker-compose', 'containers'],
    'docker-compose.yaml': ['docker', 'docker-compose', 'containers'],
    'Chart.yaml': ['helm', 'kubernetes'],
    'helmfile.yaml': ['helm', 'kubernetes'],
    'kubernetes': ['kubernetes'],
    'k8s': ['kubernetes'],
    '.github': ['github', 'github-actions'],
    '.harness': ['harness', 'ci-cd'],
    'Makefile': ['make'],
    'requirements.txt': ['python'],
    'pyproject.toml': ['python'],
    'Pipfile': ['python'],
    'setup.py': ['python'],
    'go.mod': ['go', 'golang'],
    'Cargo.toml': ['rust'],
    'pom.xml': ['java', 'maven'],
    'build.gradle': ['java', 'gradle'],
    'build.gradle.kts': ['kotlin', 'gradle'],
    '.terraform': ['terraform', 'iac'],
    'terraform': ['terraform', 'iac'],
    'main.tf': ['terraform', 'iac'],
    'pulumi.yaml': ['pulumi', 'iac'],
    'ansible.cfg': ['ansible', 'iac'],
    'playbook.yml': ['ansible', 'iac'],
    '.env': ['dotenv'],
    '.env.example': ['dotenv'],
    'jest.config.js': ['jest', 'testing'],
    'jest.config.ts': ['jest', 'testing'],
    'vitest.config.ts': ['vitest', 'testing'],
    'playwright.config.ts': ['playwright', 'e2e-testing'],
    'cypress.config.ts': ['cypress', 'e2e-testing'],
    '.eslintrc.json': ['eslint', 'linting'],
    '.eslintrc.js': ['eslint', 'linting'],
    'eslint.config.js': ['eslint', 'linting'],
    '.prettierrc': ['prettier', 'formatting'],
    'vite.config.ts': ['vite', 'frontend'],
    'next.config.js': ['nextjs', 'frontend', 'react'],
    'next.config.mjs': ['nextjs', 'frontend', 'react'],
    'nuxt.config.ts': ['nuxt', 'frontend', 'vue'],
    'angular.json': ['angular', 'frontend'],
    '.mcp.json': ['mcp', 'claude-code'],
  };

  /**
   * Map of technology -> configuration fragments for plugins.
   * Keys are technology tags; values are config entries to merge
   * into plugins that operate in that domain.
   */
  private static readonly TECH_CONFIG_MAP: Record<
    string,
    Record<string, unknown>
  > = {
    typescript: { language: 'typescript', strictMode: true },
    javascript: { language: 'javascript' },
    docker: { containerRuntime: 'docker', buildStrategy: 'multi-stage' },
    kubernetes: { orchestrator: 'kubernetes', deploymentType: 'rolling' },
    helm: { packageManager: 'helm', chartVersion: 'v3' },
    terraform: { iacTool: 'terraform', stateBackend: 'remote' },
    ansible: { iacTool: 'ansible' },
    python: { language: 'python' },
    go: { language: 'go' },
    rust: { language: 'rust' },
    java: { language: 'java' },
    react: { framework: 'react' },
    vue: { framework: 'vue' },
    angular: { framework: 'angular' },
    nextjs: { framework: 'nextjs', ssr: true },
    vite: { bundler: 'vite' },
    jest: { testRunner: 'jest' },
    vitest: { testRunner: 'vitest' },
    playwright: { e2eFramework: 'playwright' },
    github: { ciPlatform: 'github-actions' },
    harness: { ciPlatform: 'harness' },
    mcp: { mcpEnabled: true },
  };

  constructor(private readonly projectRoot: string) {}

  /**
   * Scan the project root and return a fingerprint of detected technologies.
   */
  fingerprint(): ProjectFingerprint {
    const technologies = new Set<string>();
    const detectionSources: Record<string, string[]> = {};

    for (const [fileOrDir, techs] of Object.entries(
      ConfigurationInferrer.DETECTION_RULES,
    )) {
      const fullPath = path.join(this.projectRoot, fileOrDir);

      if (fs.existsSync(fullPath)) {
        detectionSources[fileOrDir] = techs;
        for (const tech of techs) {
          technologies.add(tech);
        }
      }
    }

    // Bonus: check package.json for framework-specific dependencies
    this.detectPackageJsonDeps(technologies, detectionSources);

    return {
      technologies: Array.from(technologies).sort(),
      detectionSources,
    };
  }

  /**
   * Generate auto-configuration for each selected plugin based on the
   * project fingerprint and the plugin's capability domain.
   */
  infer(
    selected: MatchedPlugin[],
    fp: ProjectFingerprint,
  ): InferredConfig[] {
    const configs: InferredConfig[] = [];

    for (const mp of selected) {
      const config: Record<string, unknown> = {};
      const basedOn: string[] = [];

      // Merge in config fragments for each detected technology
      for (const tech of fp.technologies) {
        const fragment = ConfigurationInferrer.TECH_CONFIG_MAP[tech];
        if (fragment) {
          // Only merge if the plugin's capabilities are related to this tech.
          // We use a simple heuristic: include all detected tech configs
          // because the plugin was selected to serve a user intent that
          // likely relates to the detected project stack.
          Object.assign(config, fragment);
          basedOn.push(tech);
        }
      }

      // Add plugin-specific metadata
      config['pluginVersion'] = mp.manifest.version;

      configs.push({
        pluginName: mp.manifest.name,
        config,
        basedOn,
      });
    }

    return configs;
  }

  // ---- Private helpers ----------------------------------------------------

  /**
   * Parse package.json (if present) to detect framework-level dependencies.
   */
  private detectPackageJsonDeps(
    technologies: Set<string>,
    detectionSources: Record<string, string[]>,
  ): void {
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) return;

    try {
      const raw = fs.readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };

      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };

      const depDetections: Array<{ pattern: string; techs: string[] }> = [
        { pattern: 'react', techs: ['react', 'frontend'] },
        { pattern: 'vue', techs: ['vue', 'frontend'] },
        { pattern: '@angular/core', techs: ['angular', 'frontend'] },
        { pattern: 'express', techs: ['express', 'backend'] },
        { pattern: 'fastify', techs: ['fastify', 'backend'] },
        { pattern: 'next', techs: ['nextjs', 'frontend', 'react'] },
        { pattern: 'nuxt', techs: ['nuxt', 'frontend', 'vue'] },
        { pattern: 'tailwindcss', techs: ['tailwind', 'css'] },
        { pattern: 'prisma', techs: ['prisma', 'database'] },
        { pattern: 'mongoose', techs: ['mongoose', 'mongodb', 'database'] },
        { pattern: 'typeorm', techs: ['typeorm', 'database'] },
        { pattern: 'drizzle-orm', techs: ['drizzle', 'database'] },
        { pattern: '@keycloak', techs: ['keycloak', 'auth'] },
        { pattern: 'passport', techs: ['passport', 'auth'] },
      ];

      const detected: string[] = [];

      for (const { pattern, techs } of depDetections) {
        if (allDeps[pattern]) {
          for (const tech of techs) {
            technologies.add(tech);
          }
          detected.push(...techs);
        }
      }

      if (detected.length > 0) {
        detectionSources['package.json:dependencies'] = [
          ...new Set(detected),
        ];
      }
    } catch {
      // Ignore parse errors - package.json might be malformed
    }
  }
}

// ===========================================================================
// CompositionEngine (orchestrator)
// ===========================================================================

/**
 * Top-level orchestrator that chains capability matching, dependency
 * resolution, and configuration inference into a single CompositionPlan.
 *
 * Usage:
 *   const engine = new CompositionEngine('/path/to/project', '/path/to/plugins');
 *   const plan = await engine.compose(intentSpec);
 */
export class CompositionEngine {
  private readonly matcher: CapabilityMatcher;
  private readonly resolver: DependencyResolver;
  private readonly inferrer: ConfigurationInferrer;

  constructor(
    private readonly projectRoot: string,
    private readonly pluginsDir: string,
  ) {
    this.matcher = new CapabilityMatcher(pluginsDir);
    this.resolver = new DependencyResolver();
    this.inferrer = new ConfigurationInferrer(projectRoot);
  }

  /**
   * Execute the full composition pipeline:
   *   IntentSpec -> MatchResult -> DependencyGraph -> InferredConfig[] -> CompositionPlan
   */
  async compose(intent: IntentSpec): Promise<CompositionPlan> {
    this.validateIntent(intent);

    const warnings: string[] = [];

    // ---- Step 1: Load manifests -------------------------------------------
    const manifests = await this.matcher.loadManifests();

    // ---- Step 2: Capability matching (greedy set cover) -------------------
    const matchResult = this.matcher.match(intent.requirements);

    if (matchResult.uncoveredCapabilities.length > 0) {
      throw new CompositionError(
        `Cannot satisfy all requirements. Missing capabilities: ${matchResult.uncoveredCapabilities.join(', ')}`,
        CompositionErrorCode.UNSATISFIABLE,
        { uncovered: matchResult.uncoveredCapabilities },
      );
    }

    if (matchResult.conflicts.length > 0) {
      const conflictMsgs = matchResult.conflicts.map(
        (c) => `"${c.capability}" conflicts between [${c.plugins.join(', ')}]`,
      );
      throw new CompositionError(
        `Plugin conflicts detected: ${conflictMsgs.join('; ')}`,
        CompositionErrorCode.CONFLICT_DETECTED,
        { conflicts: matchResult.conflicts },
      );
    }

    // ---- Step 3: Dependency resolution (Kahn's toposort) ------------------
    const depGraph = this.resolver.resolve(matchResult.selected, manifests);

    if (depGraph.hasCycles) {
      throw new CompositionError(
        `Cyclic dependencies detected: ${(depGraph.cycleDetails ?? []).join('; ')}`,
        CompositionErrorCode.CYCLIC_DEPENDENCY,
        { graph: depGraph },
      );
    }

    // ---- Step 4: Configuration inference ----------------------------------
    const fingerprint = this.inferrer.fingerprint();
    const configs = this.inferrer.infer(matchResult.selected, fingerprint);

    // Build a config lookup by plugin name
    const configMap = new Map<string, Record<string, unknown>>();
    for (const cfg of configs) {
      // Merge user-provided constraints into plugin config
      const merged = { ...cfg.config };
      if (intent.constraints) {
        Object.assign(merged, intent.constraints);
      }
      configMap.set(cfg.pluginName, merged);
    }

    // ---- Step 5: Assemble the plan ----------------------------------------

    // The topological order from depGraph.nodes dictates install order.
    // Only include nodes that are in our selected set.
    const selectedNames = new Set(
      matchResult.selected.map((mp) => mp.manifest.name),
    );

    const installOrder = depGraph.nodes.filter((n) => selectedNames.has(n));

    // Check for transitive dependencies pulled in that weren't in selected set
    const transitiveDeps = depGraph.nodes.filter(
      (n) => !selectedNames.has(n),
    );
    if (transitiveDeps.length > 0) {
      warnings.push(
        `Transitive dependencies added to install order: ${transitiveDeps.join(', ')}`,
      );
      // Add them to the install order (they're already in depGraph.nodes)
      // but don't add them to planned plugins
    }

    // Build the PlannedPlugin list in install order
    const plugins: PlannedPlugin[] = [];
    for (let i = 0; i < installOrder.length; i++) {
      const name = installOrder[i];
      const mp = matchResult.selected.find(
        (s) => s.manifest.name === name,
      );
      if (!mp) continue; // skip transitive-only deps

      plugins.push({
        name: mp.manifest.name,
        version: mp.manifest.version,
        order: i,
        provides: mp.coveredCapabilities,
        config: configMap.get(name) ?? {},
      });
    }

    // Add informational warnings about preferred providers
    const preferredUsed = matchResult.selected.filter((mp) => mp.isPreferred);
    if (preferredUsed.length > 0) {
      warnings.push(
        `Preferred providers used: ${preferredUsed.map((p) => p.manifest.name).join(', ')}`,
      );
    }

    return {
      intent: intent.intent,
      plugins,
      installOrder,
      warnings,
    };
  }

  // ---- Accessor methods for intermediate results --------------------------

  /** Get the capability matcher (for inspecting loaded manifests). */
  getMatcher(): CapabilityMatcher {
    return this.matcher;
  }

  /** Get the dependency resolver. */
  getResolver(): DependencyResolver {
    return this.resolver;
  }

  /** Get the configuration inferrer. */
  getInferrer(): ConfigurationInferrer {
    return this.inferrer;
  }

  // ---- Private helpers ----------------------------------------------------

  /** Validate the intent specification before processing. */
  private validateIntent(intent: IntentSpec): void {
    if (!intent.intent || intent.intent.trim().length === 0) {
      throw new CompositionError(
        'Intent description is required.',
        CompositionErrorCode.INVALID_INTENT,
      );
    }

    if (!intent.requirements || intent.requirements.length === 0) {
      throw new CompositionError(
        'At least one capability requirement is needed.',
        CompositionErrorCode.INVALID_INTENT,
      );
    }

    for (const req of intent.requirements) {
      if (!req.capability || req.capability.trim().length === 0) {
        throw new CompositionError(
          'Each requirement must specify a capability.',
          CompositionErrorCode.INVALID_INTENT,
          { requirement: req },
        );
      }
    }
  }
}
