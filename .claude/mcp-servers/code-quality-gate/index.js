#!/usr/bin/env node
/**
 * Code Quality Gate MCP Server
 *
 * Automated quality checks with scoring:
 *   - quality_check: Run a full quality gate (typecheck, lint, tests, security scan)
 *   - quality_typecheck: Check TypeScript compilation errors
 *   - quality_lint: Run ESLint and return issues
 *   - quality_security_scan: Scan for security patterns (secrets, injection, XSS)
 *   - quality_score: Calculate an overall quality score for recent changes
 *   - quality_pre_commit: Run pre-commit quality gate (blocks if score too low)
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function exec(cmd, timeout = 60000) {
  try { return { ok: true, output: execSync(cmd, { cwd: PROJECT_DIR, encoding: 'utf-8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim() }; }
  catch (e) { return { ok: false, output: (e.stdout || '') + '\n' + (e.stderr || ''), code: e.status }; }
}

// Security patterns to scan for
const SECURITY_PATTERNS = [
  { name: 'hardcoded-secret', pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/gi, severity: 'critical' },
  { name: 'sql-injection', pattern: /(\$\{.*\}|` ?\+.*\+).*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi, severity: 'critical' },
  { name: 'command-injection', pattern: /exec\(.*\$\{|execSync\(.*\+|child_process.*\$\{/gi, severity: 'high' },
  { name: 'eval-usage', pattern: /\beval\s*\(/g, severity: 'high' },
  { name: 'xss-risk', pattern: /innerHTML\s*=|dangerouslySetInnerHTML|document\.write\(/g, severity: 'medium' },
  { name: 'insecure-random', pattern: /Math\.random\(\)/g, severity: 'low' },
  { name: 'console-log', pattern: /console\.(log|debug|info)\(/g, severity: 'info' },
  { name: 'todo-fixme', pattern: /\b(TODO|FIXME|HACK|XXX)\b/g, severity: 'info' }
];

function scanSecurityPatterns(files) {
  const findings = [];
  for (const file of files) {
    const abs = join(PROJECT_DIR, file);
    if (!existsSync(abs)) continue;
    try {
      const content = readFileSync(abs, 'utf-8');
      const lines = content.split('\n');
      for (const pattern of SECURITY_PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
          const matches = lines[i].match(pattern.pattern);
          if (matches) {
            findings.push({ file, line: i + 1, pattern: pattern.name, severity: pattern.severity, match: matches[0].substring(0, 80) });
          }
        }
      }
    } catch {}
  }
  return findings;
}

function calculateScore(typecheck, lint, security, tests) {
  let score = 100;

  // TypeScript errors: -5 per error
  if (!typecheck.ok) {
    const errorCount = (typecheck.output.match(/error TS/g) || []).length;
    score -= Math.min(errorCount * 5, 30);
  }

  // Lint errors: -2 per error, -1 per warning
  if (!lint.ok) {
    const errors = (lint.output.match(/\d+ error/g) || []).reduce((sum, m) => sum + parseInt(m), 0);
    const warnings = (lint.output.match(/\d+ warning/g) || []).reduce((sum, m) => sum + parseInt(m), 0);
    score -= Math.min(errors * 2 + warnings, 20);
  }

  // Security: -15 critical, -10 high, -5 medium
  const criticals = security.filter(f => f.severity === 'critical').length;
  const highs = security.filter(f => f.severity === 'high').length;
  const mediums = security.filter(f => f.severity === 'medium').length;
  score -= criticals * 15 + highs * 10 + mediums * 5;

  // Tests: -20 if failing
  if (tests && !tests.ok) score -= 20;

  return Math.max(0, Math.min(100, score));
}

function handleRequest(request) {
  const { method, params, id } = request;

  if (method === 'initialize') {
    return { jsonrpc: '2.0', id, result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'code-quality-gate', version: '1.0.0' }
    }};
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: [
      {
        name: 'quality_check',
        description: 'Run a complete quality gate: TypeScript check, ESLint, security scan, and optional tests. Returns pass/fail with score.',
        inputSchema: { type: 'object', properties: {
          run_tests: { type: 'boolean', description: 'Also run tests (slower, default false)' },
          threshold: { type: 'number', description: 'Minimum score to pass (default 70)' },
          files: { type: 'array', items: { type: 'string' }, description: 'Specific files to check (default: git staged/changed files)' }
        }}
      },
      {
        name: 'quality_typecheck',
        description: 'Run TypeScript compilation check. Returns errors with file locations.',
        inputSchema: { type: 'object', properties: {
          tsconfig: { type: 'string', description: 'Path to tsconfig.json (default: auto-detect)' }
        }}
      },
      {
        name: 'quality_lint',
        description: 'Run ESLint on changed files. Returns errors and warnings with fix suggestions.',
        inputSchema: { type: 'object', properties: {
          files: { type: 'array', items: { type: 'string' }, description: 'Files to lint (default: git changed files)' },
          fix: { type: 'boolean', description: 'Auto-fix fixable issues (default false)' }
        }}
      },
      {
        name: 'quality_security_scan',
        description: 'Scan code for security vulnerabilities: hardcoded secrets, SQL injection, XSS, eval usage, command injection.',
        inputSchema: { type: 'object', properties: {
          files: { type: 'array', items: { type: 'string' }, description: 'Files to scan (default: git changed files)' },
          severity_filter: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'all'], description: 'Minimum severity (default: medium)' }
        }}
      },
      {
        name: 'quality_score',
        description: 'Calculate quality score (0-100) for the current changes without running full checks. Fast estimation based on git diff analysis.',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'quality_pre_commit',
        description: 'Pre-commit quality gate. Returns pass/fail with detailed report. Use before git commit to ensure code quality.',
        inputSchema: { type: 'object', properties: {
          threshold: { type: 'number', description: 'Minimum score to pass (default 60)' }
        }}
      }
    ]}};
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      let result;

      switch (name) {
        case 'quality_check': {
          const changedFiles = (args.files || (exec('git diff --name-only HEAD 2>/dev/null || git diff --name-only --staged').output || '')).toString().split('\n').filter(f => f.trim());
          const codeFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx|py)$/.test(f));

          const typecheck = existsSync(join(PROJECT_DIR, 'tsconfig.json')) ? exec('npx tsc --noEmit 2>&1') : { ok: true, output: 'No tsconfig.json' };
          const lint = codeFiles.length > 0 && existsSync(join(PROJECT_DIR, 'node_modules', '.bin', 'eslint'))
            ? exec(`npx eslint ${codeFiles.join(' ')} 2>&1`)
            : { ok: true, output: 'No eslint or no code files' };
          const security = scanSecurityPatterns(codeFiles);
          const tests = args.run_tests ? exec('npm test 2>&1', 120000) : null;

          const score = calculateScore(typecheck, lint, security, tests);
          const threshold = args.threshold || 70;

          result = {
            passed: score >= threshold,
            score,
            threshold,
            files_checked: codeFiles.length,
            typecheck: { ok: typecheck.ok, errors: typecheck.ok ? 0 : (typecheck.output.match(/error TS/g) || []).length, output: typecheck.output.substring(0, 2000) },
            lint: { ok: lint.ok, output: lint.output.substring(0, 2000) },
            security: { critical: security.filter(f => f.severity === 'critical').length, high: security.filter(f => f.severity === 'high').length, medium: security.filter(f => f.severity === 'medium').length, findings: security.filter(f => ['critical', 'high', 'medium'].includes(f.severity)).slice(0, 20) },
            tests: tests ? { ok: tests.ok, output: tests.output.substring(0, 1000) } : 'skipped'
          };
          break;
        }

        case 'quality_typecheck': {
          const tsconfig = args.tsconfig || 'tsconfig.json';
          if (!existsSync(join(PROJECT_DIR, tsconfig))) { result = { error: `${tsconfig} not found` }; break; }
          const check = exec(`npx tsc --noEmit -p ${tsconfig} 2>&1`);
          const errors = (check.output.match(/error TS\d+/g) || []);
          result = { ok: check.ok, error_count: errors.length, unique_errors: [...new Set(errors)], output: check.output.substring(0, 3000) };
          break;
        }

        case 'quality_lint': {
          const files = args.files || (exec('git diff --name-only HEAD 2>/dev/null || git diff --name-only --staged').output || '').split('\n').filter(f => /\.(ts|tsx|js|jsx)$/.test(f.trim()));
          if (files.length === 0) { result = { ok: true, message: 'No lintable files changed' }; break; }
          const fixFlag = args.fix ? '--fix' : '';
          const lint = exec(`npx eslint ${fixFlag} ${files.join(' ')} 2>&1`);
          result = { ok: lint.ok, files_checked: files.length, output: lint.output.substring(0, 3000) };
          break;
        }

        case 'quality_security_scan': {
          const files = args.files || (exec('git diff --name-only HEAD 2>/dev/null || git diff --name-only --staged').output || '').split('\n').filter(f => /\.(ts|tsx|js|jsx|py|sh)$/.test(f.trim()));
          const minSeverity = ['critical', 'high', 'medium', 'low', 'info'].indexOf(args.severity_filter || 'medium');
          const findings = scanSecurityPatterns(files);
          const filtered = findings.filter(f => ['critical', 'high', 'medium', 'low', 'info'].indexOf(f.severity) <= minSeverity);

          result = {
            files_scanned: files.length,
            total_findings: filtered.length,
            by_severity: {
              critical: filtered.filter(f => f.severity === 'critical').length,
              high: filtered.filter(f => f.severity === 'high').length,
              medium: filtered.filter(f => f.severity === 'medium').length,
              low: filtered.filter(f => f.severity === 'low').length,
              info: filtered.filter(f => f.severity === 'info').length
            },
            findings: filtered.slice(0, 30)
          };
          break;
        }

        case 'quality_score': {
          const diff = exec('git diff --stat HEAD 2>/dev/null || git diff --stat --staged');
          const changedFiles = (exec('git diff --name-only HEAD 2>/dev/null || git diff --name-only --staged').output || '').split('\n').filter(Boolean);
          const codeFiles = changedFiles.filter(f => /\.(ts|tsx|js|jsx|py)$/.test(f));
          const testFiles = changedFiles.filter(f => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f));

          let score = 80; // Base score
          if (testFiles.length > 0) score += 10; // Bonus for including tests
          if (codeFiles.length > 10) score -= 10; // Penalty for large changes
          if (changedFiles.some(f => f.includes('.env') || f.includes('secret'))) score -= 20;

          result = {
            estimated_score: Math.max(0, Math.min(100, score)),
            files_changed: changedFiles.length,
            code_files: codeFiles.length,
            test_files: testFiles.length,
            has_tests: testFiles.length > 0,
            note: 'This is a fast estimate. Run quality_check for a precise score.'
          };
          break;
        }

        case 'quality_pre_commit': {
          const threshold = args.threshold || 60;
          const files = (exec('git diff --staged --name-only').output || '').split('\n').filter(Boolean);
          const codeFiles = files.filter(f => /\.(ts|tsx|js|jsx|py)$/.test(f));

          const typecheck = existsSync(join(PROJECT_DIR, 'tsconfig.json')) ? exec('npx tsc --noEmit 2>&1') : { ok: true, output: '' };
          const security = scanSecurityPatterns(codeFiles);
          const criticals = security.filter(f => f.severity === 'critical');

          let score = 100;
          if (!typecheck.ok) score -= 20;
          score -= criticals.length * 15;
          score -= security.filter(f => f.severity === 'high').length * 10;
          score = Math.max(0, score);

          const passed = score >= threshold && criticals.length === 0;
          result = {
            gate: passed ? 'PASS' : 'FAIL',
            score,
            threshold,
            staged_files: files.length,
            code_files: codeFiles.length,
            typecheck_ok: typecheck.ok,
            critical_security: criticals.length,
            blockers: [
              ...(!typecheck.ok ? ['TypeScript compilation errors'] : []),
              ...(criticals.length > 0 ? [`${criticals.length} critical security finding(s)`] : []),
              ...(score < threshold ? [`Score ${score} below threshold ${threshold}`] : [])
            ],
            security_findings: security.filter(f => ['critical', 'high'].includes(f.severity)).slice(0, 10)
          };
          break;
        }

        default:
          result = { error: `Unknown tool: ${name}` };
      }

      return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] } };
    } catch (err) {
      return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true } };
    }
  }

  if (!id) return null;
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  while (true) {
    const idx = buffer.indexOf('\n');
    if (idx === -1) break;
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    try {
      const resp = handleRequest(JSON.parse(line));
      if (resp) process.stdout.write(JSON.stringify(resp) + '\n');
    } catch {}
  }
});
process.stderr.write('Code Quality Gate MCP server started\n');
