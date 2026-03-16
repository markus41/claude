---
description: "Network topology, infrastructure architecture, and software system mapping in draw.io with cloud, on-prem, and hybrid layouts"
triggers:
  - network diagram
  - infrastructure diagram
  - software architecture
  - topology
  - cloud architecture
  - aws diagram
  - azure diagram
  - gcp diagram
  - on-prem
  - hybrid cloud
  - load balancer
  - firewall
  - vpc
  - subnet
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
---

# Network & Software Architecture Mapping

## Diagram Type Selection

| Need | Diagram Type | Shape Library |
|------|-------------|---------------|
| Physical network layout | Network Topology | `mxgraph.network` |
| Cloud infrastructure (AWS) | AWS Architecture | `mxgraph.aws4` |
| Cloud infrastructure (Azure) | Azure Architecture | `mxgraph.azure` |
| Cloud infrastructure (GCP) | GCP Architecture | `mxgraph.gcp2` |
| Kubernetes cluster layout | K8s Diagram | `mxgraph.kubernetes` |
| Microservice communication | Service Map | General + custom |
| CI/CD pipeline | Pipeline Diagram | Flowchart + custom |
| On-prem data center | Rack Diagram | `mxgraph.rack` |
| Security zones / DMZ | Zone Diagram | Swimlanes + shapes |
| Hybrid cloud | Multi-cloud | Combined libraries |

---

## Shape Libraries

### Enabling Cloud Libraries

In draw.io: **File > Open Library From > Search** or enable from the left panel.

| Library | Prefix | Key Shapes |
|---------|--------|-----------|
| AWS 4 | `mxgraph.aws4` | EC2, S3, RDS, Lambda, VPC, ALB, CloudFront, Route53, ECS, EKS |
| Azure | `mxgraph.azure` | VM, App Service, SQL DB, Functions, AKS, Front Door, Key Vault |
| GCP | `mxgraph.gcp2` | Compute Engine, GKE, Cloud Run, BigQuery, Cloud SQL, Pub/Sub |
| Kubernetes | `mxgraph.kubernetes` | Pod, Service, Deployment, Ingress, ConfigMap, PVC, Node |
| Network | `mxgraph.network` | Router, switch, firewall, server, desktop, cloud, database |
| Cisco | `mxgraph.cisco19` | Cisco-specific network hardware icons |
| Rack | `mxgraph.rack` | Server rack, UPS, patch panel, switch unit |

---

## Network Topology

### Basic LAN/WAN Topology

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Internet cloud -->
    <mxCell id="internet" value="Internet" style="shape=mxgraph.network.cloud;fillColor=#DDEEFF;strokeColor=#6C8EBF;fontSize=14;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="300" y="20" width="120" height="70" as="geometry"/>
    </mxCell>
    <!-- Firewall -->
    <mxCell id="fw" value="Firewall" style="shape=mxgraph.network.firewall;fillColor=#F8CECC;strokeColor=#B85450;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="330" y="140" width="60" height="60" as="geometry"/>
    </mxCell>
    <!-- Router -->
    <mxCell id="router" value="Core Router" style="shape=mxgraph.network.router;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="330" y="250" width="60" height="40" as="geometry"/>
    </mxCell>
    <!-- Switch -->
    <mxCell id="sw1" value="Switch A" style="shape=mxgraph.network.switch;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="160" y="340" width="60" height="30" as="geometry"/>
    </mxCell>
    <mxCell id="sw2" value="Switch B" style="shape=mxgraph.network.switch;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=11;" vertex="1" parent="1">
      <mxGeometry x="500" y="340" width="60" height="30" as="geometry"/>
    </mxCell>
    <!-- Servers -->
    <mxCell id="srv1" value="Web Server" style="shape=mxgraph.network.server;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="100" y="420" width="50" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="srv2" value="App Server" style="shape=mxgraph.network.server;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="220" y="420" width="50" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="db" value="Database" style="shape=cylinder3;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=10;whiteSpace=wrap;html=1;boundedLbl=1;size=10;" vertex="1" parent="1">
      <mxGeometry x="490" y="420" width="50" height="60" as="geometry"/>
    </mxCell>
    <!-- Connections -->
    <mxCell id="c1" style="strokeColor=#666;strokeWidth=2;" edge="1" source="internet" target="fw" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="c2" style="strokeColor=#666;strokeWidth=2;" edge="1" source="fw" target="router" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="c3" style="strokeColor=#666;strokeWidth=2;" edge="1" source="router" target="sw1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="c4" style="strokeColor=#666;strokeWidth=2;" edge="1" source="router" target="sw2" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="c5" style="strokeColor=#666;strokeWidth=1;" edge="1" source="sw1" target="srv1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="c6" style="strokeColor=#666;strokeWidth=1;" edge="1" source="sw1" target="srv2" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
    <mxCell id="c7" style="strokeColor=#666;strokeWidth=1;" edge="1" source="sw2" target="db" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## AWS Architecture

