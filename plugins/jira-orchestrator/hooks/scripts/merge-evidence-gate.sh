#!/usr/bin/env bash
# Merge Evidence Gate
# Blocks merge/deploy tooling when required evidence sections are incomplete.

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$(dirname "$0")")")}" 
CONFIG_PATH="${JIRA_APPROVALS_CONFIG:-$PLUGIN_ROOT/config/approvals.yaml}"

HOOK_INPUT=""
if [ ! -t 0 ]; then
  HOOK_INPUT="$(cat || true)"
fi
export HOOK_INPUT

ruby <<'RUBY'
require 'yaml'
require 'json'
require 'open3'

plugin_root = ENV['CLAUDE_PLUGIN_ROOT'] || File.expand_path('../..', __dir__)
config_path = ENV['JIRA_APPROVALS_CONFIG'] || File.join(plugin_root, 'config', 'approvals.yaml')
hook_input = ENV['HOOK_INPUT'] || ''

unless File.exist?(config_path)
  warn "❌ Merge evidence gate misconfigured: approvals config not found at #{config_path}"
  exit 1
end

config = YAML.load_file(config_path) || {}
gate = config.fetch('merge_evidence_gate', {})
unless gate.fetch('enabled', true)
  puts 'MERGE_EVIDENCE_SKIPPED: merge_evidence_gate.enabled=false'
  exit 0
end

input_json = {}
begin
  input_json = hook_input.strip.empty? ? {} : JSON.parse(hook_input)
rescue JSON::ParserError
  input_json = {}
end

tool_name = input_json['tool_name'] || input_json['tool'] || input_json['name'] || ENV['TOOL_NAME'] || ''
patterns = gate.fetch('merge_tool_patterns', [])
unless patterns.empty?
  matches = patterns.any? { |p| Regexp.new(p).match?(tool_name.to_s) rescue false }
  unless matches || tool_name.empty?
    puts "MERGE_EVIDENCE_SKIPPED: tool '#{tool_name}' is outside merge gate scope"
    exit 0
  end
end

issue_key_regex = /\b[A-Z][A-Z0-9]+-\d+\b/
issue_key = ENV['JIRA_ISSUE_KEY']
if issue_key.to_s.empty?
  payload_text = [hook_input, input_json.dig('arguments').to_s, input_json.dig('input').to_s, input_json.dig('params').to_s].join(' ')
  issue_key = payload_text[issue_key_regex]
end
if issue_key.to_s.empty?
  branch, _ = Open3.capture2('git rev-parse --abbrev-ref HEAD')
  issue_key = branch[issue_key_regex] if branch
end

project_key = issue_key.to_s.empty? ? (ENV['JIRA_PROJECT_KEY'] || 'default') : issue_key.split('-').first

policy = gate.fetch('default', {}).dup
if gate['projects'].is_a?(Hash) && gate['projects'][project_key].is_a?(Hash)
  policy = policy.merge(gate['projects'][project_key])
end

risk_tier = ENV['RISK_TIER'] || input_json.dig('context', 'risk_tier')

evidence_json = nil
if ENV['JIRA_EVIDENCE_JSON'] && !ENV['JIRA_EVIDENCE_JSON'].empty?
  evidence_json = JSON.parse(ENV['JIRA_EVIDENCE_JSON'])
elsif ENV['JIRA_EVIDENCE_FILE'] && File.exist?(ENV['JIRA_EVIDENCE_FILE'])
  evidence_json = JSON.parse(File.read(ENV['JIRA_EVIDENCE_FILE']))
else
  evidence_json = input_json['evidence'] || input_json.dig('arguments', 'evidence') || {}
end

risk_tier ||= evidence_json['risk_tier'] || policy['default_risk_tier'] || 'medium'
required_map = policy['required_sections_by_risk_tier'] || {}
required_sections = required_map[risk_tier] || required_map['default'] || []

section_catalog = gate['evidence_sections'] || {}

def evidence_complete?(value)
  return value unless value.is_a?(Hash)
  return value['complete'] unless value['complete'].nil?
  return !value['status'].to_s.strip.empty? && value['status'].to_s.downcase == 'complete' if value.key?('status')
  return !value['details'].to_s.strip.empty? if value.key?('details')

  false
end

