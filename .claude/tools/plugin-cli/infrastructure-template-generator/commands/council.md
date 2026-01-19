---
name: itg:council
description: Run multi-agent council review for template improvements
version: 1.0.0
category: quality
author: Brookside BI
arguments:
  - name: template-path
    description: Path to template or code to review
    required: true
    type: string
flags:
  - name: protocol
    description: Council review protocol
    type: choice
    choices: [expert-panel, red-blue-team, six-thinking-hats, rapid-fire, delphi]
    default: expert-panel
  - name: focus
    description: Comma-separated focus areas
    type: string
    default: "security,performance,quality,docs"
  - name: threshold
    description: Minimum approval threshold (0-1)
    type: number
    default: 0.7
  - name: output
    description: Output directory for review results
    type: string
    default: "./reviews"
  - name: format
    description: Output format
    type: choice
    choices: [markdown, json]
    default: markdown
  - name: auto-fix
    description: Automatically apply recommended fixes
    type: boolean
    default: false
aliases:
  - itg:review
  - itg:council-review
presets:
  - name: quick-review
    description: Fast review with rapid-fire protocol
    flags:
      protocol: rapid-fire
      focus: "security,quality"
      auto-fix: false
  - name: security-audit
    description: Deep security-focused review
    flags:
      protocol: red-blue-team
      focus: "security,harness"
      threshold: 0.9
  - name: quality-gate
    description: Comprehensive quality review with auto-fix
    flags:
      protocol: expert-panel
      focus: "security,performance,quality,docs,harness"
      threshold: 0.8
      auto-fix: true
  - name: iterative
    description: Delphi consensus-building review
    flags:
      protocol: delphi
      threshold: 0.85
---

# Multi-Agent Council Review for Infrastructure Templates

**Best for:** Systematic quality assurance through collaborative AI agent review protocols, identifying issues, proposing improvements, and building consensus on infrastructure template quality.

## Overview

The `itg:council` command orchestrates multiple specialized AI agents in structured review protocols to analyze infrastructure templates, code, and configurations. Each agent brings domain expertise (security, performance, quality, documentation, Harness integration) and collaborates through proven deliberation frameworks to produce comprehensive assessments and actionable recommendations.

**Business Value:**
- Catches critical issues before production deployment
- Provides multi-perspective analysis beyond single-reviewer bias
- Automates code review tasks freeing human experts for high-value work
- Establishes consistent quality standards across teams
- Documents decision rationale for compliance and knowledge transfer
- Accelerates iteration cycles with automated fix suggestions

## Council Review Protocols

### Expert Panel (Default)

Independent expert review followed by consensus building.

**Best for:** Comprehensive quality assessment with diverse specialist perspectives.

**Process:**
1. **Independent Analysis Phase** - Each expert reviews independently
2. **Findings Presentation** - Experts present findings without discussion
3. **Deliberation Phase** - Open discussion of disagreements
4. **Consensus Building** - Vote on recommendations
5. **Final Report** - Synthesized findings with approval ratings

**Participants:**
- Security Expert
- Performance Engineer
- Quality Analyst
- Documentation Specialist
- Harness Platform Expert

**Example Output:**
```markdown
# Expert Panel Review: terraform-aws-infrastructure

## Executive Summary
**Approval Rating:** 82% (6/10 threshold met)
**Overall Assessment:** APPROVED WITH RECOMMENDATIONS
**Review Date:** 2025-01-19

## Expert Findings

### Security Expert (Rating: 8/10)
**Critical Issues:** None
**Major Issues:**
- Secrets hardcoded in variables.tf (lines 23-27)
- IAM roles overly permissive (aws_iam_policy.lambda_exec)

**Recommendations:**
- Use AWS Secrets Manager references
- Apply principle of least privilege to IAM policies
- Enable encryption at rest for S3 buckets

### Performance Engineer (Rating: 9/10)
**Strengths:**
- Efficient resource provisioning
- Appropriate use of auto-scaling
- Well-configured CloudFront caching

**Minor Issues:**
- Lambda memory allocation conservative (512MB → 1024MB recommended)
- RDS instance size may be undersized for production load

### Quality Analyst (Rating: 7/10)
**Issues:**
- Missing input validation for several variables
- No resource tagging strategy
- Inconsistent naming conventions (camelCase vs snake_case)

**Recommendations:**
- Add validation blocks to all variable definitions
- Implement mandatory tagging via `default_tags`
- Standardize on snake_case per Terraform conventions

### Documentation Specialist (Rating: 8/10)
**Gaps:**
- README missing prerequisites section
- No examples directory
- Variable descriptions incomplete

**Recommendations:**
- Add setup instructions with required tools/versions
- Create examples/ with common deployment scenarios
- Enhance variable descriptions with constraints and defaults

### Harness Platform Expert (Rating: 9/10)
**Strengths:**
- Well-structured for Harness IaCM integration
- Appropriate module decomposition
- Clear output definitions for downstream consumption

**Recommendations:**
- Add workspace configuration for multi-environment support
- Include Harness IaCM plugin configuration example

## Consensus Recommendations

### Priority 1 (Critical - Must Fix)
1. Remove hardcoded secrets (Security)
2. Add input validation (Quality)

### Priority 2 (Important - Should Fix)
3. Refine IAM permissions (Security)
4. Implement tagging strategy (Quality)
5. Add README prerequisites (Documentation)

### Priority 3 (Nice to Have)
6. Optimize Lambda memory allocation (Performance)
7. Add deployment examples (Documentation)
8. Include Harness workspace config (Harness)

## Auto-Fix Available
The following issues can be automatically remediated:
- Standardize naming conventions (23 occurrences)
- Add default tags block to aws provider
- Generate basic README structure
```