### Three-Tier Web Application

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- VPC boundary -->
    <mxCell id="vpc" value="VPC (10.0.0.0/16)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#248814;strokeWidth=2;dashed=1;verticalAlign=top;fontStyle=1;fontSize=13;fontColor=#248814;spacingTop=4;arcSize=4;" vertex="1" parent="1">
      <mxGeometry x="80" y="100" width="640" height="440" as="geometry"/>
    </mxCell>
    <!-- Public subnet -->
    <mxCell id="pubSub" value="Public Subnet (10.0.1.0/24)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E8F5E9;strokeColor=#82B366;dashed=1;verticalAlign=top;fontSize=11;fontColor=#82B366;spacingTop=4;" vertex="1" parent="1">
      <mxGeometry x="100" y="140" width="280" height="160" as="geometry"/>
    </mxCell>
    <!-- Private subnet -->
    <mxCell id="privSub" value="Private Subnet (10.0.2.0/24)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFF3E0;strokeColor=#D6B656;dashed=1;verticalAlign=top;fontSize=11;fontColor=#D6B656;spacingTop=4;" vertex="1" parent="1">
      <mxGeometry x="420" y="140" width="280" height="160" as="geometry"/>
    </mxCell>
    <!-- Data subnet -->
    <mxCell id="dataSub" value="Data Subnet (10.0.3.0/24)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FCE4EC;strokeColor=#B85450;dashed=1;verticalAlign=top;fontSize=11;fontColor=#B85450;spacingTop=4;" vertex="1" parent="1">
      <mxGeometry x="200" y="340" width="400" height="180" as="geometry"/>
    </mxCell>
    <!-- CloudFront -->
    <mxCell id="cf" value="CloudFront" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.cloudfront;fillColor=#8C4FFF;fontColor=#333;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="30" y="20" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- ALB -->
    <mxCell id="alb" value="ALB" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.elastic_load_balancing;fillColor=#8C4FFF;fontColor=#333;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="140" y="180" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- EC2 instances -->
    <mxCell id="ec2a" value="EC2" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.ec2;fillColor=#ED7100;fontColor=#333;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="280" y="180" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- Lambda -->
    <mxCell id="lambda" value="Lambda" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.lambda;fillColor=#ED7100;fontColor=#333;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="460" y="180" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- RDS -->
    <mxCell id="rds" value="RDS (Multi-AZ)" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.rds;fillColor=#C925D1;fontColor=#333;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="280" y="400" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- ElastiCache -->
    <mxCell id="cache" value="ElastiCache" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.elasticache;fillColor=#C925D1;fontColor=#333;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="440" y="400" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- S3 -->
    <mxCell id="s3" value="S3" style="shape=mxgraph.aws4.resourceIcon;resIcon=mxgraph.aws4.s3;fillColor=#3F8624;fontColor=#333;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="620" y="180" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- Connections -->
    <mxCell id="a1" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="cf" target="alb" parent="1"/>
    <mxCell id="a2" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="alb" target="ec2a" parent="1"/>
    <mxCell id="a3" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="ec2a" target="lambda" parent="1"/>
    <mxCell id="a4" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="ec2a" target="rds" parent="1"/>
    <mxCell id="a5" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="lambda" target="cache" parent="1"/>
    <mxCell id="a6" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="lambda" target="s3" parent="1"/>
  </root>
</mxGraphModel>
```

### AWS Style Guide

| Service Category | Icon Fill | Examples |
|-----------------|-----------|----------|
| Compute | `#ED7100` (orange) | EC2, Lambda, ECS, Fargate |
| Storage | `#3F8624` (green) | S3, EBS, EFS |
| Database | `#C925D1` (purple) | RDS, DynamoDB, ElastiCache |
| Networking | `#8C4FFF` (violet) | VPC, ALB, CloudFront, Route53 |
| Security | `#DD344C` (red) | IAM, WAF, Shield, KMS |
| Management | `#E7157B` (pink) | CloudWatch, CloudTrail, Config |

---

## Azure Architecture

### Key Azure Shapes

