---
name: itg:terraform
description: Generate Terraform modules from analyzed infrastructure patterns
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: module-name
    description: Name for the Terraform module
    required: true
    type: string
flags:
  - name: provider
    description: Cloud provider for the module
    type: choice
    choices: [azurerm, aws, google, kubernetes]
    default: azurerm
  - name: output
    description: Output directory
    type: string
    default: "./terraform/modules"
  - name: environments
    description: Environments to generate tfvars for
    type: string
    default: "dev,staging,prod"
  - name: include-versions
    description: Include provider version constraints
    type: boolean
    default: true
  - name: harness-iacm
    description: Generate Harness IaCM workspace config
    type: boolean
    default: false
presets:
  - name: azure-standard
    description: Standard Azure module with all environments
    flags:
      provider: azurerm
      environments: "dev,staging,prod"
  - name: aws-minimal
    description: Minimal AWS module
    flags:
      provider: aws
      environments: "dev"
---

# itg:terraform - Terraform Module Generator

Generate production-ready Terraform modules from analyzed infrastructure patterns with environment configurations and Harness IaCM integration.

## Overview

This command creates complete Terraform module structures including:
- Main resource definitions
- Variable declarations with validation
- Output definitions
- Environment-specific tfvars files
- Provider version constraints
- Harness IaCM workspace configuration
- Module documentation

## Command Syntax

```bash
# Basic usage
/itg:terraform <module-name>

# With cloud provider
/itg:terraform redis-cluster --provider=azurerm

# Multiple environments
/itg:terraform aks-cluster --provider=azurerm --environments="dev,staging,prod"

# With Harness IaCM integration
/itg:terraform postgres-ha --provider=azurerm --harness-iacm

# Using preset
/itg:terraform app-service --preset=azure-standard

# Custom output directory
/itg:terraform network --output="./infrastructure/modules"
```

## Generated Module Structure

```
terraform/modules/{module-name}/
├── main.tf                      # Main resource definitions
├── variables.tf                 # Input variable declarations
├── outputs.tf                   # Output value definitions
├── versions.tf                  # Terraform and provider versions
├── README.md                    # Module documentation
├── examples/
│   ├── basic/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   └── complete/
│       ├── main.tf
│       └── terraform.tfvars
├── environments/
│   ├── dev.tfvars              # Development environment
│   ├── staging.tfvars          # Staging environment
│   └── prod.tfvars             # Production environment
└── harness/
    └── workspace.yaml          # Harness IaCM workspace config
```

## Module File Examples

### main.tf - Azure Redis Cache

```hcl
# terraform/modules/redis-cluster/main.tf
terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
  }
}

# Locals for naming and tagging
locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "terraform"
      Module      = "redis-cluster"
    }
  )
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "main" {
  name                = "${local.name_prefix}-redis"
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = var.capacity
  family              = var.family
  sku_name            = var.sku_name
  shard_count         = var.shard_count
  enable_non_ssl_port = var.enable_non_ssl_port
  minimum_tls_version = var.minimum_tls_version

  redis_configuration {
    maxmemory_policy           = var.maxmemory_policy
    maxmemory_reserved         = var.maxmemory_reserved
    maxmemory_delta            = var.maxmemory_delta
    notify_keyspace_events     = var.notify_keyspace_events
    rdb_backup_enabled         = var.enable_backup
    rdb_backup_frequency       = var.backup_frequency
    rdb_storage_connection_string = var.enable_backup ? var.backup_storage_connection_string : null
  }

  dynamic "patch_schedule" {
    for_each = var.patch_schedule != null ? [var.patch_schedule] : []
    content {
      day_of_week    = patch_schedule.value.day_of_week
      start_hour_utc = patch_schedule.value.start_hour_utc
    }
  }

  zones = var.zones

  tags = local.common_tags
}

# Private Endpoint (optional)
resource "azurerm_private_endpoint" "redis" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = "${local.name_prefix}-redis-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${local.name_prefix}-redis-psc"
    private_connection_resource_id = azurerm_redis_cache.main.id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }

  tags = local.common_tags
}

# Firewall Rules
resource "azurerm_redis_firewall_rule" "rules" {
  for_each            = { for rule in var.firewall_rules : rule.name => rule }
  name                = each.value.name
  redis_cache_name    = azurerm_redis_cache.main.name
  resource_group_name = var.resource_group_name
  start_ip            = each.value.start_ip
  end_ip              = each.value.end_ip
}

# Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "redis" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "${local.name_prefix}-redis-diag"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ConnectedClientList"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
```

