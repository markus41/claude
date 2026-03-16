---
description: "Data-driven conditional formatting, live data binding, and dynamic diagram updates for draw.io"
triggers:
  - conditional formatting
  - data binding
  - live data
  - dynamic diagram
  - status colors
  - data-driven
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
---

# Conditional Formatting and Data-Driven Diagrams

## Custom Properties with Object Tags

Wrap `mxCell` in an `<object>` tag to attach arbitrary key-value metadata to any diagram element:

```xml
<object label="Service A" id="2"
        service-id="svc-api-gateway"
        status="healthy"
        latency="45ms"
        uptime="99.97%"
        owner="platform-team"
        environment="production"
        region="us-east-1">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;"
          vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="120" height="60" as="geometry"/>
  </mxCell>
</object>
```

Key points:
- `label` replaces `value` as the display text
- `id` moves from `mxCell` to `<object>`
- Any attribute name is valid (use lowercase with hyphens)
- Properties are visible in draw.io's **Edit Data** dialog (Ctrl+M)
- Properties are searchable via **Edit > Find/Replace**

## Placeholder Variables

Display property values dynamically inside labels using `%property%` syntax. Enable with `placeholders=1` in the style:

```xml
<object label="%name%&lt;br&gt;Status: %status%&lt;br&gt;Latency: %latency%"
        id="3" placeholders="1"
        name="API Gateway"
        status="healthy"
        latency="42ms">
  <mxCell style="rounded=1;whiteSpace=wrap;html=1;placeholders=1;fillColor=#dae8fc;strokeColor=#6c8ebf;"
          vertex="1" parent="1">
    <mxGeometry x="100" y="100" width="160" height="80" as="geometry"/>
  </mxCell>
</object>
```

**Rendered label:**
```
API Gateway
Status: healthy
Latency: 42ms
```

### Built-in Placeholders

| Placeholder | Value |
|-------------|-------|
| `%label%` | Cell label |
| `%id%` | Cell ID |
| `%date%` | Current date |
| `%time%` | Current time |
| `%timestamp%` | ISO timestamp |
| `%page%` | Page number |
| `%pagenumber%` | Page number (alias) |
| `%pagecount%` | Total pages |
| `%filename%` | File name |

## File-Level Variables

Set global variables at the `<mxfile>` level, accessible by all cells:

```xml
<mxfile vars='{"env":"production","version":"2.1.0","region":"us-east-1","last_updated":"2026-03-14"}'>
  <diagram id="page1" name="Status Dashboard">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <object label="Environment: %env%&lt;br&gt;Version: %version%&lt;br&gt;Region: %region%"
                id="header" placeholders="1">
          <mxCell style="text;fontSize=14;fontStyle=1;placeholders=1;" vertex="1" parent="1">
            <mxGeometry x="20" y="20" width="300" height="60" as="geometry"/>
          </mxCell>
        </object>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

File-level variables are inherited by all cells that use `placeholders=1` and do not have a local property with the same name.

## Conditional Formatting Rules

### Status to Color Mapping

The most common pattern: map a property value to fill/stroke colors.

| Status | Fill Color | Stroke Color | Icon |
|--------|-----------|-------------|------|
| healthy / up / ok | `#D5E8D4` | `#82B366` | Green |
| warning / degraded | `#FFF2CC` | `#D6B656` | Yellow |
| critical / down / error | `#F8CECC` | `#B85450` | Red |
| maintenance / paused | `#E1D5E7` | `#9673A6` | Purple |
| unknown / pending | `#F5F5F5` | `#666666` | Gray |
| info / active | `#DAE8FC` | `#6C8EBF` | Blue |

### Threshold-Based Color Gradients

Map numeric values to colors using thresholds:

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Latency | < 100ms | 100-500ms | > 500ms |
| CPU | < 60% | 60-85% | > 85% |
| Error Rate | < 1% | 1-5% | > 5% |
| Uptime | > 99.9% | 99-99.9% | < 99% |
| Disk | < 70% | 70-90% | > 90% |

### Boolean Visibility

Show or hide elements based on boolean properties:

| Condition | Visible Style | Hidden Style |
|-----------|--------------|-------------|
| Feature enabled | `opacity=100;` | `opacity=20;dashed=1;` |
| Service active | Normal styles | `strokeColor=#CCCCCC;fillColor=#F5F5F5;fontColor=#999999;` |
| Deprecated | Normal + label | `dashed=1;dashPattern=8 4;fontStyle=2;` (italic) |

