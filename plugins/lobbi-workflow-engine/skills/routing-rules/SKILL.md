---
description: Create intelligent routing logic based on document attributes, request type, risk score, or customer profile. Use when building workflow routing for insurance claims, loan applications, or compliance reviews.
---

# Routing Rules Design

Design attribute-based routing rules for business process automation:

1. **Identify routing dimensions**: What attributes determine the route? (type, amount, geography, product line, risk tier)
2. **Map rules to destinations**: Which team/system/queue receives each combination?
3. **Handle exceptions**: What happens when no rule matches? Who receives unclassified items?
4. **Priority ordering**: When multiple rules match, which wins?

Output routing rules as a decision table:

```
| Attribute 1 | Attribute 2 | Destination    | Priority |
|-------------|-------------|----------------|----------|
| claim_type  | amount      | claims_team    | 1        |
| ...         | ...         | ...            | ...      |
```

Also generate the routing logic as pseudocode and identify any data enrichment needed before routing can occur.
