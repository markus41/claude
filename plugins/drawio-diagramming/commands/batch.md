---
name: drawio:batch
intent: Batch process multiple diagrams - generate, export, update, or analyze in bulk
tags:
  - drawio-diagramming
  - command
  - batch
inputs: []
risk: medium
cost: high
description: Batch process multiple draw.io diagrams in a single operation. Supports bulk generation from source files, mass export to SVG/PNG/PDF, applying theme or style updates across all diagrams, refreshing data-bound diagrams, updating platform embeds, and generating summary reports. Includes pipeline integration scripts for CI/CD systems.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:batch

Batch process multiple draw.io diagrams: generate, export, update, analyze, or
transform in bulk with parallel processing and comprehensive reporting.

## Overview

Batch operations allow you to apply a single action across many diagrams at once.
This is essential for maintaining consistency across a documentation set, keeping
exports up to date, and integrating diagram workflows into CI/CD pipelines.

## Flags

| Flag | Alias | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--type <operation>` | `-t` | string | `export` | Batch operation type (generate, export, style, embed, refresh, analyze, validate) |
| `--format <fmt>` | `-f` | string | `svg` | Export format for batch export (svg, png, pdf) |
| `--output <dir>` | `-o` | string | `./exports` | Output directory for batch results |
| `--include <glob>` | `-I` | string | `*.drawio` | File glob pattern to include |
| `--exclude <glob>` | `-X` | string | none | File glob pattern to exclude |
| `--recursive` | `-r` | boolean | `false` | Search for files recursively in subdirectories |
| `--parallel <n>` | `-p` | number | `4` | Number of parallel workers |
| `--max-concurrent <n>` | | number | `4` | Alias for --parallel |
| `--theme <name>` | `-T` | string | none | Theme to apply in batch style operations |
| `--custom-theme <json>` | | string | none | JSON string with custom theme colors |
| `--quality <pct>` | `-q` | number | `100` | Export quality percentage (1-100) |
| `--scale <factor>` | `-s` | number | `1.0` | Export scale factor |
| `--transparent` | | boolean | `false` | Use transparent background in exports |
| `--page-index <n>` | `-P` | number | all | Export only this page index (0-based) |
| `--export` | `-E` | boolean | `true` | Trigger export (draw.io CLI flag) |
| `--json` | `-j` | boolean | `false` | Output results as JSON report |
| `--name-only` | | boolean | `false` | Output only filenames in results |
| `--dry-run` | `-n` | boolean | `false` | Preview batch operations without executing |
| `--verbose` | `-v` | boolean | `false` | Show detailed per-file processing output |
| `--fail-fast` | | boolean | `false` | Stop batch on first failure |
| `--continue-on-error` | `-C` | boolean | `true` | Continue processing remaining files after a failure |

### Flag Details

#### Operation & Scope Flags
- **`--type <operation>`** (`-t`): The batch operation to perform. `generate` creates diagrams from source files. `export` converts .drawio to image formats. `style` applies theme changes. `embed` updates platform embeds. `refresh` re-runs data bindings. `analyze` runs quality analysis. `validate` checks for structural errors.
- **`--include <glob>`** (`-I`): File pattern to match. Default `*.drawio` finds all draw.io files in the target directory. Use `**/*.drawio` with `--recursive` for deep search.
- **`--exclude <glob>`** (`-X`): Exclude files matching this pattern. Example: `--exclude "*-draft.drawio"` skips draft diagrams.
- **`--recursive`** (`-r`): Search subdirectories for matching files. Without this flag, only the immediate directory is searched.

#### Export Flags
- **`--format <fmt>`** (`-f`): Target format for batch export. Supports all draw.io export formats: svg, png, pdf.
- **`--output <dir>`** (`-o`): Destination directory. Created automatically if it does not exist. Files retain their original names with the new extension.
- **`--quality <pct>`** (`-q`): Image compression quality for PNG exports.
- **`--scale <factor>`** (`-s`): Resolution multiplier. `2.0` produces retina-quality exports.
- **`--transparent`**: Transparent backgrounds for all exports. Useful for diagrams embedded on colored pages.
- **`--page-index <n>`** (`-P`): Export a specific page from multi-page diagrams. When omitted, all pages are exported.

#### Style Flags
- **`--theme <name>`** (`-T`): Apply a named theme across all matching diagrams. Used with `--type style`.
- **`--custom-theme <json>`**: Provide a custom color mapping as JSON. Example: `--custom-theme '{"fill":"#1a1a2e","stroke":"#16213e","font":"#e0e0e0"}'`.

#### Performance & Error Handling Flags
- **`--parallel <n>`** / **`--max-concurrent <n>`**: Control parallelism. Higher values speed up batch processing but increase memory usage. Set to `1` for sequential processing.
- **`--fail-fast`**: Stop the entire batch on the first failure. Useful in CI pipelines where any failure should abort.
- **`--continue-on-error`** (`-C`): Default behavior. Log failures and continue processing remaining files. The final report shows success/failure counts.

#### Output Flags
- **`--json`** (`-j`): Emit a JSON report with per-file results including status, output path, file size, and any errors.
- **`--name-only`**: Minimal output showing only processed filenames.
- **`--dry-run`** (`-n`): List all files that would be processed and the operations that would be applied, without executing anything.
- **`--verbose`** (`-v`): Show detailed output for each file: export commands, file sizes, processing time.

#### Examples with Flags

```bash
# Batch export all diagrams to SVG
drawio:batch docs/diagrams/ --type export --format svg --output exports/

# Batch export with retina quality, recursive search
drawio:batch . --type export --format png --scale 2 --recursive --verbose

# Apply dark theme to all diagrams
drawio:batch docs/diagrams/ --type style --theme dark --dry-run

# Analyze all diagrams with JSON report
drawio:batch docs/ --type analyze --json --recursive --output reports/

# Batch validate with fail-fast for CI
drawio:batch . --type validate --recursive --fail-fast --json

# Parallel export with custom include pattern
drawio:batch . --type export --include "architecture-*.drawio" --parallel 8 --format svg
```

## Supported Batch Operations

| Operation | Description | Risk |
|-----------|-------------|------|
| `generate` | Create diagrams from multiple source files | Low |
| `export` | Convert .drawio files to SVG/PNG/PDF | Low |
| `style` | Apply theme or style updates across diagrams | Medium |
| `embed` | Update platform embeds after diagram changes | Medium |
| `refresh` | Re-run data binding on all data-bound diagrams | Medium |
| `analyze` | Run quality analysis on all diagrams | Low |
| `validate` | Check all diagrams for structural errors | Low |

## Batch Generation

Generate diagrams from multiple source files (code, config, database schemas).

### From Source Code Files

```bash
#!/usr/bin/env bash
# batch-generate.sh - Generate diagrams from multiple source files
#
# Usage: batch-generate.sh <source-dir> <output-dir> [--type architecture|erd|sequence]

set -euo pipefail

SOURCE_DIR="${1:-.}"
OUTPUT_DIR="${2:-./diagrams}"
DIAGRAM_TYPE="${3:-architecture}"
PARALLEL="${PARALLEL:-4}"

mkdir -p "$OUTPUT_DIR"

echo "=== Batch Generate: $DIAGRAM_TYPE ==="
echo "Source: $SOURCE_DIR"
echo "Output: $OUTPUT_DIR"
echo "Parallel: $PARALLEL"
echo ""

TOTAL=0
SUCCESS=0
FAILED=0

process_file() {
    local src="$1"
    local out_dir="$2"
    local dtype="$3"
    local basename
    basename=$(basename "$src" | sed 's/\.[^.]*$//')
    local output="$out_dir/${basename}.drawio"

    echo "  Processing: $src -> $output"

    # Call the appropriate generator based on type
    case "$dtype" in
        architecture)
            python3 -c "
import sys
sys.path.insert(0, 'plugins/drawio-diagramming/scripts')
from generate_architecture import generate
generate('$src', '$output')
" 2>/dev/null && echo "    OK: $output" || echo "    FAIL: $src"
            ;;
        erd)
            python3 -c "
import sys
sys.path.insert(0, 'plugins/drawio-diagramming/scripts')
from generate_erd import generate
generate('$src', '$output')
" 2>/dev/null && echo "    OK: $output" || echo "    FAIL: $src"
            ;;
        sequence)
            python3 -c "
import sys
sys.path.insert(0, 'plugins/drawio-diagramming/scripts')
from generate_sequence import generate
generate('$src', '$output')
" 2>/dev/null && echo "    OK: $output" || echo "    FAIL: $src"
            ;;
    esac
}

export -f process_file

# Find all relevant source files
case "$DIAGRAM_TYPE" in
    architecture)
        PATTERN="*.ts *.tsx *.py *.java *.go"
        ;;
    erd)
        PATTERN="*.prisma *.sql schema.* migration.*"
        ;;
    sequence)
        PATTERN="*.ts *.py *.java"
        ;;
    *)
        echo "Unknown type: $DIAGRAM_TYPE"
        exit 1
        ;;
esac

FILE_LIST=$(mktemp)
for pat in $PATTERN; do
    find "$SOURCE_DIR" -name "$pat" -not -path "*/node_modules/*" \
        -not -path "*/.git/*" >> "$FILE_LIST" 2>/dev/null || true
done

TOTAL=$(wc -l < "$FILE_LIST")
echo "Found $TOTAL source files"
echo ""

# Process files (with xargs for parallelism if available)
while IFS= read -r file; do
    process_file "$file" "$OUTPUT_DIR" "$DIAGRAM_TYPE"
done < "$FILE_LIST"

rm -f "$FILE_LIST"

echo ""
echo "=== Batch Generate Complete ==="
echo "Total: $TOTAL | Success: $SUCCESS | Failed: $FAILED"
```

### From Directory Structure

```bash
#!/usr/bin/env bash
# batch-from-dirs.sh - Generate architecture diagram from directory layout

set -euo pipefail

ROOT="${1:-.}"
OUTPUT="${2:-architecture-overview.drawio}"

echo "=== Generating architecture from directory structure ==="

python3 << 'PYEOF'
import os
import sys
import xml.etree.ElementTree as ET

root_dir = sys.argv[1] if len(sys.argv) > 1 else "."
output = sys.argv[2] if len(sys.argv) > 2 else "architecture-overview.drawio"

# Scan top-level directories as components
components = []
for entry in sorted(os.listdir(root_dir)):
    path = os.path.join(root_dir, entry)
    if os.path.isdir(path) and not entry.startswith('.') and entry != 'node_modules':
        file_count = sum(1 for _, _, files in os.walk(path) for f in files)
        components.append({
            'name': entry,
            'files': file_count,
            'has_package': os.path.isfile(os.path.join(path, 'package.json')),
            'has_dockerfile': os.path.isfile(os.path.join(path, 'Dockerfile')),
        })

# Generate draw.io XML
x_start = 80
y_start = 100
x_gap = 220
y_gap = 140
cols = 4

xml_parts = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mxfile host="app.diagrams.net">',
    '  <diagram id="arch-overview" name="Architecture Overview">',
    '    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1">',
    '      <root>',
    '        <mxCell id="0" />',
    '        <mxCell id="1" parent="0" />',
]

for i, comp in enumerate(components):
    col = i % cols
    row = i // cols
    x = x_start + col * x_gap
    y = y_start + row * y_gap

    color = '#d5e8d4' if comp['has_dockerfile'] else '#dae8fc'
    stroke = '#82b366' if comp['has_dockerfile'] else '#6c8ebf'
    icon = ' [Docker]' if comp['has_dockerfile'] else ''
    pkg = ' [pkg]' if comp['has_package'] else ''

    label = f"{comp['name']}{icon}{pkg}\\n({comp['files']} files)"

    xml_parts.append(
        f'        <mxCell id="comp-{i}" value="{label}" '
        f'style="rounded=1;whiteSpace=wrap;html=1;fillColor={color};'
        f'strokeColor={stroke};fontSize=11;fontStyle=1;" '
        f'vertex="1" parent="1">'
        f'<mxGeometry x="{x}" y="{y}" width="180" height="80" as="geometry" />'
        f'</mxCell>'
    )

xml_parts.extend([
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>',
])

with open(output, 'w') as f:
    f.write('\n'.join(xml_parts))

print(f"Generated: {output} ({len(components)} components)")
PYEOF
```

## Batch Export

Convert all `.drawio` files to image formats using the draw.io CLI or headless
rendering.

### Export Script

```bash
#!/usr/bin/env bash
# batch-export.sh - Export all .drawio files to SVG/PNG/PDF
#
# Usage: batch-export.sh <input-dir> <output-dir> [--format svg|png|pdf] [--parallel N]
#
# Prerequisites:
#   - draw.io desktop (for drawio CLI) or xvfb for headless
#   - OR: npm install -g @drawio/cli

set -euo pipefail

INPUT_DIR="${1:-.}"
OUTPUT_DIR="${2:-./exports}"
FORMAT="${3:-svg}"
PARALLEL="${4:-4}"
QUALITY="${QUALITY:-90}"
SCALE="${SCALE:-2}"
TRANSPARENT="${TRANSPARENT:-false}"

mkdir -p "$OUTPUT_DIR"

echo "=== Batch Export ==="
echo "Input:    $INPUT_DIR"
echo "Output:   $OUTPUT_DIR"
echo "Format:   $FORMAT"
echo "Quality:  $QUALITY"
echo "Scale:    ${SCALE}x"
echo ""

TOTAL=0
SUCCESS=0
FAILED=0

export_file() {
    local input="$1"
    local output_dir="$2"
    local fmt="$3"
    local basename
    basename=$(basename "$input" .drawio)
    local output="$output_dir/${basename}.${fmt}"

    # Get number of pages in the diagram
    local pages
    pages=$(python3 -c "
import xml.etree.ElementTree as ET
tree = ET.parse('$input')
diagrams = list(tree.getroot().iter('diagram'))
print(len(diagrams))
" 2>/dev/null || echo "1")

    # Export each page
    for ((page=0; page<pages; page++)); do
        local page_output
        if [ "$pages" -gt 1 ]; then
            page_output="$output_dir/${basename}-page${page}.${fmt}"
        else
            page_output="$output"
        fi

        # Try drawio CLI first
        if command -v drawio &>/dev/null; then
            drawio --export \
                --format "$fmt" \
                --output "$page_output" \
                --page-index "$page" \
                --scale "$SCALE" \
                --quality "$QUALITY" \
                --transparent "$TRANSPARENT" \
                "$input" 2>/dev/null && {
                echo "  OK: $page_output"
                return 0
            }
        fi

        # Fallback: use xvfb-run with drawio
        if command -v xvfb-run &>/dev/null && command -v drawio &>/dev/null; then
            xvfb-run drawio --export \
                --format "$fmt" \
                --output "$page_output" \
                --page-index "$page" \
                --scale "$SCALE" \
                "$input" 2>/dev/null && {
                echo "  OK: $page_output (headless)"
                return 0
            }
        fi

        # Fallback: draw.io export API
        echo "  SKIP: $input (no drawio CLI available)"
        return 1
    done
}

# Find all .drawio files
while IFS= read -r file; do
    TOTAL=$((TOTAL + 1))
    if export_file "$file" "$OUTPUT_DIR" "$FORMAT"; then
        SUCCESS=$((SUCCESS + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done < <(find "$INPUT_DIR" -name "*.drawio" -type f | sort)

echo ""
echo "=== Export Complete ==="
echo "Total: $TOTAL | Exported: $SUCCESS | Failed: $FAILED"
echo "Output directory: $OUTPUT_DIR"

# Generate index.html for browsing exports
if [ "$FORMAT" = "svg" ] || [ "$FORMAT" = "png" ]; then
    cat > "$OUTPUT_DIR/index.html" << 'HTMLEOF'
<!DOCTYPE html>
<html>
<head><title>Diagram Exports</title>
<style>
  body { font-family: system-ui; max-width: 1200px; margin: 0 auto; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
  .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
  .card img { max-width: 100%; height: auto; }
  .card h3 { margin: 0 0 8px 0; font-size: 14px; }
</style>
</head>
<body>
<h1>Diagram Exports</h1>
<div class="grid">
HTMLEOF

    for img in "$OUTPUT_DIR"/*."$FORMAT"; do
        [ -f "$img" ] || continue
        name=$(basename "$img")
        echo "<div class='card'><h3>$name</h3><img src='$name' alt='$name' /></div>" \
            >> "$OUTPUT_DIR/index.html"
    done

    echo "</div></body></html>" >> "$OUTPUT_DIR/index.html"
    echo "Browse exports: $OUTPUT_DIR/index.html"
fi
```

### Export Format Options

| Format | Use Case | Notes |
|--------|----------|-------|
| `svg` | Web embedding, documentation | Vector, scales perfectly, editable |
| `png` | Presentations, chat embeds | Raster, use `--scale 2` for retina |
| `pdf` | Print, formal documents | Vector, multi-page support |
| `vsdx` | Visio interchange | For teams using Microsoft Visio |
| `xml` | Backup, version control | Raw draw.io XML |

## Batch Style Updates

Apply a theme or style transformation across all diagrams in a directory.

```python
#!/usr/bin/env python3
"""batch-style.py - Apply style updates across all diagrams."""

import xml.etree.ElementTree as ET
import glob
import sys
import os
import json
import re

# Predefined themes
THEMES = {
    'dark': {
        'background': '#1a1a2e',
        'fillColor': {'default': '#16213e', 'primary': '#0f3460', 'accent': '#e94560'},
        'strokeColor': {'default': '#533483', 'primary': '#0f3460'},
        'fontColor': '#e0e0e0',
        'fontSize': 12,
    },
    'light': {
        'background': '#ffffff',
        'fillColor': {'default': '#f5f5f5', 'primary': '#dae8fc', 'accent': '#d5e8d4'},
        'strokeColor': {'default': '#666666', 'primary': '#6c8ebf'},
        'fontColor': '#333333',
        'fontSize': 12,
    },
    'blueprint': {
        'background': '#1b2838',
        'fillColor': {'default': '#2a475e', 'primary': '#1b2838', 'accent': '#66c0f4'},
        'strokeColor': {'default': '#66c0f4', 'primary': '#c7d5e0'},
        'fontColor': '#c7d5e0',
        'fontSize': 11,
    },
    'corporate': {
        'background': '#ffffff',
        'fillColor': {'default': '#f0f4f8', 'primary': '#1a365d', 'accent': '#2b6cb0'},
        'strokeColor': {'default': '#a0aec0', 'primary': '#1a365d'},
        'fontColor': '#1a202c',
        'fontSize': 12,
    },
    'pastel': {
        'background': '#fefefe',
        'fillColor': {'default': '#fce4ec', 'primary': '#e3f2fd', 'accent': '#e8f5e9'},
        'strokeColor': {'default': '#f8bbd0', 'primary': '#90caf9'},
        'fontColor': '#424242',
        'fontSize': 12,
    },
}

def apply_theme(filepath, theme_name, dry_run=False):
    """Apply a theme to a single draw.io file."""
    if theme_name not in THEMES:
        print(f"  Unknown theme: {theme_name}")
        return False

    theme = THEMES[theme_name]
    tree = ET.parse(filepath)
    root = tree.getroot()
    changes = 0

    for cell in root.iter('mxCell'):
        cell_id = cell.get('id', '')
        if cell_id in ('0', '1'):
            continue

        style = cell.get('style', '')
        if not style:
            continue

        new_style = style

        # Update font color
        if 'fontColor=' in new_style:
            new_style = re.sub(
                r'fontColor=#[0-9a-fA-F]+',
                f"fontColor={theme['fontColor']}",
                new_style
            )

        # Update font size
        if 'fontSize=' in new_style:
            new_style = re.sub(
                r'fontSize=\d+',
                f"fontSize={theme['fontSize']}",
                new_style
            )

        # Update fill color (use default from theme)
        if 'fillColor=' in new_style:
            current_fill = re.search(r'fillColor=(#[0-9a-fA-F]+)', new_style)
            if current_fill:
                new_style = re.sub(
                    r'fillColor=#[0-9a-fA-F]+',
                    f"fillColor={theme['fillColor']['default']}",
                    new_style
                )

        # Update stroke color
        if 'strokeColor=' in new_style:
            current_stroke = re.search(r'strokeColor=(#[0-9a-fA-F]+)', new_style)
            if current_stroke:
                new_style = re.sub(
                    r'strokeColor=#[0-9a-fA-F]+',
                    f"strokeColor={theme['strokeColor']['default']}",
                    new_style
                )

        if new_style != style:
            cell.set('style', new_style)
            changes += 1

    if dry_run:
        print(f"  DRY-RUN: {filepath} ({changes} changes)")
    else:
        tree.write(filepath, xml_declaration=True, encoding='UTF-8')
        print(f"  UPDATED: {filepath} ({changes} changes)")

    return True

def batch_apply(directory, theme_name, dry_run=False):
    """Apply theme to all diagrams in a directory."""
    files = glob.glob(os.path.join(directory, '**/*.drawio'), recursive=True)

    print(f"=== Batch Style: {theme_name} theme ===")
    print(f"Directory: {directory}")
    print(f"Files found: {len(files)}")
    if dry_run:
        print("Mode: DRY RUN")
    print()

    success = 0
    failed = 0

    for filepath in sorted(files):
        try:
            apply_theme(filepath, theme_name, dry_run)
            success += 1
        except Exception as e:
            print(f"  ERROR: {filepath}: {e}")
            failed += 1

    print(f"\n=== Complete: {success} updated, {failed} failed ===")

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Batch apply themes to draw.io files')
    parser.add_argument('directory', help='Directory to scan')
    parser.add_argument('--theme', default='light', choices=THEMES.keys(),
                        help='Theme to apply')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes')
    parser.add_argument('--custom-theme', help='Path to custom theme JSON')
    args = parser.parse_args()

    if args.custom_theme:
        with open(args.custom_theme) as f:
            THEMES['custom'] = json.load(f)
        batch_apply(args.directory, 'custom', args.dry_run)
    else:
        batch_apply(args.directory, args.theme, args.dry_run)