### Enumeration to Shape/Icon

Map state values to different visual representations:

| State | Visual |
|-------|--------|
| running | Green circle icon |
| stopped | Red square icon |
| starting | Yellow spinner icon |
| terminating | Orange triangle icon |

## Python Update Script

Full-featured script that reads a data source and updates diagram XML:

```python
#!/usr/bin/env python3
"""
update_diagram.py - Update draw.io diagram with live data.

Usage:
    python update_diagram.py --input arch.drawio --output arch-live.drawio --data-url https://api.example.com/health
    python update_diagram.py --input arch.drawio --output arch-live.drawio --data-file status.json
"""

import xml.etree.ElementTree as ET
import json
import argparse
import re
import sys
import urllib.request
import urllib.error
import base64
import zlib
from datetime import datetime, timezone


# Status-to-color mapping
STATUS_COLORS = {
    'healthy':     {'fill': '#D5E8D4', 'stroke': '#82B366'},
    'up':          {'fill': '#D5E8D4', 'stroke': '#82B366'},
    'ok':          {'fill': '#D5E8D4', 'stroke': '#82B366'},
    'warning':     {'fill': '#FFF2CC', 'stroke': '#D6B656'},
    'degraded':    {'fill': '#FFF2CC', 'stroke': '#D6B656'},
    'critical':    {'fill': '#F8CECC', 'stroke': '#B85450'},
    'down':        {'fill': '#F8CECC', 'stroke': '#B85450'},
    'error':       {'fill': '#F8CECC', 'stroke': '#B85450'},
    'maintenance': {'fill': '#E1D5E7', 'stroke': '#9673A6'},
    'unknown':     {'fill': '#F5F5F5', 'stroke': '#666666'},
}


def update_style_property(style: str, key: str, value: str) -> str:
    """Update a single property in a draw.io style string."""
    pattern = re.compile(rf'{re.escape(key)}=[^;]*')
    if pattern.search(style):
        style = pattern.sub(f'{key}={value}', style)
    else:
        if not style.endswith(';'):
            style += ';'
        style += f'{key}={value};'
    return style


def get_threshold_color(value: float, thresholds: list) -> dict:
    """
    Determine color based on value thresholds.
    thresholds: list of (max_value, colors_dict) sorted ascending.
    Example: [(100, green), (500, yellow), (float('inf'), red)]
    """
    for threshold, colors in thresholds:
        if value <= threshold:
            return colors
    return thresholds[-1][1]  # fallback to last


def decompress_diagram(compressed: str) -> str:
    """Decompress a draw.io compressed diagram XML string."""
    decoded = base64.b64decode(compressed)
    decompressed = zlib.decompress(decoded, -15)
    return urllib.parse.unquote(decompressed.decode('utf-8'))


def compress_diagram(xml_str: str) -> str:
    """Compress diagram XML back to draw.io compressed format."""
    encoded = urllib.parse.quote(xml_str, safe='')
    compressed = zlib.compress(encoded.encode('utf-8'), 9)
    # Strip zlib header (first 2 bytes) and checksum (last 4 bytes)
    raw = compressed[2:-4]
    return base64.b64encode(raw).decode('utf-8')


def update_diagram(input_path: str, output_path: str, data: dict,
                   compress: bool = False):
    """Update diagram cells based on service data."""
    tree = ET.parse(input_path)
    root = tree.getroot()

    # Handle both mxfile wrapper and bare mxGraphModel
    if root.tag == 'mxfile':
        for diagram_elem in root.findall('diagram'):
            # Check if diagram content is compressed
            text = diagram_elem.text
            if text and text.strip():
                # Compressed format
                xml_str = decompress_diagram(text.strip())
                model = ET.fromstring(xml_str)
                process_model(model, data)
                if compress:
                    diagram_elem.text = compress_diagram(
                        ET.tostring(model, encoding='unicode'))
                else:
                    diagram_elem.text = None
                    diagram_elem.append(model)
            else:
                # Uncompressed format
                model = diagram_elem.find('mxGraphModel')
                if model is not None:
                    process_model(model, data)
    elif root.tag == 'mxGraphModel':
        process_model(root, data)

    tree.write(output_path, encoding='UTF-8', xml_declaration=True)
    print(f'Updated diagram written to {output_path}')


def process_model(model: ET.Element, data: dict):
    """Process all object elements in an mxGraphModel."""
    updated = 0
    root_elem = model.find('root')
    if root_elem is None:
        return

    for obj in root_elem.iter('object'):
        service_id = obj.get('service-id')
        if not service_id or service_id not in data:
            continue

        service_data = data[service_id]
        cell = obj.find('mxCell')
        if cell is None:
            continue

        style = cell.get('style', '')

        # Update status color
        status = service_data.get('status', 'unknown').lower()
        colors = STATUS_COLORS.get(status, STATUS_COLORS['unknown'])
        style = update_style_property(style, 'fillColor', colors['fill'])
        style = update_style_property(style, 'strokeColor', colors['stroke'])

        # Update latency threshold coloring (for edge labels etc.)
        latency = service_data.get('latency_ms')
        if latency is not None:
            latency_colors = get_threshold_color(latency, [
                (100, {'fill': '#D5E8D4', 'stroke': '#82B366'}),
                (500, {'fill': '#FFF2CC', 'stroke': '#D6B656'}),
                (float('inf'), {'fill': '#F8CECC', 'stroke': '#B85450'}),
            ])
            style = update_style_property(style, 'fillColor',
                                          latency_colors['fill'])
            style = update_style_property(style, 'strokeColor',
                                          latency_colors['stroke'])

        cell.set('style', style)

        # Update object properties (for placeholder display)
        for key, value in service_data.items():
            obj.set(key, str(value))

        updated += 1

    # Update file-level timestamp
    now = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    for obj in root_elem.iter('object'):
        if obj.get('id') == 'header' or obj.get('type') == 'header':
            obj.set('last_updated', now)

    print(f'Updated {updated} service(s)')


def fetch_data(source: str) -> dict:
    """Fetch service data from URL or file."""
    if source.startswith('http://') or source.startswith('https://'):
        req = urllib.request.Request(source)
        req.add_header('Accept', 'application/json')
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.URLError as e:
            print(f'Error fetching data: {e}', file=sys.stderr)
            sys.exit(1)
    else:
        with open(source) as f:
            return json.load(f)


def main():
    parser = argparse.ArgumentParser(
        description='Update draw.io diagram with live service data')
    parser.add_argument('--input', '-i', required=True,
                        help='Input .drawio file')
    parser.add_argument('--output', '-o', required=True,
                        help='Output .drawio file')
    parser.add_argument('--data-url',
                        help='URL to fetch JSON service data')
    parser.add_argument('--data-file',
                        help='Path to JSON service data file')
    parser.add_argument('--compress', action='store_true',
                        help='Compress output diagram XML')
    args = parser.parse_args()

    if not args.data_url and not args.data_file:
        parser.error('Either --data-url or --data-file is required')

    source = args.data_url or args.data_file
    data = fetch_data(source)

    # Data format: {"service-id": {"status": "healthy", "latency_ms": 45, ...}}
    update_diagram(args.input, args.output, data, compress=args.compress)


if __name__ == '__main__':
    main()
```

