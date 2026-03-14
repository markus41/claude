---
description: "Comprehensive guide to all diagram types with selection criteria, notation rules, and draw.io implementation"
triggers:
  - diagram type
  - flowchart
  - uml
  - bpmn
  - c4
  - erd
  - sequence
  - architecture
  - network
  - kubernetes
  - cloud diagram
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
---

# Diagram Types Reference

## Quick Selection Guide

| Need | Diagram Type | Complexity |
|------|-------------|------------|
| Show a process/workflow | Flowchart | Low |
| Model classes and relationships | UML Class | Medium |
| Show message flows over time | UML Sequence | Medium |
| Model object lifecycle | UML State | Medium |
| Show parallel/concurrent flows | UML Activity | Medium |
| Show system modules | UML Component | Medium |
| Show infrastructure layout | UML Deployment | Medium |
| Show user interactions | UML Use Case | Low |
| Describe architecture at scale | C4 Model | Low-High |
| Model business processes | BPMN 2.0 | High |
| Design database schema | ER Diagram | Medium |
| Map network topology | Network Diagram | Medium |
| Document cloud infrastructure | Cloud Architecture | Medium |
| Show Kubernetes resources | Kubernetes Diagram | Medium |
| Brainstorm ideas | Mindmap | Low |
| Show reporting structure | Org Chart | Low |
| Plan project timeline | Gantt Chart | Medium |
| Show cross-team processes | Swimlane | Medium |
| Analyze security threats | Threat Model | High |

---

## Flowcharts

### When to Use
Process documentation, decision logic, algorithms, onboarding guides, troubleshooting trees.

### Shapes and Notation

| Shape | Style | Meaning |
|-------|-------|---------|
| Rounded rectangle | `rounded=1;whiteSpace=wrap;html=1;` | Process / action step |
| Diamond | `rhombus;` | Decision (Yes/No branching) |
| Oval / stadium | `ellipse;` | Terminator (start/end) |
| Parallelogram | `shape=parallelogram;perimeter=parallelogramPerimeter;` | Input/Output |
| Rectangle | (default) | Generic step |
| Cylinder | `shape=cylinder3;` | Database / data store |
| Document | `shape=document;` | Document / report |
| Predefined process | `shape=process;` | Subroutine / predefined process |

### Swimlane Variant

Horizontal or vertical lanes partition a flowchart by role or department:

```xml
<mxCell id="lane1" value="Frontend" style="swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
  <mxGeometry x="0" y="0" width="300" height="400" as="geometry"/>
</mxCell>
<mxCell id="lane2" value="Backend" style="swimlane;startSize=30;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
  <mxGeometry x="300" y="0" width="300" height="400" as="geometry"/>
</mxCell>
```

### Minimal XML Example

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="start" value="Start" style="ellipse;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="160" y="20" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="step1" value="Process Request" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="130" y="100" width="140" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="dec1" value="Approved?" style="rhombus;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="150" y="200" width="100" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="end" value="End" style="ellipse;fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
      <mxGeometry x="160" y="330" width="80" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="start" target="step1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e2" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="step1" target="dec1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="e3" value="Yes" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="dec1" target="end" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## UML Class Diagrams

### When to Use
Object-oriented design, domain modeling, API contracts, data model documentation.

### Notation

| Element | Representation |
|---------|---------------|
| Class | Rectangle with 3 compartments: name, attributes, methods |
| Abstract class | Name in italics |
| Interface | `<<interface>>` stereotype |
| Visibility | `+` public, `-` private, `#` protected, `~` package |
| Static member | Underlined |

### Relationship Types

| Relationship | Arrow Style | draw.io Style |
|-------------|-------------|---------------|
| Inheritance (extends) | Solid line, hollow triangle | `endArrow=block;endFill=0;` |
| Interface (implements) | Dashed line, hollow triangle | `endArrow=block;endFill=0;dashed=1;` |
| Association | Solid line, open arrow | `endArrow=open;endFill=0;` |
| Directed association | Solid line, filled arrow | `endArrow=open;endFill=1;` |
| Aggregation | Solid line, hollow diamond at parent | `startArrow=diamond;startFill=0;endArrow=none;` |
| Composition | Solid line, filled diamond at parent | `startArrow=diamond;startFill=1;endArrow=none;` |
| Dependency | Dashed line, open arrow | `dashed=1;endArrow=open;endFill=0;` |

