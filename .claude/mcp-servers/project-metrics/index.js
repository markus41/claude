#!/usr/bin/env node
/**
 * Project Metrics MCP Server
 *
 * Provides analytics and metrics for the project:
 *   - metrics_git_stats: Git repository statistics (commits, contributors, churn)
 *   - metrics_code_health: Code health indicators (file sizes, complexity proxies)
 *   - metrics_session_log: Track Claude Code session activity and productivity
 *   - metrics_dora: DORA-style metrics (deploy frequency, lead time, change failure rate)
 *   - metrics_hotspots: Identify code hotspots (files changed most with most bugs)
 *   - metrics_dependencies: Analyze dependency freshness and vulnerability counts
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const METRICS_DIR = join(PROJECT_DIR, '.claude', 'logs');
const SESSION_LOG = join(METRICS_DIR, 'session-metrics.jsonl');

function ensureDir(d) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }
ensureDir(METRICS_DIR);

function exec(cmd, timeout = 30000) {
  try { return execSync(cmd, { cwd: PROJECT_DIR, encoding: 'utf-8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim(); }
  catch (e) { return null; }
}

function readJSONL(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8').split('\n').filter(l => l.trim()).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function handleRequest(request) {
  const { method, params, id } = request;

  if (method === 'initialize') {
    return { jsonrpc: '2.0', id, result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'project-metrics', version: '1.0.0' }
    }};
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: [
      {
        name: 'metrics_git_stats',
        description: 'Git repository statistics: commit frequency, contributors, lines changed, branch activity. Useful for understanding project velocity.',
        inputSchema: { type: 'object', properties: {
          days: { type: 'number', description: 'Look back N days (default 30)' },
          author: { type: 'string', description: 'Filter by author name/email' }
        }}
      },
      {
        name: 'metrics_code_health',
        description: 'Code health indicators: large files, file count by type, directory sizes, test-to-code ratio.',
        inputSchema: { type: 'object', properties: {
          path: { type: 'string', description: 'Directory to analyze (default: project root)' },
          extensions: { type: 'array', items: { type: 'string' }, description: 'File extensions to focus on (e.g., [".ts", ".tsx"])' }
        }}
      },
      {
        name: 'metrics_session_log',
        description: 'Log or query Claude Code session activity. Track what was worked on, files changed, and outcomes.',
        inputSchema: { type: 'object', properties: {
          action: { type: 'string', enum: ['log', 'query', 'summary'], description: 'log=record activity, query=search history, summary=aggregate stats' },
          activity: { type: 'string', description: 'Activity description (for action=log)' },
          files_changed: { type: 'array', items: { type: 'string' }, description: 'Files modified (for action=log)' },
          outcome: { type: 'string', enum: ['success', 'partial', 'failed'], description: 'Outcome (for action=log)' },
          days: { type: 'number', description: 'Look back N days (for action=query/summary)' }
        }}
      },
      {
        name: 'metrics_dora',
        description: 'DORA-style metrics: deployment frequency (commits/deploys per day), lead time (commit to deploy), change failure rate (reverts/fixes ratio).',
        inputSchema: { type: 'object', properties: {
          days: { type: 'number', description: 'Analysis window in days (default 30)' }
        }}
      },
      {
        name: 'metrics_hotspots',
        description: 'Identify code hotspots: files with most changes, most bug fixes, and highest churn. These are the riskiest files.',
        inputSchema: { type: 'object', properties: {
          days: { type: 'number', description: 'Look back N days (default 90)' },
          limit: { type: 'number', description: 'Top N files (default 20)' }
        }}
      },
      {
        name: 'metrics_dependencies',
        description: 'Analyze project dependencies: count, outdated packages, and known vulnerabilities.',
        inputSchema: { type: 'object', properties: {
          package_manager: { type: 'string', enum: ['npm', 'pnpm', 'pip', 'auto'], description: 'Package manager (default: auto-detect)' }
        }}
      }
    ]}};
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      let result;

      switch (name) {
        case 'metrics_git_stats': {
          const days = args.days || 30;
          const since = `--since='${days} days ago'`;
          const authorFilter = args.author ? `--author='${args.author}'` : '';

          const commitCount = exec(`git log ${since} ${authorFilter} --oneline | wc -l`) || '0';
          const contributors = exec(`git log ${since} --format='%aN' | sort -u`) || '';
          const filesChanged = exec(`git log ${since} ${authorFilter} --pretty=format: --name-only | sort | uniq -c | sort -rn | head -20`) || '';
          const insertions = exec(`git log ${since} ${authorFilter} --pretty=format: --numstat | awk '{s+=$1} END {print s}'`) || '0';
          const deletions = exec(`git log ${since} ${authorFilter} --pretty=format: --numstat | awk '{s+=$2} END {print s}'`) || '0';
          const branches = exec(`git branch -a | wc -l`) || '0';
          const recentCommits = exec(`git log ${since} ${authorFilter} --oneline -10`) || '';
          const commitsPerDay = (parseInt(commitCount) / days).toFixed(1);

          result = {
            period_days: days,
            total_commits: parseInt(commitCount),
            commits_per_day: parseFloat(commitsPerDay),
            contributors: contributors.split('\n').filter(Boolean),
            lines_added: parseInt(insertions) || 0,
            lines_deleted: parseInt(deletions) || 0,
            net_change: (parseInt(insertions) || 0) - (parseInt(deletions) || 0),
            active_branches: parseInt(branches),
            most_changed_files: filesChanged.split('\n').filter(Boolean).slice(0, 15),
            recent_commits: recentCommits.split('\n').filter(Boolean)
          };
          break;
        }

        case 'metrics_code_health': {
          const targetPath = args.path || '.';
          const exts = args.extensions || ['.ts', '.tsx', '.js', '.jsx', '.py', '.sh', '.md'];

          const filesByExt = {};
          const largFiles = [];

          function walkDir(dir, depth = 0) {
            if (depth > 5 || dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist')) return;
            try {
              for (const entry of readdirSync(join(PROJECT_DIR, dir))) {
                const rel = join(dir, entry);
                const abs = join(PROJECT_DIR, rel);
                try {
                  const stat = statSync(abs);
                  if (stat.isDirectory()) { walkDir(rel, depth + 1); }
                  else {
                    const ext = extname(entry);
                    if (!filesByExt[ext]) filesByExt[ext] = { count: 0, totalSize: 0 };
                    filesByExt[ext].count++;
                    filesByExt[ext].totalSize += stat.size;
                    if (exts.includes(ext) && stat.size > 50000) {
                      largFiles.push({ file: rel, size: stat.size, sizeKB: Math.round(stat.size / 1024) });
                    }
                  }
                } catch {}
              }
            } catch {}
          }
          walkDir(targetPath);

          const testFiles = exec(`find ${targetPath} -name '*.test.*' -o -name '*.spec.*' -o -name '*_test.*' | grep -v node_modules | wc -l`) || '0';
          const srcFiles = exec(`find ${targetPath} \\( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' \\) | grep -v node_modules | grep -v test | grep -v spec | wc -l`) || '0';

          result = {
            files_by_extension: Object.entries(filesByExt).sort((a, b) => b[1].count - a[1].count).slice(0, 20).map(([ext, data]) => ({ ext, ...data, avgSizeKB: Math.round(data.totalSize / data.count / 1024) })),
            large_files: largFiles.sort((a, b) => b.size - a.size).slice(0, 15),
            test_to_code_ratio: `${testFiles}:${srcFiles}`,
            test_files: parseInt(testFiles),
            source_files: parseInt(srcFiles)
          };
          break;
        }

        case 'metrics_session_log': {
          if (args.action === 'log') {
            const entry = { timestamp: new Date().toISOString(), activity: args.activity, files_changed: args.files_changed || [], outcome: args.outcome || 'success' };
            const line = JSON.stringify(entry) + '\n';
            writeFileSync(SESSION_LOG, existsSync(SESSION_LOG) ? readFileSync(SESSION_LOG, 'utf-8') + line : line);
            result = { logged: true, entry };
          } else if (args.action === 'query') {
            const entries = readJSONL(SESSION_LOG);
            const cutoff = args.days ? new Date(Date.now() - args.days * 86400000).toISOString() : '1970-01-01';
            result = { entries: entries.filter(e => e.timestamp >= cutoff) };
          } else {
            const entries = readJSONL(SESSION_LOG);
            const cutoff = args.days ? new Date(Date.now() - (args.days || 7) * 86400000).toISOString() : '1970-01-01';
            const recent = entries.filter(e => e.timestamp >= cutoff);
            result = {
              total_sessions: recent.length,
              success: recent.filter(e => e.outcome === 'success').length,
              partial: recent.filter(e => e.outcome === 'partial').length,
              failed: recent.filter(e => e.outcome === 'failed').length,
              success_rate: recent.length ? (recent.filter(e => e.outcome === 'success').length / recent.length * 100).toFixed(1) + '%' : 'N/A',
              unique_files_touched: [...new Set(recent.flatMap(e => e.files_changed || []))].length
            };
          }
          break;
        }

        case 'metrics_dora': {
          const days = args.days || 30;
          const since = `--since='${days} days ago'`;

          const totalCommits = parseInt(exec(`git log ${since} --oneline | wc -l`) || '0');
          const deployCommits = parseInt(exec(`git log ${since} --oneline --grep='deploy\\|release\\|ship\\|helm' -i | wc -l`) || '0');
          const fixCommits = parseInt(exec(`git log ${since} --oneline --grep='fix\\|hotfix\\|revert\\|rollback' -i | wc -l`) || '0');
          const avgCommitMsg = exec(`git log ${since} --format='%s' | head -20`) || '';

          result = {
            period_days: days,
            deployment_frequency: {
              total_deploys: deployCommits,
              deploys_per_week: ((deployCommits / days) * 7).toFixed(1),
              rating: deployCommits / days >= 1 ? 'Elite' : deployCommits / days >= 1/7 ? 'High' : deployCommits / days >= 1/30 ? 'Medium' : 'Low'
            },
            change_failure_rate: {
              total_changes: totalCommits,
              fix_commits: fixCommits,
              rate: totalCommits ? (fixCommits / totalCommits * 100).toFixed(1) + '%' : 'N/A',
              rating: totalCommits && (fixCommits / totalCommits) <= 0.05 ? 'Elite' : (fixCommits / totalCommits) <= 0.10 ? 'High' : (fixCommits / totalCommits) <= 0.15 ? 'Medium' : 'Low'
            },
            velocity: {
              commits_per_day: (totalCommits / days).toFixed(1),
              total_commits: totalCommits
            },
            recent_deploy_commits: avgCommitMsg.split('\n').filter(l => /deploy|release|ship|helm/i.test(l)).slice(0, 5)
          };
          break;
        }

        case 'metrics_hotspots': {
          const days = args.days || 90;
          const limit = args.limit || 20;

          const churn = exec(`git log --since='${days} days ago' --pretty=format: --name-only | sort | uniq -c | sort -rn | head -${limit}`);
          const bugFixes = exec(`git log --since='${days} days ago' --grep='fix\\|bug\\|hotfix' -i --pretty=format: --name-only | sort | uniq -c | sort -rn | head -${limit}`);

          result = {
            period_days: days,
            most_changed_files: (churn || '').split('\n').filter(Boolean).map(l => {
              const m = l.trim().match(/^(\d+)\s+(.+)/);
              return m ? { changes: parseInt(m[1]), file: m[2] } : null;
            }).filter(Boolean),
            most_bug_fixed_files: (bugFixes || '').split('\n').filter(Boolean).map(l => {
              const m = l.trim().match(/^(\d+)\s+(.+)/);
              return m ? { fixes: parseInt(m[1]), file: m[2] } : null;
            }).filter(Boolean),
            hotspots: 'Files appearing in both lists above are HIGH-RISK hotspots'
          };
          break;
        }

        case 'metrics_dependencies': {
          const pm = args.package_manager || 'auto';
          const hasNpm = existsSync(join(PROJECT_DIR, 'package.json'));
          const hasPip = existsSync(join(PROJECT_DIR, 'requirements.txt'));

          if ((pm === 'auto' && hasNpm) || pm === 'npm' || pm === 'pnpm') {
            const pkg = JSON.parse(readFileSync(join(PROJECT_DIR, 'package.json'), 'utf-8'));
            const deps = Object.keys(pkg.dependencies || {}).length;
            const devDeps = Object.keys(pkg.devDependencies || {}).length;
            const outdated = exec('npm outdated --json 2>/dev/null') || '{}';
            let outdatedCount = 0;
            try { outdatedCount = Object.keys(JSON.parse(outdated)).length; } catch {}
            const audit = exec('npm audit --json 2>/dev/null') || '{}';
            let vulns = { total: 0 };
            try {
              const a = JSON.parse(audit);
              vulns = a.metadata?.vulnerabilities || { total: 0 };
            } catch {}

            result = {
              package_manager: hasNpm ? 'npm/pnpm' : pm,
              total_dependencies: deps,
              dev_dependencies: devDeps,
              outdated_count: outdatedCount,
              vulnerabilities: vulns
            };
          } else if ((pm === 'auto' && hasPip) || pm === 'pip') {
            const pipList = exec('pip list --outdated --format=json 2>/dev/null') || '[]';
            let outdated = [];
            try { outdated = JSON.parse(pipList); } catch {}
            result = { package_manager: 'pip', outdated: outdated.length, outdated_packages: outdated.slice(0, 10) };
          } else {
            result = { error: 'No supported package manager detected' };
          }
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
process.stderr.write('Project Metrics MCP server started\n');
