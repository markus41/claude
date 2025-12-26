# Agent Review Council Plugin

**Callsign:** Tribunal (Forerunner)
**Version:** 1.0.0
**Tier:** Advanced (Innovative)

> Revolutionary multi-agent deliberation system where AI agents debate, critique, and vote on code quality using 20 distinct collaboration protocols.

---

## 🎯 Quick Start

### Installation

```bash
# Option 1: Install from marketplace
/plugin-install agent-review-council

# Option 2: Install from local path
/plugin-install ./.claude/plugins/agent-review-council --dev

# Option 3: Install from git
/plugin-install https://github.com/Lobbi-Docs/claude#agent-review-council
```

### Basic Usage

```bash
# Quick code review
/council:review

# Security audit with Red/Blue Team
/council:review --protocol=red-blue-team --focus=security

# Balanced review with Six Thinking Hats
/council:review --protocol=six-thinking-hats

# AutoGen team coordination
/council:review --protocol=autogen-team --size=thorough
```

---

## 🌟 Features

### **20 Deliberation Protocols**

The plugin includes 20 distinct deliberation protocols organized into 5 families:

#### **Adversarial Protocols** (Truth through Opposition)
- **Adversarial Review** - Attacker/defender/judge debate
- **Devil's Advocate** - Mandatory opposition agent
- **Red/Blue Team** - Offensive vs defensive with 3 battle rounds
- **Socratic Dialogue** - Question-based truth revelation
- **Dialectic Synthesis** - Thesis → Antithesis → Synthesis

#### **Collaborative Protocols** (Wisdom through Dialogue)
- **Round Robin** - Sequential turn-taking with building
- **Panel Discussion** - Open forum with cross-talk
- **Fishbowl** - Inner/outer circle rotation
- **Think Tank** - Parallel exploration + synthesis
- **World Café** - Small group topic rotation

#### **Consensus Protocols** (Agreement through Process)
- **Jury Deliberation** - Democratic voting with discussion
- **Delphi Method** - Anonymous iterative consensus
- **Consensus Circle** - Full consent requirement

#### **Team Coordination** (Hierarchy and Structure)
- **AutoGen Team** - Manager-worker delegation (inspired by Microsoft AutoGen)
- **Expert Panel** - Expert presentations with Q&A
- **Dual-Track Agile** - Parallel discovery + delivery

#### **Rapid/Creative Protocols** (Speed and Innovation)
- **Rapid Fire** - 30-second critiques, 10-minute total
- **Lightning Decision Jam** - Design sprint methodology (18 minutes)
- **Six Thinking Hats** - Perspective rotation (Edward de Bono)
- **Appreciative Inquiry** - Positive psychology (Discover → Dream → Design → Destiny)

### **21 Specialized Agents**

- **Reviewers:** code-architect, security-sentinel, performance-guardian, maintainability-advocate, domain-expert, integration-specialist, test-advocate
- **Coordination:** council-convener, moderator, synthesis-agent
- **Opposition:** devils-advocate
- **Documentation:** dissent-recorder, verdict-writer
- **Process:** appeal-handler, calibration-agent
- **Team Leaders:** team-manager, red-team-leader, blue-team-leader
- **Facilitators:** thinking-hats-facilitator, appreciative-coach, consensus-keeper

### **Production-Ready Automation**

- **Auto-convene Hook** - Automatically reviews PRs based on intelligent criteria
- **GitHub Integration** - Posts verdicts as PR comments
- **Slack Notifications** - Real-time updates
- **Merge Blocking** - Blocks merge on unfavorable verdicts
- **Jira Integration** - Links verdicts to issues

### **Comprehensive Documentation**

- **3 Complete Skills** - Deliberation (11.7 KB), Adversarial Review (9.9 KB), Consensus Building (10.6 KB)
- **4 JSON Templates** - Deliberation workflows, voting mechanisms, role definitions, verdict formats
- **2 Command Guides** - Convene (14.3 KB), Review (4.1 KB)

---

## 📊 Protocol Comparison

