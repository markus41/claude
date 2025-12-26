# Agent Review Council - Quick Start Guide

Get started with multi-agent code reviews in 5 minutes!

---

## 1️⃣ Installation (30 seconds)

```bash
# Install the plugin
/plugin-install agent-review-council

# Verify installation
/plugin-list | grep agent-review-council
```

**Output:**
```
✓ agent-review-council@1.0.0 (Tribunal) - 21 agents, 20 protocols
```

---

## 2️⃣ Your First Review (2 minutes)

```bash
# Review your current changes
/council:review
```

**What happens:**
1. Council detects your git diff (uncommitted changes)
2. Convenes 5 agents (standard panel size)
3. Uses adversarial protocol (default)
4. Agents deliberate for ~5-10 minutes
5. Produces verdict with findings

**Sample Output:**
```
✓ Council Review Started
  Protocol: Adversarial Review
  Panel: 5 agents
  Scope: 3 files (127 lines changed)

⚔️ Deliberation:
  [Defender] "Changes implement user authentication correctly..."
  [Attacker] "SQL injection vulnerability on line 45..."
  [Judge] "Attacker's concern is valid. Mitigation required."

✓ Verdict: REQUEST_CHANGES
  Required:
    - Fix SQL injection (CRITICAL)
    - Add input validation tests (HIGH)

  Confidence: 0.88
  Duration: 6 minutes
```

---

## 3️⃣ Try Different Protocols (1 minute each)

### Quick Security Audit
```bash
/council:review --protocol=red-blue-team --focus=security
```

**Use when:** Security-sensitive code (auth, payments, data access)

### Fast Consensus
```bash
/council:review --protocol=rapid-fire
```

**Use when:** Small PRs, simple changes, time-constrained

### Balanced Perspectives
```bash
/council:review --protocol=six-thinking-hats
```

**Use when:** Need holistic view, controversial changes

### Team Coordination
```bash
/council:review --protocol=autogen-team
```

**Use when:** Complex PRs, multiple domains (arch + security + perf)

---

## 4️⃣ Real-World Scenarios

### Scenario 1: "I'm About to Merge to Main"

```bash
# Thorough review before merge
/council:review --protocol=red-blue-team --size=thorough --blocking
```

- **Protocol:** Red/Blue Team (security focus)
- **Size:** Thorough (7 agents, 3 rounds)
- **Blocking:** Prevents merge if rejected

### Scenario 2: "Quick PR Review Needed"

```bash
# Fast review for small change
/council:review --protocol=rapid-fire --quick
```

- **Protocol:** Rapid Fire (30 sec per agent)
- **Size:** Quick (3 agents, 1 round)
- **Time:** ~5 minutes total

### Scenario 3: "Architectural Decision Review"

```bash
# Balanced multi-perspective review
/council:review --protocol=six-thinking-hats --files="src/core/**"
```

- **Protocol:** Six Thinking Hats (6 perspectives)
- **Scope:** Specific files
- **Output:** Balanced analysis (facts, risks, benefits, alternatives)

### Scenario 4: "PR Just Created, Auto-Review"

```bash
# Auto-review happens automatically if configured
# No command needed! The auto-convene.sh hook runs on PR creation
```

- **Trigger:** PR created
- **Auto-selects protocol** based on changes
- **Posts verdict** as PR comment
- **Sends Slack notification**

---

## 5️⃣ Configuration (Optional, 2 minutes)

Create `.claude/council/config.json`:

```json
{
  "defaultProtocol": "red-blue-team",
  "defaultPanelSize": "standard",
  "autoConveneOnPR": true,

  "automation": {
    "autoConvene": {
      "enabled": true,
      "minFiles": 1,
      "minLines": 10
    }
  }
}
```

This enables:
- ✅ Red/Blue Team as default protocol
- ✅ Automatic reviews on PR creation
- ✅ Reviews any PR with 1+ file changed

---

## 🎯 Protocol Cheat Sheet

