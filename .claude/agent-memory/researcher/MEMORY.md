# Claude Code Cowork & Marketplace Research

## Research Date
2026-02-28

## Key Findings Summary

### 1. Claude Code Cowork Feature (2026 Release)
- **Definition**: An enterprise collaboration platform extending Claude Code (2025) to non-programming knowledge work
- **Model**: Agentic architecture where Claude analyzes tasks, breaks into subtasks, executes work in VM, coordinates parallel workstreams
- **Key Difference from Claude Code**: Cowork is "Claude Code for the rest of your work" — applies agent autonomy to office/enterprise work, not just programming
- **Session Model**: Persistent workspace with task execution capability; desktop app must stay open during session
- **Collaboration Limitation**: No built-in session sharing or real-time collaboration — current research preview limitation

### 2. Enterprise Plugin Marketplace (Feb 2026 Update)
Anthropic announced major Cowork updates including **private plugin marketplaces** for enterprises:

**Core Features:**
- Private org-specific plugin marketplaces (control what teams access)
- Admin-managed distribution with per-user provisioning
- Auto-install capabilities for teams
- Pre-built templates: HR, Design, Engineering, Operations, Finance, Investment Banking
- Support for private GitHub repos as plugin sources (beta)
- OpenTelemetry support: track usage, costs, tool activity across teams

**Multi-app Workflows:**
- Orchestrate across Excel, PowerPoint, other apps
- Pass context between applications
- Structured slash commands launch with forms (feels like filling out brief form)

### 3. What Gets Shared in Cowork Marketplace

From codebase analysis (marketplace-pro plugin), the marketplace distributes:

**Discrete Artifacts:**
1. **Skills** — Domain knowledge packaged as reusable components (subdirs with SKILL.md)
2. **Agents** — Specialized autonomous agents (team-specific roles, .md files)
3. **Commands** — Slash commands (structured workflows, form-based)
4. **Workflows** — Multi-step automation (coordination across services)
5. **Templates** — Pre-built composites for roles/departments

**Metadata Included:**
- Version (semver)
- Author/org
- Description & keywords
- Capabilities/features list
- Dependencies (with version constraints: ^, ~, *)
- Trust/security metadata (Sigstore signatures, composite trust scores)

### 4. Discovery & Installation Mechanisms

From marketplace-pro plugin implementation:

**Discovery:**
- **Smart search** over plugin repository with category filtering
- **Quality indicators** (trust grades A-F based on signature, reputation, code analysis, community, freshness)
- **Contextual recommendations** using Apriori mining + cosine similarity
  - Analyzes project fingerprint (features detected in codebase)
  - Mines association rules ("projects with {kubernetes, helm} usually need {ci-cd}")
  - Finds gaps and ranks plugins by gap-coverage relevance
- **Project-aware suggestion** — scans your project structure, suggests missing plugins

**Installation:**
- `/plugin-install <name>` — from registry or Git
- Registry tracks installed plugins + available plugins
- Dependency resolution: topological sort, version constraint checking
- Post-install hooks for configuration/setup
- Development mode with `--dev` (symlink for rapid iteration)

### 5. Governance & Trust Model

**Marketplace-Pro Trust Scoring Formula:**
```
Overall = 0.25*Signed + 0.20*Reputation + 0.25*CodeAnalysis + 0.15*Community + 0.15*Freshness
Grades: A (90-100), B (80-89), C (60-79), D (40-59), F (0-39)
```

**Enterprise Policy Control:**
- `.claude/policies/plugins.yaml` — trust thresholds, allowlists/blocklists
- `plugin-lock.json` — pinned versions with integrity checksums (GitOps model)
- Multi-registry federation with priority resolution
- Sigstore signing for supply chain security

**What's NOT Shared:**
- Session artifacts (no session sharing in Cowork)
- Live execution state
- Folder instructions or project-specific configs (stored locally)

### 6. Marketplace Architecture Patterns

**From marketplace-pro plugin (5 core modules):**

1. **Composition Engine** (src/composition/engine.ts)
   - Greedy set cover + Kahn's topological sort
   - Converts natural-language intent → plugin resolution DAG
   - Handles dependency conflicts

2. **Supply Chain Security** (src/security/trust-engine.ts)
   - Sigstore signing verification
   - Composite trust scoring
   - Sandbox policies

3. **Contextual Intelligence** (src/intelligence/fingerprint.ts)
   - Project fingerprinting (extract features from code)
   - Apriori mining (learn feature co-occurrence)
   - Cosine similarity matching

4. **Dev Studio** (src/devstudio/server.ts)
   - Hot-reload server for plugin development
   - Live validation & testing
   - Build tools

5. **Federation** (src/federation/registry.ts)
   - Multi-registry support (priority-based resolution)
   - GitOps lockfile model
   - Policy enforcement across registries

### 7. Plugin Manifest Structure

Standard plugin.json includes:
```json
{
  "name", "version", "description", "author", "license",
  "keywords", "categories",
  "repository": { "type", "url" },
  "commands": { "/cmd": { "description", "handler", "allowedTools", "argumentHint" } },
  "agents": { "agent-name": { "description", "model", "handler", "capabilities" } },
  "skills": { "skill-name": { "description", "handler" } },
  "hooks": { "hook-name": { "event", "toolPattern", "filePattern", "handler" } },
  "dependencies": { "plugin-name": "^version" },
  "configuration": { "localConfig", "requiredEnvVars", "optionalEnvVars" },
  "postInstall": { "script", "description" }
}
```

## Best Practices for Cowork Marketplace

1. **Composability First** — Design skills/agents to work independently and combine
2. **Trust Transparency** — Use Sigstore signing, maintain fresh metadata
3. **Contextual Design** — Build skills that understand project context (via fingerprinting)
4. **Graceful Degradation** — Handle missing dependencies or unavailable registries
5. **Hot-Reload UX** — Support development mode for fast iteration
6. **Policy Enforcement** — Allow orgs to lock versions and manage risk
7. **Multi-Source Support** — Support registry, Git, and private repos
8. **Clear Metadata** — Consistent keywords, categories, capability descriptors for discovery

## Relation to This Project

**marketplace-pro plugin** is a reference implementation of enterprise marketplace concepts:
- Located: `/home/user/claude/plugins/marketplace-pro/`
- Provides: composition, security, intelligence, dev tools, federation
- Commands: `/mp:*` family (setup, compose, recommend, trust, verify, etc.)
- Agent: marketplace-advisor (guidance on selection & algorithms)
- Skills: 5 modules with specialized knowledge

This project includes a full plugin registry system with versioning, dependency resolution, and validation (see `.claude/PLUGIN_SYSTEM.md`).
