# Adversarial Review Skill

**Skill Type:** Opposition & Critique
**Complexity:** Advanced
**Activation:** Adversarial protocols, Devil's Advocate, Red/Blue Team

## Purpose

Adversarial Review is the art of productive opposition - actively seeking flaws, challenging assumptions, and stress-testing code through systematic criticism. Unlike toxic negativity, adversarial review is constructive opposition aimed at improving quality.

## Core Principles

### 1. Assume Nothing
- **Question assumptions** - "Is this assumption valid?"
- **Challenge givens** - "Does this have to be this way?"
- **Test boundaries** - "What happens at the edges?"

### 2. Seek to Break
- **Offensive mindset** - How can this fail?
- **Exploit scenarios** - What's the worst case?
- **Edge cases** - What inputs weren't considered?

### 3. Evidence-Based Opposition
- **Concrete examples** - Show, don't tell
- **Proof of concepts** - Demonstrate exploits
- **Reproducible issues** - Step-by-step reproduction

### 4. Constructive Criticism
- **Explain why** - Rationale for concerns
- **Suggest alternatives** - Don't just tear down
- **Acknowledge trade-offs** - Balance criticism with context

## Techniques

### Attack Surface Mapping
```yaml
technique: map-attack-surface
steps:
  1. Identify entry points (user inputs, APIs, file uploads)
  2. Trace data flows (input → processing → storage → output)
  3. Find trust boundaries (client/server, user/admin)
  4. List assumptions (auth required, input validated, etc.)
  5. Attack each assumption systematically
```

### Assumption Challenging
```yaml
technique: challenge-assumptions
pattern:
  - Implicit assumption: "Users will provide valid input"
  - Challenge: "What if input is null? Empty? Malicious?"
  - Test: "Send payload: <script>alert('xss')</script>"
  - Result: "XSS vulnerability confirmed"
```

### Devil's Advocate Protocol
```yaml
technique: devils-advocate
role: Dedicated opposition agent
responsibilities:
  - Argue against approval regardless of code quality
  - Find at least 3 concerns (real or theoretical)
  - Challenge every positive claim
  - Present worst-case scenarios
  - Force defenders to strengthen arguments
```

### Red Team Methodology
```yaml
technique: red-team
approach:
  reconnaissance:
    - Read code as attacker would
    - Identify high-value targets (auth, payments, data access)
    - Map attack vectors

  weaponization:
    - Craft exploits for identified vulnerabilities
    - Build proof-of-concept attacks
    - Test exploitability

  reporting:
    - Severity assessment (CVSS scoring)
    - Exploit scenarios
    - Impact analysis
    - Remediation recommendations
```

## Attack Vectors

### Input Validation
- SQL injection
- Command injection
- XSS (reflected, stored, DOM)
- Path traversal
- XXE
- LDAP injection
- NoSQL injection

### Authentication & Authorization
- Broken authentication
- Session fixation
- Credential stuffing
- Privilege escalation
- IDOR
- Missing function-level access control

### Business Logic
- Race conditions
- State machine flaws
- Arithmetic errors
- Logic bypasses
- Workflow violations

### Data Security
- Sensitive data exposure
- Insufficient encryption
- Insecure deserialization
- Mass assignment
- Information disclosure

### Configuration
- Default credentials
- Excessive permissions
- Insecure defaults
- Unnecessary features enabled
- Verbose error messages

## Adversarial Patterns

### Pattern: Attacker's Perspective
```
Developer thinking: "This validates email format"
Attacker thinking: "What if I send email=../../etc/passwd?"

Developer thinking: "Users click login button"
Attacker thinking: "What if I POST directly to /auth bypassing UI?"

Developer thinking: "Admin role checked on line 12"
Attacker thinking: "What if I modify JWT role claim?"
```

### Pattern: Stress Testing
```
Normal case: 1 user, valid input, happy path
Stress test:
  - 10,000 concurrent users
  - Malformed input
  - Null/undefined values
  - Empty strings
  - Extremely long strings (10MB+)
  - Special characters
  - Different encodings (UTF-8, UTF-16)
  - Unexpected types (array instead of string)
```

### Pattern: Exploit Chain
```
Weakness 1: CORS allows any origin
Weakness 2: Cookie without SameSite
Weakness 3: JSON endpoint doesn't validate content-type

Chain: Attacker hosts evil.com → sends form POST →
       CORS allows → cookie sent → CSRF successful
```

## Effective Adversarial Questions

### Architecture
- ❓ What happens if this service is down?
- ❓ How does this scale to 10x load?
- ❓ What's the failure mode?
- ❓ Can this be abused for DoS?

### Security
- ❓ What if user input contains `'; DROP TABLE users;--`?
- ❓ Can user A access user B's data?
- ❓ Is this endpoint rate-limited?
- ❓ What secrets are in the code?

