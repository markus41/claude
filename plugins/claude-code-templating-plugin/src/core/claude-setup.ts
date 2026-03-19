import { mkdir, writeFile, readdir, readFile, access } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename, relative, dirname } from 'path';
import { createHash } from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface ClaudeSetupOptions {
  mode: 'setup' | 'update';
  projectRoot: string;
  force?: boolean;
  includeNestedRepositories?: boolean;
  installLsps?: boolean;
}

export interface ClaudeSetupResult {
  projectRoot: string;
  mode: 'setup' | 'update';
  updatedFiles: string[];
  nestedRepositories: string[];
  installedLsps: string[];
  warnings: string[];
  fingerprintPath: string;
}

interface DetectedProjectProfile {
  name: string;
  packageManager: 'npm' | 'pnpm' | 'yarn' | 'pip' | 'unknown';
  stack: string[];
  languages: string[];
  commands: {
    install: string;
    dev: string;
    test: string;
    lint: string;
    build: string;
  };
}

interface ManagedDoc {
  path: string;
  content: string;
}

interface ManagedWriteOptions {
  force?: boolean;
  warnings: string[];
}

export class ClaudeSetupManager {
  async ensureProjectSetup(options: ClaudeSetupOptions): Promise<ClaudeSetupResult> {
    const root = options.projectRoot;
    const includeNestedRepositories = options.includeNestedRepositories !== false;
    const profile = await this.detectProjectProfile(root);

    const updatedFiles: string[] = [];
    const warnings: string[] = [];
    const nestedRepositories: string[] = [];
    const installedLsps: string[] = [];

    const managedDocs = this.buildManagedDocs(root, profile, options.mode);

    for (const doc of managedDocs) {
      await this.writeManagedFile(root, doc, updatedFiles, {
        force: options.force,
        warnings,
      });
    }

    if (includeNestedRepositories) {
      const nestedRepoPaths = await this.findNestedRepositories(root);
      for (const repoPath of nestedRepoPaths) {
        nestedRepositories.push(relative(root, repoPath) || '.');
        const repoProfile = await this.detectProjectProfile(repoPath);
        const nestedDocs = this.buildNestedRepositoryDocs(root, repoPath, repoProfile, options.mode);
        for (const doc of nestedDocs) {
          await this.writeManagedFile(repoPath, doc, updatedFiles, {
            force: options.force,
            warnings,
          }, root);
        }

        if (options.installLsps !== false) {
          const nestedLspResult = await this.installRequiredLsps(repoPath, repoProfile);
          installedLsps.push(...nestedLspResult.installed.map((pkg) => `${relative(root, repoPath)}:${pkg}`));
          warnings.push(...nestedLspResult.warnings.map((warning) => `${relative(root, repoPath)}: ${warning}`));
        }
      }
    }

    if (options.installLsps !== false) {
      const lspResult = await this.installRequiredLsps(root, profile);
      installedLsps.push(...lspResult.installed);
      warnings.push(...lspResult.warnings);
    }

    const fingerprintPath = await this.writeFingerprint(root, {
      mode: options.mode,
      updatedFiles,
      nestedRepositories,
      installedLsps,
      profile,
    });
    updatedFiles.push(relative(root, fingerprintPath));

    return {
      projectRoot: root,
      mode: options.mode,
      updatedFiles,
      nestedRepositories,
      installedLsps,
      warnings,
      fingerprintPath,
    };
  }

