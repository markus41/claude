# Deliberation Skill

**Skill Type:** Multi-Agent Coordination
**Complexity:** Advanced
**Prerequisites:** Council formation, protocol selection
**Activation:** Automatic when council convenes

## Purpose

The Deliberation skill enables structured multi-agent discussion, debate, and collaborative decision-making. It provides frameworks and techniques for effective agent coordination across all deliberation protocols.

## Core Competencies

### 1. Structured Discussion Management
- **Turn-taking coordination** - Ensure fair speaking opportunities
- **Time management** - Keep deliberation within bounds
- **Topic management** - Maintain focus on code under review
- **Conflict resolution** - Navigate disagreements productively

### 2. Protocol Execution
- **Protocol interpretation** - Understand and execute chosen protocol
- **Role assignment** - Ensure agents fulfill their designated roles
- **Phase transitions** - Move smoothly between deliberation stages
- **Rule enforcement** - Maintain protocol integrity

### 3. Context Preservation
- **Shared context** - Ensure all agents have necessary information
- **Memory management** - Track what has been discussed
- **Reference maintenance** - Link findings to specific code locations
- **Continuity** - Maintain thread across deliberation rounds

### 4. Quality Assurance
- **Coverage checking** - Ensure all important aspects reviewed
- **Depth calibration** - Balance breadth vs depth appropriately
- **Evidence validation** - Require concrete examples, not hand-waving
- **Logical consistency** - Check arguments for soundness

## Techniques

### Round-Based Deliberation
```yaml
technique: round-based
structure:
  - round_1: Initial positions and observations
  - round_2: Challenges and refinements
  - round_3: Synthesis and consensus (if needed)

benefits:
  - Progressive refinement
  - Equal participation
  - Structured evolution of ideas
```

### Parallel-Then-Converge
```yaml
technique: parallel-then-converge
structure:
  - phase_1: All agents analyze independently (parallel)
  - phase_2: Share findings and identify patterns
  - phase_3: Resolve conflicts and converge on verdict

benefits:
  - Efficient use of agent time
  - Diversity of initial perspectives
  - Avoid groupthink
```

### Hierarchical Deliberation
```yaml
technique: hierarchical
structure:
  - level_1: Working groups analyze specific aspects
  - level_2: Group leads synthesize group findings
  - level_3: Executive summary and verdict

benefits:
  - Clear accountability
  - Scalable to large reviews
  - Efficient information flow
```

### Adversarial Deliberation
```yaml
technique: adversarial
structure:
  - role_1: Prosecution (find flaws)
  - role_2: Defense (justify and mitigate)
  - role_3: Judge (weigh evidence)

benefits:
  - Thorough flaw discovery
  - Practical mitigations emerge
  - High confidence in verdict
```

## Deliberation Patterns

### Pattern: Build-On-Previous
**Used in:** Round Robin, Panel Discussion

```
Agent 1: "The authentication flow has three stages: login, token refresh, logout."

Agent 2: "Building on the flow Agent 1 described, I notice the token refresh
          mechanism uses JWT with 15-min expiry..."

Agent 3: "Expanding on the JWT concerns Agent 2 raised, the signature validation
          happens on line 45, but there's no audience claim check..."

Agent 4: "Considering the security gap Agent 3 identified, plus the overall flow
          from Agent 1, I recommend adding audience validation AND..."
```

### Pattern: Challenge-And-Refine
**Used in:** Adversarial, Red/Blue Team

```
Attacker: "This code is vulnerable to SQL injection on line 45."

Defender: "I disagree. The query uses parameterized statements, see line 43."

Attacker: "Fair point on line 43, but line 48 concatenates user input directly.
           Here's an exploit POC: [code]"

Defender: "You're right about line 48. Here's a mitigation: [code]. This fixes
           the vulnerability while maintaining functionality."

Judge: "Vulnerability confirmed. Mitigation is effective. Verdict: APPROVE after
        applying mitigation."
```

### Pattern: Perspective-Rotation
**Used in:** Six Thinking Hats, Fishbowl

```
White Hat (Facts): "Code changes 47 files, adds 1,200 lines, test coverage 82%."

Black Hat (Risks): "Risk: Breaking change to public API. Risk: Performance
                    regression in critical path."

Yellow Hat (Benefits): "Benefit: Simplifies error handling. Benefit: Reduces
                        technical debt by 30%."

Green Hat (Alternatives): "Alternative: Could use adapter pattern to maintain
                           backward compatibility."

Blue Hat (Meta): "Summary: Trade-off between simplicity (pro) and breaking
                  change (con). Recommendation: Accept breaking change but version
                  it properly and provide migration guide."
```

### Pattern: Silent-Then-Share
**Used in:** Lightning Decision Jam, Delphi

```
[3 minutes silent work - all agents identify problems independently]

Agent 1: [Posts] "Problem: Insufficient error handling"
Agent 2: [Posts] "Problem: Performance bottleneck in loop"
Agent 3: [Posts] "Problem: Insufficient error handling"  [duplicate]
Agent 4: [Posts] "Problem: Missing input validation"

[2 minutes voting - agents vote on priority]

Results: "Insufficient error handling" (2 votes), "Performance bottleneck" (3 votes),
         "Missing validation" (1 vote)

[Continue to solution phase focusing on top-voted problems]
```

## Common Challenges & Solutions

### Challenge: Groupthink
**Symptoms:** All agents quickly agree without deep analysis

