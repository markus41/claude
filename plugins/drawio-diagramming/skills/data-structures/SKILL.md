---
description: "Computer science data structure visualization in draw.io — arrays, linked lists, trees, graphs, hash tables, heaps, stacks, queues"
triggers:
  - data structure
  - array diagram
  - linked list
  - binary tree
  - hash table
  - graph visualization
  - stack queue
  - heap
  - trie
  - b-tree
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
---

# Data Structure Diagrams

## Quick Reference

| Structure | Best For | Complexity |
|-----------|----------|------------|
| Array | Sequential data, index access | Low |
| Linked List | Insertion/deletion demos | Low |
| Stack | LIFO operations, call stacks | Low |
| Queue | FIFO operations, BFS | Low |
| Binary Tree | Hierarchical data, BST | Medium |
| AVL / Red-Black Tree | Balanced search demos | Medium |
| B-Tree | Database index visualization | High |
| Heap | Priority queue, heapsort | Medium |
| Hash Table | Key-value mapping, collisions | Medium |
| Graph | Networks, relationships, paths | Medium-High |
| Trie | Prefix search, autocomplete | Medium |

---

## Shared Style Constants

```
Cell colors:
  Default:    fillColor=#DAE8FC;strokeColor=#6C8EBF;  (blue)
  Highlight:  fillColor=#D5E8D4;strokeColor=#82B366;  (green — active/found)
  Alert:      fillColor=#F8CECC;strokeColor=#B85450;  (red — removed/error)
  Visited:    fillColor=#FFF2CC;strokeColor=#D6B656;  (yellow — traversed)
  Empty:      fillColor=#F5F5F5;strokeColor=#CCCCCC;  (gray — null/empty)

Text:  fontColor=#333333;fontSize=14;fontFamily=Consolas;
Index: fontColor=#999999;fontSize=10;fontStyle=2;  (italic, small)
Arrow: strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;
```

---

## Arrays

### Linear Array

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Index labels -->
    <mxCell id="idx0" value="0" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#999999;fontSize=10;fontStyle=2;align=center;" vertex="1" parent="1">
      <mxGeometry x="40" y="20" width="60" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="idx1" value="1" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#999999;fontSize=10;fontStyle=2;align=center;" vertex="1" parent="1">
      <mxGeometry x="100" y="20" width="60" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="idx2" value="2" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#999999;fontSize=10;fontStyle=2;align=center;" vertex="1" parent="1">
      <mxGeometry x="160" y="20" width="60" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="idx3" value="3" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#999999;fontSize=10;fontStyle=2;align=center;" vertex="1" parent="1">
      <mxGeometry x="220" y="20" width="60" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="idx4" value="4" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#999999;fontSize=10;fontStyle=2;align=center;" vertex="1" parent="1">
      <mxGeometry x="280" y="20" width="60" height="20" as="geometry"/>
    </mxCell>
    <!-- Array cells -->
    <mxCell id="a0" value="42" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontColor=#333333;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="a1" value="17" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontColor=#333333;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="100" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="a2" value="93" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontColor=#333333;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="160" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="a3" value="8" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontColor=#333333;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="220" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="a4" value="51" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontColor=#333333;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="280" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <!-- Pointer arrow -->
    <mxCell id="ptr" value="current" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#B85450;fontSize=11;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="160" y="90" width="60" height="20" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### 2D Matrix

Use a grid of cells. Each row shares the same Y, each column the same X. Add row/column headers with index labels.

```xml
<!-- Row 0 -->
<mxCell id="m00" value="1" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;fontFamily=Consolas;" vertex="1" parent="1">
  <mxGeometry x="80" y="40" width="50" height="40" as="geometry"/>
</mxCell>
<mxCell id="m01" value="2" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;fontFamily=Consolas;" vertex="1" parent="1">
  <mxGeometry x="130" y="40" width="50" height="40" as="geometry"/>
</mxCell>
<mxCell id="m02" value="3" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;fontFamily=Consolas;" vertex="1" parent="1">
  <mxGeometry x="180" y="40" width="50" height="40" as="geometry"/>
</mxCell>
<!-- Row 1 -->
<mxCell id="m10" value="4" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;fontFamily=Consolas;" vertex="1" parent="1">
  <mxGeometry x="80" y="80" width="50" height="40" as="geometry"/>
</mxCell>
```

