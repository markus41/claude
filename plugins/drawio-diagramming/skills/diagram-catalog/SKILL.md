---
description: "Master reference catalog of 190+ diagram types organized by category with selection guide, complexity ratings, stencil references, and XML examples"
triggers:
  - diagram catalog
  - diagram types
  - what diagram
  - which diagram
  - diagram reference
  - all diagrams
  - diagram list
  - type selection
  - diagram picker
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
---

# Master Diagram Reference Catalog

This is the definitive catalog of every diagram type that can be created with draw.io.
Use this to select the right diagram for any situation.

## Quick Selection Matrix

| # | Category | Diagram Type | Complexity | Best For | Stencils |
|---|----------|-------------|------------|----------|----------|
| 1 | Process | Flowchart | Low | Decision logic, algorithms | built-in |
| 2 | Process | Swimlane / Cross-Functional | Medium | Multi-role workflows | built-in |
| 3 | Process | BPMN 2.0 | High | Formal business processes | mxgraph.bpmn.* |
| 4 | Process | Decision Tree | Low | Branch analysis, classification | built-in |
| 5 | Process | Decision Table | Medium | Multi-criteria evaluation | built-in |
| 6 | Process | Event-Driven Process Chain (EPC) | High | SAP/enterprise processes | built-in |
| 7 | Process | Value Stream Map | High | Lean manufacturing flow | mxgraph.lean_mapping.* |
| 8 | Process | SIPOC Diagram | Medium | Process inputs/outputs | built-in |
| 9 | Process | Workflow Diagram | Low | Task sequences | built-in |
| 10 | Process | Algorithm Visualization | Medium | Step-by-step code logic | built-in |
| 11 | Process | CI/CD Pipeline Flow | Medium | Build/test/deploy pipelines | built-in |
| 12 | Process | Approval Flow | Low | Sign-off chains | built-in |
| 13 | Process | Escalation Flow | Low | Incident escalation paths | built-in |
| 14 | UML-Structural | Class Diagram | Medium | OOP design, domain models | mxgraph.uml.* |
| 15 | UML-Structural | Object Diagram | Medium | Instance snapshots | mxgraph.uml.* |
| 16 | UML-Structural | Component Diagram | Medium | Module decomposition | mxgraph.uml.* |
| 17 | UML-Structural | Deployment Diagram | Medium | Runtime topology | mxgraph.uml.* |
| 18 | UML-Structural | Package Diagram | Low | Namespace organization | mxgraph.uml.* |
| 19 | UML-Structural | Composite Structure | High | Internal connectors | mxgraph.uml.* |
| 20 | UML-Structural | Profile Diagram | High | Stereotype definitions | mxgraph.uml.* |
| 21 | UML-Behavioral | Sequence Diagram | Medium | Message flows over time | mxgraph.uml.* |
| 22 | UML-Behavioral | Activity Diagram | Medium | Parallel/concurrent flows | mxgraph.uml.* |
| 23 | UML-Behavioral | State Machine Diagram | Medium | Object lifecycle | mxgraph.uml.* |
| 24 | UML-Behavioral | Use Case Diagram | Low | User interactions | mxgraph.uml.* |
| 25 | UML-Behavioral | Communication Diagram | Medium | Object collaboration | mxgraph.uml.* |
| 26 | UML-Behavioral | Interaction Overview | High | Activity + sequence hybrid | mxgraph.uml.* |
| 27 | UML-Behavioral | Timing Diagram | High | Time-constrained behavior | mxgraph.uml.* |
| 28 | Architecture | C4 Context | Low | System boundary & actors | mxgraph.c4.* |
| 29 | Architecture | C4 Container | Medium | Service/app decomposition | mxgraph.c4.* |
| 30 | Architecture | C4 Component | Medium | Internal module structure | mxgraph.c4.* |
| 31 | Architecture | C4 Code | High | Class-level within component | mxgraph.c4.* + uml |
| 32 | Architecture | C4 Deployment | Medium | Infrastructure mapping | mxgraph.c4.* |
| 33 | Architecture | ArchiMate Business | High | Business layer modeling | mxgraph.archimate3.* |
| 34 | Architecture | ArchiMate Application | High | Application layer | mxgraph.archimate3.* |
| 35 | Architecture | ArchiMate Technology | High | Technology/infra layer | mxgraph.archimate3.* |
| 36 | Architecture | ArchiMate Strategy | High | Capabilities & resources | mxgraph.archimate3.* |
| 37 | Architecture | ArchiMate Implementation | High | Migration planning | mxgraph.archimate3.* |
| 38 | Architecture | TOGAF Architecture Vision | High | Enterprise architecture | mxgraph.archimate3.* |
| 39 | Architecture | 4+1 Architectural View | High | Multi-viewpoint design | built-in |
| 40 | Architecture | Hexagonal / Ports & Adapters | Medium | Clean boundaries | built-in |
| 41 | Architecture | Onion / Clean Architecture | Medium | Dependency inversion layers | built-in |
| 42 | Architecture | Microservices Map | Medium | Service topology & comms | built-in |
| 43 | Architecture | Event-Driven Architecture | Medium | Producers, brokers, consumers | built-in |
| 44 | Architecture | CQRS / Event Sourcing | High | Read/write path separation | built-in |
| 45 | Architecture | DDD Context Map | Medium | Bounded context relationships | built-in |
| 46 | Architecture | Service Mesh Topology | High | Sidecar proxy routing | mxgraph.kubernetes.* |
| 47 | Data | ER Diagram (Chen) | Medium | Academic data modeling | mxgraph.er.* |
| 48 | Data | ER Diagram (Crow's Foot) | Medium | Practical DB design | mxgraph.er.* |
| 49 | Data | ER Diagram (IDEF1X) | High | Government/defense DB | mxgraph.er.* |
| 50 | Data | Star Schema | Medium | Data warehouse fact/dimension | mxgraph.er.* |
| 51 | Data | Snowflake Schema | Medium | Normalized warehouse | mxgraph.er.* |
| 52 | Data | DFD Level 0 (Context) | Low | System data boundaries | built-in |
| 53 | Data | DFD Level 1-2 | Medium | Detailed data flows | built-in |
| 54 | Data | JSON Schema Diagram | Medium | API contract visualization | built-in |
| 55 | Data | GraphQL Schema Diagram | Medium | Type system visualization | built-in |
| 56 | Data | Protocol Buffer Diagram | Medium | Message/service definitions | built-in |
| 57 | Data | OpenAPI Endpoint Map | Medium | REST API route tree | built-in |
| 58 | Data | Data Lineage / Pipeline | Medium | ETL data provenance | built-in |
| 59 | Data | Data Warehouse Architecture | High | Ingestion to analytics | built-in |
| 60 | Data | Master Data Management Map | High | Golden record topology | built-in |
| 61 | DataStruct | Array / Vector | Low | Indexed sequential storage | built-in |
| 62 | DataStruct | Linked List (Singly) | Low | Node-pointer chains | built-in |
| 63 | DataStruct | Linked List (Doubly) | Low | Bidirectional traversal | built-in |
| 64 | DataStruct | Linked List (Circular) | Low | Ring buffers | built-in |
| 65 | DataStruct | Stack (LIFO) | Low | Push/pop operations | built-in |
| 66 | DataStruct | Queue / Deque | Low | FIFO operations | built-in |
| 67 | DataStruct | Priority Queue | Low | Heap-backed ordering | built-in |
| 68 | DataStruct | Binary Tree | Medium | Hierarchical structure | built-in |
| 69 | DataStruct | Binary Search Tree | Medium | Sorted tree operations | built-in |
| 70 | DataStruct | AVL Tree | Medium | Self-balancing BST | built-in |
| 71 | DataStruct | Red-Black Tree | Medium | Balanced with coloring | built-in |
| 72 | DataStruct | B-Tree / B+ Tree | High | Database index structure | built-in |
| 73 | DataStruct | Trie (Prefix Tree) | Medium | String matching | built-in |
| 74 | DataStruct | Heap (Min/Max) | Medium | Priority structure | built-in |
| 75 | DataStruct | Hash Table / Hash Map | Medium | Key-value with hashing | built-in |
| 76 | DataStruct | Graph (Directed) | Medium | Relationships with direction | built-in |
| 77 | DataStruct | Graph (Undirected) | Medium | Symmetric relationships | built-in |
| 78 | DataStruct | Graph (Weighted) | Medium | Cost/distance edges | built-in |
| 79 | DataStruct | DAG | Medium | Dependency ordering | built-in |
| 80 | DataStruct | Skip List | High | Probabilistic search | built-in |
| 81 | DataStruct | Bloom Filter | High | Probabilistic membership | built-in |
| 82 | DataStruct | Segment Tree | High | Range query structure | built-in |
| 83 | Network | Physical Topology (Star) | Low | Hub-and-spoke network | mxgraph.cisco.* |
| 84 | Network | Physical Topology (Mesh) | Medium | Fully connected network | mxgraph.cisco.* |
| 85 | Network | Physical Topology (Ring) | Low | Token-ring networks | mxgraph.cisco.* |
| 86 | Network | Physical Topology (Bus) | Low | Shared backbone | mxgraph.cisco.* |
| 87 | Network | Physical Topology (Hybrid) | Medium | Mixed topology | mxgraph.cisco.* |
| 88 | Network | Logical Network Topology | Medium | Protocol/VLAN view | mxgraph.cisco.* |
| 89 | Network | VLAN Segmentation | Medium | Virtual LAN boundaries | mxgraph.cisco.* |
| 90 | Network | DMZ Architecture | Medium | Security zones | mxgraph.cisco.* |
| 91 | Network | VPN Topology | Medium | Encrypted tunnels | mxgraph.cisco.* |
| 92 | Network | Wireless Coverage Map | Medium | AP placement & range | mxgraph.cisco.* |
| 93 | Network | Cloud VPC / VNET | Medium | Cloud virtual networking | aws/azure/gcp |
| 94 | Network | Zero Trust Architecture | High | Identity-centric security | mxgraph.cisco.* |
| 95 | Network | SDN Architecture | High | Software-defined networking | mxgraph.cisco.* |
| 96 | Network | Security Zone Map | Medium | Trust boundary visualization | mxgraph.cisco.* |
| 97 | Network | Load Balancer Architecture | Medium | Traffic distribution | mxgraph.cisco.* |
| 98 | Network | CDN Distribution Map | Medium | Edge node placement | built-in |
| 99 | Network | DNS Resolution Flow | Low | Query chain visualization | built-in |
| 100 | Network | Rack Diagram | Medium | Physical equipment layout | mxgraph.cisco.* |
| 101 | Cloud | AWS Architecture | Medium | VPC, EC2, S3, Lambda, RDS | mxgraph.aws4.* |
| 102 | Cloud | Azure Architecture | Medium | VNET, App Service, AKS | mxgraph.azure.* |
| 103 | Cloud | GCP Architecture | Medium | GCE, GKE, Cloud Run | mxgraph.gcp2.* |
| 104 | Cloud | Multi-Cloud / Hybrid Cloud | High | Cross-provider topology | multiple |
| 105 | Cloud | Serverless Architecture | Medium | Functions, triggers, events | aws/azure/gcp |
| 106 | Cloud | Cloud Migration Map | Medium | Source → target mapping | built-in |
| 107 | Cloud | Cloud Cost Optimization | Medium | Resource right-sizing | built-in |
| 108 | K8s | Kubernetes Cluster | Medium | Control plane + workers | mxgraph.kubernetes.* |
| 109 | K8s | Pod/Deployment/Service | Medium | Workload topology | mxgraph.kubernetes.* |
| 110 | K8s | Helm Release Map | Medium | Chart dependencies | mxgraph.kubernetes.* |
| 111 | K8s | K8s Network Policy | High | Ingress/egress rules | mxgraph.kubernetes.* |
| 112 | K8s | K8s RBAC Visualization | High | Subjects → roles → resources | mxgraph.kubernetes.* |
| 113 | K8s | Istio / Service Mesh | High | Sidecar proxy topology | mxgraph.kubernetes.* |
| 114 | K8s | Docker Compose Architecture | Medium | Multi-container app | built-in |
| 115 | K8s | Container Registry Flow | Low | Build → push → pull | built-in |
| 116 | Security | STRIDE Threat Model (DFD) | High | Threat identification | built-in |
| 117 | Security | Attack Tree | Medium | Threat decomposition | built-in |
| 118 | Security | Kill Chain (Lockheed Martin) | Medium | 7-phase attack lifecycle | built-in |
| 119 | Security | MITRE ATT&CK Matrix | High | Tactic/technique grid | built-in |
| 120 | Security | Diamond Model | Medium | Adversary profiling | built-in |
| 121 | Security | Security Zone Map | Medium | Trust boundaries | mxgraph.cisco.* |
| 122 | Security | Incident Response Playbook | Medium | Response procedure flow | built-in |
| 123 | Security | Compliance Control Map | High | Control framework mapping | built-in |
| 124 | Wireframe | Lo-Fi Wireframe (Sketch) | Low | Early ideation | mxgraph.mockup.* |
| 125 | Wireframe | Mid-Fi Wireframe | Medium | Layout validation | mxgraph.mockup.* |
| 126 | Wireframe | Hi-Fi Mockup | High | Pixel-perfect design | mxgraph.mockup.* |
| 127 | Wireframe | iOS App Mockup | Medium | iPhone/iPad screens | mxgraph.ios.* |
| 128 | Wireframe | Android App Mockup | Medium | Material Design screens | mxgraph.android.* |
| 129 | Wireframe | Web Dashboard Mockup | Medium | Admin/analytics UI | mxgraph.mockup.* |
| 130 | Wireframe | Landing Page Mockup | Medium | Marketing pages | mxgraph.mockup.* |
| 131 | Wireframe | Admin Panel Mockup | Medium | CRUD interfaces | mxgraph.mockup.* |
| 132 | Wireframe | E-Commerce Product Page | Medium | Product detail layout | mxgraph.mockup.* |
| 133 | Wireframe | User Flow / Screen Flow | Medium | Navigation between screens | mxgraph.mockup.* |
| 134 | Wireframe | Interactive Prototype | High | Multi-page with links | mxgraph.mockup.* |
| 135 | Wireframe | Design System Sheet | Medium | Component inventory | mxgraph.mockup.* |
| 136 | Wireframe | Responsive Breakpoint | Medium | Desktop/tablet/mobile | mxgraph.mockup.* |
| 137 | Business | Org Chart | Low | Reporting structure | built-in |
| 138 | Business | RACI Matrix | Low | Responsibility assignment | built-in |
| 139 | Business | Stakeholder Map | Low | Power/interest grid | built-in |
| 140 | Business | Business Model Canvas | Medium | 9-block model overview | built-in |
| 141 | Business | Lean Canvas | Medium | Startup hypothesis board | built-in |
| 142 | Business | Customer Journey Map | Medium | Touchpoints & emotions | built-in |
| 143 | Business | Service Blueprint | High | Front/backstage processes | built-in |
| 144 | Business | Empathy Map | Low | Think/Feel/Say/Do quadrants | built-in |
| 145 | Business | SWOT Analysis | Low | Strengths/Weaknesses/Opportunities/Threats | built-in |
| 146 | Business | Porter's Five Forces | Low | Competitive analysis | built-in |
| 147 | Business | BCG Matrix | Low | Growth vs market share | built-in |
| 148 | Business | Ansoff Matrix | Low | Growth strategy grid | built-in |
| 149 | Planning | Gantt Chart | Medium | Project timeline | built-in |
| 150 | Planning | Roadmap / Timeline | Low | Feature/release planning | built-in |
| 151 | Planning | Kanban Board | Low | Work-in-progress tracking | built-in |
| 152 | Planning | Sprint Board | Low | Scrum sprint visualization | built-in |
| 153 | Planning | PERT Chart | High | Critical path analysis | built-in |
| 154 | Planning | Work Breakdown Structure | Medium | Deliverable decomposition | built-in |
| 155 | Planning | Risk Matrix / Heat Map | Low | Likelihood vs impact grid | built-in |
| 156 | Planning | Dependency Map | Medium | Blocker visualization | built-in |
| 157 | Planning | Milestone Chart | Low | Key dates timeline | built-in |
| 158 | Concept | Mind Map (Radial) | Low | Brainstorming, ideation | built-in |
| 159 | Concept | Concept Map | Medium | Knowledge relationships | built-in |
| 160 | Concept | Fishbone / Ishikawa | Medium | Root cause analysis | built-in |
| 161 | Concept | Affinity Diagram | Low | Idea grouping | built-in |
| 162 | Concept | Tree Diagram | Low | Hierarchical classification | built-in |
| 163 | Concept | Venn Diagram | Low | Set overlap visualization | built-in |
| 164 | Concept | Knowledge Graph | High | Entity-relationship network | built-in |
| 165 | IaC | Terraform Resource Map | Medium | HCL resource dependencies | aws/azure/gcp |
| 166 | IaC | Ansible Playbook Flow | Medium | Role/task execution | built-in |
| 167 | IaC | Pulumi Stack Visualization | Medium | Cloud resource graph | aws/azure/gcp |
| 168 | IaC | CloudFormation Map | Medium | Stack resources | mxgraph.aws4.* |
| 169 | IaC | GitOps Deployment Flow | Medium | Git → cluster sync | built-in |
| 170 | Integration | Enterprise Integration (EIP) | High | Messaging patterns | mxgraph.eip.* |
| 171 | Integration | Message Queue Architecture | Medium | Kafka/RabbitMQ/SQS | built-in |
| 172 | Integration | API Gateway Architecture | Medium | Routing, auth, throttle | built-in |
| 173 | Integration | Event Bus / Event Mesh | Medium | Pub-sub topology | built-in |
| 174 | Integration | Webhook Flow | Low | HTTP callback chains | built-in |
| 175 | Integration | gRPC Service Map | Medium | Protobuf service topology | built-in |
| 176 | Integration | GraphQL Federation Map | High | Subgraph composition | built-in |
| 177 | SysML | Requirements Diagram | High | Requirement traceability | mxgraph.sysml.* |
| 178 | SysML | Block Definition (BDD) | High | System structure blocks | mxgraph.sysml.* |
| 179 | SysML | Internal Block (IBD) | High | Internal connections | mxgraph.sysml.* |
| 180 | SysML | Parametric Diagram | High | Constraint equations | mxgraph.sysml.* |
| 181 | SysML | SysML Activity | High | Flow with object nodes | mxgraph.sysml.* |
| 182 | SysML | SysML Sequence | High | Inter-block messaging | mxgraph.sysml.* |
| 183 | SysML | SysML State Machine | High | Block state behavior | mxgraph.sysml.* |
| 184 | SysML | SysML Use Case | Medium | System interactions | mxgraph.sysml.* |
| 185 | SysML | SysML Package | Medium | Model organization | mxgraph.sysml.* |
| 186 | Engineering | Circuit Diagram | Medium | Electrical schematics | mxgraph.electrical.* |
| 187 | Engineering | Floor Plan | Medium | Room/office layout | mxgraph.floorplan.* |
| 188 | Engineering | Rack Diagram | Medium | Data center equipment | mxgraph.cisco.* |
| 189 | Engineering | P&ID (Piping) | High | Process instrumentation | built-in |
| 190 | Algorithm | Sorting Visualization | Medium | Array state per step | built-in |
| 191 | Algorithm | Graph Traversal (BFS/DFS) | Medium | Visit order coloring | built-in |
| 192 | Algorithm | DP Table Visualization | Medium | Subproblem grid | built-in |
| 193 | Algorithm | Recursion Tree | Medium | Call stack branching | built-in |
| 194 | Algorithm | Memory Layout | Medium | Stack/heap regions | built-in |
| 195 | Algorithm | Compiler Pipeline | Medium | Lexer→Parser→AST→IR | built-in |
| 196 | Algorithm | Finite Automaton (DFA/NFA) | Medium | State machine formal | built-in |

---

## Category Details

### 1. Process & Flow Diagrams (1-13)

#### 1. Flowchart
- **When to use**: Decision logic, algorithms, onboarding guides, troubleshooting trees
- **Shapes**: Rounded rectangle (process), diamond (decision), oval (start/end), parallelogram (I/O), cylinder (data store)
- **Style**: `rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;`
- **Notation**: ISO 5807 standard shapes

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="start" value="Start" style="ellipse;fillColor=#D5E8D4;strokeColor=#82B366;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="200" y="20" width="100" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="proc1" value="Process Data" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;" vertex="1" parent="1">
      <mxGeometry x="175" y="110" width="150" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="dec1" value="Valid?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;" vertex="1" parent="1">
      <mxGeometry x="200" y="210" width="100" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="start" target="proc1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
    <mxCell id="e2" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="proc1" target="dec1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
  </root>
</mxGraphModel>
```

#### 2. Swimlane / Cross-Functional Flowchart
- **When to use**: Multi-role workflows, cross-department handoffs, responsibility mapping
- **Shapes**: Swimlane container per role + standard flowchart shapes inside
- **Style**: `swimlane;startSize=30;fillColor=#dae8fc;strokeColor=#6c8ebf;`

#### 3. BPMN 2.0 Process Diagram
- **When to use**: Formal business processes, automation specs, cross-organizational workflows
- **Shapes**: Start/intermediate/end events (circles), tasks (rounded rectangles), gateways (diamonds), pools/lanes
- **Stencils**: `mxgraph.bpmn.event`, `mxgraph.bpmn.task`, `mxgraph.bpmn.gateway`
- **Notation**: OMG BPMN 2.0 standard

#### 4. Decision Tree
- **When to use**: Classification, risk analysis, game theory, ML feature selection
- **Shapes**: Rectangle (decision nodes), oval (leaf outcomes), diamond (chance nodes)
- **Layout**: Top-down tree with probability/value annotations on edges

#### 5. Decision Table
- **When to use**: Multi-criteria evaluation, business rules, test case matrix
- **Shapes**: Table cells with condition rows and action columns
- **Style**: Grid layout using `shape=table;` or manual cells

#### 7. Value Stream Map
- **When to use**: Lean manufacturing, identifying waste, lead time analysis
- **Stencils**: `mxgraph.lean_mapping.manufacturing_process`, `mxgraph.lean_mapping.inventory_box`, `mxgraph.lean_mapping.electronic_info_flow`
- **Notation**: Lean/Toyota Production System standard

#### 11. CI/CD Pipeline Flow
- **When to use**: Build/test/deploy pipeline visualization, GitHub Actions/Azure Pipelines/Harness
- **Shapes**: Stage rectangles, parallel lanes, gate diamonds
- **Color coding**: Green (success), Yellow (pending), Red (failed), Blue (running)

---

### 2. UML Structural Diagrams (14-20)

#### 14. Class Diagram
- **When to use**: Object-oriented design, domain modeling, API contracts
- **Shapes**: 3-compartment box (name, attributes, methods), inheritance arrows, composition diamonds
- **Style**: `shape=mxgraph.uml.classFrame;` or manual 3-section box
- **Notation**: UML 2.5, relationships: `--|>` (inheritance), `--*` (composition), `--o` (aggregation), `-->` (dependency)

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="class1" value="&lt;b&gt;User&lt;/b&gt;&lt;hr&gt;- id: string&lt;br&gt;- name: string&lt;br&gt;- email: string&lt;hr&gt;+ login(): boolean&lt;br&gt;+ logout(): void" style="text;html=1;align=left;verticalAlign=top;fillColor=#DAE8FC;strokeColor=#6C8EBF;rounded=0;overflow=fill;whiteSpace=wrap;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="100" y="50" width="200" height="160" as="geometry"/>
    </mxCell>
    <mxCell id="class2" value="&lt;b&gt;AdminUser&lt;/b&gt;&lt;hr&gt;- permissions: string[]&lt;hr&gt;+ grantAccess(): void" style="text;html=1;align=left;verticalAlign=top;fillColor=#DAE8FC;strokeColor=#6C8EBF;rounded=0;overflow=fill;whiteSpace=wrap;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="100" y="280" width="200" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="inherit" style="endArrow=block;endFill=0;edgeStyle=orthogonalEdgeStyle;" edge="1" source="class2" target="class1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
  </root>
</mxGraphModel>
```

#### 16. Component Diagram
- **When to use**: System decomposition, module dependencies, microservice boundaries
- **Shapes**: Component boxes with `<<component>>` stereotype, provided/required interfaces (lollipop/socket)

#### 17. Deployment Diagram
- **When to use**: Infrastructure documentation, server topology, runtime environments
- **Shapes**: Node boxes (3D cube), artifacts, execution environments

---

### 3. UML Behavioral Diagrams (21-27)

#### 21. Sequence Diagram
- **When to use**: API call flows, authentication sequences, microservice communication
- **Shapes**: Lifeline rectangles, activation bars, message arrows (solid=sync, dashed=return, open arrow=async)
- **Style**: `shape=mxgraph.uml.lifeline;` with HTML labels

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="client" value="Client" style="shape=mxgraph.sequence.lifeline;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;" vertex="1" parent="1">
      <mxGeometry x="100" y="40" width="100" height="300" as="geometry"/>
    </mxCell>
    <mxCell id="server" value="API Server" style="shape=mxgraph.sequence.lifeline;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;" vertex="1" parent="1">
      <mxGeometry x="350" y="40" width="100" height="300" as="geometry"/>
    </mxCell>
    <mxCell id="msg1" value="POST /login" style="html=1;verticalAlign=bottom;" edge="1" parent="1">
      <mxGeometry relative="1" as="geometry"><mxPoint x="150" y="120" as="sourcePoint"/><mxPoint x="350" y="120" as="targetPoint"/></mxGeometry>
    </mxCell>
    <mxCell id="msg2" value="200 OK + token" style="html=1;dashed=1;verticalAlign=bottom;" edge="1" parent="1">
      <mxGeometry relative="1" as="geometry"><mxPoint x="350" y="160" as="sourcePoint"/><mxPoint x="150" y="160" as="targetPoint"/></mxGeometry>
    </mxCell>
  </root>
</mxGraphModel>
```

#### 23. State Machine Diagram
- **When to use**: Object lifecycle, protocol states, UI navigation, order status
- **Shapes**: Rounded rectangle (state), filled circle (initial), bullseye (final), horizontal bar (fork/join)

#### 24. Use Case Diagram
- **When to use**: Requirements capture, system boundary definition, actor identification
- **Shapes**: Stick figure (actor), oval (use case), rectangle (system boundary)

---

### 4. Architecture Diagrams (28-46)

#### 28-32. C4 Model (Levels 1-4 + Deployment)
- **When to use**: Progressive architecture at increasing detail
- **Style**: Person=`shape=mxgraph.c4.person2;`, System=large rounded rect, Container=rounded rect, Component=rect
- **Color conventions**: Your system=blue, external=gray, users=purple, databases=green

```xml
<!-- C4 Context Example -->
<mxGraphModel>
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="user" value="&lt;b&gt;Customer&lt;/b&gt;&lt;br&gt;[Person]&lt;br&gt;&lt;br&gt;Places orders and tracks deliveries" style="shape=mxgraph.c4.person2;whiteSpace=wrap;html=1;fillColor=#E1D5E7;strokeColor=#9673A6;fontColor=#333333;align=center;" vertex="1" parent="1">
      <mxGeometry x="250" y="20" width="180" height="160" as="geometry"/>
    </mxCell>
    <mxCell id="system" value="&lt;b&gt;E-Commerce Platform&lt;/b&gt;&lt;br&gt;[Software System]&lt;br&gt;&lt;br&gt;Allows customers to browse, order, and pay" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;align=center;arcSize=10;" vertex="1" parent="1">
      <mxGeometry x="200" y="250" width="280" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="ext1" value="&lt;b&gt;Stripe&lt;/b&gt;&lt;br&gt;[External System]&lt;br&gt;&lt;br&gt;Payment processing" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#666666;align=center;arcSize=10;dashed=1;" vertex="1" parent="1">
      <mxGeometry x="550" y="250" width="200" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="e1" value="Browses, orders" style="edgeStyle=orthogonalEdgeStyle;" edge="1" source="user" target="system" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
    <mxCell id="e2" value="Processes payments" style="edgeStyle=orthogonalEdgeStyle;dashed=1;" edge="1" source="system" target="ext1" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
  </root>
</mxGraphModel>
```

#### 33-37. ArchiMate 3.0
- **Stencils**: `mxgraph.archimate3.*`
- **Layers**: Business (yellow), Application (blue), Technology (green), Strategy (red), Implementation (purple)
- **Relationships**: Composition, aggregation, assignment, realization, serving, access, influence, triggering, flow

#### 40. Hexagonal Architecture (Ports & Adapters)
- **When to use**: Clean boundary separation between domain logic and infrastructure
- **Shapes**: Central hexagon (domain), small circles on edges (ports), rectangles outside (adapters)

#### 42. Microservices Architecture Map
- **When to use**: Service topology visualization, communication patterns
- **Shapes**: Rounded rectangles per service, solid arrows (sync), dashed arrows (async/events)
- **Color coding**: By tech stack (Go=blue, Java=orange, Node=green, Python=yellow)

#### 45. DDD Bounded Context Map
- **When to use**: Strategic domain design, team ownership boundaries
- **Shapes**: Large dashed rectangles per context, labeled relationships between them
- **Relationship types**: Shared Kernel, Customer-Supplier, Conformist, Anticorruption Layer, Open Host Service, Published Language

---

### 5. Data & Database Diagrams (47-60)

#### 47-48. ER Diagrams
- **Chen notation**: Rectangles (entities), ovals (attributes), diamonds (relationships)
- **Crow's Foot**: Table boxes with column lists, cardinality markers (||, <, O)
- **Stencils**: `mxgraph.er.*`

```xml
<!-- Crow's Foot ER Example -->
<mxGraphModel>
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="users" value="&lt;b&gt;users&lt;/b&gt;&lt;hr&gt;🔑 id: uuid PK&lt;br&gt;name: varchar(255)&lt;br&gt;email: varchar(255) UNIQUE&lt;br&gt;created_at: timestamp" style="text;html=1;align=left;verticalAlign=top;fillColor=#DAE8FC;strokeColor=#6C8EBF;overflow=fill;whiteSpace=wrap;" vertex="1" parent="1">
      <mxGeometry x="50" y="50" width="220" height="130" as="geometry"/>
    </mxCell>
    <mxCell id="orders" value="&lt;b&gt;orders&lt;/b&gt;&lt;hr&gt;🔑 id: uuid PK&lt;br&gt;🔗 user_id: uuid FK&lt;br&gt;total: decimal(10,2)&lt;br&gt;status: enum&lt;br&gt;created_at: timestamp" style="text;html=1;align=left;verticalAlign=top;fillColor=#D5E8D4;strokeColor=#82B366;overflow=fill;whiteSpace=wrap;" vertex="1" parent="1">
      <mxGeometry x="400" y="50" width="220" height="150" as="geometry"/>
    </mxCell>
    <mxCell id="rel1" value="" style="edgeStyle=entityRelationEdgeStyle;endArrow=ERmany;startArrow=ERone;html=1;" edge="1" source="users" target="orders" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
  </root>
</mxGraphModel>
```

#### 50-51. Star Schema / Snowflake Schema
- **Star**: Central fact table (orange) connected to dimension tables (blue)
- **Snowflake**: Dimension tables further normalized into sub-dimensions

#### 52-53. Data Flow Diagrams (DFD)
- **Level 0**: Single process circle showing system boundary with external entities
- **Level 1-2**: Decomposed processes, data stores (parallel lines), data flows (arrows)
- **Use for**: STRIDE threat modeling base diagrams

#### 54-56. Schema Diagrams (JSON, GraphQL, Protobuf)
- **JSON Schema**: Nested boxes with type annotations, required indicators (bold), $ref arrows
- **GraphQL**: Type boxes with field lists, Query/Mutation root types, edge connections
- **Protobuf**: Message boxes with field number annotations, service definitions

---

### 6. Data Structure Visualizations (61-82)

#### Style Conventions for Data Structures
```
// Node: rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontFamily=Consolas;
// Highlighted: fillColor=#D5E8D4;strokeColor=#82B366;fontStyle=1;
// Deleted/null: fillColor=#F8CECC;strokeColor=#B85450;dashed=1;
// Pointer arrow: endArrow=block;endFill=1;strokeColor=#6C8EBF;
// Index label: fontSize=10;fontColor=#999999;fontFamily=Consolas;
```

#### 61. Array
- Row of equal-width cells with index labels below
- Highlighted cell for access pattern visualization

#### 68-71. Binary Trees (BST, AVL, Red-Black)
- Circles for nodes, edges angled left/right
- BST: Value ordering annotations
- AVL: Balance factor badges (−1, 0, +1) on each node
- Red-Black: `fillColor=#F8CECC` (red) vs `fillColor=#1B1B1B;fontColor=#FFFFFF` (black)

```xml
<!-- Binary Tree Example -->
<mxGraphModel>
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="n50" value="50" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontFamily=Consolas;fontSize=14;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="250" y="30" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="n30" value="30" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontFamily=Consolas;fontSize=14;" vertex="1" parent="1">
      <mxGeometry x="150" y="120" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="n70" value="70" style="ellipse;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontFamily=Consolas;fontSize=14;" vertex="1" parent="1">
      <mxGeometry x="350" y="120" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="n20" value="20" style="ellipse;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontFamily=Consolas;fontSize=14;" vertex="1" parent="1">
      <mxGeometry x="100" y="210" width="50" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="e1" edge="1" source="n50" target="n30" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
    <mxCell id="e2" edge="1" source="n50" target="n70" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
    <mxCell id="e3" edge="1" source="n30" target="n20" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>
  </root>
</mxGraphModel>
```

#### 75. Hash Table
- Vertical array of buckets (left), chained linked lists (right) for collision handling
- Hash function annotation with arrow from key to bucket index

#### 76-79. Graphs (Directed, Undirected, Weighted, DAG)
- Circular nodes with labels, edges with optional weight labels
- DAG: Layer assignment showing topological order
- Weighted: Edge labels with cost/distance values

---

### 7. Network Diagrams (83-100)

#### Cisco Stencil Reference
```
Router:          shape=mxgraph.cisco.routers.router;
Switch L2:       shape=mxgraph.cisco.switches.workgroup_switch;
Switch L3:       shape=mxgraph.cisco.switches.layer_3_switch;
Firewall:        shape=mxgraph.cisco.firewalls.firewall;
Server:          shape=mxgraph.cisco.servers.standard_server;
Database:        shape=mxgraph.cisco.storage.database;
Cloud:           shape=mxgraph.cisco.cloud.cloud;
Access Point:    shape=mxgraph.cisco.wireless.access_point;
Load Balancer:   shape=mxgraph.cisco.switches.content_switch;
VPN Concentrator: shape=mxgraph.cisco.security.vpn_concentrator;
```

#### 90. DMZ Architecture
- **Zones**: Internet (red), DMZ (yellow), Internal (green), Management (blue)
- **Pattern**: Internet → Firewall → DMZ (web servers, reverse proxy) → Firewall → Internal (app servers, DB)

```xml
<!-- DMZ Architecture Sketch -->
<mxGraphModel>
  <root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    <mxCell id="internet" value="Internet" style="shape=mxgraph.cisco.cloud.cloud;fillColor=#F8CECC;strokeColor=#B85450;fontSize=14;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="250" y="20" width="140" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="fw1" value="Edge FW" style="shape=mxgraph.cisco.firewalls.firewall;fillColor=#F8CECC;strokeColor=#B85450;" vertex="1" parent="1">
      <mxGeometry x="285" y="140" width="70" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="dmz" value="DMZ Zone" style="swimlane;startSize=25;fillColor=#FFF2CC;strokeColor=#D6B656;rounded=1;dashed=1;" vertex="1" parent="1">
      <mxGeometry x="150" y="240" width="340" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="web1" value="Web Server" style="shape=mxgraph.cisco.servers.standard_server;fillColor=#FFF2CC;strokeColor=#D6B656;" vertex="1" parent="dmz">
      <mxGeometry x="30" y="35" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="proxy" value="Reverse Proxy" style="shape=mxgraph.cisco.servers.standard_server;fillColor=#FFF2CC;strokeColor=#D6B656;" vertex="1" parent="dmz">
      <mxGeometry x="250" y="35" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="fw2" value="Internal FW" style="shape=mxgraph.cisco.firewalls.firewall;fillColor=#D5E8D4;strokeColor=#82B366;" vertex="1" parent="1">
      <mxGeometry x="285" y="400" width="70" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="internal" value="Internal Zone" style="swimlane;startSize=25;fillColor=#D5E8D4;strokeColor=#82B366;rounded=1;dashed=1;" vertex="1" parent="1">
      <mxGeometry x="150" y="500" width="340" height="120" as="geometry"/>
    </mxCell>
    <mxCell id="app" value="App Server" style="shape=mxgraph.cisco.servers.standard_server;fillColor=#D5E8D4;strokeColor=#82B366;" vertex="1" parent="internal">
      <mxGeometry x="30" y="35" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="db" value="Database" style="shape=mxgraph.cisco.storage.database;fillColor=#D5E8D4;strokeColor=#82B366;" vertex="1" parent="internal">
      <mxGeometry x="250" y="35" width="60" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

### 8. Cloud Architecture (101-107)

#### AWS Shape Reference (mxgraph.aws4.*)
```
EC2:          shape=mxgraph.aws4.ec2;
Lambda:       shape=mxgraph.aws4.lambda_function;
S3:           shape=mxgraph.aws4.s3;
RDS:          shape=mxgraph.aws4.rds;
DynamoDB:     shape=mxgraph.aws4.dynamodb;
ALB:          shape=mxgraph.aws4.application_load_balancer;
API Gateway:  shape=mxgraph.aws4.api_gateway;
CloudFront:   shape=mxgraph.aws4.cloudfront;
SQS:          shape=mxgraph.aws4.sqs;
SNS:          shape=mxgraph.aws4.sns;
ECS:          shape=mxgraph.aws4.ecs;
EKS:          shape=mxgraph.aws4.eks;
VPC:          shape=mxgraph.aws4.vpc;
Subnet:       shape=mxgraph.aws4.subnet;
Route53:      shape=mxgraph.aws4.route_53;
CloudWatch:   shape=mxgraph.aws4.cloudwatch;
IAM:          shape=mxgraph.aws4.iam;
Cognito:      shape=mxgraph.aws4.cognito;
```

#### Azure Shape Reference (mxgraph.azure.*)
```
App Service:  shape=mxgraph.azure.app_service;
AKS:          shape=mxgraph.azure.kubernetes_services;
Cosmos DB:    shape=mxgraph.azure.cosmos_db;
SQL Database: shape=mxgraph.azure.sql_database;
Functions:    shape=mxgraph.azure.function_apps;
Event Hub:    shape=mxgraph.azure.event_hubs;
Service Bus:  shape=mxgraph.azure.service_bus;
VNET:         shape=mxgraph.azure.virtual_network;
Load Balancer: shape=mxgraph.azure.load_balancer;
API Mgmt:     shape=mxgraph.azure.api_management;
Key Vault:    shape=mxgraph.azure.key_vaults;
```

#### GCP Shape Reference (mxgraph.gcp2.*)
```
GCE:          shape=mxgraph.gcp2.compute_engine;
GKE:          shape=mxgraph.gcp2.kubernetes_engine;
Cloud Run:    shape=mxgraph.gcp2.cloud_run;
Cloud SQL:    shape=mxgraph.gcp2.cloud_sql;
BigQuery:     shape=mxgraph.gcp2.bigquery;
Pub/Sub:      shape=mxgraph.gcp2.pub_sub;
Cloud Storage: shape=mxgraph.gcp2.cloud_storage;
Cloud Functions: shape=mxgraph.gcp2.cloud_functions;
```

---

### 9. Kubernetes & Container Diagrams (108-115)

#### Kubernetes Shape Reference (mxgraph.kubernetes.*)
```
Pod:          shape=mxgraph.kubernetes.pod;
Deployment:   shape=mxgraph.kubernetes.deploy;
Service:      shape=mxgraph.kubernetes.svc;
Ingress:      shape=mxgraph.kubernetes.ing;
ConfigMap:    shape=mxgraph.kubernetes.cm;
Secret:       shape=mxgraph.kubernetes.secret;
PV:           shape=mxgraph.kubernetes.pv;
PVC:          shape=mxgraph.kubernetes.pvc;
Namespace:    shape=mxgraph.kubernetes.ns;
Node:         shape=mxgraph.kubernetes.node;
CronJob:      shape=mxgraph.kubernetes.cronjob;
StatefulSet:  shape=mxgraph.kubernetes.sts;
DaemonSet:    shape=mxgraph.kubernetes.ds;
HPA:          shape=mxgraph.kubernetes.hpa;
```

---

### 10. Security & Threat Diagrams (116-123)

#### 116. STRIDE Threat Model
- **Base diagram**: DFD with processes (circles), data stores (double lines), external entities (rectangles), data flows (arrows)
- **Trust boundaries**: Red dashed lines separating trust zones
- **Threat annotations**: Sticky notes per STRIDE category (Spoofing=purple, Tampering=red, Repudiation=orange, Info Disclosure=yellow, DoS=gray, Elevation=black)

#### 117. Attack Tree
- **Root**: Attack goal at top
- **OR nodes**: Any child attack path suffices (standard branch)
- **AND nodes**: All children required (connected with arc)
- **Leaf coloring**: Red (high risk), Yellow (medium), Green (low/mitigated)

---

### 11. Wireframes & UI Mockups (124-136)

#### Mockup Shape Reference
```
Browser Window:   shape=mxgraph.mockup.containers.browserWindow;
Window:           shape=mxgraph.mockup.containers.window;
Dialog:           shape=mxgraph.mockup.containers.alertBox;
Button:           shape=mxgraph.mockup.buttons.button;
Checkbox:         shape=mxgraph.mockup.buttons.checkbox;
Radio Button:     shape=mxgraph.mockup.buttons.radioButton;
Text Input:       shape=mxgraph.mockup.forms.rrect;
Dropdown:         shape=mxgraph.mockup.forms.comboBox;
Slider:           shape=mxgraph.mockup.forms.horSlider;
Menu Bar:         shape=mxgraph.mockup.menus.menuBar;
Tabs:             shape=mxgraph.mockup.containers.tabBar;
Data Table:       shape=mxgraph.mockup.containers.dataTable;
Image Placeholder: shape=mxgraph.mockup.graphics.simpleIcon;
Heading:          shape=mxgraph.mockup.text.heading;
Paragraph:        shape=mxgraph.mockup.text.loremIpsum;
```

#### iOS Shape Reference (mxgraph.ios.*)
```
iPhone Frame:     shape=mxgraph.ios.iPhone;
Nav Bar:          shape=mxgraph.ios.iNavBar;
Tab Bar:          shape=mxgraph.ios.iTabBar;
Table View:       shape=mxgraph.ios.iTableView;
Switch:           shape=mxgraph.ios.iSwitch;
Slider:           shape=mxgraph.ios.iSlider;
Alert:            shape=mxgraph.ios.iAlertDialog;
Keyboard:         shape=mxgraph.ios.iKeyboard;
```

#### Android Shape Reference (mxgraph.android.*)
```
Phone Frame:      shape=mxgraph.android.phone;
App Bar:          shape=mxgraph.android.appBar;
FAB:              shape=mxgraph.android.fab;
Card:             shape=mxgraph.android.card;
Navigation Drawer: shape=mxgraph.android.navigationDrawer;
Bottom Sheet:     shape=mxgraph.android.bottomSheet;
Snackbar:         shape=mxgraph.android.snackbar;
Chip:             shape=mxgraph.android.chip;
```

#### Fidelity Styles
```
// Lo-fi (sketch mode):
sketch=1;curveFitting=1;jiggle=2;fillColor=#F0F0F0;strokeColor=#999999;fontFamily=Comic Sans MS;

// Mid-fi (wireframe):
fillColor=#FFFFFF;strokeColor=#CCCCCC;fontColor=#333333;fontFamily=Roboto;shadow=0;

// Hi-fi (mockup):
fillColor=#FFFFFF;strokeColor=#E0E0E0;fontColor=#212121;fontFamily=Inter;shadow=1;arcSize=8;
```

---

### 12. Business & Organizational (137-148)

#### 137. Org Chart
- **Shapes**: Rounded rectangles per person/role, hierarchical edges
- **Style**: `rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;`
- **Layout**: Tree layout, top-down

#### 140. Business Model Canvas
- **Layout**: 9-block grid (Key Partners, Key Activities, Key Resources, Value Propositions, Customer Relationships, Channels, Customer Segments, Cost Structure, Revenue Streams)
- **Style**: Large container cells with sticky-note items inside

#### 142. Customer Journey Map
- **Rows**: Stages (Awareness, Consideration, Purchase, Retention, Advocacy)
- **Columns per stage**: Actions, Touchpoints, Emotions (happy/neutral/sad faces), Pain Points, Opportunities

---

### 13. Planning & Project (149-157)

#### 149. Gantt Chart
- **Shapes**: Horizontal bars per task, milestone diamonds, dependency arrows
- **Style**: `fillColor=#DAE8FC;strokeColor=#6C8EBF;` for task bars, timeline axis across top

#### 153. PERT Chart
- **Shapes**: Circles (events/milestones), arrows (activities with duration labels)
- **Critical path**: Highlighted in red with zero slack

---

### 14. Mind Maps & Concept (158-164)

#### 158. Mind Map
- **Layout**: Central topic, radial branches at increasing depth
- **Style**: `rounded=1;arcSize=50;` decreasing size per level
- **Colors**: Different branch color per main topic

#### 160. Fishbone / Ishikawa
- **Shapes**: Main horizontal spine → angled bones for each cause category → sub-causes
- **Categories**: Man, Machine, Method, Material, Measurement, Environment (6M)

---

### 15. Infrastructure as Code (165-169)

#### 165. Terraform Resource Map
- **Shapes**: Cloud provider icons for resources, edges for dependencies
- **Annotations**: Resource addresses (`aws_instance.web`), count/for_each labels
- **Modules**: Dashed container boundaries

---

### 16. Integration & Messaging (170-176)

#### 170. Enterprise Integration Patterns (EIP)
- **Stencils**: `mxgraph.eip.*`
- **Patterns**: Message Channel, Router, Translator, Splitter, Aggregator, Filter, Endpoint, Publish-Subscribe

#### 171. Message Queue Architecture
- **Layout**: Producers → Queue/Topic → Consumers
- **Queue shapes**: Rectangle with wavy line for queue, cylinder for topic
- **Annotations**: Partition count, consumer group labels, retention periods

---

### 17. SysML (177-185)

All use `mxgraph.sysml.*` stencils with OMG SysML 1.6 notation.

#### 178. Block Definition Diagram (BDD)
- **Shapes**: `<<block>>` stereotype boxes with compartments (values, parts, references, operations)
- **Relationships**: Composition, generalization, association

---

### 18. Engineering (186-189)

#### 186. Circuit Diagram
- **Stencils**: `mxgraph.electrical.*` — resistors, capacitors, inductors, transistors, LEDs, switches, power sources
- **Notation**: Standard IEC/ANSI symbols

#### 187. Floor Plan
- **Stencils**: `mxgraph.floorplan.*` — walls, doors, windows, furniture, fixtures
- **Usage**: Office layouts, data center floor plans

---

### 19. Algorithm & Academic (190-196)

#### 190. Sorting Algorithm Visualization
- **Layout**: Array state rows showing before/after each comparison/swap
- **Colors**: Comparing=#FFF2CC, Swapping=#F8CECC, Sorted=#D5E8D4, Unsorted=#DAE8FC

#### 196. Finite Automaton (DFA/NFA)
- **Shapes**: Circles (states), double circle (accepting state), filled dot (start), edges with labels (input symbols)
- **Style**: `ellipse;fillColor=#DAE8FC;strokeColor=#6C8EBF;` for states, `ellipse;fillColor=#DAE8FC;strokeColor=#6C8EBF;strokeWidth=3;` for accepting states

---

## Stencil Library Master Index

| Library Prefix | Category | Shape Count | Notes |
|---------------|----------|-------------|-------|
| `mxgraph.flowchart.*` | Process | ~20 | Standard ISO 5807 shapes |
| `mxgraph.bpmn.*` | Process | ~40 | Events, gateways, tasks, artifacts |
| `mxgraph.uml.*` | UML | ~30 | Class, sequence, state, activity |
| `mxgraph.c4.*` | Architecture | ~10 | Person, container, component |
| `mxgraph.archimate3.*` | Architecture | ~60 | Full ArchiMate 3.0 symbology |
| `mxgraph.sysml.*` | Systems Eng | ~40 | Full SysML 1.6 notation |
| `mxgraph.er.*` | Data | ~15 | Chen & Crow's Foot notation |
| `mxgraph.eip.*` | Integration | ~25 | Enterprise Integration Patterns |
| `mxgraph.lean_mapping.*` | Lean | ~15 | Value stream mapping symbols |
| `mxgraph.cisco.*` | Network | ~100+ | Routers, switches, firewalls, etc. |
| `mxgraph.aws4.*` | Cloud | ~200+ | Full AWS service icons |
| `mxgraph.azure.*` | Cloud | ~150+ | Full Azure service icons |
| `mxgraph.gcp2.*` | Cloud | ~100+ | Full GCP service icons |
| `mxgraph.kubernetes.*` | Containers | ~30 | All K8s resource types |
| `mxgraph.mockup.*` | UI/UX | ~80+ | Buttons, forms, containers, text |
| `mxgraph.ios.*` | Mobile | ~40 | iPhone/iPad UI elements |
| `mxgraph.android.*` | Mobile | ~40 | Material Design components |
| `mxgraph.electrical.*` | Engineering | ~60 | Circuit diagram symbols |
| `mxgraph.floorplan.*` | Engineering | ~50 | Architecture/office layout |
| `mxgraph.iot.*` | IoT | ~20 | IoT device shapes |
| `mxgraph.webicons.*` | Icons | ~30 | Web/social media icons |
| `mxgraph.infographic.*` | Visualization | ~20 | Infographic elements |

---

## Selection Decision Tree

```
What are you diagramming?
├── A process or workflow?
│   ├── Single role → Flowchart (#1)
│   ├── Multiple roles → Swimlane (#2)
│   ├── Formal business → BPMN (#3)
│   ├── Decision logic → Decision Tree (#4)
│   ├── Manufacturing → Value Stream Map (#7)
│   └── CI/CD → Pipeline Flow (#11)
├── Software structure?
│   ├── Classes/objects → UML Class (#14)
│   ├── API message flow → Sequence (#21)
│   ├── Object lifecycle → State Machine (#23)
│   ├── System overview → C4 Context (#28)
│   ├── Services/apps → C4 Container (#29)
│   ├── Internal modules → C4 Component (#30)
│   ├── Enterprise layers → ArchiMate (#33-37)
│   ├── Microservices → Microservices Map (#42)
│   ├── Events/messaging → Event-Driven (#43)
│   └── Domain boundaries → DDD Context Map (#45)
├── Data or database?
│   ├── Relational schema → ER Diagram (#47-49)
│   ├── Data warehouse → Star/Snowflake (#50-51)
│   ├── Data movement → DFD (#52-53)
│   ├── API contract → JSON/GraphQL Schema (#54-55)
│   └── ETL pipeline → Data Lineage (#58)
├── Data structures (CS)?
│   ├── Linear → Array/LinkedList/Stack/Queue (#61-67)
│   ├── Tree → BST/AVL/RB/B-Tree/Trie/Heap (#68-74)
│   ├── Hash → Hash Table/Map (#75)
│   └── Graph → Directed/Undirected/Weighted/DAG (#76-79)
├── Network or infrastructure?
│   ├── Physical network → Topology (#83-87)
│   ├── VLAN/subnet → VLAN Segmentation (#89)
│   ├── Security zones → DMZ Architecture (#90)
│   ├── Cloud infra → AWS/Azure/GCP (#101-103)
│   ├── Kubernetes → Cluster/Pod/Service (#108-109)
│   └── Containers → Docker Compose (#114)
├── Security?
│   ├── Threat modeling → STRIDE DFD (#116)
│   ├── Attack analysis → Attack Tree (#117)
│   └── Compliance → Control Map (#123)
├── UI/UX design?
│   ├── Early concept → Lo-fi Wireframe (#124)
│   ├── Layout review → Mid-fi Wireframe (#125)
│   ├── Visual design → Hi-fi Mockup (#126)
│   ├── iOS app → iOS Mockup (#127)
│   ├── Android app → Android Mockup (#128)
│   ├── Navigation → User Flow (#133)
│   └── Components → Design System Sheet (#135)
├── Business/Org?
│   ├── Team structure → Org Chart (#137)
│   ├── Responsibility → RACI Matrix (#138)
│   ├── Business model → BMC/Lean Canvas (#140-141)
│   ├── User experience → Customer Journey (#142)
│   └── Strategy → SWOT/Porter/BCG (#145-147)
├── Planning?
│   ├── Timeline → Gantt (#149) or Roadmap (#150)
│   ├── Work tracking → Kanban (#151)
│   ├── Critical path → PERT (#153)
│   └── Risk → Risk Matrix (#155)
└── Concept/ideation?
    ├── Brainstorming → Mind Map (#158)
    ├── Root cause → Fishbone (#160)
    └── Set relationships → Venn Diagram (#163)
```