### Red Team / Blue Team

Adversarial review with attack and defense perspectives.

**Best for:** Security-focused analysis and infrastructure hardening.

**Process:**
1. **Red Team Phase** - Attempts to find vulnerabilities and weaknesses
2. **Blue Team Phase** - Defends design decisions and proposes mitigations
3. **Synthesis Phase** - Collaborative improvement recommendations
4. **Validation Phase** - Verify mitigations address red team concerns

**Example Output:**
```markdown
# Red/Blue Team Review: kubernetes-deployment

## Red Team Attack Vectors

### Attack Vector 1: Privilege Escalation
**Severity:** CRITICAL
**Description:** Container runs as root with privileged: true
**Exploitation:** Attacker with pod access gains node-level privileges
**Impact:** Full cluster compromise

### Attack Vector 2: Secrets Exposure
**Severity:** HIGH
**Description:** Database credentials in ConfigMap instead of Secret
**Exploitation:** Any pod in namespace can read credentials
**Impact:** Database compromise

### Attack Vector 3: Network Exposure
**Severity:** MEDIUM
**Description:** Service type: LoadBalancer without network policy
**Exploitation:** Unrestricted ingress from internet
**Impact:** DDoS, unauthorized access attempts

## Blue Team Mitigations

### Defense 1: Non-Root Container
**Addresses:** Attack Vector 1
**Implementation:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```

### Defense 2: Secrets Management
**Addresses:** Attack Vector 2
**Implementation:**
```yaml
# Use Kubernetes Secret
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: <base64>
  password: <base64>

# Or use External Secrets Operator
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  secretStoreRef:
    name: aws-secrets-manager
```

### Defense 3: Network Policy
**Addresses:** Attack Vector 3
**Implementation:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-ingress
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8080
```

## Validation Results
- ✓ Privilege escalation path eliminated
- ✓ Secrets properly isolated
- ✓ Network exposure minimized with policy enforcement

## Red Team Final Assessment
**Residual Risk:** LOW
All critical and high-severity vectors mitigated effectively.
```

### Six Thinking Hats

Structured parallel thinking exploring different perspectives.

**Best for:** Holistic evaluation balancing optimism, risk, and creativity.

**Hats:**
- **White Hat (Facts):** Objective data analysis
- **Red Hat (Emotions):** Intuition and user experience
- **Black Hat (Caution):** Risk identification and critical judgment
- **Yellow Hat (Optimism):** Benefits and value proposition
- **Green Hat (Creativity):** Innovative alternatives and improvements
- **Blue Hat (Process):** Meta-review and synthesis

**Example Output:**
```markdown
# Six Thinking Hats Review: harness-pipeline

## White Hat - Facts & Data
**Metrics:**
- Pipeline stages: 5 (Build, Test, Security Scan, Deploy Dev, Deploy Prod)
- Total steps: 23
- Estimated execution time: 15-20 minutes
- Resource requirements: 2 vCPU, 4GB RAM
- Dependencies: Docker, Kubernetes, AWS credentials

**Observations:**
- Uses Harness Cloud execution
- Implements approval gate for production
- Includes rollback steps
- No caching configured

## Red Hat - Intuition & Experience
**Developer Experience Concerns:**
- 15-20 minute pipeline feels slow for iterative development
- Production approval gate may cause deployment delays
- Error messages could be more actionable
- Lack of pipeline visualization in code

**Positive Feelings:**
- Clear separation of concerns across stages
- Rollback safety net provides confidence
- Security scanning included early

## Black Hat - Risks & Cautions
**Identified Risks:**
1. No timeout configuration - pipeline could hang indefinitely
2. Missing failure notifications - silent failures possible
3. Approval gate has no timeout - deployments could stall
4. No resource quotas - potential cost overruns
5. Secrets rotation not addressed

**Failure Scenarios:**
- Build succeeds but image push fails → no notification
- Deploy succeeds but health check fails → no automatic rollback
- Approval request lost → deployment never completes

## Yellow Hat - Benefits & Value
**Strengths:**
- Automates entire deployment pipeline
- Reduces manual deployment errors
- Enforces security scanning
- Provides deployment auditability
- Enables self-service for developers
- Scales across multiple environments

**Business Value:**
- Deployment time: 2 hours → 20 minutes (83% reduction)
- Error rate reduction: Estimated 70%
- Compliance: Built-in security gates

## Green Hat - Creative Improvements
**Innovative Ideas:**
1. **Parallel Testing:** Run unit, integration, and security tests in parallel
2. **Progressive Delivery:** Implement canary deployments with automated rollback
3. **Smart Caching:** Cache dependencies based on lockfile hash
4. **Predictive Deployments:** ML-based optimal deployment windows
5. **Self-Healing:** Automatic retry with exponential backoff

**Alternative Approaches:**
- Use matrix strategy for multi-environment parallel deployment
- Implement feature flags for zero-downtime releases
- Add smoke test stage with synthetic transactions

## Blue Hat - Process & Control
**Review Quality:** HIGH
All hats provided valuable perspectives

**Synthesis:**
The pipeline demonstrates solid fundamentals (White Hat) but has critical gaps in error handling and observability (Black Hat). While it delivers significant value (Yellow Hat), developer experience concerns (Red Hat) should be addressed. Creative improvements (Green Hat) offer substantial optimization opportunities.

**Recommended Next Steps:**
1. Implement timeout and notification improvements (Black Hat risks)
2. Add parallel testing and caching (Green Hat innovations)
3. Enhance error messaging (Red Hat concerns)
4. Measure and optimize execution time (White Hat metrics)

**Final Recommendation:** APPROVE with Priority 1 improvements
```

