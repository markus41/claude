---
description: "Complete draw.io XML generation reference including mxGraphModel structure, cell types, style properties, and validation rules"
triggers:
  - drawio
  - xml
  - mxgraph
  - mxcell
  - diagram xml
  - drawio xml
globs:
  - "**/*.drawio"
  - "**/*.drawio.xml"
  - "**/*.drawio.svg"
---

# draw.io XML Generation Reference

## XML Document Structure

### Full Format (mxfile wrapper)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="2026-03-14T00:00:00.000Z"
        agent="Claude" version="24.0.0" type="device">
  <diagram id="page-1" name="Page 1">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10"
                  guides="1" tooltips="1" connect="1" arrows="1"
                  fold="1" page="1" pageScale="1"
                  pageWidth="1169" pageHeight="827"
                  math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- diagram content here -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### Simplified Format (recommended for AI generation)

Use `mxGraphModel` as root element without the `mxfile`/`diagram` wrapper. This is cleaner, easier to generate, and fully supported by draw.io import.

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- diagram content here -->
  </root>
</mxGraphModel>
```

### mxGraphModel Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `dx` | 0 | Horizontal scroll offset |
| `dy` | 0 | Vertical scroll offset |
| `grid` | 1 | Show grid (0/1) |
| `gridSize` | 10 | Grid spacing in px |
| `guides` | 1 | Enable alignment guides |
| `tooltips` | 1 | Show tooltips |
| `connect` | 1 | Enable connection points |
| `arrows` | 1 | Show arrows on edges |
| `fold` | 1 | Enable container folding |
| `page` | 1 | Show page boundaries |
| `pageScale` | 1 | Page zoom scale |
| `pageWidth` | 1169 | Page width (A4 landscape) |
| `pageHeight` | 827 | Page height (A4 landscape) |
| `math` | 0 | Enable LaTeX math rendering |
| `shadow` | 0 | Default shadow on shapes |
| `background` | none | Background color |

## Mandatory Structural Cells

Every diagram MUST begin with these two cells. They are never rendered but form the cell hierarchy root.

```xml
<mxCell id="0"/>                    <!-- Root cell (invisible) -->
<mxCell id="1" parent="0"/>         <!-- Default layer -->
```

- `id="0"` is the absolute root. It has no parent.
- `id="1"` is the default layer. All visible shapes/edges use `parent="1"` unless placed on a custom layer.
- Omitting either cell causes diagram corruption.

## Vertex Cells (Shapes)

Vertices represent boxes, circles, and all other shapes. They require `vertex="1"` and an `mxGeometry` child.

```xml
<mxCell id="2" value="My Shape" style="rounded=1;whiteSpace=wrap;html=1;"
        vertex="1" parent="1">
  <mxGeometry x="100" y="50" width="120" height="60" as="geometry"/>
</mxCell>
```

### Vertex Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Unique identifier (string) |
| `value` | No | Label text (plain or HTML) |
| `style` | No | Semicolon-delimited style string |
| `vertex` | Yes | Must be `"1"` |
| `parent` | Yes | Parent cell ID (usually `"1"`) |
| `connectable` | No | `"0"` to disable connections |

### mxGeometry for Vertices

```xml
<mxGeometry x="100" y="50" width="120" height="60" as="geometry"/>
```

| Attribute | Description |
|-----------|-------------|
| `x` | Left edge position (px from canvas origin) |
| `y` | Top edge position (px from canvas origin) |
| `width` | Shape width in px |
| `height` | Shape height in px |
| `as` | Must be `"geometry"` |
| `relative` | `"1"` for relative positioning inside parent |

## Edge Cells (Connectors)

Edges connect vertices. They require `edge="1"` and typically `source`/`target` attributes.

```xml
<mxCell id="3" value="connects to" style="edgeStyle=orthogonalEdgeStyle;"
        edge="1" source="2" target="4" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

### Edge Attributes

| Attribute | Required | Description |
|-----------|----------|-------------|
| `id` | Yes | Unique identifier |
| `value` | No | Edge label |
| `style` | No | Style string |
| `edge` | Yes | Must be `"1"` |
| `source` | No | Source vertex ID |
| `target` | No | Target vertex ID |
| `parent` | Yes | Parent cell ID |

