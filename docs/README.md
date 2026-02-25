# Documentation Hub

This directory contains project-level documentation for the Golden Armada multi-agent orchestration system. Source-code docs live alongside the code they describe; this directory is for architecture decisions, security reviews, planning artifacts, and cross-cutting reference material.

See `docs/INDEX.md` for the full annotated index with per-audience navigation guides.

## Directory structure

```
docs/
├── architecture/   System design reviews and improvement roadmaps
├── cli/            CLI command reference
├── governance/     Control and compliance matrix
├── hooks/          Hook authoring guidance
├── integration/    Agent integration patterns, risk matrix, consolidation checklists
├── planning/       MANTLE project planning documents and resource allocation
├── plugins/        Plugin routing strategy
├── reference/      Plugin dependency analysis, tool-use guides, quick references
├── security/       Security implementation guide, review reports, quick reference
└── testing/        Test strategy, implementation guides, execution references
```

## Quick links by topic

### Architecture
| Document | When to read it |
|----------|----------------|
| [architecture/ARCHITECTURE_QUALITY_REVIEW.md](architecture/ARCHITECTURE_QUALITY_REVIEW.md) | Understand current architecture strengths and gaps |
| [architecture/ARCHITECTURE_IMPROVEMENT_ROADMAP.md](architecture/ARCHITECTURE_IMPROVEMENT_ROADMAP.md) | Planned architectural changes and rationale |

### Security
| Document | When to read it |
|----------|----------------|
| [security/SECURITY_IMPLEMENTATION_GUIDE.md](security/SECURITY_IMPLEMENTATION_GUIDE.md) | Implementing any security-sensitive feature |
| [security/SECURITY_QUICK_REFERENCE.md](security/SECURITY_QUICK_REFERENCE.md) | Day-to-day development security checklist |
| [security/SECURITY_REVIEW_REPORT.md](security/SECURITY_REVIEW_REPORT.md) | Full audit findings and remediation status |
| [security/SECURITY_REVIEW_EXECUTIVE_SUMMARY.md](security/SECURITY_REVIEW_EXECUTIVE_SUMMARY.md) | Executive-level risk overview |

### Testing
| Document | When to read it |
|----------|----------------|
| [testing/TEST_STRATEGY.md](testing/TEST_STRATEGY.md) | Overall testing philosophy and framework choices |
| [testing/TESTING_IMPLEMENTATION_GUIDE.md](testing/TESTING_IMPLEMENTATION_GUIDE.md) | How to write and structure tests |
| [testing/TEST_EXECUTION_QUICK_REFERENCE.md](testing/TEST_EXECUTION_QUICK_REFERENCE.md) | Commands to run specific test suites |

### Planning (MANTLE)
The MANTLE documents describe the full build-out of the 78-agent, 103-command orchestration system.

| Document | When to read it |
|----------|----------------|
| [planning/MANTLE-INDEX.md](planning/MANTLE-INDEX.md) | Start here — navigation hub for all MANTLE docs |
| [planning/MANTLE-DECOMPOSITION-SUMMARY.md](planning/MANTLE-DECOMPOSITION-SUMMARY.md) | High-level scope and deliverables |
| [planning/MANTLE-TASK-BREAKDOWN.md](planning/MANTLE-TASK-BREAKDOWN.md) | Complete task catalog with acceptance criteria |
| [planning/MANTLE-IMPLEMENTATION-TIMELINE.md](planning/MANTLE-IMPLEMENTATION-TIMELINE.md) | Week-by-week execution schedule |
| [planning/MANTLE-RISK-ASSESSMENT.md](planning/MANTLE-RISK-ASSESSMENT.md) | Risk register and mitigations |
| [planning/RESOURCE_ALLOCATION_PLAN.md](planning/RESOURCE_ALLOCATION_PLAN.md) | Resource and budget allocation |

### Integration
| Document | When to read it |
|----------|----------------|
| [integration/agent-integration-summary.md](integration/agent-integration-summary.md) | Agent wiring patterns and integration overview |
| [integration/consolidation-checklist.md](integration/consolidation-checklist.md) | Checklist for consolidating overlapping agents |
| [integration/RISK-MATRIX-SUMMARY.md](integration/RISK-MATRIX-SUMMARY.md) | Integration-level risk matrix |
| [integration/resilience-system-implementation.md](integration/resilience-system-implementation.md) | Fault-tolerance and retry strategies |

### Reference
| Document | When to read it |
|----------|----------------|
| [reference/PLUGIN_DEPENDENCY_ANALYSIS.md](reference/PLUGIN_DEPENDENCY_ANALYSIS.md) | Plugin inter-dependencies and load order |
| [reference/TOOL-USE-COMPREHENSIVE-OUTLINE.md](reference/TOOL-USE-COMPREHENSIVE-OUTLINE.md) | Complete tool-use patterns and best practices |
| [reference/TOOL-USE-SKILL-SUMMARY.md](reference/TOOL-USE-SKILL-SUMMARY.md) | Condensed tool-use skill reference |
| [reference/TEMPLATE-QUICK-START.md](reference/TEMPLATE-QUICK-START.md) | Start from a template — fastest path to a new plugin |
| [reference/integration-quick-reference.md](reference/integration-quick-reference.md) | Integration patterns at a glance |

### Other top-level documents
| Document | Description |
|----------|-------------|
| [INDEX.md](INDEX.md) | Full annotated index with per-role navigation |
| [LESSONS_LEARNED.md](LESSONS_LEARNED.md) | Post-mortems and cross-project lessons |
| [ARCHETYPE_INDEX.md](ARCHETYPE_INDEX.md) | Index of available archetypes |
| [ARCHETYPE_QUICK_REFERENCE.md](ARCHETYPE_QUICK_REFERENCE.md) | Archetype usage quick reference |
| [ARCHETYPE_MIGRATION_GUIDE.md](ARCHETYPE_MIGRATION_GUIDE.md) | Migrating between archetype versions |
| [PILOT_DEPLOYMENT_GUIDE.md](PILOT_DEPLOYMENT_GUIDE.md) | Steps to deploy a pilot instance |
| [COPIER-BRIDGE-IMPLEMENTATION.md](COPIER-BRIDGE-IMPLEMENTATION.md) | Copier/Cookiecutter bridge implementation notes |

## Contributing to documentation

1. Place documents in the appropriate subdirectory.
2. Add an entry to `docs/INDEX.md` with document purpose and intended audience.
3. Include a "Last Updated" date and status (Draft / Review / Final) at the top of each document.
4. Link related documents in a "See also" section.
5. For architectural decisions, prefer an Architecture Decision Record (ADR) format in `architecture/`.
