---
name: drawio:enrich
intent: Enrich and deepen diagrams by analyzing codebases, APIs, and web sources for more granular detail
tags:
  - drawio-diagramming
  - command
  - enrich
inputs: []
risk: medium
cost: high
description: Deep enrichment engine that analyzes code, crawls documentation, and researches APIs to add granular detail to diagrams
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
  - Agent
---

# /drawio:enrich -- Diagram Enrichment Engine

Analyze codebases, scrape documentation, and research APIs to transform sparse diagrams
into richly detailed, production-grade artifacts. Works on existing `.drawio` files or
generates enriched diagrams from scratch by mining source code and the web.

## Usage

```
/drawio:enrich <diagram.drawio> [options]
/drawio:enrich --from-code <source-dir> [--type <diagram-type>] [options]
/drawio:enrich --analyze-gaps <diagram.drawio>
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--level <1-4>` | Enrichment depth (see Enrichment Levels below) | `2` |
| `--sources <dirs...>` | Source directories to analyze | `.` |
| `--type <type>` | Diagram type: `architecture`, `sequence`, `erd`, `class`, `infra`, `c4`, `network`, `pipeline` | auto-detect |
| `--research-apis` | Enable web research for API documentation | `false` |
| `--cloud-details` | Add cloud service limits, pricing, regions | `false` |
| `--pricing` | Include pricing tier annotations | `false` |
| `--trace-dependencies` | Follow import/call chains across files | `false` |
| `--depth <n>` | Max dependency trace depth | `3` |
| `--output <path>` | Output file path | in-place update |
| `--dry-run` | Report what would be enriched without modifying | `false` |
| `--focus <component>` | Enrich only a specific component/service | all |
| `--lang <language>` | Force language detection (ts, py, java, go, rust, csharp) | auto-detect |
| `--git-history` | Include git change-frequency hotspot analysis | `false` |

### Examples

```
/drawio:enrich architecture.drawio --level 3 --sources ./src ./docs
/drawio:enrich --from-code ./src/api --type sequence --research-apis
/drawio:enrich infrastructure.drawio --cloud-details --pricing
/drawio:enrich microservices.drawio --trace-dependencies --depth 3
/drawio:enrich --from-code ./backend --type erd --lang python
/drawio:enrich api-flow.drawio --level 4 --git-history --research-apis
/drawio:enrich --analyze-gaps architecture.drawio
```

## Enrichment Levels

### Level 1 -- Quick (code analysis only, no web)

Add labels, types, and basic metadata discovered from static code analysis.

1. Scan source files for exported symbols (classes, functions, interfaces, types).
2. Match discovered entities to existing diagram cells by name.
3. Add type annotations to labels (e.g., `UserService` becomes `UserService: NestJS Injectable`).
4. Add parameter counts and return types to method labels.
5. Tag cells with `source_file` custom property pointing to the originating file.
6. Estimated time: 30-90 seconds.

### Level 2 -- Standard (full code analysis + dependency tracing)

Everything in Level 1, plus:

1. Trace `import`/`require`/`use` statements to build a complete dependency graph.
2. Add edges for every discovered dependency not already in the diagram.
3. Extract framework-specific metadata:
   - Decorators/annotations (`@Route`, `@Entity`, `@Service`, `@Controller`, `@Injectable`)
   - Middleware chains and guard definitions
   - Database model fields, column types, and relations
4. Parse configuration files for service topology:
   - `docker-compose.yml` -- container names, ports, networks, volumes, depends_on
   - `package.json` / `requirements.txt` / `go.mod` -- dependency trees
   - `.env` / `.env.example` -- environment variable inventory (names only, never values)
5. Detect and annotate design patterns (Singleton, Factory, Observer, Strategy, Repository, Mediator).
6. Add a metadata layer with version numbers from package manifests.
7. Estimated time: 2-5 minutes.

### Level 3 -- Deep (code + web research)

Everything in Level 2, plus:

1. Use `mcp__firecrawl__firecrawl_search` to find API documentation for each external service.
2. Use `mcp__firecrawl__firecrawl_scrape` with JSON format to extract endpoint specs from docs.
3. Use `mcp__firecrawl__firecrawl_map` to discover documentation site structure.
4. Use `mcp__firecrawl__firecrawl_extract` to pull structured schemas from API reference pages.
5. Annotate infrastructure nodes with cloud service details:
   - AWS/Azure/GCP service limits and quotas
   - Pricing tier indicators
   - Region availability markers
