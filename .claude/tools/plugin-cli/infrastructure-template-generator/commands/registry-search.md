---
name: itg:registry:search
description: Search the infrastructure template registry catalog
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: query
    description: Search query (keywords, template name, description)
    required: false
    type: string
flags:
  - name: category
    description: Filter by template category
    type: string
  - name: tags
    description: Filter by tags (comma-separated)
    type: string
  - name: status
    description: Filter by template status
    type: choice
    choices: [stable, beta, deprecated, all]
    default: stable
  - name: sort
    description: Sort results by field
    type: choice
    choices: [popularity, recent, name, rating]
    default: popularity
  - name: limit
    description: Maximum number of results to return
    type: number
    default: 20
aliases:
  - itg:search
  - itg:find-template
presets:
  - name: terraform
    description: Search for Terraform templates only
    flags:
      category: terraform
      status: stable
  - name: kubernetes
    description: Search for Kubernetes templates only
    flags:
      category: kubernetes
      status: stable
  - name: popular
    description: Show most popular templates
    flags:
      sort: popularity
      limit: 10
---

# Infrastructure Template Generator: Registry Search Command

**Best for:** Discovering infrastructure templates in the centralized registry, enabling teams to find proven, production-ready templates that match their technology stack and use case requirements.

## Overview

The `itg:registry:search` command provides powerful search capabilities across the ITG template registry. Teams can discover templates by keyword, category, tags, popularity, and other criteria, accelerating project setup by leveraging existing, validated templates.

**Business Value:**
- Reduces template discovery time from hours to seconds
- Prevents duplication by surfacing existing templates
- Enables knowledge sharing across teams and organizations
- Provides visibility into template usage and popularity
- Facilitates informed template selection through ratings and statistics
- Accelerates onboarding by showcasing proven patterns
- Promotes standardization through curated template catalog

## Command Workflow

### Phase 1: Query Processing
1. Parse search query and filters
2. Extract search terms and keywords
3. Identify category and tag filters
4. Apply status filter (stable, beta, deprecated, all)
5. Set sort order and result limits

### Phase 2: Registry Search
1. Query registry index with search criteria
2. Apply full-text search on template names and descriptions
3. Filter by category if specified
4. Filter by tags if specified
5. Filter by status (stable by default)

### Phase 3: Result Ranking
1. Calculate relevance scores based on query match
2. Apply sorting (popularity, recency, name, rating)
3. Boost templates with higher ratings
4. Consider download counts in ranking
5. Apply user-specific relevance adjustments

### Phase 4: Result Formatting
1. Retrieve template metadata for matched results
2. Format results with key information
3. Include usage statistics and ratings
4. Add template status badges
5. Generate quick-start commands

### Phase 5: Output
1. Display formatted search results
2. Show result count and filters applied
3. Provide template preview URLs
4. Include usage commands
5. Suggest related searches

## Search Result Format

```
Infrastructure Template Registry Search
====================================================================
Query: "kubernetes microservice"
Filters: Category: kubernetes, Status: stable
Sort: popularity
Results: 8 templates

┌─────────────────────────────────────────────────────────────────┐
│ 1. Kubernetes Microservice Template                     ⭐ 4.9 │
│    kubernetes-microservice • v2.3.0 • Stable                    │
│    Production-ready K8s microservice with service mesh,         │
│    monitoring, and auto-scaling                                 │
│                                                                  │
│    Category: kubernetes                                         │
│    Tags: kubernetes, microservices, istio, prometheus           │
│    Downloads: 1,247 (142 in last 30 days)                      │
│    Projects using: 43                                           │
│                                                                  │
│    Usage:                                                       │
│    cookiecutter https://registry.itg.dev/templates/kubernetes-microservice/2.3.0/download
│    View: https://registry.itg.dev/templates/kubernetes-microservice
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 2. Kubernetes Deployment with Helm                      ⭐ 4.7 │
│    k8s-helm-deployment • v1.8.2 • Stable                        │
│    Helm-based Kubernetes deployment with customizable charts    │
│    and value overrides                                          │
│                                                                  │
│    Category: kubernetes                                         │
│    Tags: kubernetes, helm, deployment, charts                   │
│    Downloads: 834 (98 in last 30 days)                         │
│    Projects using: 31                                           │
│                                                                  │
│    Usage:                                                       │
│    cookiecutter https://registry.itg.dev/templates/k8s-helm-deployment/1.8.2/download
│    View: https://registry.itg.dev/templates/k8s-helm-deployment │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

[... more results ...]

Showing 8 of 8 results
Try: /itg:registry:search "kubernetes" --tags "monitoring" for related templates
```

