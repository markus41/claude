---
name: drawio:analyze
intent: Analyze existing diagrams for quality, completeness, and suggest improvements
tags:
  - drawio-diagramming
  - command
  - analyze
inputs: []
risk: low
cost: medium
description: Perform comprehensive analysis of draw.io diagrams including quality scoring, layout consistency checks, color and accessibility audits, connection completeness verification, complexity metrics, standard compliance checking, and actionable improvement suggestions. Supports diagram comparison and diff between versions.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:analyze

Analyze existing draw.io diagrams for quality, completeness, standard compliance,
and generate actionable improvement suggestions.

## Overview

This command parses `.drawio` XML files and evaluates them across multiple quality
dimensions. It produces a numeric score (0-100), categorized findings, and specific
recommendations for improvement. It can also compare two diagram versions and
report structural and visual differences.

## Quality Scoring System

The overall quality score is a weighted composite of six categories:

| Category | Weight | What It Measures |
|----------|--------|-----------------|
| Layout Consistency | 20% | Alignment, spacing, grid adherence |
| Color Consistency | 15% | Theme adherence, palette usage, contrast |
| Label Quality | 20% | Descriptive names, orphan labels, text clarity |
| Connection Completeness | 20% | Dangling edges, proper routing, bidirectional |
| Layer Organization | 10% | Logical grouping, layer naming, separation |
| Accessibility | 15% | Color-blind safety, contrast ratios, text size |

### Scoring Formula

```
total = (layout * 0.20) + (color * 0.15) + (labels * 0.20)
      + (connections * 0.20) + (layers * 0.10) + (accessibility * 0.15)
```

### Score Interpretation

| Range | Grade | Meaning |
|-------|-------|---------|
| 90-100 | A | Excellent - production ready |
| 80-89 | B | Good - minor polish needed |
| 70-79 | C | Acceptable - several improvements recommended |
| 60-69 | D | Below average - significant issues |
| 0-59 | F | Poor - major rework needed |

## Analysis Script