### mxGeometry for Edges

Edge geometry uses `relative="1"` and may contain waypoints:

```xml
<mxGeometry relative="1" as="geometry">
  <Array as="points">
    <mxPoint x="200" y="150"/>
    <mxPoint x="300" y="150"/>
  </Array>
  <mxPoint x="100" y="100" as="sourcePoint"/>
  <mxPoint x="400" y="200" as="targetPoint"/>
</mxGeometry>
```

- `sourcePoint` / `targetPoint`: fallback when source/target cells are not set.
- `Array as="points"`: intermediate waypoints for routing.

### Edge Labels

Position labels along edge using `mxGeometry` inside a child cell:

```xml
<mxCell id="label1" value="0..*" style="edgeLabel;align=left;" vertex="1"
        connectable="0" parent="3">
  <mxGeometry x="-0.5" y="0" relative="1" as="geometry">
    <mxPoint x="-10" y="-10" as="offset"/>
  </mxGeometry>
</mxCell>
```

- `x` in [-1, 1]: position along edge (-1=source, 0=middle, 1=target).
- `y`: perpendicular offset.

## Style String Format

Styles are semicolon-separated `key=value` pairs. Order does not matter. A trailing semicolon is conventional.

```
rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=14;
```

Named styles can appear as the first token without `=`:

```
shape=hexagon;perimeter=hexagonPerimeter2;size=0.25;
```

### Fill Properties

| Property | Values | Description |
|----------|--------|-------------|
| `fillColor` | `#hex`, `none` | Shape fill color |
| `gradientColor` | `#hex`, `none` | Gradient end color |
| `gradientDirection` | `south`, `north`, `east`, `west` | Gradient direction |
| `opacity` | 0-100 | Overall opacity |
| `fillOpacity` | 0-100 | Fill-only opacity |
| `glass` | 0/1 | Glass/gloss effect |
| `shadow` | 0/1 | Drop shadow |
| `swimlaneFillColor` | `#hex` | Swimlane body fill |

### Stroke Properties

| Property | Values | Description |
|----------|--------|-------------|
| `strokeColor` | `#hex`, `none` | Border/line color |
| `strokeWidth` | number | Border width in px |
| `dashed` | 0/1 | Dashed line |
| `dashPattern` | string | Dash pattern (e.g., `"8 4"`) |
| `strokeOpacity` | 0-100 | Stroke-only opacity |
| `fixDash` | 0/1 | Keep dash pattern on zoom |

### Shape Properties

| Property | Values | Description |
|----------|--------|-------------|
| `shape` | shape name | Shape type (see Shape Types below) |
| `rounded` | 0/1 | Round corners on rectangles |
| `arcSize` | number | Corner radius (0-50) |
| `perimeter` | perimeter name | Connection point calculation |
| `aspect` | `fixed` | Lock aspect ratio |
| `direction` | `south`, `north`, `east`, `west` | Shape rotation direction |
| `rotation` | degrees | Rotation angle |
| `flipH` | 0/1 | Flip horizontal |
| `flipV` | 0/1 | Flip vertical |
| `size` | number | Shape-specific size parameter |
| `imageWidth`, `imageHeight` | number | Embedded image dimensions |
| `image` | URL | Image source |

### Text Properties

| Property | Values | Description |
|----------|--------|-------------|
| `fontSize` | number | Font size in pt |
| `fontFamily` | string | Font name (e.g., `"Helvetica"`) |
| `fontColor` | `#hex` | Text color |
| `fontStyle` | bitmask | 0=normal, 1=bold, 2=italic, 4=underline (combine with +) |
| `align` | `left`, `center`, `right` | Horizontal text alignment |
| `verticalAlign` | `top`, `middle`, `bottom` | Vertical text alignment |
| `labelPosition` | `left`, `center`, `right` | Label horizontal position relative to shape |
| `verticalLabelPosition` | `top`, `middle`, `bottom` | Label vertical position |
| `labelBackgroundColor` | `#hex`, `none` | Label background |
| `labelBorderColor` | `#hex`, `none` | Label border |
| `html` | 0/1 | Enable HTML label rendering |
| `whiteSpace` | `wrap` | Enable text wrapping |
| `overflow` | `fill`, `width`, `hidden`, `visible` | Text overflow behavior |
| `spacing` | number | Padding around text |
| `spacingTop`, `spacingBottom`, `spacingLeft`, `spacingRight` | number | Directional padding |
| `textOpacity` | 0-100 | Text-only opacity |