6. Scrape OpenAPI/Swagger specs and inject endpoint details into sequence diagram interactions.
7. Research library/framework docs to clarify component relationships and lifecycles.
8. Pull GitHub READMEs for third-party integrations to verify connection semantics.
9. Add tooltip labels with documentation URLs for key components.
10. Estimated time: 5-15 minutes.

### Level 4 -- Exhaustive (everything + historical + cross-repo)

Everything in Level 3, plus:

1. Analyze git history to identify change-frequency hotspots (files changed most often).
2. Color-code diagram cells by churn rate (red = high churn, green = stable).
3. Cross-reference multiple repositories if monorepo or multi-repo architecture detected.
4. Extract performance metrics from CI/CD configs (test durations, build times).
5. Add security annotations from dependency audit (`npm audit`, `pip-audit`, `govulncheck`).
6. Research known CVEs for each dependency and flag vulnerable components.
7. Generate a companion enrichment report documenting all findings.
8. Estimated time: 15-30 minutes.

## Implementation

When this command is invoked, execute the following phases in order.

### Phase 0: Parse Input and Detect Context

```
1. If --from-code is specified:
   a. No existing diagram -- will generate one from scratch after analysis.
   b. Determine diagram type from --type flag or infer from code structure:
      - Controllers/routes found        -> sequence diagram
      - Database models found            -> ER diagram
      - Class hierarchies found          -> class diagram
      - docker-compose/k8s manifests     -> infrastructure diagram
      - Multiple services/packages       -> C4 container diagram
      - CI/CD config files               -> pipeline flowchart

2. If a .drawio file is specified:
   a. Read and parse the XML.
   b. Inventory all existing cells: vertices (components) and edges (connections).
   c. Build a lookup map: cell_id -> label, style, custom_properties.
   d. Identify sparse cells (no metadata, generic labels, missing connections).

3. Detect project language and framework:
   a. Glob for package.json, tsconfig.json, requirements.txt, setup.py, pyproject.toml,
      go.mod, Cargo.toml, *.csproj, pom.xml, build.gradle.
   b. Set language context for framework-specific analysis.
```

### Phase 1: Codebase Analysis

Execute ALL of the following sub-phases. Use Grep and Glob for discovery, Read for
extraction. Prefer parallel searches where possible.

#### 1A: Entity Discovery

```
For TypeScript/JavaScript:
  - Grep for: export (class|interface|type|enum|function|const)
  - Grep for: @Controller, @Injectable, @Service, @Module, @Entity, @Schema
  - Grep for: router\.(get|post|put|delete|patch), app\.(get|post|put|delete|patch)
  - Grep for: createRouter, defineComponent, defineStore

For Python:
  - Grep for: ^class \w+, ^def \w+, ^async def \w+
  - Grep for: @app\.(route|get|post|put|delete), @router\.(get|post|put|delete)
  - Grep for: class \w+\(.*Model\), class \w+\(.*Base\), class \w+\(.*Schema\)
  - Grep for: @celery_app\.task, @dramatiq\.actor

For Java/Kotlin:
  - Grep for: @RestController, @Service, @Repository, @Entity, @Component
  - Grep for: @RequestMapping, @GetMapping, @PostMapping
  - Grep for: public (class|interface|enum|record)

For Go:
  - Grep for: ^func \w+, ^type \w+ struct, ^type \w+ interface
  - Grep for: func.*http\.Handler, func.*gin\.Context, func.*echo\.Context
  - Grep for: func.*grpc\.\w+Server

For Rust:
  - Grep for: ^pub (fn|struct|enum|trait|impl|mod)
  - Grep for: #\[.*route\], #\[.*get\], #\[.*post\]

For C#:
  - Grep for: \[ApiController\], \[HttpGet\], \[HttpPost\], \[Route\]
  - Grep for: public (class|interface|record|struct)
  - Grep for: DbContext, DbSet<
```

#### 1B: Dependency Graph Construction

