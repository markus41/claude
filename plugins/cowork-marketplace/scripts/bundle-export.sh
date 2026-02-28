#!/usr/bin/env bash
# bundle-export.sh - Export a plugin bundle as a Cowork-compatible ZIP
#
# Usage: ./bundle-export.sh <bundle-id> [--output DIR] [--dry-run]
#
# Reads bundle definition from bundles/registry.json, merges commands/agents/skills
# from source plugins, generates manifest and docs, creates ZIP.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(cd "$PLUGIN_DIR/../.." && pwd)"
REGISTRY="$PLUGIN_DIR/bundles/registry.json"

BUNDLE_ID=""
OUTPUT_DIR="$PROJECT_ROOT/exports"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --output) OUTPUT_DIR="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        -*) echo "Unknown option: $1"; exit 1 ;;
        *) BUNDLE_ID="$1"; shift ;;
    esac
done

if [[ -z "$BUNDLE_ID" ]]; then
    echo "Usage: bundle-export.sh <bundle-id> [--output DIR] [--dry-run]"
    echo ""
    echo "Available bundles:"
    python3 -c "
import json
data = json.load(open('$REGISTRY'))
for b in data['bundles']:
    t = b['totals']
    print(f\"  {b['id']:30s} {b['name']:35s} {len(b['plugins'])}P {t['commands']}C {t['agents']}A {t['skills']}S\")
"
    exit 1
fi

# Extract bundle from registry
BUNDLE_JSON=$(python3 -c "
import json, sys
data = json.load(open('$REGISTRY'))
for b in data['bundles']:
    if b['id'] == '$BUNDLE_ID':
        print(json.dumps(b))
        sys.exit(0)
print('NOT_FOUND', file=sys.stderr)
sys.exit(1)
")

if [[ -z "$BUNDLE_JSON" ]]; then
    echo "ERROR: Bundle '$BUNDLE_ID' not found in registry"
    exit 1
fi

# Parse bundle fields
BUNDLE_NAME=$(echo "$BUNDLE_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['name'])")
BUNDLE_DESC=$(echo "$BUNDLE_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['description'])")
BUNDLE_CATEGORY=$(echo "$BUNDLE_JSON" | python3 -c "import json,sys; print(json.load(sys.stdin)['category'])")
BUNDLE_TAGS=$(echo "$BUNDLE_JSON" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin)['tags']))")
BUNDLE_HIGHLIGHTS=$(echo "$BUNDLE_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); [print(f'- {h}') for h in d['highlights']]")
PLUGINS_LIST=$(echo "$BUNDLE_JSON" | python3 -c "import json,sys; [print(p) for p in json.load(sys.stdin)['plugins']]")

echo "=== Bundle: $BUNDLE_NAME ==="
echo "ID: $BUNDLE_ID"
echo "Description: $BUNDLE_DESC"
echo "Category: $BUNDLE_CATEGORY"
echo ""

# Validate source plugins exist
MISSING=0
for plugin in $PLUGINS_LIST; do
    plugin_dir="$PROJECT_ROOT/plugins/$plugin"
    if [[ -d "$plugin_dir" ]]; then
        cmd_count=$(find "$plugin_dir/commands" -name "*.md" -not -name "index.json" 2>/dev/null | wc -l)
        agent_count=$(find "$plugin_dir/agents" -name "*.md" -not -name "index.json" 2>/dev/null | wc -l)
        skill_count=$(find "$plugin_dir/skills" -name "SKILL.md" 2>/dev/null | wc -l)
        echo "  OK: $plugin (${cmd_count}C ${agent_count}A ${skill_count}S)"
    else
        echo "  MISSING: $plugin (not installed at $plugin_dir)"
        MISSING=$((MISSING + 1))
    fi
done

if [[ $MISSING -gt 0 ]]; then
    echo ""
    echo "ERROR: $MISSING required plugins are missing. Cannot export bundle."
    exit 1
fi

echo ""

