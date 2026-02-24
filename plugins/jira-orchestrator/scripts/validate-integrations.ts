import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type Severity = 'info' | 'warning' | 'error';

export interface IntegrationIssue {
  scenario: string;
  area: 'jira' | 'automation' | 'confluence' | 'harness';
  severity: Severity;
  message: string;
  remediation: string;
}

export interface IntegrationFixture {
  scenario: string;
  jira: {
    requiredFields: string[];
    fields: Record<string, unknown>;
    requiredProperties: string[];
    properties: Record<string, unknown>;
  };
  automation: {
    templateName: string;
    requiredSteps: string[];
    steps: Array<{ id: string; action?: string }>;
  };
  confluence: {
    templateName: string;
    requiredProperties: Record<string, string>;
    properties: Record<string, { type: string; required?: boolean }>;
  };
  harness: {
    requiredTransitions: string[];
    transitionMap: Record<string, string>;
  };
}

export interface IntegrationHealthReport {
  generatedAt: string;
  fixturesPath: string;
  summary: {
    totalScenarios: number;
    passedScenarios: number;
    issuesBySeverity: Record<Severity, number>;
  };
  issues: IntegrationIssue[];
}

const dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultFixturesPath = path.resolve(dirname, '../tests/integration-contracts/fixtures');
const reportPath = path.resolve(dirname, '../sessions/reports/integration-health.json');

export function validateFixture(fixture: IntegrationFixture): IntegrationIssue[] {
  const issues: IntegrationIssue[] = [];

  const missingJiraFields = fixture.jira.requiredFields.filter((field) => fixture.jira.fields[field] == null);
  for (const field of missingJiraFields) {
    issues.push({
      scenario: fixture.scenario,
      area: 'jira',
      severity: 'error',
      message: `Missing required Jira field: ${field}`,
      remediation: `Populate Jira field \"${field}\" in the release orchestration issue payload.`,
    });
  }

  const missingJiraProperties = fixture.jira.requiredProperties.filter(
    (property) => fixture.jira.properties[property] == null,
  );
  for (const property of missingJiraProperties) {
    issues.push({
      scenario: fixture.scenario,
      area: 'jira',
      severity: 'error',
      message: `Missing required Jira issue property: ${property}`,
      remediation: `Ensure Jira automation sets issue property \"${property}\" before transition execution.`,
    });
  }

  const presentSteps = new Set(fixture.automation.steps.map((step) => step.id));
  for (const step of fixture.automation.requiredSteps) {
    if (!presentSteps.has(step)) {
      issues.push({
        scenario: fixture.scenario,
        area: 'automation',
        severity: 'error',
        message: `Automation template ${fixture.automation.templateName} is missing required step: ${step}`,
        remediation: `Add step \"${step}\" to automation template \"${fixture.automation.templateName}\".`,
      });
    }
  }

  for (const step of fixture.automation.steps) {
    if (!step.action || !step.action.trim()) {
      issues.push({
        scenario: fixture.scenario,
        area: 'automation',
        severity: 'warning',
        message: `Automation step ${step.id} has no action configured.`,
        remediation: `Define a concrete action for automation step \"${step.id}\".`,
      });
    }
  }

  for (const [property, expectedType] of Object.entries(fixture.confluence.requiredProperties)) {
    const actual = fixture.confluence.properties[property];
    if (!actual) {
      issues.push({
        scenario: fixture.scenario,
        area: 'confluence',
        severity: 'error',
        message: `Confluence template ${fixture.confluence.templateName} is missing property: ${property}`,
        remediation: `Add property \"${property}\" with type \"${expectedType}\" to template metadata.`,
      });
      continue;
    }

    if (actual.type !== expectedType) {
      issues.push({
        scenario: fixture.scenario,
        area: 'confluence',
        severity: 'error',
        message: `Confluence property ${property} has type ${actual.type}, expected ${expectedType}.`,
        remediation: `Update Confluence template property \"${property}\" to type \"${expectedType}\".`,
      });
    }
  }

  for (const transition of fixture.harness.requiredTransitions) {
    if (!fixture.harness.transitionMap[transition]) {
      issues.push({
        scenario: fixture.scenario,
        area: 'harness',
        severity: 'error',
        message: `Harness transition map missing coverage for transition: ${transition}`,
        remediation: `Map transition \"${transition}\" to a Harness pipeline stage or rollback workflow.`,
      });
    }
  }

  return issues;
}

export function validateFixtures(fixtures: IntegrationFixture[], fixturesPath = defaultFixturesPath): IntegrationHealthReport {
  const issues = fixtures.flatMap(validateFixture);
  const issueCounts = issues.reduce(
    (acc, issue) => {
      acc[issue.severity] += 1;
      return acc;
    },
    { info: 0, warning: 0, error: 0 } as Record<Severity, number>,
  );

  const scenarioIssueMap = new Map<string, number>();
  for (const issue of issues) {
    scenarioIssueMap.set(issue.scenario, (scenarioIssueMap.get(issue.scenario) ?? 0) + 1);
  }

  return {
    generatedAt: new Date().toISOString(),
    fixturesPath,
    summary: {
      totalScenarios: fixtures.length,
      passedScenarios: fixtures.length - scenarioIssueMap.size,
      issuesBySeverity: issueCounts,
    },
    issues,
  };
}

export function loadFixtures(fixturesPath = defaultFixturesPath): IntegrationFixture[] {
  return readdirSync(fixturesPath)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => {
      const fullPath = path.join(fixturesPath, file);
      const content = readFileSync(fullPath, 'utf-8');
      return JSON.parse(content) as IntegrationFixture;
    });
}

export function writeReport(report: IntegrationHealthReport, outputPath = reportPath) {
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
}

export function runValidation(fixturesPath = defaultFixturesPath, outputPath = reportPath): IntegrationHealthReport {
  const fixtures = loadFixtures(fixturesPath);
  const report = validateFixtures(fixtures, fixturesPath);
  writeReport(report, outputPath);
  return report;
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  const report = runValidation();
  const hasErrors = report.summary.issuesBySeverity.error > 0;
  console.log(`Validated ${report.summary.totalScenarios} integration scenarios.`);
  console.log(`Report written to ${reportPath}`);
  console.log(`Issues: ${JSON.stringify(report.summary.issuesBySeverity)}`);

  if (hasErrors) {
    process.exitCode = 1;
  }
}
