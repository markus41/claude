# Exec-Automator Hooks Architecture

## Overview

The exec-automator hooks system provides comprehensive workflow orchestration through four specialized hooks that track the complete lifecycle of executive director automation analysis.

## Hook Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SESSION LIFECYCLE                            │
└─────────────────────────────────────────────────────────────────────┘

    SESSION START
         │
         ├─────────────────────────────────────────────────┐
         │                                                  │
         ▼                                                  │
    ┌──────────────────────┐                              │
    │  workflow-init.sh    │                              │
    │  (SessionStart)      │                              │
    └──────────────────────┘                              │
         │                                                  │
         │ Creates:                                        │
         │ • Session state                                 │
         │ • Directory structure                           │
         │ • Analysis queue                                │
         │ • Obsidian vault structure                      │
         │                                                  │
         ▼                                                  │
    ┌──────────────────────────────────────────┐          │
    │         USER INTERACTION LOOP             │          │
    │                                           │          │
    │  User submits prompt                      │          │
    │         │                                 │          │
    │         ▼                                 │          │
    │  ┌────────────────────┐                  │          │
    │  │ document-detect.sh │                  │          │
    │  │ (UserPromptSubmit) │                  │          │
    │  └────────────────────┘                  │          │
    │         │                                 │          │
    │         │ Detects:                        │          │
    │         │ • Document types (RFP, bylaws)  │          │
    │         │ • Organization types            │          │
    │         │ • Automation intent             │          │
    │         │ • Analysis keywords             │          │
    │         │                                 │          │
    │         │ Suggests:                       │          │
    │         │ • Commands to run               │          │
    │         │ • Agents to use                 │          │
    │         │ • Workflows to follow           │          │
    │         │                                 │          │
    │         ▼                                 │          │
    │  User invokes tools/commands             │          │
    │         │                                 │          │
    │         ▼                                 │          │
    │  ┌────────────────────┐                  │          │
    │  │execution-tracker.sh│                  │          │
    │  │  (PostToolUse)     │ ◄───────┐        │          │
    │  └────────────────────┘         │        │          │
    │         │                        │        │          │
    │         │ Tracks:               Loop      │          │
    │         │ • Tool usage          for       │          │
    │         │ • Workflow phase      each      │          │
    │         │ • Progress %          tool      │          │
    │         │ • MCP operations      use       │          │
    │         │ • Errors              │         │          │
    │         │                       │         │          │
    │         │ Updates:              │         │          │
    │         │ • Phase transitions   │         │          │
    │         │ • Progress metrics    │         │          │
    │         │ • Execution logs      │         │          │
    │         │                       │         │          │
    │         └───────────────────────┘         │          │
    │                                           │          │
    │  (Continue until user ends session)       │          │
    │                                           │          │
    └───────────────────────────────────────────┘          │
         │                                                  │
         │                                                  │
    SESSION END                                            │
         │                                                  │
         ▼                                                  │
    ┌──────────────────────┐                              │
    │ workflow-cleanup.sh  │                              │
    │   (SessionEnd)       │                              │
    └──────────────────────┘                              │
         │                                                  │
         │ Performs:                                       │
         │ • Creates checkpoint                            │
         │ • Archives analyses                             │
         │ • Copies logs to vault                          │
         │ • Generates summary                             │
         │ • Cleans temp files                             │
         │                                                  │
         ▼                                                  │
    SESSION COMPLETE                                       │
         │                                                  │
         └──────────────────────────────────────────────────┘
              (Ready for /exec:resume)
```

## State Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                        STATE MANAGEMENT                             │
└────────────────────────────────────────────────────────────────────┘

Working State (Ephemeral)          Archived State (Permanent)
${PLUGIN_ROOT}/state/              ${OBSIDIAN_VAULT_PATH}/...

┌──────────────────────┐          ┌──────────────────────────┐
│ sessions/            │          │ checkpoints/             │
│ ├── current.json ────┼──────┐   │ └── {session_id}/        │
│ └── {id}.json        │      │   │     ├── session-state.json
│                      │      │   │     ├── tool-usage.log   │
│ workflows/           │      │   │     ├── mcp-usage.log    │
│ ├── execution.log    │      │   │     ├── errors.log       │
│ └── phase-trans.log  │      │   │     └── SESSION-SUMMARY.md
│                      │      │   │                          │
│ analyses/            │      │   │ analyses/                │
│ ├── queue.json       │      │   │ └── {org_name}/          │
│ └── *.json ──────────┼──────┼───┼────► {profile}.json     │
│                      │      │   │                          │
│ temp/                │      │   │ reports/                 │
│ ├── current-phase.txt│      │   │ └── *.md                 │
│ ├── progress.txt     │      │   │                          │
│ ├── tool-usage.log   │      │   │ workflows/               │
│ ├── mcp-usage.log    │      │   │ └── generated/           │
│ ├── errors.log       │      │   │                          │
│ └── *.tmp            │      │   │                          │
└──────────────────────┘      │   └──────────────────────────┘
         │                    │
         │  Cleanup hook      │
         │  copies ───────────┘
         │  archives
         │
         ▼
    Cleaned up at
    session end
```