**Solutions:**
- Use adversarial protocols (Devil's Advocate, Red/Blue Team)
- Require evidence for claims
- Anonymous voting (Delphi method)
- Rotate perspectives (Fishbowl, Six Hats)

### Challenge: Analysis Paralysis
**Symptoms:** Deliberation goes in circles, no convergence

**Solutions:**
- Time-box deliberation phases
- Use rapid protocols (Rapid Fire, Lightning Decision Jam)
- Appoint decision-maker (AutoGen manager, Moderator)
- Escalate to smaller group

### Challenge: Dominant Agent
**Symptoms:** One agent speaks much more than others

**Solutions:**
- Enforce equal speaking time (Round Robin)
- Use silent phases (Lightning Decision Jam)
- Anonymous contributions (Delphi)
- Moderator intervention

### Challenge: Scope Creep
**Symptoms:** Discussion drifts to unrelated topics

**Solutions:**
- Moderator refocuses discussion
- Explicit topic boundaries
- Parking lot for out-of-scope items
- Time-boxing per topic

### Challenge: Shallow Analysis
**Symptoms:** Agents agree quickly without depth

**Solutions:**
- Require devil's advocate
- Mandate specific evidence
- Multiple deliberation rounds
- Red team to actively attack

## Best Practices

### Before Deliberation
1. ✅ Ensure all agents have access to code under review
2. ✅ Clarify scope and objectives
3. ✅ Assign roles based on protocol
4. ✅ Set time expectations
5. ✅ Establish shared vocabulary

### During Deliberation
1. ✅ Follow protocol structure
2. ✅ Cite specific code locations
3. ✅ Provide evidence for claims
4. ✅ Build on previous contributions
5. ✅ Challenge constructively
6. ✅ Stay focused on topic

### After Deliberation
1. ✅ Synthesize findings clearly
2. ✅ Preserve minority opinions
3. ✅ Document rationale
4. ✅ Define clear action items
5. ✅ Specify confidence level

## Deliberation Quality Metrics

### Coverage
- ❓ Were all critical code paths reviewed?
- ❓ Were all major concern areas addressed (security, performance, maintainability)?
- ❓ Were edge cases considered?

### Depth
- ❓ Did analysis go beyond surface-level observations?
- ❓ Were root causes identified, not just symptoms?
- ❓ Were implications and consequences explored?

### Diversity
- ❓ Were multiple perspectives represented?
- ❓ Did agents genuinely disagree at times?
- ❓ Were unconventional ideas considered?

### Evidence
- ❓ Were claims backed by code references?
- ❓ Were concrete examples provided?
- ❓ Were metrics or data cited?

### Actionability
- ❓ Is the verdict clear and unambiguous?
- ❓ Are action items specific and achievable?
- ❓ Is it clear what needs to happen next?

## Integration with Other Skills

- **Adversarial Review** - Specialized deliberation technique
- **Consensus Building** - Resolution phase of deliberation
- **Dissent Preservation** - Capturing deliberation outcomes
- **Verdict Writing** - Documenting deliberation results
- **Expertise Matching** - Input to deliberation (who participates)

## Examples

### Example 1: Round Robin Deliberation
```
Protocol: Round Robin
Panel: 5 agents
Rounds: 2

Round 1 (Initial Analysis):
  [security-sentinel]: "API authentication uses JWT, signature validated ✓"
  [code-architect]: "Building on security review, architecture follows REST..."
  [performance-guardian]: "Expanding on architecture, I see N+1 query on line 67..."
  [maintainability-advocate]: "Regarding performance, code is readable but..."
  [domain-expert]: "Considering all above, business logic correctly implements..."

Round 2 (Refinement):
  [security-sentinel]: "Refining: JWT is good but no rate limiting ⚠"
  [code-architect]: "Agree on rate limiting. Also suggest circuit breaker..."
  [performance-guardian]: "On my N+1 concern: could be solved with eager loading..."
  [maintainability-advocate]: "Support circuit breaker idea, minimal complexity..."
  [domain-expert]: "All suggestions align with business requirements ✓"

Synthesis:
  - VERDICT: APPROVE_WITH_CHANGES
  - Required: Fix N+1 query, add rate limiting
  - Recommended: Add circuit breaker
  - Confidence: 0.85
```

### Example 2: Red/Blue Team Deliberation
```
Protocol: Red/Blue Team
Teams: 3 red, 3 blue
Adjudicator: moderator-agent

Round 1:
  [Red Team]: Identified 3 vulnerabilities (SQL injection, XSS, auth bypass)
  [Blue Team]: Proposed mitigations for all 3

Round 2:
  [Red Team]: Tested mitigations, SQL and XSS fixes work, auth bypass still exploitable
  [Blue Team]: Refined auth bypass fix

Round 3:
  [Red Team]: All mitigations now effective ✓
  [Blue Team]: Ready for production after applying fixes

[Adjudicator]: VERDICT: APPROVE (after applying 3 mitigations)
```

## Activation

This skill is automatically activated when:
- Council is convened (`/council:convene`)
- Deliberation protocol is selected
- Multiple agents are participating

Can also be manually invoked:
- `Use deliberation techniques for this discussion`
- `Apply structured deliberation`
- `Follow deliberation best practices`

---

**Skill Level:** Advanced
**Time to Learn:** 10+ council sessions
**Mastery Indicators:** Clean protocol execution, productive debates, high-quality verdicts
