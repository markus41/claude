#!/usr/bin/env bash

# Agent Review Council - Quick Start Examples
# Copy these commands and run them to get started immediately!

echo "🏛️  Agent Review Council - Quick Start Examples"
echo ""
echo "Copy and run these commands to try different review protocols:"
echo ""

# ============================================================================
# Beginner Examples (Start Here!)
# ============================================================================

echo "📚 BEGINNER EXAMPLES"
echo "──────────────────────────────────────────────────────────────"
echo ""

echo "1️⃣  Your First Review (Simple)"
echo "   → Reviews your current uncommitted changes"
echo "   → Uses adversarial protocol (default)"
echo "   → 5 agents, ~10 minutes"
echo ""
echo "   /council:review"
echo ""

echo "2️⃣  Quick Security Check (Fast)"
echo "   → Red team finds vulnerabilities"
echo "   → Blue team proposes fixes"
echo "   → Perfect for auth code"
echo ""
echo "   /council:review --protocol=red-blue-team --focus=security"
echo ""

echo "3️⃣  Rapid Consensus (Fastest)"
echo "   → 30 seconds per agent"
echo "   → 3 agents total"
echo "   → ~5 minutes end-to-end"
echo ""
echo "   /council:review --protocol=rapid-fire --quick"
echo ""

# ============================================================================
# Intermediate Examples
# ============================================================================

echo "🎓 INTERMEDIATE EXAMPLES"
echo "──────────────────────────────────────────────────────────────"
echo ""

echo "4️⃣  Balanced Perspective Review"
echo "   → 6 thinking hats (facts, risks, benefits, etc.)"
echo "   → Holistic analysis"
echo "   → Great for controversial changes"
echo ""
echo "   /council:review --protocol=six-thinking-hats"
echo ""

echo "5️⃣  Team Coordination Review"
echo "   → Manager delegates to workers"
echo "   → Parallel analysis"
echo "   → Perfect for large PRs"
echo ""
echo "   /council:review --protocol=autogen-team --size=thorough"
echo ""

echo "6️⃣  Collaborative Round Robin"
echo "   → Sequential turn-taking"
echo "   → Each agent builds on previous"
echo "   → Layered insights"
echo ""
echo "   /council:review --protocol=round-robin"
echo ""

# ============================================================================
# Advanced Examples
# ============================================================================

echo "🚀 ADVANCED EXAMPLES"
echo "──────────────────────────────────────────────────────────────"
echo ""

echo "7️⃣  Positive-Focused Review"
echo "   → Appreciative inquiry"
echo "   → Focus on strengths and potential"
echo "   → Great for team morale"
echo ""
echo "   /council:review --protocol=appreciative-inquiry"
echo ""

echo "8️⃣  Design Sprint Decision"
echo "   → Lightning decision jam"
echo "   → 18-minute structured process"
echo "   → Actionable commitments"
echo ""
echo "   /council:review --protocol=lightning-decision-jam"
echo ""

echo "9️⃣  Full Consensus Required"
echo "   → Everyone must consent"
echo "   → Speaking token rotation"
echo "   → Blocks allowed but need alternatives"
echo ""
echo "   /council:review --protocol=consensus-circle"
echo ""

# ============================================================================
# Real-World Scenarios
# ============================================================================

echo "🌍 REAL-WORLD SCENARIOS"
echo "──────────────────────────────────────────────────────────────"
echo ""

echo "🔐 Security-Critical Code"
echo "   → Reviewing authentication logic"
echo "   → Payment processing"
echo "   → Cryptographic implementations"
echo ""
echo "   /council:review --protocol=red-blue-team --thorough \\"
echo "                   --focus=security \\"
echo "                   --files='src/auth/**/*.ts'"
echo ""

echo "⚡ Performance-Critical Code"
echo "   → Database queries"
echo "   → API endpoints"
echo "   → Algorithms"
echo ""
echo "   /council:review --protocol=think-tank \\"
echo "                   --focus=performance \\"
echo "                   --files='src/api/**/*.ts'"
echo ""

echo "🏗️  Architecture Decisions"
echo "   → System design changes"
echo "   → Database schema"
echo "   → API contracts"
echo ""
echo "   /council:review --protocol=expert-panel \\"
echo "                   --focus=architecture \\"
echo "                   --size=full"
echo ""

