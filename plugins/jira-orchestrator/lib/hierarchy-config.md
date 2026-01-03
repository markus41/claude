# Jira Issue Hierarchy Configuration

## Standard Hierarchy

This plugin enforces a strict issue hierarchy:

```
Level 1: Initiative (Portfolio Level)
    └── Level 2: Epic (Feature Level)
            └── Level 3: Story (User Value Level)
                    └── Level 4: Task (Work Unit Level)
                            └── Level 5: Subtask (Atomic Work Level)
```

## Environment Configuration

```bash
# .env file
JIRA_HIERARCHY_L1=Initiative
JIRA_HIERARCHY_L2=Epic
JIRA_HIERARCHY_L3=Story
JIRA_HIERARCHY_L4=Task
JIRA_HIERARCHY_L5=Subtask
```

## Hierarchy Rules

### 1. Parent-Child Relationships

| Issue Type | Valid Parent | Valid Children |
|------------|--------------|----------------|
| Initiative | None (top level) | Epic |
| Epic | Initiative | Story |
| Story | Epic | Task |
| Task | Story | Subtask |
| Subtask | Task | None |

### 2. Creation Rules

When creating issues, ALWAYS verify hierarchy:

```yaml
BEFORE_CREATE:
  - Validate parent exists
  - Validate parent type matches hierarchy
  - Validate issue type is valid for parent
  - Get parent's project to ensure same project
```

### 3. Hierarchy Validation

```javascript
function validateHierarchy(parentType, childType) {
  const hierarchy = {
    'Initiative': ['Epic'],
    'Epic': ['Story'],
    'Story': ['Task'],
    'Task': ['Subtask'],
    'Subtask': []
  };

  if (!hierarchy[parentType]) {
    return { valid: false, error: `Unknown parent type: ${parentType}` };
  }

  if (!hierarchy[parentType].includes(childType)) {
    return {
      valid: false,
      error: `${childType} cannot be child of ${parentType}. Valid children: ${hierarchy[parentType].join(', ')}`
    };
  }

  return { valid: true };
}
```

## Creating Issues in Hierarchy

### Create Epic under Initiative

```javascript
// First: Get the Initiative
const initiative = await mcp__atlassian__getJiraIssue({
  cloudId: ATLASSIAN_CLOUD_ID,
  issueIdOrKey: 'PROJ-100'  // Initiative key
});

// Verify it's an Initiative
if (initiative.fields.issuetype.name !== 'Initiative') {
  throw new Error('Parent must be an Initiative');
}

// Create Epic with parent link
await mcp__atlassian__createJiraIssue({
  cloudId: ATLASSIAN_CLOUD_ID,
  projectKey: 'PROJ',
  issueTypeName: 'Epic',
  summary: 'Epic Title',
  description: 'Epic description',
  additional_fields: {
    parent: { key: 'PROJ-100' }
  }
});
```

### Create Story under Epic

```javascript
// Create Story with Epic parent
await mcp__atlassian__createJiraIssue({
  cloudId: ATLASSIAN_CLOUD_ID,
  projectKey: 'PROJ',
  issueTypeName: 'Story',
  summary: 'Story Title',
  description: 'As a user, I want...',
  additional_fields: {
    parent: { key: 'PROJ-101' }  // Epic key
  }
});
```

### Create Task under Story

```javascript
await mcp__atlassian__createJiraIssue({
  cloudId: ATLASSIAN_CLOUD_ID,
  projectKey: 'PROJ',
  issueTypeName: 'Task',
  summary: 'Task Title',
  description: 'Implementation details',
  additional_fields: {
    parent: { key: 'PROJ-102' }  // Story key
  }
});
```

### Create Subtask under Task

```javascript
await mcp__atlassian__createJiraIssue({
  cloudId: ATLASSIAN_CLOUD_ID,
  projectKey: 'PROJ',
  issueTypeName: 'Subtask',
  summary: 'Subtask Title',
  parent: 'PROJ-103'  // Task key - subtasks use 'parent' directly
});
```

## Querying Hierarchy

### Get All Children of an Issue

```javascript
// JQL to get direct children
const jql = `parent = PROJ-100 ORDER BY created ASC`;

const children = await mcp__atlassian__searchJiraIssuesUsingJql({
  cloudId: ATLASSIAN_CLOUD_ID,
  jql: jql
});
```

### Get Full Hierarchy Under Initiative

```javascript
// Get Epics under Initiative
const epics = await mcp__atlassian__searchJiraIssuesUsingJql({
  cloudId: ATLASSIAN_CLOUD_ID,
  jql: `parent = INIT-1 AND issuetype = Epic`
});

// For each Epic, get Stories
for (const epic of epics.issues) {
  const stories = await mcp__atlassian__searchJiraIssuesUsingJql({
    cloudId: ATLASSIAN_CLOUD_ID,
    jql: `parent = ${epic.key} AND issuetype = Story`
  });

  // For each Story, get Tasks...
}
```

## Preventing Wrong Issue Operations

### CRITICAL: Always Validate Before Operations

Before ANY write operation on an issue:

1. **Call issue-validator agent** to confirm correct issue
2. **Verify hierarchy level** matches expected operation
3. **Check parent-child relationship** is valid
4. **Confirm with user** if any mismatch detected

```yaml
VALIDATION_CHECKLIST:
  - [ ] Issue key format valid (PROJ-123)
  - [ ] Issue exists in Jira
  - [ ] Issue type matches expected hierarchy level
  - [ ] Parent issue is correct type
  - [ ] No off-by-one error (check PROJ-122 and PROJ-124)
  - [ ] Summary matches user intent
```

## Common Mistakes to Avoid

1. **Creating Story directly under Initiative** - Must be under Epic
2. **Creating Task without Story parent** - Must have Story parent
3. **Confusing issue types** - Always verify with `getJiraIssue`
4. **Off-by-one errors** - Always use issue-validator agent
5. **Wrong project** - Verify projectKey before creating

## Summary Formats by Level

| Level | Summary Format | Example |
|-------|----------------|---------|
| Initiative | Business objective | "Q1 2024 Customer Experience Improvement" |
| Epic | Feature name | "User Authentication System" |
| Story | User story format | "As a user, I want to login so that I can access my account" |
| Task | Action description | "Implement JWT token validation" |
| Subtask | Specific action | "Add unit tests for token validation" |
