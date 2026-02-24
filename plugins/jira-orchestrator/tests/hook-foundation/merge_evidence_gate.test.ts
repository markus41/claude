import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

describe('merge-evidence-gate hook', () => {
  const pluginRoot = path.resolve(__dirname, '../..');
  const scriptPath = path.join(pluginRoot, 'hooks', 'scripts', 'merge-evidence-gate.sh');

  const hookPayload = JSON.stringify({
    tool_name: 'mcp__github__merge_pull_request',
    input: { title: 'ENG-321 Release hardening' },
  });

  const config = `
merge_evidence_gate:
  enabled: true
  merge_tool_patterns:
    - "mcp__github__merge_pull_request"
  evidence_sections:
    test_results:
      guidance: "Include test execution evidence"
    rollback_plan:
      guidance: "Include rollback procedure"
    release_notes_impact:
      guidance: "Include release notes impact"
  default:
    default_risk_tier: medium
    required_sections_by_risk_tier:
      low: [test_results]
      high: [test_results, rollback_plan, release_notes_impact]
      default: [test_results, rollback_plan]
    override_authorization:
      authorized_roles: [engineering_manager, release_manager]
  projects:
    ENG:
      required_sections_by_risk_tier:
        low: [test_results, release_notes_impact]
        high: [test_results, rollback_plan, release_notes_impact]
`;

  function runGate(evidence: unknown, extraEnv: Record<string, string> = {}) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-evidence-'));
    const configPath = path.join(tempDir, 'approvals.yaml');
    const commentSink = path.join(tempDir, 'jira-comments.log');
    fs.writeFileSync(configPath, config, 'utf8');

    const result = spawnSync('bash', [scriptPath], {
      input: hookPayload,
      encoding: 'utf8',
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: pluginRoot,
        JIRA_APPROVALS_CONFIG: configPath,
        JIRA_ISSUE_KEY: 'ENG-321',
        JIRA_EVIDENCE_JSON: JSON.stringify(evidence),
        JIRA_COMMENT_SINK_FILE: commentSink,
        ...extraEnv,
      },
    });

    const comments = fs.existsSync(commentSink) ? fs.readFileSync(commentSink, 'utf8') : '';
    fs.rmSync(tempDir, { recursive: true, force: true });
    return { result, comments };
  }

  it('enforces risk-tier required evidence sections', () => {
    const { result, comments } = runGate(
      {
        risk_tier: 'high',
        test_results: { complete: true },
        rollback_plan: { complete: false },
        release_notes_impact: '',
      },
      { RISK_TIER: 'high' },
    );

    assert.strictEqual(result.status, 1, result.stdout);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /Merge evidence gate failed/);
    assert.match(output, /rollback_plan/);
    assert.match(output, /release_notes_impact/);
    assert.match(comments, /"status": "failed"/);
    assert.match(comments, /"risk_tier": "high"/);
  });

  it('permits authorized override and blocks unauthorized override', () => {
    const unauthorized = runGate(
      {
        risk_tier: 'high',
        test_results: { complete: true },
        override: {
          requested: true,
          actor: 'alice',
          role: 'developer',
          reason: 'urgent patch',
        },
      },
      { RISK_TIER: 'high' },
    );

    assert.strictEqual(unauthorized.result.status, 1, unauthorized.result.stdout);
    assert.match(`${unauthorized.result.stdout}\n${unauthorized.result.stderr}`, /requested but unauthorized|authorized roles/i);

    const authorized = runGate(
      {
        risk_tier: 'high',
        test_results: { complete: true },
        override: {
          requested: true,
          actor: 'release-bot',
          role: 'engineering_manager',
          reason: 'incident mitigation',
        },
      },
      { RISK_TIER: 'high' },
    );

    assert.strictEqual(authorized.result.status, 0, authorized.result.stdout + authorized.result.stderr);
    assert.match(`${authorized.result.stdout}\n${authorized.result.stderr}`, /override approved/i);
    assert.match(authorized.comments, /"authorized": true/);
    assert.match(authorized.comments, /"status": "override-approved"/);
  });
});