---

## Linked Lists

### Singly Linked List

Each node has a data cell and a pointer cell side by side:

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Node 1 -->
    <mxCell id="n1data" value="10" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="40" y="60" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="n1ptr" value="&#x2022;" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=18;" vertex="1" parent="1">
      <mxGeometry x="100" y="60" width="30" height="40" as="geometry"/>
    </mxCell>
    <!-- Node 2 -->
    <mxCell id="n2data" value="20" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="200" y="60" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="n2ptr" value="&#x2022;" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=18;" vertex="1" parent="1">
      <mxGeometry x="260" y="60" width="30" height="40" as="geometry"/>
    </mxCell>
    <!-- Node 3 (tail) -->
    <mxCell id="n3data" value="30" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="360" y="60" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="n3ptr" value="&#x2205;" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#CCCCCC;fontSize=14;" vertex="1" parent="1">
      <mxGeometry x="420" y="60" width="30" height="40" as="geometry"/>
    </mxCell>
    <!-- Arrows -->
    <mxCell id="e12" style="edgeStyle=entityRelationEdgeStyle;strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;" edge="1" source="n1ptr" target="n2data" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e23" style="edgeStyle=entityRelationEdgeStyle;strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;" edge="1" source="n2ptr" target="n3data" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <!-- Head label -->
    <mxCell id="head" value="head" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#B85450;fontSize=11;fontStyle=1;align=center;" vertex="1" parent="1">
      <mxGeometry x="40" y="36" width="60" height="20" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Doubly Linked List

Same as above but add a second pointer cell on the left of each node, and backward arrows.

---

## Stacks and Queues

### Stack (LIFO)

Vertical arrangement, top item highlighted:

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="sLabel" value="&lt;b&gt;Stack&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#333333;fontSize=16;align=center;" vertex="1" parent="1">
      <mxGeometry x="60" y="10" width="80" height="24" as="geometry"/>
    </mxCell>
    <!-- Top (most recent push) -->
    <mxCell id="s3" value="&lt;b&gt;C&lt;/b&gt;  ← top" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="120" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="s2" value="B" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="40" y="80" width="120" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="s1" value="A" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="40" y="120" width="120" height="40" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Queue (FIFO)

Horizontal arrangement with front/rear labels:

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="front" value="front →" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#B85450;fontSize=11;fontStyle=1;align=right;" vertex="1" parent="1">
      <mxGeometry x="0" y="48" width="55" height="24" as="geometry"/>
    </mxCell>
    <mxCell id="q1" value="A" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="60" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="q2" value="B" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="120" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="q3" value="C" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="180" y="40" width="60" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="rear" value="← rear" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#B85450;fontSize=11;fontStyle=1;align=left;" vertex="1" parent="1">
      <mxGeometry x="245" y="48" width="55" height="24" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## Binary Trees

### Binary Search Tree

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Root -->
    <mxCell id="n8" value="8" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="260" y="40" width="50" height="50" as="geometry"/>
    </mxCell>
    <!-- Level 1 -->
    <mxCell id="n3" value="3" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="140" y="130" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="n10" value="10" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="380" y="130" width="50" height="50" as="geometry"/>
    </mxCell>
    <!-- Level 2 -->
    <mxCell id="n1" value="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="80" y="220" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="n6" value="6" style="ellipse;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=16;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="200" y="220" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="n14" value="14" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="440" y="220" width="50" height="50" as="geometry"/>
    </mxCell>
    <!-- Edges -->
    <mxCell id="e1" style="strokeColor=#666666;strokeWidth=2;endArrow=none;" edge="1" source="n8" target="n3" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2" style="strokeColor=#666666;strokeWidth=2;endArrow=none;" edge="1" source="n8" target="n10" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e3" style="strokeColor=#666666;strokeWidth=2;endArrow=none;" edge="1" source="n3" target="n1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e4" style="strokeColor=#666666;strokeWidth=2;endArrow=none;" edge="1" source="n3" target="n6" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e5" style="strokeColor=#666666;strokeWidth=2;endArrow=none;" edge="1" source="n10" target="n14" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Node Style Variants