```
1. For each discovered entity, read its source file.
2. Extract all import/require/use statements.
3. Resolve relative imports to absolute file paths.
4. Build adjacency list: { source_file -> [dependency_files] }.
5. If --trace-dependencies, recursively follow imports up to --depth.
6. Record circular dependencies for annotation.
7. Group entities by directory/module/package for container boundaries.
```

#### 1C: Method Signature Extraction

```
For each class/service entity:
  1. Read the file containing the entity.
  2. Extract all public methods with:
     - Method name
     - Parameters with types (if typed language)
     - Return type
     - Decorators/annotations
     - Async/sync designation
  3. For database models, extract:
     - Field names and types
     - Primary keys and foreign keys
     - Indexes and constraints
     - Relations (hasMany, belongsTo, ManyToOne, etc.)
  4. Store extracted signatures in enrichment context map.
```

#### 1D: Infrastructure Analysis

```
Parse infrastructure-as-code files if present:

Docker:
  - Read Dockerfile(s): base images, exposed ports, build stages, volumes
  - Read docker-compose.yml: services, networks, volumes, environment variables (names only),
    depends_on relationships, port mappings, health checks

Kubernetes:
  - Glob for **/*.yaml, **/*.yml in k8s/, kubernetes/, deploy/, manifests/
  - Extract: Deployments (replicas, images, resource limits), Services (type, ports, selectors),
    Ingress (hosts, paths, TLS), ConfigMaps, Secrets (names only), PVCs,
    HPA (min/max replicas, target CPU), NetworkPolicies

Terraform:
  - Glob for **/*.tf
  - Extract: resource types, module references, variable names, output names
  - Build resource dependency graph from references

Pulumi:
  - Read Pulumi.*.yaml and index.ts / __main__.py
  - Extract: resource declarations, stack references

CI/CD:
  - Read .github/workflows/*.yml: jobs, steps, triggers, environment references
  - Read .gitlab-ci.yml: stages, jobs, artifacts, dependencies
  - Read Jenkinsfile: pipeline stages, agent labels
  - Read azure-pipelines.yml: stages, pools, tasks
```

#### 1E: Design Pattern Detection

```
Scan for common design patterns and annotate matching entities:

Singleton:
  - Private constructor + static getInstance method
  - Module-level instance export

Factory:
  - create* / make* / build* methods returning interface types
  - Abstract factory classes

Observer/Event:
  - EventEmitter usage, on/emit/subscribe patterns
  - Pub/sub channel definitions

Repository:
  - Classes ending in Repository/Repo with CRUD methods
  - Data access layer abstractions

Strategy:
  - Interface with multiple implementations selected at runtime
  - Config-driven behavior switching

Mediator:
  - Central coordinator dispatching to multiple handlers
  - Message bus / command bus patterns

Decorator:
  - Wrapper classes enhancing base functionality
  - Middleware chains

When a pattern is detected, add a <<pattern>> stereotype annotation to the cell:
  e.g., "UserRepository <<Repository>>" or "NotificationService <<Observer>>"
```

### Phase 2: Web Research Enrichment (Level 3+)

Only execute this phase if `--level` is 3 or 4, or if `--research-apis` / `--cloud-details`
flags are set.

#### 2A: API Documentation Research

```
For each external service/API referenced in the codebase:

1. Identify external services from:
   - HTTP client calls (axios, fetch, requests, http.Client)
   - SDK imports (aws-sdk, @azure/*, google-cloud/*)
   - API base URLs in config files
   - Environment variable names suggesting services (STRIPE_*, TWILIO_*, SENDGRID_*)

2. For each identified service, use Firecrawl to research:
   a. mcp__firecrawl__firecrawl_search:
      query: "<service name> API documentation endpoints"
      limit: 5
   b. From search results, pick the official documentation URL.
   c. mcp__firecrawl__firecrawl_map:
      url: <documentation_base_url>
      search: "API reference endpoints"
   d. mcp__firecrawl__firecrawl_scrape (with JSON format):
      url: <api_reference_page>
      formats: ["json"]
      jsonOptions:
        prompt: "Extract all API endpoints with HTTP method, path, description, parameters"
        schema:
          type: object
          properties:
            endpoints:
              type: array
              items:
                type: object
                properties:
                  method: { type: string }
                  path: { type: string }
                  description: { type: string }
                  parameters:
                    type: array
                    items:
                      type: object
                      properties:
                        name: { type: string }
                        type: { type: string }
                        required: { type: boolean }

3. For OpenAPI/Swagger specs:
   a. Check for openapi.json, swagger.json, openapi.yaml in the repo.
   b. If found, parse directly for endpoint inventory.
   c. If not found but URLs reference /api-docs or /swagger, attempt to scrape.
```