### Rapid Fire

Fast-paced iterative review with quick feedback cycles.

**Best for:** Quick quality checks during active development.

**Process:**
1. **5-Minute Reviews** - Each agent provides rapid assessment
2. **Immediate Scoring** - Binary pass/fail per criteria
3. **Quick Fixes** - Agent proposes immediate remediation
4. **Re-Review** - Fast validation of fixes

**Example Output:**
```markdown
# Rapid Fire Review: docker-compose.yaml

## Round 1 (2 minutes)

### Security Agent
- ❌ FAIL: Privileged containers detected
- ❌ FAIL: No resource limits
- ✓ PASS: No hardcoded secrets
**Quick Fix:** Add `privileged: false` and resource limits

### Performance Agent
- ✓ PASS: Appropriate service dependencies
- ❌ FAIL: No health checks configured
- ✓ PASS: Volume mounts optimized
**Quick Fix:** Add healthcheck directives

### Quality Agent
- ✓ PASS: Consistent naming
- ✓ PASS: Version pinning used
- ❌ FAIL: Missing labels
**Quick Fix:** Add metadata labels

**Round 1 Score:** 6/9 (67%) - BELOW THRESHOLD

## Rapid Fixes Applied

```yaml
services:
  api:
    image: api:1.2.3
    privileged: false          # SECURITY FIX
    deploy:
      resources:
        limits:
          cpus: '1'            # SECURITY FIX
          memory: 512M         # SECURITY FIX
    healthcheck:               # PERFORMANCE FIX
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    labels:                    # QUALITY FIX
      app: api
      environment: production
      version: 1.2.3
```

## Round 2 (1 minute validation)

### Security Agent
- ✓ PASS: No privileged containers
- ✓ PASS: Resource limits applied
- ✓ PASS: No hardcoded secrets

### Performance Agent
- ✓ PASS: Appropriate service dependencies
- ✓ PASS: Health checks configured
- ✓ PASS: Volume mounts optimized

### Quality Agent
- ✓ PASS: Consistent naming
- ✓ PASS: Version pinning used
- ✓ PASS: Metadata labels present

**Round 2 Score:** 9/9 (100%) - APPROVED

**Total Review Time:** 3 minutes
```

### Delphi Method

Anonymous iterative consensus building through multiple rounds.

**Best for:** Complex decisions requiring expert consensus and eliminating groupthink.

**Process:**
1. **Round 1** - Anonymous independent assessments
2. **Summary Distribution** - Aggregate findings shared without attribution
3. **Round 2** - Experts revise assessments based on peer insights
4. **Round 3** - Final consensus ratings
5. **Synthesis** - Combined recommendations based on convergence