### Expected Data Format

The script expects JSON in this format:

```json
{
  "svc-api-gateway": {
    "status": "healthy",
    "latency_ms": 42,
    "uptime": "99.97%",
    "requests_per_sec": 1250
  },
  "svc-auth-service": {
    "status": "warning",
    "latency_ms": 320,
    "uptime": "99.85%",
    "requests_per_sec": 450
  },
  "svc-database": {
    "status": "critical",
    "latency_ms": 1200,
    "uptime": "98.50%",
    "connections": 95
  }
}
```

## Bash Script for CI/CD Integration

```bash
#!/usr/bin/env bash
# update-diagram-status.sh - Update draw.io diagram from health API
#
# Usage: ./update-diagram-status.sh <input.drawio> <output.drawio> <health-api-url>

set -euo pipefail

INPUT="${1:?Usage: $0 <input.drawio> <output.drawio> <health-api-url>}"
OUTPUT="${2:?Missing output path}"
API_URL="${3:?Missing health API URL}"

echo "Fetching service status from ${API_URL}..."
DATA=$(curl -sf --max-time 30 "${API_URL}")

if [ -z "$DATA" ]; then
    echo "ERROR: Empty response from health API" >&2
    exit 1
fi

# Write data to temp file
TMPDATA=$(mktemp)
echo "$DATA" > "$TMPDATA"

echo "Updating diagram..."
python3 "$(dirname "$0")/update_diagram.py" \
    --input "$INPUT" \
    --output "$OUTPUT" \
    --data-file "$TMPDATA"

rm -f "$TMPDATA"

echo "Diagram updated: ${OUTPUT}"

# Export to SVG for web display
if command -v drawio &>/dev/null || command -v xvfb-run &>/dev/null; then
    SVG_OUTPUT="${OUTPUT%.drawio}.drawio.svg"
    xvfb-run -a drawio --export --format svg --embed-diagram \
        --output "$SVG_OUTPUT" "$OUTPUT" 2>/dev/null || true
    echo "SVG exported: ${SVG_OUTPUT}"
fi
```

