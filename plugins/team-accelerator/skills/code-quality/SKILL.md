---
name: Code Quality
description: Expertise in automated testing, code review practices, and quality standards enforcement. Activates when working with "lint", "test", "review", "coverage", "quality", "standards", or test automation.
version: 1.0.0
---

# Code Quality Skill

## Overview

Establish and maintain high code quality standards through comprehensive testing strategies, automated quality gates, and systematic code review practices. This skill encompasses unit testing, integration testing, end-to-end testing with Playwright and Selenium, linting, code coverage analysis, and quality metrics enforcement.

## Core Competencies

### Testing Strategy

**Design Test Pyramid:**

Implement a balanced testing strategy with proper distribution:

- **70% Unit Tests** - Fast, isolated, testing individual functions and components
- **20% Integration Tests** - Testing component interactions and API contracts
- **10% End-to-End Tests** - Testing critical user journeys and workflows

**Unit Testing Best Practices:**

Write focused, maintainable unit tests using the AAA pattern (Arrange, Act, Assert):

```typescript
// user.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as unknown as UserRepository;

    userService = new UserService(userRepository);
  });

  describe('getUserById', () => {
    it('should return user when user exists', async () => {
      // Arrange
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById('1');

      // Assert
      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('1');
      expect(userRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw error when user does not exist', async () => {
      // Arrange
      vi.mocked(userRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserById('1')).rejects.toThrow('User not found');
    });
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'Jane Doe', email: 'jane@example.com' };
      const savedUser = { id: '2', ...userData };
      vi.mocked(userRepository.save).mockResolvedValue(savedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(savedUser);
      expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining(userData));
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidData = { name: 'Jane Doe', email: 'invalid-email' };

      // Act & Assert
      await expect(userService.createUser(invalidData)).rejects.toThrow('Invalid email format');
    });
  });
});
```

**Integration Testing Patterns:**

Test component interactions and external service integration:

```typescript
// api.integration.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { DatabaseConnection } from '../database';

describe('User API Integration Tests', () => {
  let app: Express.Application;
  let db: DatabaseConnection;

  beforeAll(async () => {
    // Setup test database
    db = await DatabaseConnection.connect({
      host: 'localhost',
      database: 'test_db',
    });

    await db.migrate();
    app = createApp(db);
  });

  afterAll(async () => {
    await db.cleanup();
    await db.disconnect();
  });

  describe('POST /api/users', () => {
    it('should create new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'john@example.com', // Duplicate from previous test
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Email already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Create user first
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'Test User', email: 'test@example.com', password: 'Pass123!' });

      const userId = createResponse.body.id;

      // Fetch user
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });
});
```

### End-to-End Testing

**Playwright Testing Framework:**

Implement comprehensive E2E tests with Playwright for modern web applications:

```typescript
// tests/e2e/user-journey.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('User Registration and Login Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('https://app.example.com');
  });

  test('complete user registration journey', async () => {
    // Navigate to registration
    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*\/register/);

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('text=Welcome, Test User')).toBeVisible();
  });

  test('login with valid credentials', async () => {
    // Navigate to login
    await page.click('text=Log In');

    // Fill login form
    await page.fill('input[name="email"]', 'existing@example.com');
    await page.fill('input[name="password"]', 'KnownPassword123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify dashboard access
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('display validation errors for invalid input', async () => {
    await page.click('text=Sign Up');

    // Fill invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'weak');

    // Try to submit
    await page.click('button[type="submit"]');

    // Verify error messages
    await expect(page.locator('text=Invalid email format')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('handle network errors gracefully', async () => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.click('text=Log In');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Verify error handling
    await expect(page.locator('text=Network error. Please check your connection.')).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);
  });
});

test.describe('E-commerce Shopping Flow', () => {
  test.use({ storageState: 'tests/auth/user.json' }); // Use authenticated state

  test('complete purchase journey', async ({ page }) => {
    // Browse products
    await page.goto('/products');
    await page.click('[data-testid="product-card"]:first-child');

    // Add to cart
    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

    // View cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);

    // Proceed to checkout
    await page.click('button:has-text("Checkout")');

    // Fill shipping information
    await page.fill('input[name="address"]', '123 Main St');
    await page.fill('input[name="city"]', 'San Francisco');
    await page.fill('input[name="zipCode"]', '94102');

    // Select shipping method
    await page.click('input[value="express"]');

    // Continue to payment
    await page.click('button:has-text("Continue to Payment")');

    // Fill payment details (test mode)
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="expiry"]', '12/25');
    await page.fill('input[name="cvv"]', '123');

    // Place order
    await page.click('button:has-text("Place Order")');

    // Verify success
    await expect(page).toHaveURL(/.*\/order\/success/);
    await expect(page.locator('text=Order Confirmed')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
  });
});

// Playwright configuration
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
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Selenium Testing Patterns:**

Implement Selenium tests for legacy or cross-browser scenarios:

```typescript
// tests/selenium/login.spec.ts
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';