**Example Output:**
```markdown
# Delphi Consensus Review: terraform-module-design

## Round 1 - Independent Assessment

### Anonymous Expert Ratings (1-10 scale)
- Expert A: 7 - "Good structure but lacks flexibility"
- Expert B: 5 - "Module boundaries too coarse"
- Expert C: 8 - "Well-organized, minor improvements needed"
- Expert D: 6 - "Documentation insufficient"
- Expert E: 9 - "Strong design, good practices"

**Mean:** 7.0 | **Median:** 7 | **Range:** 4 | **StdDev:** 1.41

**Key Concerns (aggregated):**
- Module granularity (40% of experts)
- Documentation completeness (40%)
- Input validation (20%)
- Flexibility for different use cases (20%)

## Round 2 - Informed Reassessment

Experts were provided anonymized Round 1 feedback and asked to reconsider.

### Revised Ratings
- Expert A: 6 → "After seeing peer concerns, agree module too monolithic"
- Expert B: 6 → "Maintained position on module boundaries"
- Expert C: 7 → "Reconsidered after documentation concerns raised"
- Expert D: 7 → "Revised up after noting strong design fundamentals"
- Expert E: 8 → "Adjusted down considering flexibility concerns"

**Mean:** 6.8 | **Median:** 7 | **Range:** 2 | **StdDev:** 0.75

**Convergence:** Range reduced from 4 to 2 (50% improvement)
**Emerging Consensus:** Module needs decomposition and documentation enhancement

## Round 3 - Final Consensus

### Priority Recommendations (Expert Agreement)
1. **Decompose Module (100% agreement)**
   - Split into smaller, composable sub-modules
   - Separate networking, compute, and storage concerns

2. **Enhance Documentation (80% agreement)**
   - Add architecture diagrams
   - Include usage examples for common patterns
   - Document input/output contracts

3. **Add Validation (60% agreement)**
   - Implement validation blocks for all inputs
   - Add precondition checks for complex scenarios

4. **Improve Flexibility (60% agreement)**
   - Use dynamic blocks where appropriate
   - Provide sensible defaults with override capability

### Final Ratings
- Expert A: 6 (contingent on decomposition)
- Expert B: 6 (strong opinion on module boundaries)
- Expert C: 7 (supportive with documentation fixes)
- Expert D: 7 (documentation critical for approval)
- Expert E: 8 (believes fundamentals are strong)

**Final Mean:** 6.8/10
**Consensus Level:** MODERATE (StdDev < 1.0)
**Decision:** CONDITIONAL APPROVAL pending Priority 1 & 2 recommendations

## Rationale for Decision

**Strengths (unanimous):**
- Solid architectural foundation
- Good use of Terraform best practices
- Clear resource organization

**Required Improvements (strong agreement):**
- Module decomposition addresses scalability and reusability
- Documentation essential for team adoption

**Deferred Improvements (moderate agreement):**
- Validation and flexibility can be iterative enhancements

**Approval Contingency:**
Must address module decomposition and documentation (Priorities 1 & 2) before production use.
```

## Focus Areas

### Security

Analyzes security posture and identifies vulnerabilities.

**Coverage:**
- Secrets management and credential handling
- IAM policies and RBAC configurations
- Network security and isolation
- Encryption at rest and in transit
- Container security and image scanning
- Compliance with security standards (CIS, NIST)

**Output Example:**
```markdown
### Security Analysis

**Security Score:** 7.2/10

**Critical Findings:**
- [CRIT-001] Hardcoded AWS access keys in provider block
- [CRIT-002] S3 bucket public read access enabled

**High Priority:**
- [HIGH-001] Missing encryption for RDS instances
- [HIGH-002] Security group allows 0.0.0.0/0 ingress on port 22

**Medium Priority:**
- [MED-001] No VPC flow logs enabled
- [MED-002] CloudTrail logging not configured

**Recommendations:**
1. Use AWS Secrets Manager or HashiCorp Vault for credentials
2. Enable default encryption for all S3 buckets
3. Restrict SSH access to bastion host only
4. Enable VPC flow logs for network monitoring
```

### Performance

Evaluates resource efficiency and optimization opportunities.

**Coverage:**
- Resource sizing and allocation
- Caching strategies
- Database query optimization
- Container resource limits
- Auto-scaling configuration
- Network latency considerations

**Output Example:**
```markdown
### Performance Analysis

**Performance Score:** 8.1/10

**Optimization Opportunities:**
- Lambda memory allocation conservative (current: 256MB, recommended: 512MB)
- No CloudFront caching configured (potential 70% latency reduction)
- RDS read replicas not utilized for read-heavy workload

**Resource Efficiency:**
- ✓ Appropriate EC2 instance types selected
- ✓ Auto-scaling configured correctly
- ⚠ Potential over-provisioning in staging environment (60% average utilization)

**Recommendations:**
1. Increase Lambda memory to 512MB for 40% faster execution
2. Implement CloudFront with 24-hour TTL for static assets
3. Add read replica in us-west-2 for west coast users
4. Right-size staging environment (t3.large → t3.medium)
```

### Quality

Assesses code quality, maintainability, and adherence to standards.

**Coverage:**
- Code structure and organization
- Naming conventions
- Input validation
- Error handling
- Testing coverage
- CI/CD integration
- Version control practices

**Output Example:**
```markdown
### Quality Analysis

**Quality Score:** 7.5/10

**Code Structure:**
- ✓ Well-organized module structure
- ✓ Consistent naming conventions (snake_case)
- ⚠ Some functions exceed recommended length (>50 lines)

**Validation & Error Handling:**
- ❌ Missing input validation for 7/12 variables
- ⚠ Error messages not user-friendly
- ✓ Proper use of lifecycle rules

**Testing:**
- ⚠ No automated tests detected
- ⚠ Missing examples directory
- ✓ Valid Terraform syntax

**Recommendations:**
1. Add validation blocks to all input variables
2. Create examples/ directory with common scenarios
3. Implement Terratest for automated testing
4. Refactor long resource blocks into sub-modules
```

