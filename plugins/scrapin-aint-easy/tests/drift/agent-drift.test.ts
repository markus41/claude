import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { AgentDriftDetector } from '../../src/drift/agent-drift.js';
import type { GraphAdapter } from '../../src/core/graph.js';
import { vi } from 'vitest';

// ── Stub GraphAdapter ──

function makeGraphStub(): GraphAdapter {
  return {
    stats: vi.fn().mockResolvedValue({ total_nodes: 0, total_edges: 0 }),
    upsertNode: vi.fn(),
    upsertEdge: vi.fn(),
    traverse: vi.fn(),
    siblings: vi.fn(),
    markStale: vi.fn(),
    markDeleted: vi.fn(),
    getNodesByLabel: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    getNode: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn(),
  } as unknown as GraphAdapter;
}

// ── Helpers ──

const FORMATTING_AGENT_CONTENT = `---
name: formatter
description: Formatting specialist
model: haiku
allowed-tools:
  - Read
---
# Formatter

## formatting

Respond in plain text only.
Use no markdown.
`;

const BEHAVIOR_AGENT_CONTENT = `---
name: orchestrator
description: Task orchestrator
model: sonnet
allowed-tools:
  - Bash
  - Read
---
# Orchestrator

## purpose

Route tasks to the appropriate subagent.
Delegate work when complex.

## behavior

Always confirm before executing destructive commands.
Never skip user confirmation steps.
`;

async function writeMockAgents(
  agentsDir: string,
  agents: Record<string, string>,
): Promise<void> {
  for (const [name, content] of Object.entries(agents)) {
    await writeFile(join(agentsDir, `${name}.md`), content, 'utf-8');
  }
}

// ── Tests ──