### variables.tf - Input Variables

```hcl
# terraform/modules/redis-cluster/variables.tf

# Required Variables
variable "project" {
  description = "Project name used for resource naming"
  type        = string
  validation {
    condition     = length(var.project) >= 2 && length(var.project) <= 20
    error_message = "Project name must be between 2 and 20 characters."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

# Redis Configuration
variable "capacity" {
  description = "Redis cache capacity (0-6 for Basic/Standard, 1-5 for Premium)"
  type        = number
  default     = 2
  validation {
    condition     = var.capacity >= 0 && var.capacity <= 6
    error_message = "Capacity must be between 0 and 6."
  }
}

variable "family" {
  description = "Redis SKU family (C for Basic/Standard, P for Premium)"
  type        = string
  default     = "P"
  validation {
    condition     = contains(["C", "P"], var.family)
    error_message = "Family must be C (Basic/Standard) or P (Premium)."
  }
}

variable "sku_name" {
  description = "Redis SKU name (Basic, Standard, Premium)"
  type        = string
  default     = "Premium"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.sku_name)
    error_message = "SKU must be Basic, Standard, or Premium."
  }
}

variable "shard_count" {
  description = "Number of shards for Premium SKU (1-10)"
  type        = number
  default     = 3
  validation {
    condition     = var.shard_count >= 1 && var.shard_count <= 10
    error_message = "Shard count must be between 1 and 10."
  }
}

variable "enable_non_ssl_port" {
  description = "Enable non-SSL port 6379"
  type        = bool
  default     = false
}

variable "minimum_tls_version" {
  description = "Minimum TLS version"
  type        = string
  default     = "1.2"
  validation {
    condition     = contains(["1.0", "1.1", "1.2"], var.minimum_tls_version)
    error_message = "TLS version must be 1.0, 1.1, or 1.2."
  }
}

# Redis Configuration Options
variable "maxmemory_policy" {
  description = "Maxmemory eviction policy"
  type        = string
  default     = "allkeys-lru"
  validation {
    condition = contains([
      "volatile-lru", "allkeys-lru", "volatile-lfu", "allkeys-lfu",
      "volatile-random", "allkeys-random", "volatile-ttl", "noeviction"
    ], var.maxmemory_policy)
    error_message = "Invalid maxmemory policy."
  }
}

variable "maxmemory_reserved" {
  description = "Maxmemory reserved in MB"
  type        = number
  default     = 50
}

variable "maxmemory_delta" {
  description = "Maxmemory delta in MB"
  type        = number
  default     = 50
}

variable "notify_keyspace_events" {
  description = "Keyspace notifications configuration"
  type        = string
  default     = "Ex"
}

# Backup Configuration
variable "enable_backup" {
  description = "Enable RDB backup"
  type        = bool
  default     = true
}

variable "backup_frequency" {
  description = "Backup frequency in minutes (15, 30, 60, 360, 720, 1440)"
  type        = number
  default     = 60
  validation {
    condition     = contains([15, 30, 60, 360, 720, 1440], var.backup_frequency)
    error_message = "Backup frequency must be 15, 30, 60, 360, 720, or 1440."
  }
}

variable "backup_storage_connection_string" {
  description = "Storage connection string for backups"
  type        = string
  default     = null
  sensitive   = true
}

# Patch Schedule
variable "patch_schedule" {
  description = "Patch schedule configuration"
  type = object({
    day_of_week    = string
    start_hour_utc = number
  })
  default = null
}

# High Availability
variable "zones" {
  description = "Availability zones for zone redundancy"
  type        = list(string)
  default     = ["1", "2", "3"]
}

# Network Configuration
variable "enable_private_endpoint" {
  description = "Enable private endpoint"
  type        = bool
  default     = false
}

variable "private_endpoint_subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
  default     = null
}

variable "firewall_rules" {
  description = "Firewall rules for Redis"
  type = list(object({
    name     = string
    start_ip = string
    end_ip   = string
  }))
  default = []
}

# Monitoring
variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for diagnostics"
  type        = string
  default     = null
}

# Tags
variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
```