```python
#!/usr/bin/env python3
"""analyze-drawio.py - Comprehensive draw.io diagram analyzer."""

import xml.etree.ElementTree as ET
import json
import re
import sys
import math
from collections import Counter, defaultdict

class DrawioAnalyzer:
    """Analyze a draw.io XML file for quality metrics."""

    def __init__(self, filepath):
        self.filepath = filepath
        self.tree = ET.parse(filepath)
        self.root = self.tree.getroot()
        self.cells = []
        self.edges = []
        self.vertices = []
        self.findings = []
        self.scores = {}
        self._parse()

    def _parse(self):
        """Parse all mxCell elements into vertices and edges."""
        for cell in self.root.iter('mxCell'):
            cell_id = cell.get('id', '')
            if cell_id in ('0', '1'):
                continue
            self.cells.append(cell)
            if cell.get('edge') == '1':
                self.edges.append(cell)
            elif cell.get('vertex') == '1':
                self.vertices.append(cell)

    def _get_style_dict(self, cell):
        """Parse style string into a dictionary."""
        style_str = cell.get('style', '')
        result = {}
        for part in style_str.split(';'):
            if '=' in part:
                key, val = part.split('=', 1)
                result[key.strip()] = val.strip()
            elif part.strip():
                result[part.strip()] = True
        return result

    def _get_geometry(self, cell):
        """Extract geometry from a cell."""
        geom = cell.find('mxGeometry')
        if geom is None:
            return None
        return {
            'x': float(geom.get('x', 0)),
            'y': float(geom.get('y', 0)),
            'width': float(geom.get('width', 0)),
            'height': float(geom.get('height', 0)),
        }

    # ----------------------------------------------------------------
    # Category 1: Layout Consistency
    # ----------------------------------------------------------------

    def analyze_layout(self):
        """Check alignment, spacing, and grid adherence."""
        score = 100
        geometries = []

        for v in self.vertices:
            geom = self._get_geometry(v)
            if geom and geom['width'] > 0:
                geometries.append(geom)

        if len(geometries) < 2:
            self.scores['layout'] = score
            return score

        # Check grid alignment (default grid = 10)
        grid_size = 10
        off_grid = 0
        for g in geometries:
            if g['x'] % grid_size != 0 or g['y'] % grid_size != 0:
                off_grid += 1

        off_grid_pct = off_grid / len(geometries) * 100
        if off_grid_pct > 50:
            score -= 20
            self.findings.append({
                'category': 'layout',
                'severity': 'warning',
                'message': f'{off_grid_pct:.0f}% of elements are off-grid (grid={grid_size})',
                'suggestion': 'Enable snap-to-grid and realign elements'
            })
        elif off_grid_pct > 20:
            score -= 10
            self.findings.append({
                'category': 'layout',
                'severity': 'info',
                'message': f'{off_grid_pct:.0f}% of elements are off-grid',
                'suggestion': 'Consider aligning elements to grid for consistency'
            })

        # Check for overlapping elements
        overlaps = 0
        for i, g1 in enumerate(geometries):
            for g2 in geometries[i+1:]:
                if (g1['x'] < g2['x'] + g2['width'] and
                    g1['x'] + g1['width'] > g2['x'] and
                    g1['y'] < g2['y'] + g2['height'] and
                    g1['y'] + g1['height'] > g2['y']):
                    overlaps += 1

        if overlaps > 0:
            score -= min(30, overlaps * 5)
            self.findings.append({
                'category': 'layout',
                'severity': 'error',
                'message': f'{overlaps} overlapping element pair(s) detected',
                'suggestion': 'Separate overlapping elements for clarity'
            })

        # Check spacing consistency
        x_positions = sorted(set(g['x'] for g in geometries))
        y_positions = sorted(set(g['y'] for g in geometries))

        if len(x_positions) > 2:
            x_gaps = [x_positions[i+1] - x_positions[i]
                      for i in range(len(x_positions)-1)]
            x_gap_variance = self._variance(x_gaps)
            if x_gap_variance > 2000:
                score -= 10
                self.findings.append({
                    'category': 'layout',
                    'severity': 'info',
                    'message': 'Horizontal spacing is inconsistent',
                    'suggestion': 'Use uniform horizontal spacing between columns'
                })

        if len(y_positions) > 2:
            y_gaps = [y_positions[i+1] - y_positions[i]
                      for i in range(len(y_positions)-1)]
            y_gap_variance = self._variance(y_gaps)
            if y_gap_variance > 2000:
                score -= 10
                self.findings.append({
                    'category': 'layout',
                    'severity': 'info',
                    'message': 'Vertical spacing is inconsistent',
                    'suggestion': 'Use uniform vertical spacing between rows'
                })

        # Check for consistent element sizes
        widths = [g['width'] for g in geometries if g['width'] > 0]
        heights = [g['height'] for g in geometries if g['height'] > 0]

        if len(set(widths)) > len(widths) * 0.7 and len(widths) > 4:
            score -= 5
            self.findings.append({
                'category': 'layout',
                'severity': 'info',
                'message': 'Element widths vary significantly',
                'suggestion': 'Standardize element sizes for visual consistency'
            })

        self.scores['layout'] = max(0, score)
        return self.scores['layout']

    # ----------------------------------------------------------------
    # Category 2: Color Consistency
    # ----------------------------------------------------------------

    def analyze_colors(self):
        """Check color theme adherence, palette usage, contrast."""
        score = 100
        fill_colors = []
        stroke_colors = []
        font_colors = []

        for cell in self.cells:
            style = self._get_style_dict(cell)
            if 'fillColor' in style and style['fillColor'] != 'none':
                fill_colors.append(style['fillColor'].lower())
            if 'strokeColor' in style and style['strokeColor'] != 'none':
                stroke_colors.append(style['strokeColor'].lower())
            if 'fontColor' in style:
                font_colors.append(style['fontColor'].lower())

        # Check palette size (too many distinct colors = noisy)
        unique_fills = set(fill_colors)
        if len(unique_fills) > 8:
            score -= 15
            self.findings.append({
                'category': 'color',
                'severity': 'warning',
                'message': f'{len(unique_fills)} distinct fill colors used (recommended: 5-8)',
                'suggestion': 'Reduce color palette to improve visual coherence'
            })
        elif len(unique_fills) > 12:
            score -= 25
            self.findings.append({
                'category': 'color',
                'severity': 'error',
                'message': f'{len(unique_fills)} fill colors is excessive',
                'suggestion': 'Define a color theme with max 6-8 semantic colors'
            })

        # Check for default gray (#f5f5f5) overuse
        default_count = fill_colors.count('#f5f5f5') + fill_colors.count('#ffffff')
        if len(fill_colors) > 0 and default_count / len(fill_colors) > 0.6:
            score -= 10
            self.findings.append({
                'category': 'color',
                'severity': 'info',
                'message': 'Most elements use default/white fill color',
                'suggestion': 'Apply semantic colors to distinguish element types'
            })

        # Check contrast between fill and font colors
        for cell in self.cells:
            style = self._get_style_dict(cell)
            fill = style.get('fillColor', '#ffffff')
            font = style.get('fontColor', '#000000')
            if fill != 'none' and font:
                ratio = self._contrast_ratio(fill, font)
                if ratio < 3.0:
                    value = cell.get('value', '')
                    if value and len(value.strip()) > 0:
                        score -= 3
                        self.findings.append({
                            'category': 'color',
                            'severity': 'warning',
                            'message': f'Low contrast ({ratio:.1f}:1) on element: {value[:30]}',
                            'suggestion': f'Increase contrast between fill ({fill}) and font ({font})'
                        })

        self.scores['color'] = max(0, score)
        return self.scores['color']

    # ----------------------------------------------------------------
    # Category 3: Label Quality
    # ----------------------------------------------------------------

    def analyze_labels(self):
        """Check label descriptiveness and orphan labels."""
        score = 100

        unlabeled_vertices = 0
        short_labels = 0
        generic_labels = {'box', 'node', 'item', 'thing', 'element', 'object',
                          'untitled', 'new', 'test', 'todo', 'xxx', 'placeholder'}

        for v in self.vertices:
            value = (v.get('value') or '').strip()
            # Remove HTML tags for analysis
            clean = re.sub(r'<[^>]+>', '', value).strip()
            clean = clean.replace('&#xa;', ' ').replace('\n', ' ').strip()

            if not clean:
                unlabeled_vertices += 1
            elif len(clean) < 3:
                short_labels += 1
            elif clean.lower() in generic_labels:
                short_labels += 1
                self.findings.append({
                    'category': 'labels',
                    'severity': 'info',
                    'message': f'Generic label detected: "{clean}"',
                    'suggestion': 'Use a descriptive name that conveys purpose'
                })

        total = len(self.vertices)
        if total > 0:
            unlabeled_pct = unlabeled_vertices / total * 100
            if unlabeled_pct > 30:
                score -= 25
                self.findings.append({
                    'category': 'labels',
                    'severity': 'error',
                    'message': f'{unlabeled_vertices}/{total} vertices have no label ({unlabeled_pct:.0f}%)',
                    'suggestion': 'Add descriptive labels to all meaningful elements'
                })
            elif unlabeled_pct > 10:
                score -= 15
                self.findings.append({
                    'category': 'labels',
                    'severity': 'warning',
                    'message': f'{unlabeled_vertices}/{total} vertices unlabeled',
                    'suggestion': 'Label elements for better readability'
                })

            if short_labels > 0:
                score -= min(15, short_labels * 3)
                self.findings.append({
                    'category': 'labels',
                    'severity': 'info',
                    'message': f'{short_labels} elements have very short or generic labels',
                    'suggestion': 'Use meaningful multi-word labels'
                })

        # Check edge labels (connections without context)
        unlabeled_edges = sum(1 for e in self.edges if not (e.get('value') or '').strip())
        if len(self.edges) > 3 and unlabeled_edges == len(self.edges):
            score -= 10
            self.findings.append({
                'category': 'labels',
                'severity': 'info',
                'message': 'No edges have labels',
                'suggestion': 'Add labels to key connections describing the relationship'
            })

        self.scores['labels'] = max(0, score)
        return self.scores['labels']

    # ----------------------------------------------------------------
    # Category 4: Connection Completeness
    # ----------------------------------------------------------------

    def analyze_connections(self):
        """Check for dangling edges, unconnected nodes, proper routing."""
        score = 100

        # Build adjacency
        connected_ids = set()
        dangling_edges = 0

        for edge in self.edges:
            src = edge.get('source')
            tgt = edge.get('target')

            if not src or not tgt:
                dangling_edges += 1
            else:
                connected_ids.add(src)
                connected_ids.add(tgt)

        if dangling_edges > 0:
            score -= min(30, dangling_edges * 10)
            self.findings.append({
                'category': 'connections',
                'severity': 'error',
                'message': f'{dangling_edges} dangling edge(s) (missing source or target)',
                'suggestion': 'Connect all edges to source and target elements'
            })

        # Find unconnected vertices (islands)
        vertex_ids = set(v.get('id') for v in self.vertices)
        # Exclude container children (parent != "1")
        top_level_ids = set(
            v.get('id') for v in self.vertices
            if v.get('parent') == '1'
        )
        unconnected = top_level_ids - connected_ids
        # Filter out labels and decorative elements
        unconnected_meaningful = []
        for uid in unconnected:
            cell = next((v for v in self.vertices if v.get('id') == uid), None)
            if cell is not None:
                style = self._get_style_dict(cell)
                # Skip pure text/label elements
                if 'text' not in style and style.get('shape') != 'text':
                    unconnected_meaningful.append(uid)

        if len(unconnected_meaningful) > 0 and len(top_level_ids) > 2:
            score -= min(20, len(unconnected_meaningful) * 5)
            self.findings.append({
                'category': 'connections',
                'severity': 'warning',
                'message': f'{len(unconnected_meaningful)} element(s) have no connections',
                'suggestion': 'Connect isolated elements or remove if decorative'
            })

        # Check edge routing consistency
        edge_styles = Counter()
        for edge in self.edges:
            style = self._get_style_dict(edge)
            routing = style.get('edgeStyle', 'default')
            edge_styles[routing] += 1

        if len(edge_styles) > 2 and len(self.edges) > 4:
            score -= 10
            self.findings.append({
                'category': 'connections',
                'severity': 'info',
                'message': f'{len(edge_styles)} different edge routing styles used',
                'suggestion': 'Standardize edge routing (orthogonal or curved, not mixed)'
            })

        self.scores['connections'] = max(0, score)
        return self.scores['connections']

    # ----------------------------------------------------------------
    # Category 5: Layer Organization
    # ----------------------------------------------------------------

    def analyze_layers(self):
        """Check layer usage, naming, and logical grouping."""
        score = 100

        diagrams = list(self.root.iter('diagram'))

        if len(diagrams) == 0:
            score -= 20
            self.findings.append({
                'category': 'layers',
                'severity': 'warning',
                'message': 'No diagram element found',
                'suggestion': 'Ensure the file has a valid draw.io structure'
            })
            self.scores['layers'] = max(0, score)
            return self.scores['layers']

        # Check page naming
        for diag in diagrams:
            name = diag.get('name', '')
            if not name or name.startswith('Page-') or name == 'Page-1':
                score -= 5
                self.findings.append({
                    'category': 'layers',
                    'severity': 'info',
                    'message': f'Diagram page has default name: "{name or "(empty)"}"',
                    'suggestion': 'Give pages descriptive names (e.g., "System Context")'
                })

        # Check element count per page (too many = cluttered)
        for diag in diagrams:
            cells_in_page = list(diag.iter('mxCell'))
            # Subtract the 2 structural cells (id=0, id=1)
            content_cells = len(cells_in_page) - 2
            if content_cells > 80:
                score -= 15
                self.findings.append({
                    'category': 'layers',
                    'severity': 'warning',
                    'message': f'Page "{diag.get("name", "")}" has {content_cells} elements (high density)',
                    'suggestion': 'Split into multiple pages or use containers to group elements'
                })
            elif content_cells > 50:
                score -= 5
                self.findings.append({
                    'category': 'layers',
                    'severity': 'info',
                    'message': f'Page "{diag.get("name", "")}" has {content_cells} elements',
                    'suggestion': 'Consider grouping related elements into containers'
                })

        # Check for container/group usage
        containers = [v for v in self.vertices
                      if self._get_style_dict(v).get('container') == '1'
                      or 'swimlane' in self._get_style_dict(v)]
        if len(self.vertices) > 15 and len(containers) == 0:
            score -= 10
            self.findings.append({
                'category': 'layers',
                'severity': 'info',
                'message': 'No containers or groups used despite many elements',
                'suggestion': 'Group related elements into containers for organization'
            })

        self.scores['layers'] = max(0, score)
        return self.scores['layers']

    # ----------------------------------------------------------------
    # Category 6: Accessibility
    # ----------------------------------------------------------------

    def analyze_accessibility(self):
        """Check color-blind friendliness, contrast, text sizes."""
        score = 100

        # Check font sizes
        small_text = 0
        for cell in self.cells:
            style = self._get_style_dict(cell)
            font_size = int(style.get('fontSize', 12))
            if font_size < 10 and (cell.get('value') or '').strip():
                small_text += 1

        if small_text > 0:
            score -= min(15, small_text * 3)
            self.findings.append({
                'category': 'accessibility',
                'severity': 'warning',
                'message': f'{small_text} element(s) have font size below 10px',
                'suggestion': 'Use minimum 10px font for readability; 12px preferred'
            })

        # Check color-blind problematic combinations
        # Red-green is the most common issue
        problematic_pairs = [
            ('#ff0000', '#00ff00'), ('#ff0000', '#008000'),
            ('#cc0000', '#00cc00'), ('#e60000', '#00e600'),
        ]

        fill_colors_in_use = set()
        for cell in self.cells:
            style = self._get_style_dict(cell)
            fc = style.get('fillColor', '').lower()
            if fc and fc != 'none':
                fill_colors_in_use.add(fc)

        for c1, c2 in problematic_pairs:
            if c1 in fill_colors_in_use and c2 in fill_colors_in_use:
                score -= 15
                self.findings.append({
                    'category': 'accessibility',
                    'severity': 'warning',
                    'message': f'Red-green color pair detected ({c1}, {c2})',
                    'suggestion': 'Use blue/orange or add patterns/icons for distinction'
                })
                break

        # Check if diagram relies solely on color for meaning
        # (no shapes or icons to distinguish element types)
        shape_types = set()
        for v in self.vertices:
            style = self._get_style_dict(v)
            shape = style.get('shape', 'rectangle')
            shape_types.add(shape)

        if len(shape_types) <= 1 and len(fill_colors_in_use) > 3:
            score -= 10
            self.findings.append({
                'category': 'accessibility',
                'severity': 'info',
                'message': 'Diagram uses only color to differentiate elements (one shape type)',
                'suggestion': 'Use different shapes or icons alongside color for accessibility'
            })

        self.scores['accessibility'] = max(0, score)
        return self.scores['accessibility']

    # ----------------------------------------------------------------
    # Complexity Metrics
    # ----------------------------------------------------------------

    def compute_complexity(self):
        """Calculate complexity metrics."""
        diagrams = list(self.root.iter('diagram'))
        containers = [v for v in self.vertices
                      if self._get_style_dict(v).get('container') == '1']

        # Calculate nesting depth
        max_depth = 0
        for v in self.vertices:
            depth = 0
            parent_id = v.get('parent', '1')
            visited = set()
            while parent_id != '1' and parent_id not in visited:
                visited.add(parent_id)
                depth += 1
                parent_cell = next(
                    (c for c in self.cells if c.get('id') == parent_id), None)
                if parent_cell is None:
                    break
                parent_id = parent_cell.get('parent', '1')
            max_depth = max(max_depth, depth)

        return {
            'node_count': len(self.vertices),
            'edge_count': len(self.edges),
            'page_count': len(diagrams),
            'container_count': len(containers),
            'max_nesting_depth': max_depth,
            'density': (len(self.edges) / max(1, len(self.vertices))),
            'total_elements': len(self.cells),
        }

    # ----------------------------------------------------------------
    # Standard Compliance
    # ----------------------------------------------------------------

    def check_compliance(self, standard='auto'):
        """Check notation compliance for UML, BPMN, C4."""
        findings = []

        # Auto-detect standard from shapes used
        all_styles = ' '.join(c.get('style', '') for c in self.cells)

        if 'bpmn' in all_styles.lower() or standard == 'bpmn':
            findings.extend(self._check_bpmn_compliance())
        elif 'c4' in all_styles.lower() or standard == 'c4':
            findings.extend(self._check_c4_compliance())
        elif 'swimlane' in all_styles.lower() and standard != 'skip':
            findings.extend(self._check_uml_compliance())

        self.findings.extend(findings)
        return findings

    def _check_bpmn_compliance(self):
        """Validate BPMN notation rules."""
        findings = []

        # Check for start event
        has_start = any('outline=standard' in (c.get('style', '') or '')
                        and 'Perimeter.ellipse' in (c.get('style', '') or '')
                        for c in self.cells)
        has_end = any('outline=end' in (c.get('style', '') or '')
                      for c in self.cells)

        if not has_start:
            findings.append({
                'category': 'compliance',
                'severity': 'error',
                'message': 'BPMN: No start event found',
                'suggestion': 'Add a start event (thin circle) to begin the process'
            })

        if not has_end:
            findings.append({
                'category': 'compliance',
                'severity': 'error',
                'message': 'BPMN: No end event found',
                'suggestion': 'Add an end event (thick circle) to terminate the process'
            })

        return findings

    def _check_c4_compliance(self):
        """Validate C4 notation rules."""
        findings = []

        # C4 elements should have technology description
        for v in self.vertices:
            value = v.get('value', '')
            style = self._get_style_dict(v)
            if 'c4' in style.get('shape', ''):
                if '[' not in value:
                    findings.append({
                        'category': 'compliance',
                        'severity': 'warning',
                        'message': f'C4 element missing type annotation: {value[:30]}',
                        'suggestion': 'Add [Container], [Component], or [Person] annotation'
                    })

        return findings

    def _check_uml_compliance(self):
        """Validate UML notation rules."""
        findings = []

        # Check class diagrams have attribute/method sections
        swimlanes = [v for v in self.vertices
                     if 'swimlane' in self._get_style_dict(v)]
        for sl in swimlanes:
            children = [v for v in self.vertices if v.get('parent') == sl.get('id')]
            has_separator = any('line' in self._get_style_dict(c) for c in children)
            if not has_separator and len(children) > 0:
                findings.append({
                    'category': 'compliance',
                    'severity': 'info',
                    'message': f'UML class "{sl.get("value", "")}" may be missing attribute/method separator',
                    'suggestion': 'Use horizontal line to separate attributes from methods'
                })

        return findings

    # ----------------------------------------------------------------
    # Improvement Suggestions
    # ----------------------------------------------------------------

    def suggest_improvements(self):
        """Generate high-level improvement suggestions."""
        suggestions = []
        complexity = self.compute_complexity()

        # Suggest decomposition for dense diagrams
        if complexity['node_count'] > 30:
            suggestions.append({
                'priority': 'high',
                'suggestion': 'Consider decomposing into multiple diagrams (C4 drill-down)',
                'reason': f'{complexity["node_count"]} nodes makes the diagram hard to read'
            })

        # Suggest better diagram type
        if complexity['edge_count'] > complexity['node_count'] * 2:
            suggestions.append({
                'priority': 'medium',
                'suggestion': 'High edge-to-node ratio - consider a matrix or table view',
                'reason': 'Many-to-many relationships are clearer in matrix format'
            })

        if complexity['max_nesting_depth'] > 3:
            suggestions.append({
                'priority': 'medium',
                'suggestion': 'Deep nesting detected - flatten hierarchy or use separate pages',
                'reason': f'Nesting depth of {complexity["max_nesting_depth"]} reduces readability'
            })

        if complexity['density'] < 0.5 and complexity['node_count'] > 5:
            suggestions.append({
                'priority': 'low',
                'suggestion': 'Many unconnected elements - add relationships or remove orphans',
                'reason': f'Edge density is {complexity["density"]:.2f} (low)'
            })

        return suggestions

    # ----------------------------------------------------------------
    # Helpers
    # ----------------------------------------------------------------

    def _variance(self, values):
        """Calculate variance of a list of numbers."""
        if len(values) < 2:
            return 0
        mean = sum(values) / len(values)
        return sum((v - mean) ** 2 for v in values) / len(values)

    def _hex_to_rgb(self, hex_color):
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join(c * 2 for c in hex_color)
        if len(hex_color) != 6:
            return (128, 128, 128)  # fallback gray
        try:
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        except ValueError:
            return (128, 128, 128)

    def _relative_luminance(self, rgb):
        """Calculate relative luminance per WCAG 2.0."""
        srgb = [c / 255.0 for c in rgb]
        linear = []
        for c in srgb:
            if c <= 0.03928:
                linear.append(c / 12.92)
            else:
                linear.append(((c + 0.055) / 1.055) ** 2.4)
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]

    def _contrast_ratio(self, color1, color2):
        """Calculate WCAG contrast ratio between two hex colors."""
        rgb1 = self._hex_to_rgb(color1)
        rgb2 = self._hex_to_rgb(color2)
        l1 = self._relative_luminance(rgb1)
        l2 = self._relative_luminance(rgb2)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)

    # ----------------------------------------------------------------
    # Run All
    # ----------------------------------------------------------------

    def run(self):
        """Run full analysis and return report."""
        self.analyze_layout()
        self.analyze_colors()
        self.analyze_labels()
        self.analyze_connections()
        self.analyze_layers()
        self.analyze_accessibility()
        self.check_compliance()

        total = (
            self.scores.get('layout', 0) * 0.20 +
            self.scores.get('color', 0) * 0.15 +
            self.scores.get('labels', 0) * 0.20 +
            self.scores.get('connections', 0) * 0.20 +
            self.scores.get('layers', 0) * 0.10 +
            self.scores.get('accessibility', 0) * 0.15
        )

        complexity = self.compute_complexity()
        suggestions = self.suggest_improvements()

        # Determine grade
        if total >= 90: grade = 'A'
        elif total >= 80: grade = 'B'
        elif total >= 70: grade = 'C'
        elif total >= 60: grade = 'D'
        else: grade = 'F'

        return {
            'file': self.filepath,
            'total_score': round(total, 1),
            'grade': grade,
            'category_scores': self.scores,
            'complexity': complexity,
            'findings': self.findings,
            'suggestions': suggestions,
        }


def print_report(report):
    """Print a human-readable analysis report."""
    print(f"=== Diagram Analysis: {report['file']} ===")
    print(f"Overall Score: {report['total_score']}/100 (Grade: {report['grade']})")
    print()

    print("Category Scores:")
    for cat, score in report['category_scores'].items():
        bar = '#' * (score // 5) + '.' * (20 - score // 5)
        print(f"  {cat:20s} [{bar}] {score}/100")
    print()

    print("Complexity Metrics:")
    cx = report['complexity']
    print(f"  Nodes: {cx['node_count']}")
    print(f"  Edges: {cx['edge_count']}")
    print(f"  Pages: {cx['page_count']}")
    print(f"  Containers: {cx['container_count']}")
    print(f"  Max Nesting: {cx['max_nesting_depth']}")
    print(f"  Density: {cx['density']:.2f}")
    print()

    if report['findings']:
        print("Findings:")
        for f in report['findings']:
            icon = {'error': 'ERR', 'warning': 'WARN', 'info': 'INFO'}
            print(f"  [{icon.get(f['severity'], '?'):4s}] [{f['category']}] {f['message']}")
            print(f"         -> {f['suggestion']}")
        print()

    if report['suggestions']:
        print("Improvement Suggestions:")
        for s in report['suggestions']:
            print(f"  [{s['priority'].upper():6s}] {s['suggestion']}")
            print(f"          Reason: {s['reason']}")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 analyze-drawio.py <file.drawio> [--json]")
        sys.exit(1)

    analyzer = DrawioAnalyzer(sys.argv[1])
    report = analyzer.run()

    if '--json' in sys.argv:
        print(json.dumps(report, indent=2))
    else:
        print_report(report)
```

