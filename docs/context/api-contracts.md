# API Contracts

## MCP Tool Interfaces

Each MCP server exposes tools via the Model Context Protocol (JSON-RPC over stdio).

### deploy-intelligence

| Tool | Parameters | Returns |
|------|-----------|---------|
| `deploy_audit` | <!-- Fill in --> | <!-- Fill in --> |
| `deploy_build_log` | <!-- Fill in --> | <!-- Fill in --> |
| `deploy_helm_releases` | <!-- Fill in --> | <!-- Fill in --> |
| `deploy_image_history` | <!-- Fill in --> | <!-- Fill in --> |
| `deploy_k8s_images` | <!-- Fill in --> | <!-- Fill in --> |
| `deploy_record_build` | <!-- Fill in --> | <!-- Fill in --> |
| `deploy_volumes` | <!-- Fill in --> | <!-- Fill in --> |

### lessons-learned

| Tool | Parameters | Returns |
|------|-----------|---------|
| `lessons_add` | <!-- Fill in --> | <!-- Fill in --> |
| `lessons_search` | <!-- Fill in --> | <!-- Fill in --> |
| `lessons_resolve` | <!-- Fill in --> | <!-- Fill in --> |
| `lessons_patterns` | <!-- Fill in --> | <!-- Fill in --> |
| `lessons_stats` | <!-- Fill in --> | <!-- Fill in --> |

### code-quality-gate

| Tool | Parameters | Returns |
|------|-----------|---------|
| `quality_check` | <!-- Fill in --> | <!-- Fill in --> |
| `quality_lint` | <!-- Fill in --> | <!-- Fill in --> |
| `quality_typecheck` | <!-- Fill in --> | <!-- Fill in --> |
| `quality_security_scan` | <!-- Fill in --> | <!-- Fill in --> |
| `quality_score` | <!-- Fill in --> | <!-- Fill in --> |
| `quality_pre_commit` | <!-- Fill in --> | <!-- Fill in --> |

<!-- Fill in: project-metrics, workflow-bridge tool tables -->

## Plugin Registry API

<!-- Fill in: How plugins are queried, installed, and removed programmatically -->
