# Consensus Building Skill

**Skill Type:** Collaborative Decision-Making
**Complexity:** Intermediate
**Activation:** Consensus, Jury, Delphi, Consensus Circle protocols

## Purpose

Consensus Building is the skill of moving from diverse opinions to shared agreement. It's not about forcing unanimity or accepting lowest-common-denominator compromises, but finding solutions that all agents can support.

## Core Concepts

### What Consensus IS
- ✅ **Shared understanding** of the issue
- ✅ **Everyone can live with** the decision
- ✅ **Incorporates key concerns** from all perspectives
- ✅ **Collaborative problem-solving**

### What Consensus IS NOT
- ❌ **Unanimous agreement** - Not everyone has to love it
- ❌ **Majority vote** - Not 51% overruling 49%
- ❌ **Compromise** - Not splitting difference poorly
- ❌ **Groupthink** - Not suppressing dissent

## Consensus Models

### Full Consensus (90%+ threshold)
```yaml
model: full-consensus
threshold: 0.9
characteristics:
  - Very high bar for agreement
  - Minority opinion preserved but doesn't block
  - Used for critical decisions
  - Slower but more thorough
```

### Working Consensus (75-80% threshold)
```yaml
model: working-consensus
threshold: 0.75-0.8
characteristics:
  - Reasonable agreement level
  - Balances inclusion with efficiency
  - Used for normal decisions
  - Practical for most reviews
```

### Consent (Not Consensus)
```yaml
model: consent
threshold: "No paramount objections"
characteristics:
  - Different from consensus
  - "Can you live with this?" vs "Do you agree?"
  - Lower bar, faster decisions
  - Used in Sociocracy
```

## Consensus Building Techniques

### 1. Gradients of Agreement
```
Strong Yes:    "I fully support this"
Yes:           "I agree"
Weak Yes:      "I can live with this"
Neutral:       "I have no strong opinion"
Weak No:       "I have reservations but won't block"
No:            "I don't support this"
Strong No:     "I will block this decision" (rare)
```

**Use:** Poll agents on where they stand, focus on moving weak no to weak yes

### 2. Principled Negotiation
```yaml
approach: separate-people-from-problem
steps:
  1. Focus on interests, not positions
     Position: "We should use Redis"
     Interest: "We need fast caching"

  2. Generate options before deciding
     Options: Redis, Memcached, in-memory, file-based

  3. Use objective criteria
     Criteria: Speed, reliability, operational complexity

  4. Develop mutually beneficial solutions
     Decision: Redis with fallback to in-memory
```

### 3. Iterative Refinement
```yaml
approach: propose-revise-repropose
rounds:
  1. Initial proposal (often contentious)
  2. Gather concerns and reservations
  3. Revise proposal addressing key concerns
  4. Re-poll (usually higher agreement)
  5. Repeat until consensus threshold met
```

### 4. Synthesizing Opposing Views
```yaml
approach: integrate-opposites
pattern:
  - Agent A: "We should prioritize security"
  - Agent B: "We should prioritize user experience"
  - Synthesis: "Let's implement 2FA as optional with smooth UX"

result: Both perspectives honored in integrated solution
```

### 5. Stacking (Building on Ideas)
```yaml
approach: yes-and-thinking
pattern:
  - Agent 1: "Add rate limiting"
  - Agent 2: "Yes, AND adaptive rate limiting based on user behavior"
  - Agent 3: "Yes, AND allow admins to whitelist trusted IPs"

result: Original idea enhanced, not replaced
```

## Consensus Building Process

### Phase 1: Divergence (Generate Options)
```
Goal: Surface all perspectives and ideas
Techniques:
  - Brainstorming
  - Silent generation
  - What if...? questions
  - Build on each other
Output: Many ideas, no evaluation yet
```

### Phase 2: Emergence (Find Patterns)
```
Goal: Identify common ground and conflicts
Techniques:
  - Group similar ideas
  - Identify shared values
  - Surface key tensions
  - Clarify misunderstandings
Output: Clearer picture of landscape
```

### Phase 3: Convergence (Build Agreement)
```
Goal: Move toward shared decision
Techniques:
  - Synthesize proposals
  - Test for consensus
  - Address reservations
  - Iterate refinements
Output: Decision with broad support
```

## Handling Dissent

### Types of Dissent

#### 1. Principled Objection
```
Nature: "This violates our security standards"
Response: Must address, may require major revision
```

#### 2. Preference Disagreement
```
Nature: "I prefer approach B over A"
Response: Acknowledge but may proceed if not blocking
```

#### 3. Need More Information
```
Nature: "I don't understand the implications"
Response: Provide information, may delay decision
```

#### 4. Process Objection
```
Nature: "We rushed this decision"
Response: Address process, may restart
```

### Responding to Blocks

```yaml
when_agent_blocks:
  1. Understand the concern deeply
     Ask: "What specifically concerns you?"
          "What would need to change?"

  2. Check if block is principled
     Principled: Based on values/standards (must address)
     Preference: Personal preference (may override)

  3. Explore alternatives
     Ask: "What alternative would you support?"

  4. Test modified proposals
     Iterate until block is lifted or override needed

  5. Document dissent if proceeding
     Preserve minority opinion in record
```