```

### Custom Theme File Format

```json
{
  "background": "#ffffff",
  "fillColor": {
    "default": "#f0f4f8",
    "primary": "#2b6cb0",
    "secondary": "#4299e1",
    "accent": "#48bb78",
    "warning": "#ed8936",
    "error": "#fc8181"
  },
  "strokeColor": {
    "default": "#a0aec0",
    "primary": "#2b6cb0"
  },
  "fontColor": "#1a202c",
  "fontSize": 12,
  "fontFamily": "Inter, system-ui, sans-serif",
  "rounded": true,
  "shadow": false
}
```

## Batch Embed Update

After diagrams change, update all references in documentation, wikis, and
platform-specific embeds.

```bash
#!/usr/bin/env bash
# batch-embed.sh - Update diagram embeds across documentation
#
# Scans markdown/HTML files for draw.io references and updates them
# with fresh exports.

set -euo pipefail

DOCS_DIR="${1:-.}"
DIAGRAMS_DIR="${2:-./diagrams}"
EXPORT_DIR="${3:-./docs/images}"
FORMAT="${FORMAT:-svg}"

echo "=== Batch Embed Update ==="
echo "Docs:     $DOCS_DIR"
echo "Diagrams: $DIAGRAMS_DIR"
echo "Exports:  $EXPORT_DIR"
echo ""

