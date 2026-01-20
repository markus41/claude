# Claude Code Templating Plugin - v2.0.0 Upgrade Plan

**Version:** 1.0.0 → 2.0.0
**Date:** 2025-01-19
**Status:** Implementation Ready

---

## Executive Summary

This upgrade establishes a scalable database-backed template registry that improves data visibility, enables team-wide template sharing, and drives measurable outcomes through comprehensive usage analytics.

---

## Upgrade Goals

| Goal | Benefit | Priority |
|------|---------|----------|
| **Database Integration** | Persistent, queryable template storage | P0 |
| **Redis Caching** | Sub-millisecond template resolution | P0 |
| **Usage Analytics** | Track template popularity and generation metrics | P1 |
| **Shared Registry** | Team-wide template discovery and sharing | P1 |
| **Version Management** | Proper semver-based template versioning | P2 |

---

## Architecture Changes

### Before (v1.0.0)
```
┌─────────────────────────────────────────────┐
│         Template Registry (File-based)       │
├─────────────────────────────────────────────┤
│  ~/.claude/template-cache/registry.json     │
│  - In-memory cache (1 hour TTL)             │
│  - No shared access                          │
│  - No analytics                              │
└─────────────────────────────────────────────┘
```

### After (v2.0.0)
```
┌─────────────────────────────────────────────┐
│        Template Registry (Database-backed)   │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────────┐    ┌─────────────┐         │
│  │ PostgreSQL  │◄───│   Prisma    │         │
│  │   (Neon)    │    │   Client    │         │
│  └─────────────┘    └─────────────┘         │
│         ▲                  ▲                 │
│         │                  │                 │
│  ┌──────┴──────┐    ┌──────┴──────┐         │
│  │   Redis     │    │  Template   │         │
│  │   Cache     │    │  Registry   │         │
│  └─────────────┘    └─────────────┘         │
│                                              │
└─────────────────────────────────────────────┘
```

---

## Database Schema

### New Prisma Models

```prisma
// Template - Core template definition
model Template {
  id              String   @id @default(cuid())
  name            String
  version         String
  description     String?

  // Format and source
  format          TemplateFormat
  sourceType      TemplateSourceType @map("source_type")
  sourceLocation  String?  @map("source_location")

  // Categorization
  category        String?
  tags            String[]

  // Authorship
  author          String?
  authorEmail     String?  @map("author_email")

  // Metrics
  downloads       Int      @default(0)
  stars           Int      @default(0)

  // Content
  readme          String?
  variables       Json?    // Template variables schema

  // Visibility
  isPublic        Boolean  @default(true) @map("is_public")
  ownerId         String?  @map("owner_id")

  // Relations
  generations     TemplateGeneration[]

  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([name, version])
  @@index([name])
  @@index([format])
  @@index([category])
  @@index([tags])
  @@map("templates")
}

// TemplateGeneration - Track template usage
model TemplateGeneration {
  id              String   @id @default(cuid())
  templateId      String   @map("template_id")
  template        Template @relation(fields: [templateId], references: [id])

  // Generation context
  projectName     String   @map("project_name")
  outputPath      String?  @map("output_path")

  // Variables used
  variables       Json?

  // Execution
  success         Boolean
  durationMs      Int?     @map("duration_ms")
  filesGenerated  Int?     @map("files_generated")

  // Error tracking
  errorType       String?  @map("error_type")
  errorMessage    String?  @map("error_message")

  // User context
  userId          String?  @map("user_id")
  sessionId       String?  @map("session_id")

  createdAt       DateTime @default(now()) @map("created_at")

  @@index([templateId])
  @@index([success])
  @@index([createdAt])
  @@map("template_generations")
}

// Enums
enum TemplateFormat {
  HANDLEBARS
  COOKIECUTTER
  COPIER
  MAVEN_ARCHETYPE
  HARNESS
}

enum TemplateSourceType {
  EMBEDDED
  LOCAL
  GITHUB
  NPM
  URL
}
```

---