```
App Service:    shape=mxgraph.azure.app_service;
AKS:            shape=mxgraph.azure.kubernetes_services;
SQL Database:   shape=mxgraph.azure.azure_sql_database;
Functions:      shape=mxgraph.azure.function_apps;
Front Door:     shape=mxgraph.azure.front_doors;
Key Vault:      shape=mxgraph.azure.key_vaults;
Storage:        shape=mxgraph.azure.storage;
Cosmos DB:      shape=mxgraph.azure.azure_cosmos_db;
VNET:           shape=mxgraph.azure.virtual_networks;
```

### Azure Resource Group Pattern

```xml
<!-- Resource Group boundary -->
<mxCell id="rg" value="rg-myapp-prod" style="rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#0078D4;strokeWidth=2;dashed=1;verticalAlign=top;fontStyle=1;fontSize=12;fontColor=#0078D4;spacingTop=4;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="500" height="300" as="geometry"/>
</mxCell>
```

---

## GCP Architecture

### Key GCP Shapes

```
Compute Engine: shape=mxgraph.gcp2.compute_engine;
GKE:            shape=mxgraph.gcp2.google_kubernetes_engine;
Cloud Run:      shape=mxgraph.gcp2.cloud_run;
Cloud SQL:      shape=mxgraph.gcp2.cloud_sql;
BigQuery:       shape=mxgraph.gcp2.bigquery;
Pub/Sub:        shape=mxgraph.gcp2.cloud_pubsub;
Cloud Storage:  shape=mxgraph.gcp2.cloud_storage;
Cloud Functions: shape=mxgraph.gcp2.cloud_functions;
```

---

## Kubernetes Cluster Diagrams

### K8s Deployment Topology

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Cluster boundary -->
    <mxCell id="cluster" value="K8s Cluster" style="rounded=1;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#326CE5;strokeWidth=2;dashed=1;verticalAlign=top;fontStyle=1;fontSize=14;fontColor=#326CE5;arcSize=4;spacingTop=4;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="600" height="400" as="geometry"/>
    </mxCell>
    <!-- Namespace -->
    <mxCell id="ns" value="namespace: production" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EBF0F7;strokeColor=#326CE5;dashed=1;verticalAlign=top;fontSize=11;fontColor=#326CE5;spacingTop=4;" vertex="1" parent="1">
      <mxGeometry x="60" y="80" width="560" height="340" as="geometry"/>
    </mxCell>
    <!-- Ingress -->
    <mxCell id="ingress" value="Ingress" style="shape=mxgraph.kubernetes.ingress;fillColor=#326CE5;fontColor=#FFF;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="80" y="120" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- Service -->
    <mxCell id="svc" value="Service&#xa;(ClusterIP)" style="shape=mxgraph.kubernetes.svc;fillColor=#326CE5;fontColor=#FFF;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="200" y="120" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- Deployment -->
    <mxCell id="deploy" value="Deployment&#xa;(3 replicas)" style="shape=mxgraph.kubernetes.deploy;fillColor=#326CE5;fontColor=#FFF;fontSize=10;" vertex="1" parent="1">
      <mxGeometry x="340" y="110" width="48" height="48" as="geometry"/>
    </mxCell>
    <!-- Pods -->
    <mxCell id="pod1" value="Pod 1" style="shape=mxgraph.kubernetes.pod;fillColor=#326CE5;fontColor=#FFF;fontSize=9;" vertex="1" parent="1">
      <mxGeometry x="440" y="100" width="40" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="pod2" value="Pod 2" style="shape=mxgraph.kubernetes.pod;fillColor=#326CE5;fontColor=#FFF;fontSize=9;" vertex="1" parent="1">
      <mxGeometry x="500" y="100" width="40" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="pod3" value="Pod 3" style="shape=mxgraph.kubernetes.pod;fillColor=#326CE5;fontColor=#FFF;fontSize=9;" vertex="1" parent="1">
      <mxGeometry x="560" y="100" width="40" height="40" as="geometry"/>
    </mxCell>
    <!-- ConfigMap -->
    <mxCell id="cm" value="ConfigMap" style="shape=mxgraph.kubernetes.cm;fillColor=#326CE5;fontColor=#FFF;fontSize=9;" vertex="1" parent="1">
      <mxGeometry x="200" y="240" width="40" height="40" as="geometry"/>
    </mxCell>
    <!-- Secret -->
    <mxCell id="secret" value="Secret" style="shape=mxgraph.kubernetes.secret;fillColor=#326CE5;fontColor=#FFF;fontSize=9;" vertex="1" parent="1">
      <mxGeometry x="300" y="240" width="40" height="40" as="geometry"/>
    </mxCell>
    <!-- PVC -->
    <mxCell id="pvc" value="PVC" style="shape=mxgraph.kubernetes.pvc;fillColor=#326CE5;fontColor=#FFF;fontSize=9;" vertex="1" parent="1">
      <mxGeometry x="400" y="240" width="40" height="40" as="geometry"/>
    </mxCell>
    <!-- HPA -->
    <mxCell id="hpa" value="HPA" style="shape=mxgraph.kubernetes.hpa;fillColor=#326CE5;fontColor=#FFF;fontSize=9;" vertex="1" parent="1">
      <mxGeometry x="340" y="180" width="40" height="40" as="geometry"/>
    </mxCell>
    <!-- Connections -->
    <mxCell id="k1" style="strokeColor=#326CE5;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="ingress" target="svc" parent="1"/>
    <mxCell id="k2" style="strokeColor=#326CE5;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="svc" target="deploy" parent="1"/>
    <mxCell id="k3" style="strokeColor=#326CE5;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="deploy" target="pod1" parent="1"/>
    <mxCell id="k4" style="strokeColor=#326CE5;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="deploy" target="pod2" parent="1"/>
    <mxCell id="k5" style="strokeColor=#326CE5;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="deploy" target="pod3" parent="1"/>
    <mxCell id="k6" style="strokeColor=#999;strokeWidth=1;dashed=1;endArrow=open;" edge="1" source="pod1" target="cm" parent="1"/>
    <mxCell id="k7" style="strokeColor=#999;strokeWidth=1;dashed=1;endArrow=open;" edge="1" source="pod1" target="secret" parent="1"/>
    <mxCell id="k8" style="strokeColor=#999;strokeWidth=1;dashed=1;endArrow=open;" edge="1" source="pod1" target="pvc" parent="1"/>
  </root>
