---
name: innovation-radar
description: Identifies cutting-edge, innovative upgrade opportunities based on tech stack and industry trends
tags:
  - upgrade-suggestion
  - innovation
  - trends
  - features
---

# Innovation Radar Skill

Identifies **forward-looking, innovative upgrade opportunities** that go beyond
fixing problems — suggesting features and patterns that make a project stand out.
This is the "what if?" layer on top of the council's "what's wrong?" analysis.

## Innovation Categories

### 1. AI-Powered Features

Suggest AI integration opportunities appropriate to the project:

| Project Type | AI Feature | Effort | Impact |
|-------------|-----------|--------|--------|
| Content app | AI-powered search with embeddings | Medium | High |
| E-commerce | Product recommendation engine | High | Very High |
| SaaS dashboard | Natural language data queries | Medium | High |
| Dev tools | AI code review / suggestions | Medium | High |
| CMS | AI content generation / summarization | Low | Medium |
| Form-heavy app | Smart form auto-fill | Low | Medium |
| Documentation | AI-powered Q&A chatbot | Medium | High |
| Any app | AI-powered command palette | Low | High |

**Detection**: Look for search functionality, data tables, content editing,
or user input forms — these are prime AI integration points.

### 2. Modern UI Patterns

Patterns that dramatically improve perceived quality:

| Pattern | What It Is | When to Suggest |
|---------|-----------|-----------------|
| Command Palette (Cmd+K) | Searchable action menu | Any app with >5 pages/actions |
| Optimistic Updates | UI updates before server confirms | Any CRUD app |
| Skeleton Screens | Content-shaped loading placeholders | Any data-loading UI |
| Drag-and-Drop | Reorderable lists/grids | Lists with order significance |
| Infinite Scroll | Progressive content loading | Feed/list-heavy apps |
| Toast Notifications | Non-blocking feedback | Any app with async actions |
| Spotlight Search | Full-app search | Apps with >10 content types |
| Multi-select + Batch | Select many, act on all | Admin/management interfaces |
| Contextual Tooltips | Rich inline help | Complex/enterprise UIs |
| Keyboard Shortcuts | Power-user acceleration | Productivity/dev tools |
| Live Collaboration | Real-time multi-user | Docs/editors/whiteboards |
| Dark Mode | Theme switching | Any user-facing app |
| Responsive Sidebar | Collapsible navigation | Dashboard/admin layouts |
| Data Visualization | Charts/graphs from data | Apps with analytics |
| Undo/Redo Stack | Action history | Editors/form-heavy apps |

### 3. Performance Innovations

Beyond fixing bottlenecks — architectural performance patterns:

| Pattern | What It Is | When to Suggest |
|---------|-----------|-----------------|
| Edge Functions | Compute at CDN edge | Global user base, low-latency needs |
| Streaming SSR | Stream HTML as it renders | Next.js/Remix apps with slow data |
| React Server Components | Server-rendered components | Next.js 14+ apps |
| Islands Architecture | Partial hydration | Content-heavy sites (Astro) |
| Service Worker Caching | Offline-first patterns | Apps used on mobile/poor networks |
| WebSocket Subscriptions | Real-time data push | Dashboards, chat, live feeds |
| Virtual Scrolling | Render only visible rows | Tables with 100+ rows |
| Image Optimization Pipeline | Auto-resize, WebP, lazy load | Image-heavy apps |
| Database Connection Pooling | Shared DB connections | Serverless + DB apps |
| GraphQL DataLoader | Batched DB queries | GraphQL APIs with N+1 risk |

### 4. Developer Experience Innovations

Tools and patterns that accelerate development:

| Pattern | What It Is | When to Suggest |
|---------|-----------|-----------------|
| Type Generation | Auto-generate types from schema | API consumers (OpenAPI, GraphQL) |
| Monorepo Setup | Shared code across packages | 2+ related projects |
| Storybook | Component development environment | UI component libraries |
| Feature Flags | Gradual rollout infrastructure | Teams shipping frequently |
| API Mocking (MSW) | Mock service worker for dev/test | Frontend without backend ready |
| Database Seeding | Reproducible dev data | Apps with complex data models |
| Hot Module Replacement | Instant dev feedback | Any frontend project |
| Error Tracking (Sentry) | Production error monitoring | Any deployed application |
| Analytics Pipeline | User behavior tracking | Product-focused apps |
| Health Check Endpoints | `/healthz` + readiness probes | Any deployed service |

### 5. Security Innovations

Proactive security patterns beyond basic hardening:

| Pattern | What It Is | When to Suggest |
|---------|-----------|-----------------|
| Content Security Policy | XSS prevention headers | Any web app |
| Subresource Integrity | CDN script verification | Apps loading external scripts |
| RBAC Framework | Role-based access control | Multi-user apps |
| Audit Logging | Security event trail | Enterprise/compliance apps |
| Secret Rotation | Automated credential rotation | Production services |
| Rate Limiting + WAF | Request throttling | Public APIs |
| OAuth2/OIDC | Standard auth protocol | Apps with user login |
| Signed URLs | Temporary secure asset access | File download/upload features |

## Innovation Scoring

Each innovation is scored on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Novelty | 25% | How cutting-edge is this? (1-10) |
| User Impact | 30% | How much does this improve the user experience? (1-10) |
| Effort | 20% | How easy to implement? (1-10, higher = easier) |
| Fit | 25% | How well does this match the project's stack and scale? (1-10) |

```
InnovationScore = (Novelty * 0.25) + (UserImpact * 0.30) + (Effort * 0.20) + (Fit * 0.25)
```

## Framework-Specific Innovation Suggestions

### Next.js
- Parallel Routes for simultaneous layouts
- Intercepting Routes for modal-like patterns
- Server Actions for form mutations without API routes
- Partial Prerendering (PPR) for hybrid static/dynamic
- next/image with blur placeholder for perceived speed

### React SPA
- React Query / TanStack Query for server state management
- Suspense boundaries for streaming data loading
- React.lazy + named exports for granular code splitting
- useOptimistic for instant UI feedback
- useDeferredValue for non-blocking updates

### Express/Node Backend
- tRPC for end-to-end type safety with frontend
- BullMQ for background job processing
- OpenTelemetry for distributed tracing
- Zod-based request validation middleware
- Structured logging with Pino

### Python Backend
- Background tasks with Celery or Dramatiq
- Redis caching with automatic invalidation
- OpenAPI spec generation from models
- Async database drivers (asyncpg)
- Structured logging with structlog

## Output Format

```yaml
innovations:
  - title: "Add Cmd+K command palette for power-user navigation"
    category: innovation
    subcategory: modern-ui
    novelty: 8
    user_impact: 8
    effort: 7
    fit: 9
    innovation_score: 8.05
    confidence: 0.85
    description: >
      Your app has 12 pages and 8 common actions. A command palette (Cmd+K)
      lets power users navigate, search, and act without leaving the keyboard.
      Libraries like cmdk or kbar make this a 2-3 hour implementation with
      dramatic UX improvement.
    implementation:
      library: "cmdk (pacocoursey/cmdk) — 2KB gzipped"
      files_to_create: ["src/components/CommandPalette.tsx"]
      files_to_modify: ["src/app/layout.tsx"]
      estimated_time: "2-3 hours"
    inspiration: "VS Code, Linear, Vercel Dashboard, Raycast"
    tags: [cmd-k, command-palette, keyboard, power-users, navigation]
```

## Anti-Patterns

- Don't suggest innovations that don't fit the project's maturity
- Don't suggest AI features if the project has no data to work with
- Don't suggest real-time features for read-only content sites
- Don't suggest enterprise patterns for personal projects
- Always include a specific library/tool recommendation — not just "add AI"
- Always estimate implementation time realistically
