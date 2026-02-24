---
name: keycloak
intent: Generate and deploy Keycloak theme files with FreeMarker templates
tags:
  - frontend-design-system
  - command
  - keycloak
inputs: []
risk: medium
cost: medium
description: Generate and deploy Keycloak theme files with FreeMarker templates
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Keycloak Theme Generation Command

Generate production-ready Keycloak theme files including FreeMarker templates, CSS, and assets.

## Usage

/keycloak <tenant> <action> [options]

## Arguments

- tenant (required): Tenant name or realm identifier
- action (required): Action - generate, deploy, validate, import
- options (optional): Additional flags like --style, --realm, --output-dir

## Examples

/keycloak acme-corp generate --style Material Design
/keycloak acme-corp deploy --realm acme-realm
/keycloak acme-corp validate --output-dir ./themes

## Execution Flow

### 1. Tenant Configuration

Load tenant-specific configuration:
- Brand colors and logos
- Typography preferences
- Deployment endpoints
- Multi-realm settings

### 2. Theme Structure Generation

Create complete Keycloak theme structure with login, account, and email templates.

### 3. FreeMarker Templates

Generate login templates with:
- Username/password forms
- Social login integration
- Multi-factor authentication
- Remember me functionality
- Password reset links

### 4. CSS Theming

Create theme CSS with design tokens:
- Color variables
- Typography
- Spacing
- Border radius
- Shadows
- Transitions

### 5. Email Templates

Generate email notification templates:
- Email verification
- Password reset
- Welcome emails
- Account notifications

### 6. Deployment Configuration

Generate deployment files for:
- Docker
- Kubernetes
- Manual upload via Admin Console

## Output

Theme Directory Structure:
keycloak-themes/{tenant}/
  login/
    theme.properties
    login.ftl
    resources/css/
    resources/img/
    resources/js/
  account/
    theme.properties
    account.ftl
    resources/css/
  email/
    theme.properties
    messages/

## Validation

- Validate FreeMarker syntax
- Validate CSS rules
- Validate image references
- Check property files

## Deployment

✅ Keycloak Theme Ready for Deployment

Deployment Commands:
- Docker: docker cp keycloak-themes/tenant/ keycloak:/opt/keycloak/themes/
- K8s: kubectl apply -f k8s-theme-config.yaml
- Manual: Upload via Keycloak Admin Console

