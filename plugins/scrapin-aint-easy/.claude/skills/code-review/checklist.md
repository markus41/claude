# Code Review Checklist

## Correctness
- [ ] Logic matches the stated intent
- [ ] Edge cases handled (null, empty, boundary values)
- [ ] Error paths tested and handled
- [ ] No off-by-one errors

## Security
- [ ] No hardcoded secrets or credentials
- [ ] User inputs validated and sanitized
- [ ] No path traversal vulnerabilities
- [ ] API keys from environment variables only

## Performance
- [ ] No unnecessary re-renders (React)
- [ ] No N+1 query patterns
- [ ] Large data sets paginated
- [ ] Async operations properly awaited

## Maintainability
- [ ] Functions under 50 lines
- [ ] Clear naming (no abbreviations without context)
- [ ] No dead code or commented-out blocks
- [ ] Types are specific (no `any`)

## Testing
- [ ] New code has corresponding tests
- [ ] Edge cases have regression tests
- [ ] Tests are deterministic (no flaky timing)

## Documentation
- [ ] Public APIs have descriptions
- [ ] Complex logic has explanatory comments
- [ ] Breaking changes noted