**fontStyle bitmask examples:**
- `fontStyle=1` = bold
- `fontStyle=2` = italic
- `fontStyle=3` = bold + italic
- `fontStyle=5` = bold + underline
- `fontStyle=7` = bold + italic + underline

### Edge Properties

| Property | Values | Description |
|----------|--------|-------------|
| `edgeStyle` | style name | Edge routing algorithm |
| `curved` | 0/1 | Curved edges |
| `rounded` | 0/1 | Rounded corners on orthogonal edges |
| `jettySize` | `auto`, number | Orthogonal edge segment length |
| `startArrow` | arrow name | Arrow at source end |
| `endArrow` | arrow name | Arrow at target end |
| `startSize` | number | Start arrow size |
| `endSize` | number | End arrow size |
| `startFill` | 0/1 | Fill start arrow (1=filled, 0=open) |
| `endFill` | 0/1 | Fill end arrow |
| `jumpStyle` | `arc`, `gap`, `sharp`, `line`, `none` | Line crossing style |
| `jumpSize` | number | Jump/gap size |
| `exitX`, `exitY` | 0-1 | Source connection point (relative) |
| `entryX`, `entryY` | 0-1 | Target connection point (relative) |
| `exitDx`, `exitDy` | number | Source connection offset |
| `entryDx`, `entryDy` | number | Target connection offset |
| `exitPerimeter` | 0/1 | Use perimeter for source |
| `entryPerimeter` | 0/1 | Use perimeter for target |
| `sourcePortConstraint` | `north`, `south`, `east`, `west` | Constrain source side |
| `targetPortConstraint` | `north`, `south`, `east`, `west` | Constrain target side |

### Container Properties

| Property | Values | Description |
|----------|--------|-------------|
| `container` | 0/1 | Cell is a container/group |
| `collapsible` | 0/1 | Show collapse/expand button |
| `swimlaneFillColor` | `#hex` | Body fill of swimlane |
| `startSize` | number | Header height in swimlane |
| `childLayout` | `stackLayout` | Auto-layout children |
| `horizontalStack` | 0/1 | Stack direction |
| `stackFill` | 0/1 | Children fill container width |
| `stackSpacing` | number | Gap between stacked children |
| `resizeParent` | 0/1 | Resize parent to fit children |
| `resizeParentMax` | number | Max parent resize |

### Sketch Properties

| Property | Values | Description |
|----------|--------|-------------|
| `sketch` | 0/1 | Hand-drawn/sketch appearance |
| `comic` | 0/1 | Comic/casual style (same as sketch) |
| `fillStyle` | `solid`, `hachure`, `cross-hatch`, `dots`, `zigzag`, `dashes` | Sketch fill pattern |
| `hachureGap` | number | Gap between fill lines |
| `hachureAngle` | number | Angle of fill lines |
| `jiggle` | number | Hand-drawn jiggle amount (1-5) |
| `curveFitting` | number | Curve smoothness |

### Behavior Properties

| Property | Values | Description |
|----------|--------|-------------|
| `movable` | 0/1 | Can be moved |
| `resizable` | 0/1 | Can be resized |
| `rotatable` | 0/1 | Can be rotated |
| `editable` | 0/1 | Label can be edited |
| `deletable` | 0/1 | Can be deleted |
| `connectable` | 0/1 | Can have connections |
| `cloneable` | 0/1 | Can be cloned |
| `pointerEvents` | 0/1 | Responds to mouse events |
| `locked` | 0/1 | Locked in place |

## Shape Types

### Core Shapes

These are built-in and do not require a `shape=` prefix when used as the default:

| Shape | Style | Notes |
|-------|-------|-------|
| Rectangle | (default, no shape needed) | Default shape |
| Rounded Rectangle | `rounded=1;` | |
| Ellipse | `shape=ellipse;` or `ellipse;` | Also `perimeter=ellipsePerimeter;` |
| Rhombus (Diamond) | `shape=rhombus;` or `rhombus;` | Decision shape |
| Triangle | `shape=triangle;` | Points right by default |
| Hexagon | `shape=hexagon;perimeter=hexagonPerimeter2;size=0.25;` | |
| Cloud | `shape=cloud;` | |
| Cylinder | `shape=cylinder3;whiteSpace=wrap;` | Database shape |
| Circle | `ellipse;aspect=fixed;` | Fixed aspect ellipse |
| Line | `shape=line;` | Horizontal separator |
| Arrow | `shape=singleArrow;` or `shape=doubleArrow;` | |

### Extended Shapes

| Shape | Style |
|-------|-------|
| Cube | `shape=cube;whiteSpace=wrap;` |
| Isometric Cube | `shape=isoCube;isoAngle=15;` |
| Document | `shape=document;` |
| Folder | `shape=folder;tabWidth=50;tabHeight=14;tabPosition=left;` |
| Card | `shape=card;size=18;` |
| Tape | `shape=tape;` |
| Note | `shape=note;size=15;` |
| Process | `shape=process;` |
| Step | `shape=step;size=0.2;perimeter=stepPerimeter;` |
| Callout | `shape=callout;size=20;position=0.5;position2=0.5;base=20;` |
| Parallelogram | `shape=parallelogram;perimeter=parallelogramPerimeter;size=0.2;` |
| Trapezoid | `shape=trapezoid;perimeter=trapezoidPerimeter;size=0.4;` |
| Cross | `shape=cross;size=0.2;` |
| Star | `shape=mxgraph.basic.star;` |
| Heart | `shape=mxgraph.basic.heart;` |
| Delay | `shape=delay;` |
| Display | `shape=display;` |
| Data Storage | `shape=dataStorage;` |
| Internal Storage | `shape=internalStorage;dx=20;dy=20;` |
| Or | `shape=or;` |
| And | `shape=mxgraph.electrical.logic_gates.and;` |
| Manual Input | `shape=manualInput;size=15;` |
| Manual Operation | `shape=manualOperation;size=15;` |
| Predefined Process | `shape=process;whiteSpace=wrap;` |

### UML Shapes

| Shape | Style |
|-------|-------|
| Actor | `shape=umlActor;verticalLabelPosition=bottom;` |
| Boundary | `shape=umlBoundary;` |
| Entity | `shape=umlEntity;` |
| Control | `shape=umlControl;` |
| Lifeline | `shape=umlLifeline;perimeter=lifelinePerimeter;` |
| Activation | `points=[];` (narrow rectangle on lifeline) |
| Frame | `shape=umlFrame;` |
| Destroy | `shape=umlDestroy;` |
| Package | `shape=folder;tabWidth=80;tabHeight=20;` |
| Component | `shape=component;` |
| Interface | `shape=providedRequiredInterface;` |
| Class | See UML Class example below |

## Stencil Libraries

External shape libraries accessed via `shape=mxgraph.<library>.<shape>`:

| Library Prefix | Domain |
|---------------|--------|
| `mxgraph.flowchart.*` | Flowchart symbols |
| `mxgraph.bpmn.*` | BPMN 2.0 elements |
| `mxgraph.aws4.*` | AWS Architecture (v4) |
| `mxgraph.azure.*` | Microsoft Azure icons |
| `mxgraph.gcp2.*` | Google Cloud Platform |
| `mxgraph.kubernetes.*` | Kubernetes resources |
| `mxgraph.cisco.*` | Cisco network equipment |
| `mxgraph.uml.*` | UML 2.x extended |
| `mxgraph.er.*` | Entity-Relationship |
| `mxgraph.basic.*` | Basic shapes |
| `mxgraph.arrows2.*` | Arrow shapes |
| `mxgraph.lean_mapping.*` | Value stream mapping |
| `mxgraph.electrical.*` | Electrical engineering |
| `mxgraph.floorplan.*` | Floor plans |
| `mxgraph.ios.*` | iOS mockups |
| `mxgraph.android.*` | Android mockups |
| `mxgraph.mockup.*` | Web mockups |
| `mxgraph.archimate3.*` | ArchiMate 3.0 |
| `mxgraph.sysml.*` | SysML |
| `mxgraph.eip.*` | Enterprise Integration Patterns |
| `mxgraph.c4.*` | C4 model |