## Consensus Indicators

### Signs Consensus Is Near
- ✅ Concerns have been addressed
- ✅ Language shifts from "I" to "we"
- ✅ Agents building on each other
- ✅ Energy is positive
- ✅ Silence feels comfortable, not tense

### Signs Consensus Is Far
- ❌ Same arguments repeating
- ❌ Personal attacks or tension
- ❌ Agents talking past each other
- ❌ No new information emerging
- ❌ Energy is negative or stuck

### Signs of False Consensus
- 🚩 Silence from some agents (fear, not agreement)
- 🚩 Agreement too quick (avoiding conflict)
- 🚩 Vague wording that papers over disagreement
- 🚩 "Whatever" energy (resignation, not consent)

## Consensus Testing

### Test Questions
```
Moderator: "Can everyone live with this proposal?"

If no: "What would need to change for you to consent?"

If reservations: "Is your concern blocking or non-blocking?"

If unclear: "On a scale of strong-yes to strong-no, where are you?"
```

### Temperature Check
```yaml
technique: gradient-polling
poll: "Where are you on this proposal?"

results:
  strong-yes: 2 agents
  yes: 3 agents
  weak-yes: 1 agent
  weak-no: 1 agent

analysis: 85% positive (weak-yes and above) = working consensus
action: Address weak-no concern, then proceed
```

## Common Consensus Pitfalls

### Pitfall: Premature Consensus
**Problem:** Agreeing too quickly without exploring fully
**Solution:** Devil's advocate, structured dissent, deeper questioning

### Pitfall: Consensus at Any Cost
**Problem:** Watering down decision to get agreement
**Solution:** Maintain quality standards, allow blocking for principle

### Pitfall: Endless Discussion
**Problem:** Never reaching consensus, analysis paralysis
**Solution:** Time-box, escalate to smaller group, use voting

### Pitfall: Silent Disagreement
**Problem:** Agents agree publicly but disagree privately
**Solution:** Anonymous polling, psychological safety, proactive outreach

### Pitfall: Tyranny of the Minority
**Problem:** One dissenter blocking reasonable majority
**Solution:** Distinguish principle from preference, override option

## Integration with Protocols

### Delphi Method
- Anonymous rounds prevent groupthink
- Iterative refinement builds consensus
- Convergence measured quantitatively

### Jury Deliberation
- Discussion until super-majority (66%) reached
- Dissent recorded if not unanimous
- Secret ballot ensures honest opinion

### Consensus Circle
- Speaking token ensures all voices heard
- Blocking allowed but requires alternative
- Full consent required

### Panel Discussion
- Open discussion to emerge consensus
- Moderator guides toward agreement
- Flexible process adapts to group

## Examples

### Example 1: Moving from Disagreement to Consensus
```
Initial state:
  - 3 agents: "APPROVE" (security looks good)
  - 2 agents: "REJECT" (performance concerns)

Consensus building:
  [Moderator]: "We have a split. Performance team, what are your concerns?"
  [Performance agent]: "The N+1 query pattern will cause slowdown at scale"
  [Security agent]: "Can we fix N+1 without changing security model?"
  [Performance agent]: "Yes, eager loading would work"
  [Code architect]: "I'll add eager loading. Estimated 30 minutes"

  [Moderator]: "With eager loading fix, can everyone consent?"
  [All agents]: "Yes"

Final state:
  - Verdict: APPROVE_WITH_CHANGES
  - Required: Add eager loading
  - Consensus: 100%
```

### Example 2: Handling a Block
```
Proposal: "Approve PR with minor documentation updates"

[Security agent]: "I block this proposal"
[Moderator]: "Can you explain your block?"
[Security agent]: "Line 45 has SQL injection vulnerability. This is a security
                   standard violation, not a minor issue."
[Moderator]: "Is this a principled objection?"
[Security agent]: "Yes, our standard is no critical vulnerabilities in production"

[Code architect]: "What if we fix the SQL injection now before merge?"
[Security agent]: "That would address my concern"

[Moderator]: "Modified proposal: Approve after SQL injection fix"
[All agents]: "Consent"

Final: Block was principled and valid, modified proposal achieves consensus
```

### Example 3: Iterative Refinement
```
Round 1: "Approve this caching implementation"
  Results: 40% yes, 40% weak-no, 20% no
  Concerns: Complexity, operational burden, cache invalidation

Round 2: "Approve caching with simplified invalidation strategy"
  Results: 60% yes, 30% weak-yes, 10% weak-no
  Concerns: Still operational burden

Round 3: "Approve caching with auto-TTL and monitoring alerts"
  Results: 80% yes, 20% weak-yes
  Concerns: None blocking

Consensus achieved at 100% positive (yes or weak-yes)
```

---

**Skill Difficulty:** Intermediate
**Time Investment:** Worth it for important decisions
**Best Paired With:** Deliberation, Dissent Preservation