### outputs.tf - Output Values

```hcl
# terraform/modules/redis-cluster/outputs.tf

output "id" {
  description = "Redis cache ID"
  value       = azurerm_redis_cache.main.id
}

output "name" {
  description = "Redis cache name"
  value       = azurerm_redis_cache.main.name
}

output "hostname" {
  description = "Redis cache hostname"
  value       = azurerm_redis_cache.main.hostname
}

output "ssl_port" {
  description = "Redis cache SSL port"
  value       = azurerm_redis_cache.main.ssl_port
}

output "port" {
  description = "Redis cache non-SSL port"
  value       = azurerm_redis_cache.main.port
}

output "primary_access_key" {
  description = "Primary access key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "secondary_access_key" {
  description = "Secondary access key"
  value       = azurerm_redis_cache.main.secondary_access_key
  sensitive   = true
}

output "primary_connection_string" {
  description = "Primary connection string"
  value       = azurerm_redis_cache.main.primary_connection_string
  sensitive   = true
}

output "secondary_connection_string" {
  description = "Secondary connection string"
  value       = azurerm_redis_cache.main.secondary_connection_string
  sensitive   = true
}

output "configuration" {
  description = "Redis configuration"
  value = {
    maxmemory_policy       = azurerm_redis_cache.main.redis_configuration[0].maxmemory_policy
    maxmemory_reserved     = azurerm_redis_cache.main.redis_configuration[0].maxmemory_reserved
    maxmemory_delta        = azurerm_redis_cache.main.redis_configuration[0].maxmemory_delta
    notify_keyspace_events = azurerm_redis_cache.main.redis_configuration[0].notify_keyspace_events
  }
}

output "private_endpoint_id" {
  description = "Private endpoint ID"
  value       = var.enable_private_endpoint ? azurerm_private_endpoint.redis[0].id : null
}

output "private_ip_address" {
  description = "Private IP address"
  value       = var.enable_private_endpoint ? azurerm_private_endpoint.redis[0].private_service_connection[0].private_ip_address : null
}
```

### versions.tf - Provider Versions

```hcl
# terraform/modules/redis-cluster/versions.tf

terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
  }
}
```

## Environment Configuration Examples

### dev.tfvars - Development Environment

```hcl
# terraform/modules/redis-cluster/environments/dev.tfvars

# Project Configuration
project     = "myapp"
environment = "dev"
location    = "eastus"

# Redis Configuration - Minimal for development
capacity             = 1
family               = "P"
sku_name             = "Premium"
shard_count          = 1
enable_non_ssl_port  = false
minimum_tls_version  = "1.2"

# Redis Settings
maxmemory_policy       = "allkeys-lru"
maxmemory_reserved     = 10
maxmemory_delta        = 10
notify_keyspace_events = "Ex"

# Backup - Disabled for dev
enable_backup = false

# High Availability - Single zone for dev
zones = ["1"]

# Network - No private endpoint for dev
enable_private_endpoint = false

# Firewall - Allow office IP
firewall_rules = [
  {
    name     = "office"
    start_ip = "203.0.113.0"
    end_ip   = "203.0.113.255"
  }
]

# Tags
tags = {
  CostCenter = "engineering"
  Owner      = "platform-team"
}
```

### staging.tfvars - Staging Environment