echo "🚢 Pre-Production Review"
echo "   → Final check before merge to main"
echo "   → Comprehensive analysis"
echo "   → Merge blocking enabled"
echo ""
echo "   /council:review --protocol=red-blue-team \\"
echo "                   --size=full \\"
echo "                   --blocking"
echo ""

# ============================================================================
# Configuration Examples
# ============================================================================

echo "⚙️  CONFIGURATION EXAMPLES"
echo "──────────────────────────────────────────────────────────────"
echo ""

echo "🎛️  Run Setup Wizard"
echo "   → Interactive configuration"
echo "   → Choose default protocol"
echo "   → Configure auto-convene"
echo ""
echo "   /council:setup"
echo ""

echo "📋 Use Quick Profile"
echo "   → Pre-configured for common scenarios"
echo ""
echo "   /council:setup --profile=security     # Security-focused team"
echo "   /council:setup --profile=fast         # Fast-paced startup"
echo "   /council:setup --profile=enterprise   # Enterprise team"
echo "   /council:setup --profile=balanced     # Balanced approach"
echo ""

echo "🔍 Check Status"
echo "   → View current configuration"
echo "   → See active protocols"
echo ""
echo "   /council:status"
echo ""

# ============================================================================
# Integration Examples
# ============================================================================

echo "🔗 INTEGRATION EXAMPLES"
echo "──────────────────────────────────────────────────────────────"
echo ""

echo "📝 GitHub Actions Integration"
cat << 'YAML'
# .github/workflows/council-review.yml
name: Council Review
on: pull_request

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Security Review
        run: |
          /council:review --protocol=red-blue-team --blocking
YAML
echo ""

echo "🔔 Slack Notification Setup"
cat << 'JSON'
# Add to config.json
{
  "automation": {
    "notifications": {
      "slack": {
        "enabled": true,
        "webhook": "YOUR_SLACK_WEBHOOK_URL",
        "channels": {
          "critical": "#security-alerts",
          "normal": "#code-reviews"
        }
      }
    }
  }
}
JSON
echo ""

# ============================================================================
# Tips & Tricks
# ============================================================================

echo "💡 TIPS & TRICKS"
echo "──────────────────────────────────────────────────────────────"
echo ""

echo "TIP 1: Match protocol to PR size"
echo "   Small PR (<50 lines)    → rapid-fire"
echo "   Medium PR (50-300)      → round-robin or panel-discussion"
echo "   Large PR (300-1000)     → autogen-team or think-tank"
echo "   Huge PR (1000+)         → think-tank --thorough"
echo ""

echo "TIP 2: Use focus flags for faster reviews"
echo "   /council:review --focus=security      # Only security agents"
echo "   /council:review --focus=performance   # Only performance agents"
echo "   /council:review --focus=architecture  # Only architecture agents"
echo ""

echo "TIP 3: Combine options for power"
echo "   /council:review --protocol=red-blue-team \\"
echo "                   --focus=security \\"
echo "                   --size=thorough \\"
echo "                   --blocking"
echo ""

echo "TIP 4: Review specific files only"
echo "   /council:review --files='src/auth/**/*.ts'"
echo "   /council:review --files='**/*.{ts,tsx}'"
echo "   /council:review --pr=123"
echo ""

echo "TIP 5: Learn about protocols before using"
echo "   /council:explain protocols                # See all"
echo "   /council:explain red-blue-team           # Learn specific one"
echo "   /council:explain --examples              # See examples"
echo ""

# ============================================================================
# Next Steps
# ============================================================================

echo "🎯 NEXT STEPS"
echo "──────────────────────────────────────────────────────────────"
echo ""
echo "1. Try your first review:        /council:review"
echo "2. Read the quick start:         cat QUICK_START.md"
echo "3. Run the setup wizard:         /council:setup"
echo "4. Explore different protocols:  Try 3-5 from above"
echo "5. Configure automation:         Edit config.json"
echo "6. Integrate with CI/CD:         Add GitHub Actions"
echo ""

echo "📚 Full documentation: README.md"
echo "❓ Get help:           /council:explain"
echo "📊 View history:       /council:history"
echo ""
echo "Happy deliberating! 🏛️"