### Multiplicity Labels

Place as edge labels: `0..1`, `1`, `0..*`, `1..*`, `*`

### draw.io Class Shape

```xml
<mxCell id="cls1" value="&lt;p style='margin:0;padding:4px;font-weight:bold;border-bottom:1px solid #666;'&gt;User&lt;/p&gt;&lt;p style='margin:0;padding:4px;text-align:left;border-bottom:1px solid #ccc;'&gt;- id: Long&lt;br/&gt;- name: String&lt;br/&gt;- email: String&lt;/p&gt;&lt;p style='margin:0;padding:4px;text-align:left;'&gt;+ getName(): String&lt;br/&gt;+ setEmail(e: String)&lt;/p&gt;"
  style="verticalAlign=top;align=center;overflow=fill;html=1;whiteSpace=wrap;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="200" height="150" as="geometry"/>
</mxCell>
```

---

## UML Sequence Diagrams

### When to Use
API call flows, authentication sequences, microservice communication, protocol documentation.

### Notation

| Element | Style |
|---------|-------|
| Lifeline | `shape=umlLifeline;perimeter=lifelinePerimeter;container=1;collapsible=0;recursiveResize=0;size=40;` |
| Activation box | Narrow filled rectangle on lifeline |
| Sync message | Solid line, filled arrowhead: `endArrow=block;endFill=1;` |
| Async message | Solid line, open arrowhead: `endArrow=async;endFill=0;` or `endArrow=open;endFill=0;` |
| Return message | Dashed line, open arrowhead: `dashed=1;endArrow=open;endFill=0;` |
| Self-call | Loop back to same lifeline |
| Create message | Dashed line to new lifeline: `dashed=1;endArrow=open;endFill=1;` |
| Destroy | X marker: `shape=umlDestroy;` |

### Combined Fragments

| Fragment | Meaning | Style |
|----------|---------|-------|
| `alt` | Alternative (if/else) | `shape=umlFrame;` with label `alt` |
| `opt` | Optional (if without else) | `shape=umlFrame;` with label `opt` |
| `loop` | Loop/iteration | `shape=umlFrame;` with label `loop` |
| `par` | Parallel execution | `shape=umlFrame;` with label `par` |
| `break` | Break from enclosing fragment | `shape=umlFrame;` with label `break` |
| `critical` | Critical region | `shape=umlFrame;` with label `critical` |

### Minimal Example

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="client" value=":Client" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;size=40;" vertex="1" parent="1">
      <mxGeometry x="80" y="20" width="100" height="300" as="geometry"/>
    </mxCell>
    <mxCell id="server" value=":Server" style="shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;size=40;" vertex="1" parent="1">
      <mxGeometry x="280" y="20" width="100" height="300" as="geometry"/>
    </mxCell>
    <mxCell id="msg1" value="request()" style="endArrow=block;endFill=1;" edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="130" y="90" as="sourcePoint"/>
        <mxPoint x="325" y="90" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
    <mxCell id="msg2" value="response" style="endArrow=open;endFill=0;dashed=1;" edge="1" parent="1">
      <mxGeometry relative="1" as="geometry">
        <mxPoint x="325" y="150" as="sourcePoint"/>
        <mxPoint x="130" y="150" as="targetPoint"/>
      </mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## UML State Diagrams

### When to Use
Object lifecycle modeling, protocol states, UI navigation flows, workflow status tracking.

### Notation