mkdir -p "$EXPORT_DIR"

UPDATED=0
SKIPPED=0

# Find all markdown files referencing .drawio or diagram images
while IFS= read -r md_file; do
    # Extract diagram references from markdown image syntax
    while IFS= read -r ref; do
        [ -z "$ref" ] && continue
        diagram_name=$(basename "$ref" ".${FORMAT}")
        drawio_file="$DIAGRAMS_DIR/${diagram_name}.drawio"

        if [ ! -f "$drawio_file" ]; then
            echo "  SKIP: $ref (source not found: $drawio_file)"
            SKIPPED=$((SKIPPED + 1))
            continue
        fi

        export_file="$EXPORT_DIR/${diagram_name}.${FORMAT}"

        # Check if export is older than source
        if [ -f "$export_file" ] && [ "$export_file" -nt "$drawio_file" ]; then
            echo "  SKIP: $diagram_name (export is up-to-date)"
            SKIPPED=$((SKIPPED + 1))
            continue
        fi

        # Re-export the diagram
        if command -v drawio &>/dev/null; then
            drawio --export --format "$FORMAT" --output "$export_file" \
                "$drawio_file" 2>/dev/null && {
                echo "  EXPORTED: $diagram_name -> $export_file"
                UPDATED=$((UPDATED + 1))
            } || {
                echo "  FAIL: $diagram_name"
            }
        else
            echo "  SKIP: drawio CLI not available"
        fi
    done < <(grep -oP '!\[.*?\]\(\K[^)]*\.'"$FORMAT"'' "$md_file" 2>/dev/null || true)
