#!/usr/bin/env node
/**
 * Workflow Bridge MCP Server
 *
 * Orchestrates end-to-end deployment workflows, tying together builds,
 * tests, registry pushes, and Helm deploys into tracked pipelines.
 *
 * Tools:
 *   - workflow_pipeline: Define and execute a multi-step deployment pipeline
 *   - workflow_status: Check status of running/completed pipelines
 *   - workflow_gate: Deployment gate check (pre-conditions before deploy)
 *   - workflow_rollback_plan: Generate a rollback plan for a deployment
 *   - workflow_changelog: Generate changelog between two deployments
 *   - workflow_environments: Track and compare environments (dev/staging/prod)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const WORKFLOW_LOG = join(PROJECT_DIR, '.claude', 'logs', 'workflows.jsonl');
const ENV_STATE = join(PROJECT_DIR, '.claude', 'logs', 'environments.json');

function ensureDir(f) {
  const dir = dirname(f);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
ensureDir(WORKFLOW_LOG);

function readJSONL(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8').split('\n').filter(l => l.trim()).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function appendJSONL(path, obj) {
  ensureDir(path);
  const line = JSON.stringify(obj) + '\n';
  writeFileSync(path, existsSync(path) ? readFileSync(path, 'utf-8') + line : line);
}

function readJSON(path) {
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, 'utf-8')); } catch { return {}; }
}

function writeJSON(path, data) {
  ensureDir(path);
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function exec(cmd, timeout = 30000) {
  try {
    return { ok: true, output: execSync(cmd, { cwd: PROJECT_DIR, encoding: 'utf-8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim() };
  } catch (e) {
    return { ok: false, output: (e.stdout || '') + (e.stderr || ''), code: e.status };
  }
}

function handleRequest(request) {
  const { method, params, id } = request;

  if (method === 'initialize') {
    return { jsonrpc: '2.0', id, result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'workflow-bridge', version: '1.0.0' }
    }};
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: [
      {
        name: 'workflow_pipeline',
        description: 'Define and track a multi-step deployment pipeline. Records each step (build, test, push, deploy) with status and timing.',
        inputSchema: { type: 'object', properties: {
          name: { type: 'string', description: 'Pipeline name (e.g., "deploy-api-v2.3")' },
          action: { type: 'string', enum: ['create', 'step_complete', 'step_failed', 'finish', 'abort'], description: 'Pipeline action' },
          pipeline_id: { type: 'string', description: 'Pipeline ID (for step_complete/finish/abort)' },
          steps: { type: 'array', items: { type: 'string' }, description: 'Pipeline steps (for create, e.g., ["build", "test", "push", "deploy", "verify"])' },
          step_name: { type: 'string', description: 'Step name (for step_complete/step_failed)' },
          step_data: { type: 'object', description: 'Additional data for the step' },
          notes: { type: 'string', description: 'Notes or error message' }
        }, required: ['action']}
      },
      {
        name: 'workflow_status',
        description: 'Check status of deployment pipelines. Shows active, completed, and failed pipelines with timing.',
        inputSchema: { type: 'object', properties: {
          pipeline_id: { type: 'string', description: 'Specific pipeline ID to check' },
          status_filter: { type: 'string', enum: ['active', 'completed', 'failed', 'aborted', 'all'], description: 'Filter by status (default: all)' },
          limit: { type: 'number', description: 'Max results (default 10)' }
        }}
      },
      {
        name: 'workflow_gate',
        description: 'Deployment gate check. Validates pre-conditions before allowing a deploy: image exists, tests pass, no blocking issues, environment healthy.',
        inputSchema: { type: 'object', properties: {
          image: { type: 'string', description: 'Docker image:tag to validate' },
          namespace: { type: 'string', description: 'Target K8s namespace' },
          environment: { type: 'string', enum: ['dev', 'staging', 'production'], description: 'Target environment' },
          skip_checks: { type: 'array', items: { type: 'string' }, description: 'Checks to skip (e.g., ["tests", "security"])' }
        }, required: ['image', 'environment']}
      },
      {
        name: 'workflow_rollback_plan',
        description: 'Generate a rollback plan for a deployment. Includes previous image, Helm revision, and step-by-step rollback commands.',
        inputSchema: { type: 'object', properties: {
          release: { type: 'string', description: 'Helm release name' },
          namespace: { type: 'string', description: 'K8s namespace' }
        }, required: ['release']}
      },
      {
        name: 'workflow_changelog',
        description: 'Generate changelog between two git refs or deployments. Shows commits, files changed, and breaking changes.',
        inputSchema: { type: 'object', properties: {
          from_ref: { type: 'string', description: 'Starting git ref (tag, SHA, or branch)' },
          to_ref: { type: 'string', description: 'Ending git ref (default: HEAD)' },
          format: { type: 'string', enum: ['detailed', 'summary', 'markdown'], description: 'Output format (default: summary)' }
        }, required: ['from_ref']}
      },
      {
        name: 'workflow_environments',
        description: 'Track and compare deployment environments. Shows what version/image is running in each environment.',
        inputSchema: { type: 'object', properties: {
          action: { type: 'string', enum: ['list', 'update', 'compare', 'history'], description: 'Action to perform' },
          environment: { type: 'string', description: 'Environment name (for update/history)' },
          image: { type: 'string', description: 'Current image:tag (for update)' },
          version: { type: 'string', description: 'App version (for update)' },
          release: { type: 'string', description: 'Helm release name (for update)' },
          compare_envs: { type: 'array', items: { type: 'string' }, description: 'Two environments to compare (for compare)' }
        }, required: ['action']}
      }
    ]}};
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      let result;

      switch (name) {
        case 'workflow_pipeline': {
          switch (args.action) {
            case 'create': {
              const pipeline = {
                id: `wf-${Date.now().toString(36)}`,
                name: args.name || 'unnamed',
                status: 'active',
                steps: (args.steps || ['build', 'test', 'push', 'deploy', 'verify']).map(s => ({ name: s, status: 'pending' })),
                created_at: new Date().toISOString(),
                notes: args.notes
              };
              appendJSONL(WORKFLOW_LOG, pipeline);
              result = { created: true, pipeline };
              break;
            }
            case 'step_complete':
            case 'step_failed': {
              const pipelines = readJSONL(WORKFLOW_LOG);
              const idx = pipelines.findIndex(p => p.id === args.pipeline_id);
              if (idx === -1) { result = { error: `Pipeline ${args.pipeline_id} not found` }; break; }
              const p = pipelines[idx];
              const stepIdx = p.steps.findIndex(s => s.name === args.step_name);
              if (stepIdx === -1) { result = { error: `Step ${args.step_name} not found` }; break; }
              p.steps[stepIdx].status = args.action === 'step_complete' ? 'completed' : 'failed';
              p.steps[stepIdx].completed_at = new Date().toISOString();
              p.steps[stepIdx].data = args.step_data;
              if (args.action === 'step_failed') {
                p.status = 'failed';
                p.steps[stepIdx].error = args.notes;
              }
              pipelines[idx] = p;
              writeFileSync(WORKFLOW_LOG, pipelines.map(p2 => JSON.stringify(p2)).join('\n') + '\n');
              result = { updated: true, pipeline: p };
              break;
            }
            case 'finish': {
              const pipelines = readJSONL(WORKFLOW_LOG);
              const idx = pipelines.findIndex(p => p.id === args.pipeline_id);
              if (idx === -1) { result = { error: `Pipeline ${args.pipeline_id} not found` }; break; }
              pipelines[idx].status = 'completed';
              pipelines[idx].completed_at = new Date().toISOString();
              writeFileSync(WORKFLOW_LOG, pipelines.map(p => JSON.stringify(p)).join('\n') + '\n');
              result = { finished: true, pipeline: pipelines[idx] };
              break;
            }
            case 'abort': {
              const pipelines = readJSONL(WORKFLOW_LOG);
              const idx = pipelines.findIndex(p => p.id === args.pipeline_id);
              if (idx === -1) { result = { error: `Pipeline ${args.pipeline_id} not found` }; break; }
              pipelines[idx].status = 'aborted';
              pipelines[idx].aborted_at = new Date().toISOString();
              pipelines[idx].abort_reason = args.notes;
              writeFileSync(WORKFLOW_LOG, pipelines.map(p => JSON.stringify(p)).join('\n') + '\n');
              result = { aborted: true, pipeline: pipelines[idx] };
              break;
            }
            default:
              result = { error: `Unknown pipeline action: ${args.action}` };
          }
          break;
        }

        case 'workflow_status': {
          let pipelines = readJSONL(WORKFLOW_LOG);
          if (args.pipeline_id) {
            const p = pipelines.find(p2 => p2.id === args.pipeline_id);
            result = p || { error: `Pipeline ${args.pipeline_id} not found` };
            break;
          }
          if (args.status_filter && args.status_filter !== 'all') {
            pipelines = pipelines.filter(p => p.status === args.status_filter);
          }
          result = { total: pipelines.length, pipelines: pipelines.slice(-(args.limit || 10)).reverse() };
          break;
        }

        case 'workflow_gate': {
          const checks = [];
          const skip = new Set(args.skip_checks || []);

          // Check 1: Image exists (simulated by checking build log)
          if (!skip.has('image')) {
            const buildLog = join(PROJECT_DIR, '.claude', 'logs', 'docker-builds.jsonl');
            const builds = readJSONL(buildLog);
            const imageFound = builds.some(b => (b.image || '').includes(args.image));
            checks.push({ check: 'image_tracked', passed: imageFound, details: imageFound ? `Image ${args.image} found in build log` : `Image ${args.image} NOT found in build log. Was it built and pushed?` });
          }

          // Check 2: Tests pass (check for recent test run)
          if (!skip.has('tests')) {
            const testResult = exec('npm test --if-present 2>&1', 120000);
            checks.push({ check: 'tests', passed: testResult.ok, details: testResult.ok ? 'Tests passed' : 'Tests FAILED: ' + testResult.output.substring(0, 500) });
          }

          // Check 3: TypeScript compiles
          if (!skip.has('typecheck')) {
            const tsExists = existsSync(join(PROJECT_DIR, 'tsconfig.json'));
            if (tsExists) {
              const tsResult = exec('npx tsc --noEmit 2>&1');
              checks.push({ check: 'typecheck', passed: tsResult.ok, details: tsResult.ok ? 'TypeScript compiles' : 'TypeScript errors: ' + tsResult.output.substring(0, 500) });
            }
          }

          // Check 4: No uncommitted changes
          if (!skip.has('clean_tree')) {
            const gitStatus = exec('git status --porcelain');
            const isClean = !gitStatus.output || gitStatus.output.trim() === '';
            checks.push({ check: 'clean_tree', passed: isClean, details: isClean ? 'Working tree is clean' : 'Uncommitted changes detected' });
          }

          // Check 5: Production safety (extra checks for prod)
          if (args.environment === 'production' && !skip.has('production_safety')) {
            checks.push({ check: 'production_approval', passed: false, details: 'Production deployments require explicit approval. Confirm by re-running with skip_checks: ["production_safety"]' });
          }

          const allPassed = checks.every(c => c.passed);
          result = {
            gate: allPassed ? 'OPEN' : 'BLOCKED',
            environment: args.environment,
            image: args.image,
            checks,
            blocked_by: checks.filter(c => !c.passed).map(c => c.check)
          };
          break;
        }

        case 'workflow_rollback_plan': {
          const ns = args.namespace || 'default';
          const history = exec(`helm history ${args.release} -n ${ns} --max 5 -o json 2>&1`);

          if (!history.ok) {
            result = { error: `Cannot get Helm history: ${history.output}`, manual_rollback: [
              `helm rollback ${args.release} -n ${ns}`,
              `kubectl rollout undo deployment/<deployment-name> -n ${ns}`
            ]};
            break;
          }

          let revisions = [];
          try { revisions = JSON.parse(history.output); } catch {}
          const current = revisions[revisions.length - 1];
          const previous = revisions[revisions.length - 2];

          result = {
            release: args.release,
            namespace: ns,
            current_revision: current ? { revision: current.revision, chart: current.chart, app_version: current.app_version, status: current.status, updated: current.updated } : null,
            rollback_target: previous ? { revision: previous.revision, chart: previous.chart, app_version: previous.app_version } : null,
            rollback_commands: [
              `# Step 1: Rollback Helm release`,
              `helm rollback ${args.release} ${previous ? previous.revision : '<revision>'} -n ${ns} --wait --timeout 5m`,
              ``,
              `# Step 2: Verify rollback`,
              `helm status ${args.release} -n ${ns}`,
              `kubectl get pods -n ${ns} -l app=${args.release}`,
              ``,
              `# Step 3: Check pod logs`,
              `kubectl logs -l app=${args.release} -n ${ns} --tail=20`,
              ``,
              `# Step 4: Verify images`,
              `kubectl get pods -n ${ns} -o jsonpath='{range .items[*]}{.metadata.name}\\t{range .spec.containers[*]}{.image}\\n{end}{end}'`
            ],
            all_revisions: revisions.map(r => ({ revision: r.revision, status: r.status, chart: r.chart, updated: r.updated }))
          };
          break;
        }

        case 'workflow_changelog': {
          const toRef = args.to_ref || 'HEAD';
          const format = args.format || 'summary';

          const log = exec(`git log ${args.from_ref}..${toRef} --pretty=format:'%h|%s|%an|%ad' --date=short 2>&1`);
          if (!log.ok) { result = { error: `Git log failed: ${log.output}` }; break; }

          const commits = log.output.split('\n').filter(Boolean).map(line => {
            const [hash, subject, author, date] = line.split('|');
            return { hash, subject, author, date };
          });

          const filesChanged = exec(`git diff --stat ${args.from_ref}..${toRef} 2>&1`);
          const breaking = commits.filter(c => /breaking|BREAKING/i.test(c.subject));
          const features = commits.filter(c => /^feat/i.test(c.subject));
          const fixes = commits.filter(c => /^fix/i.test(c.subject));

          if (format === 'markdown') {
            const md = [
              `# Changelog: ${args.from_ref} → ${toRef}`,
              '',
              breaking.length > 0 ? `## Breaking Changes\n${breaking.map(c => `- ${c.hash} ${c.subject}`).join('\n')}\n` : '',
              features.length > 0 ? `## Features\n${features.map(c => `- ${c.hash} ${c.subject}`).join('\n')}\n` : '',
              fixes.length > 0 ? `## Fixes\n${fixes.map(c => `- ${c.hash} ${c.subject}`).join('\n')}\n` : '',
              `## All Changes (${commits.length} commits)`,
              commits.map(c => `- \`${c.hash}\` ${c.subject} (${c.author}, ${c.date})`).join('\n')
            ].filter(Boolean).join('\n');
            result = { format: 'markdown', changelog: md };
          } else {
            result = {
              from: args.from_ref, to: toRef,
              total_commits: commits.length,
              breaking_changes: breaking.length,
              features: features.length,
              bug_fixes: fixes.length,
              commits: format === 'detailed' ? commits : commits.slice(0, 20),
              files_changed: filesChanged.output?.substring(0, 2000)
            };
          }
          break;
        }

        case 'workflow_environments': {
          const envState = readJSON(ENV_STATE);

          switch (args.action) {
            case 'list': {
              result = { environments: envState };
              break;
            }
            case 'update': {
              if (!args.environment) { result = { error: 'environment is required' }; break; }
              const prev = envState[args.environment];
              envState[args.environment] = {
                image: args.image || prev?.image,
                version: args.version || prev?.version,
                release: args.release || prev?.release,
                updated_at: new Date().toISOString(),
                previous: prev ? { image: prev.image, version: prev.version, updated_at: prev.updated_at } : null
              };
              writeJSON(ENV_STATE, envState);
              result = { updated: true, environment: args.environment, state: envState[args.environment] };
              break;
            }
            case 'compare': {
              const [env1, env2] = args.compare_envs || [];
              if (!env1 || !env2) { result = { error: 'Provide two environments to compare' }; break; }
              const e1 = envState[env1] || {};
              const e2 = envState[env2] || {};
              const same = e1.image === e2.image && e1.version === e2.version;
              result = {
                comparison: { [env1]: e1, [env2]: e2 },
                in_sync: same,
                drift: same ? null : {
                  image_diff: e1.image !== e2.image,
                  version_diff: e1.version !== e2.version,
                  time_diff: e1.updated_at && e2.updated_at ? `${env1}: ${e1.updated_at}, ${env2}: ${e2.updated_at}` : 'Unknown'
                }
              };
              break;
            }
            case 'history': {
              // Show recent workflow pipelines for this environment
              const pipelines = readJSONL(WORKFLOW_LOG).filter(p => p.name?.includes(args.environment || ''));
              result = { environment: args.environment, recent_pipelines: pipelines.slice(-10) };
              break;
            }
            default:
              result = { error: `Unknown action: ${args.action}` };
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
process.stderr.write('Workflow Bridge MCP server started\n');