| Type | Style | Use |
|------|-------|-----|
| Default node | `ellipse;fillColor=#DAE8FC;strokeColor=#6C8EBF;` | Unvisited |
| Current / found | `ellipse;fillColor=#D5E8D4;strokeColor=#82B366;` | Highlight during traversal |
| Removed | `ellipse;fillColor=#F8CECC;strokeColor=#B85450;dashed=1;` | Deleted node |
| Null leaf | `ellipse;fillColor=#F5F5F5;strokeColor=#CCCCCC;fontColor=#CCCCCC;` | NIL sentinel |

### AVL Tree Annotations

Add balance factor as a superscript label above each node:

```xml
<mxCell id="bf" value="bf=+1" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#999999;fontSize=9;align=center;" vertex="1" parent="1">
  <mxGeometry x="250" y="24" width="70" height="16" as="geometry"/>
</mxCell>
```

---

## Heaps

### Min-Heap (Array-backed tree)

Show both the tree view and the underlying array. Use the same node IDs so the relationship is clear.

Tree layout is identical to BST above. Below the tree, add the array view:

```xml
<!-- Array representation -->
<mxCell id="arrLabel" value="&lt;b&gt;Array:&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#333;fontSize=12;align=right;" vertex="1" parent="1">
  <mxGeometry x="0" y="320" width="60" height="30" as="geometry"/>
</mxCell>
<mxCell id="h0" value="1" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=13;fontFamily=Consolas;" vertex="1" parent="1">
  <mxGeometry x="70" y="320" width="45" height="30" as="geometry"/>
</mxCell>
<mxCell id="h1" value="3" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;fontFamily=Consolas;" vertex="1" parent="1">
  <mxGeometry x="115" y="320" width="45" height="30" as="geometry"/>
</mxCell>
<mxCell id="h2" value="5" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=13;fontFamily=Consolas;" vertex="1" parent="1">
  <mxGeometry x="160" y="320" width="45" height="30" as="geometry"/>
</mxCell>
```

---

## Hash Tables

### Separate Chaining

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="title" value="&lt;b&gt;Hash Table (size=5, separate chaining)&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#333;fontSize=14;align=left;" vertex="1" parent="1">
      <mxGeometry x="20" y="10" width="400" height="24" as="geometry"/>
    </mxCell>
    <!-- Bucket 0 -->
    <mxCell id="b0" value="[0]" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#999999;fontSize=13;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="20" y="50" width="60" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="b0n1" value="&quot;apple&quot;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="120" y="50" width="80" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="b0e1" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="b0" target="b0n1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <!-- Bucket 1 (empty) -->
    <mxCell id="b1" value="[1]" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#999999;fontSize=13;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="20" y="96" width="60" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="b1null" value="null" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#CCCCCC;fontSize=11;fontFamily=Consolas;fontStyle=2;" vertex="1" parent="1">
      <mxGeometry x="120" y="104" width="40" height="20" as="geometry"/>
    </mxCell>
    <!-- Bucket 2 (chain of 2) -->
    <mxCell id="b2" value="[2]" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#999999;fontSize=13;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="20" y="142" width="60" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="b2n1" value="&quot;banana&quot;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="120" y="142" width="80" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="b2n2" value="&quot;grape&quot;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=12;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="240" y="142" width="80" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="b2e1" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="b2" target="b2n1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="b2e2" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="b2n1" target="b2n2" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Open Addressing (Linear Probing)

Use a single row of cells (like an array) with color coding:

| Color | Meaning |
|-------|---------|
| Blue (`#DAE8FC`) | Occupied — hashed to this index |
| Yellow (`#FFF2CC`) | Occupied — probed to this index (collision) |
| Gray (`#F5F5F5`) | Empty slot |
| Red (`#F8CECC`) | Tombstone (deleted) |

---

## Graphs

