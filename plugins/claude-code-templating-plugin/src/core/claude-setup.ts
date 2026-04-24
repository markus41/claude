import { mkdir, readFile, readdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, dirname, join, relative } from 'path';

const toPosix = (p: string): string => p.replace(/\\/g, '/');
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import type { OrchestratorLogger } from './orchestrator.js';
import type { ScaffoldSpec, TemplateInfo } from '../types/scaffold.js';

const execAsync = promisify(execCallback);

const README_MARKER_START = '<!-- claude-code-templating-plugin:setup:start -->';
const README_MARKER_END = '<!-- claude-code-templating-plugin:setup:end -->';
const REPOSITORY_MARKERS = [
  '.git',
  'package.json',
  'pyproject.toml',
  'requirements.txt',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
] as const;
const CLAUDE_INTERNAL_DIRS = new Set(['rules', 'skills', 'templates', 'agents', 'hooks', 'lsp']);

export interface CommandExecutionResult {
  command: string;
  success: boolean;
  stdout?: string;
  stderr?: string;
  skipped?: boolean;
}

export type SetupMode = 'setup' | 'update';

export interface ProjectFingerprint {
  name: string;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'pip' | 'uv' | 'unknown';
  languages: string[];
  frameworks: string[];
  testing: string[];
  infrastructure: string[];
  lspPackages: LspPackagePlan[];
}

export interface LspPackagePlan {
  id: string;
  installCommand: string;
  reason: string;
}

export interface ClaudeSetupOptions {
  mode: SetupMode;
  spec?: ScaffoldSpec;
  templateInfo?: TemplateInfo;
  installLsps?: boolean;
}

export interface ClaudeSetupResult {
  mode: SetupMode;
  fingerprint: ProjectFingerprint;
  filesWritten: string[];
  repositoriesUpdated: string[];
  lspResults: CommandExecutionResult[];
}

export type CommandRunner = (command: string, cwd: string) => Promise<CommandExecutionResult>;

