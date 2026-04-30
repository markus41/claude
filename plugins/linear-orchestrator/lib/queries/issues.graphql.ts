/**
 * Reusable GraphQL fragments and operations for issues.
 * Hand-written (not codegen) to keep the dependency surface small.
 */

export const ISSUE_CORE_FRAGMENT = /* GraphQL */ `
  fragment IssueCore on Issue {
    id
    identifier
    title
    description
    priority
    estimate
    dueDate
    url
    createdAt
    updatedAt
    state { id name type }
    team { id key name }
    assignee { id email displayName }
    creator { id email displayName }
    parent { id identifier }
    cycle { id name startsAt endsAt }
    project { id name }
    labels { nodes { id name color } }
  }
`;

export const ISSUE_BY_KEY = /* GraphQL */ `
  ${ISSUE_CORE_FRAGMENT}
  query IssueByKey($key: String!) {
    issue(id: $key) { ...IssueCore }
  }
`;

export const ISSUES_BY_FILTER = /* GraphQL */ `
  ${ISSUE_CORE_FRAGMENT}
  query IssuesByFilter($filter: IssueFilter, $first: Int, $after: String, $orderBy: PaginationOrderBy) {
    issues(filter: $filter, first: $first, after: $after, orderBy: $orderBy) {
      pageInfo { hasNextPage endCursor }
      nodes { ...IssueCore }
    }
  }
`;

export const ISSUE_CREATE = /* GraphQL */ `
  ${ISSUE_CORE_FRAGMENT}
  mutation IssueCreate($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue { ...IssueCore }
      lastSyncId
    }
  }
`;

export const ISSUE_UPDATE = /* GraphQL */ `
  ${ISSUE_CORE_FRAGMENT}
  mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue { ...IssueCore }
      lastSyncId
    }
  }
`;

export const ISSUE_HISTORY = /* GraphQL */ `
  query IssueHistory($id: String!, $first: Int) {
    issue(id: $id) {
      history(first: $first) {
        nodes {
          id
          createdAt
          actor { id email displayName }
          fromState { name }
          toState { name }
          fromAssignee { email }
          toAssignee { email }
          fromPriority
          toPriority
          fromEstimate
          toEstimate
          fromTitle
          toTitle
        }
      }
    }
  }
`;
