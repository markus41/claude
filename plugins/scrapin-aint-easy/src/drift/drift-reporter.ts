import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import pino from 'pino';
import { type CodeDriftReport } from './code-drift.js';
import { type AgentDriftReport } from './agent-drift.js';

const logger = pino({ name: 'drift-reporter' });

// ── Severity Indicators ──

function severityEmoji(score: number): string {
  if (score <= 2) return '[LOW]';
  if (score <= 5) return '[MED]';
  if (score <= 8) return '[HIGH]';
  return '[CRIT]';
}

function severityLabel(score: number): string {
  if (score <= 2) return 'Low';
  if (score <= 5) return 'Medium';
  if (score <= 8) return 'High';
  return 'Critical';
}

// ── Code Drift Report ──

export function formatCodeDriftReport(report: CodeDriftReport): string {
  const lines: string[] = [
    '# Code Drift Report',
    '',
    `**Scan timestamp:** ${report.scan_timestamp}`,
    `**Files scanned:** ${report.files_scanned}`,
    `**Duration:** ${report.duration_ms}ms`,
    '',
  ];

  // Missing docs
  lines.push(`## Missing Documentation (${report.missing_docs.length})`);
  lines.push('');

  if (report.missing_docs.length === 0) {
    lines.push('No missing documentation detected.');
  } else {
    lines.push('| Symbol | Package | Files | Crawl Queued |');
    lines.push('|--------|---------|-------|--------------|');
    for (const entry of report.missing_docs) {
      const fileList = entry.files.slice(0, 3).join(', ');
      const more = entry.files.length > 3 ? ` +${entry.files.length - 3}` : '';
      lines.push(
        `| \`${entry.symbol}\` | \`${entry.package}\` | ${fileList}${more} | ${entry.crawl_queued ? 'Yes' : 'No'} |`,
      );
    }
  }
  lines.push('');

  // Deprecated usage
  lines.push(`## Deprecated Usage (${report.deprecated_usage.length})`);
  lines.push('');

  if (report.deprecated_usage.length === 0) {
    lines.push('No deprecated symbol usage detected.');
  } else {
    lines.push('| Symbol | Package | Deprecated Since | Replacement | Files |');
    lines.push('|--------|---------|------------------|-------------|-------|');
    for (const entry of report.deprecated_usage) {
      const fileList = entry.files.slice(0, 3).join(', ');
      lines.push(
        `| \`${entry.symbol}\` | \`${entry.package}\` | ${entry.deprecated_since} | \`${entry.replacement}\` | ${fileList} |`,
      );
    }
  }
  lines.push('');

  // Stale docs
  lines.push(`## Stale Documentation (${report.stale_docs.length})`);
  lines.push('');

  if (report.stale_docs.length === 0) {
    lines.push('No stale documentation detected.');
  } else {
    lines.push('| Symbol | Package | Doc Updated | Files |');
    lines.push('|--------|---------|-------------|-------|');
    for (const entry of report.stale_docs) {
      const fileList = entry.files.slice(0, 3).join(', ');
      lines.push(
        `| \`${entry.symbol}\` | \`${entry.package}\` | ${entry.doc_updated} | ${fileList} |`,
      );
    }
  }
  lines.push('');

  return lines.join('\n');
}

// ── Agent Drift Report ──

