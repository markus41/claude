import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const confluenceTemplateDir = path.resolve(__dirname, '../templates/confluence');

const requiredPropertyKeys = ['issue-key', 'release', 'incident', 'env', 'service'];
const templates = [
  'release-status.md.template',
  'incident-timeline.md.template',
  'rollback-log.md.template',
  'sla-breach-report.md.template',
];

const templateVariables: Record<string, string> = {
  RELEASE_NAME: 'Q1 Hardening',
  JIRA_KEY: 'OPS-42',
  JIRA_URL: 'https://jira.example.com',
  SERVICE_NAME: 'edge-gateway',
  ENV: 'prod',
  RELEASE_VERSION: '2026.03.1',
  DATE: '2026-02-01',
  INCIDENT_ID: 'INC-1001',
  JIRA_PROJECT: 'OPS',
  QUARTER: '2026-Q1',
  RELEASE_SUMMARY: 'Release shipped with canary validation.',
  BUILD_OWNER: 'build-bot',
  BUILD_STATUS: 'done',
  BUILD_ETA: '2026-02-01T10:00:00Z',
  QA_OWNER: 'qa-team',
  QA_STATUS: 'done',
  QA_ETA: '2026-02-01T11:00:00Z',
  DEPLOY_OWNER: 'sre',
  DEPLOY_STATUS: 'in-progress',
  DEPLOY_ETA: '2026-02-01T12:00:00Z',
  RISKS_AND_MITIGATIONS: 'None open.',
  OPERATIONS_INDEX_URL: 'https://confluence.example.com/ops-index',
  CANONICAL_PAGE_URL: 'https://confluence.example.com/canonical',
  SEVERITY: 'SEV-2',
  INCIDENT_OPENED_AT: '2026-02-01T08:00:00Z',
  T0: '2026-02-01T08:00:00Z',
  T1: '2026-02-01T08:05:00Z',
  T2: '2026-02-01T08:20:00Z',
  T3: '2026-02-01T08:40:00Z',
  DETECTED_BY: 'monitoring',
  TRIAGE_OWNER: 'oncall',
  MITIGATION_OWNER: 'sre',
  RECOVERY_OWNER: 'incident-commander',
  EVIDENCE_T0: 'Datadog alert #123',
  EVIDENCE_T1: 'Slack timeline',
  EVIDENCE_T2: 'Deploy rollback event',
  EVIDENCE_T3: 'SLO recovered',
  INCIDENT_IMPACT: 'Elevated 5xx for 8 minutes.',
  ROLLBACK_STARTED_AT: '2026-02-01T08:15:00Z',
  STEP_1_STATUS: 'done',
  STEP_1_OWNER: 'oncall',
  STEP_1_TIME: '2026-02-01T08:16:00Z',
  STEP_2_STATUS: 'done',
  STEP_2_OWNER: 'release-manager',
  STEP_2_TIME: '2026-02-01T08:21:00Z',
  STEP_3_STATUS: 'done',
  STEP_3_OWNER: 'qa-team',
  STEP_3_TIME: '2026-02-01T08:28:00Z',
  STEP_4_STATUS: 'done',
  STEP_4_OWNER: 'incident-commander',
  STEP_4_TIME: '2026-02-01T08:35:00Z',
  ROLLBACK_VALIDATION: 'Error rate returned under threshold.',
  SLA_BREACH_ID: 'SLA-77',
  SLA_POLICY_NAME: 'API Availability',
  BREACH_START: '2026-02-01T08:00:00Z',
  BREACH_END: '2026-02-01T08:09:00Z',
  TARGET_SLA: '99.9%',
  OBSERVED_SLA: '97.2%',
  USER_IMPACT: 'Login failures for EU region.',
  ROOT_CAUSE: 'Regression in auth cache invalidation.',
  CORRECTIVE_ACTIONS: 'Rollback + added deployment guard.',
};

const renderTemplate = (template: string): string =>
  template.replace(/{{([A-Z0-9_]+)}}/g, (_match, key: string) => templateVariables[key] ?? `{{${key}}}`);

describe('confluence operations templates', () => {
  it('include required page property keys in every operations template', () => {
    for (const templateFile of templates) {
      const raw = readFileSync(path.join(confluenceTemplateDir, templateFile), 'utf8');
      for (const key of requiredPropertyKeys) {
        expect(raw, `${templateFile} missing property key ${key}`).toContain(`| ${key} |`);
      }
    }
  });

  it('render without unresolved placeholders when provided fixture variables', () => {
    for (const templateFile of templates) {
      const raw = readFileSync(path.join(confluenceTemplateDir, templateFile), 'utf8');
      const rendered = renderTemplate(raw);
      expect(rendered).not.toMatch(/{{[A-Z0-9_]+}}/);
      expect(rendered).toContain('⚓ Golden Armada');
    }
  });
});
