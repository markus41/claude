---
description: "Index of draw.io XML templates by diagram type — reference when generating diagrams"
triggers:
  - drawio template
  - diagram template
globs:
  - "**/*.drawio"
---

# Template Index

This skill indexes all available templates. Each template demonstrates the correct
XML structure with the full `<mxfile>` wrapper, proper layers, edge routing,
shadows, and containers.

## Template Files

| Template | File | Use For |
|----------|------|---------|
| Flowchart | `commands/create.md` (Template Library section) | Process flows, algorithms |
| Sequence | `commands/create.md` (Sequence Diagram Template) | API flows, request traces |
| ER Diagram | `commands/create.md` (ER Diagram Template) | Database schemas |
| C4 Architecture | `commands/create.md` (C4 Architecture Template) | System architecture |
| UML Class | `commands/create.md` (UML Class Diagram Template) | OO design |
| Kubernetes | `commands/create.md` (Kubernetes Diagram Template) | K8s topology |
| Swimlane | `commands/create.md` (Swimlane Diagram Template) | Cross-team flows |
| Mind Map | `commands/create.md` (Mind Map Template) | Brainstorming |
| Simple Flowchart | `skills/xml-generation/SKILL.md` (Example 1) | Quick processes |
| AWS Architecture | `skills/xml-generation/SKILL.md` (Example 2) | Cloud infra |
| UML Sequence | `skills/xml-generation/SKILL.md` (Example 3) | Detailed sequences |

## Template Requirements

Every template MUST include:

1. `<mxfile>` wrapper (never bare `<mxGraphModel>`)
2. `background="none"` on `<mxGraphModel>`
3. At least 2 layers (content + annotations)
4. Title annotation cell on the annotations layer
5. `shadow=1;` on primary shapes
6. `html=1;` with `<b>` tags on labels
7. `edgeStyle=orthogonalEdgeStyle;rounded=1;jettySize=auto;` on edges
8. `strokeWidth=2;` on primary flow edges
9. Explicit `exitX/exitY/entryX/entryY` on edges between non-aligned shapes
10. Containers for grouped elements
11. Legend if 3+ color categories

## Quick Reference: Starting Skeleton

```xml
<mxfile host="Claude" modified="2026-03-17T00:00:00.000Z" agent="Claude Code" version="24.0.0" type="device">
  <diagram id="diagram-1" name="[Title]">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0" background="none">
      <root>
        <mxCell id="0" />
        <mxCell id="1" value="Main" parent="0" />
        <mxCell id="layer-notes" value="Annotations" parent="0" />
        <!-- Title -->
        <mxCell id="title" value="&lt;b&gt;[Diagram Title]&lt;/b&gt;" style="text;html=1;fontSize=16;align=left;" vertex="1" parent="layer-notes">
          <mxGeometry x="40" y="10" width="300" height="30" as="geometry" />
        </mxCell>
        <!-- Content goes on layer "1" (Main) -->
        <!-- Annotations/legend go on layer "layer-notes" -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```
