---
description: Run test suites including unit tests, integration tests, E2E tests (Playwright/Selenium), and generate coverage reports
arguments:
  - name: type
    description: "Test type: all, unit, integration, e2e, or smoke"
    required: false
  - name: coverage
    description: "Generate coverage report: true or false (default: true)"
    required: false
  - name: watch
    description: "Run in watch mode: true or false (default: false)"
    required: false
---

# Test Command

Execute comprehensive test suites with support for multiple testing frameworks and detailed coverage reporting.

## Usage

```bash
/test [type] [--coverage] [--watch]
```

## Examples

```bash
# Run all tests with coverage
/test

# Run only unit tests
/test unit

# Run E2E tests with Playwright
/test e2e

# Run integration tests
/test integration

# Watch mode for development
/test unit --watch

# Quick smoke tests
/test smoke
```

## Execution Flow

### 1. Detect Test Framework

```bash
# Detect available test frameworks
if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
  E2E_FRAMEWORK="playwright"
elif [ -f "cypress.config.ts" ] || [ -f "cypress.config.js" ]; then
  E2E_FRAMEWORK="cypress"
elif [ -f "selenium" ] || grep -q "selenium" package.json 2>/dev/null; then
  E2E_FRAMEWORK="selenium"
fi

if grep -q "jest" package.json 2>/dev/null; then
  UNIT_FRAMEWORK="jest"
elif grep -q "vitest" package.json 2>/dev/null; then
  UNIT_FRAMEWORK="vitest"
elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
  UNIT_FRAMEWORK="pytest"
elif [ -f "go.mod" ]; then
  UNIT_FRAMEWORK="go"
fi
```

### 2. Unit Tests

#### JavaScript/TypeScript (Jest)
```bash
# Run Jest with coverage
npx jest --coverage --coverageReporters=text,lcov,html \
  --testPathPattern=".*\\.test\\.(ts|tsx|js|jsx)$" \
  ${WATCH_FLAG}

# Generate coverage badge
npx coverage-badge-creator
```

#### JavaScript/TypeScript (Vitest)
```bash
# Run Vitest
npx vitest run --coverage ${WATCH_FLAG}
```

#### Python (pytest)
```bash
# Run pytest with coverage
pytest tests/unit/ \
  --cov=src \
  --cov-report=term-missing \
  --cov-report=html:coverage-report \
  --cov-report=xml:coverage.xml \
  -v
```

#### Go
```bash
# Run Go tests with coverage
go test -v -cover -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
```

### 3. Integration Tests

```bash
# JavaScript/TypeScript
npx jest --testPathPattern=".*\\.integration\\.(ts|tsx|js|jsx)$" \
  --setupFilesAfterEnv=./tests/integration/setup.ts

# Python
pytest tests/integration/ -v --tb=short

# Go
go test -v -tags=integration ./...

# With Docker services
docker-compose -f docker-compose.test.yml up -d
npm run test:integration
docker-compose -f docker-compose.test.yml down
```

### 4. E2E Tests

#### Playwright
```bash
# Install browsers if needed
npx playwright install

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run headed for visual debugging
npx playwright test --headed

# Generate report
npx playwright show-report
```

#### Selenium
```bash
# Start Selenium Grid (if using)
docker-compose -f selenium-grid.yml up -d

# Run Selenium tests
npm run test:selenium

# Or with specific browser
BROWSER=chrome npm run test:selenium
BROWSER=firefox npm run test:selenium

# Stop Selenium Grid
docker-compose -f selenium-grid.yml down
```

#### Cross-browser Testing
```bash
# Playwright cross-browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Selenium cross-browser
for browser in chrome firefox safari edge; do
  BROWSER=$browser npm run test:selenium
done
```

### 5. Smoke Tests

```bash
# Quick health check tests
npm run test:smoke

# Or with specific endpoints
curl -f ${APP_URL}/health || exit 1
curl -f ${APP_URL}/ready || exit 1

# Basic functionality checks
npx playwright test tests/smoke/ --timeout=30000
```

### 6. Coverage Analysis

```bash
# Merge coverage reports
npx nyc merge .nyc_output coverage/merged.json

# Generate combined report
npx nyc report --reporter=lcov --reporter=text-summary

# Check coverage thresholds
npx nyc check-coverage \
  --lines 80 \
  --functions 80 \
  --branches 80 \
  --statements 80

# Upload to Codecov
bash <(curl -s https://codecov.io/bash) -t ${CODECOV_TOKEN}

# Or upload to SonarQube
sonar-scanner \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### 7. Test Reports

```bash
# Generate JUnit XML for CI
npx jest --reporters=default --reporters=jest-junit

# HTML report
npx jest-html-reporter

# Allure report
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

## Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
};
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Harness Pipeline
```yaml
- step:
    type: Run
    name: Run Tests
    identifier: run_tests
    spec:
      shell: Bash
      command: |
        npm ci
        npm run test:unit -- --coverage
        npm run test:integration
        npx playwright install --with-deps
        npm run test:e2e
```

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                      TEST RESULTS                             ║
╠══════════════════════════════════════════════════════════════╣
║ Project: ${PROJECT_NAME}                                      ║
║ Date: ${DATE}                                                 ║
║ Duration: 2m 34s                                              ║
╠══════════════════════════════════════════════════════════════╣
║ UNIT TESTS                                                    ║
║   Total:   156                                                ║
║   Passed:  154  ✅                                            ║
║   Failed:  2    ❌                                            ║
║   Skipped: 0                                                  ║
║   Time:    45s                                                ║
╠══════════════════════════════════════════════════════════════╣
║ INTEGRATION TESTS                                             ║
║   Total:   32                                                 ║
║   Passed:  32   ✅                                            ║
║   Time:    1m 12s                                             ║
╠══════════════════════════════════════════════════════════════╣
║ E2E TESTS (Playwright)                                        ║
║   Total:   24                                                 ║
║   Passed:  24   ✅                                            ║
║   Browsers: Chromium, Firefox, WebKit                         ║
║   Time:    37s                                                ║
╠══════════════════════════════════════════════════════════════╣
║ COVERAGE                                                      ║
║   Lines:      85.2%  ✅ (target: 80%)                        ║
║   Functions:  82.1%  ✅ (target: 80%)                        ║
║   Branches:   78.4%  ⚠️ (target: 80%)                        ║
║   Statements: 84.8%  ✅ (target: 80%)                        ║
╠══════════════════════════════════════════════════════════════╣
║ OVERALL: ⚠️ 2 FAILED TESTS                                   ║
╚══════════════════════════════════════════════════════════════╝

Failed Tests:
  ❌ src/services/auth.test.ts > should handle token expiry
  ❌ src/services/auth.test.ts > should refresh tokens
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BASE_URL` | Application URL for E2E tests | For E2E |
| `CI` | CI environment flag | Auto-detected |
| `CODECOV_TOKEN` | Codecov upload token | For coverage |
| `TEST_DATABASE_URL` | Test database connection | For integration |

## Related Commands

- `/quality` - Run code quality checks
- `/deploy` - Deploy after tests pass
- `/status` - View test trends