done < <(find "$DOCS_DIR" -name "*.md" -type f)

echo ""
echo "=== Embed Update Complete ==="
echo "Updated: $UPDATED | Skipped: $SKIPPED"
```

## Batch Data-Bind Refresh

For diagrams that pull data from external sources (CSV, JSON, APIs), refresh all
bindings in bulk.

```python
#!/usr/bin/env python3
"""batch-refresh.py - Refresh data bindings in all diagrams."""

import xml.etree.ElementTree as ET
import glob
import json
import csv
import os
import sys

def find_data_bindings(filepath):
    """Find data binding metadata in a diagram."""
    tree = ET.parse(filepath)
    root = tree.getroot()
    bindings = []

    for cell in root.iter('mxCell'):
        value = cell.get('value', '')
        style = cell.get('style', '')

        # Check for data binding markers in custom properties
        if 'data-source=' in style or '%data:' in value:
            bindings.append({
                'cell_id': cell.get('id'),
                'value': value,
                'style': style,
            })

    # Check for CSV import metadata
    for diagram in root.iter('diagram'):
        # draw.io stores CSV import config in diagram attributes
        csv_config = diagram.get('csvImport', '')
        if csv_config:
            bindings.append({
                'type': 'csv',
                'config': csv_config,
                'diagram_id': diagram.get('id'),
            })

    return bindings