</mxGraphModel>
```

---

## Microservice Architecture

### Service Mesh Pattern

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- API Gateway -->
    <mxCell id="gw" value="&lt;b&gt;API Gateway&lt;/b&gt;&#xa;Kong / Envoy" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;fontSize=12;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="280" y="20" width="140" height="50" as="geometry"/>
    </mxCell>
    <!-- Services -->
    <mxCell id="auth" value="&lt;b&gt;Auth Service&lt;/b&gt;&#xa;Node.js" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=11;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="60" y="140" width="130" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="user" value="&lt;b&gt;User Service&lt;/b&gt;&#xa;Python" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=11;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="240" y="140" width="130" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="order" value="&lt;b&gt;Order Service&lt;/b&gt;&#xa;Go" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=11;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="420" y="140" width="130" height="50" as="geometry"/>
    </mxCell>
    <mxCell id="notify" value="&lt;b&gt;Notification&lt;/b&gt;&#xa;Node.js" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#D5E8D4;strokeColor=#82B366;fontSize=11;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="600" y="140" width="130" height="50" as="geometry"/>
    </mxCell>
    <!-- Message broker -->
    <mxCell id="mq" value="&lt;b&gt;RabbitMQ&lt;/b&gt;" style="shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fillColor=#FFF2CC;strokeColor=#D6B656;fontSize=12;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="320" y="260" width="120" height="50" as="geometry"/>
    </mxCell>
    <!-- Databases -->
    <mxCell id="authDb" value="Auth DB&#xa;(Redis)" style="shape=cylinder3;fillColor=#F8CECC;strokeColor=#B85450;fontSize=10;whiteSpace=wrap;html=1;boundedLbl=1;size=8;" vertex="1" parent="1">
      <mxGeometry x="85" y="260" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="userDb" value="User DB&#xa;(Postgres)" style="shape=cylinder3;fillColor=#F8CECC;strokeColor=#B85450;fontSize=10;whiteSpace=wrap;html=1;boundedLbl=1;size=8;" vertex="1" parent="1">
      <mxGeometry x="260" y="260" width="60" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="orderDb" value="Order DB&#xa;(MongoDB)" style="shape=cylinder3;fillColor=#F8CECC;strokeColor=#B85450;fontSize=10;whiteSpace=wrap;html=1;boundedLbl=1;size=8;" vertex="1" parent="1">
      <mxGeometry x="450" y="260" width="60" height="60" as="geometry"/>
    </mxCell>
    <!-- Connections: gateway to services -->
    <mxCell id="g1" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="gw" target="auth" parent="1"/>
    <mxCell id="g2" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="gw" target="user" parent="1"/>
    <mxCell id="g3" style="strokeColor=#666;strokeWidth=1;endArrow=block;endFill=1;" edge="1" source="gw" target="order" parent="1"/>
    <!-- Async via message broker -->
    <mxCell id="m1" value="events" style="strokeColor=#D6B656;strokeWidth=1;dashed=1;endArrow=open;fontSize=9;fontColor=#999;" edge="1" source="order" target="mq" parent="1"/>
    <mxCell id="m2" value="events" style="strokeColor=#D6B656;strokeWidth=1;dashed=1;endArrow=open;fontSize=9;fontColor=#999;" edge="1" source="mq" target="notify" parent="1"/>
    <!-- Service to DB -->
    <mxCell id="d1" style="strokeColor=#B85450;strokeWidth=1;endArrow=diamond;endFill=0;" edge="1" source="auth" target="authDb" parent="1"/>
    <mxCell id="d2" style="strokeColor=#B85450;strokeWidth=1;endArrow=diamond;endFill=0;" edge="1" source="user" target="userDb" parent="1"/>
    <mxCell id="d3" style="strokeColor=#B85450;strokeWidth=1;endArrow=diamond;endFill=0;" edge="1" source="order" target="orderDb" parent="1"/>
  </root>
</mxGraphModel>
```

