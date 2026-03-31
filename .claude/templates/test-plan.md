# Test Plan — {feature_name}

## Feature Under Test
<!-- Brief description of the feature or change being tested -->
{feature_description}

## Test Strategy
| Level       | Scope                        | Tool / Framework |
|-------------|------------------------------|------------------|
| Unit        | {unit_scope}                 | {unit_tool}      |
| Integration | {integration_scope}          | {integration_tool} |
| E2E         | {e2e_scope}                  | {e2e_tool}       |

## Test Cases

| ID   | Description          | Steps                          | Expected Result        | Priority |
|------|----------------------|--------------------------------|------------------------|----------|
| TC-1 | {test_description_1} | 1. {step_a}  2. {step_b}       | {expected_1}           | High     |
| TC-2 | {test_description_2} | 1. {step_a}  2. {step_b}       | {expected_2}           | Medium   |
| TC-3 | {test_description_3} | 1. {step_a}  2. {step_b}       | {expected_3}           | Low      |

## Edge Cases
<!-- Unusual inputs, boundary conditions, concurrency, error paths -->
- {edge_case_1}
- {edge_case_2}
- {edge_case_3}

## Environment Requirements
- **OS:** {os_requirements}
- **Node:** {node_version}
- **Dependencies:** {special_dependencies}
- **Config:** {env_vars_or_flags}

## Pass / Fail Criteria
- [ ] All High-priority test cases pass
- [ ] No regressions in existing tests (`pnpm test`)
- [ ] Code coverage does not decrease
- [ ] {additional_criterion}
