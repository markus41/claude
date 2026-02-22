#!/usr/bin/env node
/**
 * Deploy Intelligence MCP Server
 *
 * Tracks Docker builds, K8s deployments, Helm releases, and detects stale images.
 * Tools:
 *   - deploy_build_log: Query the Docker build history log
 *   - deploy_k8s_images: List running K8s images with pull policies and staleness check
 *   - deploy_helm_releases: List Helm releases with image versions
 *   - deploy_audit: Full audit comparing builds vs running images
 *   - deploy_volumes: Track K8s PV/PVC status and find orphans
 *   - deploy_record_build: Record a docker build event
 *   - deploy_image_history: Show the history of a specific image across builds and deploys
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const BUILD_LOG = join(PROJECT_DIR, '.claude', 'logs', 'docker-builds.jsonl');
const DEPLOY_LOG = join(PROJECT_DIR, '.claude', 'logs', 'deploy-events.jsonl');

function ensureDir(f) {
  const dir = dirname(f);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
ensureDir(BUILD_LOG);
ensureDir(DEPLOY_LOG);

function readJSONL(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf-8').split('\n').filter(l => l.trim()).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function appendJSONL(path, obj) {
  ensureDir(path);
  const line = JSON.stringify({ ...obj, timestamp: new Date().toISOString() }) + '\n';
  writeFileSync(path, existsSync(path) ? readFileSync(path, 'utf-8') + line : line);
}

function execSafe(cmd, timeout = 15000) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return `ERROR: ${e.message}`;
  }
}

function handleRequest(request) {
  const { method, params, id } = request;

  if (method === 'initialize') {
    return { jsonrpc: '2.0', id, result: {
      protocolVersion: '2024-11-05',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'deploy-intelligence', version: '1.0.0' }
    }};
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: [
      {
        name: 'deploy_build_log',
        description: 'Query the Docker/ACR build history. Shows recent builds with timestamps, tags, and cache settings.',
        inputSchema: { type: 'object', properties: {
          image_filter: { type: 'string', description: 'Filter by image name substring' },
          action_filter: { type: 'string', enum: ['build', 'push', 'acr_build', 'helm_deploy', 'all'], description: 'Filter by action type' },
          limit: { type: 'number', description: 'Max results (default 20)' }
        }}
      },
      {
        name: 'deploy_k8s_images',
        description: 'List all running K8s pod images with their pull policies. Flags caching risks (IfNotPresent + mutable tags).',
        inputSchema: { type: 'object', properties: {
          namespace: { type: 'string', description: 'K8s namespace (default: default)' },
          context: { type: 'string', description: 'K8s context name' }
        }}
      },
      {
        name: 'deploy_helm_releases',
        description: 'List Helm releases with chart versions, app versions, and image overrides.',
        inputSchema: { type: 'object', properties: {
          namespace: { type: 'string', description: 'K8s namespace' }
        }}
      },
      {
        name: 'deploy_audit',
        description: 'Full deployment audit: cross-reference builds vs running images. Detects stale deploys, caching risks, and missing images.',
        inputSchema: { type: 'object', properties: {
          namespace: { type: 'string', description: 'K8s namespace (default: default)' },
          context: { type: 'string', description: 'K8s context' }
        }}
      },
      {
        name: 'deploy_volumes',
        description: 'Track K8s persistent volumes and claims. Finds orphaned PVCs and capacity issues.',
        inputSchema: { type: 'object', properties: {
          namespace: { type: 'string', description: 'K8s namespace (default: default)' }
        }}
      },
      {
        name: 'deploy_record_build',
        description: 'Manually record a build/push/deploy event for tracking.',
        inputSchema: { type: 'object', properties: {
          action: { type: 'string', enum: ['build', 'push', 'acr_build', 'helm_deploy'], description: 'Type of event' },
          image: { type: 'string', description: 'Full image:tag reference' },
          registry: { type: 'string', description: 'Registry name' },
          no_cache: { type: 'boolean', description: 'Was --no-cache used?' },
          notes: { type: 'string', description: 'Additional notes' }
        }, required: ['action', 'image']}
      },
      {
        name: 'deploy_image_history',
        description: 'Show the complete build and deploy history of a specific image.',
        inputSchema: { type: 'object', properties: {
          image: { type: 'string', description: 'Image name to look up (partial match)' }
        }, required: ['image']}
      }
    ]}};
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      let result;

      switch (name) {
        case 'deploy_build_log': {
          let entries = readJSONL(BUILD_LOG);
          if (args.action_filter && args.action_filter !== 'all') entries = entries.filter(e => e.action === args.action_filter);
          if (args.image_filter) entries = entries.filter(e => (e.image || '').includes(args.image_filter));
          result = { total: entries.length, entries: entries.slice(-(args.limit || 20)) };
          break;
        }

        case 'deploy_k8s_images': {
          const ns = args.namespace || 'default';
          const ctx = args.context ? `--context ${args.context}` : '';
          const raw = execSafe(`kubectl get pods -n ${ns} ${ctx} -o json`);
          if (raw.startsWith('ERROR')) { result = { error: raw, hint: 'Is kubectl configured and cluster accessible?' }; break; }
          const pods = JSON.parse(raw);
          const images = [];
          const risks = [];
          for (const pod of pods.items || []) {
            for (const c of pod.spec?.containers || []) {
              const entry = { pod: pod.metadata.name, container: c.name, image: c.image, pullPolicy: c.imagePullPolicy || 'IfNotPresent' };
              images.push(entry);
              if ((c.image || '').includes(':latest') && (c.imagePullPolicy || 'IfNotPresent') === 'IfNotPresent') {
                risks.push({ ...entry, risk: 'CACHING: :latest with IfNotPresent - will use cached image, not newest' });
              }
              if (!(c.image || '').includes(':') || (c.image || '').endsWith(':')) {
                risks.push({ ...entry, risk: 'NO_TAG: Image has no explicit tag, defaults to :latest' });
              }
            }
          }
          result = { namespace: ns, total_pods: (pods.items || []).length, images, caching_risks: risks, unique_images: [...new Set(images.map(i => i.image))] };
          break;
        }

        case 'deploy_helm_releases': {
          const ns = args.namespace ? `-n ${args.namespace}` : '-A';
          const raw = execSafe(`helm list ${ns} -o json`);
          if (raw.startsWith('ERROR')) { result = { error: raw }; break; }
          result = { releases: JSON.parse(raw) };
          break;
        }

        case 'deploy_audit': {
          const ns = args.namespace || 'default';
          const builds = readJSONL(BUILD_LOG);
          const lastBuild = builds.filter(b => b.action === 'build' || b.action === 'acr_build').pop();
          const lastDeploy = builds.filter(b => b.action === 'helm_deploy').pop();

          const k8sRaw = execSafe(`kubectl get pods -n ${ns} -o jsonpath='{range .items[*]}{.metadata.name}|{range .spec.containers[*]}{.image}|{.imagePullPolicy}{end}{"\\n"}{end}'`);
          const running = k8sRaw.split('\n').filter(l => l.trim()).map(l => {
            const [pod, image, policy] = l.split('|');
            return { pod, image, policy };
          });

          const stale = lastBuild && lastDeploy && lastDeploy.timestamp < lastBuild.timestamp;
          const risks = running.filter(r => (r.image || '').includes(':latest') && r.policy === 'IfNotPresent');

          result = {
            audit_timestamp: new Date().toISOString(),
            namespace: ns,
            last_build: lastBuild ? { image: lastBuild.image, timestamp: lastBuild.timestamp, no_cache: lastBuild.no_cache } : null,
            last_deploy: lastDeploy ? { release: lastDeploy.release, timestamp: lastDeploy.timestamp } : null,
            stale_deploy_detected: stale,
            running_images: running.length,
            caching_risks: risks,
            total_builds_tracked: builds.length,
            recommendations: [
              ...(stale ? ['CRITICAL: Last build is newer than last deploy. You may be running stale code.'] : []),
              ...(risks.length > 0 ? [`WARNING: ${risks.length} pod(s) use :latest with IfNotPresent. Set imagePullPolicy: Always or use specific tags.`] : []),
              'Always use --set image.tag=<specific> --set image.pullPolicy=Always with helm upgrade',
              'Verify image exists in registry before deploying: az acr repository show-tags or docker manifest inspect'
            ]
          };
          break;
        }

        case 'deploy_volumes': {
          const ns = args.namespace || 'default';
          const pvRaw = execSafe(`kubectl get pv -o json`);
          const pvcRaw = execSafe(`kubectl get pvc -n ${ns} -o json`);

          let pvs = [], pvcs = [], orphans = [];
          if (!pvRaw.startsWith('ERROR')) {
            pvs = (JSON.parse(pvRaw).items || []).map(pv => ({
              name: pv.metadata.name, capacity: pv.spec?.capacity?.storage,
              status: pv.status?.phase, claim: pv.spec?.claimRef?.name,
              storageClass: pv.spec?.storageClassName, reclaimPolicy: pv.spec?.persistentVolumeReclaimPolicy
            }));
          }
          if (!pvcRaw.startsWith('ERROR')) {
            pvcs = (JSON.parse(pvcRaw).items || []).map(pvc => ({
              name: pvc.metadata.name, status: pvc.status?.phase,
              volume: pvc.spec?.volumeName, capacity: pvc.status?.capacity?.storage,
              storageClass: pvc.spec?.storageClassName
            }));
            // Check for orphans
            const podRaw = execSafe(`kubectl get pods -n ${ns} -o json`);
            if (!podRaw.startsWith('ERROR')) {
              const mountedPVCs = new Set();
              for (const pod of (JSON.parse(podRaw).items || [])) {
                for (const vol of (pod.spec?.volumes || [])) {
                  if (vol.persistentVolumeClaim) mountedPVCs.add(vol.persistentVolumeClaim.claimName);
                }
              }
              orphans = pvcs.filter(pvc => !mountedPVCs.has(pvc.name)).map(pvc => pvc.name);
            }
          }
          result = { namespace: ns, persistent_volumes: pvs, persistent_volume_claims: pvcs, orphaned_pvcs: orphans };
          break;
        }

        case 'deploy_record_build': {
          appendJSONL(BUILD_LOG, { action: args.action, image: args.image, registry: args.registry, no_cache: args.no_cache, notes: args.notes });
          result = { recorded: true, action: args.action, image: args.image };
          break;
        }

        case 'deploy_image_history': {
          const entries = readJSONL(BUILD_LOG).filter(e => (e.image || '').includes(args.image) || (e.command || '').includes(args.image));
          result = { image: args.image, events: entries, total: entries.length };
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
process.stderr.write('Deploy Intelligence MCP server started\n');
