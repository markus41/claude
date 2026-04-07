import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import pino from 'pino';
import yaml from 'js-yaml';
import { type GraphAdapter } from '../core/graph.js';
import { extractSections } from './doc-diff.js';

const logger = pino({ name: 'agent-drift' });

// ── Types ──

export type DriftType = 'content' | 'schema' | 'cross-agent';

export interface SchemaDiff {
  field: string;
  change_type: 'added' | 'removed' | 'type_changed';
  old_value?: string;
  new_value?: string;
}

export interface Contradiction {
  agent_a: string;
  agent_b: string;
  section_a: string;
  section_b: string;
  conflict_description: string;
}

export interface AgentDriftReport {
  agent_id: string;
  file_path: string;
  drift_type: DriftType;
  drift_score: number;
  previous_hash: string;
  current_hash: string;
  changed_sections: string[];
  schema_changes?: SchemaDiff[];
  contradictions?: Contradiction[];
  recommendation: string;
  detected_at: string;
}

interface AgentFile {
  id: string;
  filePath: string;
  content: string;
  hash: string;
  frontmatter: Record<string, unknown>;
  sections: Map<string, string>;
}

interface BaselineEntry {
  hash: string;
  sections: string[];
  acknowledged_at?: string;
  notes?: string;
}

interface BaselineData {
  version: string;
  agents: Record<string, BaselineEntry>;
}

// ── Constants ──

const REGISTRY_FILE = 'agent-registry.yaml';

const PURPOSE_SECTIONS = new Set([
  'purpose', 'role', 'mission', 'objective', 'overview',
  'behavior', 'responsibilities', 'capabilities',
]);

const FORMATTING_SECTIONS = new Set([
  'formatting', 'style', 'output format', 'response format',
]);

// ── Detector ──

export class AgentDriftDetector {
  private readonly graph: GraphAdapter;
  private readonly agentsDir: string;
  private readonly configDir: string;

  constructor(graph: GraphAdapter, agentsDir: string, configDir: string) {
    this.graph = graph;
    this.agentsDir = agentsDir;
    this.configDir = configDir;
  }

