---
name: drawio:template
intent: Generate diagrams from intelligent templates with auto-populated content
tags:
  - drawio-diagramming
  - command
  - template
inputs: []
risk: low
cost: low
description: Generate draw.io diagrams from a curated library of intelligent templates spanning software architecture, cloud infrastructure, business processes, databases, DevOps pipelines, network topologies, UML, and agile project management. Supports template variables, composition, inheritance, and smart selection based on project context.
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Edit
---

# drawio:template

Generate draw.io diagrams from intelligent templates with auto-populated content
based on project context, tech stack detection, and user intent.

## Overview

The template system provides a structured library of diagram starters organized by
category. Each template contains draw.io XML with placeholder variables that are
resolved at generation time. Templates can be composed together, inherited from base
definitions, and selected automatically based on project analysis.

## Template Categories

### 1. Software Architecture

Templates for system design, component diagrams, and architectural views.

#### Microservices Architecture

```xml
<mxfile host="app.diagrams.net" modified="%timestamp%" agent="drawio-template">
  <diagram id="microservices-%id%" name="Microservices Architecture">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1"
      tooltips="1" connect="1" arrows="1" fold="1" page="1"
      pageScale="1" pageWidth="1169" pageHeight="827">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- API Gateway -->
        <mxCell id="gw-1" value="API Gateway&#xa;%gateway_name%" style="rounded=1;
          whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
          fontSize=14;fontStyle=1;arcSize=20;" vertex="1" parent="1">
          <mxGeometry x="400" y="40" width="200" height="60" as="geometry" />
        </mxCell>

        <!-- Service 1 -->
        <mxCell id="svc-1" value="%service_1_name%&#xa;Service" style="rounded=1;
          whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
          fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="80" y="180" width="160" height="80" as="geometry" />
        </mxCell>

        <!-- Service 2 -->
        <mxCell id="svc-2" value="%service_2_name%&#xa;Service" style="rounded=1;
          whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
          fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="320" y="180" width="160" height="80" as="geometry" />
        </mxCell>

        <!-- Service 3 -->
        <mxCell id="svc-3" value="%service_3_name%&#xa;Service" style="rounded=1;
          whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
          fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="560" y="180" width="160" height="80" as="geometry" />
        </mxCell>

        <!-- Database layer -->
        <mxCell id="db-1" value="%db_1_name%" style="shape=cylinder3;
          whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;
          fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="100" y="340" width="120" height="80" as="geometry" />
        </mxCell>

        <mxCell id="db-2" value="%db_2_name%" style="shape=cylinder3;
          whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;
          fillColor=#f8cecc;strokeColor=#b85450;" vertex="1" parent="1">
          <mxGeometry x="340" y="340" width="120" height="80" as="geometry" />
        </mxCell>

        <!-- Message Bus -->
        <mxCell id="bus-1" value="Message Bus&#xa;%message_bus%" style="shape=mxgraph.aws4.resourceIcon;
          resIcon=mxgraph.aws4.sqs;whiteSpace=wrap;html=1;fillColor=#E7157B;
          strokeColor=none;" vertex="1" parent="1">
          <mxGeometry x="600" y="340" width="80" height="80" as="geometry" />
        </mxCell>

        <!-- Connections -->
        <mxCell id="e-gw-s1" style="edgeStyle=orthogonalEdgeStyle;" edge="1"
          source="gw-1" target="svc-1" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e-gw-s2" style="edgeStyle=orthogonalEdgeStyle;" edge="1"
          source="gw-1" target="svc-2" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e-gw-s3" style="edgeStyle=orthogonalEdgeStyle;" edge="1"
          source="gw-1" target="svc-3" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e-s1-db1" style="edgeStyle=orthogonalEdgeStyle;dashed=1;"
          edge="1" source="svc-1" target="db-1" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e-s2-db2" style="edgeStyle=orthogonalEdgeStyle;dashed=1;"
          edge="1" source="svc-2" target="db-2" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e-s3-bus" style="edgeStyle=orthogonalEdgeStyle;dashed=1;"
          edge="1" source="svc-3" target="bus-1" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

#### C4 Context Diagram

```xml
<mxfile host="app.diagrams.net" modified="%timestamp%">
  <diagram id="c4-context-%id%" name="C4 Context">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- System boundary -->
        <mxCell id="sys-1" value="%system_name%&#xa;[Software System]&#xa;&#xa;%system_description%"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#438DD5;
          fontColor=#ffffff;strokeColor=#3C7FC0;fontSize=12;
          arcSize=5;verticalAlign=middle;" vertex="1" parent="1">
          <mxGeometry x="350" y="250" width="240" height="140" as="geometry" />
        </mxCell>

        <!-- User persona -->
        <mxCell id="user-1" value="%user_persona%&#xa;[Person]&#xa;&#xa;%user_description%"
          style="shape=mxgraph.c4.person2;whiteSpace=wrap;html=1;
          fillColor=#08427B;fontColor=#ffffff;strokeColor=#073B6F;
          fontSize=12;" vertex="1" parent="1">
          <mxGeometry x="400" y="20" width="140" height="140" as="geometry" />
        </mxCell>

        <!-- External system -->
        <mxCell id="ext-1" value="%external_system%&#xa;[External System]&#xa;&#xa;%ext_description%"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#999999;
          fontColor=#ffffff;strokeColor=#8C8C8C;fontSize=12;arcSize=5;"
          vertex="1" parent="1">
          <mxGeometry x="700" y="270" width="200" height="100" as="geometry" />
        </mxCell>

        <!-- Relationships -->
        <mxCell id="rel-1" value="Uses" style="edgeStyle=orthogonalEdgeStyle;
          rounded=1;html=1;fontSize=11;fontColor=#707070;"
          edge="1" source="user-1" target="sys-1" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="rel-2" value="Sends data to" style="edgeStyle=orthogonalEdgeStyle;
          rounded=1;html=1;fontSize=11;fontColor=#707070;dashed=1;"
          edge="1" source="sys-1" target="ext-1" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 2. Cloud Infrastructure

