---
description: Design Microsoft Teams team, channel, tab, and app provisioning specifications for insurance agency operations, loan processing, and financial services collaboration.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Teams Provisioner

Produce a complete Microsoft Teams provisioning specification. Make explicit decisions for each configuration point rather than listing alternatives. The output must be actionable by a Teams administrator running PowerShell or Graph API scripts.

## Team Design

For each team being provisioned:

**Team identity**:
- **Display name**: Use the convention `[Firm Abbreviation] - [Function]` (e.g., `ACME - Claims Processing`, `ACME - Loan Operations`)
- **Description**: One sentence describing the team's purpose, used in Teams search results
- **Email prefix**: Derived from display name — lowercase, hyphens, no special characters

**Privacy setting**:
- **Private**: Default for all operational teams. Members must be added by an owner.
- **Public**: Only for firm-wide announcements or knowledge-sharing teams with no sensitive data.
- Never use public teams in regulated financial services environments.

**Guest access**: Disabled by default. Enable only if the team requires external collaboration (e.g., a client portal team or carrier liaison team). When enabled, document which external domains are permitted.

**Team template**: Apply a template if one matches the use case. For insurance and financial services, standard templates to consider: Financial Advisor, Retail Store (adapted for branch offices), or no template for custom channel structures.

**Membership at provisioning**:
- Owners: List by role title, not name (e.g., "Claims Manager", "IT Admin")
- Initial members: List by department or AD group to populate via Graph API
- Guest members: List external party and expected access duration

## Channel Structure

Design the complete channel layout. Every team gets General (cannot be removed). Add channels purposefully — over-channeling is worse than under-channeling.

**Standard channels** (visible to all team members):

| Channel Name | Purpose | Notify by Default |
|--------------|---------|-------------------|
| General | Team-wide announcements only | All activity |
| [Function]-Updates | Status updates and async coordination | @mentions only |
| [Function]-Documents | Document review and file discussion | Off |
| Help-Desk | Questions and escalations | @mentions only |

**Private channels** (use only when subset of members need confidential space):

| Channel Name | Purpose | Who Has Access |
|--------------|---------|----------------|
| Management-Only | Leadership discussions, performance | Managers + above |
| Compliance-Review | Sensitive compliance matters | Compliance team |

Limit private channels to two or fewer per team. Private channels create separate SharePoint sites and complicate governance.

**Shared channels** (cross-tenant collaboration): Create only if external partners need ongoing access. Document the external tenant domain and which members from that tenant will be added.

**Channel naming convention**: Use PascalCase-With-Hyphens. Avoid spaces (they become `%20` in URLs). Prefix channels for a specific client or matter with the client ID: `CLT-10042-PolicyReview`.

## Tab Configuration

For each channel, specify the tabs to configure beyond the default Posts and Files tabs:

**SharePoint document library tab**:
- Name the tab after the library (e.g., "Policy Documents")
- Link to the specific library and view that members will use most often
- Do not add a SharePoint tab pointing to a site root — always deep-link to a library or page

**Planner tab**:
- Add to the primary work channel
- Name: "[Channel Name] Tasks"
- Create a Planner plan with the same name and initial buckets: Backlog, In Progress, Blocked, Done

**OneNote tab**:
- Add to the primary work channel for meeting notes and process documentation
- Name: "[Team Name] Notes"
- Create a new notebook hosted in the team's SharePoint site

**Website tab** (for line-of-business system quick access):

| Channel | Tab Name | URL |
|---------|----------|-----|
| General | Agency Management System | [AMS URL] |
| Loan-Operations | LOS | [LOS URL] |
| Compliance-Review | Compliance Portal | [Portal URL] |

**Power BI tab**: Add to reporting or management channels. Link to the specific report page, not the Power BI workspace root. Requires members to have Power BI Pro licenses.

## App Installation

Specify which Teams apps to install at the team level. Only install apps that team members will actively use — unused apps create noise.

**Standard apps for all financial services teams**:

| App | Purpose | Configuration Required |
|-----|---------|----------------------|
| Approvals | Approval workflows for documents and requests | No additional config |
| Forms | Quick surveys and data collection | No additional config |
| Power Automate | Automation notifications | Connect to specific flows post-provisioning |

**Business-type-specific apps**:

| Business Type | App | Purpose |
|--------------|-----|---------|
| Insurance agency | Shifts | Staff scheduling for field agents |
| Mortgage / lending | Approvals | Loan file approval chains |
| Financial advisory | Viva Insights | Client meeting preparation |

**Apps that must NOT be installed** (security policy): Trello, Jira (use internal Jira connector only), any app requiring external OAuth without IT approval.

## Meeting Policies

Specify the meeting policy to assign to this team's members (Teams admin center policies apply per-user, not per-team — document which policy the member group should have):

| Setting | Value | Rationale |
|---------|-------|-----------|
| Cloud recording | Allowed (stored in OneDrive) | For compliance and training |
| Transcription | Allowed | Accessibility and record-keeping |
| External guest join | Lobby required | Guest must be admitted by owner |
| Anonymous join | Disabled | Prevent unauthorized access |
| Recording expiration | 60 days | Auto-delete to manage storage |

## Governance Configuration

**Team expiration policy**: Set to 180 days. Teams without activity (posts, file edits) will trigger a renewal notification to owners. Owners who do not respond within 30 days will have the team archived.

**Inactive team review**: Teams with no activity for 90 days are flagged in the monthly governance report.

**Naming policy**: Enforce the `[Firm] - [Function]` prefix via Azure AD naming policy if the tenant has 500+ teams. Prevents ad-hoc team names.

**Membership management**: After initial provisioning, new members are added via the Azure AD group linked to the team. Owners do not manually add individuals — they add the AD group or request IT to update group membership.

## Notification Design

Provide default notification guidance to document in the team's pinned Getting Started post:

| Notification | Recommended Setting | Who |
|-------------|--------------------|----|
| All new messages in General | Activity feed | All members |
| @mentions | Banner + activity | All members |
| Replies to your messages | Banner + activity | All members |
| Followed channels | Activity feed only | Per preference |

## Output Format

Deliver as a structured Markdown specification with:

1. Team summary table (one row per team: name, privacy, owner count, member count, guest access)
2. Channel and tab matrix (team → channels → tabs per channel)
3. App installation list with configuration notes
4. Meeting policy assignment table
5. Governance settings
6. Post-provisioning checklist (what must be done manually after scripted provisioning: add initial members, configure Planner buckets, pin getting-started message)
7. PowerShell or Graph API script outline (parameter list only — not full scripts) for the provisioning team