## Cron Job Setup

### Linux Cron

```bash
# Update diagram every 5 minutes
*/5 * * * * /path/to/update-diagram-status.sh /path/to/arch.drawio /path/to/arch-live.drawio https://api.example.com/health >> /var/log/diagram-update.log 2>&1
```

### GitHub Actions Scheduled Workflow

```yaml
name: Update Status Diagram

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Update diagram from API
        env:
          HEALTH_API_URL: ${{ secrets.HEALTH_API_URL }}
        run: |
          python3 scripts/update_diagram.py \
            --input docs/architecture.drawio \
            --output docs/architecture.drawio \
            --data-url "$HEALTH_API_URL"

      - name: Export to SVG
        run: |
          sudo apt-get install -y xvfb
          wget -q https://github.com/jgraph/drawio-desktop/releases/download/v24.7.17/drawio-amd64-24.7.17.deb
          sudo dpkg -i drawio-amd64-24.7.17.deb || sudo apt-get install -f -y
          xvfb-run -a drawio --export --format svg --embed-diagram \
            --output docs/architecture.drawio.svg docs/architecture.drawio

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/architecture.drawio docs/architecture.drawio.svg
          git diff --cached --quiet || git commit -m "chore: update status diagram"
          git push
```

## Webhook Handler for Real-Time Updates

Flask-based webhook handler that updates diagrams on service status changes:

```python
#!/usr/bin/env python3
"""
webhook_handler.py - Receive status webhooks and update diagram in real-time.

Listens for POST requests with service status updates and regenerates
the diagram SVG.

Usage:
    python webhook_handler.py --diagram docs/architecture.drawio --port 8080
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
import threading
import argparse

# In-memory status store
service_status = {}
diagram_path = ''
lock = threading.Lock()


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Invalid JSON')
            return

        # Expected: {"service_id": "svc-api", "status": "healthy", ...}
        service_id = payload.get('service_id')
        if not service_id:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'Missing service_id')
            return

        with lock:
            service_status[service_id] = payload

        # Trigger async diagram update
        threading.Thread(target=update_diagram_async).start()

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')

    def log_message(self, format, *args):
        print(f'[webhook] {args[0]}')


def update_diagram_async():
    """Write status to temp file and run update script."""
    with lock:
        data = dict(service_status)

    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json',
                                      delete=False) as f:
        json.dump(data, f)
        tmp_path = f.name

    try:
        subprocess.run([
            'python3', 'update_diagram.py',
            '--input', diagram_path,
            '--output', diagram_path,
            '--data-file', tmp_path,
        ], check=True, timeout=30)
        print('[update] Diagram updated successfully')
    except subprocess.CalledProcessError as e:
        print(f'[update] Failed: {e}')
    finally:
        import os
        os.unlink(tmp_path)


def main():
    global diagram_path
    parser = argparse.ArgumentParser()
    parser.add_argument('--diagram', required=True)
    parser.add_argument('--port', type=int, default=8080)
    args = parser.parse_args()
    diagram_path = args.diagram

    server = HTTPServer(('0.0.0.0', args.port), WebhookHandler)
    print(f'Webhook listener on port {args.port}')
    server.serve_forever()


if __name__ == '__main__':
    main()
```

Send status updates via curl:

```bash
curl -X POST http://localhost:8080/ \
  -H "Content-Type: application/json" \
  -d '{"service_id": "svc-api-gateway", "status": "warning", "latency_ms": 350}'
```

## Dashboard-Style Status Diagrams

### Layout Pattern