#### 2B: Cloud Service Intelligence

```
If --cloud-details or --pricing is set, and infrastructure nodes exist:

For AWS services:
  1. Identify services from Terraform resource types (aws_*), SDK imports, or diagram labels.
  2. mcp__firecrawl__firecrawl_search:
     query: "AWS <service> limits quotas pricing 2025"
  3. mcp__firecrawl__firecrawl_scrape the relevant pricing/limits page.
  4. Extract: free tier limits, request rate limits, storage limits, pricing per unit.

For Azure services:
  1. Identify from azurerm_* Terraform resources or @azure/* SDK imports.
  2. Research pricing and SLA tiers.
  3. Extract: SKU options, region availability, SLA percentages.

For GCP services:
  1. Identify from google_* Terraform resources or @google-cloud/* imports.
  2. Research quotas and pricing.
  3. Extract: per-project quotas, pricing model, regional availability.

Add discovered data as annotation notes attached to the relevant infrastructure cells.
Format: "Limits: X req/s | Storage: Y GB | Pricing: $Z/mo (estimate)"
```

#### 2C: Library and Framework Research

```
For major frameworks and libraries in the dependency tree:

1. mcp__firecrawl__firecrawl_search:
   query: "<framework> architecture component lifecycle documentation"
2. mcp__firecrawl__firecrawl_scrape the official docs page.
3. Extract component lifecycle hooks, middleware order, request pipeline.
4. Use findings to add lifecycle annotations to diagram components.

Examples:
  - NestJS: module initialization order, dependency injection scope
  - Spring Boot: bean lifecycle, auto-configuration order
  - FastAPI: middleware stack, dependency injection resolution
  - React: component lifecycle, render phases, state management flow
```

### Phase 3: Diagram Enrichment Application

Apply all gathered intelligence to the diagram XML. Each enrichment type maps to
specific XML modifications.

#### 3A: Cell Label Enrichment

```
For each discovered entity matching an existing diagram cell:

Update the label with structured information:
  <mxCell value="&lt;b&gt;UserService&lt;/b&gt;&lt;hr&gt;
    &lt;font style=&quot;font-size:10px&quot;&gt;
    + createUser(dto: CreateUserDto): Promise&amp;lt;User&amp;gt;&lt;br&gt;
    + findById(id: string): Promise&amp;lt;User&amp;gt;&lt;br&gt;
    + updateProfile(id, data): Promise&amp;lt;User&amp;gt;&lt;br&gt;
    &lt;/font&gt;"
    style="...html=1;..." ... />

For method signatures in class diagrams, use the UML compartment style:
  - Top: class name with stereotype
  - Middle: fields with types
  - Bottom: methods with signatures
```

#### 3B: Metadata Property Enrichment

```
Add custom properties to cells using <object> tags for data binding and tooltips:

<object label="UserService" id="cell_42"
        source_file="src/services/user.service.ts"
        framework="NestJS"
        pattern="Repository"
        endpoints="3"
        dependencies="UserRepository,MailService,ConfigService"
        last_modified="2025-12-01"
        churn_score="high"
        doc_url="https://docs.example.com/api/users">
  <mxCell style="..." vertex="1" parent="1">
    <mxGeometry x="200" y="100" width="240" height="160" as="geometry"/>
  </mxCell>
</object>

Standard metadata properties:
  - source_file: originating source file path
  - framework: detected framework
  - pattern: detected design pattern
  - endpoints: number of API endpoints
  - dependencies: comma-separated dependency list
  - last_modified: last git modification date
  - churn_score: low/medium/high from git history analysis
  - doc_url: link to documentation
  - version: package/service version
  - cloud_service: AWS/Azure/GCP service name
  - pricing_tier: estimated pricing tier
  - rate_limit: API rate limit if known
```

#### 3C: Edge Enrichment