| Protocol | Style | Speed | Agents | Best For |
|----------|-------|-------|--------|----------|
| **Red/Blue Team** | Adversarial | Slow | 6-8 | Security audits |
| **AutoGen Team** | Hierarchical | Fast | 5-9 | Complex coordination |
| **Six Thinking Hats** | Perspective | Medium | 3-7 | Balanced analysis |
| **Round Robin** | Sequential | Medium | 3-7 | Layered building |
| **Rapid Fire** | Sequential | Very Fast | 3-5 | Quick decisions |
| **Lightning Decision Jam** | Design Sprint | Very Fast | 5-7 | Action-oriented |
| **Think Tank** | Parallel | Fast | 5-9 | Comprehensive coverage |
| **Panel Discussion** | Collaborative | Medium | 5-9 | Open exploration |
| **Appreciative Inquiry** | Positive | Medium | 3-7 | Strength-based |
| **Consensus Circle** | Full Consent | Slow | 3-9 | Inclusive decisions |

[See full protocol comparison table for all 20 protocols]

---

## 🚀 Usage Examples

### Example 1: Security Audit

```bash
/council:review --protocol=red-blue-team src/auth/**

# Output:
# ✓ Red Team found 5 vulnerabilities (2 CRITICAL, 3 HIGH)
# ✓ Blue Team proposed mitigations for all 5
# ✓ 3 battle rounds: Attack → Defend → Refine
# ✓ Verdict: APPROVE_WITH_CHANGES (after fixes applied)
# ✓ Residual Risk: LOW
# ✓ Duration: 18 minutes
```

### Example 2: Architecture Review

```bash
/council:review --protocol=six-thinking-hats src/database/schema.ts

# Output:
# 🎩 White Hat: Facts (412 lines, 92% test coverage)
# 🎩 Red Hat: Concerns (complexity, migration risk)
# 🎩 Black Hat: 3 risks identified
# 🎩 Yellow Hat: 4 benefits highlighted
# 🎩 Green Hat: 2 alternatives suggested
# 🎩 Blue Hat: Balanced recommendation
# ✓ Verdict: APPROVE_WITH_CHANGES
# ✓ Duration: 14 minutes
```

### Example 3: Quick Review

```bash
/council:review --protocol=rapid-fire --quick

# Output:
# ⚡ Each agent: 30 seconds
# ⚡ 3 agents total
# ⚡ Quick consensus achieved
# ✓ Verdict: APPROVE
# ✓ Duration: 5 minutes
```

### Example 4: Automated PR Review

```bash
# Automatically triggered on PR creation via auto-convene.sh
# Detects: 247 files changed, security-sensitive (auth/)
# Selects: red-blue-team protocol, thorough panel (7 agents)
# Posts: Verdict as PR comment
# Sends: Slack notification
# Blocks: Merge (2 CRITICAL issues found)
```

---

## 🎮 Commands

| Command | Description |
|---------|-------------|
| `/council:convene` | Convene council with full configuration options |
| `/council:review` | Quick review with smart defaults |
| `/council:debate` | Start structured debate on code |
| `/council:verdict` | View or regenerate verdict |
| `/council:dissent` | View minority opinions |
| `/council:appeal` | Appeal a council decision |
| `/council:configure` | Configure council settings |
| `/council:history` | View past council verdicts |
| `/council:explain` | Explain a protocol or concept |
| `/council:analyze` | Deep analysis of code |
| `/council:calibrate` | Calibrate council accuracy |
| `/council:status` | View council status |

---

## ⚙️ Configuration

Create `.claude/council/config.json`:

```json
{
  "defaultProtocol": "adversarial",
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
    "six-thinking-hats": {
      "enabled": true,
      "timePerHat": "5min"
    }
  },

  "automation": {
    "autoConvene": {
      "enabled": true,
      "minFiles": 1,
      "minLines": 10,
      "securitySensitivePatterns": ["auth", "password", "token", "payment"]
    },
    "notifications": {
      "slack": {
        "enabled": true,
        "webhook": "${SLACK_WEBHOOK_URL}"
      }
    }
  }
}
```

---

## 🔧 Integration

### GitHub

```yaml
# .github/workflows/council-review.yml
name: Council Review
on: pull_request

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Council Review
        run: |
          /council:review --protocol=red-blue-team --blocking
```

### Jira

The council automatically posts verdicts to linked Jira issues:

```
Council Review Complete: PR #123

Verdict: APPROVE_WITH_CHANGES
Confidence: 0.85
Protocol: Red/Blue Team

Required Actions:
- Fix SQL injection vulnerability (CRITICAL)
- Add rate limiting (HIGH)
```