## Hook Responsibilities Matrix

| Hook                | Event            | Read State | Write State | Read Vault | Write Vault | Cleanup |
|---------------------|------------------|------------|-------------|------------|-------------|---------|
| workflow-init       | SessionStart     | -          | ✓           | ✓          | ✓           | ✓       |
| document-detect     | UserPromptSubmit | ✓          | ✓ (log)     | -          | -           | -       |
| execution-tracker   | PostToolUse      | ✓          | ✓           | -          | -           | -       |
| workflow-cleanup    | SessionEnd       | ✓          | ✓           | ✓          | ✓           | ✓       |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW                                   │
└─────────────────────────────────────────────────────────────────────┘

User Input
    │
    ▼
┌─────────────────┐
│ User Prompt     │
└─────────────────┘
    │
    ├──────────────────────────────────┐
    │                                   │
    ▼                                   ▼
┌─────────────────┐              ┌──────────────────┐
│ Document Detect │              │ Command Execution│
│   (Passive)     │              │    (Active)      │
└─────────────────┘              └──────────────────┘
    │                                   │
    │ Suggestions                       │ Tool Use
    ▼                                   ▼
┌─────────────────────────────────────────────────┐
│              Execution Tracker                  │
│  • Tool: Read|Write|Bash|MCP                    │
│  • Status: success|error                        │
│  • Duration: seconds                            │
└─────────────────────────────────────────────────┘
    │
    │ Updates
    ▼
┌─────────────────────────────────────────────────┐
│              Session State                      │
│  • workflow_phase: "responsibility-extraction"  │
│  • progress: 45%                                │
│  • tool_count: 23                               │
│  • mcp_count: 8                                 │
│  • error_count: 0                               │
└─────────────────────────────────────────────────┘
    │
    │ At session end
    ▼
┌─────────────────────────────────────────────────┐
│           Checkpoint & Archive                  │
│  • Create checkpoint in vault                   │
│  • Archive completed analyses                   │
│  • Generate summary document                    │
│  • Clean working state                          │
└─────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────┐
│      Obsidian Vault (Permanent Storage)         │
│  • Searchable via Obsidian                      │
│  • Version controlled via Git                   │
│  • Linkable with [[wikilinks]]                  │
│  • Queryable via Dataview                       │
└─────────────────────────────────────────────────┘
```

## Workflow Phase Progression

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW PHASES                                  │
└─────────────────────────────────────────────────────────────────────┘

idle (0%)
  │
  │ User uploads/pastes document
  ▼
document-parsing (15%)
  │
  │ MCP: parse_rfp, parse_job_description, parse_bylaws
  │ Extract text, identify sections
  ▼
responsibility-extraction (40%)
  │
  │ MCP: extract_responsibilities, categorize_responsibility
  │ Identify all ED duties, categorize by domain
  ▼
automation-scoring (60%)
  │
  │ MCP: score_automation_potential
  │ Calculate 0-100 score for each responsibility
  ▼
workflow-generation (80%)
  │
  │ MCP: generate_langgraph_workflow, generate_agent_spec
  │ Create LangGraph workflows and agent configurations
  ▼
profile-generation (95%)
  │
  │ MCP: create_organizational_profile
  │ Compile complete organizational profile JSON
  ▼
complete (100%)
  │
  │ Analysis finished
  │ Ready for /exec:dashboard, /exec:simulate, /exec:orchestrate
  ▼
```