## Usage Examples

### Keyword Search

Search by keywords across template names and descriptions:

```bash
/itg:registry:search "terraform aws"
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Query: "terraform aws"
Filters: Status: stable
Sort: popularity
Results: 15 templates

1. Terraform AWS VPC Template ⭐ 4.8
   terraform-aws-vpc • v2.1.0 • Stable
   Production-ready AWS VPC with public/private subnets, NAT gateways, and VPN support
   Downloads: 247 • Projects: 18

2. Terraform AWS ECS Fargate ⭐ 4.6
   terraform-aws-ecs-fargate • v3.0.1 • Stable
   ECS Fargate service with load balancing, auto-scaling, and CloudWatch monitoring
   Downloads: 189 • Projects: 14

3. Terraform AWS Lambda Function ⭐ 4.9
   terraform-aws-lambda • v1.5.2 • Stable
   Lambda function with API Gateway, DynamoDB, and event triggers
   Downloads: 412 • Projects: 37

[... 12 more results ...]

Showing 15 of 15 results
```

**Use Case:** Quickly find all AWS Terraform templates.

### Category Filter

Search within a specific category:

```bash
/itg:registry:search --category terraform
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Filters: Category: terraform, Status: stable
Sort: popularity
Results: 18 templates

All Terraform Templates:

1. Terraform AWS VPC Template ⭐ 4.8
   Downloads: 247 • v2.1.0 • Tags: aws, networking, vpc

2. Terraform GCP GKE Cluster ⭐ 4.7
   Downloads: 198 • v3.0.0 • Tags: gcp, kubernetes, gke

3. Terraform Azure AKS ⭐ 4.6
   Downloads: 156 • v2.2.1 • Tags: azure, kubernetes, aks

[... 15 more results ...]

Browse all categories: terraform (18), kubernetes (12), docker (8), harness (7), ansible (2)
```

**Use Case:** Browse all templates in a technology category.

### Tag-Based Search

Search by specific technology tags:

```bash
/itg:registry:search --tags "kubernetes,monitoring,prometheus"
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Filters: Tags: kubernetes, monitoring, prometheus • Status: stable
Sort: popularity
Results: 6 templates

Templates matching all tags:

1. Kubernetes Microservice with Observability ⭐ 4.9
   kubernetes-microservice • v2.3.0
   Complete observability stack: Prometheus, Grafana, Jaeger, Loki
   Downloads: 1,247 • Projects: 43

2. Kubernetes Monitoring Stack ⭐ 4.7
   k8s-monitoring-stack • v1.4.0
   Prometheus operator, Grafana, AlertManager, and custom dashboards
   Downloads: 623 • Projects: 28

[... 4 more results ...]

Showing 6 of 6 results
```

**Use Case:** Find templates with specific technology combinations.

### Sort by Most Recent

Find recently published or updated templates:

```bash
/itg:registry:search --sort recent --limit 5
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Filters: Status: stable
Sort: most recent
Results: 5 templates (showing newest)

Recently Published/Updated:

1. Docker Compose Next.js Stack ⭐ 4.5
   docker-compose-nextjs • v1.0.0 • Published 2 days ago
   Next.js 15 with Turbopack, PostgreSQL, Redis, and Nginx
   Downloads: 23 • Projects: 3

2. Terraform AWS VPC Template ⭐ 4.8
   terraform-aws-vpc • v2.1.0 • Updated 3 days ago
   Added VPN support and improved NAT gateway configuration
   Downloads: 247 • Projects: 18

3. Kubernetes CronJob Template ⭐ 4.6
   k8s-cronjob • v1.2.0 • Updated 5 days ago
   Scheduled jobs with monitoring and failure notifications
   Downloads: 89 • Projects: 12

[... 2 more results ...]

Showing 5 of 78 results
```