| Element | Style |
|---------|-------|
| State | `rounded=1;whiteSpace=wrap;html=1;arcSize=20;` |
| Initial state | `ellipse;fillColor=#000000;strokeColor=#000000;` (small black circle) |
| Final state | `shape=doubleCircle;fillColor=#000000;strokeColor=#000000;` |
| Transition | Edge with label `event [guard] / action` |
| Composite state | Container with nested states |
| Fork/join bar | `shape=line;strokeWidth=4;fillColor=#000000;` |
| Choice | `rhombus;fillColor=#000000;fontSize=0;` (small diamond) |
| History | Circle with H: `ellipse;` with label `H` |

### Example

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="init" value="" style="ellipse;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="200" y="20" width="20" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="idle" value="Idle" style="rounded=1;whiteSpace=wrap;html=1;arcSize=20;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
      <mxGeometry x="160" y="80" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="active" value="Active" style="rounded=1;whiteSpace=wrap;html=1;arcSize=20;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
      <mxGeometry x="160" y="200" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="final" value="" style="shape=doubleCircle;fillColor=#000000;strokeColor=#000000;" vertex="1" parent="1">
      <mxGeometry x="195" y="320" width="30" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="t1" style="" edge="1" source="init" target="idle" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="t2" value="start()" style="" edge="1" source="idle" target="active" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="t3" value="stop()" style="" edge="1" source="active" target="final" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## UML Activity Diagrams

### When to Use
Business process modeling, algorithm visualization, parallel workflow documentation, use case elaboration.

### Notation

| Element | Style |
|---------|-------|
| Action | `rounded=1;whiteSpace=wrap;html=1;` |
| Initial node | `ellipse;fillColor=#000000;` (small black circle) |
| Final node | `shape=doubleCircle;fillColor=#000000;` |
| Decision/Merge | `rhombus;fillColor=#fff2cc;strokeColor=#d6b656;` |
| Fork/Join | `shape=line;strokeWidth=4;fillColor=#000000;direction=south;` (horizontal bar) |
| Swimlane | `swimlane;startSize=30;` |
| Object node | `shape=note;` |
| Signal send | `shape=offPageConnector;direction=east;` |
| Signal receive | `shape=offPageConnector;direction=west;` |

---

## UML Component Diagrams

### When to Use
System decomposition, module dependencies, service boundaries, package structure.

### Notation

| Element | Style |
|---------|-------|
| Component | `shape=component;align=left;spacingLeft=36;` |
| Interface (provided) | Small circle: `ellipse;aspect=fixed;` (size ~16x16) |
| Interface (required) | Half circle: `shape=requiredInterface;` |
| Port | Small square on component border |
| Dependency | `dashed=1;endArrow=open;endFill=0;` |
| Assembly | Socket + ball connection |

---

## UML Deployment Diagrams

### When to Use
Infrastructure documentation, server topology, runtime environments, physical/virtual mapping.

### Notation

| Element | Style |
|---------|-------|
| Node (server/device) | `shape=cube;whiteSpace=wrap;` |
| Execution environment | `shape=cube;fillColor=#dae8fc;` |
| Artifact | `shape=note;` |
| Communication path | Solid line between nodes |
| Deployment specification | `shape=note;dashed=1;` |

---

## UML Use Case Diagrams

### When to Use
Requirements capture, system boundary definition, actor identification, feature scoping.

### Notation

| Element | Style |
|---------|-------|
| Actor | `shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;` |
| Use case | `ellipse;whiteSpace=wrap;html=1;` |
| System boundary | `swimlane;container=1;collapsible=0;` (rectangle) |
| Association | Solid line: `endArrow=none;` |
| Include | `dashed=1;endArrow=open;` with label `<<include>>` |
| Extend | `dashed=1;endArrow=open;` with label `<<extend>>` |
| Generalization | `endArrow=block;endFill=0;` |

---

## C4 Model

### When to Use
Progressive architecture documentation at four levels of abstraction. Recommended for system documentation.

### Level 1: System Context

Shows the system and its relationships with users and external systems.

| Element | Style | Color |
|---------|-------|-------|
| Person | `shape=mxgraph.c4.person2;` | Blue `#08427B` |
| Software System | `rounded=1;` | Blue `#1168BD` (internal), Gray `#999999` (external) |
| Relationship | `endArrow=block;endFill=1;` | |