### Logic
- ❓ What if this function is called twice simultaneously?
- ❓ What if the database transaction fails midway?
- ❓ Can quantities be negative?
- ❓ What's the boundary condition?

### Data
- ❓ Is PII encrypted at rest?
- ❓ Are passwords hashed with salt?
- ❓ Can this leak in error messages?
- ❓ Is this logged when it shouldn't be?

## Red Team vs Blue Team

### Red Team (Offense)
**Objective:** Find vulnerabilities
**Mindset:** Break the code
**Success:** Discovered flaws
**Tactics:** Creative attacks, edge cases, exploit chains

### Blue Team (Defense)
**Objective:** Justify and mitigate
**Mindset:** Protect the code
**Success:** Effective mitigations
**Tactics:** Defense-in-depth, fixes, compensating controls

### Collaboration
- Red finds issue → Blue proposes mitigation → Red tests mitigation → Repeat
- Goal: Secure code, not "winning"
- Mutual respect essential

## Adversarial Review Checklist

### Before Review
- [ ] Understand code scope and purpose
- [ ] Identify attack surfaces
- [ ] Review OWASP Top 10
- [ ] Check for known CVEs in dependencies
- [ ] Prepare testing tools (if applicable)

### During Review
- [ ] Challenge every assumption
- [ ] Test edge cases
- [ ] Look for common vulnerabilities
- [ ] Consider attacker perspective
- [ ] Document findings with evidence

### After Review
- [ ] Prioritize findings by severity
- [ ] Provide reproducible exploits
- [ ] Suggest concrete mitigations
- [ ] Rate exploitability
- [ ] Estimate impact

## Output Format

```yaml
adversarial_findings:
  - vulnerability: "SQL Injection in User Search"
    location: "src/api/users.ts:45"
    severity: CRITICAL
    exploitability: EASY
    proof_of_concept: |
      curl -X POST /api/users/search \
        -d "term=' OR 1=1 --"
      Result: Returns all users in database
    impact: "Complete data breach, ~10,000 user records exposed"
    cvss: 9.8
    recommendation: "Use parameterized queries"

  - vulnerability: "Missing Authentication on Admin Endpoint"
    location: "src/api/admin.ts:23"
    severity: CRITICAL
    exploitability: TRIVIAL
    proof_of_concept: |
      curl /api/admin/users
      Result: Returns all users, no auth required
    impact: "Admin functions accessible to anonymous users"
    cvss: 9.1
    recommendation: "Add authentication middleware"
```

## Balancing Adversarial Review

### Too Aggressive ❌
- Nitpicking trivial issues
- Theoretical concerns with no practical impact
- Personal attacks on developers
- Blocking for opinion differences

### Too Passive ❌
- Accepting claims without evidence
- Avoiding conflict
- Agreeing too quickly
- Missing obvious issues

### Just Right ✅
- Focus on exploitable vulnerabilities
- Provide concrete examples
- Respect defenders while challenging code
- Balance criticism with pragmatism

## Integration with Protocols

### Adversarial Protocol
- Attacker role uses this skill heavily
- Defender role uses it to anticipate attacks
- Judge weighs adversarial findings

### Devil's Advocate Protocol
- Devil's advocate agent employs these techniques
- Mandatory opposition to everything
- Forces strengthening of all arguments

### Red/Blue Team Protocol
- Red team embodies adversarial review
- Blue team must understand it to defend
- Battle rounds iterate on adversarial findings

## Examples

### Example: SQL Injection Attack
```
Code under review:
  const results = await db.query(`SELECT * FROM users WHERE name = '${req.body.name}'`);

Adversarial review:
  "This concatenates user input directly into SQL query. Attack:
   POST /api/users with name=' OR 1=1 --

   Result: Query becomes SELECT * FROM users WHERE name = '' OR 1=1 --'
   This returns all users, bypassing name filter.

   Severity: CRITICAL
   Recommendation: Use parameterized query:
   db.query('SELECT * FROM users WHERE name = ?', [req.body.name])"
```

### Example: Authorization Bypass
```
Code under review:
  if (user.role === 'admin') {
    // allow access
  }

Adversarial review:
  "Role is checked but user object comes from JWT without server-side validation.
   Attack: Modify JWT payload to set role: 'admin'

   Even though JWT signature won't validate, check if signature validation
   actually happens. Testing shows line 8 reads JWT but doesn't verify signature.

   Severity: CRITICAL
   Recommendation: Verify JWT signature AND store roles server-side"
```

---

**Skill Difficulty:** Advanced
**Required Mindset:** Constructive skepticism
**Best Paired With:** Consensus Building (to balance negativity)