  async scan(): Promise<AgentDriftReport[]> {
    const graphStats = await this.graph.stats();
    logger.info({ agentsDir: this.agentsDir, graphNodes: graphStats['total_nodes'] }, 'Starting agent drift scan');

    const agents = await this.loadAgentFiles();
    const baseline = await this.loadBaseline();
    const reports: AgentDriftReport[] = [];
    const now = new Date().toISOString();

    for (const [agentId, agent] of agents) {
      const baselineEntry = baseline.get(agentId);

      if (!baselineEntry) {
        // New agent, no baseline to compare
        logger.debug({ agentId }, 'New agent found, establishing baseline');
        baseline.set(agentId, {
          hash: agent.hash,
          sections: [...agent.sections.keys()],
        });
        continue;
      }

      if (baselineEntry.hash === agent.hash) {
        // No changes
        continue;
      }

      // Content drift detected
      const changedSections = this.findChangedSections(
        baselineEntry.sections,
        agent.sections,
        agentId,
        baseline,
      );
      const driftScore = this.scoreDrift(changedSections, agent.sections);
      const schemaChanges = this.detectSchemaChanges(baselineEntry, agent);
      const driftType = schemaChanges.length > 0 ? 'schema' as const : 'content' as const;
      const recommendation = this.generateRecommendation(driftScore, changedSections, schemaChanges);

      reports.push({
        agent_id: agentId,
        file_path: relative(this.agentsDir, agent.filePath),
        drift_type: driftType,
        drift_score: driftScore,
        previous_hash: baselineEntry.hash,
        current_hash: agent.hash,
        changed_sections: changedSections,
        schema_changes: schemaChanges.length > 0 ? schemaChanges : undefined,
        recommendation,
        detected_at: now,
      });
    }

    // Detect cross-agent contradictions
    const contradictions = this.detectContradictions(agents);
    if (contradictions.length > 0) {
      // Group contradictions by agent pair and create cross-agent reports
      const seen = new Set<string>();
      for (const contradiction of contradictions) {
        const key = `${contradiction.agent_a}::${contradiction.agent_b}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const agentA = agents.get(contradiction.agent_a);
        if (!agentA) continue;

        const pairContradictions = contradictions.filter(
          (c) => c.agent_a === contradiction.agent_a && c.agent_b === contradiction.agent_b,
        );

        reports.push({
          agent_id: contradiction.agent_a,
          file_path: agentA ? relative(this.agentsDir, agentA.filePath) : contradiction.agent_a,
          drift_type: 'cross-agent',
          drift_score: Math.min(10, 5 + pairContradictions.length),
          previous_hash: '',
          current_hash: agentA?.hash ?? '',
          changed_sections: [],
          contradictions: pairContradictions,
          recommendation: `Cross-agent conflicts detected with ${contradiction.agent_b}. Review contradictions and align agent definitions.`,
          detected_at: now,
        });
      }
    }

    // Save updated baseline
    await this.saveBaseline(baseline);

    logger.info({
      totalAgents: agents.size,
      driftReports: reports.length,
      contradictions: contradictions.length,
    }, 'Agent drift scan complete');

    return reports;
  }

  async acknowledgeAgentDrift(agentId: string, notes?: string): Promise<void> {
    const baseline = await this.loadBaseline();
    const agents = await this.loadAgentFiles();
    const agent = agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    baseline.set(agentId, {
      hash: agent.hash,
      sections: [...agent.sections.keys()],
      acknowledged_at: new Date().toISOString(),
      notes,
    });

    await this.saveBaseline(baseline);
    logger.info({ agentId, notes }, 'Agent drift acknowledged');
  }

  async getAgentDiff(agentId: string): Promise<string> {
    const baseline = await this.loadBaseline();
    const agents = await this.loadAgentFiles();
    const agent = agents.get(agentId);

    if (!agent) {
      return `Agent not found: ${agentId}`;
    }

    const baselineEntry = baseline.get(agentId);
    if (!baselineEntry) {
      return `No baseline exists for agent: ${agentId}. This is a new agent.`;
    }

    if (baselineEntry.hash === agent.hash) {
      return `No changes detected for agent: ${agentId}`;
    }

    const lines: string[] = [
      `# Drift Report: ${agentId}`,
      '',
      `**Previous hash:** \`${baselineEntry.hash.slice(0, 12)}\``,
      `**Current hash:** \`${agent.hash.slice(0, 12)}\``,
      '',
      '## Changed Sections',
      '',
    ];

    const currentSectionNames = [...agent.sections.keys()];
    const baselineSectionNames = baselineEntry.sections;

    // Added sections
    for (const name of currentSectionNames) {
      if (!baselineSectionNames.includes(name)) {
        lines.push(`- **Added:** ${name}`);
      }
    }

    // Removed sections
    for (const name of baselineSectionNames) {
      if (!currentSectionNames.includes(name)) {
        lines.push(`- **Removed:** ${name}`);
      }
    }

    // Modified sections (present in both but hash changed - we can't compare old content)
    for (const name of currentSectionNames) {
      if (baselineSectionNames.includes(name)) {
        lines.push(`- **Present:** ${name} (may be modified)`);
      }
    }

    lines.push('');
    lines.push('## Current Content Preview');
    lines.push('');

    for (const [sectionName, sectionContent] of agent.sections) {
      lines.push(`### ${sectionName}`);
      lines.push('');
      const preview = sectionContent.slice(0, 500);
      lines.push(preview);
      if (sectionContent.length > 500) {
        lines.push('...(truncated)');
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  detectContradictions(agents: Map<string, AgentFile>): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const agentEntries = [...agents.entries()];

    for (let i = 0; i < agentEntries.length; i++) {
      const entryA = agentEntries[i];
      if (!entryA) continue;
      const [idA, agentA] = entryA;

      for (let j = i + 1; j < agentEntries.length; j++) {
        const entryB = agentEntries[j];
        if (!entryB) continue;
        const [idB, agentB] = entryB;

        // Check for tool conflicts
        const toolConflicts = this.detectToolConflicts(idA, agentA, idB, agentB);
        contradictions.push(...toolConflicts);

        // Check for rule conflicts
        const ruleConflicts = this.detectRuleConflicts(idA, agentA, idB, agentB);
        contradictions.push(...ruleConflicts);

        // Check for deleted agent references
        const refConflicts = this.detectDeletedReferences(idA, agentA, idB, agentB, agents);
        contradictions.push(...refConflicts);
      }
    }

    return contradictions;
  }

  async loadBaseline(): Promise<Map<string, BaselineEntry>> {
    const registryPath = join(this.configDir, REGISTRY_FILE);
    const baseline = new Map<string, BaselineEntry>();

    try {
      const raw = await readFile(registryPath, 'utf-8');
      const data = yaml.load(raw) as BaselineData | undefined;

      if (data?.agents) {
        for (const [id, entry] of Object.entries(data.agents)) {
          baseline.set(id, entry);
        }
      }
    } catch {
      logger.debug('No existing agent registry found, starting fresh');
    }

    return baseline;
  }

  async saveBaseline(baseline: Map<string, BaselineEntry>): Promise<void> {
    const registryPath = join(this.configDir, REGISTRY_FILE);
    const data: BaselineData = {
      version: '1.0',
      agents: Object.fromEntries(baseline),
    };

    await mkdir(this.configDir, { recursive: true });
    const yamlContent = yaml.dump(data, { lineWidth: 120, noRefs: true });
    await writeFile(registryPath, yamlContent, 'utf-8');
    logger.debug({ path: registryPath }, 'Baseline saved');
  }

  // ── Private Methods ──

  private async loadAgentFiles(): Promise<Map<string, AgentFile>> {
    const agents = new Map<string, AgentFile>();

    let dirNames: string[];
    try {
      dirNames = await readdir(this.agentsDir);
    } catch {
      logger.warn({ agentsDir: this.agentsDir }, 'Agents directory not found');
      return agents;
    }

    for (const name of dirNames) {
      const fullPath = join(this.agentsDir, name);
      const fileStat = await this.safeStat(fullPath);
      if (!fileStat) continue;

      if (fileStat.isFile && name.endsWith('.md')) {
        const agent = await this.loadSingleAgent(name.replace(/\.md$/, ''), fullPath);
        if (agent) agents.set(agent.id, agent);
      }
    }

    // Also scan subdirectories
    for (const name of dirNames) {
      const subDirPath = join(this.agentsDir, name);
      const dirStat = await this.safeStat(subDirPath);
      if (!dirStat?.isDir) continue;

      let subNames: string[];
      try {
        subNames = await readdir(subDirPath);
      } catch {
        continue;
      }

      for (const subName of subNames) {
        if (!subName.endsWith('.md')) continue;
        const subPath = join(subDirPath, subName);
        const subStat = await this.safeStat(subPath);
        if (!subStat?.isFile) continue;

        const agentId = `${name}/${subName.replace(/\.md$/, '')}`;
        const agent = await this.loadSingleAgent(agentId, subPath);
        if (agent) agents.set(agent.id, agent);
      }
    }

    return agents;
  }

  private async safeStat(filePath: string): Promise<{ isFile: boolean; isDir: boolean } | undefined> {
    try {
      const s = await stat(filePath);
      return { isFile: s.isFile(), isDir: s.isDirectory() };
    } catch {
      return undefined;
    }
  }

  private async loadSingleAgent(agentId: string, filePath: string): Promise<AgentFile | undefined> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const hash = createHash('sha256').update(content, 'utf-8').digest('hex');
      const frontmatter = this.parseFrontmatter(content);
      const bodyContent = this.stripFrontmatter(content);
      const sections = extractSections(bodyContent);
      return { id: agentId, filePath, content, hash, frontmatter, sections };
    } catch (err) {
      logger.debug({ filePath, err }, 'Failed to load agent file');
      return undefined;
    }
  }

  private parseFrontmatter(content: string): Record<string, unknown> {
    const fmMatch = /^---\n([\s\S]*?)\n---/.exec(content);
    if (!fmMatch?.[1]) return {};

    try {
      const parsed = yaml.load(fmMatch[1]);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      logger.debug('Failed to parse agent frontmatter');
    }
    return {};
  }

  private stripFrontmatter(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n?/, '');
  }

