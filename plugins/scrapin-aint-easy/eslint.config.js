// ESLint flat config (ESLint 9+).
//
// Started conservative after the 7-agent council's S8 finding that no lint
// step existed. Runs via `pnpm lint` (non-blocking) or `pnpm run ci` (gated).
// After `pnpm install` picks up the new devDependencies, `pnpm lint` should
// work without additional setup.

import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'dist/**',
      'data/**',
      'coverage/**',
      'node_modules/**',
      '**/*.d.ts',
    ],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Catch the low-hanging stuff the council flagged:
      // - unused locals (we hit this repeatedly via `noUnusedLocals` already,
      //   but ESLint catches patterns tsc misses — e.g. unused catch clause
      //   variables that the compiler allows).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Force awaits on promises; catches the class of bugs where a promise
      // is fired-and-forgotten (e.g. telemetry writes that should be awaited).
      '@typescript-eslint/no-floating-promises': 'warn',
      // Shell-adjacent: string literals that look like commands should use
      // template literals with explicit interpolation, not concatenation —
      // the S1 / A-S1 injection bugs went through concatenation.
      '@typescript-eslint/restrict-template-expressions': 'off', // too noisy; enable after a first pass
      // `any` is a smell — but several vendor seams (puppeteer, kuzu types)
      // use unknown / any pragmatically. Warn, don't error, until those
      // vendor-type issues are replaced.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Standard hygiene
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'multi-line'],
    },
  },
  {
    // Tests: relaxed — assertion DSLs love any-typed helpers.
    files: ['tests/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