missing = []
section_status = {}
required_sections.each do |section|
  raw = evidence_json[section]
  complete = if raw.nil?
               false
             elsif raw.is_a?(TrueClass) || raw.is_a?(FalseClass)
               raw
             elsif raw.is_a?(String)
               !raw.strip.empty?
             else
               evidence_complete?(raw)
             end
  section_status[section] = complete
  missing << section unless complete
end

override = evidence_json['override'].is_a?(Hash) ? evidence_json['override'] : {}
override_requested = override.fetch('requested', false) || ENV['MERGE_EVIDENCE_OVERRIDE'] == 'true'
override_actor = override['actor'] || ENV['MERGE_OVERRIDE_ACTOR']
override_role = override['role'] || ENV['MERGE_OVERRIDE_ROLE']
override_reason = override['reason'] || ENV['MERGE_OVERRIDE_REASON']
override_policy = policy['override_authorization'] || {}
authorized_roles = override_policy['authorized_roles'] || []

override_authorized = override_requested && !override_actor.to_s.empty? && !override_reason.to_s.strip.empty? && authorized_roles.include?(override_role)

status = if missing.empty?
           'passed'
         elsif override_authorized
           'override-approved'
         else
           'failed'
         end

remediation = missing.map do |section|
  details = section_catalog[section] || {}
  guidance = details['guidance'] || "Document '#{section}' with complete evidence details."
  "- #{section}: #{guidance}"
end

comment_payload = {
  gate: 'merge_evidence',
  issue_key: issue_key,
  project_key: project_key,
  tool_name: tool_name,
  risk_tier: risk_tier,
  status: status,
  required_sections: required_sections,
  section_status: section_status,
  missing_sections: missing,
  override: {
    requested: override_requested,
    actor: override_actor,
    role: override_role,
    authorized: override_authorized
  }
}

summary_lines = []
summary_lines << "h3. Merge Evidence Gate — #{status.upcase}"
summary_lines << "*Tool:* #{tool_name.empty? ? 'unknown' : tool_name}"
summary_lines << "*Issue:* #{issue_key.empty? ? 'unknown' : issue_key}"
summary_lines << "*Risk Tier:* #{risk_tier}"
summary_lines << "*Required Sections:* #{required_sections.join(', ')}"
summary_lines << "*Missing Sections:* #{missing.empty? ? 'none' : missing.join(', ')}"
summary_lines << "*Override:* #{override_requested ? (override_authorized ? "approved (#{override_actor}/#{override_role})" : 'requested but unauthorized') : 'not requested'}"
summary_lines << "{code:json}\n#{JSON.pretty_generate(comment_payload)}\n{code}"
comment_text = summary_lines.join("\n")

sink_file = ENV['JIRA_COMMENT_SINK_FILE']
if sink_file && !sink_file.empty?
  File.open(sink_file, 'a') { |f| f.puts(comment_text); f.puts('---') }
elsif !issue_key.to_s.empty? && ENV['JIRA_BASE_URL'] && ENV['JIRA_API_TOKEN'] && ENV['JIRA_EMAIL']
  url = "#{ENV['JIRA_BASE_URL'].sub(%r{/+$}, '')}/rest/api/3/issue/#{issue_key}/comment"
  adf = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: comment_text[0, 3000] }]
      }
    ]
  }
  body = JSON.generate({ body: adf })
  _stdout, stderr, status_cmd = Open3.capture3('curl', '-sS', '--fail', '-u', "#{ENV['JIRA_EMAIL']}:#{ENV['JIRA_API_TOKEN']}", '-H', 'Content-Type: application/json', '-X', 'POST', '--data', body, url)
  warn "⚠️ Merge evidence gate could not post Jira comment: #{stderr.strip}" unless status_cmd.success?
else
  puts "JIRA_COMMENT_SIMULATED: #{JSON.generate(comment_payload)}"
end

if status == 'passed'
  puts "✅ Merge evidence gate passed for risk tier '#{risk_tier}'."
  exit 0
end

if status == 'override-approved'
  warn "⚠️ Merge evidence gate override approved by #{override_actor} (#{override_role})."
  exit 0
end

warn "❌ Merge evidence gate failed for risk tier '#{risk_tier}'."
warn 'Required evidence is incomplete for merge-triggering tooling.'
warn 'Remediation guidance (complete all missing sections):'
remediation.each { |line| warn line }
if override_requested && !override_authorized
  warn 'Override remediation:'
  warn "- Provide override.actor and override.reason, and use one of authorized roles: #{authorized_roles.join(', ')}"
end
exit 1
RUBY