### Common AWS Shapes

```
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.s3
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sqs
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sns
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway
shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.cloudfront
shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.vpc
shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.region
```

### Common Azure Shapes

```
shape=mxgraph.azure.app_service
shape=mxgraph.azure.storage_blob
shape=mxgraph.azure.azure_functions
shape=mxgraph.azure.sql_database
shape=mxgraph.azure.virtual_machine
shape=mxgraph.azure.azure_active_directory
shape=mxgraph.azure.key_vaults
shape=mxgraph.azure.kubernetes_services
```

### Common Kubernetes Shapes

```
shape=mxgraph.kubernetes.pod
shape=mxgraph.kubernetes.svc
shape=mxgraph.kubernetes.deploy
shape=mxgraph.kubernetes.rs
shape=mxgraph.kubernetes.ing
shape=mxgraph.kubernetes.cm
shape=mxgraph.kubernetes.secret
shape=mxgraph.kubernetes.ns
shape=mxgraph.kubernetes.node
shape=mxgraph.kubernetes.vol
shape=mxgraph.kubernetes.pv
shape=mxgraph.kubernetes.pvc
```

## Edge Routing Styles

| Style | Description |
|-------|-------------|
| `edgeStyle=orthogonalEdgeStyle` | Right-angle routing (most common) |
| `edgeStyle=segmentEdgeStyle` | Manual segment routing |
| `edgeStyle=elbowEdgeStyle` | Single elbow bend |
| `edgeStyle=entityRelationEdgeStyle` | ER diagram routing |
| `edgeStyle=isometricEdgeStyle` | Isometric routing |
| `edgeStyle=none` | Straight line (no routing) |
| `curved=1` | Smooth curved connections |

## Perimeter Types

Perimeters determine where connection points sit on a shape:

| Perimeter | For Shape |
|-----------|-----------|
| `perimeter=rectanglePerimeter` | Rectangle (default) |
| `perimeter=ellipsePerimeter` | Ellipse, circle |
| `perimeter=rhombusPerimeter` | Diamond |
| `perimeter=trianglePerimeter` | Triangle |
| `perimeter=hexagonPerimeter2` | Hexagon |
| `perimeter=parallelogramPerimeter` | Parallelogram |
| `perimeter=trapezoidPerimeter` | Trapezoid |
| `perimeter=stepPerimeter` | Step/chevron |
| `perimeter=lifelinePerimeter` | UML lifeline |
| `perimeter=centerPerimeter` | Connect to center only |
| `perimeter=calloutPerimeter` | Callout/speech bubble |

## Arrow Types

Used with `startArrow` and `endArrow`:

| Arrow | Appearance |
|-------|-----------|
| `classic` | Standard filled arrowhead |
| `classicThin` | Thin filled arrowhead |
| `block` | Filled block arrow |
| `blockThin` | Thin block arrow |
| `open` | Open (unfilled) arrowhead |
| `openThin` | Thin open arrowhead |
| `oval` | Filled circle |
| `diamond` | Filled diamond |
| `diamondThin` | Thin diamond |
| `box` | Square |
| `halfCircle` | Half circle |
| `circle` | Circle (used with `endFill=0` for open) |
| `cross` | X mark |
| `dash` | Short perpendicular line |
| `async` | Half arrowhead (async message) |
| `ERone` | ER "one" notation |
| `ERmandOne` | ER "mandatory one" notation |
| `ERmany` | ER "many" notation |
| `ERoneToMany` | ER "one to many" |
| `ERzeroToMany` | ER "zero to many" |
| `ERzeroToOne` | ER "zero to one" |
| `none` | No arrow |

## Standard Color Palette

### Fill / Stroke Pairs (draw.io defaults)

| Name | Fill | Stroke |
|------|------|--------|
| Blue | `#dae8fc` | `#6c8ebf` |
| Green | `#d5e8d4` | `#82b366` |
| Orange | `#ffe6cc` | `#d6b656` |
| Yellow | `#fff2cc` | `#d6b656` |
| Red | `#f8cecc` | `#b85450` |
| Purple | `#e1d5e7` | `#9673a6` |
| Gray | `#f5f5f5` | `#666666` |
| Dark Blue | `#1ba1e2` | `#006eaf` |
| White | `#ffffff` | `#000000` |
| Dark | `#333333` | `#000000` |

