#!/bin/bash
#######################################################################
# Claude Code Plugin Installer
#
# Install a local plugin from the plugins/ directory. Creates command
# stubs in .claude/commands/ and registers in plugins.index.json.
#
# Usage:
#   plugin-install.sh <plugin-name> [--force] [--prefix <prefix>]
#
# Arguments:
#   plugin-name   Directory name under plugins/ (e.g., "jira-orchestrator")
#
# Options:
#   --force       Overwrite existing command stubs and registry entry
#   --prefix      Command prefix for stubs (default: derived from plugin name)
#######################################################################

set -e

# Color output (matches build-containers.sh)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Argument parsing ---
PLUGIN_NAME=""
FORCE=false
PREFIX=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --force) FORCE=true; shift ;;
    --prefix) PREFIX="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: plugin-install.sh <plugin-name> [--force] [--prefix <prefix>]"
      exit 0 ;;
    -*)
      print_error "Unknown option: $1"
      exit 1 ;;
    *)
      PLUGIN_NAME="$1"; shift ;;
  esac
done

if [[ -z "$PLUGIN_NAME" ]]; then
  print_error "Usage: plugin-install.sh <plugin-name> [--force] [--prefix <prefix>]"
  exit 1
fi

# --- Resolve paths ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PLUGIN_DIR="$PROJECT_ROOT/plugins/$PLUGIN_NAME"
PLUGIN_JSON="$PLUGIN_DIR/.claude-plugin/plugin.json"
COMMANDS_DIR="$PROJECT_ROOT/.claude/commands"
REGISTRY_FILE="$PROJECT_ROOT/.claude/registry/plugins.index.json"

