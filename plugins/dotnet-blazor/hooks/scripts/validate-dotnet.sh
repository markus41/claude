#!/usr/bin/env bash
# validate-dotnet.sh - Post-write validation for .NET files
# Checks: no hardcoded secrets, proper render modes, async patterns

set -euo pipefail

FILE="${TOOL_INPUT_FILE_PATH:-}"

# Only check .cs and .razor files
if [[ -z "$FILE" ]] || [[ ! "$FILE" =~ \.(cs|razor)$ ]]; then
    exit 0
fi

# Skip if file doesn't exist (deleted)
if [[ ! -f "$FILE" ]]; then
    exit 0
fi

WARNINGS=""

# Check for hardcoded connection strings or secrets
if grep -qiE '(password|secret|apikey|connectionstring)\s*=\s*"[^"]{8,}"' "$FILE" 2>/dev/null; then
    if ! grep -qE '(// test|// example|// sample|InMemory)' "$FILE" 2>/dev/null; then
        WARNINGS="${WARNINGS}WARNING: Possible hardcoded secret in $FILE\n"
    fi
fi

# Check for sync EF Core calls in Blazor components
if [[ "$FILE" =~ \.razor$ ]] || [[ "$FILE" =~ \.razor\.cs$ ]]; then
    if grep -qE '\.(ToList|FirstOrDefault|SingleOrDefault|Find|SaveChanges)\(' "$FILE" 2>/dev/null; then
        if ! grep -qE 'Async\(' "$FILE" 2>/dev/null; then
            WARNINGS="${WARNINGS}WARNING: Synchronous EF Core call in Blazor component - use async version\n"
        fi
    fi
fi

# Check for missing render mode on interactive components
if [[ "$FILE" =~ \.razor$ ]]; then
    if grep -qE '@onclick|@onchange|@oninput|@bind-Value' "$FILE" 2>/dev/null; then
        if ! grep -qE '@rendermode|@attribute \[StreamRendering\]' "$FILE" 2>/dev/null; then
            WARNINGS="${WARNINGS}INFO: Interactive component without explicit @rendermode directive\n"
        fi
    fi
fi

if [[ -n "$WARNINGS" ]]; then
    echo -e "$WARNINGS"
fi

exit 0