## Implementation Plan

### Phase 1: Schema Extension (Day 1)

**Files to Modify:**
- `plugins/jira-orchestrator/prisma/schema.prisma` - Add Template models

**Steps:**
1. Add Template and TemplateGeneration models to shared schema
2. Add TemplateFormat and TemplateSourceType enums
3. Run `npm run db:generate && npm run db:push`

### Phase 2: Shared Infrastructure (Day 1)

**Files to Create:**
- `plugins/claude-code-templating-plugin/lib/database.ts` - Database client
- `plugins/claude-code-templating-plugin/lib/redis.ts` - Redis caching

**Steps:**
1. Create database client that imports from jira-orchestrator
2. Create Redis utilities for template caching
3. Add environment variable support

### Phase 3: Registry Migration (Day 2)

**Files to Modify:**
- `src/templates/registry.ts` - Migrate from file to database

**Steps:**
1. Keep ITemplateRegistry interface stable
2. Replace file-based storage with Prisma queries
3. Add Redis caching layer
4. Implement migration from existing JSON cache

### Phase 4: Analytics Integration (Day 2)

**Files to Modify:**
- `src/core/orchestrator.ts` - Add generation tracking
- `src/index.ts` - Add database initialization

**Steps:**
1. Track all template generations in database
2. Add usage metrics queries
3. Expose analytics via new commands

### Phase 5: Testing & Documentation (Day 3)

**Files to Create/Modify:**
- `test/unit/templates/registry-db.test.ts` - New tests
- `docs/UPGRADE-GUIDE.md` - Migration guide
- `README.md` - Update documentation
- `package.json` - Update version to 2.0.0

---

## Migration Strategy

### For Existing Users

1. **Automatic Migration**: On first run, existing JSON cache is imported to database
2. **Fallback Mode**: If database unavailable, falls back to file-based storage
3. **No Breaking Changes**: Command interface remains identical

### Migration Code

```typescript
async function migrateFromFileCache(): Promise<void> {
  const cachePath = join(homedir(), '.claude', 'template-cache', 'registry.json');

  try {
    const content = await readFile(cachePath, 'utf-8');
    const cache = JSON.parse(content) as RegistryCache;

    for (const entry of cache.entries) {
      await prisma.template.upsert({
        where: { name_version: { name: entry.name, version: entry.version } },
        create: mapEntryToTemplate(entry),
        update: mapEntryToTemplate(entry),
      });
    }

    console.log(`Migrated ${cache.entries.length} templates to database`);
  } catch (error) {
    // No existing cache, skip migration
  }
}
```

---

## Dependencies

### New Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^6.3.0",
    "@upstash/redis": "^1.34.3"
  },
  "devDependencies": {
    "prisma": "^6.3.0"
  }
}
```

### Shared from jira-orchestrator

- Database connection (Neon PostgreSQL)
- Redis connection (Upstash)
- Prisma client generation

---

## Environment Variables

```bash
# Database (shared with jira-orchestrator)
DATABASE_URL=postgresql://...

# Redis (shared with jira-orchestrator)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Feature flags
FEATURE_TEMPLATE_DB_ENABLED=true
FEATURE_TEMPLATE_CACHE_ENABLED=true
```

---

## Rollback Plan

If issues arise:

1. Set `FEATURE_TEMPLATE_DB_ENABLED=false` to disable database
2. Plugin automatically falls back to file-based registry
3. No data loss - both storage methods can coexist

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Template resolution latency | < 50ms | Redis cache hit rate |
| Registry sync time | < 2s | Full refresh time |
| Cache hit rate | > 95% | Redis metrics |
| Zero downtime | 100% | No user-facing errors |

---

## Timeline

| Day | Phase | Deliverable |
|-----|-------|-------------|
| 1 | Schema + Infrastructure | Database models, clients |
| 2 | Registry + Analytics | Migrated registry, tracking |
| 3 | Testing + Docs | Full test coverage, guides |

---

**Golden Armada** | *You ask - The Fleet Ships*