```hcl
# terraform/modules/redis-cluster/environments/staging.tfvars

# Project Configuration
project     = "myapp"
environment = "staging"
location    = "eastus"

# Redis Configuration - Mid-tier for staging
capacity             = 2
family               = "P"
sku_name             = "Premium"
shard_count          = 2
enable_non_ssl_port  = false
minimum_tls_version  = "1.2"

# Redis Settings
maxmemory_policy       = "allkeys-lru"
maxmemory_reserved     = 25
maxmemory_delta        = 25
notify_keyspace_events = "Ex"

# Backup - Daily for staging
enable_backup       = true
backup_frequency    = 1440  # Daily

# Patch Schedule
patch_schedule = {
  day_of_week    = "Sunday"
  start_hour_utc = 2
}

# High Availability - Multi-zone
zones = ["1", "2"]

# Network - Private endpoint enabled
enable_private_endpoint = true

# Firewall - Restricted access
firewall_rules = [
  {
    name     = "vpn"
    start_ip = "10.0.0.0"
    end_ip   = "10.0.255.255"
  }
]

# Tags
tags = {
  CostCenter = "engineering"
  Owner      = "platform-team"
}
```

### prod.tfvars - Production Environment

```hcl
# terraform/modules/redis-cluster/environments/prod.tfvars

# Project Configuration
project     = "myapp"
environment = "prod"
location    = "eastus"

# Redis Configuration - High-performance for production
capacity             = 3
family               = "P"
sku_name             = "Premium"
shard_count          = 3
enable_non_ssl_port  = false
minimum_tls_version  = "1.2"

# Redis Settings
maxmemory_policy       = "allkeys-lru"
maxmemory_reserved     = 50
maxmemory_delta        = 50
notify_keyspace_events = "Ex"

# Backup - Hourly for production
enable_backup       = true
backup_frequency    = 60  # Hourly

# Patch Schedule
patch_schedule = {
  day_of_week    = "Sunday"
  start_hour_utc = 3
}

# High Availability - Full zone redundancy
zones = ["1", "2", "3"]

# Network - Private endpoint required
enable_private_endpoint = true

# Firewall - No public access
firewall_rules = []

# Tags
tags = {
  CostCenter     = "engineering"
  Owner          = "platform-team"
  Criticality    = "high"
  DataClassification = "confidential"
}
```

## Harness IaCM Integration

### workspace.yaml - Harness IaCM Configuration

```yaml
# terraform/modules/redis-cluster/harness/workspace.yaml

apiVersion: iacm.harness.io/v1
kind: Workspace
metadata:
  name: redis-cluster
  description: "Redis Cache cluster module"
  labels:
    module: redis-cluster
    provider: azurerm
    category: database

spec:
  # Terraform Configuration
  terraform:
    version: "1.6.0"

  # Provider Configuration
  provider:
    azurerm:
      version: "~> 3.85.0"
      features: {}

  # Backend Configuration
  backend:
    type: azurerm
    config:
      resource_group_name: terraform-state-rg
      storage_account_name: tfstate${var.environment}
      container_name: tfstate
      key: modules/redis-cluster/${var.environment}.tfstate

  # Variables
  variables:
    - name: project
      type: string
      description: "Project name"
      required: true

    - name: environment
      type: string
      description: "Environment name"
      required: true
      validation:
        condition: "contains(['dev', 'staging', 'prod'], var.environment)"

    - name: resource_group_name
      type: string
      description: "Resource group name"
      required: true

    - name: capacity
      type: number
      description: "Redis cache capacity"
      default: 2

    - name: shard_count
      type: number
      description: "Number of shards"
      default: 3

  # Outputs
  outputs:
    - name: hostname
      description: "Redis hostname"

    - name: ssl_port
      description: "Redis SSL port"

    - name: primary_connection_string
      description: "Primary connection string"
      sensitive: true

  # Environments
  environments:
    - name: dev
      tfvars: environments/dev.tfvars
      auto_apply: true

    - name: staging
      tfvars: environments/staging.tfvars
      auto_apply: false
      approval_required: true

    - name: prod
      tfvars: environments/prod.tfvars
      auto_apply: false
      approval_required: true
      requires_peer_review: true

  # Cost Management
  cost_estimation:
    enabled: true
    currency: USD

  # Policy as Code
  policies:
    - name: redis-security
      type: opa
      enforcement_level: mandatory
      policy: |
        package redis_security

        deny[msg] {
          input.resource_changes[_].change.after.enable_non_ssl_port == true
          msg = "Non-SSL port must be disabled"
        }

        deny[msg] {
          input.resource_changes[_].change.after.minimum_tls_version != "1.2"
          msg = "Minimum TLS version must be 1.2"
        }

    - name: redis-backup
      type: opa
      enforcement_level: advisory
      policy: |
        package redis_backup

        warn[msg] {
          input.resource_changes[_].change.after.redis_configuration[_].rdb_backup_enabled != true
          input.variables.environment == "prod"
          msg = "Backup should be enabled for production"
        }

  # Drift Detection
  drift_detection:
    enabled: true
    schedule: "0 */6 * * *"  # Every 6 hours

  # Notifications
  notifications:
    slack:
      channel: "#infrastructure-alerts"
      events:
        - plan
        - apply
        - drift_detected
        - policy_violation
```

