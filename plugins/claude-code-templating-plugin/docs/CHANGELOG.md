# Changelog

All notable changes to the Claude Code Templating Plugin.

## [2.0.0] - 2025-01-19

### Added

- **Database Integration**: Template registry now backed by PostgreSQL (Neon)
  - Persistent template storage across sessions
  - Full CRUD operations for templates
  - Template generation tracking and metrics
  - Automatic migration from legacy JSON cache

- **Redis Caching**: Sub-millisecond template resolution via Upstash Redis
  - Template metadata caching (1 hour TTL)
  - Search results caching (10 minutes TTL)
  - Template list caching (5 minutes TTL)
  - Rate limiting for generation operations

- **Usage Analytics**: Track template popularity and generation metrics
  - Download counts per template
  - Success/failure rates
  - Average generation duration
  - User session tracking

- **Shared Infrastructure**: Leverages jira-orchestrator's database setup
  - Neon PostgreSQL (shared connection)
  - Upstash Redis (shared instance)
  - Prisma ORM with type-safe queries

- **New Files**:
  - `lib/database.ts` - Database client and CRUD operations
  - `lib/redis.ts` - Redis caching utilities
  - `src/templates/registry-db.ts` - Database-backed registry
  - `scripts/verify-db-integration.ts` - Integration verification
  - `docs/UPGRADE-PLAN-v2.md` - Detailed upgrade plan

### Changed

- **package.json**: Updated to v2.0.0 with new dependencies
  - Added: `@prisma/client`, `@upstash/redis`, `dotenv`
  - Added: `prisma` (dev dependency)
  - Updated: Node.js requirement to >=18.0.0

- **Prisma Schema**: Extended with Template models (in jira-orchestrator)
  - `Template` model for template definitions
  - `TemplateGeneration` model for usage tracking
  - `TemplateFormat` enum (HANDLEBARS, COOKIECUTTER, COPIER, MAVEN_ARCHETYPE, HARNESS)
  - `TemplateSourceType` enum (EMBEDDED, LOCAL, GITHUB, NPM, URL)

### Migration Notes

- Existing file-based caches are automatically imported on first run
- Fallback mode activates if database is unavailable
- No changes to command interface (/template, /scaffold, /harness, /generate)

### Environment Variables

```bash
# Required (shared with jira-orchestrator)
DATABASE_URL=postgresql://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Feature flags
FEATURE_TEMPLATE_DB_ENABLED=true
FEATURE_TEMPLATE_CACHE_ENABLED=true
```

---

## [1.0.0] - 2025-01-15

### Initial Release

- Universal template processing (Handlebars, Cookiecutter, Copier, Maven Archetype, Harness)
- Harness Expert Agent for pipeline creation
- Project scaffolding capabilities
- Code generation from specifications
- MCP integration layer
- 5 specialized agents (harness-expert, scaffold-agent, codegen-agent, database-agent, testing-agent)
- 4 commands (/template, /scaffold, /harness, /generate)
- 3 skills (universal-templating, harness-expert, project-scaffolding)