### Documentation

Reviews documentation completeness and quality.

**Coverage:**
- README structure and clarity
- Variable documentation
- Output documentation
- Usage examples
- Architecture diagrams
- Troubleshooting guides

**Output Example:**
```markdown
### Documentation Analysis

**Documentation Score:** 6.8/10

**Coverage Assessment:**
- ✓ README exists with basic information
- ❌ Missing prerequisites section
- ❌ No architecture diagram
- ⚠ Variable descriptions incomplete (8/15 documented)
- ❌ No examples directory
- ❌ No troubleshooting guide

**Quality Issues:**
- README lacks deployment instructions
- Variable constraints not documented
- Output values not explained
- No changelog or versioning information

**Recommendations:**
1. Add comprehensive prerequisites section
2. Create architecture diagram showing resource relationships
3. Document all variables with:
   - Description
   - Type
   - Default value (if applicable)
   - Constraints/validation rules
   - Example values
4. Create examples/ with at least 3 common scenarios
5. Add TROUBLESHOOTING.md with common issues
```

### Harness Integration

Evaluates Harness platform integration readiness.

**Coverage:**
- Pipeline structure and stages
- Harness-specific configurations
- IaCM workspace management
- Service and environment definitions
- Connector references
- Variable management
- GitX compatibility

**Output Example:**
```markdown
### Harness Integration Analysis

**Harness Score:** 8.5/10

**Pipeline Structure:**
- ✓ Well-organized stage sequence
- ✓ Appropriate use of approval gates
- ✓ Rollback strategies defined
- ⚠ Missing failure notification configuration

**IaCM Integration:**
- ✓ Workspace configuration appropriate
- ✓ Module structure compatible with Harness IaCM
- ⚠ No backend configuration for remote state
- ✓ Output variables properly defined for downstream stages

**GitX Compatibility:**
- ✓ YAML files follow Harness GitX conventions
- ✓ Identifiers follow naming rules
- ❌ Missing .harness/ directory structure
- ⚠ Entity references hardcoded (should use variables)

**Recommendations:**
1. Add notification rules for failure scenarios
2. Configure remote backend (S3 + DynamoDB)
3. Create .harness/ directory with proper entity organization
4. Parameterize connector references and identifiers
5. Add pipeline variables for environment-specific values
```

## Usage Examples

### Basic Expert Panel Review

Comprehensive quality assessment with default settings:

```bash
/itg:council ./terraform/aws-infrastructure \
  --protocol expert-panel
```

**Expected Output:**
```
🎯 Initiating Expert Panel Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Review Configuration:
  Path: ./terraform/aws-infrastructure
  Protocol: Expert Panel
  Focus Areas: security, performance, quality, docs
  Threshold: 70%

🔍 Phase 1: Independent Analysis
  ✓ Security Expert analyzing... (12s)
  ✓ Performance Engineer analyzing... (9s)
  ✓ Quality Analyst analyzing... (11s)
  ✓ Documentation Specialist analyzing... (7s)
  ✓ Harness Platform Expert analyzing... (8s)

💬 Phase 2: Deliberation
  • Discussing 12 findings...
  • Building consensus on 8 recommendations...
  • Prioritizing action items...

📊 Phase 3: Final Assessment
  Overall Score: 78% (APPROVED)

  Expert Ratings:
    Security:       8/10 ⭐⭐⭐⭐⭐⭐⭐⭐☆☆
    Performance:    9/10 ⭐⭐⭐⭐⭐⭐⭐⭐⭐☆
    Quality:        7/10 ⭐⭐⭐⭐⭐⭐⭐☆☆☆
    Documentation:  6/10 ⭐⭐⭐⭐⭐⭐☆☆☆☆
    Harness:        9/10 ⭐⭐⭐⭐⭐⭐⭐⭐⭐☆

📝 Report Generated:
  ./reviews/expert-panel-report-2025-01-19.md

🎯 Key Recommendations:
  Priority 1 (Must Fix): 2 items
  Priority 2 (Should Fix): 3 items
  Priority 3 (Nice to Have): 3 items

✓ Review complete in 47 seconds
```

### Security-Focused Red/Blue Team Review

Deep security analysis with adversarial perspectives:

```bash
/itg:council ./k8s/production \
  --protocol red-blue-team \
  --focus security,harness \
  --threshold 0.9
```