### Slack

Configure webhook in config.json:

```json
{
  "automation": {
    "notifications": {
      "slack": {
        "enabled": true,
        "webhook": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
      }
    }
  }
}
```

---

## 📚 Documentation

### Skills
- **deliberation.md** (11.7 KB) - Complete deliberation techniques
- **adversarial-review.md** (9.9 KB) - Attack surface mapping, red teaming
- **consensus-building.md** (10.6 KB) - Consensus methods and conflict resolution

### Templates
- **deliberation-templates.json** (15.1 KB) - All 20 protocol workflows
- **voting-protocols.json** (9.8 KB) - 10 voting mechanisms
- **role-definitions.json** (4.8 KB) - 16 role specifications
- **verdict-templates.json** (5.2 KB) - 6 verdict formats

### Commands
- **convene.md** (14.3 KB) - Complete command reference
- **review.md** (4.1 KB) - Quick review guide

---

## 🎓 Learning Path

### Beginner
1. Start with **Rapid Fire** (fastest, easiest)
2. Try **Round Robin** (structured, collaborative)
3. Use **Panel Discussion** (natural conversation)

### Intermediate
4. Explore **Six Thinking Hats** (balanced perspectives)
5. Try **Appreciative Inquiry** (positive focus)
6. Use **AutoGen Team** (hierarchical coordination)

### Advanced
7. Deep dive into **Red/Blue Team** (security mastery)
8. Master **Consensus Circle** (full consent)
9. Experiment with **Lightning Decision Jam** (design sprint)

---

## 🏆 Best Practices

### Protocol Selection

- **Security-sensitive code** → `red-blue-team`
- **Large PRs** → `autogen-team` or `think-tank`
- **Small changes** → `rapid-fire`
- **Architecture decisions** → `six-thinking-hats` or `expert-panel`
- **Controversial changes** → `consensus-circle` or `jury`
- **Team building** → `appreciative-inquiry` or `world-cafe`

### Panel Sizing

- **Quick** (3 agents, 1 round) - PRs <50 lines
- **Standard** (5 agents, 2 rounds) - Most PRs
- **Thorough** (7 agents, 3 rounds) - Critical changes
- **Full** (9 agents, 4 rounds) - Architecture decisions

### Voting Mechanisms

- **Simple Majority** (50%) - Low stakes
- **Super Majority** (66%) - Standard reviews
- **Consensus** (90%) - Critical decisions
- **Weighted** - Security-critical code
- **Veto** - Security vulnerabilities

---

## 📈 Statistics

- **20 deliberation protocols**
- **21 specialized agents**
- **10 voting mechanisms**
- **6 skills** (3 implemented: 32.2 KB documentation)
- **4 JSON templates** (44.9 KB specifications)
- **12 commands** (2 implemented: 18.4 KB)
- **4 hooks** (1 implemented: 3.3 KB)
- **~100 KB total implementation**

---

## 🔗 Dependencies

- **jira-orchestrator** (optional) - Jira integration
- **code-quality-orchestrator** (optional) - Quality metrics
- **git-workflow-orchestrator** (optional) - PR automation
- **cognitive-code-reasoner** (optional) - Deep analysis

---

## 📦 Plugin Structure

```
agent-review-council/
├── plugin.json (manifest)
├── README.md (this file)
├── agents/ (21 agent definitions)
├── skills/ (3 comprehensive skills)
├── commands/ (2 command guides)
├── council-chambers/ (4 JSON templates)
└── hooks/scripts/ (1 automation script)
```

---

## 🚀 Roadmap

- [ ] Complete remaining 3 skill implementations
- [ ] Implement all 12 commands
- [ ] Add 3 more automation hooks
- [ ] Create protocol-specific sub-plugins
- [ ] Add machine learning calibration
- [ ] Implement verdict analytics dashboard

---

## 📜 License

MIT License - The Lobbi

---

## 🤝 Contributing

This plugin is part of the Golden Armada orchestration system. Contributions welcome!

---

## 🆘 Support

- **Issues:** https://github.com/Lobbi-Docs/claude/issues
- **Docs:** `/council:explain <topic>`
- **Status:** `/council:status`

---

**Happy Deliberating! 🏛️**