**Use Case:** Discover latest template additions and updates.

### Sort by Highest Rated

Find top-rated templates:

```bash
/itg:registry:search --sort rating --limit 10
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Filters: Status: stable
Sort: highest rated
Results: 10 templates

Top-Rated Templates:

1. Terraform AWS Lambda Function ⭐ 4.9 (42 ratings)
   terraform-aws-lambda • v1.5.2
   Comprehensive Lambda setup with all AWS integrations
   Downloads: 412 • Projects: 37

2. Kubernetes Microservice with Observability ⭐ 4.9 (38 ratings)
   kubernetes-microservice • v2.3.0
   Production-grade microservice template
   Downloads: 1,247 • Projects: 43

3. Terraform AWS VPC Template ⭐ 4.8 (35 ratings)
   terraform-aws-vpc • v2.1.0
   Proven VPC design used by 18 teams
   Downloads: 247 • Projects: 18

[... 7 more results ...]

Showing 10 of 78 results
```

**Use Case:** Find battle-tested, community-approved templates.

### Include Beta Templates

Search including beta/experimental templates:

```bash
/itg:registry:search "nextjs" --status all
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Query: "nextjs"
Filters: Status: all (stable, beta, deprecated)
Sort: popularity
Results: 4 templates

1. Docker Compose Next.js Stack ⭐ 4.5 • Stable
   docker-compose-nextjs • v1.0.0
   Next.js 15 with Turbopack, PostgreSQL, Redis, and Nginx
   Downloads: 23 • Projects: 3

2. Next.js Vercel Deployment 🧪 Beta
   nextjs-vercel-deploy • v0.9.0
   Automated Vercel deployment with edge functions (Beta testing)
   Downloads: 8 • Projects: 1

3. Next.js Kubernetes Deployment ⭐ 4.2 • Stable
   nextjs-k8s • v2.1.3
   K8s deployment with SSR support and Redis caching
   Downloads: 67 • Projects: 9

4. Next.js AWS Amplify ⚠️ Deprecated
   nextjs-amplify • v1.3.0
   Deprecated: Use nextjs-vercel-deploy instead
   Downloads: 142 • Projects: 7 (legacy)

Showing 4 of 4 results
```

**Use Case:** Explore cutting-edge templates or understand deprecation status.

### Preset: Popular Templates

Quick view of most popular templates:

```bash
/itg:registry:search --preset popular
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Preset: Popular Templates
Sort: popularity (most downloads)
Results: 10 templates

Most Popular Infrastructure Templates:

1. Kubernetes Microservice with Observability ⭐ 4.9
   Downloads: 1,247 • Projects: 43

2. Terraform AWS Lambda Function ⭐ 4.9
   Downloads: 412 • Projects: 37

3. Terraform AWS VPC Template ⭐ 4.8
   Downloads: 247 • Projects: 18

[... 7 more results ...]

🔥 Trending: kubernetes-microservice (+45% downloads this month)
```

**Use Case:** Quickly see what the community is using most.

### Preset: Terraform Templates

Search Terraform templates specifically:

```bash
/itg:registry:search --preset terraform
```

**Expected Output:**
```
Infrastructure Template Registry Search
====================================================================
Preset: Terraform Templates
Filters: Category: terraform, Status: stable
Sort: popularity
Results: 18 templates

All Stable Terraform Templates:

1. Terraform AWS VPC Template ⭐ 4.8
   terraform-aws-vpc • v2.1.0
   AWS networking foundation

2. Terraform GCP GKE Cluster ⭐ 4.7
   terraform-gcp-gke • v3.0.0
   GCP Kubernetes cluster

[... 16 more results ...]

Showing 18 of 18 results
```

## Advanced Search Patterns

### Combining Filters

```bash
/itg:registry:search "aws" \
  --category terraform \
  --tags "networking,security" \
  --status stable \
  --sort rating
```

**Result:** Highly-rated stable Terraform templates for AWS networking and security.

### Discovering Dependencies