  private async detectProjectProfile(projectRoot: string): Promise<DetectedProjectProfile> {
    const stack = new Set<string>();
    const languages = new Set<string>();
    let packageManager: DetectedProjectProfile['packageManager'] = 'unknown';
    let projectName = basename(projectRoot);

    if (existsSync(join(projectRoot, 'package.json'))) {
      languages.add('TypeScript/JavaScript');
      stack.add('Node.js application');
      packageManager = existsSync(join(projectRoot, 'pnpm-lock.yaml'))
        ? 'pnpm'
        : existsSync(join(projectRoot, 'yarn.lock'))
          ? 'yarn'
          : 'npm';

      try {
        const pkg = JSON.parse(await readFile(join(projectRoot, 'package.json'), 'utf-8')) as {
          name?: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        if (deps.react) stack.add('React');
        if (deps.next) stack.add('Next.js');
        if (deps.vite) stack.add('Vite');
        if (deps.express) stack.add('Express');
        if (deps.fastify) stack.add('Fastify');
        if (deps.typescript) stack.add('TypeScript');
        if (pkg.name) {
          projectName = pkg.name;
        }
      } catch {
        // Ignore malformed package metadata and continue with inferred defaults.
      }
    }

    if (existsSync(join(projectRoot, 'pyproject.toml')) || existsSync(join(projectRoot, 'requirements.txt'))) {
      languages.add('Python');
      stack.add('Python service');
      if (packageManager === 'unknown') packageManager = 'pip';
    }

    if (existsSync(join(projectRoot, 'go.mod'))) {
      languages.add('Go');
      stack.add('Go service');
    }

    if (existsSync(join(projectRoot, 'Cargo.toml'))) {
      languages.add('Rust');
      stack.add('Rust application');
    }

    if (existsSync(join(projectRoot, 'Dockerfile'))) {
      stack.add('Containerized runtime');
    }

    return {
      name: projectName,
      packageManager,
      stack: stack.size ? [...stack] : ['Project'],
      languages: languages.size ? [...languages] : ['Unknown'],
      commands: this.defaultCommands(packageManager),
    };
  }

  private defaultCommands(packageManager: DetectedProjectProfile['packageManager']) {
    switch (packageManager) {
      case 'pnpm':
        return { install: 'pnpm install', dev: 'pnpm dev', test: 'pnpm test', lint: 'pnpm lint', build: 'pnpm build' };
      case 'yarn':
        return { install: 'yarn install', dev: 'yarn dev', test: 'yarn test', lint: 'yarn lint', build: 'yarn build' };
      case 'pip':
        return { install: 'pip install -r requirements.txt', dev: 'python -m <module>', test: 'pytest', lint: 'ruff check .', build: 'python -m build' };
      case 'npm':
        return { install: 'npm install', dev: 'npm run dev', test: 'npm test', lint: 'npm run lint', build: 'npm run build' };
      default:
        return { install: '<install command>', dev: '<dev command>', test: '<test command>', lint: '<lint command>', build: '<build command>' };
    }
  }

  private buildManagedDocs(projectRoot: string, profile: DetectedProjectProfile, mode: ClaudeSetupOptions['mode']): ManagedDoc[] {
    const generatedAt = new Date().toISOString();
    const stackSummary = profile.stack.join(', ');
    const languageSummary = profile.languages.join(', ');
    const commandList = [
      ['Install dependencies', profile.commands.install],
      ['Start development', profile.commands.dev],
      ['Run tests', profile.commands.test],
      ['Run lint checks', profile.commands.lint],
      ['Build artifacts', profile.commands.build],
    ];

    const readme = `# ${profile.name}\n\n> Managed Claude Code workspace bootstrap for ${profile.name}. This README is intentionally structured so setup and update workflows can be rerun safely and repeatedly.\n\n## 1. Workspace Purpose\n\n### 1.1 Project Summary\n- **Project name:** ${profile.name}\n- **Primary stack:** ${stackSummary}\n- **Primary languages:** ${languageSummary}\n- **Claude setup lifecycle:** ${mode}\n\n### 1.2 What this bootstrap adds\n- A root \`.claude/\` workspace with rules, skills, templates, agents, hooks, and fingerprints.\n- A \`docs/context/\` tree with nested, durable documentation intended for Claude Code context loading.\n- A repeatable update path so future plugin versions can refresh the managed Claude assets without reconstructing the whole project by hand.\n\n## 2. Claude Code Lifecycle Commands\n\n### 2.1 Setup the workspace\n\`\`\`bash\n/setup --project-root .\n\`\`\`\n\n### 2.2 Update the workspace after plugin changes\n\`\`\`bash\n/update --project-root .\n\`\`\`\n\n### 2.3 Development commands\n${commandList.map(([label, command]) => `- **${label}:** \`${command}\``).join('\n')}\n\n## 3. Repository Layout\n\n\`\`\`text\n.\n├── CLAUDE.md\n├── README.md\n├── .claude/\n│   ├── rules/\n│   ├── skills/\n│   ├── templates/\n│   ├── agents/\n│   ├── hooks/\n│   └── fingerprint.json\n└── docs/context/\n    ├── project.md\n    ├── architecture.md\n    ├── testing-strategy.md\n    ├── plan.md\n    └── decisions/\n\`\`\`\n\n## 4. Operating Notes\n\n### 4.1 Re-running setup/update\nRun the Claude setup command any time the plugin changes. Managed files are regenerated, fingerprinted, and documented so the installed project stays aligned with the latest plugin structure.\n\n### 4.2 Nested repositories under \`.claude/\`\nIf this project stores cloned or vendored repositories inside the root \`.claude/\` tree, the setup/update workflow ensures those repositories also get a local \`.claude/\` directory.\n\n### 4.3 LSP bootstrapping\nThe setup/update workflow attempts to install LSP packages appropriate for the detected stack so Claude Code can lean on language-aware tooling where possible.\n`;