### Status Colors

| Status | Fill | Stroke |
|--------|------|--------|
| Healthy / Success | `#d5e8d4` | `#82b366` |
| Warning | `#fff2cc` | `#d6b656` |
| Error / Critical | `#f8cecc` | `#b85450` |
| Info | `#dae8fc` | `#6c8ebf` |
| Disabled | `#f5f5f5` | `#666666` |

## HTML Labels

When `html=1` is in the style, the `value` attribute supports HTML:

```xml
<mxCell id="5" value="&lt;b&gt;Bold&lt;/b&gt;&lt;br&gt;&lt;i&gt;Italic&lt;/i&gt;"
        style="html=1;whiteSpace=wrap;" vertex="1" parent="1">
```

Supported HTML tags:
- `<b>`, `<strong>` - bold
- `<i>`, `<em>` - italic
- `<u>` - underline
- `<br>` or `<br/>` - line break
- `<font color="#hex" size="N" face="family">` - font styling
- `<sup>`, `<sub>` - superscript, subscript
- `<hr>` - horizontal rule
- `<table>`, `<tr>`, `<td>` - tables (for UML class boxes, etc.)
- `<ul>`, `<ol>`, `<li>` - lists
- `<a href="url">` - hyperlinks
- `<span style="...">` - inline CSS

HTML entities must be escaped in XML: `&lt;` `&gt;` `&amp;` `&quot;`

### UML Class Box with HTML Table

```xml
<mxCell id="10" value="&lt;table style='border:0;'&gt;
  &lt;tr&gt;&lt;td style='font-weight:bold;border-bottom:1px solid #666;'&gt;ClassName&lt;/td&gt;&lt;/tr&gt;
  &lt;tr&gt;&lt;td style='text-align:left;border-bottom:1px solid #ccc;'&gt;- name: String&lt;br&gt;- age: int&lt;/td&gt;&lt;/tr&gt;
  &lt;tr&gt;&lt;td style='text-align:left;'&gt;+ getName(): String&lt;br&gt;+ setName(n: String): void&lt;/td&gt;&lt;/tr&gt;
&lt;/table&gt;"
style="shape=classBox;html=1;whiteSpace=wrap;overflow=fill;" vertex="1" parent="1">
```

## Metadata with Object Tags

Wrap `mxCell` in `<object>` to add custom key-value metadata:

```xml
<object label="API Gateway" id="20" service-type="gateway"
        owner="platform-team" sla="99.99" environment="production">
  <mxCell style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway;"
          vertex="1" parent="1">
    <mxGeometry x="200" y="100" width="60" height="60" as="geometry"/>
  </mxCell>
</object>
```

- Any attribute on `<object>` becomes searchable metadata.
- `label` replaces `value` (same purpose).
- `id` moves from `mxCell` to `<object>`.
- Use `placeholders="1"` in style to reference attributes: `%owner%`, `%sla%`.

## Groups and Containers

Make a cell a container with `container=1`. Children reference it via `parent`:

```xml
<!-- Container group -->
<mxCell id="group1" value="VPC" style="container=1;collapsible=1;swimlane;
        startSize=30;fillColor=#e6d0de;strokeColor=#ae4132;" vertex="1" parent="1">
  <mxGeometry x="50" y="50" width="400" height="300" as="geometry"/>
</mxCell>

<!-- Child inside container -->
<mxCell id="child1" value="Subnet A" style="rounded=1;" vertex="1" parent="group1">
  <mxGeometry x="20" y="40" width="100" height="50" as="geometry"/>
</mxCell>
```

- Child `x`, `y` coordinates are relative to the container's top-left.
- `collapsible=1` adds a collapse/expand toggle.
- `swimlane` style adds a header bar with `startSize` height.

## Layers

Additional layers are cells with `parent="0"`:

```xml
<mxCell id="0"/>
<mxCell id="1" parent="0"/>                            <!-- Layer 1 (default) -->
<mxCell id="layer2" value="Annotations" parent="0"/>    <!-- Layer 2 -->

<!-- Shape on default layer -->
<mxCell id="s1" value="Server" vertex="1" parent="1">...</mxCell>

<!-- Shape on layer 2 -->
<mxCell id="s2" value="Note" vertex="1" parent="layer2">...</mxCell>
```