#### AWS Architecture

```xml
<mxfile host="app.diagrams.net" modified="%timestamp%">
  <diagram id="aws-%id%" name="AWS Architecture">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- VPC boundary -->
        <mxCell id="vpc-1" value="VPC: %vpc_cidr%" style="points=[[0,0],[0.25,0],
          [0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],
          [0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];outlineConnect=0;
          gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=1;
          fillColor=none;strokeColor=#248814;dashed=1;dashPattern=5 5;
          verticalAlign=top;align=left;spacingLeft=10;spacingTop=5;"
          vertex="1" parent="1">
          <mxGeometry x="80" y="80" width="800" height="500" as="geometry" />
        </mxCell>

        <!-- Public subnet -->
        <mxCell id="pub-sub" value="Public Subnet&#xa;%public_cidr%"
          style="fillColor=#E6F2FF;strokeColor=#147EBA;dashed=1;
          verticalAlign=top;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="100" y="120" width="360" height="200" as="geometry" />
        </mxCell>

        <!-- Private subnet -->
        <mxCell id="priv-sub" value="Private Subnet&#xa;%private_cidr%"
          style="fillColor=#FFF2E6;strokeColor=#B85400;dashed=1;
          verticalAlign=top;fontStyle=1;fontSize=11;" vertex="1" parent="1">
          <mxGeometry x="100" y="360" width="760" height="200" as="geometry" />
        </mxCell>

        <!-- ALB -->
        <mxCell id="alb-1" value="ALB&#xa;%alb_name%"
          style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;
          fillColor=#8C4FFF;strokeColor=none;dashed=0;verticalLabelPosition=bottom;
          verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;
          aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.application_load_balancer;"
          vertex="1" parent="1">
          <mxGeometry x="240" y="160" width="60" height="60" as="geometry" />
        </mxCell>

        <!-- ECS/EKS cluster -->
        <mxCell id="compute-1" value="%compute_service%&#xa;%cluster_name%"
          style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;
          fillColor=#ED7100;strokeColor=none;dashed=0;verticalLabelPosition=bottom;
          verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;
          aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.ecs_service;"
          vertex="1" parent="1">
          <mxGeometry x="200" y="420" width="60" height="60" as="geometry" />
        </mxCell>

        <!-- RDS -->
        <mxCell id="rds-1" value="RDS&#xa;%rds_engine%"
          style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;
          fillColor=#C925D1;strokeColor=none;dashed=0;verticalLabelPosition=bottom;
          verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;
          aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.rds;"
          vertex="1" parent="1">
          <mxGeometry x="500" y="420" width="60" height="60" as="geometry" />
        </mxCell>

        <!-- S3 -->
        <mxCell id="s3-1" value="S3&#xa;%bucket_name%"
          style="outlineConnect=0;fontColor=#232F3E;gradientColor=none;
          fillColor=#3F8624;strokeColor=none;dashed=0;verticalLabelPosition=bottom;
          verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;
          aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.s3;"
          vertex="1" parent="1">
          <mxGeometry x="700" y="420" width="60" height="60" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

#### Azure Architecture

Uses Azure-specific shapes from the draw.io Azure stencil library. Provide
placeholders for resource group, region, and service names:

- `%resource_group%` - Azure resource group name
- `%region%` - Azure region (e.g., eastus2)
- `%app_service_name%` - App Service / Function App name
- `%sql_server_name%` - Azure SQL logical server
- `%storage_account%` - Storage account name
- `%keyvault_name%` - Key Vault name

#### GCP Architecture

Uses GCP-specific shapes. Placeholders include `%project_id%`, `%region%`,
`%gke_cluster%`, `%cloud_sql_instance%`, `%gcs_bucket%`.

### 3. Business Process (BPMN)

```xml
<mxfile host="app.diagrams.net" modified="%timestamp%">
  <diagram id="bpmn-%id%" name="Business Process">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Pool -->
        <mxCell id="pool-1" value="%process_name%" style="shape=mxgraph.bpmn.shape;
          perimeter=mxPerimeter.rectanglePerimeter;whiteSpace=wrap;html=1;
          isPool=1;horizontal=0;fontSize=14;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="40" y="40" width="900" height="300" as="geometry" />
        </mxCell>

        <!-- Lane 1 -->
        <mxCell id="lane-1" value="%lane_1_role%" style="shape=mxgraph.bpmn.shape;
          perimeter=mxPerimeter.rectanglePerimeter;whiteSpace=wrap;html=1;
          isLane=1;horizontal=0;fontSize=12;" vertex="1" parent="pool-1">
          <mxGeometry x="30" y="0" width="870" height="150" as="geometry" />
        </mxCell>

        <!-- Lane 2 -->
        <mxCell id="lane-2" value="%lane_2_role%" style="shape=mxgraph.bpmn.shape;
          perimeter=mxPerimeter.rectanglePerimeter;whiteSpace=wrap;html=1;
          isLane=1;horizontal=0;fontSize=12;" vertex="1" parent="pool-1">
          <mxGeometry x="30" y="150" width="870" height="150" as="geometry" />
        </mxCell>

        <!-- Start event -->
        <mxCell id="start-1" value="" style="shape=mxgraph.bpmn.shape;
          perimeter=mxPerimeter.ellipsePerimeter;symbol=general;
          isLooping=0;isSequential=0;isCompensation=0;isAdHoc=0;
          isCall=0;isInstantiating=0;outline=standard;fillColor=#dae8fc;
          strokeColor=#6c8ebf;" vertex="1" parent="lane-1">
          <mxGeometry x="40" y="50" width="40" height="40" as="geometry" />
        </mxCell>

        <!-- Task 1 -->
        <mxCell id="task-1" value="%task_1_name%" style="shape=mxgraph.bpmn.shape;
          perimeter=mxPerimeter.rectanglePerimeter;whiteSpace=wrap;html=1;
          rounded=1;fontSize=11;" vertex="1" parent="lane-1">
          <mxGeometry x="140" y="40" width="120" height="60" as="geometry" />
        </mxCell>

        <!-- Gateway -->
        <mxCell id="gw-1" value="" style="shape=mxgraph.bpmn.shape;
          perimeter=mxPerimeter.rhombusPerimeter;symbol=exclusiveGw;
          isMarkerVisible=1;fillColor=#fff2cc;strokeColor=#d6b656;"
          vertex="1" parent="lane-1">
          <mxGeometry x="320" y="45" width="50" height="50" as="geometry" />
        </mxCell>

        <!-- End event -->
        <mxCell id="end-1" value="" style="shape=mxgraph.bpmn.shape;
          perimeter=mxPerimeter.ellipsePerimeter;symbol=terminate;
          isLooping=0;isSequential=0;isCompensation=0;isAdHoc=0;
          isCall=0;isInstantiating=0;outline=end;fillColor=#f8cecc;
          strokeColor=#b85450;" vertex="1" parent="lane-1">
          <mxGeometry x="780" y="50" width="40" height="40" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 4. Database (ERD)