    const claudeMd = `# ${profile.name} Claude Operating Manual\n\n## 1. Project Identity\n\n### 1.1 Summary\nThis repository is currently identified as **${stackSummary}** with primary languages **${languageSummary}**.\n\n### 1.2 Working agreement\n1. Read \`docs/context/project.md\` before broad changes.\n2. Read \`docs/context/architecture.md\` before structural refactors.\n3. Read \`.claude/rules/coding.md\`, \`.claude/rules/testing.md\`, and \`.claude/rules/security.md\` before making code changes.\n4. Re-run \`/update --project-root .\` after plugin updates to keep this workspace synchronized.\n\n## 2. Reference Documents\n\n### 2.1 Rules\n- @.claude/rules/coding.md\n- @.claude/rules/testing.md\n- @.claude/rules/security.md\n- @.claude/rules/infra.md\n- @.claude/rules/review.md\n- @.claude/rules/product.md\n\n### 2.2 Context\n- @docs/context/project.md\n- @docs/context/project-overview.md\n- @docs/context/architecture.md\n- @docs/context/data-model.md\n- @docs/context/api-contracts.md\n- @docs/context/testing-strategy.md\n- @docs/context/plan.md\n- @.claude/lessons-learned.md\n\n### 2.3 Skills, templates, and agents\n- @.claude/skills/code-review/SKILL.md\n- @.claude/skills/release-notes/SKILL.md\n- @.claude/skills/migration-planner/SKILL.md\n- @.claude/skills/bug-triage/SKILL.md\n- @.claude/templates/pr-description.md\n- @.claude/agents/backend-architect.md\n- @.claude/agents/frontend-specialist.md\n- @.claude/agents/infra-guardian.md\n- @.claude/agents/qa-analyst.md\n\n## 3. Read-When Triggers\n\n### 3.1 Planning\nRead @docs/context/vision-and-roadmap.md and @docs/context/personas-and-use-cases.md when evaluating priorities or suggesting scope changes.\n\n### 3.2 Architecture\nRead @docs/context/architecture-runtime.md, @docs/context/architecture-deployment.md, and @docs/context/constraints.md when changing boundaries, deployment, or integrations.\n\n### 3.3 Delivery\nRead @docs/context/testing-strategy.md, @docs/context/test-inventory.md, and @docs/context/ops-and-runbooks.md when preparing releases or validating risky changes.\n\n## 4. Fingerprinted Sync Metadata\n- **Generated at:** ${generatedAt}\n- **Managed root:** \`${projectRoot}\`\n- **Sync command:** \`/update --project-root .\`\n- **Fingerprint file:** @.claude/fingerprint.json\n`;