Layers can be shown/hidden independently in draw.io.

## Multiple Pages

Multiple `<diagram>` elements inside `<mxfile>`:

```xml
<mxfile>
  <diagram id="page1" name="Overview">
    <mxGraphModel>...</mxGraphModel>
  </diagram>
  <diagram id="page2" name="Detail View">
    <mxGraphModel>...</mxGraphModel>
  </diagram>
</mxfile>
```

## Validation Checklist for AI-Generated Diagrams

Before outputting any draw.io XML, verify:

1. **Structural cells present**: `<mxCell id="0"/>` and `<mxCell id="1" parent="0"/>` exist
2. **Unique IDs**: Every cell has a unique `id` attribute
3. **Valid parent references**: Every `parent` attribute references an existing cell ID
4. **Vertex/edge flag**: Shapes have `vertex="1"`, connectors have `edge="1"`
5. **Edge targets exist**: `source` and `target` on edges reference existing vertex IDs
6. **Geometry present**: Every vertex has `<mxGeometry>` with `width` and `height`
7. **Edge geometry**: Every edge has `<mxGeometry relative="1" as="geometry"/>`
8. **Style spelling**: All style properties use exact camelCase names from this reference
9. **Perimeter matches shape**: Hexagons use `hexagonPerimeter2`, not `rectanglePerimeter`
10. **HTML escaping**: If `html=1`, all `<` `>` `&` in `value` are XML-escaped
11. **No overlapping shapes**: Check that shapes have distinct x, y positions
12. **Reasonable dimensions**: Shapes are 40-300px wide, 30-200px tall typically
13. **Connected graph**: All edges connect to existing source/target vertices
14. **Label readability**: Font size >= 10pt for normal text

## Complete Examples