```xml
<mxfile host="app.diagrams.net" modified="%timestamp%">
  <diagram id="erd-%id%" name="Entity Relationship">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Entity: %entity_1% -->
        <mxCell id="e1-header" value="%entity_1%" style="shape=table;
          startSize=30;container=1;collapsible=0;childLayout=tableLayout;
          fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;
          fillColor=#dae8fc;strokeColor=#6c8ebf;fontSize=13;"
          vertex="1" parent="1">
          <mxGeometry x="80" y="80" width="220" height="180" as="geometry" />
        </mxCell>
        <mxCell id="e1-r1" value="" style="shape=tableRow;horizontal=0;
          startSize=0;swimlaneHead=0;swimlaneBody=0;fillColor=none;
          collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];
          portConstraint=eastwest;fontSize=11;" vertex="1" parent="e1-header">
          <mxGeometry y="30" width="220" height="30" as="geometry" />
        </mxCell>
        <mxCell id="e1-r1-k" value="PK" style="shape=partialRectangle;
          connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;
          fontStyle=1;overflow=hidden;fontSize=10;" vertex="1" parent="e1-r1">
          <mxGeometry width="40" height="30" as="geometry" />
        </mxCell>
        <mxCell id="e1-r1-v" value="id: %pk_type%" style="shape=partialRectangle;
          connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;
          overflow=hidden;fontSize=11;" vertex="1" parent="e1-r1">
          <mxGeometry x="40" width="180" height="30" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 5. DevOps / CI-CD Pipeline

```xml
<mxfile host="app.diagrams.net" modified="%timestamp%">
  <diagram id="cicd-%id%" name="CI/CD Pipeline">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Pipeline header -->
        <mxCell id="header" value="%pipeline_name% Pipeline" style="text;
          html=1;fontSize=18;fontStyle=1;align=center;verticalAlign=middle;"
          vertex="1" parent="1">
          <mxGeometry x="300" y="20" width="400" height="40" as="geometry" />
        </mxCell>

        <!-- Stage: Source -->
        <mxCell id="stage-src" value="Source" style="rounded=1;whiteSpace=wrap;
          html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontSize=12;
          fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="40" y="100" width="140" height="60" as="geometry" />
        </mxCell>

        <!-- Stage: Build -->
        <mxCell id="stage-build" value="Build&#xa;%build_tool%" style="rounded=1;
          whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;
          fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="240" y="100" width="140" height="60" as="geometry" />
        </mxCell>

        <!-- Stage: Test -->
        <mxCell id="stage-test" value="Test&#xa;%test_framework%" style="rounded=1;
          whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;
          fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="440" y="100" width="140" height="60" as="geometry" />
        </mxCell>

        <!-- Stage: Deploy -->
        <mxCell id="stage-deploy" value="Deploy&#xa;%deploy_target%" style="rounded=1;
          whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;
          fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="640" y="100" width="140" height="60" as="geometry" />
        </mxCell>

        <!-- Stage: Monitor -->
        <mxCell id="stage-monitor" value="Monitor&#xa;%monitoring_tool%"
          style="rounded=1;whiteSpace=wrap;html=1;fillColor=#f8cecc;
          strokeColor=#b85450;fontSize=12;fontStyle=1;" vertex="1" parent="1">
          <mxGeometry x="840" y="100" width="140" height="60" as="geometry" />
        </mxCell>

        <!-- Arrows -->
        <mxCell id="e1" style="edgeStyle=orthogonalEdgeStyle;" edge="1"
          source="stage-src" target="stage-build" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e2" style="edgeStyle=orthogonalEdgeStyle;" edge="1"
          source="stage-build" target="stage-test" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e3" style="edgeStyle=orthogonalEdgeStyle;" edge="1"
          source="stage-test" target="stage-deploy" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="e4" style="edgeStyle=orthogonalEdgeStyle;" edge="1"
          source="stage-deploy" target="stage-monitor" parent="1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 6. Network Topology