def refresh_csv_binding(filepath, csv_source, diagram_id):
    """Refresh a CSV-based data binding."""
    if not os.path.isfile(csv_source):
        print(f"    WARN: CSV source not found: {csv_source}")
        return False

    with open(csv_source) as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"    Loaded {len(rows)} rows from {csv_source}")
    # Regenerate diagram elements from CSV data
    # (implementation depends on the CSV-to-diagram mapping)
    return True

def batch_refresh(directory):
    """Refresh all data-bound diagrams in a directory."""
    files = glob.glob(os.path.join(directory, '**/*.drawio'), recursive=True)

    print(f"=== Batch Data Refresh ===")
    print(f"Scanning: {directory}")
    print(f"Files: {len(files)}")
    print()

    refreshed = 0
    no_bindings = 0

    for filepath in sorted(files):
        bindings = find_data_bindings(filepath)
        if not bindings:
            no_bindings += 1
            continue

        print(f"  {filepath}: {len(bindings)} binding(s)")
        for binding in bindings:
            btype = binding.get('type', 'cell')
            if btype == 'csv':
                refresh_csv_binding(filepath, binding.get('config', ''),
                                    binding.get('diagram_id', ''))
        refreshed += 1

    print(f"\n=== Refresh Complete ===")
    print(f"Refreshed: {refreshed} | No bindings: {no_bindings}")

