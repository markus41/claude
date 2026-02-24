---
name: mp:help
intent: Show all available marketplace-pro commands organized by module
tags:
  - marketplace-pro
  - command
  - help
inputs: []
risk: medium
cost: medium
description: Show all available marketplace-pro commands organized by module
allowed-tools: []
---

# Marketplace Pro Help

Displays the complete command reference for the marketplace-pro plugin, organized by functional module.

## Usage
```
/mp:help
```

No arguments. Displays the command listing below.

---

## Output

When `/mp:help` is invoked, display the following:

```
+==========================================================================+
|                                                                          |
|   Marketplace Pro v1.0.0                                                 |
|   Advanced plugin marketplace with composition, security,               |
|   intelligence, dev tools, and federated registries.                     |
|                                                                          |
+==========================================================================+

  SETUP & QUICKSTART
  ------------------
  /mp:setup              Interactive setup wizard (federation, security,
                         intelligence, lockfile)
                         Options: --mode=full|quick|security-only|federation-only

  /mp:quick <action>     Rapid single-purpose actions:
                           scan     Quick project fingerprint + top 3 recs
                           trust    Quick trust score (score + grade)
                           check    Health check (drift, violations, stale)
                           graph    Dependency graph of installed plugins

  /mp:status             Dashboard overview of all subsystems
  /mp:help               Show this help

  COMPOSITION ENGINE
  ------------------
  /mp:compose <intent>   Resolve a natural-language intent into a plugin
                         composition plan using greedy set cover and
                         Kahn's topological sort.
                         Example: /mp:compose "deploy a FastAPI app to EKS
                                   with auth and monitoring"

  SECURITY & TRUST
  ----------------
  /mp:trust <plugin>     Full trust score and security audit for a plugin.
                         Shows composite score (signed, reputation, code
                         analysis, community, freshness), permission gap
                         analysis, and security findings.

  /mp:verify <plugin>    Verify plugin signature and integrity.
                         Options: --sign (sign an unsigned plugin)

  INTELLIGENCE
  ------------
  /mp:recommend          Full project-aware plugin recommendations.
                         Runs project fingerprinting, Apriori association
                         rule mining, and cosine similarity matching.

  DEV STUDIO
  ----------
  /mp:dev <action>       Plugin development tools:
                           start    Start hot-reload dev server
                           stop     Stop dev server
                           test     Run plugin test suite
                           lint     Lint plugin manifest and source
                           build    Build plugin bundle (.cpkg)
                           watch    Watch mode with live validation

  FEDERATION
  ----------
  /mp:registry <action>  Manage federated registries:
                           list     List configured registries
                           add      Add a new registry
                           remove   Remove a registry
                           sync     Sync plugin index from registries
                           test     Test registry connectivity

  /mp:policy <action>    Manage plugin security policies:
                           show     Display current policy
                           edit     Modify policy settings
                           init     Create default policy file
                           audit    Run policy audit on all plugins

  /mp:lock <action>      Manage the plugin lockfile:
                           show     Display lockfile contents
                           sync     Update lockfile to match installed
                           diff     Show drift between lock and actual
                           init     Generate initial lockfile
                           verify   Verify integrity checksums

  AGENTS
  ------
  The marketplace-advisor agent provides interactive guidance:
    - Plugin selection advice
    - Setup troubleshooting
    - Algorithm explanations
    - Architecture questions

  Invoke via: "Ask the marketplace advisor about..."

  ARCHITECTURE
  ------------
  Marketplace Pro is organized into five modules:

  Module                 Entry Point                    Types
  ---------------------  -----------------------------  -----------------------
  Composition Engine     src/composition/engine.ts      src/composition/types.ts
  Supply Chain Security  src/security/trust-engine.ts   src/security/types.ts
  Contextual Intel       src/intelligence/fingerprint.ts src/intelligence/types.ts
  Dev Studio             src/devstudio/server.ts        (in module)
  Federation             src/federation/registry.ts     (in module)

  CONFIGURATION FILES
  -------------------
  File                           Purpose
  -----------------------------  ----------------------------------------
  .claude/registries.json        Federation registry configuration
  .claude/policies/plugins.yaml  Security and trust policies
  plugin-lock.json               Pinned versions and integrity checksums
  .claude-plugin/plugin.json     Plugin manifest (per plugin)

  GETTING STARTED
  ---------------
  1. Run /mp:setup for guided configuration
  2. Run /mp:status to see your dashboard
  3. Run /mp:quick scan to discover plugins for your project

  Documentation: plugins/marketplace-pro/README.md

+==========================================================================+
```