## Module Documentation Template

### README.md - Module Documentation

```markdown
# Redis Cluster Terraform Module

Terraform module for deploying Azure Cache for Redis with clustering support, high availability, and comprehensive security features.

## Features

- **High Availability**: Zone-redundant deployment across 3 availability zones
- **Performance**: Premium SKU with clustering (up to 10 shards)
- **Security**: TLS 1.2, private endpoints, firewall rules
- **Backup**: Automated RDB backups to Azure Storage
- **Monitoring**: Diagnostic settings and Log Analytics integration
- **Maintenance**: Configurable patch schedules

## Usage

### Basic Usage

```hcl
module "redis" {
  source = "./modules/redis-cluster"

  project             = "myapp"
  environment         = "prod"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"

  capacity    = 2
  shard_count = 3
}
```

### Complete Example

```hcl
module "redis" {
  source = "./modules/redis-cluster"

  # Required
  project             = "myapp"
  environment         = "prod"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"

  # Redis Configuration
  capacity             = 3
  family               = "P"
  sku_name             = "Premium"
  shard_count          = 3
  minimum_tls_version  = "1.2"

  # Redis Settings
  maxmemory_policy       = "allkeys-lru"
  maxmemory_reserved     = 50
  maxmemory_delta        = 50
  notify_keyspace_events = "Ex"

  # Backup
  enable_backup                     = true
  backup_frequency                  = 60
  backup_storage_connection_string  = var.backup_storage_connection_string

  # Patch Schedule
  patch_schedule = {
    day_of_week    = "Sunday"
    start_hour_utc = 3
  }

  # High Availability
  zones = ["1", "2", "3"]

  # Network
  enable_private_endpoint     = true
  private_endpoint_subnet_id  = azurerm_subnet.private.id