# --- Validate plugin exists ---
if [[ ! -d "$PLUGIN_DIR" ]]; then
  print_error "Plugin not found: plugins/$PLUGIN_NAME"
  echo "  Available plugins:"
  for d in "$PROJECT_ROOT/plugins"/*/; do
    [[ -d "$d" ]] && echo "    - $(basename "$d")"
  done
  exit 1
fi

if [[ ! -f "$PLUGIN_JSON" ]]; then
  print_error "No manifest: plugins/$PLUGIN_NAME/.claude-plugin/plugin.json"
  exit 1
fi

# --- Find Python ---
PYTHON=""
if command -v python3 &>/dev/null; then
  PYTHON="python3"
elif command -v python &>/dev/null; then
  PYTHON="python"
else
  print_error "Python not found. Required for JSON operations."
  exit 1
fi

# --- Parse and validate plugin.json ---
PLUGIN_META=$($PYTHON -c "
import json, sys
try:
    with open(sys.argv[1]) as f:
        m = json.load(f)
except json.JSONDecodeError as e:
    print(f'INVALID_JSON:{e}', file=sys.stderr)
    sys.exit(1)
missing = [k for k in ['name','version','description'] if k not in m]
if missing:
    print(f'MISSING_FIELDS:{','.join(missing)}', file=sys.stderr)
    sys.exit(1)
print(m['name'])
print(m['version'])
print(m.get('description','')[:80])
print(m.get('commandPrefix',''))
" "$PLUGIN_JSON" 2>&1) || {
  if echo "$PLUGIN_META" | grep -q "INVALID_JSON"; then
    print_error "plugin.json is not valid JSON: ${PLUGIN_META#INVALID_JSON:}"
  elif echo "$PLUGIN_META" | grep -q "MISSING_FIELDS"; then
    print_error "plugin.json missing required fields: ${PLUGIN_META#MISSING_FIELDS:}"
  else
    print_error "Failed to parse plugin.json: $PLUGIN_META"
  fi
  exit 1
}

PNAME=$(echo "$PLUGIN_META" | sed -n '1p')
PVERSION=$(echo "$PLUGIN_META" | sed -n '2p')
PDESC=$(echo "$PLUGIN_META" | sed -n '3p')
MANIFEST_PREFIX=$(echo "$PLUGIN_META" | sed -n '4p')

print_status "Installing plugin: $PNAME v$PVERSION"

# --- Derive command prefix ---
if [[ -n "$PREFIX" ]]; then
  CMD_PREFIX="$PREFIX"
elif [[ -n "$MANIFEST_PREFIX" ]]; then
  CMD_PREFIX="$MANIFEST_PREFIX"
else
  CMD_PREFIX=$(echo "$PNAME" | sed -E 's/-(orchestrator|plugin|system|hub|engine|dashboard|toolkit|powerhouse|lab|workflow|pipeline)$//')
fi

print_status "Command prefix: $CMD_PREFIX"

# --- Create command stubs ---
CREATED=0
SKIPPED=0
OVERWRITTEN=0

mkdir -p "$COMMANDS_DIR"

if [[ -d "$PLUGIN_DIR/commands" ]]; then
  for cmd_file in "$PLUGIN_DIR/commands/"*.md; do
    [[ ! -f "$cmd_file" ]] && continue
    filename=$(basename "$cmd_file")
    stub_name="${CMD_PREFIX}-${filename}"
    stub_path="$COMMANDS_DIR/$stub_name"
    relative_path="../../plugins/$PLUGIN_NAME/commands/$filename"

    if [[ -f "$stub_path" ]] && [[ "$FORCE" != "true" ]]; then
      SKIPPED=$((SKIPPED + 1))
      continue
    fi

    [[ -f "$stub_path" ]] && OVERWRITTEN=$((OVERWRITTEN + 1))
    echo "$relative_path" > "$stub_path"
    CREATED=$((CREATED + 1))
  done
else
  print_warning "No commands/ directory found in plugin"
fi

# --- Update registry ---
FORCE_PY="False"
[[ "$FORCE" == "true" ]] && FORCE_PY="True"

$PYTHON -c "
import json, sys
from datetime import datetime, timezone

registry_path = sys.argv[1]
plugin_key = sys.argv[2]
plugin_version = sys.argv[3]
plugin_dir = sys.argv[4]
force = sys.argv[5] == 'True'

try:
    with open(registry_path) as f:
        registry = json.load(f)
except FileNotFoundError:
    registry = {'installed': {}, 'stats': {}}
except json.JSONDecodeError:
    print('ERROR: plugins.index.json is not valid JSON', file=sys.stderr)
    sys.exit(1)

installed = registry.setdefault('installed', {})

if plugin_key in installed and not force:
    print(f'SKIP: {plugin_key} already registered (use --force)')
    sys.exit(0)

installed[plugin_key] = {
    'version': plugin_version,
    'path': f'../plugins/{plugin_dir}',
    'source': 'local',
    'installedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'),
    'dependencies': {}
}

stats = registry.setdefault('stats', {})
stats['totalInstalled'] = len(installed)
stats['lastUpdated'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z')

with open(registry_path, 'w') as f:
    json.dump(registry, f, indent=2)
    f.write('\n')

print(f'OK: {plugin_key} v{plugin_version}')
" "$REGISTRY_FILE" "$PNAME" "$PVERSION" "$PLUGIN_NAME" "$FORCE_PY" 2>&1 || {
  print_error "Failed to update registry"
  exit 1
}

# --- Report ---
echo ""
echo "============================================"
echo "   Plugin Installation Report"
echo "============================================"
echo ""
echo "  Plugin:   $PNAME"
echo "  Version:  $PVERSION"
echo "  Source:   local (plugins/$PLUGIN_NAME)"
echo "  Prefix:   $CMD_PREFIX"
echo ""
if [[ $CREATED -gt 0 ]] || [[ $SKIPPED -gt 0 ]] || [[ $OVERWRITTEN -gt 0 ]]; then
  echo "  Commands: $CREATED created, $SKIPPED skipped, $OVERWRITTEN overwritten"
fi
echo "  Registry: Updated"
echo ""
echo "  Use: /${CMD_PREFIX}-<command>"
echo "============================================"