```bash
/itg:registry:search "monitoring" --tags "kubernetes,prometheus"
```

**Result:** Templates that provide monitoring capabilities, useful when building dependent infrastructure.

### Finding Alternatives

```bash
# Find alternatives to a deprecated template
/itg:registry:search "nextjs deployment" --status all
```

**Result:** Shows both stable and deprecated templates, helping identify migration paths.

## Search Filters Reference

### Category Options

| Category | Description | Template Count |
|----------|-------------|----------------|
| `terraform` | Terraform infrastructure templates | 18 |
| `kubernetes` | Kubernetes deployment templates | 12 |
| `docker` | Docker and Docker Compose templates | 8 |
| `harness` | Harness pipeline templates | 7 |
| `ansible` | Ansible playbook templates | 2 |

### Status Options

| Status | Description | Included in Default Search |
|--------|-------------|----------------------------|
| `stable` | Production-ready templates | ✅ Yes (default) |
| `beta` | Beta/experimental templates | ❌ No |
| `deprecated` | Deprecated templates | ❌ No |
| `all` | All templates regardless of status | N/A |

### Sort Options

| Sort By | Description | Use Case |
|---------|-------------|----------|
| `popularity` | Most downloaded templates (default) | Find widely-adopted patterns |
| `recent` | Recently published/updated | Discover latest features |
| `name` | Alphabetical order | Systematic browsing |
| `rating` | Highest rated templates | Find best-in-class |

## Common Tag Combinations

### Cloud Providers
```bash
--tags "aws"          # Amazon Web Services
--tags "azure"        # Microsoft Azure
--tags "gcp"          # Google Cloud Platform
--tags "multi-cloud"  # Multi-cloud templates
```

### Infrastructure Patterns
```bash
--tags "microservices,kubernetes"
--tags "serverless,lambda"
--tags "container,docker"
--tags "vm,compute"
```

### Cross-Cutting Concerns
```bash
--tags "monitoring,observability"
--tags "security,compliance"
--tags "networking,vpc"
--tags "ci-cd,automation"
```

## Result Interpretation

### Template Status Badges

```
⭐ 4.9      # High rating (4.0+)
🧪 Beta     # Beta/experimental
⚠️ Deprecated # Deprecated
🔥 Trending  # Rapidly growing usage
```

### Usage Statistics

```
Downloads: 1,247 (142 in last 30 days)
             │         │
             │         └── Recent adoption rate
             └── Total downloads (popularity)

Projects using: 43
                │
                └── Active project count (real-world validation)
```

### Version Indicators

```
v2.1.0 • Stable
  │       │
  │       └── Maturity status
  └── Latest version (SemVer)
```

## Integration with Other Commands

### Workflow: Search → Preview → Generate

```bash
# Step 1: Search for template
/itg:registry:search "terraform aws vpc"

# Step 2: Preview template structure (if preview command available)
/itg:preview terraform-aws-vpc \
  --version 2.1.0

# Step 3: Generate project from template
cookiecutter https://registry.itg.dev/templates/terraform-aws-vpc/2.1.0/download
```

### Workflow: Search → Compare → Select

```bash
# Find multiple candidates
/itg:registry:search "kubernetes microservice" --limit 5

# Compare specific templates (manual review of documentation)
# Open in browser:
# - https://registry.itg.dev/templates/kubernetes-microservice
# - https://registry.itg.dev/templates/k8s-microservice-helm

# Select and use best fit
cookiecutter https://registry.itg.dev/templates/kubernetes-microservice/2.3.0/download
```

## Best Practices

### Effective Search Strategies

**Start Broad, Then Refine:**
```bash
# Step 1: Broad search
/itg:registry:search "kubernetes"

# Step 2: Refine by tags
/itg:registry:search "kubernetes" --tags "microservices"

# Step 3: Further refine
/itg:registry:search "kubernetes" --tags "microservices,monitoring"
```

**Use Categories for Technology Exploration:**
```bash
# Browse all Terraform templates
/itg:registry:search --category terraform

# Browse all Kubernetes templates
/itg:registry:search --category kubernetes
```