## Integration Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION POINTS                                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│  Claude Code     │         │  Exec-Automator  │
│  Platform        │◄────────┤  Hooks System    │
│                  │         │                  │
│  • SessionStart  │         │  • workflow-init │
│  • UserPrompt    │         │  • doc-detect    │
│  • PostToolUse   │         │  • exec-tracker  │
│  • SessionEnd    │         │  • cleanup       │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│  Plugin State    │◄────────┤  Session State   │
│                  │         │                  │
│  • agents/       │         │  • sessions/     │
│  • commands/     │         │  • workflows/    │
│  • skills/       │         │  • analyses/     │
│  • templates/    │         │  • temp/         │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│  MCP Server      │◄────────┤  Execution Logs  │
│                  │         │                  │
│  • parse_*       │         │  • tool-usage    │
│  • extract_*     │         │  • mcp-usage     │
│  • score_*       │         │  • phase-trans   │
│  • generate_*    │         │  • errors        │
└──────────────────┘         └──────────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│  Obsidian Vault  │◄────────┤  Checkpoints     │
│                  │         │                  │
│  • analyses/     │         │  • session-state │
│  • checkpoints/  │         │  • logs          │
│  • reports/      │         │  • summaries     │
│  • workflows/    │         │  • metadata      │
└──────────────────┘         └──────────────────┘
```

## Error Handling Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   Hook Execution     │
└──────────────────────┘
         │
         ▼
    ┌────────┐
    │ Error? │
    └────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  YES        NO
    │         │
    │         └──► Continue
    │
    ▼
┌─────────────────────┐
│  Error Type?        │
└─────────────────────┘
    │
    ├──► CRITICAL (workflow-init, cleanup)
    │         │
    │         ├──► Log error
    │         ├──► Display message
    │         └──► Exit with code 1
    │
    └──► NON-CRITICAL (doc-detect, exec-tracker)
              │
              ├──► Log warning
              ├──► Continue execution
              └──► Exit with code 0
```

## Performance Characteristics

| Hook                | Avg Duration | Max Duration | Memory    | Disk I/O    |
|---------------------|--------------|--------------|-----------|-------------|
| workflow-init       | ~200ms       | ~500ms       | ~5 MB     | Low (read)  |
| document-detect     | ~50ms        | ~100ms       | ~1 MB     | Minimal     |
| execution-tracker   | ~20ms        | ~50ms        | ~500 KB   | Low (write) |
| workflow-cleanup    | ~300ms       | ~1s          | ~10 MB    | Med (copy)  |

## Security Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SECURITY MODEL                                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  User Input          │  ← No direct code execution
│  (Prompts)           │  ← Pattern matching only
└──────────────────────┘
         │
         ▼
┌──────────────────────┐
│  Hook Scripts        │  ← Validated inputs
│  (Bash)              │  ← No eval() or exec()
└──────────────────────┘  ← Safe path handling
         │
         ▼
┌──────────────────────┐
│  State Files         │  ← Permissions: 0600
│  (JSON/Logs)         │  ← No sensitive data logged
└──────────────────────┘  ← Sanitized file names
         │
         ▼
┌──────────────────────┐
│  Obsidian Vault      │  ← User-controlled directory
│  (Permanent)         │  ← Respects vault permissions
└──────────────────────┘  ← Optional encryption
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MONITORING POINTS                                 │
└─────────────────────────────────────────────────────────────────────┘

Metrics Collected:
  • Tool invocation count
  • MCP tool usage by operation
  • Workflow phase transitions
  • Average operation duration
  • Error count and types
  • Session duration
  • Progress percentage
  • Analyses completed

Logs Generated:
  • Tool usage log (all tools)
  • MCP usage log (MCP operations)
  • Phase transition log (workflow progression)
  • Error log (failures and exceptions)
  • Session state snapshots

Checkpoints Created:
  • Full session state
  • Execution logs
  • Workflow metadata
  • Analysis artifacts
  • Summary documents
```

## Future Enhancements

Planned improvements for hooks system:

1. **Advanced Analytics**
   - Time-series analysis of workflow performance
   - Bottleneck detection and optimization
   - Predictive progress estimation

2. **Real-time Dashboards**
   - Live workflow progress visualization
   - Real-time error monitoring
   - Performance metrics graphs

3. **Smart Suggestions**
   - ML-based command recommendations
   - Context-aware agent suggestions
   - Automated workflow optimization

4. **Enhanced Checkpointing**
   - Incremental checkpoints (not just session end)
   - Automatic checkpoint on phase completion
   - Checkpoint compression and deduplication

5. **Advanced Error Recovery**
   - Automatic retry on transient failures
   - Rollback to last known good state
   - Error pattern detection and prevention

---

**Brookside BI - Empowering nonprofits through intelligent automation**

**Version:** 1.0.0
**Last Updated:** 2025-12-17
**Architecture by:** Brookside BI Development Team
