---
name: mp:policy
description: Manage and evaluate security policies controlling plugin installation and registry access
arguments:
  - name: action
    description: "Action: check <plugin-name>, list, or enforce"
    required: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# /mp:policy — Plugin Policy Enforcement

Manage and evaluate security policies that control which plugins may be installed and from which registries.

## Usage

### `check <plugin-name>`

Check whether a specific plugin is allowed by the current policy.

```
/mp:policy check my-awesome-plugin
/mp:policy check my-awesome-plugin --source public --trust-score 85 --signed
```

**Parameters:**
- `<plugin-name>` — The plugin to evaluate
- `--source <registry>` — Registry the plugin comes from (for source-filtered rules)
- `--trust-score <n>` — Override trust score for evaluation
- `--signed` — Mark the plugin as signed for unless-clause evaluation

Output shows:
- Whether the plugin is allowed or denied
- Which rule matched (or "default allow" if no rule matched)
- The reason from the matching rule
- Any warnings generated

### `list`

Show all current policy rules in evaluation order.

```
/mp:policy list
```

Displays each rule with:
- Rule number (evaluation order)
- Action (allow/deny/require)
- Plugin patterns
- Source filter (if any)
- Unless conditions (if any)
- Reason

### `enforce`

Scan all installed plugins against the policy and report violations.

```
/mp:policy enforce
```

Reports:
- **Violations** — Installed plugins that the policy would deny
- **Missing required** — Plugins matching `require` rules that are not installed
- **Compliant** — Plugins that pass all rules

## Policy Rules

Policy rules are defined in `.claude/policies/plugins.yaml` (or the default at `plugins/marketplace-pro/config/policies.default.yaml`).

### Rule Format

```yaml
rules:
  - action: allow|deny|require
    plugins: ["glob-pattern*"]
    source: "registry-name"
    unless:
      trust_score: ">= 80"
      signed: true
    reason: "Human-readable explanation"
```

### Evaluation

Rules are evaluated **top-to-bottom with short-circuit matching** (first match wins, like iptables):

1. For each rule, check if the plugin name matches any pattern
2. If a source filter is set, check if the plugin's registry matches
3. If an `unless` clause exists, check if ALL exemption conditions are met — if so, skip this rule
4. If the rule matches: apply the action and stop
5. If no rule matches: the plugin is allowed by default

### Actions

| Action | Behavior |
|--------|----------|
| `allow` | Plugin is permitted |
| `deny` | Plugin is blocked — installation fails with the rule's reason |
| `require` | Plugin is mandatory — generates warnings if not installed, but does not block other plugins |

### Unless Clause

The `unless` clause provides exemptions. If ALL conditions are met, the rule is skipped:

- `trust_score: ">= 80"` — Plugin trust score meets the threshold
- `signed: true` — Plugin package is cryptographically signed

## Implementation

**Engine:** `src/federation/registry.ts` — `PolicyEngine` class.
