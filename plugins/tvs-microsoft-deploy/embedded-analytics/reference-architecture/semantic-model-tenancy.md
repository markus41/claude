# Semantic Model Tenancy Strategy

## Goal

Choose the lowest-risk semantic model topology that satisfies client isolation, performance, and maintainability.

## Topologies

### A. Model-per-client (highest isolation)

- Separate dataset/semantic model artifacts per client.
- Distinct refresh schedules and credentials.
- Best for premium clients and custom KPI logic.

### B. Shared model with tenant partitioning

- Single model with tenant key partitions.
- Shared schema and measures, tenant-specific data slices.
- Best for medium-scale client cohorts with consistent reporting needs.

### C. Hybrid core + client extension model

- Shared conformed core model plus optional client extension model.
- Supports common packaged analytics and tailored additions.

## Decision Factors

- Data sensitivity/classification.
- Contractual obligations (data residency, dedicated processing).
- Model customization ratio.
- Expected refresh concurrency.
- Support team operating capacity.

## Recommended Default

- Start with **shared model + partitioning** for pilot cohorts.
- Promote to **model-per-client** when either:
  1. contractual isolation requires it, or
  2. custom calculations exceed 20% of shared model logic.