**Expected Output:**
```
⚔️  Red Team / Blue Team Security Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 Red Team: Attack Phase
  Analyzing attack surface...
  ✓ Identified 8 potential vulnerabilities
  ✓ Mapped 4 attack vectors
  ✓ Assessed 3 critical risk areas

🔵 Blue Team: Defense Phase
  Analyzing security controls...
  ✓ Evaluated existing defenses
  ✓ Proposed 8 mitigations
  ✓ Validated 6 countermeasures

⚖️  Synthesis Phase
  Red Team Final Assessment:
    • 2 Critical vectors (require immediate mitigation)
    • 3 High severity vectors (should be addressed)
    • 3 Medium severity vectors (monitor)

  Blue Team Validation:
    ✓ All critical mitigations feasible
    ✓ Implementation complexity: Medium
    ✓ Estimated effort: 2-3 days

📊 Security Score: 72% → 92% (after mitigations)

❌ BELOW THRESHOLD: Current state does not meet 90% requirement
✓ WOULD PASS: After implementing proposed mitigations

📝 Report: ./reviews/red-blue-security-2025-01-19.md

🚨 Critical Action Items:
  1. Remove privileged container access
  2. Implement network policies
  3. Rotate exposed credentials

⏱  Review completed in 2m 14s
```

### Quick Quality Check with Rapid Fire

Fast feedback during active development:

```bash
/itg:council ./harness-pipelines/ci-cd.yaml \
  --preset quick-review
```

**Expected Output:**
```
⚡ Rapid Fire Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏃 Round 1 (30 seconds)

  Security Agent:
    ✓ No hardcoded secrets
    ❌ Missing resource limits
    ✓ Appropriate permissions
    Score: 2/3

  Quality Agent:
    ✓ Naming conventions
    ❌ Missing validation
    ✓ Version pinning
    Score: 2/3

  Combined: 4/6 (67%) - BELOW THRESHOLD

🔧 Auto-Fixes Applied (5 seconds)
  ✓ Added resource limits
  ✓ Added input validation

🏃 Round 2 (15 seconds)

  Security Agent: 3/3 ✓
  Quality Agent: 3/3 ✓

  Combined: 6/6 (100%) - APPROVED

✅ Review completed in 50 seconds
📝 Report: ./reviews/rapid-fire-2025-01-19.md
```

### Comprehensive Quality Gate with Auto-Fix

Full review with automated remediation:

```bash
/itg:council ./infrastructure/complete-stack \
  --preset quality-gate \
  --auto-fix
```

**Expected Output:**
```
🎓 Quality Gate Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Initial Assessment
  Security:       7.5/10
  Performance:    8.2/10
  Quality:        6.8/10
  Documentation:  5.9/10
  Harness:        8.7/10

  Overall: 73% (BELOW 80% THRESHOLD)

🔧 Auto-Fix Phase
  Analyzing fixable issues...
  ✓ Found 23 auto-fixable items

  Applying fixes:
    ✓ Standardized naming (12 files)
    ✓ Added resource tags (8 resources)
    ✓ Generated README sections (4 sections)
    ✓ Added variable validation (7 variables)
    ✓ Fixed Terraform formatting

📊 Post-Fix Assessment
  Security:       8.1/10 (+0.6)
  Performance:    8.2/10 (unchanged)
  Quality:        8.5/10 (+1.7)
  Documentation:  7.8/10 (+1.9)
  Harness:        8.9/10 (+0.2)

  Overall: 82% ✓ APPROVED

📝 Generated Reports:
  • ./reviews/before-fixes-2025-01-19.md
  • ./reviews/after-fixes-2025-01-19.md
  • ./reviews/diff-summary-2025-01-19.md

🎯 Manual Action Items Remaining: 4
  (See report for details)

✅ Review completed in 3m 47s
```

### Consensus Building with Delphi Method

Iterative expert consensus for complex decisions:

```bash
/itg:council ./architecture/microservices-design \
  --protocol delphi \
  --focus "security,performance,quality,docs,harness" \
  --threshold 0.85
```

**Expected Output:**
```
🔮 Delphi Consensus Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 Panel: 5 Expert Agents
🎯 Target: 85% consensus

📝 Round 1: Independent Assessment (2m 15s)
  Ratings: [7, 5, 8, 6, 9]
  Mean: 7.0 | Median: 7 | StdDev: 1.41
  Consensus: LOW (high variance)

  Key disagreements identified:
    • Module granularity (3 experts)
    • Documentation completeness (2 experts)

📊 Round 1 Summary distributed to experts...

📝 Round 2: Informed Reassessment (1m 45s)
  Ratings: [6, 6, 7, 7, 8]
  Mean: 6.8 | Median: 7 | StdDev: 0.75
  Consensus: MODERATE (converging)

  Variance reduced: 50%
  Emerging consensus: Module needs decomposition

📝 Round 3: Final Consensus (1m 20s)
  Ratings: [6, 6, 7, 7, 8]
  Mean: 6.8 | Median: 7 | StdDev: 0.75
  Consensus: STABLE (no further changes)

📊 Final Assessment: 68% (BELOW THRESHOLD)

❌ CONDITIONAL APPROVAL
  Requires addressing Priority 1 & 2 recommendations

📝 Detailed Report: ./reviews/delphi-consensus-2025-01-19.md

🎯 Unanimous Recommendations:
  1. Decompose monolithic module (100% agreement)
  2. Enhance documentation (80% agreement)

⏱  Total review time: 5m 20s
```

### Six Thinking Hats Holistic Review