## Diagram Comparison (Diff)

Compare two versions of a diagram and highlight structural changes.

```python
#!/usr/bin/env python3
"""diff-drawio.py - Compare two draw.io diagram versions."""

import xml.etree.ElementTree as ET
import sys

def diff_diagrams(file_a, file_b):
    """Compare two draw.io files and report differences."""
    tree_a = ET.parse(file_a)
    tree_b = ET.parse(file_b)

    cells_a = {}
    cells_b = {}

    for cell in tree_a.getroot().iter('mxCell'):
        cid = cell.get('id', '')
        if cid not in ('0', '1'):
            cells_a[cid] = {
                'value': cell.get('value', ''),
                'style': cell.get('style', ''),
                'source': cell.get('source', ''),
                'target': cell.get('target', ''),
                'is_edge': cell.get('edge') == '1',
            }

    for cell in tree_b.getroot().iter('mxCell'):
        cid = cell.get('id', '')
        if cid not in ('0', '1'):
            cells_b[cid] = {
                'value': cell.get('value', ''),
                'style': cell.get('style', ''),
                'source': cell.get('source', ''),
                'target': cell.get('target', ''),
                'is_edge': cell.get('edge') == '1',
            }

    ids_a = set(cells_a.keys())
    ids_b = set(cells_b.keys())

    added = ids_b - ids_a
    removed = ids_a - ids_b
    common = ids_a & ids_b

    modified = []
    for cid in common:
        a = cells_a[cid]
        b = cells_b[cid]
        changes = []
        if a['value'] != b['value']:
            changes.append(f"label: '{a['value'][:30]}' -> '{b['value'][:30]}'")
        if a['style'] != b['style']:
            changes.append("style changed")
        if a['source'] != b['source'] or a['target'] != b['target']:
            changes.append("connection changed")
        if changes:
            modified.append((cid, changes))

    print(f"=== Diagram Diff: {file_a} vs {file_b} ===")
    print(f"Added:    {len(added)} elements")
    print(f"Removed:  {len(removed)} elements")
    print(f"Modified: {len(modified)} elements")
    print(f"Unchanged: {len(common) - len(modified)} elements")
    print()

    if added:
        print("Added elements:")
        for cid in added:
            c = cells_b[cid]
            kind = "edge" if c['is_edge'] else "node"
            print(f"  + [{kind}] {cid}: {c['value'][:50]}")

    if removed:
        print("Removed elements:")
        for cid in removed:
            c = cells_a[cid]
            kind = "edge" if c['is_edge'] else "node"
            print(f"  - [{kind}] {cid}: {c['value'][:50]}")

    if modified:
        print("Modified elements:")
        for cid, changes in modified:
            print(f"  ~ {cid}: {', '.join(changes)}")

    return {
        'added': len(added),
        'removed': len(removed),
        'modified': len(modified),
        'unchanged': len(common) - len(modified),
    }

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python3 diff-drawio.py <old.drawio> <new.drawio>")
        sys.exit(1)
    diff_diagrams(sys.argv[1], sys.argv[2])
```

