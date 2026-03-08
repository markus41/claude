---
name: project-fingerprinting
description: Deep project fingerprinting for tech stack detection, architecture analysis, and quality assessment
tags:
  - upgrade-suggestion
  - fingerprinting
  - detection
  - analysis
---

# Project Fingerprinting Skill

Comprehensive project fingerprinting system that builds a multi-dimensional profile
of any codebase. Used by the upgrade council to give specialist agents targeted
context, eliminating irrelevant analysis and enabling framework-specific recommendations.

## Fingerprint Schema

```yaml
fingerprint:
  # Core identity
  name: string           # from package.json name or directory
  language: string       # primary language
  languages: string[]    # all detected languages

  # Framework detection
  frameworks:
    frontend: string[]   # react, vue, angular, svelte, next, nuxt, etc.
    backend: string[]    # express, fastapi, django, nestjs, flask, etc.
    meta: string[]       # next (fullstack), nuxt (fullstack), remix, etc.
    mobile: string[]     # react-native, flutter, expo, etc.

  # Infrastructure
  infrastructure:
    containerized: boolean
    container_tool: docker | podman | none
    orchestrated: boolean
    orchestrator: kubernetes | docker-compose | nomad | none
    ci_cd: github-actions | gitlab-ci | jenkins | circle-ci | azure-pipelines | none
    cloud: aws | gcp | azure | vercel | netlify | none
    iac: terraform | pulumi | cdk | cloudformation | none
    monitoring: prometheus | datadog | newrelic | none

  # Architecture
  architecture:
    pattern: monolith | monorepo | microservices | serverless | jamstack
    api_style: rest | graphql | grpc | trpc | mixed | none
    state_management: redux | zustand | jotai | recoil | mobx | context | pinia | vuex | none
    orm: prisma | drizzle | typeorm | sequelize | sqlalchemy | django-orm | none
    database: postgres | mysql | mongodb | sqlite | redis | none
    auth: nextauth | clerk | auth0 | keycloak | passport | custom | none
    monorepo_tool: nx | turborepo | lerna | pnpm-workspaces | none

  # Quality signals
  quality:
    typescript:
      enabled: boolean
      strict: boolean
      strict_null_checks: boolean
      no_implicit_any: boolean
    linter:
      tool: eslint | biome | none
      config_format: flat | legacy | none
    formatter:
      tool: prettier | biome | none
    testing:
      framework: jest | vitest | pytest | go-test | none
      coverage_configured: boolean
      e2e_framework: playwright | cypress | puppeteer | none
    pre_commit: husky | lefthook | pre-commit | none
    dependency_updates: dependabot | renovate | none

  # Scale metrics
  scale:
    file_count: number
    src_lines: number       # approximate
    dependency_count: number
    dev_dependency_count: number
    contributor_count: number  # from git log --format='%ae' | sort -u | wc -l
    commit_count_30d: number   # activity level
    age_days: number           # first commit to now

  # Package manager
  package_manager: npm | pnpm | yarn | bun | pip | cargo | go-mod | maven | gradle
```

## Detection Rules

### Language Detection (priority order)

| Check | Language | Confidence |
|-------|----------|------------|
| `tsconfig.json` exists | TypeScript | 0.95 |
| `*.ts` files in `src/` | TypeScript | 0.90 |
| `package.json` exists (no TS) | JavaScript | 0.85 |
| `pyproject.toml` or `requirements.txt` | Python | 0.95 |
| `go.mod` | Go | 0.95 |
| `Cargo.toml` | Rust | 0.95 |
| `pom.xml` or `build.gradle` | Java/Kotlin | 0.90 |
| `*.rb` + `Gemfile` | Ruby | 0.90 |
| `*.cs` + `*.csproj` | C# | 0.90 |
| `*.swift` + `Package.swift` | Swift | 0.90 |

### Framework Detection (package.json dependencies)

| Dependency | Framework | Category |
|-----------|-----------|----------|
| `next` | Next.js | meta-framework |
| `react`, `react-dom` | React | frontend |
| `vue` | Vue.js | frontend |
| `@angular/core` | Angular | frontend |
| `svelte`, `@sveltejs/kit` | Svelte/SvelteKit | frontend/meta |
| `express` | Express | backend |
| `fastify` | Fastify | backend |
| `@nestjs/core` | NestJS | backend |
| `hono` | Hono | backend |
| `@remix-run/node` | Remix | meta-framework |
| `astro` | Astro | meta-framework |
| `nuxt` | Nuxt | meta-framework |
| `gatsby` | Gatsby | meta-framework |
| `react-native` | React Native | mobile |
| `expo` | Expo | mobile |

