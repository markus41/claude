# Workspace Isolation Reference Architecture

## Objective

Provide deterministic client isolation for embedded analytics while keeping operational overhead manageable.

## Isolation Patterns

### 1. Workspace-per-client (recommended default)

- **Structure**: one Fabric/Power BI workspace for each client.
- **When to use**: regulated data, contractual segregation requirements, or high-volume clients.
- **Advantages**:
  - Strong blast-radius containment.
  - Clean permission boundaries and lifecycle controls.
  - Easier cost showback/chargeback.
- **Trade-offs**:
  - More deployment objects to manage.
  - More CI/CD orchestration per release.

### 2. Workspace-per-segment

- **Structure**: multiple clients in one workspace by tier, region, or vertical.
- **When to use**: low-risk datasets and small clients with similar policies.
- **Advantages**:
  - Lower administration overhead.
  - Faster rollout for very small tenants.
- **Trade-offs**:
  - Heavier reliance on strict RLS and QA controls.
  - More risk during shared model changes.

## Recommended Baseline Controls

- Dedicated service principal per environment (`dev/test/prod`).
- Workspace naming convention: `ea-{env}-{clientCode}-{region}`.
- Capacity assignment policy by client tier.
- Mandatory deployment pipeline stage gates with automated validation.
- Break-glass access group with time-bound approval only.

## Governance Checklist

- Access recertification every 90 days.
- Workspace-level retention and purge policy approved by legal.
- Activity log export enabled to central SIEM.
- Disaster recovery runbook tested at least twice per year.