### Level 2: Container

Shows the high-level technology choices inside a system.

| Element | Style | Color |
|---------|-------|-------|
| Container (Web App) | `rounded=1;` | Blue `#438DD5` |
| Container (Database) | `shape=cylinder3;` | Blue `#438DD5` |
| Container (API) | `rounded=1;` | Blue `#438DD5` |
| System boundary | `swimlane;container=1;dashed=1;` | |

### Level 3: Component

Shows the components within a container.

| Element | Style | Color |
|---------|-------|-------|
| Component | `rounded=1;` | Light blue `#85BBF0` |

### Level 4: Code

UML class diagrams for individual components. Use standard UML Class notation.

### C4 Label Format

All C4 elements use a standard label format:
```
[Name]
[Technology]
Description
```

### Minimal C4 Context Example

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="user" value="&lt;b&gt;Customer&lt;/b&gt;&lt;br&gt;[Person]&lt;br&gt;&lt;br&gt;Uses the system to manage orders" style="shape=mxgraph.c4.person2;whiteSpace=wrap;html=1;fontSize=11;fillColor=#08427B;fontColor=#ffffff;strokeColor=#073B6F;" vertex="1" parent="1">
      <mxGeometry x="180" y="20" width="140" height="140" as="geometry"/>
    </mxCell>
    <mxCell id="system" value="&lt;b&gt;Order System&lt;/b&gt;&lt;br&gt;[Software System]&lt;br&gt;&lt;br&gt;Manages customer orders and fulfillment" style="rounded=1;whiteSpace=wrap;html=1;fontSize=11;fillColor=#1168BD;fontColor=#ffffff;strokeColor=#0B4884;" vertex="1" parent="1">
      <mxGeometry x="150" y="230" width="200" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="ext" value="&lt;b&gt;Email System&lt;/b&gt;&lt;br&gt;[External System]&lt;br&gt;&lt;br&gt;Sends notification emails" style="rounded=1;whiteSpace=wrap;html=1;fontSize=11;fillColor=#999999;fontColor=#ffffff;strokeColor=#6C6C6C;" vertex="1" parent="1">
      <mxGeometry x="420" y="230" width="200" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="r1" value="Places orders using" style="endArrow=block;endFill=1;html=1;fontSize=10;" edge="1" source="user" target="system" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="r2" value="Sends emails via" style="endArrow=block;endFill=1;html=1;fontSize=10;" edge="1" source="system" target="ext" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## BPMN 2.0

### When to Use
Formal business process modeling, process automation, cross-organizational workflows, compliance documentation.

### Events

| Event | Start Style | Intermediate Style | End Style |
|-------|------------|-------------------|-----------|
| None | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.ellipsePerimeter;symbol=general;` | (double border) | (thick border, filled) |
| Message | `symbol=message;` | `symbol=message;isInterrupting=0;` | `symbol=message;` |
| Timer | `symbol=timer;` | `symbol=timer;` | N/A |
| Error | N/A | N/A | `symbol=error;` |
| Escalation | N/A | `symbol=escalation;` | `symbol=escalation;` |
| Signal | `symbol=signal;` | `symbol=signal;` | `symbol=signal;` |
| Terminate | N/A | N/A | `symbol=terminate;` |

### Activities

| Activity | Style |
|----------|-------|
| Task | `shape=mxgraph.bpmn.task;taskMarker=abstract;` |
| User Task | `shape=mxgraph.bpmn.task;taskMarker=user;` |
| Service Task | `shape=mxgraph.bpmn.task;taskMarker=service;` |
| Script Task | `shape=mxgraph.bpmn.task;taskMarker=script;` |
| Send Task | `shape=mxgraph.bpmn.task;taskMarker=send;` |
| Receive Task | `shape=mxgraph.bpmn.task;taskMarker=receive;` |
| Business Rule | `shape=mxgraph.bpmn.task;taskMarker=businessRule;` |
| Subprocess | `shape=mxgraph.bpmn.task;taskMarker=abstract;isGroup=1;` |

### Gateways

| Gateway | Style | Meaning |
|---------|-------|---------|
| Exclusive (XOR) | `shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.rhombusPerimeter;symbol=exclusiveGw;` | One path taken |
| Parallel (AND) | `symbol=parallelGw;` | All paths taken |
| Inclusive (OR) | `symbol=inclusiveGw;` | One or more paths |
| Event-based | `symbol=eventGw;` | Wait for event |
| Complex | `symbol=complexGw;` | Custom condition |

### Flows

| Flow | Style |
|------|-------|
| Sequence flow | Solid line with filled arrow |
| Message flow | Dashed line with open arrow |
| Association | Dotted line, no arrow |

### Pools and Lanes

```xml
<mxCell id="pool1" value="Customer" style="shape=mxgraph.bpmn.shape;perimeter=mxPerimeter.rectanglePerimeter;swimlane;isGroup=1;horizontal=0;startSize=30;" vertex="1" parent="1">
  <mxGeometry x="50" y="50" width="800" height="200" as="geometry"/>