# Count totals
TOTAL_CMDS=0
TOTAL_AGENTS=0
TOTAL_SKILLS=0
for plugin in $PLUGINS_LIST; do
    plugin_dir="$PROJECT_ROOT/plugins/$plugin"
    TOTAL_CMDS=$((TOTAL_CMDS + $(find "$plugin_dir/commands" -name "*.md" 2>/dev/null | wc -l)))
    TOTAL_AGENTS=$((TOTAL_AGENTS + $(find "$plugin_dir/agents" -name "*.md" 2>/dev/null | wc -l)))
    TOTAL_SKILLS=$((TOTAL_SKILLS + $(find "$plugin_dir/skills" -name "SKILL.md" 2>/dev/null | wc -l)))
done

echo "Merged totals: ${TOTAL_CMDS} commands, ${TOTAL_AGENTS} agents, ${TOTAL_SKILLS} skills"

if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    echo "(dry-run mode - no files created)"
    exit 0
fi

# Create export directory
EXPORT_DIR="$OUTPUT_DIR/$BUNDLE_ID"
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR/.claude-plugin" "$EXPORT_DIR/commands" "$EXPORT_DIR/agents" "$EXPORT_DIR/skills"

echo ""
echo "Exporting to: $EXPORT_DIR"

# Generate plugin.json manifest
python3 << PYEOF
import json

manifest = {
    "name": "$BUNDLE_ID",
    "version": "1.0.0",
    "description": "$BUNDLE_DESC",
    "author": {
        "name": "Markus Ahling",
        "email": "markus@lobbi.io"
    },
    "license": "MIT",
    "repository": "https://github.com/markus41/claude",
    "keywords": $BUNDLE_TAGS
}

with open("$EXPORT_DIR/.claude-plugin/plugin.json", "w") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")

print("  Created: .claude-plugin/plugin.json")
PYEOF

# Copy commands from each plugin (rewrite name prefix)
CMD_INDEX_ENTRIES=()
for plugin in $PLUGINS_LIST; do
    plugin_dir="$PROJECT_ROOT/plugins/$plugin"
    if [[ -d "$plugin_dir/commands" ]]; then
        for cmd_file in "$plugin_dir"/commands/*.md; do
            [[ -f "$cmd_file" ]] || continue
            base=$(basename "$cmd_file")

            # Handle collision: if file exists, prefix with plugin name
            target="$EXPORT_DIR/commands/$base"
            if [[ -f "$target" ]]; then
                # Extract short plugin suffix
                suffix=$(echo "$plugin" | sed 's/.*-//')
                base="${base%.md}-${suffix}.md"
                target="$EXPORT_DIR/commands/$base"
            fi

            # Copy and rewrite name in frontmatter to use bundle prefix
            sed "s/^name: ${plugin}:/name: ${BUNDLE_ID}:/" "$cmd_file" > "$target"
            echo "  Copied: commands/$base (from $plugin)"
        done
    fi
done

# Copy agents from each plugin
for plugin in $PLUGINS_LIST; do
    plugin_dir="$PROJECT_ROOT/plugins/$plugin"
    if [[ -d "$plugin_dir/agents" ]]; then
        for agent_file in "$plugin_dir"/agents/*.md; do
            [[ -f "$agent_file" ]] || continue
            base=$(basename "$agent_file")

            target="$EXPORT_DIR/agents/$base"
            if [[ -f "$target" ]]; then
                suffix=$(echo "$plugin" | sed 's/.*-//')
                base="${base%.md}-${suffix}.md"
                target="$EXPORT_DIR/agents/$base"
            fi

            cp "$agent_file" "$target"
            echo "  Copied: agents/$base (from $plugin)"
        done
    fi
done

# Copy skills from each plugin
for plugin in $PLUGINS_LIST; do
    plugin_dir="$PROJECT_ROOT/plugins/$plugin"
    if [[ -d "$plugin_dir/skills" ]]; then
        for skill_dir in "$plugin_dir"/skills/*/; do
            [[ -d "$skill_dir" ]] || continue
            skill_name=$(basename "$skill_dir")
            target_skill="$EXPORT_DIR/skills/$skill_name"

            if [[ -d "$target_skill" ]]; then
                suffix=$(echo "$plugin" | sed 's/.*-//')
                target_skill="$EXPORT_DIR/skills/${skill_name}-${suffix}"
            fi

            cp -r "$skill_dir" "$target_skill"
            echo "  Copied: skills/$skill_name/ (from $plugin)"
        done
    fi