### Python Framework Detection (requirements/pyproject)

| Dependency | Framework |
|-----------|-----------|
| `fastapi` | FastAPI |
| `django` | Django |
| `flask` | Flask |
| `starlette` | Starlette |
| `tornado` | Tornado |
| `aiohttp` | aiohttp |

### Infrastructure Detection (file/directory patterns)

| Pattern | Infrastructure | Type |
|---------|---------------|------|
| `Dockerfile` | Docker | container |
| `docker-compose.yml` | Docker Compose | orchestrator |
| `Chart.yaml` | Helm | orchestrator |
| `k8s/`, `kubernetes/` | Kubernetes | orchestrator |
| `.github/workflows/` | GitHub Actions | ci_cd |
| `.gitlab-ci.yml` | GitLab CI | ci_cd |
| `Jenkinsfile` | Jenkins | ci_cd |
| `terraform/`, `*.tf` | Terraform | iac |
| `Pulumi.yaml` | Pulumi | iac |
| `vercel.json` | Vercel | cloud |
| `netlify.toml` | Netlify | cloud |
| `firebase.json` | Firebase | cloud |
| `serverless.yml` | Serverless FW | cloud |
| `fly.toml` | Fly.io | cloud |
| `render.yaml` | Render | cloud |

### Quality Detection

| Check | Detection |
|-------|-----------|
| `tsconfig.json` → `"strict": true` | TypeScript strict mode |
| `.eslintrc*` or `eslint.config.*` | ESLint configured |
| `.prettierrc*` or `prettier.config.*` | Prettier configured |
| `jest.config.*` or `vitest.config.*` | Test framework |
| `.husky/` directory | Pre-commit hooks |
| `renovate.json` or `.github/dependabot.yml` | Auto dependency updates |
| `playwright.config.*` or `cypress.config.*` | E2E testing |
| `biome.json` or `biome.jsonc` | Biome (lint + format) |

### Architecture Pattern Detection

| Signal | Pattern |
|--------|---------|
| `packages/` or `apps/` directory | Monorepo |
| `turbo.json` or `nx.json` | Monorepo (confirmed) |
| Multiple `Dockerfile`s + `docker-compose.yml` | Microservices |
| `serverless.yml` + `functions/` | Serverless |
| Single `src/` with both API + UI | Monolith |
| `pages/` or `app/` (Next.js) + `api/` | Fullstack monolith |

## Quick Commands for Fingerprinting

```bash
# One-shot fingerprint collection script
echo "=== PACKAGE.JSON ===" && cat package.json 2>/dev/null | head -80
echo "=== TSCONFIG ===" && cat tsconfig.json 2>/dev/null | head -30
echo "=== DIR STRUCTURE ===" && ls -la src/ 2>/dev/null
echo "=== KEY FILES ===" && ls Dockerfile docker-compose.yml Chart.yaml .github/workflows/ 2>/dev/null
echo "=== GIT STATS ===" && git log --oneline --since='30 days ago' 2>/dev/null | wc -l
echo "=== CONTRIBUTORS ===" && git log --format='%ae' 2>/dev/null | sort -u | wc -l
echo "=== FILE COUNT ===" && find src/ -name '*.ts' -o -name '*.tsx' -o -name '*.py' -o -name '*.go' 2>/dev/null | wc -l
echo "=== LINE COUNT ===" && find src/ -name '*.ts' -o -name '*.tsx' 2>/dev/null | xargs wc -l 2>/dev/null | tail -1
```

## Framework-Specific Signal Boosters

When a framework is detected, enable additional specialist checks:

### Next.js Projects
- Check for `next/image` usage (vs raw `<img>`)
- Check for `getServerSideProps` vs `getStaticProps` (SSR vs SSG opportunities)
- Check App Router vs Pages Router
- Check for middleware usage
- Check for ISR (Incremental Static Regeneration)

### React SPA
- Check for React.lazy + Suspense (code splitting)
- Check for React.memo on frequently re-rendered components
- Check for proper key usage in lists
- Check for StrictMode enabled

### Express/Fastify Backend
- Check for middleware ordering (helmet, cors, compression)
- Check for request validation (Zod, Joi, express-validator)
- Check for rate limiting
- Check for error handling middleware

### FastAPI/Django
- Check for async endpoint usage (FastAPI)
- Check for Pydantic model usage
- Check for middleware stack
- Check for CORS configuration

## Output

The fingerprint is passed to all council agents as context. It determines:
1. Which specialist agents are most relevant to spawn
2. Which detection patterns each specialist should focus on
3. Framework-specific suggestions to consider
4. Scale-appropriate recommendations (don't suggest enterprise patterns for a prototype)