Balanced multi-perspective analysis:

```bash
/itg:council ./templates/cookiecutter-template \
  --protocol six-thinking-hats \
  --format markdown
```

**Expected Output:**
```
🎩 Six Thinking Hats Review
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚪ White Hat - Facts & Data
  Lines of code: 1,247
  Files analyzed: 23
  Dependencies: 8
  Test coverage: 0% (no tests found)

🔴 Red Hat - Intuition & Feelings
  Developer experience: Positive
  Concerns: Setup complexity, lack of examples
  Excitement factors: Good structure, clear patterns

⚫ Black Hat - Risks & Cautions
  Critical risks: 3 identified
  Failure scenarios: 5 documented
  Missing safeguards: Input validation

🟡 Yellow Hat - Benefits & Value
  Time savings: ~2 hours per project
  Error reduction: Estimated 70%
  Business value: High (standardization)

🟢 Green Hat - Creative Ideas
  Innovative improvements: 8 proposed
  Alternative approaches: 3 viable options
  Optimization opportunities: Significant

🔵 Blue Hat - Process Control
  Review quality: HIGH
  Synthesis: COMPLETE
  Recommendation: APPROVE WITH IMPROVEMENTS

📊 Overall Assessment: 76%
  Meets threshold: ✓ Yes (70%)

📝 Report: ./reviews/six-hats-2025-01-19.md

⏱  Review completed in 3m 32s
```

### Custom Focus Areas

Target specific concerns:

```bash
/itg:council ./deployment/production-release \
  --protocol expert-panel \
  --focus "security,harness" \
  --format json \
  --output ./ci/quality-reports
```

## Generated Report Structure

### Markdown Format

```markdown
# Council Review Report

## Metadata
- **Review Date:** 2025-01-19T14:32:15Z
- **Protocol:** Expert Panel
- **Template Path:** ./terraform/aws-infrastructure
- **Focus Areas:** security, performance, quality, docs, harness
- **Threshold:** 70%
- **Overall Score:** 78%
- **Decision:** APPROVED

## Executive Summary
[High-level overview of findings and decision rationale]

## Detailed Findings

### Security (8/10)
[Detailed security analysis]

### Performance (9/10)
[Detailed performance analysis]

### Quality (7/10)
[Detailed quality analysis]

### Documentation (6/10)
[Detailed documentation analysis]

### Harness Integration (9/10)
[Detailed Harness analysis]

## Recommendations

### Priority 1: Critical (Must Fix)
1. [Recommendation with rationale]

### Priority 2: Important (Should Fix)
1. [Recommendation with rationale]

### Priority 3: Enhancement (Nice to Have)
1. [Recommendation with rationale]

## Auto-Fix Available
[List of automatically remediable issues]

## Appendix
- Review transcript
- Expert deliberation notes
- Voting records
```

### JSON Format

```json
{
  "review": {
    "metadata": {
      "date": "2025-01-19T14:32:15Z",
      "protocol": "expert-panel",
      "templatePath": "./terraform/aws-infrastructure",
      "focusAreas": ["security", "performance", "quality", "docs", "harness"],
      "threshold": 0.7,
      "duration": "47s"
    },
    "scores": {
      "overall": 0.78,
      "security": 0.8,
      "performance": 0.9,
      "quality": 0.7,
      "documentation": 0.6,
      "harness": 0.9
    },
    "decision": {
      "approved": true,
      "conditional": true,
      "thresholdMet": true
    },
    "findings": [
      {
        "category": "security",
        "severity": "critical",
        "id": "SEC-001",
        "title": "Hardcoded secrets detected",
        "description": "AWS access keys found in provider configuration",
        "location": "main.tf:15-18",
        "recommendation": "Use AWS Secrets Manager or environment variables",
        "autoFixable": false
      }
    ],
    "recommendations": [
      {
        "priority": 1,
        "category": "security",
        "title": "Remove hardcoded secrets",
        "impact": "critical",
        "effort": "low",
        "implementation": "Use AWS Secrets Manager references"
      }
    ],
    "autoFixes": {
      "available": true,
      "count": 23,
      "items": [
        {
          "type": "naming-convention",
          "files": 12,
          "description": "Standardize to snake_case"
        }
      ]
    }
  }
}
```

## Integration with CI/CD

### GitHub Actions

```yaml
name: Quality Gate

on:
  pull_request:
    paths:
      - 'infrastructure/**'
      - 'pipelines/**'

jobs:
  council-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Council Review
        run: |
          /itg:council ./infrastructure \
            --preset quality-gate \
            --auto-fix \
            --format json \
            --output ./reports

      - name: Check Threshold
        run: |
          SCORE=$(jq -r '.review.scores.overall' ./reports/review.json)
          if (( $(echo "$SCORE < 0.8" | bc -l) )); then
            echo "Quality score $SCORE below threshold"
            exit 1
          fi

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('./reports/review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: council-review-report
          path: ./reports/
```

### Harness Pipeline

