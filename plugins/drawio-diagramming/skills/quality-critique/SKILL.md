---
description: "Visual quality critique checklist for draw.io diagrams — run before writing any .drawio file"
triggers:
  - drawio quality
  - diagram review
  - visual critique
globs:
  - "**/*.drawio"
---

# Diagram Quality Critique

Run this critique on every generated diagram XML BEFORE writing the file.
Fix all issues found before saving — do not write substandard diagrams.

## Critique Checklist

### 1. Structure (must pass — blank file prevention)

- [ ] XML starts with `<mxfile>` wrapping `<diagram>` wrapping `<mxGraphModel>`
- [ ] `background="none"` set on `<mxGraphModel>` (transparent, not white)
- [ ] Cells `id="0"` and `id="1" parent="0"` present
- [ ] At least 2 layers defined (content + annotations)
- [ ] All cell IDs are unique
- [ ] All `parent` references point to existing cells
- [ ] All `source`/`target` on edges point to existing vertices

### 2. Layout Quality

- [ ] Shapes are grid-aligned (x, y coordinates are multiples of 10)
- [ ] No overlapping shapes (check x, y, width, height for collisions)
- [ ] Consistent spacing between related elements (60-80px gaps)
- [ ] Logical flow direction (top-to-bottom or left-to-right)
- [ ] Container/group boundaries have 20px+ padding around children
- [ ] Title annotation present at top-left

### 3. Edge/Connection Quality (critical — prevents ugly routing)

- [ ] ALL edges use `rounded=1;jettySize=auto;` (no sharp 90-degree bends)
- [ ] Primary flow edges use `strokeWidth=2;`
- [ ] Edges between non-aligned shapes specify `exitX/exitY/entryX/entryY`
- [ ] No edges crossing through shapes (reroute or add waypoints)
- [ ] Crossing edges use `jumpStyle=arc;jumpSize=16;`
- [ ] Return/response edges use `dashed=1;dashPattern=8 4;`
- [ ] Edge labels are positioned to not overlap shapes

### 4. Visual Quality

- [ ] All primary shapes have `shadow=1;` for depth
- [ ] HTML labels enabled (`html=1;`) with `<b>` for titles
- [ ] Font size >= 11pt for shape labels, >= 9pt for edge labels
- [ ] Fill colors use the standard palette (not random hex values)
- [ ] Text has sufficient contrast against fill (dark text on light fills, white text on dark fills)
- [ ] fontColor explicitly set (use `#333333` for light fills, `#FFFFFF` for dark fills)
- [ ] Container headers use `fontStyle=1;` (bold)

### 5. Sophistication

- [ ] Related elements grouped in containers (`container=1;collapsible=1;`)
- [ ] Semantic layers used (not all elements on default layer)
- [ ] Color coding is consistent and meaningful (blue=services, green=data, etc.)
- [ ] Legend present if 3+ color categories used
- [ ] Metadata via `<object>` tags where appropriate (services, APIs)
- [ ] Multi-page used for complex diagrams (10+ major elements → drill-down pages)

### 6. Platform Compatibility

- [ ] Azure DevOps: export as PNG (not SVG) — SVG rendering is broken
- [ ] GitHub: use `.drawio.svg` with `--embed-diagram` for editability
- [ ] Transparent background for clean embedding in all contexts

## Contrast Reference

| Fill Color | Recommended fontColor | Example |
|-----------|----------------------|---------|
| `#DAE8FC` (blue) | `#333333` | Services |
| `#D5E8D4` (green) | `#333333` | Data stores |
| `#FFF2CC` (yellow) | `#333333` | Decisions |
| `#F8CECC` (red) | `#333333` | Errors |
| `#E1D5E7` (purple) | `#333333` | External |
| `#F5F5F5` (gray) | `#333333` | Containers |
| `#08427B` (C4 blue) | `#FFFFFF` | C4 person |
| `#438DD5` (C4 mid) | `#FFFFFF` | C4 system |
| `#1B1B1B` (dark) | `#FFFFFF` | Dark mode |
| `#143642` (blueprint) | `#DADADA` | Blueprint |

## Auto-Fix Patterns

When critique finds issues, apply these automatic fixes:

| Issue | Fix |
|-------|-----|
| Missing `rounded=1` on edge | Add `rounded=1;jettySize=auto;` to edge style |
| Missing `shadow=1` on shape | Add `shadow=1;` to vertex style |
| Missing layers | Add `<mxCell id="layer-notes" value="Annotations" parent="0"/>` |
| `background` not set | Add `background="none"` to `<mxGraphModel>` |
| No `html=1` on labeled shape | Add `html=1;` and wrap value in `<b>` tags |
| Sharp edge corners | Add `rounded=1;` to edge style |
| Thin primary edges | Add `strokeWidth=2;` to primary flow edges |
| No title | Add text cell on annotations layer |