    const rules = {
      'coding.md': `# Coding Rules\n\n## 1. Style\n### 1.1 Naming\n- Prefer descriptive names over abbreviations.\n- Preserve existing framework conventions before introducing new ones.\n\n### 1.2 File layout\n- Keep modules cohesive and document non-obvious boundaries.\n- Place tests close to the relevant runtime conventions for this repository.\n\n## 2. Change hygiene\n- Make small, reviewable commits.\n- Update context docs when the architecture or workflows materially change.\n`,
      'testing.md': `# Testing Rules\n\n## 1. Expectations\n- Add or update automated tests for behavior changes.\n- Run the narrowest useful test command first, then broader checks as confidence grows.\n\n## 2. Documentation\n- Record important validation steps in docs/context/testing-strategy.md.\n- Add new suites to docs/context/test-inventory.md when they become part of the standard workflow.\n`,
      'security.md': `# Security Rules\n\n## 1. Data handling\n- Do not commit secrets.\n- Prefer environment variables or secret managers for credentials.\n\n## 2. Review focus\n- Document auth, authorization, and data exposure changes in docs/context/security-rules.md.\n- Flag tenant, privacy, and retention implications before merging risky changes.\n`,
      'infra.md': `# Infrastructure Rules\n\n## 1. Delivery expectations\n- Document environment-level behavior in docs/context/architecture-deployment.md.\n- Capture rollout or migration requirements in docs/context/ops-and-runbooks.md and docs/context/data-migrations.md.\n`,
      'review.md': `# Review Checklist\n\n## 1. Code review\n- Confirm tests match the change scope.\n- Confirm docs and operational notes are updated for behavior changes.\n- Confirm the fingerprinted Claude workspace still reflects current structure.\n`,
      'product.md': `# Product Guardrails\n\n## 1. User impact\n- Protect critical user journeys described in docs/context/personas-and-use-cases.md.\n- Reflect major product intent changes in docs/context/vision-and-roadmap.md before implementation.\n`,
    };