```yaml
- stage:
    name: Quality Gate
    identifier: quality_gate
    type: Custom
    spec:
      execution:
        steps:
          - step:
              type: ShellScript
              name: Council Review
              identifier: council_review
              spec:
                shell: Bash
                source:
                  type: Inline
                  spec:
                    script: |
                      /itg:council ./infrastructure \
                        --preset quality-gate \
                        --format json \
                        --output ./reports

                      SCORE=$(jq -r '.review.scores.overall' ./reports/review.json)

                      if (( $(echo "$SCORE < 0.8" | bc -l) )); then
                        echo "Quality score $SCORE below threshold"
                        exit 1
                      fi

                      echo "Quality score: $SCORE - PASSED"
                outputVariables:
                  - name: quality_score
                    type: String
                    value: quality_score

          - step:
              type: HarnessApproval
              name: Review Quality Report
              identifier: review_report
              when:
                condition: <+execution.steps.council_review.output.outputVariables.quality_score> < "0.8"
              spec:
                approvalMessage: |
                  Quality score below automatic threshold.
                  Review the council report and approve to proceed.
                includePipelineExecutionHistory: true
```

## Best Practices

### Protocol Selection

**Use Expert Panel when:**
- Comprehensive quality assessment needed
- Multiple perspectives valuable
- Time permits thorough review (3-5 minutes)
- Building organizational knowledge

**Use Red/Blue Team when:**
- Security is primary concern
- Adversarial testing required
- Defense validation needed
- Preparing for security audit

**Use Six Thinking Hats when:**
- Balanced perspective required
- Stakeholder buy-in important
- Considering multiple viewpoints
- Risk vs. benefit analysis needed

**Use Rapid Fire when:**
- Fast feedback essential
- Active development iteration
- Quick validation needed
- Pre-commit quality check

**Use Delphi when:**
- Complex architectural decisions
- Expert consensus required
- Eliminating groupthink
- Controversial changes

### Focus Area Selection

**Include Security when:**
- Handling sensitive data
- Internet-facing services
- Compliance requirements
- Production deployments

**Include Performance when:**
- High-traffic applications
- Cost optimization important
- Latency-sensitive workloads
- Resource-constrained environments

**Include Quality when:**
- Team collaboration critical
- Long-term maintenance expected
- Standards compliance required
- Knowledge transfer needed

**Include Documentation when:**
- External stakeholders involved
- Complex systems
- Onboarding new team members
- Open source projects

**Include Harness when:**
- Using Harness platform
- CI/CD pipeline templates
- IaCM infrastructure code
- GitX integration

### Threshold Configuration

**Conservative (0.9+):**
- Production infrastructure
- Security-critical components
- Compliance-regulated systems

**Balanced (0.7-0.8):**
- Development infrastructure
- Internal tools
- Standard applications

**Permissive (0.6-0.7):**
- Experimental projects
- Proof of concepts
- Rapid prototyping

### Auto-Fix Guidelines

**Enable auto-fix when:**
- Formatting and style issues
- Obvious violations of standards
- Automated tests validate changes
- CI/CD pipeline includes validation

**Disable auto-fix when:**
- Security-critical changes
- Architectural decisions required
- Breaking changes possible
- Human judgment essential

## Troubleshooting

### Low Consensus in Delphi Method

**Problem:** Expert ratings remain divergent after multiple rounds

**Solution:**
1. Review specific areas of disagreement
2. Provide additional context or constraints
3. Facilitate synchronous discussion for complex issues
4. Consider splitting decision into smaller components
5. Use different protocol (e.g., Six Thinking Hats for holistic view)

### Slow Review Performance

**Problem:** Council reviews taking too long

**Solution:**
1. Use rapid-fire protocol for quick checks
2. Reduce focus areas to essential concerns
3. Cache analysis results for unchanged files
4. Run reviews in parallel for independent modules
5. Optimize file scanning (exclude large binaries, generated code)

### Inconsistent Scoring

**Problem:** Same template gets different scores across reviews

**Solution:**
1. Use deterministic analysis where possible
2. Normalize scoring criteria
3. Review agent prompt consistency
4. Implement calibration reviews with known-good templates
5. Document scoring rationale in detail

### Auto-Fix Failures

**Problem:** Auto-fix mode makes incorrect or breaking changes

**Solution:**
1. Review auto-fix logic for specific failure case
2. Add validation tests before applying fixes
3. Use dry-run mode to preview changes
4. Implement rollback mechanism
5. Refine fix patterns based on failure analysis

## Related Commands

- `/itg:validate` - Validate infrastructure templates
- `/itg:analyze` - Analyze existing infrastructure patterns
- `/itg:test` - Test generated templates
- `/itg:generate` - Generate templates from analysis

## See Also

- **Council Coordinator Agent:** `.claude/tools/plugin-cli/infrastructure-template-generator/agents/council-coordinator.md`
- **Quality Patterns:** `docs/quality/COUNCIL_PROTOCOLS.md`
- **CI/CD Integration:** `docs/ci-cd/QUALITY_GATES.md`
