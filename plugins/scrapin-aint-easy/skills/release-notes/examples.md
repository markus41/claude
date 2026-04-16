# Release Notes Examples

## Good Example

```markdown
## [1.2.0]

### Added
- Algorithm library with 7 indexed sources (TheAlgorithms, Refactoring Guru, NeetCode, etc.)
- Agent drift detection with cross-agent contradiction checking
- `/scrapin-algo` command for querying algorithm library

### Changed
- Crawler now supports OpenAPI spec parsing for automatic API endpoint documentation
- Vector search uses HNSW index for 10x faster approximate nearest neighbor queries

### Fixed
- Sitemap parser now handles sitemap index files (sitemaps pointing to other sitemaps)
- Rate limiter correctly resets token bucket after idle periods

### Security
- MCP tool inputs now validated with Zod schemas before processing
```