    const sharedDocs: Record<string, string> = {
      'CLAUDE.local.md': '# Local Claude Overrides\n\nAdd user-specific notes here. This file is intended to be gitignored when appropriate.\n',
      'lessons-learned.md': '# Lessons Learned\n\n## 1. Recent insights\n- Record what changed, why it mattered, and what to repeat or avoid next time.\n\n## 2. Follow-up prompts\n- What should be automated next?\n- Which docs need pruning or expansion?\n',
      'templates/pr-description.md': '# PR Description Template\n\n## Summary\n-\n\n## Testing\n-\n\n## Risks\n-\n',
      'templates/design-doc.md': '# Design Doc Template\n\n## Problem\n\n## Context\n\n## Proposal\n\n## Risks\n\n## Rollout\n',
      'templates/test-plan.md': '# Test Plan Template\n\n## Scope\n\n## Scenarios\n\n## Tooling\n\n## Exit Criteria\n',
      'templates/incident-report.md': '# Incident Report Template\n\n## Summary\n\n## Timeline\n\n## Root Cause\n\n## Corrective Actions\n',
      'agents/backend-architect.md': '# Backend Architect\n\nPrioritize correctness, operability, and evolutionary design.\n',
      'agents/frontend-specialist.md': '# Frontend Specialist\n\nPrioritize clarity, accessibility, and coherent UI flows.\n',
      'agents/infra-guardian.md': '# Infra Guardian\n\nPrioritize safe rollouts, reversibility, and environment consistency.\n',
      'agents/qa-analyst.md': '# QA Analyst\n\nPrioritize scenario coverage, regressions, and release confidence.\n',
      'hooks/post-refactor/run-tests.yaml': 'name: run-tests\nsteps:\n  - description: Run the most relevant automated test commands for the touched areas.\n',
      'hooks/post-refactor/update-docs.yaml': 'name: update-docs\nsteps:\n  - description: Refresh CLAUDE.md, README.md, and docs/context files when behavior changes.\n',
      'hooks/pre-merge/sanity-checks.yaml': 'name: sanity-checks\nsteps:\n  - description: Confirm tests, linting, docs, and release notes are complete before merge.\n',
      'skills/code-review/SKILL.md': '# Code Review Skill\n\n## Purpose\nPerform structured reviews using the local checklist and template files.\n\n## Steps\n1. Read checklist.md.\n2. Inspect changed code and tests.\n3. Draft review notes with template.md.\n',
      'skills/code-review/checklist.md': '# Code Review Checklist\n\n- Correctness\n- Testing\n- Documentation\n- Operability\n',
      'skills/code-review/template.md': '# Review Template\n\n## Findings\n\n## Follow-up\n',
      'skills/code-review/examples.md': '# Review Examples\n\n- Example: API contract drift caught before merge.\n',
      'skills/release-notes/SKILL.md': '# Release Notes Skill\n\n## Purpose\nTurn diffs and merged work into release-ready notes.\n',
      'skills/release-notes/template.md': '# Release Notes Template\n\n## Added\n\n## Changed\n\n## Fixed\n',
      'skills/release-notes/examples.md': '# Release Notes Examples\n\n- Added repeatable Claude workspace sync commands.\n',
      'skills/migration-planner/SKILL.md': '# Migration Planner Skill\n\n## Purpose\nPlan safe data or API migrations with rollback awareness.\n',
      'skills/migration-planner/playbook.md': '# Migration Playbook\n\n1. Define current state.\n2. Define target state.\n3. Plan rollout, verification, and rollback.\n',
      'skills/bug-triage/SKILL.md': '# Bug Triage Skill\n\n## Purpose\nCategorize incoming defects and propose reproducible next actions.\n',
      'skills/bug-triage/heuristics.md': '# Bug Triage Heuristics\n\n- Severity\n- Frequency\n- Blast radius\n- Reproducibility\n',
    };

    const contextDocs: Record<string, string> = {
      'project.md': `# Project\n\n## 1. Snapshot\n- **Name:** ${profile.name}\n- **Stack:** ${stackSummary}\n- **Languages:** ${languageSummary}\n\n## 2. Current priorities\n- Keep this file updated with the latest working understanding of the project.\n`,
      'project-overview.md': '# Project Overview\n\n## Goals\n\n## Non-goals\n\n## Stakeholders\n',
      'vision-and-roadmap.md': '# Vision and Roadmap\n\n## Near-term\n\n## Mid-term\n\n## Long-term\n',
      'domain-glossary.md': '# Domain Glossary\n\n## Terms\n\n## Invariants\n',
      'personas-and-use-cases.md': '# Personas and Use Cases\n\n## Personas\n\n## Core use cases\n',
      'architecture.md': '# Architecture\n\n## System view\n\n## Boundaries\n\n## Critical decisions\n',
      'architecture-runtime.md': '# Architecture Runtime\n\n## Runtime flows\n\n## Background work\n\n## External services\n',
      'architecture-deployment.md': '# Architecture Deployment\n\n## Environments\n\n## Release flow\n\n## Scaling assumptions\n',
      'data-model.md': '# Data Model\n\n## Entities\n\n## Relationships\n\n## Invariants\n',
      'data-migrations.md': '# Data Migrations\n\n## Safe migration patterns\n\n## Rollback strategy\n',
      'api-contracts.md': '# API Contracts\n\n## Endpoints\n\n## Inputs and outputs\n\n## Versioning\n',
      'api-guidelines.md': '# API Guidelines\n\n## Error handling\n\n## Auth\n\n## Pagination and idempotency\n',
      'ux-flows.md': '# UX Flows\n\n## Primary flows\n\n## Exceptions\n',
      'ux-principles.md': '# UX Principles\n\n## Interaction rules\n\n## Accessibility expectations\n',
      'security-rules.md': '# Security Rules\n\n## Auth\n\n## Data classification\n\n## Logging and monitoring\n',
      'compliance.md': '# Compliance\n\n## Applicable obligations\n\n## Retention\n\n## Audit notes\n',
      'testing-strategy.md': '# Testing Strategy\n\n## Layers\n\n## Required checks\n\n## Ownership\n',
      'test-inventory.md': '# Test Inventory\n\n## Suites\n\n## Commands\n',
      'constraints.md': '# Constraints\n\n## Technical\n\n## Product\n\n## Operational\n',
      'performance.md': '# Performance\n\n## Budgets\n\n## Hotspots\n\n## Benchmarks\n',
      'ops-and-runbooks.md': '# Ops and Runbooks\n\n## Common tasks\n\n## Incident checklist\n\n## Recovery notes\n',
      'changelog.md': '# Changelog\n\n## Managed Claude workspace changes\n- Initial fingerprinted structure generated by the setup/update workflow.\n',
      'plan.md': '# Plan\n\n## Active work\n\n## Risks\n\n## Questions\n',
      'decisions/adr-0001-claude-workspace-bootstrap.md': '# ADR-0001 Claude Workspace Bootstrap\n\n## Status\nAccepted\n\n## Context\nWe need a repeatable Claude workspace scaffold that can be re-applied after plugin updates.\n\n## Decision\nUse a fingerprinted set of managed markdown and configuration files.\n\n## Consequences\nWorkspace sync becomes deterministic and easier to maintain.\n',
    };