describe('Selenium E2E Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const options = new ChromeOptions();
    if (process.env.CI) {
      options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
    }

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  afterAll(async () => {
    await driver.quit();
  });

  test('user can login successfully', async () => {
    // Navigate to login page
    await driver.get('http://localhost:3000/login');

    // Wait for page load
    await driver.wait(until.elementLocated(By.name('email')), 5000);

    // Fill form
    await driver.findElement(By.name('email')).sendKeys('test@example.com');
    await driver.findElement(By.name('password')).sendKeys('Password123!');

    // Submit
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Wait for navigation
    await driver.wait(until.urlContains('/dashboard'), 5000);

    // Verify success
    const welcomeText = await driver.findElement(By.css('.welcome-message')).getText();
    expect(welcomeText).toContain('Welcome');
  });
});
```

### Code Quality Gates

**Linting Configuration:**

Enforce consistent code style with ESLint:

```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "import", "prettier"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": { "order": "asc" }
      }
    ],
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prettier/prettier": "error"
  },
  "overrides": [
    {
      "files": ["*.spec.ts", "*.test.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

**Code Coverage Requirements:**

Configure coverage thresholds to maintain quality standards:

```json
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.config.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

**Pre-commit Quality Checks:**

Use Husky and lint-staged for automatic quality enforcement:

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "vitest related --run --coverage"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  },
  "scripts": {
    "prepare": "husky install",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit"
  }
}

// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

### Code Review Practices

**Pull Request Templates:**

Standardize PR descriptions for thorough reviews:

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->
## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues
<!-- Link to related issues using #issue_number -->
Closes #

## How Has This Been Tested?
<!-- Describe the tests you ran to verify your changes -->
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
- [ ] I have checked my code and corrected any misspellings

## Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

## Additional Notes
<!-- Any additional information that reviewers should know -->
```

**Automated Review Comments:**

Use GitHub Actions to provide automated feedback:

```yaml
# .github/workflows/pr-review.yml
name: PR Review Automation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check PR size
        uses: actions/github-script@v7
        with:
          script: |
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
            });

            const additions = files.reduce((sum, file) => sum + file.additions, 0);

            if (additions > 500) {
              github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: '⚠️ This PR is quite large (${additions} additions). Consider breaking it into smaller PRs for easier review.',
              });
            }

      - name: Check test coverage
        run: |
          npm ci
          npm run test:coverage

      - name: Comment coverage report
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Quality Metrics

**Establish Quality Standards:**

Define and track key quality metrics:

1. **Code Coverage** - Minimum 80% line coverage, 75% branch coverage
2. **Test Pass Rate** - 100% of tests must pass before merge
3. **Linting Violations** - Zero linting errors allowed
4. **Technical Debt** - Track and reduce SonarQube debt ratio
5. **Code Duplication** - Keep below 3% duplication
6. **Cyclomatic Complexity** - Maximum 10 per function
7. **PR Review Time** - Target < 24 hours for initial review
8. **Bug Escape Rate** - Track bugs found in production vs. development

**Quality Dashboard:**

Monitor quality trends with SonarQube or similar tools:

```yaml
# sonar-project.properties
sonar.projectKey=my-project
sonar.organization=my-org
sonar.sources=src
sonar.tests=tests
sonar.test.inclusions=**/*.spec.ts,**/*.test.ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.coverage.exclusions=**/*.spec.ts,**/*.test.ts,**/*.config.ts
sonar.cpd.exclusions=**/*.spec.ts,**/*.test.ts

# Quality gates
sonar.qualitygate.wait=true
sonar.qualitygate.timeout=300
```

## Related Resources

- **DevOps Practices Skill** - For CI/CD pipeline integration with quality gates
- **Documentation Patterns Skill** - For test documentation and reporting
- **Workflow Automation Skill** - For automating quality checks in pipelines
- **Playwright Documentation** - https://playwright.dev
- **Vitest Documentation** - https://vitest.dev
- **ESLint Rules** - https://eslint.org/docs/rules/