## Standard Compliance Rules

### UML Compliance Checks

| Rule | Severity | Description |
|------|----------|-------------|
| UML-001 | Error | Class must have name compartment |
| UML-002 | Warning | Attributes should specify visibility (+, -, #) |
| UML-003 | Warning | Methods should include return type |
| UML-004 | Info | Abstract classes should use italic font |
| UML-005 | Error | Interface must use stereotype notation |
| UML-006 | Warning | Association ends should have multiplicity |
| UML-007 | Info | Package should contain at least one element |

### BPMN Compliance Checks

| Rule | Severity | Description |
|------|----------|-------------|
| BPMN-001 | Error | Process must have exactly one start event |
| BPMN-002 | Error | Process must have at least one end event |
| BPMN-003 | Warning | Gateways must have matching pairs (split/join) |
| BPMN-004 | Warning | Tasks should have descriptive names (verb + noun) |
| BPMN-005 | Info | Pools should contain lanes |
| BPMN-006 | Error | Sequence flow cannot cross pool boundaries |
| BPMN-007 | Warning | Intermediate events should be labeled |

### C4 Compliance Checks

| Rule | Severity | Description |
|------|----------|-------------|
| C4-001 | Error | Elements must include type annotation [Person/System/Container/Component] |
| C4-002 | Warning | Elements should include technology description |
| C4-003 | Warning | Relationships should have labels |
| C4-004 | Info | Context diagram should show external systems in gray |
| C4-005 | Info | Container diagram should show system boundary |
| C4-006 | Error | Zoom levels must not skip (Context -> Component is invalid) |

## CLI Usage

```bash
# Analyze a single diagram
python3 analyze-drawio.py architecture.drawio

# JSON output for CI integration
python3 analyze-drawio.py architecture.drawio --json

# Compare two versions
python3 diff-drawio.py v1/architecture.drawio v2/architecture.drawio

# Analyze with specific standard check
python3 analyze-drawio.py process.drawio --standard bpmn
```

## Integration with CI

```yaml
# .github/workflows/diagram-quality.yml
name: Diagram Quality Gate
on:
  pull_request:
    paths: ['**/*.drawio']

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Find changed diagrams
        id: changed
        run: |
          FILES=$(git diff --name-only origin/main...HEAD -- '*.drawio')
          echo "files=$FILES" >> "$GITHUB_OUTPUT"

      - name: Analyze diagrams
        run: |
          FAIL=0
          for f in ${{ steps.changed.outputs.files }}; do
            SCORE=$(python3 analyze-drawio.py "$f" --json | python3 -c "import sys,json; print(json.load(sys.stdin)['total_score'])")
            echo "$f: $SCORE/100"
            if (( $(echo "$SCORE < 60" | bc -l) )); then
              echo "FAIL: $f scored below threshold"
              FAIL=1
            fi
          done
          exit $FAIL
```

## Execution Flow

1. User invokes `drawio:analyze` with a file path or directory
2. Parse the `.drawio` XML and extract all cells, edges, vertices
3. Run all six category analyses to produce individual scores
4. Compute the weighted overall score and grade
5. Auto-detect any notation standard (UML/BPMN/C4) and run compliance checks
6. Generate complexity metrics
7. Produce prioritized improvement suggestions
8. Output human-readable report or JSON for tooling integration
9. Optionally diff against a previous version if `--compare` flag is given