**Leverage Presets for Quick Discovery:**
```bash
# Quick popular view
/itg:registry:search --preset popular

# Technology-specific quick view
/itg:registry:search --preset terraform
```

### Template Selection Criteria

**Consider:**
1. **Ratings:** Higher ratings indicate community validation
2. **Downloads:** More downloads suggest proven reliability
3. **Recent Updates:** Active maintenance is a positive signal
4. **Project Count:** More projects using = battle-tested
5. **Version:** Higher versions indicate maturity
6. **Documentation:** Check template documentation quality

**Red Flags:**
- ⚠️ Low ratings (< 3.5)
- ⚠️ No recent updates (> 6 months)
- ⚠️ Very few downloads
- ⚠️ Deprecated status
- ⚠️ Missing documentation

### Staying Current

**Discover New Templates:**
```bash
# Weekly check for new templates
/itg:registry:search --sort recent --limit 10
```

**Monitor Popular Trends:**
```bash
# Monthly review of trending templates
/itg:registry:search --preset popular
```

**Track Template Updates:**
```bash
# Check for updates to templates you use
/itg:registry:search "{template-name}" --status all
```

## Troubleshooting

### No Results Found

**Problem:** Search returns no results

**Solution:**
1. Broaden search query (fewer keywords)
2. Remove restrictive filters (category, tags)
3. Include beta templates (`--status all`)
4. Check for typos in search terms
5. Try alternative keywords

### Too Many Results

**Problem:** Search returns overwhelming number of results

**Solution:**
1. Add more specific keywords
2. Apply category filter (`--category`)
3. Add tag filters (`--tags`)
4. Increase specificity of search terms
5. Sort by rating or popularity to see best matches first

### Outdated Templates in Results

**Problem:** Search returns old or deprecated templates

**Solution:**
1. Sort by `recent` to prioritize updated templates
2. Check "Last Updated" date in results
3. Filter by `stable` status (default)
4. Review version numbers (higher = newer)
5. Check project usage count

### Can't Find Known Template

**Problem:** Known template doesn't appear in search results

**Solution:**
1. Verify template is published to registry
2. Check if template is deprecated (try `--status all`)
3. Search by exact template identifier
4. Browse by category instead of keyword search
5. Contact registry administrator

## Related Commands

- `/itg:registry:publish` - Publish templates to registry
- `/itg:generate` - Generate projects from templates
- `/itg:validate` - Validate templates before use
- `/itg:preview` - Preview template structure

## Technical Implementation Notes

### Search Algorithm

**Relevance Scoring:**
```
score = keyword_match * 2.0 +
        tag_match * 1.5 +
        category_match * 1.0 +
        rating_boost * 0.5 +
        popularity_boost * 0.3
```

**Popularity Boost:**
- Based on downloads (total and recent)
- Project usage count
- Rating count

**Ranking Adjustments:**
- Deprecated templates penalized by -2.0
- Beta templates penalized by -0.5 (if stable-only filter)
- Templates with more ratings ranked higher

### Search Index Structure

**Elasticsearch/OpenSearch Schema:**
```json
{
  "mappings": {
    "properties": {
      "identifier": { "type": "keyword" },
      "name": { "type": "text", "boost": 2.0 },
      "description": { "type": "text", "boost": 1.5 },
      "category": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "status": { "type": "keyword" },
      "version": { "type": "keyword" },
      "rating": { "type": "float" },
      "downloads_total": { "type": "integer" },
      "downloads_30d": { "type": "integer" },
      "projects_using": { "type": "integer" },
      "published_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

### Performance

**Search Response Times:**
- Simple keyword search: < 50ms
- Complex multi-filter search: < 200ms
- Full catalog browse: < 100ms

**Caching Strategy:**
- Popular searches cached for 5 minutes
- Category listings cached for 30 minutes
- Template metadata cached for 1 hour

## See Also

- **Infrastructure Template Generator Plugin:** `.claude/tools/plugin-cli/infrastructure-template-generator/README.md`
- **Registry Publish Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/registry-publish.md`
- **Generate Command:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/generate.md`
- **Template Registry API:** https://registry.itg.dev/docs/api
- **Cookiecutter:** https://cookiecutter.readthedocs.io/
