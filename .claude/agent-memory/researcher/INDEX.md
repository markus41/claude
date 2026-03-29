---
name: Researcher Agent Memory - Complete Index
description: Master index of all research findings and documentation knowledge bases
type: reference
---

# Researcher Agent Memory - Complete Index

**Updated**: 2026-03-29
**Total Research Files**: 20+
**Total Documentation**: 8,700+ lines
**Coverage Areas**: 15+ major topics

This index tracks all research findings maintained in persistent agent memory for rapid discovery and reuse across sessions.

---

## PRIMARY KNOWLEDGE BASES (Active Session Focus)

### .NET/Blazor Comprehensive Documentation
📄 **File**: `dotnet_blazor_research.md` (1,006 lines)
📅 **Date**: 2026-03-29

**Coverage** (10 major sections):
1. Blazor Web App Render Modes (.NET 10)
   - InteractiveServer, InteractiveWebAssembly, InteractiveAuto, Static
   - Decision matrix with performance characteristics
   - Code examples for each mode

2. Blazor Component Lifecycle
   - SetParametersAsync → OnInitialized → OnParametersSet → OnAfterRender → Dispose
   - Detailed hook explanations with code
   - Common patterns (data loading, caching, validation)

3. ASP.NET Core Microservices Architecture
   - gRPC (internal services)
   - REST/HTTP (public APIs)
   - Event-driven patterns (message queues)
   - Service discovery and resilience patterns

4. .NET Aspire Orchestration
   - Multi-service coordination
   - Service discovery and configuration
   - Health checks and distributed tracing

5. Entity Framework Core (.NET 10)
   - DbContext setup and relationships
   - Query patterns and best practices
   - Async operations (ToListAsync, SaveChangesAsync)

6. Blazor Authentication & Authorization
   - JWT token setup and validation
   - Role-based and claim-based policies
   - Component-level authorization with @attribute

7. Blazor JavaScript Interop
   - FFI (Foreign Function Interface) patterns
   - Module-based invocation (recommended)
   - InvokeVoidAsync and InvokeAsync<T>

8. SignalR Real-Time Features
   - Hub setup and communication patterns
   - Group messaging and user targeting
   - Component integration with proper cleanup

9. Syncfusion Blazor Components
   - Professional UI components
   - DataGrid, DatePicker, Calendar, Chart
   - Two-way binding and data operations

10. Architecture Recommendations
    - Enterprise app stack
    - Public/high-scale app stack
    - Hybrid application patterns

**Use for**: Architecture decisions, implementation patterns, code examples

---

### .NET/Blazor Quick Reference
📄 **File**: `dotnet_quick_reference.md` (262 lines)
📅 **Date**: 2026-03-29

**Quick Lookup**:
- Render mode selection (one-page matrix)
- Dependency injection patterns
- Minimal API quick setup
- gRPC service template
- Entity Framework queries
- Authentication setup
- SignalR usage
- JavaScript interop patterns
- Error handling (error boundaries)
- Two-way binding variations
- Common file locations

**Use for**: Quick reference, template copying, cheat sheet

---

## SECONDARY KNOWLEDGE BASES (Related Topics)

### Material UI (MUI) Expert Research
📄 **Files**:
- `mui-research-findings.md` (642 lines)
- `MUI_THEMING_COMPREHENSIVE_2026-03-28.md` (933 lines)
- `MUI_Advanced_Patterns_Research_2026-03-28.md` (642 lines)
- `MUI_EXPERT_SUMMARY.md` (171 lines)
- `mui-performance-research.md` (682 lines)

📅 **Date**: 2026-03-28

**Coverage**: Component library, theming, styling, performance optimization

---

### Agentic Design Patterns
📄 **Files**:
- `agentic_design_patterns.md` (443 lines)
- `agentic-patterns-research.md` (322 lines)
- `agentic_design_patterns_research.md` (56 lines)

📅 **Date**: 2026-03-29

**Coverage**: Agent architectures, multi-agent systems, orchestration patterns

---

### Draw.io / Diagramming
📄 **Files**:
- `drawio-reference.md` (693 lines)
- `draw-io-capabilities-research.md` (460 lines)
- `reference_drawio.md` (148 lines)

📅 **Date**: 2026-03-26

**Coverage**: Diagram creation, architecture visualization, formatting

---

### MCP Integration & Tools
📄 **Files**:
- `context7_mcp_research.md` (509 lines)
- `mcp_comparison_firecrawl_vs_perplexity.md` (292 lines)

📅 **Date**: 2026-03-26

**Coverage**: Model Context Protocol servers, Firecrawl, Perplexity, Context7

---

### Claude Code Features
📄 **Files**:
- `claude_code_features_march_2026.md` (296 lines)
- `RESEARCH_SUMMARY_MEMORY_SYSTEM.md` (346 lines)
- `memory_system_research.md` (484 lines)

📅 **Date**: 2026-03-26

**Coverage**: Claude Code platform, memory system, plugin system

---

### Plugin Development
📄 **Files**:
- `cowork-plugin-format.md` (266 lines)

📅 **Date**: 2026-03-26

**Coverage**: Plugin manifest structure, configuration

---

## USAGE PATTERNS

### Research Workflow
1. **Topic Identified** → Check index below for relevant file
2. **File Located** → Read appropriate documentation file
3. **Code Found** → Copy example and adapt to context
4. **New Pattern** → Add to relevant documentation file
5. **Session End** → Update timestamps and keep organized