  private findChangedSections(
    baselineSections: string[],
    currentSections: Map<string, string>,
    _agentId: string,
    _baseline: Map<string, BaselineEntry>,
  ): string[] {
    const changed: string[] = [];
    const currentNames = [...currentSections.keys()];

    // New sections
    for (const name of currentNames) {
      if (!baselineSections.includes(name)) {
        changed.push(name);
      }
    }

    // Removed sections
    for (const name of baselineSections) {
      if (!currentNames.includes(name)) {
        changed.push(name);
      }
    }

    // We can't diff content of existing sections against baseline (only hashes stored),
    // so we flag all sections as potentially changed when the overall hash differs
    // and section names match. The total hash change guarantees something changed.
    if (changed.length === 0) {
      // Hash differs but section list is the same -> content within a section changed
      // Flag all sections as "potentially changed"
      for (const name of currentNames) {
        if (baselineSections.includes(name)) {
          changed.push(name);
        }
      }
    }

    return changed;
  }

  private scoreDrift(changedSections: string[], currentSections: Map<string, string>): number {
    if (changedSections.length === 0) return 0;

    let maxScore = 0;

    for (const sectionName of changedSections) {
      const normalizedName = sectionName.toLowerCase();

      if (PURPOSE_SECTIONS.has(normalizedName)) {
        // Purpose/behavior changes: 7-10
        maxScore = Math.max(maxScore, 8);
      } else if (FORMATTING_SECTIONS.has(normalizedName)) {
        // Formatting changes: 0-2
        maxScore = Math.max(maxScore, 1);
      } else {
        // Section updates: 3-6
        maxScore = Math.max(maxScore, 4);
      }
    }

    // Scale up if many sections changed
    const totalSections = currentSections.size;
    const changeRatio = totalSections > 0 ? changedSections.length / totalSections : 0;

    if (changeRatio > 0.7) {
      maxScore = Math.min(10, maxScore + 2);
    } else if (changeRatio > 0.4) {
      maxScore = Math.min(10, maxScore + 1);
    }

    return Math.min(10, maxScore);
  }