</mxCell>
```

---

## ER Diagrams

### When to Use
Database schema design, data modeling, relationship documentation.

### Chen Notation

| Element | Shape | Style |
|---------|-------|-------|
| Entity | Rectangle | `rounded=0;whiteSpace=wrap;html=1;` |
| Weak entity | Double-bordered rectangle | `rounded=0;strokeWidth=2;double=1;` |
| Attribute | Ellipse | `ellipse;` |
| Key attribute | Underlined ellipse | `ellipse;fontStyle=4;` |
| Derived attribute | Dashed ellipse | `ellipse;dashed=1;` |
| Multi-valued | Double-bordered ellipse | `ellipse;strokeWidth=2;double=1;` |
| Relationship | Diamond | `rhombus;` |

### Crow's Foot Notation (recommended)

Use edge arrows for cardinality:

| Cardinality | Start Arrow | End Arrow |
|-------------|-------------|-----------|
| One (mandatory) | `ERmandOne` | |
| One (optional) | `ERzeroToOne` | |
| Many (mandatory) | `ERoneToMany` | |
| Many (optional) | `ERzeroToMany` | |

Style: `edgeStyle=entityRelationEdgeStyle;endArrow=ERzeroToMany;startArrow=ERmandOne;endFill=0;startFill=0;`

### Table-Style Entity

```xml
<mxCell id="users" value="users" style="shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="180" height="120" as="geometry"/>
</mxCell>
```

---

## Network Diagrams

### When to Use
Network topology documentation, infrastructure planning, security zone mapping, troubleshooting.

### Common Shapes

| Device | Style |
|--------|-------|
| Router | `shape=mxgraph.cisco.routers.router;` |
| Switch | `shape=mxgraph.cisco.switches.workgroup_switch;` |
| Firewall | `shape=mxgraph.cisco.firewalls.firewall;` |
| Server | `shape=mxgraph.cisco.servers.standard_server;` |
| Workstation | `shape=mxgraph.cisco.computers_and_peripherals.pc;` |
| Cloud | `shape=cloud;` |
| Wireless AP | `shape=mxgraph.cisco.wireless.access_point;` |
| Load Balancer | `shape=mxgraph.cisco.misc.load_balancer;` |

### Conventions
- Use containers for network zones (DMZ, LAN, WAN)
- Color-code by security zone (red=untrusted, green=trusted, yellow=DMZ)
- Label connections with protocol/port info
- Show IP addresses as labels or metadata

---

## Cloud Architecture Diagrams

### When to Use
Cloud infrastructure documentation, solution architecture, cost estimation visuals, migration planning.

### AWS Architecture

| Service | Shape |
|---------|-------|
| EC2 | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2;` |
| S3 | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.s3;` |
| Lambda | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda;` |
| RDS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds;` |
| DynamoDB | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.dynamodb;` |
| VPC | `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.vpc;container=1;` |
| Region | `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.region;container=1;dashed=1;` |
| AZ | `shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.availability_zone;container=1;` |
| CloudFront | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.cloudfront;` |
| API Gateway | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.api_gateway;` |
| SQS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sqs;` |
| SNS | `shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.sns;` |

**AWS Group Colors:**
- VPC: Green border `#248814`
- Region: Blue border `#147EBA`
- AZ: Blue border `#147EBA` (dashed)
- Public subnet: Green fill `#E9F3E6`
- Private subnet: Blue fill `#E6F2F8`

