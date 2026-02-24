#!/usr/bin/env bash
# Jira Readiness Gate
# Blocks PR creation when required Jira fields are missing.

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
  warn "❌ Jira readiness gate misconfigured: approvals config not found at #{config_path}"
  exit 1
end

config = YAML.load_file(config_path) || {}
readiness = config.fetch('jira_readiness', {})

unless readiness.fetch('enabled', true)
  puts 'JIRA_READINESS_SKIPPED: jira_readiness.enabled=false'
  exit 0
end

input_json = {}
begin
  input_json = hook_input.strip.empty? ? {} : JSON.parse(hook_input)
rescue JSON::ParserError
  input_json = {}
end

tool_name = input_json['tool_name'] || input_json['tool'] || input_json['name'] || ENV['TOOL_NAME'] || ''
pr_patterns = readiness.fetch('pr_tool_patterns', [])
unless pr_patterns.empty?
  matches = pr_patterns.any? { |p| Regexp.new(p).match?(tool_name.to_s) rescue false }
  unless matches || tool_name.empty?
    puts "JIRA_READINESS_SKIPPED: tool '#{tool_name}' is outside PR scope"
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

if issue_key.to_s.empty?
  warn '❌ Jira readiness gate could not determine a Jira issue key. Include issue key in branch name, tool payload, or set JIRA_ISSUE_KEY.'
  exit 1
end

project_key = issue_key.split('-').first
team_key = ENV['JIRA_TEAM']

policy = readiness.fetch('default', {}).dup
if team_key && readiness['teams'].is_a?(Hash) && readiness['teams'][team_key].is_a?(Hash)
  policy.merge!(readiness['teams'][team_key])
end
if readiness['projects'].is_a?(Hash) && readiness['projects'][project_key].is_a?(Hash)
  policy.merge!(readiness['projects'][project_key])
end

issue_json = nil
if ENV['JIRA_ISSUE_JSON'] && !ENV['JIRA_ISSUE_JSON'].empty?
  issue_json = JSON.parse(ENV['JIRA_ISSUE_JSON'])
elsif ENV['JIRA_ISSUE_FILE'] && File.exist?(ENV['JIRA_ISSUE_FILE'])
  issue_json = JSON.parse(File.read(ENV['JIRA_ISSUE_FILE']))
elsif ENV['JIRA_BASE_URL'] && ENV['JIRA_API_TOKEN'] && ENV['JIRA_EMAIL']
  url = "#{ENV['JIRA_BASE_URL'].sub(%r{/+$}, '')}/rest/api/3/issue/#{issue_key}?expand=names"
  cmd = [
    'curl', '-sS', '--fail',
    '-u', "#{ENV['JIRA_EMAIL']}:#{ENV['JIRA_API_TOKEN']}",
    '-H', 'Accept: application/json',
    url
  ]
  stdout, stderr, status = Open3.capture3(*cmd)
  unless status.success?
    warn "❌ Jira readiness gate failed to fetch issue #{issue_key}: #{stderr.strip}"
    exit 1
  end
  issue_json = JSON.parse(stdout)
else
  warn "❌ Jira readiness gate cannot fetch issue #{issue_key}. Set JIRA_ISSUE_JSON/JIRA_ISSUE_FILE for tests or Jira API credentials for live checks."
  exit 1
end

fields = issue_json.fetch('fields', {})
issue_type = fields.dig('issuetype', 'name') || 'default'
required_map = policy.fetch('required_fields_by_issue_type', {})
required_fields = required_map[issue_type] || required_map['default'] || []
label_name = policy['definition_of_ready_label'] || 'definition-of-ready'
acceptance_keys = policy['acceptance_criteria_fields'] || ['acceptance_criteria', 'customfield_acceptance_criteria']

names = issue_json['names'] || {}
missing = []

required_fields.each do |field_name|
  case field_name
  when 'assignee'
    missing << 'assignee' if fields['assignee'].nil?
  when 'acceptance_criteria'
    present = acceptance_keys.any? do |candidate|
      direct = fields[candidate]
      by_name_key = names.key(candidate)
      by_name = by_name_key ? fields[by_name_key] : nil
      [direct, by_name].compact.any? { |v| !v.to_s.strip.empty? }
    end
    # fallback: description contains acceptance criteria heading
    unless present
      description = fields['description']
      present = description.to_s.match?(/acceptance criteria/i)
    end
    missing << "acceptance criteria (one of: #{acceptance_keys.join(', ')})" unless present
  when 'priority'
    missing << 'priority' if fields.dig('priority', 'name').to_s.strip.empty?
  when 'component'
    components = fields['components'] || []
    missing << 'component' if !components.is_a?(Array) || components.empty?
  when 'sprint'
    sprint = fields['sprint']
    if sprint.nil? && names.is_a?(Hash)
      sprint_key = names.key('Sprint') || names.key('sprint')
      sprint = fields[sprint_key] if sprint_key
    end
    missing << 'sprint' if sprint.nil? || (sprint.respond_to?(:empty?) && sprint.empty?)
  when 'definition_of_ready_label'
    labels = fields['labels'] || []
    missing << "Definition of Ready label '#{label_name}'" unless labels.include?(label_name)
  else
    value = fields[field_name]
    blank = value.nil? || (value.respond_to?(:empty?) && value.empty?) || value.to_s.strip.empty?
    missing << field_name if blank
  end
end

issue_link_template = readiness['issue_link_template'] || ENV['JIRA_BASE_URL']&.then { |base| "#{base.sub(%r{/+$}, '')}/browse/%{issue_key}" } || "https://jira.example.com/browse/%{issue_key}"
issue_url = format(issue_link_template, issue_key: issue_key)

if missing.empty?
  puts "✅ Jira readiness check passed for #{issue_key} (#{issue_type})."
  puts "Issue: #{issue_url}"
  exit 0
end

warn "❌ Jira readiness check failed for #{issue_key} (#{issue_type})."
warn "Issue: #{issue_url}"
warn 'The following required fields are missing:'
missing.each_with_index do |item, idx|
  warn "  #{idx + 1}. #{item}"
end
warn ''
warn 'How to fix:'
warn "1) Open the Jira issue: #{issue_url}"
warn '2) Populate the missing fields above.'
warn '3) Re-run PR creation after updating Jira.'
exit 1
RUBY