  private detectSchemaChanges(baselineEntry: BaselineEntry, agent: AgentFile): SchemaDiff[] {
    const changes: SchemaDiff[] = [];

    // Compare frontmatter fields as "schema"
    // Since we don't store old frontmatter, we compare section structure
    const oldSections = new Set(baselineEntry.sections);
    const newSections = new Set(agent.sections.keys());

    for (const section of newSections) {
      if (!oldSections.has(section)) {
        changes.push({
          field: section,
          change_type: 'added',
          new_value: section,
        });
      }
    }

    for (const section of oldSections) {
      if (!newSections.has(section)) {
        changes.push({
          field: section,
          change_type: 'removed',
          old_value: section,
        });
      }
    }

    return changes;
  }

  private generateRecommendation(
    score: number,
    changedSections: string[],
    schemaChanges: SchemaDiff[],
  ): string {
    if (score <= 2) {
      return 'Minor formatting changes. Acknowledge when convenient.';
    }

    if (score <= 5) {
      const sectionList = changedSections.slice(0, 3).join(', ');
      return `Moderate content changes in: ${sectionList}. Review before next agent invocation.`;
    }

    if (schemaChanges.length > 0) {
      const added = schemaChanges.filter((c) => c.change_type === 'added').length;
      const removed = schemaChanges.filter((c) => c.change_type === 'removed').length;
      return `Significant schema changes (${added} added, ${removed} removed sections). Immediate review recommended.`;
    }

    return 'Major behavioral changes detected. Review and re-test agent before production use.';
  }

  private detectToolConflicts(
    idA: string,
    agentA: AgentFile,
    idB: string,
    agentB: AgentFile,
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];

    const toolsA = this.extractAllowedTools(agentA);
    const toolsB = this.extractAllowedTools(agentB);

    if (toolsA.size === 0 || toolsB.size === 0) return contradictions;

    // Find tools present in both with conflicting config hints
    for (const [tool, configA] of toolsA) {
      const configB = toolsB.get(tool);
      if (configB && configA !== configB) {
        contradictions.push({
          agent_a: idA,
          agent_b: idB,
          section_a: 'allowed-tools (frontmatter)',
          section_b: 'allowed-tools (frontmatter)',
          conflict_description: `Tool "${tool}" has different configurations: "${configA}" vs "${configB}"`,
        });
      }
    }