```
For each dependency relationship:

1. Add edges between entities that have code-level dependencies but no diagram edge.
2. Label edges with the dependency type:
   - "imports" for direct module imports
   - "HTTP" for REST API calls
   - "gRPC" for gRPC connections
   - "event" for event/message bus connections
   - "SQL" for database connections
   - "extends" for inheritance
   - "implements" for interface implementation
   - "uses" for dependency injection
   - "publishes/subscribes" for pub/sub
3. Style edges by type:
   - Synchronous calls: solid line, filled arrow
   - Async/event: dashed line, open arrow
   - Inheritance: solid line, hollow triangle
   - Implementation: dashed line, hollow triangle
   - Data flow: solid line, open arrow
```

#### 3D: Layer Enrichment

```
If the diagram has multiple layers (or should), organize enrichment by layer:

Infrastructure Layer (bottom):
  - Cloud services, servers, networks, load balancers
  - Annotate with: regions, instance types, scaling policies, costs

Application Layer (middle):
  - Services, controllers, middleware, message queues
  - Annotate with: endpoints, patterns, dependencies, versions

Data Layer:
  - Databases, caches, object stores, search indexes
  - Annotate with: schemas, indexes, replication config, storage estimates

Security Layer (overlay):
  - Auth boundaries, encryption markers, firewall rules
  - Annotate with: auth method, TLS version, key rotation policy

Create layers via:
  <mxCell id="layer_infra" value="Infrastructure" style="" parent="0"/>
  <mxCell id="layer_app" value="Application" style="" parent="0"/>
  <mxCell id="layer_data" value="Data" style="" parent="0"/>
```

#### 3E: Sub-diagram Generation

```
For complex components that warrant drill-down:

1. Identify components with more than 5 internal classes or 10 methods.
2. Create a new page in the .drawio file for each complex component:
   <diagram id="page_userservice" name="UserService Detail">
     <mxGraphModel>
       <!-- Detailed internal view of the component -->
     </mxGraphModel>
   </diagram>
3. Add a link from the main diagram cell to the detail page:
   style="...link=data:page/id,page_userservice;..."
4. The detail page contains:
   - Full class diagram with all methods and fields
   - Internal dependency flow
   - Configuration and environment dependencies
   - API endpoint detail (if applicable)
```

### Phase 4: Self-Editing Enrichment Loop

Execute an iterative quality improvement loop. The loop runs automatically up to 3
iterations, or until the enrichment score plateaus.

```
LOOP (max 3 iterations):

  Step 1 -- Gap Analysis:
    - Count cells with no metadata properties -> gap_count
    - Count cells with generic labels (e.g., "Service", "Database") -> generic_count
    - Count discovered entities not in diagram -> missing_count
    - Count edges missing between dependent entities -> edge_gap_count
    - Compute enrichment_score = 100 - (gap_count + generic_count + missing_count + edge_gap_count) * weight

  Step 2 -- Targeted Research:
    - For each gap, determine what information source could fill it.
    - Code analysis gaps: re-scan with broader glob patterns.
    - Web research gaps: use Firecrawl to find documentation.
    - Relationship gaps: trace imports more deeply.

  Step 3 -- Apply Fixes:
    - Add missing nodes for undiscovered entities.
    - Update generic labels with specific discovered names and types.
    - Add metadata properties to bare cells.
    - Draw edges for discovered dependencies.

  Step 4 -- Score Check:
    - Recompute enrichment_score.
    - If score >= target_for_level (L1: 60, L2: 75, L3: 85, L4: 95), STOP.
    - If score did not improve from last iteration, STOP.
    - Otherwise, continue loop.

END LOOP
```

### Phase 5: Output and Reporting

```
1. Write the enriched diagram to --output path (or update in-place).
2. Generate an enrichment summary:

   === Enrichment Report ===
   Level: 3 (Deep)
   Iterations: 2
   Score: 87/100

   Entities discovered: 42
   - From code analysis: 38
   - From web research: 4

   Enrichments applied:
   - Labels updated: 28
   - Metadata properties added: 35
   - Edges added: 12
   - Layers created: 3
   - Sub-diagrams generated: 2
   - Annotations added: 8

   Gaps remaining:
   - 3 entities have no documentation URL
   - 2 cloud services missing pricing data
   - 1 circular dependency detected (FooService <-> BarService)

   Files analyzed: 156
   Web pages scraped: 12
   Time elapsed: 4m 32s

3. If --dry-run, output only the report without modifying the diagram.
```