    const docs: ManagedDoc[] = [
      { path: 'README.md', content: readme },
      { path: 'CLAUDE.md', content: claudeMd },
    ];

    for (const [name, content] of Object.entries(rules)) {
      docs.push({ path: join('.claude', 'rules', name), content });
    }

    for (const [name, content] of Object.entries(sharedDocs)) {
      docs.push({ path: join('.claude', name), content });
    }

    for (const [name, content] of Object.entries(contextDocs)) {
      docs.push({ path: join('docs', 'context', name), content });
    }

    docs.push({
      path: join('.claude', '.gitignore'),
      content: 'CLAUDE.local.md\n',
    });

    return docs;
  }

  private buildNestedRepositoryDocs(
    rootProject: string,
    repositoryPath: string,
    profile: DetectedProjectProfile,
    mode: ClaudeSetupOptions['mode']
  ): ManagedDoc[] {
    const relativeRepositoryPath = relative(rootProject, repositoryPath) || '.';
    return [
      {
        path: join('.claude', 'README.md'),
        content: `# Nested Repository Claude Workspace\n\n## Repository\n- **Path:** ${relativeRepositoryPath}\n- **Detected stack:** ${profile.stack.join(', ')}\n- **Sync mode:** ${mode}\n\n## Expectations\n- This repository was discovered under the root .claude tree and receives a local .claude directory so Claude Code can reason about it independently.\n- Re-run the parent /update command whenever the plugin changes or this nested repository layout shifts.\n`,
      },
      {
        path: join('.claude', 'CLAUDE.md'),
        content: `# Nested Repository Guide\n\nRead the parent repository guidance first, then use this folder for nested-repository-specific notes.\n`,
      },
    ];
  }

  private async writeManagedFile(
    root: string,
    doc: ManagedDoc,
    updatedFiles: string[],
    options: ManagedWriteOptions,
    relativeTo = root
  ): Promise<void> {
    const fullPath = join(root, doc.path);
    const fileExists = await this.pathExists(fullPath);

    if (fileExists && this.shouldPreserveExistingRootFile(root, doc.path) && !options.force) {
      options.warnings.push(
        `Skipped overwriting existing ${doc.path}; rerun with --force to replace the managed template.`
      );
      return;
    }

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, doc.content, 'utf-8');
    updatedFiles.push(relative(relativeTo, fullPath));
  }

  private shouldPreserveExistingRootFile(root: string, docPath: string): boolean {
    return root === dirname(join(root, docPath)) && (docPath === 'README.md' || docPath === 'CLAUDE.md');
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async findNestedRepositories(projectRoot: string): Promise<string[]> {
    const claudeRoot = join(projectRoot, '.claude');
    if (!existsSync(claudeRoot)) {
      return [];
    }

    const discovered = new Set<string>();
    await this.walkForRepositories(claudeRoot, discovered);
    discovered.delete(projectRoot);

    return [...discovered].sort();
  }

  private async walkForRepositories(currentPath: string, discovered: Set<string>): Promise<void> {
    let entries: Array<{ name: string; isDirectory(): boolean }> = [];
    try {
      entries = await readdir(currentPath, { withFileTypes: true }) as Array<{ name: string; isDirectory(): boolean }>;
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const fullPath = join(currentPath, entry.name);
      if (entry.name === '.claude') {
        continue;
      }

      if (this.isRepositoryCandidate(fullPath, entry.name)) {
        discovered.add(fullPath);
      }

      await this.walkForRepositories(fullPath, discovered);
    }
  }

  private isRepositoryCandidate(directoryPath: string, directoryName: string): boolean {
    if (directoryName.toLowerCase().includes('repository') || directoryName.toLowerCase().includes('repo')) {
      return true;
    }

    const markers = ['.git', 'package.json', 'pyproject.toml', 'go.mod', 'Cargo.toml'];
    for (const marker of markers) {
      if (existsSync(join(directoryPath, marker))) {
        return true;
      }
    }

    return false;
  }

  private async installRequiredLsps(projectRoot: string, profile: DetectedProjectProfile): Promise<{ installed: string[]; warnings: string[] }> {
    const installed: string[] = [];
    const warnings: string[] = [];

    if (!existsSync(join(projectRoot, 'package.json'))) {
      return { installed, warnings };
    }

    const packages = new Set<string>();
    if (profile.languages.includes('TypeScript/JavaScript')) {
      packages.add('typescript');
      packages.add('typescript-language-server');
      packages.add('vscode-langservers-extracted');
      packages.add('yaml-language-server');
    }

    if (!packages.size) {
      return { installed, warnings };
    }

    const argsPrefix = profile.packageManager === 'pnpm'
      ? ['add', '-D']
      : profile.packageManager === 'yarn'
        ? ['add', '-D']
        : ['install', '--save-dev'];
    const command = profile.packageManager === 'pnpm'
      ? 'pnpm'
      : profile.packageManager === 'yarn'
        ? 'yarn'
        : 'npm';

    try {
      await execFileAsync(command, [...argsPrefix, ...packages], { cwd: projectRoot });
      installed.push(...packages);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Unable to install LSP packages automatically: ${message}`);
    }

    return { installed, warnings };
  }

  private async writeFingerprint(
    projectRoot: string,
    payload: {
      mode: ClaudeSetupOptions['mode'];
      updatedFiles: string[];
      nestedRepositories: string[];
      installedLsps: string[];
      profile: DetectedProjectProfile;
    }
  ): Promise<string> {
    const fingerprintPath = join(projectRoot, '.claude', 'fingerprint.json');
    const fingerprint = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      mode: payload.mode,
      project: payload.profile.name,
      stack: payload.profile.stack,
      languages: payload.profile.languages,
      nestedRepositories: payload.nestedRepositories,
      installedLsps: payload.installedLsps,
      managedFiles: payload.updatedFiles,
      hash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
    };

    await mkdir(dirname(fingerprintPath), { recursive: true });
    await writeFile(fingerprintPath, JSON.stringify(fingerprint, null, 2) + '\n', 'utf-8');
    return fingerprintPath;
  }
}

export function createClaudeSetupManager(): ClaudeSetupManager {
  return new ClaudeSetupManager();
}