done

# Write plugin list to temp file for Python to read
PLUGINS_TMP=$(mktemp)
echo "$PLUGINS_LIST" > "$PLUGINS_TMP"

# Generate CLAUDE.md
python3 << PYEOF
import os, glob

export_dir = "$EXPORT_DIR"
bundle_id = "$BUNDLE_ID"
bundle_name = "$BUNDLE_NAME"
bundle_desc = "$BUNDLE_DESC"
plugins_file = "$PLUGINS_TMP"

commands = sorted(glob.glob(os.path.join(export_dir, "commands", "*.md")))
agents = sorted(glob.glob(os.path.join(export_dir, "agents", "*.md")))
skills = sorted(glob.glob(os.path.join(export_dir, "skills", "*", "SKILL.md")))

lines = [
    f"# {bundle_name}",
    "",
    bundle_desc,
    "",
    "## Available Commands",
    "",
    "| Command | File |",
    "|---------|------|",
]

for c in commands:
    name = os.path.basename(c).replace(".md", "")
    lines.append(f"| \`/{bundle_id}:{name}\` | commands/{os.path.basename(c)} |")

lines += ["", "## Agents", ""]
for a in agents:
    name = os.path.basename(a).replace(".md", "")
    lines.append(f"- **{name}** - See agents/{os.path.basename(a)}")

lines += ["", "## Skills", ""]
for s in skills:
    name = os.path.basename(os.path.dirname(s))
    lines.append(f"- **{name}** - See skills/{name}/SKILL.md")

lines += ["", "## Source Plugins", ""]
with open(plugins_file) as f:
    for line in f:
        plugin = line.strip()
        if plugin:
            lines.append(f"- {plugin}")

lines.append("")

with open(os.path.join(export_dir, "CLAUDE.md"), "w") as f:
    f.write("\n".join(lines))

print("  Created: CLAUDE.md")
PYEOF

rm -f "$PLUGINS_TMP"

# Generate README.md
cat > "$EXPORT_DIR/README.md" << READMEEOF
# $BUNDLE_NAME

$BUNDLE_DESC

## Highlights

$BUNDLE_HIGHLIGHTS

## Installation

### Claude Desktop (Cowork)
1. Go to **Organization Settings** > **Plugins**
2. Click **Add plugins** > **Upload to a new marketplace**
3. Upload \`$BUNDLE_ID.zip\`
4. Assign to teams/users

### Claude Code (CLI)
\`\`\`bash
claude plugin install ./$BUNDLE_ID.zip
\`\`\`

### From Marketplace
\`\`\`bash
claude plugin marketplace add markus41/claude
claude plugin install $BUNDLE_ID@claude-orchestration
\`\`\`

## Contents

- **Commands:** $TOTAL_CMDS slash commands
- **Agents:** $TOTAL_AGENTS specialized agents
- **Skills:** $TOTAL_SKILLS domain knowledge packs

## License

MIT
READMEEOF
echo "  Created: README.md"

# Create ZIP
cd "$OUTPUT_DIR"
zip -r "$BUNDLE_ID.zip" "$BUNDLE_ID/" -x "*.DS_Store" > /dev/null 2>&1
ZIP_SIZE=$(du -sh "$BUNDLE_ID.zip" | cut -f1)
echo ""
echo "=== Export Complete ==="
echo "  ZIP: $OUTPUT_DIR/$BUNDLE_ID.zip ($ZIP_SIZE)"
echo "  Dir: $EXPORT_DIR/"
echo ""
echo "Upload to Cowork Desktop:"
echo "  Organization Settings > Plugins > Add plugins > Upload"