export function formatAgentDriftReport(reports: AgentDriftReport[]): string {
  const lines: string[] = [
    '# Agent Drift Report',
    '',
  ];

  if (reports.length === 0) {
    lines.push('No agent drift detected. All agents match their baselines.');
    return lines.join('\n');
  }

  // Summary
  const critical = reports.filter((r) => r.drift_score > 8).length;
  const high = reports.filter((r) => r.drift_score > 5 && r.drift_score <= 8).length;
  const medium = reports.filter((r) => r.drift_score > 2 && r.drift_score <= 5).length;
  const low = reports.filter((r) => r.drift_score <= 2).length;

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Severity | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Critical | ${critical} |`);
  lines.push(`| High     | ${high} |`);
  lines.push(`| Medium   | ${medium} |`);
  lines.push(`| Low      | ${low} |`);
  lines.push('');

  // Sort by drift score descending
  const sorted = [...reports].sort((a, b) => b.drift_score - a.drift_score);

  lines.push('## Details');
  lines.push('');

  for (const report of sorted) {
    const severity = severityEmoji(report.drift_score);
    lines.push(`### ${severity} ${report.agent_id} (score: ${report.drift_score}/10)`);
    lines.push('');
    lines.push(`- **Type:** ${report.drift_type}`);
    lines.push(`- **File:** \`${report.file_path}\``);
    lines.push(`- **Detected:** ${report.detected_at}`);

    if (report.previous_hash) {
      lines.push(`- **Hash:** \`${report.previous_hash.slice(0, 12)}\` -> \`${report.current_hash.slice(0, 12)}\``);
    }

    if (report.changed_sections.length > 0) {
      lines.push(`- **Changed sections:** ${report.changed_sections.join(', ')}`);
    }

    if (report.schema_changes && report.schema_changes.length > 0) {
      lines.push('- **Schema changes:**');
      for (const change of report.schema_changes) {
        if (change.change_type === 'added') {
          lines.push(`  - Added: \`${change.field}\``);
        } else if (change.change_type === 'removed') {
          lines.push(`  - Removed: \`${change.field}\``);
        } else {
          lines.push(`  - Type changed: \`${change.field}\` (\`${change.old_value ?? '?'}\` -> \`${change.new_value ?? '?'}\`)`);
        }
      }
    }

    if (report.contradictions && report.contradictions.length > 0) {
      lines.push('- **Contradictions:**');
      for (const c of report.contradictions) {
        lines.push(`  - \`${c.agent_a}\` vs \`${c.agent_b}\`: ${c.conflict_description}`);
      }
    }

    lines.push(`- **Recommendation:** ${report.recommendation}`);
    lines.push('');
  }

  return lines.join('\n');
}

// ── Combined Summary ──