Create a grid of service status cards:

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Title -->
    <mxCell id="title" value="Service Status Dashboard" style="text;fontSize=20;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="50" y="10" width="500" height="30" as="geometry"/>
    </mxCell>
    <!-- Timestamp -->
    <object label="Last updated: %last_updated%" id="ts" placeholders="1" last_updated="2026-03-14T12:00:00Z">
      <mxCell style="text;fontSize=10;fontColor=#999999;align=center;placeholders=1;" vertex="1" parent="1">
        <mxGeometry x="50" y="40" width="500" height="20" as="geometry"/>
      </mxCell>
    </object>
    <!-- Service Cards Row 1 -->
    <object label="&lt;b&gt;%name%&lt;/b&gt;&lt;br&gt;%status%&lt;br&gt;%latency%" id="svc1" placeholders="1"
            service-id="svc-api-gateway" name="API Gateway" status="healthy" latency="42ms">
      <mxCell style="rounded=1;whiteSpace=wrap;html=1;placeholders=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=11;" vertex="1" parent="1">
        <mxGeometry x="50" y="80" width="150" height="80" as="geometry"/>
      </mxCell>
    </object>
    <object label="&lt;b&gt;%name%&lt;/b&gt;&lt;br&gt;%status%&lt;br&gt;%latency%" id="svc2" placeholders="1"
            service-id="svc-auth" name="Auth Service" status="warning" latency="320ms">
      <mxCell style="rounded=1;whiteSpace=wrap;html=1;placeholders=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=11;" vertex="1" parent="1">
        <mxGeometry x="220" y="80" width="150" height="80" as="geometry"/>
      </mxCell>
    </object>
    <object label="&lt;b&gt;%name%&lt;/b&gt;&lt;br&gt;%status%&lt;br&gt;%latency%" id="svc3" placeholders="1"
            service-id="svc-database" name="Database" status="critical" latency="1200ms">
      <mxCell style="rounded=1;whiteSpace=wrap;html=1;placeholders=1;fillColor=#F8CECC;strokeColor=#B85450;fontSize=11;" vertex="1" parent="1">
        <mxGeometry x="390" y="80" width="150" height="80" as="geometry"/>
      </mxCell>
    </object>
  </root>
</mxGraphModel>
```

### Heat Map Visualization

Map numeric values to a color gradient for heat map effects:

```python
def value_to_heatmap_color(value: float, min_val: float, max_val: float) -> str:
    """
    Map a value to a green-yellow-red gradient.
    Low values = green, mid = yellow, high = red.
    """
    if max_val == min_val:
        return '#D5E8D4'

    ratio = (value - min_val) / (max_val - min_val)
    ratio = max(0.0, min(1.0, ratio))

    if ratio < 0.5:
        # Green to Yellow
        r = int(213 + (255 - 213) * (ratio * 2))
        g = int(232 + (242 - 232) * (ratio * 2))
        b = int(212 + (204 - 212) * (ratio * 2))
    else:
        # Yellow to Red
        t = (ratio - 0.5) * 2
        r = int(255 - (255 - 248) * t)
        g = int(242 - (242 - 206) * t)
        b = int(204 - (204 - 204) * t)

    return f'#{r:02X}{g:02X}{b:02X}'
```

Apply to cells for CPU usage, latency, error rates, or any numeric metric to create visual heat maps across your architecture diagram.

## Diagram Templates for Monitoring

### Architecture Status Template

Structure your diagram with these zones:
1. **Header**: Title, environment, last-updated timestamp
2. **External**: Users, CDN, DNS (gray zone)
3. **Edge**: Load balancers, API gateways (blue zone)
4. **Application**: Services, workers, queues (green/yellow/red per status)
5. **Data**: Databases, caches, storage (separate zone)
6. **Legend**: Color key for status meanings

### Recommended Metadata Properties

Standardize across all service objects:

| Property | Type | Example |
|----------|------|---------|
| `service-id` | string | `svc-api-gateway` |
| `name` | string | `API Gateway` |
| `status` | enum | `healthy`, `warning`, `critical` |
| `latency` | string | `42ms` |
| `uptime` | string | `99.97%` |
| `version` | string | `2.1.0` |
| `owner` | string | `platform-team` |
| `environment` | string | `production` |
| `region` | string | `us-east-1` |
| `last-check` | string | ISO timestamp |