if __name__ == '__main__':
    batch_refresh(sys.argv[1] if len(sys.argv) > 1 else '.')
```

## Pipeline Integration

### GitHub Actions

```yaml
# .github/workflows/diagram-pipeline.yml
name: Diagram Pipeline
on:
  push:
    paths: ['**/*.drawio', 'diagrams/**']
  pull_request:
    paths: ['**/*.drawio']

jobs:
  process-diagrams:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install draw.io CLI
        run: |
          wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.7.17/drawio-amd64-24.7.17.deb
          sudo apt-get install -y ./drawio-amd64-24.7.17.deb xvfb

      - name: Find changed diagrams
        id: changed
        run: |
          if [ "${{ github.event_name }}" = "pull_request" ]; then
            FILES=$(git diff --name-only origin/${{ github.base_ref }}...HEAD -- '*.drawio' | tr '\n' ' ')
          else
            FILES=$(git diff --name-only HEAD~1 -- '*.drawio' | tr '\n' ' ')
          fi
          echo "files=$FILES" >> "$GITHUB_OUTPUT"
          echo "count=$(echo $FILES | wc -w)" >> "$GITHUB_OUTPUT"

      - name: Analyze diagram quality
        if: steps.changed.outputs.count != '0'
        run: |
          for f in ${{ steps.changed.outputs.files }}; do
            echo "--- Analyzing: $f ---"
            python3 plugins/drawio-diagramming/scripts/analyze-drawio.py "$f"
          done

      - name: Export diagrams
        if: steps.changed.outputs.count != '0'
        run: |
          mkdir -p exports
          for f in ${{ steps.changed.outputs.files }}; do
            base=$(basename "$f" .drawio)
            xvfb-run drawio --export --format svg \
              --output "exports/${base}.svg" "$f"
            xvfb-run drawio --export --format png \
              --scale 2 --output "exports/${base}.png" "$f"
          done

      - name: Upload exports
        if: steps.changed.outputs.count != '0'
        uses: actions/upload-artifact@v4
        with:
          name: diagram-exports
          path: exports/

      - name: Comment on PR with previews
        if: github.event_name == 'pull_request' && steps.changed.outputs.count != '0'
        uses: actions/github-script@v7
        with:
          script: |
            const files = '${{ steps.changed.outputs.files }}'.trim().split(' ');
            let body = '## Diagram Changes\n\n';
            for (const f of files) {
              const name = f.replace(/.*\//, '').replace('.drawio', '');
              body += `### ${name}\n`;
              body += `Changed: \`${f}\`\n\n`;
            }
            body += `\n${files.length} diagram(s) updated. Exports attached as artifacts.`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

### Azure Pipelines

```yaml
# azure-pipelines-diagrams.yml
trigger:
  paths:
    include:
      - '**/*.drawio'

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: Bash@3
    displayName: 'Install draw.io'
    inputs:
      targetType: 'inline'
      script: |
        wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.7.17/drawio-amd64-24.7.17.deb
        sudo apt-get install -y ./drawio-amd64-24.7.17.deb xvfb

  - task: Bash@3
    displayName: 'Batch export diagrams'
    inputs:
      targetType: 'inline'
      script: |
        bash plugins/drawio-diagramming/scripts/batch-export.sh . $(Build.ArtifactStagingDirectory)/diagrams svg

  - task: Bash@3
    displayName: 'Analyze diagram quality'
    inputs:
      targetType: 'inline'
      script: |
        find . -name "*.drawio" -exec python3 plugins/drawio-diagramming/scripts/analyze-drawio.py {} \;

  - task: PublishBuildArtifacts@1
    displayName: 'Publish diagram exports'
    inputs:
      pathtoPublish: '$(Build.ArtifactStagingDirectory)/diagrams'
      artifactName: 'diagram-exports'
```

### Harness Pipeline

```yaml
# harness-diagram-pipeline.yaml
pipeline:
  name: Diagram Processing
  stages:
    - stage:
        name: Process Diagrams
        type: CI
        spec:
          execution:
            steps:
              - step:
                  type: Run
                  name: Export All Diagrams
                  spec:
                    shell: Bash
                    command: |
                      bash plugins/drawio-diagramming/scripts/batch-export.sh . /tmp/exports svg
                      bash plugins/drawio-diagramming/scripts/batch-export.sh . /tmp/exports png

              - step:
                  type: Run
                  name: Quality Gate
                  spec:
                    shell: Bash
                    command: |
                      TOTAL_SCORE=0
                      COUNT=0
                      for f in $(find . -name "*.drawio"); do
                        SCORE=$(python3 plugins/drawio-diagramming/scripts/analyze-drawio.py "$f" --json | python3 -c "import sys,json; print(json.load(sys.stdin)['total_score'])")
                        TOTAL_SCORE=$((TOTAL_SCORE + ${SCORE%.*}))
                        COUNT=$((COUNT + 1))
                      done
                      AVG=$((TOTAL_SCORE / COUNT))
                      echo "Average quality score: $AVG/100"
                      if [ "$AVG" -lt 60 ]; then
                        echo "FAIL: Average score below threshold (60)"
                        exit 1
                      fi
```

## Batch Report Generation

After batch operations, generate a summary report.

```python
#!/usr/bin/env python3
"""batch-report.py - Generate summary report after batch operations."""

import json
import glob
import sys
import os
from datetime import datetime

def generate_report(directory, output_format='markdown'):
    """Generate a batch processing report."""
    files = glob.glob(os.path.join(directory, '**/*.drawio'), recursive=True)

    report = {
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'directory': directory,
        'total_files': len(files),
        'diagrams': [],
    }

    for filepath in sorted(files):
        try:
            # Import analyzer
            sys.path.insert(0, os.path.dirname(__file__))
            from analyze_drawio import DrawioAnalyzer
            analyzer = DrawioAnalyzer(filepath)
            result = analyzer.run()
            report['diagrams'].append(result)
        except Exception as e:
            report['diagrams'].append({
                'file': filepath,
                'error': str(e),
            })

    # Calculate aggregates
    scores = [d['total_score'] for d in report['diagrams'] if 'total_score' in d]
    report['average_score'] = sum(scores) / len(scores) if scores else 0
    report['min_score'] = min(scores) if scores else 0
    report['max_score'] = max(scores) if scores else 0

    if output_format == 'json':
        print(json.dumps(report, indent=2))
    else:
        print(f"# Batch Analysis Report")
        print(f"")
        print(f"Generated: {report['timestamp']}")
        print(f"Directory: {report['directory']}")
        print(f"Total diagrams: {report['total_files']}")
        print(f"")
        print(f"## Scores")
        print(f"")
        print(f"| Metric | Value |")
        print(f"|--------|-------|")
        print(f"| Average | {report['average_score']:.1f}/100 |")
        print(f"| Min | {report['min_score']:.1f}/100 |")
        print(f"| Max | {report['max_score']:.1f}/100 |")
        print(f"")
        print(f"## Per-Diagram Scores")
        print(f"")
        print(f"| File | Score | Grade |")
        print(f"|------|-------|-------|")
        for d in report['diagrams']:
            if 'error' in d:
                print(f"| {d['file']} | ERROR | - |")
            else:
                print(f"| {d['file']} | {d['total_score']:.1f} | {d['grade']} |")

if __name__ == '__main__':
    fmt = 'markdown'
    if '--json' in sys.argv:
        fmt = 'json'
        sys.argv.remove('--json')
    generate_report(sys.argv[1] if len(sys.argv) > 1 else '.', fmt)
```

## Directory Scanning Configuration

Control which files are included or excluded from batch processing:

```json
{
  "batch": {
    "include": ["**/*.drawio"],
    "exclude": [
      "**/node_modules/**",
      "**/archive/**",
      "**/.git/**",
      "**/temp/**"
    ],
    "maxFiles": 200,
    "parallel": 4,
    "continueOnError": true
  }
}
```

## Execution Flow

1. User invokes `drawio:batch` with an operation type and target directory
2. Scan the directory for `.drawio` files respecting include/exclude patterns
3. Validate that all source files are parseable XML
4. Execute the requested operation across all files (with parallelism if configured)
5. Collect results: successes, failures, and warnings for each file
6. Generate a summary report in markdown or JSON format
7. If running in CI, set exit code based on success/failure threshold
8. Output the report and any exported artifacts