Placeholders: `%network_name%`, `%firewall_name%`, `%switch_count%`,
`%server_count%`, `%subnet_ranges%`. Uses draw.io networking shapes
(`mxgraph.cisco`, `mxgraph.network`).

### 7. UML (Class Diagram)

```xml
<mxfile host="app.diagrams.net" modified="%timestamp%">
  <diagram id="uml-%id%" name="UML Class Diagram">
    <mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />

        <!-- Class: %class_1% -->
        <mxCell id="cls-1" value="%class_1%"
          style="swimlane;fontStyle=1;align=center;startSize=26;
          fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="200" y="80" width="200" height="160" as="geometry" />
        </mxCell>
        <mxCell id="cls-1-attrs" value="- %attr_1%: %type_1%&#xa;- %attr_2%: %type_2%&#xa;- %attr_3%: %type_3%"
          style="text;strokeColor=none;fillColor=none;align=left;
          verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;
          rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
          vertex="1" parent="cls-1">
          <mxGeometry y="26" width="200" height="64" as="geometry" />
        </mxCell>
        <mxCell id="cls-1-line" value=""
          style="line;strokeWidth=1;fillColor=none;align=left;
          verticalAlign=middle;spacingTop=-1;spacingLeft=3;spacingRight=10;
          rotatable=0;labelPosition=left;points=[];portConstraint=eastwest;"
          vertex="1" parent="cls-1">
          <mxGeometry y="90" width="200" height="8" as="geometry" />
        </mxCell>
        <mxCell id="cls-1-methods" value="+ %method_1%(): %return_1%&#xa;+ %method_2%(): %return_2%"
          style="text;strokeColor=none;fillColor=none;align=left;
          verticalAlign=top;spacingLeft=4;spacingRight=4;overflow=hidden;
          rotatable=0;points=[[0,0.5],[1,0.5]];portConstraint=eastwest;"
          vertex="1" parent="cls-1">
          <mxGeometry y="98" width="200" height="62" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

### 8. Agile / Project Management

Templates for sprint boards, roadmaps, user story maps, and Kanban flows.
Placeholders: `%project_name%`, `%sprint_name%`, `%team_name%`,
`%epic_names%`, `%milestone_dates%`.

## Template Variables

Templates use the `%variable_name%` placeholder syntax compatible with draw.io's
built-in placeholder system. Variables are resolved in this order:

1. **Explicit arguments** passed via command flags
2. **Project detection** from package.json, Dockerfile, etc.
3. **Defaults** defined in the template config

### Variable Reference

| Variable | Source | Description |
|----------|--------|-------------|
| `%timestamp%` | Auto | ISO timestamp of generation |
| `%id%` | Auto | Unique diagram identifier |
| `%project_name%` | package.json / pyproject.toml | Project name |
| `%service_N_name%` | Explicit | Service names for microservices |
| `%db_N_name%` | Explicit | Database names |
| `%gateway_name%` | Explicit | API gateway identifier |
| `%message_bus%` | Detection | Kafka, RabbitMQ, SQS, etc. |
| `%vpc_cidr%` | Explicit | VPC CIDR block |
| `%public_cidr%` | Explicit | Public subnet CIDR |
| `%private_cidr%` | Explicit | Private subnet CIDR |
| `%compute_service%` | Detection | ECS, EKS, Lambda, etc. |
| `%build_tool%` | Detection | Webpack, Vite, Maven, etc. |
| `%test_framework%` | Detection | Jest, Pytest, JUnit, etc. |
| `%deploy_target%` | Explicit | K8s, ECS, Lambda, etc. |

### Variable Resolution Script

```bash
#!/usr/bin/env bash
# resolve-template-vars.sh - Resolve template variables from project context