export function formatCombinedDriftSummary(
  code: CodeDriftReport | null,
  agents: AgentDriftReport[],
): string {
  const lines: string[] = [
    '# Drift Detection Summary',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    '',
  ];

  // Overall status
  const hasCodeDrift = code !== null && (
    code.missing_docs.length > 0 ||
    code.deprecated_usage.length > 0 ||
    code.stale_docs.length > 0
  );
  const hasAgentDrift = agents.length > 0;
  const maxAgentScore = agents.reduce((max, r) => Math.max(max, r.drift_score), 0);

  let overallSeverity: string;
  if (maxAgentScore > 8 || (hasCodeDrift && code !== null && code.deprecated_usage.length > 5)) {
    overallSeverity = '[CRIT] Critical';
  } else if (maxAgentScore > 5 || (hasCodeDrift && code !== null && code.missing_docs.length > 10)) {
    overallSeverity = '[HIGH] High';
  } else if (hasCodeDrift || hasAgentDrift) {
    overallSeverity = '[MED] Medium';
  } else {
    overallSeverity = '[LOW] Low';
  }

  lines.push(`## Overall Status: ${overallSeverity}`);
  lines.push('');

  // Code drift summary
  lines.push('## Code Drift');
  lines.push('');

  if (code === null) {
    lines.push('Code drift scan not performed.');
  } else {
    lines.push(`- **Files scanned:** ${code.files_scanned}`);
    lines.push(`- **Missing docs:** ${code.missing_docs.length}`);
    lines.push(`- **Deprecated usage:** ${code.deprecated_usage.length}`);
    lines.push(`- **Stale docs:** ${code.stale_docs.length}`);
    lines.push(`- **Scan duration:** ${code.duration_ms}ms`);

    if (code.missing_docs.length > 0) {
      lines.push('');
      lines.push('### Top Missing Docs');
      lines.push('');
      for (const entry of code.missing_docs.slice(0, 5)) {
        lines.push(`- \`${entry.symbol}\` from \`${entry.package}\` (${entry.files.length} file(s))`);
      }
      if (code.missing_docs.length > 5) {
        lines.push(`- ...and ${code.missing_docs.length - 5} more`);
      }
    }

    if (code.deprecated_usage.length > 0) {
      lines.push('');
      lines.push('### Deprecated Symbols in Use');
      lines.push('');
      for (const entry of code.deprecated_usage.slice(0, 5)) {
        lines.push(`- \`${entry.symbol}\` (since ${entry.deprecated_since}) -> \`${entry.replacement}\``);
      }
    }
  }
  lines.push('');

  // Agent drift summary
  lines.push('## Agent Drift');
  lines.push('');

  if (agents.length === 0) {
    lines.push('No agent drift detected.');
  } else {
    const sorted = [...agents].sort((a, b) => b.drift_score - a.drift_score);
    lines.push(`- **Agents with drift:** ${agents.length}`);
    lines.push(`- **Highest severity:** ${severityLabel(maxAgentScore)} (${maxAgentScore}/10)`);

    const crossAgent = agents.filter((r) => r.drift_type === 'cross-agent');
    if (crossAgent.length > 0) {
      lines.push(`- **Cross-agent conflicts:** ${crossAgent.length}`);
    }

    lines.push('');
    lines.push('### Agent Summary');
    lines.push('');
    lines.push('| Agent | Score | Type | Recommendation |');
    lines.push('|-------|-------|------|----------------|');

    for (const report of sorted.slice(0, 10)) {
      const sev = severityEmoji(report.drift_score);
      lines.push(
        `| ${sev} \`${report.agent_id}\` | ${report.drift_score}/10 | ${report.drift_type} | ${report.recommendation.slice(0, 60)}${report.recommendation.length > 60 ? '...' : ''} |`,
      );
    }

    if (sorted.length > 10) {
      lines.push(`| | | | ...and ${sorted.length - 10} more |`);
    }
  }
  lines.push('');

  // Action items
  lines.push('## Recommended Actions');
  lines.push('');

  const actions: string[] = [];

  if (code !== null && code.deprecated_usage.length > 0) {
    actions.push('- [ ] Replace deprecated symbol usage with recommended alternatives');
  }
  if (code !== null && code.missing_docs.length > 0) {
    actions.push(`- [ ] Queue crawl for ${code.missing_docs.length} undocumented packages`);
  }
  if (code !== null && code.stale_docs.length > 0) {
    actions.push(`- [ ] Re-crawl ${code.stale_docs.length} stale documentation pages`);
  }

  const criticalAgents = agents.filter((r) => r.drift_score > 8);
  if (criticalAgents.length > 0) {
    actions.push(`- [ ] Immediately review ${criticalAgents.length} critical agent drift(s)`);
  }

  const highAgents = agents.filter((r) => r.drift_score > 5 && r.drift_score <= 8);
  if (highAgents.length > 0) {
    actions.push(`- [ ] Review ${highAgents.length} high-severity agent drift(s) before next invocation`);
  }

  const crossAgentConflicts = agents.filter((r) => r.drift_type === 'cross-agent');
  if (crossAgentConflicts.length > 0) {
    actions.push(`- [ ] Resolve ${crossAgentConflicts.length} cross-agent contradiction(s)`);
  }

  if (actions.length === 0) {
    lines.push('No immediate actions required.');
  } else {
    lines.push(...actions);
  }

  lines.push('');
  return lines.join('\n');
}

// ── Persistence ──

export async function saveDriftReport(
  report: unknown,
  type: string,
  dataDir: string,
): Promise<string> {
  const reportsDir = join(dataDir, 'drift-reports');
  await mkdir(reportsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${type}-${timestamp}.json`;
  const filePath = join(reportsDir, filename);

  const content = JSON.stringify(report, null, 2);
  await writeFile(filePath, content, 'utf-8');

  logger.info({ path: filePath, type }, 'Drift report saved');
  return filePath;
}
