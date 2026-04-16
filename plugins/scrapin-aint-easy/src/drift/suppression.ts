import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';
import { type CodeDriftReport } from './code-drift.js';

interface DriftSuppressionRule {
  package?: string;
  symbol?: string;
  until: string;
  reason?: string;
}

interface SuppressionFile {
  suppressions?: DriftSuppressionRule[];
}

function active(rule: DriftSuppressionRule): boolean {
  return Date.now() <= Date.parse(rule.until);
}

function matches(rule: DriftSuppressionRule, symbol: string, pkg: string): boolean {
  if (rule.symbol && rule.symbol !== symbol) return false;
  if (rule.package && rule.package !== pkg) return false;
  return true;
}

export async function applyDriftSuppressions(configDir: string, report: CodeDriftReport): Promise<CodeDriftReport> {
  const filePath = join(configDir, 'drift-suppressions.yaml');
  if (!existsSync(filePath)) return report;

  const raw = await readFile(filePath, 'utf-8');
  const parsed = (yaml.load(raw) as SuppressionFile) ?? {};
  const rules = (parsed.suppressions ?? []).filter(active);
  if (rules.length === 0) return report;

  return {
    ...report,
    missing_docs: report.missing_docs.filter((e) => !rules.some((r) => matches(r, e.symbol, e.package))),
    deprecated_usage: report.deprecated_usage.filter((e) => !rules.some((r) => matches(r, e.symbol, e.package))),
    stale_docs: report.stale_docs.filter((e) => !rules.some((r) => matches(r, e.symbol, e.package))),
  };
}