### Quick Lookups
- **Blazor component patterns?** → `dotnet_blazor_research.md` Section 2
- **Microservices setup?** → `dotnet_blazor_research.md` Section 3
- **JWT auth in .NET?** → `dotnet_blazor_research.md` Section 6
- **Need quick code template?** → `dotnet_quick_reference.md`
- **Real-time features?** → `dotnet_blazor_research.md` Section 8
- **UI component library?** → `mui-research-findings.md`
- **Agent architecture?** → `agentic_design_patterns.md`
- **System diagram?** → `drawio-reference.md`

---

## ORGANIZATION BY SCENARIO

### Building a Blazor Web App (Enterprise)
1. Read: `dotnet_blazor_research.md` - Sections 1, 2, 6, 8
2. Reference: `dotnet_quick_reference.md` - DI, Auth sections
3. Copy: Code examples for InteractiveServer components

### Building Microservices
1. Read: `dotnet_blazor_research.md` - Sections 3, 4, 5, 6
2. Reference: Code examples for gRPC, minimal APIs
3. Copy: DbContext setup, authentication patterns

### Building a Real-Time Dashboard
1. Read: `dotnet_blazor_research.md` - Sections 1 (InteractiveServer), 7 (SignalR)
2. Reference: Component lifecycle patterns
3. Copy: SignalR hub and component integration

### Building Public-Facing App
1. Read: `dotnet_blazor_research.md` - Sections 1 (InteractiveWebAssembly), 3 (REST APIs)
2. Reference: Quick reference for minimal APIs
3. Copy: REST endpoint examples

### UI/UX Components
1. Read: `mui-research-findings.md` + `MUI_THEMING_COMPREHENSIVE_2026-03-28.md`
2. Reference: Component patterns, theming strategies
3. Copy: Component examples

### System Architecture
1. Read: `dotnet_blazor_research.md` - Sections 3, 4
2. Reference: Architecture recommendations section
3. Copy: Microservices diagram patterns from `drawio-reference.md`

---

## FILE STRUCTURE REFERENCE

```
/home/user/claude/.claude/agent-memory/researcher/
├── INDEX.md (this file)
├── MEMORY.md (entry point)
│
├── dotnet_blazor_research.md (PRIMARY - 1,006 lines)
├── dotnet_quick_reference.md (QUICK - 262 lines)
│
├── mui-research-findings.md (642 lines)
├── MUI_THEMING_COMPREHENSIVE_2026-03-28.md (933 lines)
├── MUI_Advanced_Patterns_Research_2026-03-28.md (642 lines)
├── mui-performance-research.md (682 lines)
│
├── agentic_design_patterns.md (443 lines)
├── agentic-patterns-research.md (322 lines)
│
├── drawio-reference.md (693 lines)
├── draw-io-capabilities-research.md (460 lines)
│
├── context7_mcp_research.md (509 lines)
├── mcp_comparison_firecrawl_vs_perplexity.md (292 lines)
│
├── claude_code_features_march_2026.md (296 lines)
├── memory_system_research.md (484 lines)
├── RESEARCH_SUMMARY_MEMORY_SYSTEM.md (346 lines)
│
├── cowork-plugin-format.md (266 lines)
│
└── reference_drawio.md (148 lines)
```

---

## RESEARCH STATISTICS

| Metric | Count |
|--------|-------|
| Total Documentation Files | 20+ |
| Total Lines | 8,700+ |
| Code Examples | 60+ |
| Architecture Patterns | 15+ |
| Quick Reference Sections | 25+ |
| Topic Areas | 15 |

---

## KEY PATTERNS BY TECH STACK

### .NET/Blazor Stack (3,000+ lines)
- Blazor render modes (4 types)
- Component lifecycle (5 phases)
- Microservices (3 patterns)
- Authentication (JWT, roles, claims)
- Real-time (SignalR)
- Data access (EF Core)
- APIs (gRPC, REST, minimal)

### Frontend Stack (3,500+ lines)
- React/Material UI components
- Theming and styling
- Performance optimization
- Component patterns

### Architecture Stack (1,200+ lines)
- Agentic design patterns
- Multi-agent orchestration
- System visualization

---

## MAINTENANCE & UPDATES

**Last Updated**: 2026-03-29 06:46 UTC
**Research Model**: Claude Haiku 4.5 (fast, focused research)
**Update Frequency**: As new patterns discovered during development
**Review Cycle**: Monthly (consolidate new learnings)

### How to Maintain
1. When discovering new pattern: Add to appropriate file
2. When file exceeds 2,000 lines: Split into subtopics
3. When pattern appears in multiple files: Consolidate with cross-reference
4. Update this INDEX.md with new file locations and coverage
5. Update MEMORY.md entry point with latest pointer

---

## QUICK START FOR NEW SESSIONS

1. **Want .NET/Blazor patterns?** → Read `dotnet_quick_reference.md` (2 min)
2. **Need deep dive?** → Read `dotnet_blazor_research.md` (20 min)
3. **Looking for something else?** → Check this index
4. **Found new pattern?** → Add to appropriate file and update INDEX.md

---

## Cross-References

- **Blazor + MUI**: See both `dotnet_blazor_research.md` and `mui-research-findings.md`
- **Microservices + Agents**: See `dotnet_blazor_research.md` Section 3 + `agentic_design_patterns.md`
- **Real-time + Diagrams**: See `dotnet_blazor_research.md` Section 8 + `drawio-reference.md`
- **System Design**: See `dotnet_blazor_research.md` Section 3 (architecture diagram) + `drawio-reference.md`