### Directed Graph (Adjacency Visualization)

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Vertices -->
    <mxCell id="vA" value="A" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="200" y="40" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="vB" value="B" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="80" y="160" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="vC" value="C" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="320" y="160" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="vD" value="D" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=16;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="200" y="280" width="50" height="50" as="geometry"/>
    </mxCell>
    <!-- Directed edges with weights -->
    <mxCell id="eAB" value="4" style="strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;fontColor=#B85450;fontSize=11;fontStyle=1;" edge="1" source="vA" target="vB" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="eAC" value="2" style="strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;fontColor=#B85450;fontSize=11;fontStyle=1;" edge="1" source="vA" target="vC" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="eBD" value="3" style="strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;fontColor=#B85450;fontSize=11;fontStyle=1;" edge="1" source="vB" target="vD" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="eCD" value="1" style="strokeColor=#666666;strokeWidth=2;endArrow=block;endFill=1;fontColor=#B85450;fontSize=11;fontStyle=1;" edge="1" source="vC" target="vD" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Undirected Graph

Same as directed but use `endArrow=none;startArrow=none;` on edges.

### Graph Traversal Coloring

Show BFS/DFS state with node colors:

| State | Fill | Meaning |
|-------|------|---------|
| Unvisited | `#DAE8FC` (blue) | Not yet discovered |
| In queue/stack | `#FFF2CC` (yellow) | Discovered, not processed |
| Processing | `#D5E8D4` (green) | Currently visiting |
| Completed | `#E6E6E6` (gray) | Fully processed |

---

## Tries

### Prefix Trie

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Root -->
    <mxCell id="root" value="" style="ellipse;whiteSpace=wrap;html=1;fillColor=#E6E6E6;strokeColor=#999;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="200" y="20" width="30" height="30" as="geometry"/>
    </mxCell>
    <!-- Level 1 -->
    <mxCell id="c" value="c" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="120" y="80" width="36" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="d" value="d" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="280" y="80" width="36" height="36" as="geometry"/>
    </mxCell>
    <!-- Level 2 -->
    <mxCell id="ca" value="a" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="80" y="150" width="36" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="co" value="o" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=14;fontFamily=Consolas;" vertex="1" parent="1">
      <mxGeometry x="160" y="150" width="36" height="36" as="geometry"/>
    </mxCell>
    <!-- Level 3 — word end nodes highlighted -->
    <mxCell id="cat" value="t" style="ellipse;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=14;fontFamily=Consolas;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="80" y="220" width="36" height="36" as="geometry"/>
    </mxCell>
    <!-- "cat" label -->
    <mxCell id="catLabel" value="&quot;cat&quot;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#82B366;fontSize=10;align=center;" vertex="1" parent="1">
      <mxGeometry x="68" y="258" width="60" height="16" as="geometry"/>
    </mxCell>
    <!-- Edges -->
    <mxCell id="erc" style="strokeColor=#666;strokeWidth=1;endArrow=none;" edge="1" source="root" target="c" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="erd" style="strokeColor=#666;strokeWidth=1;endArrow=none;" edge="1" source="root" target="d" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="eca" style="strokeColor=#666;strokeWidth=1;endArrow=none;" edge="1" source="c" target="ca" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="eco" style="strokeColor=#666;strokeWidth=1;endArrow=none;" edge="1" source="c" target="co" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="ecat" style="strokeColor=#666;strokeWidth=1;endArrow=none;" edge="1" source="ca" target="cat" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

Green nodes (`#D5E8D4`) mark word endings (`isEnd=true`).

---

## Layout Tips

1. **Consistent spacing** — Use 8px grid; tree levels at 80-100px vertical intervals
2. **Color meaning** — Pick a legend and stick to it (blue=default, green=active, red=removed, yellow=visited)
3. **Monospace font** — Always `fontFamily=Consolas;` for data values
4. **Index labels** — Use small italic gray text above/below cells
5. **Pointer arrows** — `strokeWidth=2;endArrow=block;endFill=1;` for linked structures
6. **Animation frames** — Use draw.io pages for step-by-step algorithm visualization (page 1: initial, page 2: step 1, etc.)
7. **Null sentinels** — Gray fill, dashed stroke, `null` or `∅` text