  # Monitoring
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Tags
  tags = {
    CostCenter = "engineering"
    Owner      = "platform-team"
  }
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.6.0 |
| azurerm | ~> 3.85.0 |

## Providers

| Name | Version |
|------|---------|
| azurerm | ~> 3.85.0 |

## Resources

| Name | Type |
|------|------|
| azurerm_redis_cache.main | resource |
| azurerm_private_endpoint.redis | resource |
| azurerm_redis_firewall_rule.rules | resource |
| azurerm_monitor_diagnostic_setting.redis | resource |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| project | Project name | `string` | n/a | yes |
| environment | Environment (dev/staging/prod) | `string` | n/a | yes |
| resource_group_name | Resource group name | `string` | n/a | yes |
| location | Azure region | `string` | `"eastus"` | no |
| capacity | Redis capacity (0-6) | `number` | `2` | no |
| shard_count | Number of shards (1-10) | `number` | `3` | no |

See [variables.tf](./variables.tf) for complete list.

## Outputs

| Name | Description |
|------|-------------|
| id | Redis cache ID |
| hostname | Redis hostname |
| ssl_port | Redis SSL port |
| primary_connection_string | Primary connection string (sensitive) |

See [outputs.tf](./outputs.tf) for complete list.

## Examples

See the [examples](./examples) directory for:
- [Basic](./examples/basic) - Minimal configuration
- [Complete](./examples/complete) - Full configuration with all features

## Harness IaCM Integration

This module includes Harness IaCM workspace configuration:

```bash
# Deploy to development
harness iacm workspace apply redis-cluster --env=dev

# Plan for production
harness iacm workspace plan redis-cluster --env=prod

# Check drift
harness iacm workspace drift redis-cluster
```

## Security Considerations

1. **TLS**: Minimum TLS 1.2 enforced
2. **Private Endpoints**: Recommended for production
3. **Firewall Rules**: Restrict access by IP
4. **Access Keys**: Stored as sensitive outputs
5. **Non-SSL Port**: Disabled by default

## Cost Considerations

| SKU | Capacity | Shards | Est. Monthly Cost (USD) |
|-----|----------|--------|-------------------------|
| Premium | 1 | 1 | ~$300 |
| Premium | 2 | 2 | ~$800 |
| Premium | 3 | 3 | ~$1,500 |

## Troubleshooting

### Connection Issues

```bash
# Test connectivity
nc -zv <hostname> 6380

# Check firewall rules
az redis firewall-rule list \
  --name <redis-name> \
  --resource-group <rg-name>
```

### Performance Issues

```bash
# Check metrics
az monitor metrics list \
  --resource <redis-id> \
  --metric "percentProcessorTime,usedmemorypercentage"
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## License

See [LICENSE](../../LICENSE)
```

## Usage Examples

### Example 1: Basic Redis Module

```bash
# Generate basic Redis module
/itg:terraform redis-cache --provider=azurerm

# Output:
# ✓ Generated: terraform/modules/redis-cache/main.tf
# ✓ Generated: terraform/modules/redis-cache/variables.tf
# ✓ Generated: terraform/modules/redis-cache/outputs.tf
# ✓ Generated: terraform/modules/redis-cache/versions.tf
# ✓ Generated: environments/dev.tfvars
# ✓ Generated: environments/staging.tfvars
# ✓ Generated: environments/prod.tfvars
```

### Example 2: AKS Cluster with Harness IaCM

```bash
# Generate AKS module with Harness integration
/itg:terraform aks-cluster \
  --provider=azurerm \
  --environments="dev,staging,prod" \
  --harness-iacm

# Output:
# ✓ Generated: terraform/modules/aks-cluster/main.tf
# ✓ Generated: terraform/modules/aks-cluster/variables.tf
# ✓ Generated: terraform/modules/aks-cluster/outputs.tf
# ✓ Generated: harness/workspace.yaml
```

### Example 3: AWS Multi-Environment

```bash
# Generate EKS module for multiple environments
/itg:terraform eks-cluster \
  --provider=aws \
  --environments="dev,test,staging,prod" \
  --output="./infrastructure/aws/modules"

# Output:
# ✓ Generated: infrastructure/aws/modules/eks-cluster/
# ✓ Created 4 environment tfvars files
```

### Example 4: Using Preset

```bash
# Use Azure standard preset
/itg:terraform app-gateway --preset=azure-standard

# Equivalent to:
# /itg:terraform app-gateway \
#   --provider=azurerm \
#   --environments="dev,staging,prod" \
#   --include-versions
```

## Best Practices

### 1. Module Design Principles

```hcl
# ✅ Good: Clear variable naming
variable "enable_private_endpoint" {
  description = "Enable private endpoint for secure access"
  type        = bool
  default     = false
}

# ❌ Bad: Unclear naming
variable "pe" {
  type = bool
  default = false
}

# ✅ Good: Input validation
variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# ✅ Good: Sensible defaults
variable "minimum_tls_version" {
  description = "Minimum TLS version"
  type        = string
  default     = "1.2"  # Secure default
}
```

### 2. Resource Organization

```hcl
# Group related resources
# 1. Data sources
data "azurerm_client_config" "current" {}

# 2. Locals
locals {
  name_prefix = "${var.project}-${var.environment}"
  common_tags = merge(var.tags, { ManagedBy = "terraform" })
}

# 3. Main resources
resource "azurerm_redis_cache" "main" {
  # ...
}

# 4. Supporting resources
resource "azurerm_private_endpoint" "redis" {
  # ...
}

# 5. Monitoring resources
resource "azurerm_monitor_diagnostic_setting" "redis" {
  # ...
}
```

### 3. Output Best Practices

```hcl
# ✅ Mark sensitive outputs
output "primary_access_key" {
  description = "Primary access key"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

# ✅ Provide connection strings
output "connection_string" {
  description = "Redis connection string"
  value       = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port},password=${azurerm_redis_cache.main.primary_access_key},ssl=True"
  sensitive   = true
}

# ✅ Include resource IDs for dependencies
output "id" {
  description = "Redis cache ID"
  value       = azurerm_redis_cache.main.id
}
```

### 4. Environment Configuration

```hcl
# Use consistent environment patterns
# dev.tfvars - Development (minimal, single-zone)
capacity    = 1
shard_count = 1
zones       = ["1"]
enable_backup = false

# staging.tfvars - Staging (mid-tier, multi-zone)
capacity    = 2
shard_count = 2
zones       = ["1", "2"]
enable_backup = true
backup_frequency = 1440  # Daily

# prod.tfvars - Production (high-tier, zone-redundant)
capacity    = 3
shard_count = 3
zones       = ["1", "2", "3"]
enable_backup = true
backup_frequency = 60  # Hourly
```

### 5. Harness IaCM Policies

```yaml
# Enforce security policies
policies:
  - name: mandatory-tags
    type: opa
    enforcement_level: mandatory
    policy: |
      package tags

      required_tags := ["Environment", "Owner", "CostCenter"]

      deny[msg] {
        not input.resource_changes[_].change.after.tags[required_tags[_]]
        msg = sprintf("Missing required tag: %v", [required_tags[_]])
      }

  - name: cost-limit
    type: sentinel
    enforcement_level: advisory
    policy: |
      import "tfrun"
      import "decimal"

      cost_limit = 5000  # USD

      main = rule {
        decimal.new(tfrun.cost_estimate.total_monthly_cost) < decimal.new(cost_limit)
      }
```

## Common Patterns

### 1. Multi-Region Module

```hcl
# main.tf - Multi-region deployment
variable "regions" {
  description = "Azure regions for deployment"
  type        = list(string)
  default     = ["eastus", "westus2"]
}

resource "azurerm_redis_cache" "regional" {
  for_each = toset(var.regions)

  name                = "${var.project}-${var.environment}-${each.key}-redis"
  location            = each.key
  resource_group_name = azurerm_resource_group.regional[each.key].name
  # ...
}

# Setup replication between regions
resource "azurerm_redis_linked_server" "replication" {
  for_each = toset(slice(var.regions, 1, length(var.regions)))

  target_redis_cache_name     = azurerm_redis_cache.regional[each.key].name
  resource_group_name         = azurerm_resource_group.regional[each.key].name
  linked_redis_cache_id       = azurerm_redis_cache.regional[var.regions[0]].id
  linked_redis_cache_location = var.regions[0]
  server_role                 = "Secondary"
}
```

### 2. Conditional Resources

```hcl
# Only create resources when enabled
resource "azurerm_private_endpoint" "redis" {
  count = var.enable_private_endpoint ? 1 : 0
  # ...
}

# Dynamic blocks for optional configuration
dynamic "patch_schedule" {
  for_each = var.patch_schedule != null ? [var.patch_schedule] : []
  content {
    day_of_week    = patch_schedule.value.day_of_week
    start_hour_utc = patch_schedule.value.start_hour_utc
  }
}
```

### 3. Data Source Integration

```hcl
# Reference existing infrastructure
data "azurerm_resource_group" "existing" {
  name = var.resource_group_name
}

data "azurerm_subnet" "private" {
  name                 = var.private_endpoint_subnet_name
  virtual_network_name = var.virtual_network_name
  resource_group_name  = var.network_resource_group_name
}

resource "azurerm_redis_cache" "main" {
  resource_group_name = data.azurerm_resource_group.existing.name
  location            = data.azurerm_resource_group.existing.location
  # ...
}
```

## Integration Workflow

### 1. Analyze → Generate → Deploy

```bash
# Step 1: Analyze existing infrastructure
/itg:analyze ./infrastructure/existing

# Step 2: Generate Terraform module from pattern
/itg:terraform redis-cluster \
  --provider=azurerm \
  --harness-iacm

# Step 3: Customize generated module
# Edit terraform/modules/redis-cluster/*.tf

# Step 4: Initialize and plan
cd terraform/modules/redis-cluster
terraform init
terraform plan -var-file=environments/dev.tfvars

# Step 5: Deploy via Harness IaCM
harness iacm workspace apply redis-cluster --env=dev
```

### 2. Multi-Module Deployment

```bash
# Generate multiple related modules
/itg:terraform network --provider=azurerm
/itg:terraform aks-cluster --provider=azurerm
/itg:terraform redis-cluster --provider=azurerm
/itg:terraform postgres-db --provider=azurerm

# Create root module to compose
# terraform/environments/prod/main.tf
module "network" {
  source = "../../modules/network"
  # ...
}

module "aks" {
  source = "../../modules/aks-cluster"
  subnet_id = module.network.aks_subnet_id
  # ...
}

module "redis" {
  source = "../../modules/redis-cluster"
  resource_group_name = module.network.resource_group_name
  # ...
}
```

## Troubleshooting

### Issue: Module generates incorrect provider

```bash
# Solution: Explicitly specify provider
/itg:terraform my-module --provider=aws

# Or use preset
/itg:terraform my-module --preset=aws-minimal
```

### Issue: Missing environment tfvars

```bash
# Solution: Specify environments explicitly
/itg:terraform my-module --environments="dev,staging,prod,dr"
```

### Issue: Harness IaCM config not generated

```bash
# Solution: Enable Harness IaCM flag
/itg:terraform my-module --harness-iacm
```

### Issue: Module lacks high availability features

```bash
# Solution: Review pattern analysis
/itg:analyze ./existing-infra --focus=ha

# Regenerate with HA patterns
/itg:terraform my-module --provider=azurerm
```

## Related Commands

- `/itg:analyze` - Analyze existing infrastructure for patterns
- `/itg:helm` - Generate Helm charts for Kubernetes deployments
- `/itg:docker` - Generate Dockerfiles and compose configurations
- `/itg:pipeline` - Generate CI/CD pipelines for infrastructure
- `/itg:docs` - Generate comprehensive infrastructure documentation

## Advanced Configuration

### Custom Provider Configurations

```hcl
# Support for multiple Azure subscriptions
provider "azurerm" {
  alias           = "management"
  subscription_id = var.management_subscription_id
  features {}
}

provider "azurerm" {
  alias           = "production"
  subscription_id = var.production_subscription_id
  features {}
}

# Use specific provider
resource "azurerm_redis_cache" "main" {
  provider = azurerm.production
  # ...
}
```

### Remote State Configuration

```hcl
# terraform/environments/prod/backend.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstateprod"
    container_name       = "tfstate"
    key                  = "modules/redis-cluster/prod.tfstate"

    # State locking
    use_azuread_auth = true
  }
}
```

### Module Registry Publishing

```hcl
# Prepare for Terraform Registry
# - Tag releases: v1.0.0, v1.1.0, etc.
# - Include LICENSE, README.md
# - Add examples/ directory
# - Validate with terraform-docs

# Generate documentation
terraform-docs markdown table . > README.md

# Validate module
terraform init
terraform validate
terraform fmt -check -recursive
tflint
```

## See Also

- [Terraform Best Practices](https://www.terraform-best-practices.com/)
- [Azure Provider Documentation](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Harness IaCM Documentation](https://developer.harness.io/docs/infrastructure-as-code-management/)
- [Terraform Module Registry](https://registry.terraform.io/)