    return contradictions;
  }

  private detectRuleConflicts(
    idA: string,
    agentA: AgentFile,
    idB: string,
    agentB: AgentFile,
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Extract rules/constraints from both agents
    const rulesA = this.extractRules(agentA);
    const rulesB = this.extractRules(agentB);

    // Check for conflicting "never" and "always" directives on the same topic
    for (const ruleA of rulesA) {
      for (const ruleB of rulesB) {
        if (this.areRulesContradictory(ruleA, ruleB)) {
          contradictions.push({
            agent_a: idA,
            agent_b: idB,
            section_a: ruleA.section,
            section_b: ruleB.section,
            conflict_description: `Contradictory rules: "${ruleA.text.slice(0, 80)}" vs "${ruleB.text.slice(0, 80)}"`,
          });
        }
      }
    }

    return contradictions;
  }

  private detectDeletedReferences(
    idA: string,
    agentA: AgentFile,
    _idB: string,
    _agentB: AgentFile,
    allAgents: Map<string, AgentFile>,
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Check if agentA references agents that don't exist
    const referencedAgents = this.extractAgentReferences(agentA);

    for (const ref of referencedAgents) {
      if (!allAgents.has(ref.name) && ref.name !== idA) {
        contradictions.push({
          agent_a: idA,
          agent_b: ref.name,
          section_a: ref.section,
          section_b: '(deleted)',
          conflict_description: `References non-existent agent "${ref.name}"`,
        });
      }
    }

    return contradictions;
  }

  private extractAllowedTools(agent: AgentFile): Map<string, string> {
    const tools = new Map<string, string>();
    const allowed = agent.frontmatter['allowed-tools'];

    if (Array.isArray(allowed)) {
      for (const tool of allowed) {
        if (typeof tool === 'string') {
          tools.set(tool, 'enabled');
        } else if (tool && typeof tool === 'object') {
          const toolObj = tool as Record<string, unknown>;
          const name = toolObj['name'];
          if (typeof name === 'string') {
            tools.set(name, JSON.stringify(toolObj));
          }
        }
      }
    }

    return tools;
  }

  private extractRules(agent: AgentFile): Array<{ section: string; text: string; directive: 'always' | 'never' | 'must' | 'must_not' }> {
    const rules: Array<{ section: string; text: string; directive: 'always' | 'never' | 'must' | 'must_not' }> = [];

    for (const [sectionName, content] of agent.sections) {
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('- never') || trimmed.startsWith('never ')) {
          rules.push({ section: sectionName, text: line.trim(), directive: 'never' });
        } else if (trimmed.startsWith('- always') || trimmed.startsWith('always ')) {
          rules.push({ section: sectionName, text: line.trim(), directive: 'always' });
        } else if (trimmed.startsWith('- must not') || trimmed.startsWith('must not ')) {
          rules.push({ section: sectionName, text: line.trim(), directive: 'must_not' });
        } else if (trimmed.startsWith('- must ') || trimmed.match(/^must\s/)) {
          rules.push({ section: sectionName, text: line.trim(), directive: 'must' });
        }
      }
    }

    return rules;
  }

  private areRulesContradictory(
    ruleA: { directive: string; text: string },
    ruleB: { directive: string; text: string },
  ): boolean {
    // Check if directives are opposite
    const isOpposite =
      (ruleA.directive === 'always' && (ruleB.directive === 'never' || ruleB.directive === 'must_not')) ||
      (ruleA.directive === 'must' && (ruleB.directive === 'never' || ruleB.directive === 'must_not')) ||
      (ruleA.directive === 'never' && (ruleB.directive === 'always' || ruleB.directive === 'must')) ||
      (ruleA.directive === 'must_not' && (ruleB.directive === 'always' || ruleB.directive === 'must'));

    if (!isOpposite) return false;

    // Check if they're about the same topic (shared significant words)
    const wordsA = this.extractSignificantWords(ruleA.text);
    const wordsB = this.extractSignificantWords(ruleB.text);

    let overlap = 0;
    for (const word of wordsA) {
      if (wordsB.has(word)) overlap++;
    }

    const minSize = Math.min(wordsA.size, wordsB.size);
    return minSize > 0 && overlap / minSize >= 0.4;
  }

  private extractSignificantWords(text: string): Set<string> {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'shall', 'can', 'to', 'of',
      'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'not', 'no', 'nor', 'but', 'or', 'and', 'if', 'then', 'else',
      'when', 'this', 'that', 'these', 'those', 'it', 'its',
      'always', 'never', 'must',
    ]);

    const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
    const significant = new Set<string>();

    for (const word of words) {
      if (word.length > 2 && !stopWords.has(word)) {
        significant.add(word);
      }
    }

    return significant;
  }

  private extractAgentReferences(agent: AgentFile): Array<{ name: string; section: string }> {
    const refs: Array<{ name: string; section: string }> = [];
    const agentRefPattern = /(?:delegate|hand[- ]?off|invoke|call|use)\s+(?:the\s+)?[`"]?([a-z][a-z0-9-]+(?:\/[a-z0-9-]+)?)[`"]?\s+agent/gi;

    for (const [sectionName, content] of agent.sections) {
      for (const match of content.matchAll(agentRefPattern)) {
        const name = match[1];
        if (name) {
          refs.push({ name, section: sectionName });
        }
      }
    }

    return refs;
  }
}
