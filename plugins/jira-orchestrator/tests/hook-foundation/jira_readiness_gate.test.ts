import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

describe('jira-readiness-gate hook', () => {
  const pluginRoot = path.resolve(__dirname, '../..');
  const scriptPath = path.join(pluginRoot, 'hooks', 'scripts', 'jira-readiness-gate.sh');

  const baseIssue = {
    key: 'ENG-123',
    fields: {
      issuetype: { name: 'Story' },
      assignee: { accountId: 'abc' },
      priority: { name: 'High' },
      components: [{ name: 'Platform' }],
      sprint: { id: 10, name: 'Sprint 10' },
      labels: ['eng-dor'],
      customfield_10038: 'Given/When/Then criteria',
    },
  };

  const hookPayload = JSON.stringify({
    tool_name: 'mcp__make_pr__make_pr',
    input: { title: 'ENG-123 Add validator' },
  });

  function runGate(configContent: string, issue: unknown) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jira-readiness-'));
    const configPath = path.join(tempDir, 'approvals.yaml');
    fs.writeFileSync(configPath, configContent, 'utf8');

    const result = spawnSync('bash', [scriptPath], {
      input: hookPayload,
      encoding: 'utf8',
      env: {
        ...process.env,
        CLAUDE_PLUGIN_ROOT: pluginRoot,
        JIRA_APPROVALS_CONFIG: configPath,
        JIRA_ISSUE_JSON: JSON.stringify(issue),
      },
    });

    fs.rmSync(tempDir, { recursive: true, force: true });
    return result;
  }

  it('passes when all required fields are present', () => {
    const config = `
jira_readiness:
  enabled: true
  issue_link_template: "https://jira.example.com/browse/%{issue_key}"
  default:
    definition_of_ready_label: "definition-of-ready"
    acceptance_criteria_fields: ["customfield_10038"]
    required_fields_by_issue_type:
      default: [assignee]
  projects:
    ENG:
      definition_of_ready_label: "eng-dor"
      required_fields_by_issue_type:
        Story: [assignee, acceptance_criteria, priority, component, sprint, definition_of_ready_label]
`;

    const result = runGate(config, baseIssue);
    assert.strictEqual(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Jira readiness check passed/);
  });

  it('fails with actionable output when required fields are missing', () => {
    const config = `
jira_readiness:
  enabled: true
  issue_link_template: "https://jira.example.com/browse/%{issue_key}"
  default:
    definition_of_ready_label: "definition-of-ready"
    acceptance_criteria_fields: ["customfield_10038"]
    required_fields_by_issue_type:
      Story: [assignee, acceptance_criteria, priority, component, sprint, definition_of_ready_label]
`;

    const issueMissing = {
      ...baseIssue,
      fields: {
        ...baseIssue.fields,
        assignee: null,
        components: [],
        labels: [],
        customfield_10038: '',
      },
    };

    const result = runGate(config, issueMissing);
    assert.strictEqual(result.status, 1, result.stdout);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /The following required fields are missing:/);
    assert.match(output, /assignee/);
    assert.match(output, /acceptance criteria/);
    assert.match(output, /component/);
    assert.match(output, /Definition of Ready label/);
    assert.match(output, /https:\/\/jira\.example\.com\/browse\/ENG-123/);
  });
});
