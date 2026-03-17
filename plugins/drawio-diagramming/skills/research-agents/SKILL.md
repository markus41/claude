---
description: "Research agent configurations for gathering data to build accurate, detailed diagrams"
triggers:
  - diagram research
  - drawio research
  - architecture research
globs:
  - "**/*.drawio"
---

# Research Agents for Diagram Building

When creating diagrams, use specialized research agents (via the Agent tool with
`subagent_type`) to gather accurate data BEFORE generating XML. This produces
far more detailed, accurate diagrams than generating from assumptions.

## Agent Configurations

### 1. Code Architecture Researcher

**Use when**: Creating architecture, sequence, or class diagrams from source code.

```
Agent(
  subagent_type="Explore",
  prompt="""Analyze the codebase to map the architecture for a diagram:
  1. Find all service/module entry points (main files, index files, route handlers)
  2. Map dependencies between modules (imports, API calls, message queues)
  3. Identify data stores (database connections, cache clients, file storage)
  4. Find external service integrations (HTTP clients, SDK usage, webhooks)
  5. Map the request flow for the primary use case

  For each component found, report:
  - Name and type (service, database, queue, cache, external API)
  - File path and line numbers
  - Connections to other components (direction, protocol, data format)
  - Technology stack (framework, language, runtime)

  Output a structured summary I can use to build a draw.io diagram."""
)
```

### 2. Infrastructure Researcher

**Use when**: Creating cloud architecture, Kubernetes, or network diagrams.

```
Agent(
  subagent_type="Explore",
  prompt="""Analyze infrastructure configuration files for a diagram:
  1. Scan for: Dockerfile, docker-compose.yml, k8s manifests (*.yaml in k8s/),
     Terraform (*.tf), Helm charts, CI/CD pipelines, Pulumi files
  2. Map all services, their ports, and network connections
  3. Identify load balancers, ingress controllers, DNS config
  4. Find persistent storage (volumes, PVCs, S3 buckets, databases)
  5. Map environment-specific differences (dev vs staging vs prod)

  For each resource, report:
  - Resource type and name
  - Cloud provider and service (e.g., AWS EC2, Azure AKS)
  - Network connections (ports, protocols, internal/external)
  - Dependencies on other resources
  - Security boundaries (VPCs, subnets, security groups, namespaces)

  Output a structured summary for building an infrastructure diagram."""
)
```

### 3. API Flow Researcher

**Use when**: Creating sequence diagrams or API flow diagrams.

```
Agent(
  subagent_type="Explore",
  prompt="""Trace the API request flow for [specific endpoint/feature]:
  1. Find the route handler/controller
  2. Trace middleware chain (auth, validation, rate limiting)
  3. Follow business logic calls (service layer, repositories)
  4. Map database queries (SQL/NoSQL operations)
  5. Identify async operations (queues, events, webhooks)
  6. Track the response path back to the client

  For each step, report:
  - Actor (which service/component)
  - Action (HTTP call, DB query, queue publish)
  - Data payload (key fields, not full schema)
  - Async vs sync
  - Error handling paths

  Output as a numbered sequence suitable for a sequence diagram."""
)
```

### 4. Web Documentation Researcher

**Use when**: Enriching diagrams with external service details, API specs, or
cloud service information that isn't in the local codebase.

```
Agent(
  subagent_type="researcher",
  prompt="""Research the following external services for diagram enrichment:
  [list services found in codebase]

  For each service, find:
  1. Official architecture diagram or topology
  2. Key endpoints and protocols
  3. Data flow patterns (request/response, streaming, pub/sub)
  4. SLA and performance characteristics
  5. Security boundaries and authentication methods

  Use Firecrawl MCP (firecrawl_search, firecrawl_scrape) for web research.
  Use Context7 MCP for library/framework documentation.

  Output structured data for each service suitable for diagram annotation."""
)
```

### 5. Database Schema Researcher

**Use when**: Creating ER diagrams or data model diagrams.

```
Agent(
  subagent_type="Explore",
  prompt="""Analyze the database schema for an ER diagram:
  1. Find all model/entity definitions (ORM models, migration files, SQL schemas)
  2. Map all tables/collections with their columns/fields
  3. Identify primary keys, foreign keys, and indexes
  4. Map relationships (1:1, 1:N, N:M) with join tables
  5. Find constraints (NOT NULL, UNIQUE, CHECK, DEFAULT)
  6. Identify enum types and their values

  For each entity, report:
  - Table/collection name
  - All columns with types and constraints
  - Primary key and foreign key relationships
  - Indexes
  - Relationship to other entities with cardinality

  Output as a structured summary for building an ER diagram."""
)
```

### 6. Git History Researcher

**Use when**: Understanding what changed for changelog/diff diagrams.

```
Agent(
  subagent_type="Explore",
  prompt="""Analyze recent git history to understand architectural changes:
  1. Review commits in the last [N] days/commits
  2. Identify files that changed together (co-change patterns)
  3. Find new services/modules added
  4. Find removed or deprecated components
  5. Map refactoring patterns (renames, moves, splits)

  Output a summary of architectural evolution for a before/after diagram."""
)
```

## Usage Pattern

The recommended workflow for research-backed diagram creation:

1. **Spawn research agent** — launch the appropriate researcher in background
2. **Continue with context analysis** — read local files while agent runs
3. **Merge findings** — combine agent results with local analysis
4. **Ask user to confirm scope** — present findings and proposed diagram structure
5. **Generate XML** — build diagram from verified, researched data
6. **Run quality critique** — apply the quality-critique skill checklist

This produces diagrams that are accurate representations of the actual system,
not aspirational sketches.

## Speed Optimization

To maximize generation speed:
- Launch research agents with `run_in_background: true`
- Use `model: "haiku"` for fast exploration agents
- Use `model: "sonnet"` for the code architecture researcher
- Run multiple researchers in parallel when building complex multi-page diagrams
- Cache research results in a temp file for reuse across pages