---

## Zone / Security Diagrams

### DMZ Architecture

Use nested containers to represent security zones:

```xml
<!-- External zone -->
<mxCell id="extZone" value="External Zone (Untrusted)" style="rounded=1;fillColor=#FFEBEE;strokeColor=#B85450;strokeWidth=2;dashed=1;verticalAlign=top;fontStyle=1;fontSize=12;fontColor=#B85450;spacingTop=4;" vertex="1" parent="1">
  <mxGeometry x="20" y="20" width="200" height="300" as="geometry"/>
</mxCell>
<!-- DMZ -->
<mxCell id="dmz" value="DMZ (Semi-Trusted)" style="rounded=1;fillColor=#FFF3E0;strokeColor=#D6B656;strokeWidth=2;dashed=1;verticalAlign=top;fontStyle=1;fontSize=12;fontColor=#D6B656;spacingTop=4;" vertex="1" parent="1">
  <mxGeometry x="260" y="20" width="200" height="300" as="geometry"/>
</mxCell>
<!-- Internal zone -->
<mxCell id="intZone" value="Internal Zone (Trusted)" style="rounded=1;fillColor=#E8F5E9;strokeColor=#82B366;strokeWidth=2;dashed=1;verticalAlign=top;fontStyle=1;fontSize=12;fontColor=#82B366;spacingTop=4;" vertex="1" parent="1">
  <mxGeometry x="500" y="20" width="200" height="300" as="geometry"/>
</mxCell>
```

### Zone Color Convention

| Zone | Fill | Stroke | Trust Level |
|------|------|--------|-------------|
| External | `#FFEBEE` | `#B85450` (red) | Untrusted |
| DMZ | `#FFF3E0` | `#D6B656` (amber) | Semi-trusted |
| Internal | `#E8F5E9` | `#82B366` (green) | Trusted |
| Management | `#E3F2FD` | `#6C8EBF` (blue) | Admin only |

---

## Connection Style Guide

| Connection Type | Style | Use |
|----------------|-------|-----|
| Synchronous (HTTP/gRPC) | `strokeColor=#666;strokeWidth=2;endArrow=block;endFill=1;` | Request/response |
| Asynchronous (events) | `strokeColor=#D6B656;strokeWidth=1;dashed=1;endArrow=open;` | Pub/sub, message queues |
| Database access | `strokeColor=#B85450;strokeWidth=1;endArrow=diamond;endFill=0;` | Read/write to DB |
| Monitoring / logs | `strokeColor=#999;strokeWidth=1;dashed=1;dashPattern=4 4;endArrow=open;` | Observability |
| Bidirectional | `strokeColor=#666;strokeWidth=1;endArrow=block;startArrow=block;endFill=1;startFill=1;` | WebSocket, streaming |

---

## Layout Best Practices

1. **Flow direction** — Traffic flows top-to-bottom (internet at top, databases at bottom) or left-to-right
2. **Group by zone** — Use dashed containers for VPCs, subnets, namespaces, security zones
3. **Color by function** — Compute (blue), storage (green), database (yellow/red), network (purple)
4. **Label protocols** — Add edge labels: `HTTPS`, `gRPC`, `AMQP`, `TCP/5432`
5. **Show redundancy** — Use grouped icons or `(3x)` labels for replicated components
6. **Add a legend** — Include a box in the corner explaining colors, line styles, and icon meanings
7. **Use layers** — Separate physical, logical, and security views into draw.io layers
