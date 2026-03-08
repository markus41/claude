import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type IntegrationFixture,
  loadFixtures,
  runValidation,
  validateFixture,
  validateFixtures,
} from '../../scripts/validate-integrations';

describe('integration contract validation', () => {
  const fixturesPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

  it('loads all release lifecycle fixtures', () => {
    const fixtures = loadFixtures(fixturesPath);
    const scenarios = fixtures.map((fixture) => fixture.scenario);

    expect(scenarios).toEqual([
      'failed-release',
      'incident-escalation',
      'normal-release',
      'rollback',
    ]);
  });

  it('keeps baseline fixtures healthy across all scenarios', () => {
    const fixtures = loadFixtures(fixturesPath);

    for (const fixture of fixtures) {
      expect(validateFixture(fixture), `scenario ${fixture.scenario}`).toEqual([]);
    }
  });

  it('detects contract regressions by integration area', () => {
    const [fixture] = loadFixtures(fixturesPath);
    const brokenFixture: IntegrationFixture = {
      ...fixture,
      jira: {
        ...fixture.jira,
        properties: {
          ...fixture.jira.properties,
          'harness.executionId': undefined,
        },
      },
      automation: {
        ...fixture.automation,
        steps: fixture.automation.steps.map((step, index) =>
          index === 0 ? { ...step, action: '' } : step,
        ),
      },
      confluence: {
        ...fixture.confluence,
        properties: {
          ...fixture.confluence.properties,
          owner: { type: 'number' },
        },
      },
      harness: {
        ...fixture.harness,
        transitionMap: {},
      },
    };

    const issues = validateFixture(brokenFixture);
    expect(issues.some((issue) => issue.area === 'jira')).toBe(true);
    expect(issues.some((issue) => issue.area === 'automation')).toBe(true);
    expect(issues.some((issue) => issue.area === 'confluence')).toBe(true);
    expect(issues.some((issue) => issue.area === 'harness')).toBe(true);
  });

  it('produces machine-readable report with severity summary', () => {
    const fixtures = loadFixtures(fixturesPath);
    const report = validateFixtures(fixtures, fixturesPath);

    expect(report.summary.totalScenarios).toBe(4);
    expect(report.summary.passedScenarios).toBe(4);
    expect(report.summary.issuesBySeverity).toEqual({
      info: 0,
      warning: 0,
      error: 0,
    });
  });

  it('writes report JSON for downstream CI processing', () => {
    const tempDir = mkdtempSync(path.join(tmpdir(), 'integration-validation-'));
    const outputPath = path.join(tempDir, 'integration-health.json');

    const report = runValidation(fixturesPath, outputPath);
    const persisted = JSON.parse(readFileSync(outputPath, 'utf-8')) as typeof report;

    expect(persisted.summary).toEqual(report.summary);
    expect(Array.isArray(persisted.issues)).toBe(true);

    rmSync(tempDir, { recursive: true, force: true });
  });
});