const defaultLogger: OrchestratorLogger = {
  debug: (message: string, ...args: unknown[]) => console.debug(`[claude-setup] ${message}`, ...args),
  info: (message: string, ...args: unknown[]) => console.info(`[claude-setup] ${message}`, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(`[claude-setup] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) => console.error(`[claude-setup] ${message}`, ...args),
};

const defaultCommandRunner: CommandRunner = async (command, cwd) => {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return {
      command,
      success: true,
      stdout,
      stderr,
    };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      command,
      success: false,
      stdout: execError.stdout,
      stderr: execError.stderr || execError.message,
    };
  }
};

export class ClaudeProjectSetupManager {
  constructor(
    private readonly logger: OrchestratorLogger = defaultLogger,
    private readonly commandRunner: CommandRunner = defaultCommandRunner,
  ) {}

  async synchronizeProject(projectPath: string, options: ClaudeSetupOptions): Promise<ClaudeSetupResult> {
    const fingerprint = await this.fingerprintProject(projectPath);
    const filesWritten: string[] = [];

    await this.ensureDirectoryTree(projectPath);
    await this.writeManagedFile(projectPath, 'CLAUDE.md', this.renderRootClaudeMd(projectPath, fingerprint, options), filesWritten);
    await this.updateReadme(projectPath, fingerprint, options, filesWritten);

    const documentationFiles = this.buildDocumentationFiles(fingerprint, options);
    for (const [filePath, content] of documentationFiles) {
      await this.writeManagedFile(projectPath, filePath, content, filesWritten);
    }

    const repositoriesUpdated = await this.ensureNestedRepositoryClaudeDirs(projectPath, filesWritten);
    const lspResults = await this.ensureLspSupport(projectPath, fingerprint, options.installLsps !== false, filesWritten);

    return {
      mode: options.mode,
      fingerprint,
      filesWritten,
      repositoriesUpdated,
      lspResults,
    };
  }

  async fingerprintProject(projectPath: string): Promise<ProjectFingerprint> {
    const packageJson = await this.readJsonFile<Record<string, unknown>>(join(projectPath, 'package.json'));
    const dependencies = this.collectDependencies(packageJson);
    const languages = new Set<string>();
    const frameworks = new Set<string>();
    const testing = new Set<string>();
    const infrastructure = new Set<string>();

    if (existsSync(join(projectPath, 'tsconfig.json')) || dependencies.has('typescript')) {
      languages.add('TypeScript');
    }

    if (packageJson || dependencies.size > 0) {
      languages.add(languages.has('TypeScript') ? 'JavaScript' : 'JavaScript');
    }

    if (existsSync(join(projectPath, 'pyproject.toml')) || existsSync(join(projectPath, 'requirements.txt'))) {
      languages.add('Python');
    }

    if (existsSync(join(projectPath, 'go.mod'))) {
      languages.add('Go');
    }

    if (existsSync(join(projectPath, 'Cargo.toml'))) {
      languages.add('Rust');
    }

    if (dependencies.has('react')) {
      frameworks.add('React');
    }
    if (dependencies.has('next')) {
      frameworks.add('Next.js');
    }
    if (dependencies.has('vite')) {
      frameworks.add('Vite');
    }
    if (dependencies.has('fastapi')) {
      frameworks.add('FastAPI');
    }
    if (dependencies.has('@nestjs/core')) {
      frameworks.add('NestJS');
    }
    if (dependencies.has('tailwindcss') || existsSync(join(projectPath, 'tailwind.config.js')) || existsSync(join(projectPath, 'tailwind.config.ts'))) {
      frameworks.add('Tailwind CSS');
    }

    if (dependencies.has('vitest')) {
      testing.add('Vitest');
    }
    if (dependencies.has('jest')) {
      testing.add('Jest');
    }
    if (dependencies.has('@playwright/test') || existsSync(join(projectPath, 'playwright.config.ts'))) {
      testing.add('Playwright');
    }
    if (existsSync(join(projectPath, 'pytest.ini')) || existsSync(join(projectPath, 'pyproject.toml'))) {
      const pyProject = await this.readTextFile(join(projectPath, 'pyproject.toml'));
      if (pyProject.includes('pytest')) {
        testing.add('Pytest');
      }
    }

    if (existsSync(join(projectPath, 'Dockerfile')) || existsSync(join(projectPath, 'docker-compose.yml'))) {
      infrastructure.add('Docker');
    }
    if (existsSync(join(projectPath, 'kubernetes')) || existsSync(join(projectPath, 'k8s'))) {
      infrastructure.add('Kubernetes');
    }
    if (existsSync(join(projectPath, '.github', 'workflows'))) {
      infrastructure.add('GitHub Actions');
    }

    const packageManager = this.detectPackageManager(projectPath);
    const lspPackages = this.buildLspPlan(projectPath, packageManager, languages, frameworks);

    return {
      name: String(packageJson?.name || basename(projectPath)),
      packageManager,
      languages: Array.from(languages),
      frameworks: Array.from(frameworks),
      testing: Array.from(testing),
      infrastructure: Array.from(infrastructure),
      lspPackages,
    };
  }

  private detectPackageManager(projectPath: string): ProjectFingerprint['packageManager'] {
    if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (existsSync(join(projectPath, 'yarn.lock'))) return 'yarn';
    if (existsSync(join(projectPath, 'bun.lockb')) || existsSync(join(projectPath, 'bun.lock'))) return 'bun';
    if (existsSync(join(projectPath, 'package-lock.json'))) return 'npm';
    if (existsSync(join(projectPath, 'uv.lock'))) return 'uv';
    if (existsSync(join(projectPath, 'requirements.txt')) || existsSync(join(projectPath, 'pyproject.toml'))) return 'pip';
    return 'unknown';
  }

  private buildLspPlan(
    projectPath: string,
    packageManager: ProjectFingerprint['packageManager'],
    languages: Set<string>,
    frameworks: Set<string>,
  ): LspPackagePlan[] {
    const plans: LspPackagePlan[] = [];
    const nodeInstallPrefix = this.nodeInstallPrefix(packageManager);

    if (nodeInstallPrefix && (languages.has('TypeScript') || languages.has('JavaScript'))) {
      plans.push({
        id: 'typescript-language-server',
        installCommand: `${nodeInstallPrefix} typescript typescript-language-server`,
        reason: 'Required for JavaScript and TypeScript authoring support.',
      });
      plans.push({
        id: 'vscode-langservers-extracted',
        installCommand: `${nodeInstallPrefix} vscode-langservers-extracted`,
        reason: 'Provides JSON, HTML, and CSS language servers for generated Claude docs and config.',
      });
      plans.push({
        id: 'yaml-language-server',
        installCommand: `${nodeInstallPrefix} yaml-language-server`,
        reason: 'Supports Claude hook YAML and deployment configuration files.',
      });
      plans.push({
        id: 'bash-language-server',
        installCommand: `${nodeInstallPrefix} bash-language-server`,
        reason: 'Supports setup scripts and shell-based automation hooks.',
      });
      plans.push({
        id: 'dockerfile-language-server-nodejs',
        installCommand: `${nodeInstallPrefix} dockerfile-language-server-nodejs`,
        reason: 'Supports Docker and containerization files when present.',
      });
    }

    if (frameworks.has('Tailwind CSS') && nodeInstallPrefix) {
      plans.push({
        id: '@tailwindcss/language-server',
        installCommand: `${nodeInstallPrefix} @tailwindcss/language-server`,
        reason: 'Improves utility-class autocomplete and validation for Tailwind projects.',
      });
    }

    if (languages.has('Python')) {
      const command = existsSync(join(projectPath, 'uv.lock'))
        ? 'uv tool install python-lsp-server'
        : 'python -m pip install python-lsp-server';
      plans.push({
        id: 'python-lsp-server',
        installCommand: command,
        reason: 'Supports Python modules, migrations, and generated automation helpers.',
      });
    }

    return plans;
  }

  private nodeInstallPrefix(packageManager: ProjectFingerprint['packageManager']): string | null {
    switch (packageManager) {
      case 'pnpm':
        return 'pnpm add -D';
      case 'yarn':
        return 'yarn add -D';
      case 'bun':
        return 'bun add -d';
      case 'npm':
        return 'npm install -D';
      default:
        return null;
    }
  }

  private async ensureDirectoryTree(projectPath: string): Promise<void> {
    const directories = [
      '.claude',
      '.claude/rules',
      '.claude/skills/code-review',
      '.claude/skills/release-notes',
      '.claude/skills/migration-planner',
      '.claude/skills/bug-triage',
      '.claude/templates',
      '.claude/agents',
      '.claude/hooks/post-refactor',
      '.claude/hooks/pre-merge',
      '.claude/lsp',
      'docs/context',
      'docs/context/decisions',
    ];

    for (const directory of directories) {
      await mkdir(join(projectPath, directory), { recursive: true });
    }
  }

  private buildDocumentationFiles(
    fingerprint: ProjectFingerprint,
    options: ClaudeSetupOptions,
  ): Array<[string, string]> {
    const stack = [
      ...fingerprint.languages,
      ...fingerprint.frameworks,
    ].join(', ') || 'project-specific tooling';
    const testing = fingerprint.testing.join(', ') || 'the repository test commands';
    const infra = fingerprint.infrastructure.join(', ') || 'the repository deployment surface';
    const generatedFrom = options.templateInfo
      ? `${options.templateInfo.name} v${options.templateInfo.version || '1.0.0'}`
      : 'existing repository analysis';

    return [
      ['.claude/CLAUDE.local.md', '# Local Claude Overrides\n\nDocument personal-only overrides here. Keep this file gitignored when possible.\n'],
      ['.claude/rules/coding.md', `# Coding Rules\n\n## 1. Standards\n- Preserve ${stack} conventions already used in the repository.\n- Prefer small, testable changes with clear ownership.\n\n## 2. Implementation Checklist\n- Match naming and folder structure already used in the codebase.\n- Add or update tests for behavior changes.\n- Keep documentation synchronized with implementation changes.\n`],
      ['.claude/rules/testing.md', `# Testing Rules\n\n## Required Checks\n- Run the fastest relevant unit test path first.\n- Run integration or end-to-end checks when workflow boundaries change.\n- Update fixtures, snapshots, and golden files intentionally.\n\n## Repository Guidance\n- Current fingerprinted testing surface: ${testing}.\n`],
      ['.claude/rules/security.md', '# Security Rules\n\n## Non-Negotiables\n- Never commit credentials, tokens, or private certificates.\n- Prefer least-privilege defaults for new automation and hooks.\n- Document any new external integrations in docs/context/security-rules.md.\n'],
      ['.claude/rules/infra.md', `# Infrastructure Rules\n\n## Current Surface\n- Primary infrastructure signals: ${infra}.\n\n## Delivery Expectations\n- Record rollout expectations, environments, and rollback notes for automation changes.\n- Keep deployment-related documentation aligned with hook and template updates.\n`],
      ['.claude/rules/review.md', '# Review Checklist\n\n- Verify functionality, tests, docs, and rollback notes are present.\n- Confirm README, CLAUDE.md, and context docs reflect material changes.\n- Validate generated hooks and templates still point to current commands.\n'],
      ['.claude/rules/product.md', '# Product Guardrails\n\n- Preserve core user workflows before adding automation.\n- Prefer explicit tradeoffs in docs/context/personas-and-use-cases.md and docs/context/plan.md.\n'],
      ['.claude/skills/code-review/SKILL.md', '# Code Review Skill\n\n1. Load .claude/rules/*.md relevant to the change.\n2. Compare implementation, tests, and docs.\n3. Summarize risks, regressions, and rollout concerns.\n'],
      ['.claude/skills/code-review/checklist.md', '# Code Review Checklist\n\n- Behavior verified\n- Tests updated\n- Docs synchronized\n- Security and rollout impact assessed\n'],
      ['.claude/skills/code-review/template.md', '# Review Summary\n\n## Findings\n- \n\n## Risks\n- \n\n## Follow-ups\n- \n'],
      ['.claude/skills/code-review/examples.md', '# Code Review Examples\n\nUse this folder for repository-specific review examples and anti-patterns.\n'],
      ['.claude/skills/release-notes/SKILL.md', '# Release Notes Skill\n\n1. Inspect diffs, changelog, and docs/context/decisions.\n2. Capture user-facing changes and migration notes.\n3. Record follow-up operational considerations.\n'],
      ['.claude/skills/release-notes/template.md', '# Release Notes\n\n## Highlights\n- \n\n## Breaking Changes\n- None noted.\n\n## Operator Notes\n- \n'],
      ['.claude/skills/release-notes/examples.md', '# Release Notes Examples\n\nStore examples of repository-specific changelog and release note formats here.\n'],
      ['.claude/skills/migration-planner/SKILL.md', '# Migration Planner Skill\n\n1. Trace the current data and API contracts.\n2. Define forward migration, validation, and rollback steps.\n3. Link operational guidance in docs/context/data-migrations.md.\n'],
      ['.claude/skills/migration-planner/playbook.md', '# Migration Playbook\n\n- Discovery\n- Dry run\n- Rollout\n- Validation\n- Rollback\n'],
      ['.claude/skills/bug-triage/SKILL.md', '# Bug Triage Skill\n\n1. Reproduce and scope the issue.\n2. Map the issue to affected personas, flows, and systems.\n3. Recommend next action with severity and owner.\n'],
      ['.claude/skills/bug-triage/heuristics.md', '# Bug Triage Heuristics\n\n- Severity\n- Reproducibility\n- Blast radius\n- Operational urgency\n'],
      ['.claude/templates/pr-description.md', '# PR Description\n\n## Summary\n- \n\n## Testing\n- \n\n## Risks\n- \n'],
      ['.claude/templates/design-doc.md', '# Design Doc\n\n## Problem\n\n## Decision\n\n## Risks\n\n## Rollout\n'],
      ['.claude/templates/test-plan.md', '# Test Plan\n\n## Scope\n\n## Checks\n\n## Risks\n'],
      ['.claude/templates/incident-report.md', '# Incident Report\n\n## Timeline\n\n## Impact\n\n## Root Cause\n\n## Follow-up\n'],
      ['.claude/agents/backend-architect.md', '# Backend Architect\n\nFocus on service contracts, data boundaries, migrations, and deployment safety.\n'],
      ['.claude/agents/frontend-specialist.md', '# Frontend Specialist\n\nFocus on UX flows, component contracts, accessibility, and visual consistency.\n'],
      ['.claude/agents/infra-guardian.md', '# Infra Guardian\n\nFocus on deployment safety, observability, resilience, and rollback readiness.\n'],
      ['.claude/agents/qa-analyst.md', '# QA Analyst\n\nFocus on failure modes, regression coverage, and scenario design.\n'],
      ['.claude/hooks/post-refactor/run-tests.yaml', 'name: run-tests\ndescription: Run the quickest repository tests that validate the edited surface.\nsteps:\n  - inspect docs/context/testing-strategy.md\n  - run focused unit tests\n  - run broader checks when contracts change\n'],
      ['.claude/hooks/post-refactor/update-docs.yaml', 'name: update-docs\ndescription: Keep README, CLAUDE.md, and context documents aligned with implementation.\nsteps:\n  - update README.md managed section\n  - update CLAUDE.md reference map\n  - update docs/context/changelog.md and plan.md\n'],
      ['.claude/hooks/pre-merge/sanity-checks.yaml', 'name: sanity-checks\ndescription: Final verification before merge or release.\nsteps:\n  - confirm tests passed\n  - confirm documentation updated\n  - confirm rollback notes exist for risky changes\n'],
      ['docs/context/project-overview.md', `# Project Overview\n\n## Summary\n${options.spec?.description || `${fingerprint.name} is currently described through the repository fingerprint and generated Claude context.`}\n\n## Generated From\n- ${generatedFrom}\n\n## Stack Snapshot\n- ${stack}\n`],
      ['docs/context/project.md', `# Project\n\n## Identity\n- Name: ${fingerprint.name}\n- Setup mode: ${options.mode}\n\n## Current Fingerprint\n- Languages: ${fingerprint.languages.join(', ') || 'Unknown'}\n- Frameworks: ${fingerprint.frameworks.join(', ') || 'Unknown'}\n- Testing: ${fingerprint.testing.join(', ') || 'Unknown'}\n- Infrastructure: ${fingerprint.infrastructure.join(', ') || 'Unknown'}\n`],
      ['docs/context/vision-and-roadmap.md', '# Vision and Roadmap\n\nCapture near-term milestones, strategic bets, and deliberate non-goals here.\n'],
      ['docs/context/domain-glossary.md', '# Domain Glossary\n\nDocument canonical entities, status names, acronyms, and invariant business terms here.\n'],
      ['docs/context/personas-and-use-cases.md', '# Personas and Use Cases\n\nList primary operators, developers, and end users with their critical workflows.\n'],
      ['docs/context/architecture.md', `# Architecture\n\n## Topology\nUse this document for the high-level system narrative and boundary map.\n\n## Current Signals\n- Frameworks: ${fingerprint.frameworks.join(', ') || 'Unknown'}\n- Infrastructure: ${infra}\n`],
      ['docs/context/architecture-runtime.md', '# Architecture Runtime\n\nDescribe requests, background jobs, queues, events, and third-party interactions.\n'],
      ['docs/context/architecture-deployment.md', '# Architecture Deployment\n\nDocument environments, regions, scaling constraints, and feature-flag strategy here.\n'],
      ['docs/context/data-model.md', '# Data Model\n\nDocument key entities, ownership boundaries, and invariants.\n'],
      ['docs/context/data-migrations.md', '# Data Migrations\n\nRecord migration patterns, validation steps, and rollback expectations here.\n'],
      ['docs/context/api-contracts.md', '# API Contracts\n\nSummarize major endpoints, events, inputs, outputs, and versioning rules.\n'],
      ['docs/context/api-guidelines.md', '# API Guidelines\n\nDocument naming, pagination, validation, idempotency, and compatibility rules.\n'],
      ['docs/context/ux-flows.md', '# UX Flows\n\nDescribe the core user journeys step by step, including expected success and failure states.\n'],
      ['docs/context/ux-principles.md', '# UX Principles\n\nDocument the interaction principles that code changes should preserve.\n'],
      ['docs/context/security-rules.md', '# Security Rules\n\nDocument auth, tenant boundaries, secrets handling, logging constraints, and compliance guardrails.\n'],
      ['docs/context/compliance.md', '# Compliance\n\nRecord regulatory obligations, retention windows, and data-handling requirements.\n'],
      ['docs/context/testing-strategy.md', `# Testing Strategy\n\n## Current Tooling\n- ${testing}\n\n## Expectations\n- Add focused regression coverage for changed behavior.\n- Update docs when fixtures or operational behavior change.\n`],
      ['docs/context/test-inventory.md', '# Test Inventory\n\nList unit, integration, e2e, contract, and smoke test entry points here.\n'],
      ['docs/context/constraints.md', '# Constraints\n\nDocument platform support, hard limits, SLOs, and imposed technology choices.\n'],
      ['docs/context/performance.md', '# Performance\n\nDocument latency budgets, hot paths, and benchmark expectations.\n'],
      ['docs/context/ops-and-runbooks.md', '# Ops and Runbooks\n\nDescribe recurring operational tasks, incident handling, and escalation paths.\n'],
      ['docs/context/changelog.md', `# Changelog\n\n## ${new Date().toISOString().slice(0, 10)}\n- ${options.mode === 'setup' ? 'Initialized' : 'Updated'} Claude Code project context and repository fingerprint baseline.\n`],
      ['docs/context/plan.md', '# Plan\n\n## Active Work\n- Keep this file updated with current priorities, risks, and follow-ups.\n'],
      ['docs/context/lessons-learned.md', '# Lessons Learned\n\nCapture mistakes, wins, incidents, and reusable guidance for future changes here.\n'],
      ['docs/context/decisions/adr-0001-claude-context-foundation.md', '# ADR 0001: Claude Context Foundation\n\n## Status\nAccepted\n\n## Context\nThe repository needs a repeatable Claude Code context baseline that can be refreshed as the plugin evolves.\n\n## Decision\nAdopt a managed .claude and docs/context structure generated from project fingerprinting.\n\n## Consequences\nFuture updates can synchronize Claude guidance without replacing project-specific notes outside managed sections.\n'],
    ];
  }

  private renderRootClaudeMd(
    projectPath: string,
    fingerprint: ProjectFingerprint,
    options: ClaudeSetupOptions,
  ): string {
    const projectName = fingerprint.name;
    const generatedFrom = options.templateInfo
      ? `${options.templateInfo.name} v${options.templateInfo.version || '1.0.0'}`
      : 'repository fingerprint analysis';
    const lspList = fingerprint.lspPackages.map((item) => `- ${item.id}: ${item.reason}`).join('\n') || '- No LSP requirements detected.';

    return `# ${projectName}\n\n## 1. Project Summary\n### 1.1 What this repository is\n- ${options.spec?.description || `${projectName} with a Claude Code context baseline generated from ${generatedFrom}.`}\n\n### 1.2 Current stack fingerprint\n- Languages: ${fingerprint.languages.join(', ') || 'Unknown'}\n- Frameworks: ${fingerprint.frameworks.join(', ') || 'Unknown'}\n- Testing: ${fingerprint.testing.join(', ') || 'Unknown'}\n- Infrastructure: ${fingerprint.infrastructure.join(', ') || 'Unknown'}\n- Package manager: ${fingerprint.packageManager}\n\n## 2. How to Work Here\n### 2.1 Default execution model\n- Start with docs/context/project-overview.md and docs/context/architecture.md before broad changes.\n- Use .claude/rules/coding.md and .claude/rules/testing.md as the default implementation guardrails.\n- Record notable design tradeoffs in docs/context/decisions/.\n\n### 2.2 Documentation expectations\n- Keep README.md, this CLAUDE.md, and docs/context/changelog.md synchronized with material changes.\n- Add lessons to docs/context/lessons-learned.md when new pitfalls or reusable patterns emerge.\n\n## 3. Reference Documents\n### 3.1 Rules\n- @.claude/rules/coding.md\n- @.claude/rules/testing.md\n- @.claude/rules/security.md\n- @.claude/rules/infra.md\n- @.claude/rules/review.md\n- @.claude/rules/product.md\n\n### 3.2 Core context\n- @docs/context/project-overview.md\n- @docs/context/project.md\n- @docs/context/vision-and-roadmap.md\n- @docs/context/domain-glossary.md\n- @docs/context/personas-and-use-cases.md\n- @docs/context/architecture.md\n- @docs/context/architecture-runtime.md\n- @docs/context/architecture-deployment.md\n- @docs/context/data-model.md\n- @docs/context/data-migrations.md\n- @docs/context/api-contracts.md\n- @docs/context/api-guidelines.md\n- @docs/context/ux-flows.md\n- @docs/context/ux-principles.md\n- @docs/context/security-rules.md\n- @docs/context/compliance.md\n- @docs/context/testing-strategy.md\n- @docs/context/test-inventory.md\n- @docs/context/constraints.md\n- @docs/context/performance.md\n- @docs/context/ops-and-runbooks.md\n- @docs/context/changelog.md\n- @docs/context/plan.md\n- @docs/context/lessons-learned.md\n\n## 4. Read-When Triggers\n### 4.1 Architecture changes\nRead @docs/context/architecture.md, @docs/context/architecture-runtime.md, and @docs/context/data-model.md.\n\n### 4.2 Delivery or deployment changes\nRead @.claude/rules/infra.md, @docs/context/architecture-deployment.md, and @docs/context/ops-and-runbooks.md.\n\n### 4.3 Product or UX changes\nRead @.claude/rules/product.md, @docs/context/personas-and-use-cases.md, and @docs/context/ux-flows.md.\n\n### 4.4 Testing-heavy changes\nRead @.claude/rules/testing.md and @docs/context/testing-strategy.md.\n\n## 5. Skills, Templates, and Hooks\n### 5.1 Skills\n- Use @.claude/skills/code-review/SKILL.md for structured reviews.\n- Use @.claude/skills/release-notes/SKILL.md for changelog and release summaries.\n- Use @.claude/skills/migration-planner/SKILL.md for schema or API evolution.\n- Use @.claude/skills/bug-triage/SKILL.md for issue assessment.\n\n### 5.2 Reusable templates\n- @.claude/templates/pr-description.md\n- @.claude/templates/design-doc.md\n- @.claude/templates/test-plan.md\n- @.claude/templates/incident-report.md\n\n### 5.3 Hooks\n- @.claude/hooks/post-refactor/run-tests.yaml\n- @.claude/hooks/post-refactor/update-docs.yaml\n- @.claude/hooks/pre-merge/sanity-checks.yaml\n\n## 6. LSP Coverage\n${lspList}\n\n## 7. Sync Workflow\n- Run the plugin setup command again whenever the plugin is upgraded or the repository stack changes.\n- Setup mode writes the baseline. Update mode refreshes managed Claude context while preserving unmanaged repository content.\n- Nested repositories stored under ${toPosix(relative(projectPath, join(projectPath, '.claude'))) || '.claude'} are scanned so they also receive a local .claude baseline.\n`;
  }

  private async updateReadme(
    projectPath: string,
    fingerprint: ProjectFingerprint,
    options: ClaudeSetupOptions,
    filesWritten: string[],
  ): Promise<void> {
    const readmePath = join(projectPath, 'README.md');
    const current = existsSync(readmePath)
      ? await readFile(readmePath, 'utf-8')
      : `# ${fingerprint.name}\n`;
    const managedSection = `${README_MARKER_START}\n## Claude Code Setup\n\n### Why this exists\nThis repository includes a generated Claude Code operating baseline that can be refreshed with the plugin's setup/update command.\n\n### Managed assets\n- Root \`CLAUDE.md\` with reference maps and read-when triggers.\n- \`.claude/\` rules, skills, templates, agents, hooks, and LSP manifest.\n- \`docs/context/\` architecture, testing, planning, project, and lessons-learned documents.\n\n### Refresh workflow\n- Initial setup mode creates the baseline for a newly scaffolded or onboarded repository.\n- Update mode re-applies the latest plugin-managed structure after plugin upgrades.\n- Nested repositories under \`.claude/\` are scanned and provisioned with their own \`.claude\` directories.\n\n### Fingerprint summary\n- Languages: ${fingerprint.languages.join(', ') || 'Unknown'}\n- Frameworks: ${fingerprint.frameworks.join(', ') || 'Unknown'}\n- Testing: ${fingerprint.testing.join(', ') || 'Unknown'}\n- Package manager: ${fingerprint.packageManager}\n- Last sync mode: ${options.mode}\n${README_MARKER_END}`;

    const updated = current.includes(README_MARKER_START)
      ? current.replace(new RegExp(`${README_MARKER_START}[\\s\\S]*?${README_MARKER_END}`), managedSection)
      : `${current.trimEnd()}\n\n${managedSection}\n`;

    await writeFile(readmePath, `${updated.trimEnd()}\n`, 'utf-8');
    filesWritten.push(toPosix(relative(projectPath, readmePath)));
  }

  private async ensureNestedRepositoryClaudeDirs(projectPath: string, filesWritten: string[]): Promise<string[]> {
    const rootClaudePath = join(projectPath, '.claude');
    if (!existsSync(rootClaudePath)) {
      return [];
    }

    const repositories: string[] = [];
    const walk = async (currentPath: string): Promise<void> => {
      const entries = await readdir(currentPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        if (entry.name === '.claude') {
          continue;
        }

        const fullPath = join(currentPath, entry.name);
        const relativePath = toPosix(relative(rootClaudePath, fullPath));
        const pathParts = relativePath.split('/').filter(Boolean);
        if (pathParts.some((part: string) => CLAUDE_INTERNAL_DIRS.has(part))) {
          continue;
        }

        if (await this.isRepositoryDirectory(fullPath)) {
          const nestedClaudePath = join(fullPath, '.claude');
          await mkdir(nestedClaudePath, { recursive: true });
          const nestedReadme = `# Nested Claude Context\n\nThis repository was discovered under the parent project's .claude directory and provisioned during Claude setup synchronization.\n\n- Parent project: ${basename(projectPath)}\n- Nested repository path: ${toPosix(relative(projectPath, fullPath))}\n`;
          const nestedClaude = `# ${basename(fullPath)}\n\n## Nested Repository Guidance\n- This nested repository is managed as a subordinate project under the parent Claude context.\n- Add repository-specific rules and references here when the nested project diverges.\n`;
          await writeFile(join(nestedClaudePath, 'README.md'), nestedReadme, 'utf-8');
          await writeFile(join(nestedClaudePath, 'CLAUDE.md'), nestedClaude, 'utf-8');
          repositories.push(toPosix(relative(projectPath, fullPath)));
          filesWritten.push(toPosix(relative(projectPath, join(nestedClaudePath, 'README.md'))));
          filesWritten.push(toPosix(relative(projectPath, join(nestedClaudePath, 'CLAUDE.md'))));
          continue;
        }

        await walk(fullPath);
      }
    };

    await walk(rootClaudePath);
    return repositories;
  }

  private async ensureLspSupport(
    projectPath: string,
    fingerprint: ProjectFingerprint,
    installLsps: boolean,
    filesWritten: string[],
  ): Promise<CommandExecutionResult[]> {
    const manifestPath = join(projectPath, '.claude', 'lsp', 'manifest.json');
    await writeFile(manifestPath, `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      packageManager: fingerprint.packageManager,
      servers: fingerprint.lspPackages,
    }, null, 2)}\n`, 'utf-8');
    filesWritten.push(toPosix(relative(projectPath, manifestPath)));

    const installerPath = join(projectPath, '.claude', 'lsp', 'install.sh');
    const installerContent = ['#!/usr/bin/env bash', 'set -euo pipefail', '', ...fingerprint.lspPackages.map((item) => item.installCommand)].join('\n');
    await writeFile(installerPath, `${installerContent}\n`, 'utf-8');
    filesWritten.push(toPosix(relative(projectPath, installerPath)));

    if (!installLsps) {
      return fingerprint.lspPackages.map((item) => ({
        command: item.installCommand,
        success: true,
        skipped: true,
        stderr: 'Skipped automatic installation; manifest and installer were generated.',
      }));
    }

    const results: CommandExecutionResult[] = [];
    for (const lsp of fingerprint.lspPackages) {
      this.logger.info(`Ensuring LSP package: ${lsp.id}`);
      const result = await this.commandRunner(lsp.installCommand, projectPath);
      results.push(result);
    }

    return results;
  }

  private async isRepositoryDirectory(targetPath: string): Promise<boolean> {
    for (const marker of REPOSITORY_MARKERS) {
      if (existsSync(join(targetPath, marker))) {
        return true;
      }
    }

    const packageJson = await this.readJsonFile<Record<string, unknown>>(join(targetPath, 'package.json'));
    return Boolean(packageJson?.name);
  }

  private collectDependencies(packageJson: Record<string, unknown> | null): Set<string> {
    const dependencies = new Set<string>();
    if (!packageJson) {
      return dependencies;
    }

    const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;
    for (const section of sections) {
      const deps = packageJson[section];
      if (deps && typeof deps === 'object') {
        for (const dependencyName of Object.keys(deps)) {
          dependencies.add(dependencyName);
        }
      }
    }

    return dependencies;
  }

  private async writeManagedFile(
    projectPath: string,
    relativeFilePath: string,
    content: string,
    filesWritten: string[],
  ): Promise<void> {
    const targetPath = join(projectPath, relativeFilePath);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, `${content.trimEnd()}\n`, 'utf-8');
    filesWritten.push(relativeFilePath);
  }

  private async readJsonFile<T>(filePath: string): Promise<T | null> {
    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.warn(`Could not parse JSON file: ${filePath}`, error);
      return null;
    }
  }

  private async readTextFile(filePath: string): Promise<string> {
    if (!existsSync(filePath)) {
      return '';
    }

    try {
      return await readFile(filePath, 'utf-8');
    } catch (error) {
      this.logger.warn(`Could not read file: ${filePath}`, error);
      return '';
    }
  }
}