### Example 1: Simple Flowchart

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="2" value="Start" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="200" y="20" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="3" value="Process Data" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="170" y="100" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="4" value="Valid?" style="rhombus;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="1">
      <mxGeometry x="190" y="200" width="100" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="5" value="Save" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="170" y="330" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="6" value="Error" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="370" y="210" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="7" value="End" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="200" y="430" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="2" target="3" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="3" target="4" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e3" value="Yes" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="4" target="5" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e4" value="No" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="4" target="6" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e5" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="5" target="7" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Example 2: Architecture Diagram with Containers

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- VPC Container -->
    <mxCell id="vpc" value="VPC (10.0.0.0/16)" style="swimlane;container=1;collapsible=0;startSize=30;fillColor=#e6d0de;strokeColor=#ae4132;rounded=1;" vertex="1" parent="1">
      <mxGeometry x="50" y="50" width="600" height="350" as="geometry"/>
    </mxCell>
    <!-- Public Subnet -->
    <mxCell id="pub" value="Public Subnet" style="swimlane;container=1;startSize=25;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="vpc">
      <mxGeometry x="20" y="50" width="260" height="280" as="geometry"/>
    </mxCell>
    <mxCell id="alb" value="ALB" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.elastic_load_balancing;" vertex="1" parent="pub">
      <mxGeometry x="90" y="40" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="ec2a" value="EC2 (App)" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2;" vertex="1" parent="pub">
      <mxGeometry x="30" y="140" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="ec2b" value="EC2 (App)" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2;" vertex="1" parent="pub">
      <mxGeometry x="150" y="140" width="60" height="60" as="geometry"/>
    </mxCell>
    <!-- Private Subnet -->
    <mxCell id="priv" value="Private Subnet" style="swimlane;container=1;startSize=25;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="vpc">
      <mxGeometry x="320" y="50" width="260" height="280" as="geometry"/>
    </mxCell>
    <mxCell id="rds" value="RDS (Postgres)" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds;" vertex="1" parent="priv">
      <mxGeometry x="90" y="60" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="cache" value="ElastiCache" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.elasticache;" vertex="1" parent="priv">
      <mxGeometry x="90" y="170" width="60" height="60" as="geometry"/>
    </mxCell>
    <!-- Edges -->
    <mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;" edge="1" source="alb" target="ec2a" parent="vpc">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2" style="edgeStyle=orthogonalEdgeStyle;strokeWidth=2;" edge="1" source="alb" target="ec2b" parent="vpc">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e3" style="edgeStyle=orthogonalEdgeStyle;dashed=1;" edge="1" source="ec2a" target="rds" parent="vpc">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e4" style="edgeStyle=orthogonalEdgeStyle;dashed=1;" edge="1" source="ec2b" target="rds" parent="vpc">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Example 3: UML Sequence Diagram

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Lifelines -->
    <mxCell id="client" value="Client" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;size=40;" vertex="1" parent="1">
      <mxGeometry x="100" y="20" width="100" height="400" as="geometry"/>
    </mxCell>
    <mxCell id="server" value="API Server" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;size=40;" vertex="1" parent="1">
      <mxGeometry x="300" y="20" width="100" height="400" as="geometry"/>
    </mxCell>
    <mxCell id="db" value="Database" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;portConstraint=eastwest;size=40;" vertex="1" parent="1">
      <mxGeometry x="500" y="20" width="100" height="400" as="geometry"/>
    </mxCell>
    <!-- Activation on server -->
    <mxCell id="act1" value="" style="points=[];fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="server">
      <mxGeometry x="45" y="80" width="10" height="120" as="geometry"/>
    </mxCell>
    <!-- Messages -->
    <mxCell id="m1" value="POST /api/users" style="endArrow=block;endFill=1;html=1;" edge="1" parent="1">
      <mxGeometry width="160" relative="1" as="geometry">
        <mxPoint x="150" y="100" as="sourcePoint"/>
        <mxPoint x="345" y="100" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
    <mxCell id="m2" value="INSERT INTO users" style="endArrow=block;endFill=1;html=1;" edge="1" parent="1">
      <mxGeometry width="160" relative="1" as="geometry">
        <mxPoint x="355" y="140" as="sourcePoint"/>
        <mxPoint x="545" y="140" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
    <mxCell id="m3" value="result" style="endArrow=open;endFill=0;dashed=1;html=1;" edge="1" parent="1">
      <mxGeometry width="160" relative="1" as="geometry">
        <mxPoint x="545" y="180" as="sourcePoint"/>
        <mxPoint x="355" y="180" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
    <mxCell id="m4" value="201 Created" style="endArrow=open;endFill=0;dashed=1;html=1;" edge="1" parent="1">
      <mxGeometry width="160" relative="1" as="geometry">
        <mxPoint x="345" y="200" as="sourcePoint"/>
        <mxPoint x="150" y="200" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>
```

### Example 4: Entity-Relationship Diagram

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- User Entity -->
    <mxCell id="user" value="User" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="80" y="80" width="200" height="150" as="geometry"/>
    </mxCell>
    <mxCell id="u1" value="id : INT PK" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="user">
      <mxGeometry y="30" width="200" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="u2" value="name : VARCHAR(255)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="user">
      <mxGeometry y="60" width="200" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="u3" value="email : VARCHAR(255)" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="user">
      <mxGeometry y="90" width="200" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="u4" value="created_at : TIMESTAMP" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="user">
      <mxGeometry y="120" width="200" height="30" as="geometry"/>
    </mxCell>
    <!-- Order Entity -->
    <mxCell id="order" value="Order" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="420" y="80" width="200" height="150" as="geometry"/>
    </mxCell>
    <mxCell id="o1" value="id : INT PK" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="order">
      <mxGeometry y="30" width="200" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="o2" value="user_id : INT FK" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="order">
      <mxGeometry y="60" width="200" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="o3" value="total : DECIMAL" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="order">
      <mxGeometry y="90" width="200" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="o4" value="status : ENUM" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=4;" vertex="1" parent="order">
      <mxGeometry y="120" width="200" height="30" as="geometry"/>
    </mxCell>
    <!-- Relationship -->
    <mxCell id="rel1" value="" style="edgeStyle=entityRelationEdgeStyle;endArrow=ERzeroToMany;startArrow=ERmandOne;endFill=0;startFill=0;strokeWidth=2;" edge="1" source="user" target="order" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="rel1_label" value="places" style="edgeLabel;align=center;" vertex="1" connectable="0" parent="rel1">
      <mxGeometry x="0" y="0" relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```