describe('AgentDriftDetector', () => {
  let agentsDir: string;
  let configDir: string;
  let detector: AgentDriftDetector;
  let graph: GraphAdapter;

  beforeEach(async () => {
    agentsDir = await mkdtemp(join(tmpdir(), 'scrapin-agents-'));
    configDir = await mkdtemp(join(tmpdir(), 'scrapin-config-'));
    graph = makeGraphStub();
    detector = new AgentDriftDetector(graph, agentsDir, configDir);
  });

  afterEach(async () => {
    await rm(agentsDir, { recursive: true, force: true });
    await rm(configDir, { recursive: true, force: true });
  });

  describe('baseline establishment', () => {
    it('should produce no drift reports for new agents on first scan (no baseline)', async () => {
      await writeMockAgents(agentsDir, {
        formatter: FORMATTING_AGENT_CONTENT,
      });

      const reports = await detector.scan();
      // New agents establish baseline, no drift reports produced
      expect(reports).toEqual([]);
    });

    it('should produce no drift reports when files have not changed since baseline', async () => {
      await writeMockAgents(agentsDir, {
        formatter: FORMATTING_AGENT_CONTENT,
      });

      // First scan establishes baseline
      await detector.scan();
      // Second scan with unchanged files
      const reports = await detector.scan();
      expect(reports).toEqual([]);
    });
  });

  describe('drift detection', () => {
    it('should detect drift when an agent file changes', async () => {
      await writeMockAgents(agentsDir, {
        orchestrator: BEHAVIOR_AGENT_CONTENT,
      });

      // Establish baseline
      await detector.scan();

      // Modify the agent file
      const modified = BEHAVIOR_AGENT_CONTENT + '\n## additional-section\n\nNewly added section.\n';
      await writeFile(join(agentsDir, 'orchestrator.md'), modified, 'utf-8');

      const reports = await detector.scan();
      expect(reports.length).toBeGreaterThanOrEqual(1);
      const report = reports.find((r) => r.agent_id === 'orchestrator');
      expect(report).toBeDefined();
    });

    it('should assign a higher drift score for behavior/purpose changes than formatting changes', async () => {
      const agentWithPurpose = `---
name: agent-a
description: Test agent
model: sonnet
---
# Agent A

## purpose

Original purpose: help users with tasks.

## formatting

Use plain text.
`;

      const agentWithFormatting = `---
name: agent-b
description: Test agent
model: sonnet
---
# Agent B

## formatting

Use plain text.
`;

      await writeMockAgents(agentsDir, {
        'agent-a': agentWithPurpose,
        'agent-b': agentWithFormatting,
      });

      // Establish baselines
      await detector.scan();

      // Modify both: agent-a gets a purpose change, agent-b gets formatting change
      const modifiedA = agentWithPurpose.replace(
        'Original purpose: help users with tasks.',
        'CHANGED: now agent does something completely different.',
      );
      const modifiedB = agentWithFormatting.replace(
        'Use plain text.',
        'Use markdown with bold headers.',
      );

      await writeFile(join(agentsDir, 'agent-a.md'), modifiedA, 'utf-8');
      await writeFile(join(agentsDir, 'agent-b.md'), modifiedB, 'utf-8');

      const reports = await detector.scan();
      const purposeReport = reports.find((r) => r.agent_id === 'agent-a');
      const formattingReport = reports.find((r) => r.agent_id === 'agent-b');

      expect(purposeReport).toBeDefined();
      expect(formattingReport).toBeDefined();
      expect(purposeReport!.drift_score).toBeGreaterThan(formattingReport!.drift_score);
    });

    it('should include the changed section names in changed_sections', async () => {
      const original = `---
name: agent-c
description: Test
model: sonnet
---
# Agent C

## behavior

Do X.
`;
      await writeFile(join(agentsDir, 'agent-c.md'), original, 'utf-8');
      await detector.scan();

      // Add a new section
      const modified = original + '\n## new-section\n\nSomething new.\n';
      await writeFile(join(agentsDir, 'agent-c.md'), modified, 'utf-8');

      const reports = await detector.scan();
      const report = reports.find((r) => r.agent_id === 'agent-c');
      expect(report?.changed_sections).toContain('new-section');
    });

    it('should record previous_hash and current_hash as different when drift occurs', async () => {
      const content = `---
name: hash-test
description: Hash test
model: haiku
---
# Hash Test

## purpose

Original.
`;
      await writeFile(join(agentsDir, 'hash-test.md'), content, 'utf-8');
      await detector.scan();

      const modified = content.replace('Original.', 'Modified content here.');
      await writeFile(join(agentsDir, 'hash-test.md'), modified, 'utf-8');

      const reports = await detector.scan();
      const report = reports.find((r) => r.agent_id === 'hash-test');
      expect(report?.previous_hash).not.toBe(report?.current_hash);
      expect(report?.previous_hash).toHaveLength(64); // sha256 hex
      expect(report?.current_hash).toHaveLength(64);
    });
  });

  describe('acknowledgeAgentDrift', () => {
    it('should update baseline so subsequent scan finds no drift', async () => {
      const content = BEHAVIOR_AGENT_CONTENT;
      await writeMockAgents(agentsDir, { orchestrator: content });

      // Establish baseline
      await detector.scan();

      // Modify file to create drift
      const modified = content + '\n## extra\n\nExtra section.\n';
      await writeFile(join(agentsDir, 'orchestrator.md'), modified, 'utf-8');

      // Scan to confirm drift exists
      const driftReports = await detector.scan();
      expect(driftReports.some((r) => r.agent_id === 'orchestrator')).toBe(true);

      // Acknowledge drift
      await detector.acknowledgeAgentDrift('orchestrator', 'Approved addition of extra section');

      // Subsequent scan should show no drift
      const cleanReports = await detector.scan();
      const remaining = cleanReports.filter((r) => r.agent_id === 'orchestrator');
      expect(remaining).toHaveLength(0);
    });

    it('should throw when acknowledging a non-existent agent', async () => {
      await expect(
        detector.acknowledgeAgentDrift('nonexistent-agent'),
      ).rejects.toThrow('Agent not found: nonexistent-agent');
    });
  });

  describe('contradiction detection', () => {
    it('should detect cross-agent contradictions between always/never directives', async () => {
      const agentAlways = `---
name: agent-always
description: Always agent
model: sonnet
---
# Agent Always

## behavior

Always use markdown for all responses.
`;

      const agentNever = `---
name: agent-never
description: Never agent
model: sonnet
---
# Agent Never

## behavior

Never use markdown in responses.
`;

      await writeMockAgents(agentsDir, {
        'agent-always': agentAlways,
        'agent-never': agentNever,
      });

      // Build AgentFile map directly by running a scan (which loads files)
      // Then call detectContradictions directly after loading via scan
      // We use scan() and check if cross-agent reports appear
      const reports = await detector.scan();

      // First scan establishes baselines for new agents — no content drift reports.
      // Cross-agent contradictions can still surface even without baselines.
      const crossAgentReports = reports.filter((r) => r.drift_type === 'cross-agent');
      expect(crossAgentReports.length).toBeGreaterThanOrEqual(1);
    });

    it('should not flag agents with no conflicting directives', async () => {
      const agentA = `---
name: safe-a
description: Safe A
model: haiku
---
# Safe A

## behavior

Use concise responses.
`;

      const agentB = `---
name: safe-b
description: Safe B
model: haiku
---
# Safe B

## behavior

Provide detailed explanations when asked.
`;

      await writeMockAgents(agentsDir, {
        'safe-a': agentA,
        'safe-b': agentB,
      });

      const reports = await detector.scan();
      const crossAgent = reports.filter((r) => r.drift_type === 'cross-agent');
      expect(crossAgent).toHaveLength(0);
    });
  });

  describe('baseline persistence', () => {
    it('should save baseline to the config directory as YAML', async () => {
      await writeMockAgents(agentsDir, { formatter: FORMATTING_AGENT_CONTENT });

      await detector.scan();

      // Verify baseline file was written
      const { existsSync } = await import('node:fs');
      const registryPath = join(configDir, 'agent-registry.yaml');
      expect(existsSync(registryPath)).toBe(true);
    });

    it('should reload baseline across separate detector instances', async () => {
      await writeMockAgents(agentsDir, { formatter: FORMATTING_AGENT_CONTENT });

      // First detector: establish baseline
      await detector.scan();

      // Second detector pointing to same dirs
      const detector2 = new AgentDriftDetector(graph, agentsDir, configDir);
      const reports = await detector2.scan();
      // No drift since file unchanged
      expect(reports).toEqual([]);
    });
  });

  describe('subdirectory scanning', () => {
    it('should scan .md files in subdirectories of the agents directory', async () => {
      const subdir = join(agentsDir, 'research');
      await mkdir(subdir, { recursive: true });
      await writeFile(join(subdir, 'researcher.md'), FORMATTING_AGENT_CONTENT, 'utf-8');

      const reports = await detector.scan(); // establishes baseline

      // Modify the subdir agent
      const modified = FORMATTING_AGENT_CONTENT + '\n## extra\n\nExtra.\n';
      await writeFile(join(subdir, 'researcher.md'), modified, 'utf-8');

      const driftReports = await detector.scan();
      const found = driftReports.find((r) => r.agent_id === 'research/researcher');
      expect(found).toBeDefined();
    });
  });
});
