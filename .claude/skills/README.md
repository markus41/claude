# Skill System

Skills are reusable procedure definitions that tell Claude how to approach a class of
task. A skill is not an agent — it does not have its own conversation thread. Instead,
it activates inline, providing a structured approach, code patterns, and tool
permissions for the current context.

## Why skills exist

Without skills, Claude re-invents approaches to common tasks from scratch each session.
Skills provide codified best practices: the `extended-thinking` skill defines API
configuration for thinking budgets; the `jira-branch` skill defines the exact branch
naming convention and API calls for creating branches from Jira tickets. Skills make
behavior consistent and auditable.

## Skill file format

Every skill is a `SKILL.md` file inside a named directory:

```
skills/
└── skill-name/
    └── SKILL.md
```

The SKILL.md file uses YAML frontmatter followed by the procedure body:

```yaml
---
name: skill-name
description: What this skill does and when to use it
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
triggers:
  - keyword one
  - keyword two
  - phrase that activates this skill
dependencies:
  - other-skill-name
---

# Skill Title

Detailed procedure, code examples, API references, and constraints...
```

The `triggers` list is indexed in the registry's quickLookup table. When you type a
matching keyword in a request, the registry routes to this skill automatically.

## Skills by domain

### Reasoning and analysis (5 skills)

| Skill | Key triggers | Purpose |
|-------|--------------|---------|
| `extended-thinking` | ultrathink, think harder, reasoning | Extended thinking API config, budget recommendations, multi-turn tool use with thinking blocks |
| `complex-reasoning` | complex problem, multi-step, deliberate | Structured reasoning patterns for problems with many interdependencies |
| `deep-analysis` | deep analysis, analyze deeply, careful analysis | Analytical templates for codebase and architecture review |
| `deep-research` | deep research, investigate thoroughly | Multi-source research methodology using MCP tools |
| `debugging` | debug, troubleshoot, trace the issue | Systematic debugging: reproduce → isolate → hypothesize → fix → verify |

### Infrastructure (7 skills)

| Skill | Key triggers | Purpose |
|-------|--------------|---------|
| `kubernetes` | k8s, kubernetes, kubectl | Manifests, deployments, services, RBAC, resource optimization |
| `docker-build` | docker build, dockerfile, container | Multi-stage builds, tagging conventions, registry push patterns |
| `helm-deploy` | helm, helm chart, helm upgrade | Chart development, values overrides, atomic deploys, rollback |
| `k8s-image-audit` | image audit, stale image, pull policy | Detect IfNotPresent + mutable tag misconfigurations |
| `terraform` | terraform, infra as code, tf plan | Terraform modules, state management, plan/apply workflow |
| `aws` | aws, S3, EKS, Lambda, IAM | AWS service patterns, IAM least-privilege, CDK/Terraform |
| `gcp` | gcp, google cloud, GKE, Cloud Run | GCP service patterns, service accounts, Artifact Registry |

### Development (20 skills)

| Skill | Key triggers | Purpose |
|-------|--------------|---------|
| `fastapi` | fastapi, python api | FastAPI routers, Pydantic models, dependency injection, async patterns |
| `flask-api` | flask, flask api | Flask blueprints, request handling, error handlers |
| `react` | react, react component | Component patterns, hooks, state management, performance |
| `nextjs` | nextjs, next.js, app router | App Router, RSC, server actions, API routes |
| `graphql` | graphql, gql, schema | Schema design, resolvers, subscriptions, DataLoader |
| `rest-api` | rest api, REST endpoint | OpenAPI spec, versioning, error response conventions |
| `database` | database, SQL, migrations | Schema design, migrations, query optimization, transactions |
| `redis` | redis, cache, pub/sub | Caching patterns, TTL strategy, pub/sub, Redis Streams |
| `vector-db` | vector db, embeddings, semantic search | Vector storage, embedding pipelines, similarity search |
| `git-workflows` | git workflow, branching strategy | Branch naming, commit conventions, rebase vs merge |
| `testing` | write tests, test coverage, unit test | Test structure, mocking, assertions, coverage targets |
| `authentication` | auth, JWT, OAuth, login | JWT patterns, OAuth2 flows, session management, MFA |
| `llm-integration` | llm, anthropic api, openai | API client patterns, prompt engineering, streaming, error handling |
| `streaming` | streaming, server-sent events, SSE | SSE patterns, backpressure, chunked responses |
| `batch-processing` | batch, bulk operations, queue | Queue patterns, retry logic, idempotency, progress tracking |
| `prompt-caching` | prompt cache, cache tokens | Anthropic prompt caching API, cache breakpoints, cost optimization |
| `citations-retrieval` | citations, sources, references | Citation extraction, source attribution, retrieval patterns |
| `vision-multimodal` | vision, image analysis, multimodal | Image inputs, base64 encoding, vision model selection |
| `tool-use` | tool use, function calling, tools | Tool definition schemas, result handling, parallel tool calls |
| `web-research` | web research, search, scrape | Research workflow: Perplexity for knowledge, Firecrawl for pages |