## Enrichment for Specific Diagram Types

### Architecture / C4 Diagrams

```
Focus enrichment on:
  - System context: external actors, external systems, API boundaries
  - Container: services with tech stack labels, databases with engines, message queues with protocols
  - Component: classes, modules, packages with dependency arrows
  - Code (Level 4): full class diagrams with method signatures

C4 enrichment metadata:
  - Technology tag on every container (e.g., "Spring Boot", "PostgreSQL 15", "Redis 7")
  - Description on every component explaining its responsibility
  - Relationship labels with protocol and data format (e.g., "REST/JSON", "gRPC/protobuf")
```

### Sequence Diagrams

```
Focus enrichment on:
  - Participant discovery from route handlers and service methods
  - Message labeling with HTTP method + path or function signature
  - Response types and status codes
  - Async vs sync message styling
  - Alt/opt/loop fragments from conditional logic in code
  - Database queries as messages to DB participant
  - External API calls as messages to external participant with endpoint detail
```

### ER Diagrams

```
Focus enrichment on:
  - Table/entity discovery from ORM models
  - Column names, types, nullability, defaults
  - Primary keys, foreign keys, unique constraints
  - Indexes (name, columns, type)
  - Relationships with cardinality (1:1, 1:N, M:N)
  - Junction tables for many-to-many relationships
  - Enum types and their values
```

### Infrastructure Diagrams

```
Focus enrichment on:
  - Resource types with provider-specific icons/shapes
  - Network topology: VPCs, subnets, security groups, routing
  - Compute: instance types, scaling rules, container specs
  - Storage: database engines, replication, backup policies
  - Messaging: queue types, topic configurations, partitions
  - CDN/Edge: distribution configs, cache policies
  - Monitoring: alerts, dashboards, log pipelines
  - Cost annotations per resource (Level 3+)
```

### Pipeline / CI/CD Diagrams

```
Focus enrichment on:
  - Pipeline stages from CI/CD config files
  - Job dependencies and parallel execution groups
  - Artifact flow between stages
  - Environment promotion path (dev -> staging -> production)
  - Approval gates and manual steps
  - Test stage breakdown (unit, integration, e2e)
  - Build duration estimates from historical data (Level 4)
```

## Error Handling

```
- If a source directory does not exist, warn and skip (do not fail the entire enrichment).
- If Firecrawl tools are unavailable or return errors, fall back to code-only enrichment
  and note the limitation in the report.
- If the diagram XML is malformed, attempt repair before enrichment:
  1. Check for missing root cells (id=0, id=1).
  2. Check for duplicate IDs and renumber.
  3. Check for orphaned edges (source/target ID not found) and remove.
- If enrichment produces a diagram larger than 5000 cells, warn about performance
  and suggest splitting into sub-diagrams.
- Never write secrets, credentials, or environment variable values into the diagram.
  Only write variable names and service names.
```

## Integration with Other drawio Commands

```
This command works well in sequence with other drawio plugin commands:

1. /drawio:create microservices.drawio --type c4      # Generate initial diagram
2. /drawio:enrich microservices.drawio --level 3      # Enrich with full analysis
3. /drawio:style microservices.drawio --theme corporate  # Apply visual styling
4. /drawio:data-bind microservices.drawio --source prometheus  # Bind live data
5. /drawio:embed microservices.drawio --platform github  # Embed in README
6. /drawio:export microservices.drawio --format svg    # Export for sharing
```

## Performance Considerations

```
- Level 1: Lightweight, no web calls. Safe for large codebases (10k+ files).
- Level 2: Moderate. Reads many files but no network. May take 2-5 min on large repos.
- Level 3: Heavy. Makes 10-50 web requests via Firecrawl. Rate-limit aware.
  Uses firecrawl_search with limit=5 to avoid excessive requests.
  Caches scraped results to avoid duplicate requests for the same URL.
- Level 4: Very heavy. Git history analysis on large repos can be slow.
  Consider using --focus to target specific components.
  Cross-repo analysis requires access to other repositories.

Optimization tips:
  - Use --focus to enrich only the component you are working on.
  - Use --lang to skip language detection if you know the stack.
  - Use --depth 2 for initial enrichment, increase only if gaps remain.
  - Run Level 2 first, review, then run Level 3 on the same diagram.
```