### Azure Architecture

| Service | Shape |
|---------|-------|
| App Service | `shape=mxgraph.azure.app_service;` |
| Azure Functions | `shape=mxgraph.azure.azure_functions;` |
| SQL Database | `shape=mxgraph.azure.sql_database;` |
| Blob Storage | `shape=mxgraph.azure.storage_blob;` |
| VM | `shape=mxgraph.azure.virtual_machine;` |
| AKS | `shape=mxgraph.azure.kubernetes_services;` |
| Azure AD | `shape=mxgraph.azure.azure_active_directory;` |
| Key Vault | `shape=mxgraph.azure.key_vaults;` |

### GCP Architecture

| Service | Shape |
|---------|-------|
| Compute Engine | `shape=mxgraph.gcp2.compute_engine;` |
| Cloud Storage | `shape=mxgraph.gcp2.cloud_storage;` |
| Cloud Functions | `shape=mxgraph.gcp2.cloud_functions;` |
| Cloud SQL | `shape=mxgraph.gcp2.cloud_sql;` |
| GKE | `shape=mxgraph.gcp2.google_kubernetes_engine;` |
| Pub/Sub | `shape=mxgraph.gcp2.cloud_pub_sub;` |
| BigQuery | `shape=mxgraph.gcp2.bigquery;` |

---

## Kubernetes Diagrams

### When to Use
Cluster architecture, deployment topology, service mesh visualization, resource planning.

### Common Shapes

| Resource | Shape |
|----------|-------|
| Pod | `shape=mxgraph.kubernetes.pod;` |
| Service | `shape=mxgraph.kubernetes.svc;` |
| Deployment | `shape=mxgraph.kubernetes.deploy;` |
| ReplicaSet | `shape=mxgraph.kubernetes.rs;` |
| Ingress | `shape=mxgraph.kubernetes.ing;` |
| ConfigMap | `shape=mxgraph.kubernetes.cm;` |
| Secret | `shape=mxgraph.kubernetes.secret;` |
| Namespace | `shape=mxgraph.kubernetes.ns;` (use as container) |
| Node | `shape=mxgraph.kubernetes.node;` |
| PersistentVolume | `shape=mxgraph.kubernetes.pv;` |
| PersistentVolumeClaim | `shape=mxgraph.kubernetes.pvc;` |
| StatefulSet | `shape=mxgraph.kubernetes.sts;` |
| DaemonSet | `shape=mxgraph.kubernetes.ds;` |
| Job | `shape=mxgraph.kubernetes.job;` |
| CronJob | `shape=mxgraph.kubernetes.cronjob;` |

### Conventions
- Group resources by namespace (use containers)
- Color nodes by role (master=blue, worker=green)
- Show traffic flow with labeled edges (port numbers, protocols)
- Use dashed lines for service discovery / DNS

---

## Mindmaps

### When to Use
Brainstorming, knowledge organization, meeting notes, feature exploration.

### draw.io Implementation
Use the mindmap layout feature or manually create branching trees:

```xml
<mxCell id="center" value="Main Topic" style="ellipse;fillColor=#1ba1e2;fontColor=#ffffff;fontStyle=1;fontSize=16;" vertex="1" parent="1">
  <mxGeometry x="300" y="200" width="160" height="80" as="geometry"/>
</mxCell>
<mxCell id="branch1" value="Branch 1" style="rounded=1;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="1">
  <mxGeometry x="100" y="80" width="120" height="40" as="geometry"/>
</mxCell>
<mxCell id="eb1" style="curved=1;endArrow=none;" edge="1" source="center" target="branch1" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

- Use distinct colors per top-level branch
- Curved edges (`curved=1;endArrow=none;`)
- Decreasing font size for deeper levels

---

## Org Charts

### When to Use
Organizational structure, team composition, reporting lines, role definitions.

### draw.io Implementation
Use tree layout with hierarchical shapes:

```xml
<mxCell id="ceo" value="&lt;b&gt;Jane Smith&lt;/b&gt;&lt;br&gt;CEO" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#1ba1e2;fontColor=#ffffff;strokeColor=#006EAF;" vertex="1" parent="1">
  <mxGeometry x="250" y="20" width="140" height="60" as="geometry"/>
</mxCell>
<mxCell id="cto" value="&lt;b&gt;Bob Lee&lt;/b&gt;&lt;br&gt;CTO" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
  <mxGeometry x="100" y="130" width="140" height="60" as="geometry"/>
</mxCell>
<mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;endArrow=none;" edge="1" source="ceo" target="cto" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

- No arrows on edges (`endArrow=none;`)
- Use `edgeStyle=orthogonalEdgeStyle` for clean right-angle lines
- Color-code by department

---

## Gantt Charts

### When to Use
Project timeline visualization, milestone tracking, dependency mapping, resource planning.

### draw.io Implementation
Build as a table with bars:

- Use a table/grid container for the timeline
- Draw colored rectangles for task bars
- Use arrows between bars for dependencies
- Add diamond shapes for milestones
- Label time axis with dates/weeks/sprints

---

## Swimlane Diagrams

### When to Use
Cross-functional processes, handoff documentation, responsibility assignment, workflow optimization.

### Horizontal Swimlanes

```xml
<mxCell id="pool" value="" style="shape=table;startSize=0;container=1;collapsible=0;childLayout=tableLayout;" vertex="1" parent="1">
  <mxGeometry x="50" y="50" width="700" height="400" as="geometry"/>
</mxCell>
<mxCell id="lane1" value="Customer" style="swimlane;horizontal=0;startSize=40;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="pool">
  <mxGeometry y="0" width="700" height="130" as="geometry"/>
</mxCell>
<mxCell id="lane2" value="Support" style="swimlane;horizontal=0;startSize=40;fillColor=#d5e8d4;strokeColor=#82b366;" vertex="1" parent="pool">
  <mxGeometry y="130" width="700" height="130" as="geometry"/>
</mxCell>
<mxCell id="lane3" value="Engineering" style="swimlane;horizontal=0;startSize=40;fillColor=#fff2cc;strokeColor=#d6b656;" vertex="1" parent="pool">
  <mxGeometry y="260" width="700" height="140" as="geometry"/>
</mxCell>
```

---

## Threat Model Diagrams (STRIDE / DFD)

### When to Use
Security analysis, threat identification, data flow security review, compliance documentation.

### Data Flow Diagram Elements

| Element | Style | Meaning |
|---------|-------|---------|
| Process | `ellipse;` (numbered circle) | Code that transforms data |
| Data Store | Two horizontal lines | Storage (DB, file, cache) |
| External Entity | Rectangle | Outside system boundary |
| Data Flow | Arrow with label | Data movement |
| Trust Boundary | `dashed=1;dashPattern=8 4;strokeColor=#FF0000;strokeWidth=2;` | Security perimeter |

### Style for Trust Boundary

```xml
<mxCell id="tb1" value="Trust Boundary" style="rounded=1;dashed=1;dashPattern=8 4;strokeColor=#FF0000;strokeWidth=2;fillColor=none;container=1;collapsible=0;fontColor=#FF0000;verticalAlign=top;" vertex="1" parent="1">
  <mxGeometry x="100" y="100" width="400" height="300" as="geometry"/>
</mxCell>
```

### STRIDE Categories

Label threats on data flows:
- **S**poofing (identity)
- **T**ampering (data integrity)
- **R**epudiation (traceability)
- **I**nformation Disclosure (confidentiality)
- **D**enial of Service (availability)
- **E**levation of Privilege (authorization)
