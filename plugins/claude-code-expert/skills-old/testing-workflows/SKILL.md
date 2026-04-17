# Claude Code Testing Workflows

Complete guide to testing patterns, TDD, and test execution within Claude Code.

## Test Execution

### Running Tests
```bash
# Common test commands
npm test
pnpm test
yarn test
bun test
pytest
go test ./...
cargo test

# Single test file
npm test -- path/to/test.ts
pytest path/to/test.py

# Pattern matching
npm test -- --grep "authentication"
pytest -k "test_auth"

# Watch mode
npm test -- --watch
pytest --watch
```

### Claude's Testing Protocol

1. **Before committing**: Always run relevant tests
2. **After implementing**: Run tests to verify
3. **When debugging**: Run specific failing test first
4. **TDD approach**: Write test → run (fail) → implement → run (pass)

## Test-Driven Development (TDD) Pattern

### Step 1: Write the Test First
```typescript
// auth.test.ts
describe('authenticateUser', () => {
  it('should return user for valid credentials', async () => {
    const result = await authenticateUser('valid@email.com', 'password123');
    expect(result).toMatchObject({
      id: expect.any(String),
      email: 'valid@email.com',
    });
  });

  it('should throw for invalid credentials', async () => {
    await expect(
      authenticateUser('bad@email.com', 'wrong')
    ).rejects.toThrow('Invalid credentials');
  });
});
```

### Step 2: Run Test (Expect Failure)
```bash
npm test -- auth.test.ts
# FAIL: authenticateUser is not defined
```

### Step 3: Implement
```typescript
// auth.ts
export async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    throw new Error('Invalid credentials');
  }
  return { id: user.id, email: user.email };
}
```

### Step 4: Run Test (Expect Pass)
```bash
npm test -- auth.test.ts
# PASS
```

## Using Test-Writer Agent

Claude Code has a specialized test-writing agent:

```
Agent(
  subagent_type="test-writer",
  prompt="Write comprehensive tests for the authentication module in src/auth/",
  description="Write auth tests"
)
```

The test-writer agent:
- Reads the source code
- Identifies all functions/methods to test
- Generates test files with edge cases
- Handles mocking external dependencies
- Follows project test conventions

## Test Types

### Unit Tests
```typescript
// Test individual functions in isolation
describe('calculateTotal', () => {
  it('sums items correctly', () => {
    expect(calculateTotal([10, 20, 30])).toBe(60);
  });

  it('handles empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('handles negative values', () => {
    expect(calculateTotal([10, -5])).toBe(5);
  });
});
```

### Integration Tests
```typescript
// Test multiple components together
describe('POST /api/auth/login', () => {
  it('returns JWT for valid login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'pass123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
```

### End-to-End Tests
```typescript
// Test full user flows
describe('User Registration Flow', () => {
  it('allows user to register and login', async () => {
    // Register
    await page.goto('/register');
    await page.fill('#email', 'new@user.com');
    await page.fill('#password', 'secure123');
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Test Frameworks

### JavaScript/TypeScript
| Framework | Command | Config |
|-----------|---------|--------|
| Jest | `npx jest` | `jest.config.js` |
| Vitest | `npx vitest` | `vitest.config.ts` |
| Mocha | `npx mocha` | `.mocharc.yml` |
| Playwright | `npx playwright test` | `playwright.config.ts` |
| Cypress | `npx cypress run` | `cypress.config.js` |

### Python
| Framework | Command | Config |
|-----------|---------|--------|
| pytest | `pytest` | `pytest.ini` / `pyproject.toml` |
| unittest | `python -m unittest` | N/A |

### Other
| Language | Framework | Command |
|----------|-----------|---------|
| Go | testing | `go test ./...` |
| Rust | built-in | `cargo test` |
| Java | JUnit | `mvn test` / `gradle test` |

## Test Best Practices in Claude Code

1. **Write tests alongside code** — Not as an afterthought
2. **Descriptive names** — `it('should return 404 for non-existent user')` not `it('test 1')`
3. **Prefer real implementations** — Over excessive mocking
4. **Test edge cases** — Empty inputs, null values, boundary conditions
5. **Keep tests fast** — Mock external services, use in-memory databases
6. **One assertion per test** — When possible, for clear failure messages
7. **Run before commit** — Claude always runs tests before committing (when asked)

## Coverage

```bash
# JavaScript/TypeScript
npx jest --coverage
npx vitest --coverage
npx c8 npm test

# Python
pytest --cov=src --cov-report=html

# Go
go test -coverprofile=coverage.out ./...
```

## Debugging Failing Tests

Claude's approach to test failures:
1. Read the test file and understand intent
2. Read the error message carefully
3. Read the source code being tested
4. Identify the discrepancy
5. Fix either the test (if expectations are wrong) or the code (if logic is wrong)
6. Re-run the specific failing test
7. Run full test suite to check for regressions