| Protocol | Command | Use When | Duration |
|----------|---------|----------|----------|
| **Rapid Fire** | `--protocol=rapid-fire` | Quick decisions | 5 min |
| **Red/Blue Team** | `--protocol=red-blue-team` | Security audits | 15-20 min |
| **Round Robin** | `--protocol=round-robin` | Layered analysis | 10 min |
| **Six Thinking Hats** | `--protocol=six-thinking-hats` | Balanced view | 12-15 min |
| **AutoGen Team** | `--protocol=autogen-team` | Complex coordination | 10-15 min |
| **Panel Discussion** | `--protocol=panel-discussion` | Open exploration | 10-12 min |
| **Lightning Jam** | `--protocol=lightning-decision-jam` | Action-oriented | 18 min |
| **Appreciative Inquiry** | `--protocol=appreciative-inquiry` | Positive focus | 12 min |

---

## 🔧 Common Options

### Scope
```bash
# Current changes
/council:review

# Specific files
/council:review --files="src/**/*.ts"

# Specific PR
/council:review --pr=123

# Specific commit
/council:review --commit=abc123
```

### Panel Size
```bash
# Quick (3 agents, 1 round) - 5 min
/council:review --quick

# Standard (5 agents, 2 rounds) - 10 min [DEFAULT]
/council:review

# Thorough (7 agents, 3 rounds) - 15 min
/council:review --thorough

# Full (9 agents, 4 rounds) - 20 min
/council:review --size=full
```

### Focus Area
```bash
# Security focus
/council:review --focus=security

# Performance focus
/council:review --focus=performance

# All aspects (default)
/council:review --focus=all
```

---

## 🚨 Troubleshooting

### "Council not found"
```bash
# Verify plugin installed
/plugin-list | grep council

# If not installed, install it
/plugin-install agent-review-council
```

### "Protocol not recognized"
```bash
# List available protocols
/council:explain protocols

# Use exact protocol name
/council:review --protocol=red-blue-team  # ✓
/council:review --protocol=red-blue       # ✗
```

### "No changes to review"
```bash
# Make sure you have uncommitted changes
git status

# Or specify files explicitly
/council:review --files="src/**"
```

---

## 📚 Next Steps

1. **Learn More Protocols**
   ```bash
   /council:explain <protocol-name>
   ```

2. **View Past Verdicts**
   ```bash
   /council:history
   ```

3. **Configure Automation**
   - Set up auto-convene hook
   - Configure Slack notifications
   - Enable GitHub integration

4. **Read Full Docs**
   - See README.md for comprehensive guide
   - See SKILLS.md for deliberation techniques
   - See PROTOCOLS.md for protocol details

---

## 🎓 Learning Path

**Day 1:** Try 3 protocols
- `rapid-fire` (fastest)
- `round-robin` (collaborative)
- `panel-discussion` (natural)

**Day 2:** Security focus
- `red-blue-team` (offensive/defensive)
- `adversarial` (attacker/defender)
- `devils-advocate` (mandatory opposition)

**Day 3:** Creative approaches
- `six-thinking-hats` (6 perspectives)
- `appreciative-inquiry` (positive focus)
- `world-cafe` (small group rotation)

**Week 2:** Advanced coordination
- `autogen-team` (hierarchical)
- `expert-panel` (expert-driven)
- `dual-track-agile` (parallel tracks)

---

## 🏆 Pro Tips

1. **Match Protocol to PR Size**
   - Small (<50 lines) → `rapid-fire`
   - Medium (50-300) → `round-robin` or `panel-discussion`
   - Large (300+) → `autogen-team` or `think-tank`

2. **Security-Sensitive Changes**
   - Always use `red-blue-team`
   - Use `thorough` panel size
   - Enable merge blocking

3. **Controversial Changes**
   - Use `consensus-circle` (full consent)
   - Use `jury` (super-majority)
   - Preserve dissent for transparency

4. **Time-Constrained**
   - Use `rapid-fire` (5 min)
   - Use `lightning-decision-jam` (18 min)
   - Use `--quick` flag

5. **Architecture Decisions**
   - Use `six-thinking-hats` (balanced)
   - Use `expert-panel` (expert-driven)
   - Use `dialectic` (thesis/antithesis)

---

**You're ready! Start reviewing with `/council:review` 🚀**

For help: `/council:explain` or see README.md