### Jira and project management (14 skills)

These skills implement a complete Jira-integrated development workflow. Each step
in the workflow has its own skill so they can be composed independently.

| Skill | Purpose |
|-------|---------|
| `jira` | Core Jira API: issues, sprints, boards, JQL, bulk operations |
| `jira-work` | Start working on a ticket: assign, move to In Progress, link branch |
| `jira-branch` | Create a git branch named from a Jira ticket key and summary |
| `jira-commit` | Write a commit message that includes the Jira ticket reference |
| `jira-pr` | Open a pull request linked to the Jira ticket |
| `jira-prepare` | Prepare a ticket for development: acceptance criteria, tech notes |
| `jira-review` | Review code against a ticket's acceptance criteria |
| `jira-status` | Report sprint status, ticket progress, and blockers |
| `jira-sync` | Sync git activity (commits, branches, PRs) back to Jira tickets |
| `jira-triage` | Triage incoming issues: prioritize, label, assign, estimate |
| `confluence` | Confluence page creation, space management, content templates |
| `atlassian-api` | Low-level Atlassian REST API patterns shared across Jira/Confluence |
| `scrum` | Scrum ceremonies: sprint planning, standups, retrospectives |
| `kanban` | Kanban board management, WIP limits, flow metrics |

### Domain specific (9 skills)

| Skill | Key triggers | Purpose |
|-------|--------------|---------|
| `design-system` | design system, component library, tokens | Design token management, component variants, theming |
| `member-management` | membership, member, directory | Member CRUD, role assignment, directory queries |
| `multi-tenant` | multi-tenant, tenant isolation, SaaS | Tenant provisioning, data isolation patterns, row-level security |
| `mongodb-atlas` | mongodb, Atlas, mongoose | Schema design, indexes, aggregation pipelines, Atlas Search |
| `stripe-payments` | stripe, payment, subscription | Stripe Checkout, webhooks, subscription lifecycle, idempotency |
| `keycloak` | keycloak, SSO, realm | Realm configuration, client setup, mapper definitions, themes |
| `scrape-docs` | scrape docs, fetch docs, documentation | Firecrawl-based documentation fetching and extraction |
| `web-research` | research, look up, find information | Perplexity + Firecrawl research workflow |

## How skills are activated

1. You write a request containing a trigger keyword (e.g., "ultrathink this problem")
2. The registry's quickLookup table maps the keyword to the skill path
3. Claude loads the SKILL.md and uses its `allowed-tools` and procedure as the
   framework for the response
4. If the skill has `dependencies`, those skills are also consulted

Skills can also be referenced explicitly: "use the jira-branch skill to create a
branch for GA-1234."

## Common gotchas

- Trigger matching is keyword-based, not semantic. If a trigger does not fire, try
  the exact keyword from the SKILL.md frontmatter.
- `allowed-tools` in a skill takes effect for that skill's execution context. It does
  not restrict other agents or the main conversation.
- Skills with `dependencies` do not automatically chain — Claude reads both SKILL.md
  files but decides how to combine them based on context.

## See also

- [../README.md](../README.md) — Platform overview
- [../agents/README.md](../agents/README.md) — Agents that skills activate
- [../rules/README.md](../rules/README.md) — Rules that constrain skill behavior