set -euo pipefail

TEMPLATE_FILE="$1"
OUTPUT_FILE="$2"

# Auto-detect project name
PROJECT_NAME=$(python3 -c "
import json, os
for f in ['package.json', 'pyproject.toml', 'Cargo.toml', 'pom.xml']:
    if os.path.isfile(f):
        if f == 'package.json':
            d = json.load(open(f))
            print(d.get('name', 'my-project'))
            break
print('my-project')
" 2>/dev/null || echo "my-project")

# Auto-detect build tool
BUILD_TOOL="unknown"
if [ -f "vite.config.ts" ] || [ -f "vite.config.js" ]; then
    BUILD_TOOL="Vite"
elif [ -f "webpack.config.js" ]; then
    BUILD_TOOL="Webpack"
elif [ -f "pom.xml" ]; then
    BUILD_TOOL="Maven"
elif [ -f "build.gradle" ]; then
    BUILD_TOOL="Gradle"
fi

# Auto-detect test framework
TEST_FW="unknown"
if grep -q "jest" package.json 2>/dev/null; then
    TEST_FW="Jest"
elif grep -q "vitest" package.json 2>/dev/null; then
    TEST_FW="Vitest"
elif [ -f "pytest.ini" ] || [ -f "pyproject.toml" ]; then
    TEST_FW="Pytest"
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ID=$(head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n')

sed \
    -e "s/%timestamp%/$TIMESTAMP/g" \
    -e "s/%id%/$ID/g" \
    -e "s/%project_name%/$PROJECT_NAME/g" \
    -e "s/%build_tool%/$BUILD_TOOL/g" \
    -e "s/%test_framework%/$TEST_FW/g" \
    "$TEMPLATE_FILE" > "$OUTPUT_FILE"

echo "Generated: $OUTPUT_FILE"
```

## Template Composition

Combine multiple templates into a single multi-page diagram. Each template becomes
a separate page (tab) in the draw.io file.

```bash
#!/usr/bin/env bash
# compose-templates.sh - Merge multiple templates into one multi-page .drawio file

set -euo pipefail

OUTPUT="$1"
shift

echo '<mxfile host="app.diagrams.net">' > "$OUTPUT"

PAGE=0
for TEMPLATE in "$@"; do
    PAGE=$((PAGE + 1))
    # Extract the <diagram> element from each template and append
    sed -n '/<diagram /,/<\/diagram>/p' "$TEMPLATE" >> "$OUTPUT"
done

echo '</mxfile>' >> "$OUTPUT"
echo "Composed $PAGE pages into $OUTPUT"
```

### Usage

```bash
# Compose architecture + database + pipeline into one file
./compose-templates.sh full-system.drawio \
    templates/microservices.drawio \
    templates/erd.drawio \
    templates/cicd-pipeline.drawio
```

## Template Inheritance

Base templates define structure; specialized templates override specific sections.

### Base Template (base-architecture.drawio.template)

Contains the common layout: title block, legend, version box, border. Child
templates inherit these elements and add domain-specific content.

### Specialization

```python
#!/usr/bin/env python3
"""template-inherit.py - Merge base template with specialization."""

import xml.etree.ElementTree as ET
import sys

def merge_templates(base_path, child_path, output_path):
    base_tree = ET.parse(base_path)
    child_tree = ET.parse(child_path)

    base_root = base_tree.getroot()
    child_root = child_tree.getroot()

    # Get base diagram's root element
    base_diagram = base_root.find('.//diagram')
    base_model = base_diagram.find('.//root')

    # Get child elements (skip id=0 and id=1 which are structural)
    child_model = child_root.find('.//root')
    for cell in child_model:
        cell_id = cell.get('id', '')
        if cell_id not in ('0', '1'):
            # Check if this overrides a base element
            existing = base_model.find(f".//*[@id='{cell_id}']")
            if existing is not None:
                base_model.remove(existing)
            base_model.append(cell)

    base_tree.write(output_path, xml_declaration=True, encoding='UTF-8')
    print(f"Merged: {output_path}")

if __name__ == '__main__':
    merge_templates(sys.argv[1], sys.argv[2], sys.argv[3])
```

## Template Config (Companion Files)

Each template can have a `.config.json` companion that defines its variables,
defaults, and validation rules:

```json
{
  "template": "microservices",
  "version": "1.0.0",
  "category": "software-architecture",
  "variables": {
    "gateway_name": {
      "description": "API Gateway name",
      "default": "API Gateway",
      "required": false
    },
    "service_1_name": {
      "description": "First microservice name",
      "default": "Auth",
      "required": true
    },
    "service_2_name": {
      "description": "Second microservice name",
      "default": "Users",
      "required": true
    },
    "service_3_name": {
      "description": "Third microservice name",
      "default": "Orders",
      "required": true
    },
    "message_bus": {
      "description": "Message broker type",
      "default": "Kafka",
      "enum": ["Kafka", "RabbitMQ", "SQS", "NATS", "Redis Streams"]
    }
  },
  "detection": {
    "files": ["docker-compose.yml", "k8s/"],
    "patterns": ["microservice", "gateway", "service-mesh"]
  }
}
```

## Custom Template Storage

Store custom templates in the project or globally:

```
# Project-local templates
.claude/drawio-templates/
  my-custom-arch.drawio.template
  my-custom-arch.config.json

# Plugin templates (shared)
plugins/drawio-diagramming/templates/
  software-architecture/
    microservices.drawio.template
    c4-context.drawio.template
    c4-container.drawio.template
    layered.drawio.template
  cloud-infrastructure/
    aws-three-tier.drawio.template
    azure-hub-spoke.drawio.template
    gcp-landing-zone.drawio.template
  business-process/
    bpmn-simple.drawio.template
    bpmn-collaboration.drawio.template
  database/
    erd-crow-foot.drawio.template
    erd-chen.drawio.template
  devops/
    cicd-github-actions.drawio.template
    cicd-azure-pipelines.drawio.template
    gitflow.drawio.template
  network/
    lan-topology.drawio.template
    wan-topology.drawio.template
  uml/
    class-diagram.drawio.template
    sequence-diagram.drawio.template
    state-machine.drawio.template
  agile/
    sprint-board.drawio.template
    user-story-map.drawio.template
    roadmap.drawio.template
```

## Smart Template Selection

Automatically select the best template based on project analysis:

```bash
#!/usr/bin/env bash
# smart-select.sh - Suggest templates based on project context

set -euo pipefail

SUGGESTIONS=()

# Check for containerization
if [ -f "Dockerfile" ] || [ -f "docker-compose.yml" ]; then
    SUGGESTIONS+=("devops/cicd-github-actions")
fi

# Check for Kubernetes
if [ -d "k8s" ] || [ -d "helm" ] || [ -d "charts" ]; then
    SUGGESTIONS+=("cloud-infrastructure/aws-three-tier")
    SUGGESTIONS+=("devops/cicd-github-actions")
fi

# Check for database migrations
if [ -d "migrations" ] || [ -d "prisma" ] || [ -f "schema.prisma" ]; then
    SUGGESTIONS+=("database/erd-crow-foot")
fi

# Check for microservices patterns
if [ -f "docker-compose.yml" ]; then
    SVC_COUNT=$(grep -c "build:" docker-compose.yml 2>/dev/null || echo 0)
    if [ "$SVC_COUNT" -gt 2 ]; then
        SUGGESTIONS+=("software-architecture/microservices")
    fi
fi

# Check for monorepo
if [ -f "lerna.json" ] || [ -f "pnpm-workspace.yaml" ] || [ -d "packages" ]; then
    SUGGESTIONS+=("software-architecture/layered")
fi

# Check for API definitions
if ls ./*.openapi.* 1>/dev/null 2>&1 || ls ./openapi.* 1>/dev/null 2>&1; then
    SUGGESTIONS+=("software-architecture/c4-context")
fi

echo "Suggested templates for this project:"
for tmpl in "${SUGGESTIONS[@]}"; do
    echo "  - $tmpl"
done
```

## Template Gallery

Browse available templates by category:

```bash
#!/usr/bin/env bash
# template-gallery.sh - List available templates grouped by category

TEMPLATE_DIR="${1:-plugins/drawio-diagramming/templates}"

echo "=== Draw.io Template Gallery ==="
echo ""

for category_dir in "$TEMPLATE_DIR"/*/; do
    category=$(basename "$category_dir")
    count=$(ls "$category_dir"/*.template 2>/dev/null | wc -l)
    echo "[$category] ($count templates)"

    for tmpl in "$category_dir"/*.template; do
        [ -f "$tmpl" ] || continue
        name=$(basename "$tmpl" .drawio.template)
        config="${tmpl%.template}.config.json"
        if [ -f "$config" ]; then
            desc=$(python3 -c "import json; print(json.load(open('$config')).get('description',''))" 2>/dev/null)
            echo "  - $name: $desc"
        else
            echo "  - $name"
        fi
    done
    echo ""
done
```

## Execution Flow

1. User invokes `drawio:template` with optional category and variable overrides
2. If no category specified, run smart selection based on project context
3. Present matching templates from the gallery
4. User selects a template (or accepts the top suggestion)
5. Resolve template variables from project context and explicit arguments
6. Generate the `.drawio` XML file with resolved placeholders
7. Optionally compose multiple templates into a multi-page document
8. Report generated file path and variable resolution summary
