# Council Setup Wizard

**Command:** `/council:setup`
**Purpose:** Interactive configuration wizard for Agent Review Council

## Overview

The setup wizard guides you through configuring the Agent Review Council plugin for your specific workflow. It's designed to get you productive in under 2 minutes.

## Usage

```bash
# Run the interactive setup wizard
/council:setup

# Reset to defaults
/council:setup --reset

# Show current configuration
/council:setup --show

# Quick setup with defaults
/council:setup --quick
```

## Setup Flow

### Step 1: Choose Default Protocol

```
Which protocol should be your default?

  1. Adversarial Review     ← Attacker/defender debate
  2. Round Robin            ← Sequential building
  3. Red/Blue Team          ← Security focus (recommended for security-sensitive projects)
  4. Six Thinking Hats      ← Balanced perspectives
  5. Rapid Fire             ← Quick consensus
  6. AutoGen Team           ← Complex coordination
  7. Panel Discussion       ← Open forum
  8. Keep current (adversarial)

Choice [8]:
```

**Recommendations:**
- **Security-focused projects** → Red/Blue Team
- **Fast-paced teams** → Rapid Fire
- **Balanced teams** → Six Thinking Hats
- **Complex projects** → AutoGen Team
- **General use** → Adversarial (default)

### Step 2: Choose Panel Size

```
How many agents should review by default?

  1. Quick (3 agents, 1 round)      ← ~5 minutes, best for PRs <50 lines
  2. Standard (5 agents, 2 rounds)  ← ~10 minutes, best for most PRs
  3. Thorough (7 agents, 3 rounds)  ← ~15 minutes, best for critical changes
  4. Full (9 agents, 4 rounds)      ← ~20 minutes, best for architecture

Choice [2]:
```

**Recommendations:**
- **Small PRs** (<50 lines) → Quick
- **Normal PRs** (50-300 lines) → Standard
- **Large PRs** (300-1000 lines) → Thorough
- **Architecture changes** → Full

### Step 3: Voting Mechanism

```
Which voting mechanism should be used?

  1. Simple Majority (>50%)         ← Low-stakes decisions
  2. Super Majority (>66%)          ← Standard reviews (recommended)
  3. Consensus (>90%)               ← Critical decisions
  4. Weighted by expertise          ← Domain-specific code
  5. Veto system                    ← Security-critical code

Choice [2]:
```

### Step 4: Auto-Convene Configuration

```
Auto-Convene Settings
───────────────────────────────────────────────

Enable automatic reviews when PRs are created?
  → Saves time, ensures consistent reviews
  → Can be customized with filters

Enable auto-convene? [y/N]:
```

If **yes**, configure:

```
Minimum files changed to trigger review: [1]
Minimum lines changed to trigger review: [10]

Security-sensitive file patterns (auto-select red-blue-team):
  ✓ auth, authentication, authorization
  ✓ password, jwt, token, crypto
  ✓ payment, billing
  ✓ session, permission, role

Add custom patterns? [y/N]:
```

### Step 5: Integrations

```
Configure Integrations
───────────────────────────────────────────────

GitHub Integration
  ✓ Post verdicts as PR comments
  ✓ Block merges on unfavorable verdicts
  Enable? [Y/n]:

Slack Integration
  → Sends verdict notifications to Slack
  Webhook URL: [leave blank to skip]

Jira Integration
  → Links verdicts to Jira issues
  Enable? [Y/n]:
```

### Step 6: Review & Save

```
Configuration Summary
───────────────────────────────────────────────

Default Protocol:     red-blue-team
Panel Size:           standard (5 agents, 2 rounds)
Voting:               super-majority (>66%)
Auto-Convene:         enabled
GitHub Integration:   enabled
Slack Notifications:  enabled
Jira Integration:     enabled

Save this configuration? [Y/n]:
```

## Generated Configuration

After setup, a `config.json` is created at `~/.claude/council/config.json`:

```json
{
  "defaultProtocol": "red-blue-team",
  "defaultPanelSize": "standard",
  "defaultVoting": "super-majority",
  "requireDevilsAdvocate": true,
  "preserveDissent": true,
  "autoConveneOnPR": true,
  "minReviewersForMerge": 3,

  "protocols": {
    "red-blue-team": {
      "enabled": true,
      "battleRounds": 3,
      "requireAdjudicator": true
    },
    "rapid-fire": {
      "enabled": true,
      "timePerAgent": "30-seconds"
    }
  },

  "automation": {
    "autoConvene": {
      "enabled": true,
      "minFiles": 1,
      "minLines": 10,
      "securitySensitivePatterns": [
        "auth", "password", "token", "payment"
      ],
      "protocolSelection": {
        "securitySensitive": "red-blue-team",
        "largePR": "autogen-team",
        "smallPR": "rapid-fire",
        "default": "red-blue-team"
      }
    },
    "notifications": {
      "slack": {
        "enabled": true,
        "webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK/HERE",
        "channels": {
          "critical": "#security-alerts",
          "normal": "#code-reviews"
        }
      },
      "github": {
        "enabled": true,
        "blockMerge": true,
        "requiredVerdict": ["APPROVE", "APPROVE_WITH_CHANGES"]
      }
    }
  },

  "customization": {
    "panelSizes": {
      "quick": { "agents": 3, "rounds": 1 },
      "standard": { "agents": 5, "rounds": 2 },
      "thorough": { "agents": 7, "rounds": 3 }
    }
  }
}
```

## Quick Setup Profiles

Pre-configured profiles for common scenarios:

### Security-Focused Team
```bash
/council:setup --profile=security
```

**Configuration:**
- Protocol: red-blue-team
- Panel: thorough (7 agents)
- Voting: consensus (90%)
- Auto-convene: enabled on security files
- Merge blocking: enabled

### Fast-Paced Startup
```bash
/council:setup --profile=fast
```

**Configuration:**
- Protocol: rapid-fire
- Panel: quick (3 agents)
- Voting: simple-majority (50%)
- Auto-convene: disabled
- Merge blocking: disabled

### Enterprise Team
```bash
/council:setup --profile=enterprise
```

**Configuration:**
- Protocol: autogen-team
- Panel: thorough (7 agents)
- Voting: super-majority (66%)
- Auto-convene: enabled
- All integrations: enabled
- Merge blocking: enabled

### Balanced Team
```bash
/council:setup --profile=balanced
```

**Configuration:**
- Protocol: six-thinking-hats
- Panel: standard (5 agents)
- Voting: super-majority (66%)
- Auto-convene: optional
- GitHub integration: enabled

## Testing Configuration

After setup, test your configuration:

```bash
# Test with current changes
/council:review

# Test specific protocol
/council:review --protocol=rapid-fire

# Test auto-convene (if enabled)
# Create a PR and watch it auto-review
```

## Updating Configuration

### Via Wizard
```bash
# Re-run setup to update
/council:setup
```

### Via File
```bash
# Edit directly
vim ~/.claude/council/config.json

# Validate configuration
/council:setup --validate
```

### Via Commands
```bash
# Change default protocol
/council:configure --protocol=round-robin

# Change panel size
/council:configure --size=thorough

# Enable/disable auto-convene
/council:configure --auto-convene=true
```

## Environment-Specific Configurations

Create different configs for different environments:

```bash
# Development environment (fast)
/council:setup --env=dev --profile=fast

# Staging environment (balanced)
/council:setup --env=staging --profile=balanced

# Production environment (thorough)
/council:setup --env=prod --profile=security
```

Config files:
- `~/.claude/council/config.dev.json`
- `~/.claude/council/config.staging.json`
- `~/.claude/council/config.prod.json`

Switch environments:
```bash
/council:configure --env=prod
```

## Troubleshooting

### Setup Failed
```bash
# Reset to defaults
/council:setup --reset

# Check permissions
ls -la ~/.claude/council/

# Validate config
/council:setup --validate
```

### Config Not Loading
```bash
# Show active config
/council:setup --show

# Check config location
echo $COUNCIL_CONFIG_FILE

# Use specific config
/council:review --config=/path/to/config.json
```

## Best Practices

1. **Start Simple**
   - Use quick setup first
   - Customize later as needed

2. **Match Your Workflow**
   - Security teams → red-blue-team
   - Fast teams → rapid-fire
   - Distributed teams → async protocols

3. **Iterate**
   - Try different protocols
   - Adjust panel sizes based on PR size
   - Fine-tune auto-convene rules

4. **Team Alignment**
   - Share config.json with team
   - Document why you chose specific protocols
   - Review config quarterly

5. **Environment-Specific**
   - Faster reviews in dev
   - Thorough reviews in prod
   - Security focus for sensitive code

---

**Agent:** council-convener-agent
**Model:** sonnet
**Activation:** User invokes `/council:setup`
**Duration:** ~2 minutes
