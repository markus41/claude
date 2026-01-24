# Nunjucks Adapter Examples

## Overview

The Nunjucks Adapter provides advanced templating features including template inheritance, macros, and all the filters from Handlebars.

## Basic Usage

```typescript
import { createTemplateEngine } from '@claude/archetypes';

// Create a Nunjucks engine
const engine = createTemplateEngine('nunjucks');

// Process a template
const result = engine.processString('Hello {{ name }}!', context);
```

## Template Inheritance

```nunjucks
{# base.njk #}
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}Default Title{% endblock %}</title>
</head>
<body>
    {% block content %}{% endblock %}
</body>
</html>
```

```nunjucks
{# child.njk #}
{% extends "base.njk" %}

{% block title %}My Page{% endblock %}

{% block content %}
<h1>Welcome to {{ projectName | pascalCase }}</h1>
<p>Version: {{ version }}</p>
{% endblock %}
```

## Macros

```nunjucks
{# Reusable component macro #}
{% macro renderService(name, port, protocol='HTTP') %}
service:
  name: {{ name | kebabCase }}
  port: {{ port }}
  protocol: {{ protocol | uppercase }}
{% endmacro %}

{# Use the macro #}
{{ renderService('userService', 8080) }}
{{ renderService('authService', 8443, 'HTTPS') }}
```

## Filters (All Handlebars Helpers)

### String Manipulation

```nunjucks
{{ 'user-service' | pascalCase }}  {# UserService #}
{{ 'user-service' | camelCase }}   {# userService #}
{{ 'user_service' | kebabCase }}   {# user-service #}
{{ 'user-service' | snakeCase }}   {# user_service #}
{{ 'hello' | uppercase }}          {# HELLO #}
{{ 'HELLO' | lowercase }}          {# hello #}
{{ 'hello' | capitalize }}         {# Hello #}
```

### Comparison Filters

```nunjucks
{% if version | eq('1.0.0') %}
  This is version 1.0.0
{% endif %}

{% if count | gt(10) %}
  Count is greater than 10
{% endif %}
```

### Array Operations

```nunjucks
{% if features | includes('authentication') %}
  Authentication is enabled
{% endif %}
```

### Default Values

```nunjucks
{{ description | default('No description provided') }}
```

### Pluralization

```nunjucks
{{ 'service' | pluralize(count) }}    {# services if count != 1 #}
{{ 'services' | singularize() }}      {# service #}
```

### Date/Time

```nunjucks
Current year: {{ year }}
ISO timestamp: {{ now('iso') }}
Local date: {{ now('date') }}
```

### JSON Output

```nunjucks
{{ config | json(2) }}  {# Pretty-printed JSON with 2-space indent #}
```

## Complete Example: Kubernetes Deployment

```nunjucks
{# base-deployment.njk - Reusable base template #}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ name | kebabCase }}
  labels:
    app: {{ name | kebabCase }}
    version: {{ version }}
spec:
  replicas: {% block replicas %}{{ replicas | default(3) }}{% endblock %}
  selector:
    matchLabels:
      app: {{ name | kebabCase }}
  template:
    metadata:
      labels:
        app: {{ name | kebabCase }}
        version: {{ version }}
    spec:
      containers:
      - name: {{ name | kebabCase }}
        image: {{ registry }}/{{ name | kebabCase }}:{{ version }}
        {% block ports %}
        ports:
        - containerPort: 8080
          name: http
        {% endblock %}
        {% block env %}{% endblock %}
        resources:
          {% block resources %}
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
          {% endblock %}
```

```nunjucks
{# production-deployment.njk - Production-specific template #}
{% extends "base-deployment.njk" %}

{% block replicas %}{{ replicas | default(10) }}{% endblock %}

{% block env %}
env:
{% for key, value in envVars %}
- name: {{ key | uppercase | snakeCase }}
  value: "{{ value }}"
{% endfor %}
{% endblock %}

{% block resources %}
requests:
  cpu: 500m
  memory: 1Gi
limits:
  cpu: 2000m
  memory: 4Gi
{% endblock %}
```

## Macros for Common Patterns

```nunjucks
{# macros.njk #}
{% macro envVar(name, value, secret=false) %}
- name: {{ name | uppercase | snakeCase }}
  {% if secret %}
  valueFrom:
    secretKeyRef:
      name: {{ secretName }}
      key: {{ name | lowercase | snakeCase }}
  {% else %}
  value: "{{ value }}"
  {% endif %}
{% endmacro %}

{% macro healthCheck(path='/health', port='http', initialDelay=30) %}
livenessProbe:
  httpGet:
    path: {{ path }}
    port: {{ port }}
  initialDelaySeconds: {{ initialDelay }}
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: {{ path }}
    port: {{ port }}
  initialDelaySeconds: 10
  periodSeconds: 5
{% endmacro %}
```

```nunjucks
{# Use macros #}
{% import 'macros.njk' as k8s %}

{{ k8s.envVar('database_url', databaseUrl, secret=true) }}
{{ k8s.envVar('log_level', logLevel) }}
{{ k8s.healthCheck('/health/live', 'http', 30) }}
```

## Conditional Logic

```nunjucks
{% if environment | eq('production') %}
replicas: 10
{% elif environment | eq('staging') %}
replicas: 3
{% else %}
replicas: 1
{% endif %}
```

## Loops

```nunjucks
services:
{% for service in services %}
  - name: {{ service.name | kebabCase }}
    port: {{ service.port }}
    {% if service.enabled | default(true) %}
    enabled: true
    {% endif %}
{% endfor %}
```

## File Extensions

Nunjucks templates use the `.njk` extension:
- `template.njk` - Nunjucks template
- `template.hbs` - Handlebars template

The engine auto-detects based on file extension.

## When to Use Nunjucks vs Handlebars

**Use Nunjucks when you need:**
- Template inheritance (extends/blocks)
- Macros for reusable components
- Complex conditional logic
- More powerful loop constructs
- Better IDE support (since Nunjucks is closer to Jinja2/Django templates)

**Use Handlebars when you need:**
- Simple templates
- Backward compatibility
- Lighter-weight engine
- Simple helpers-based logic

## Best Practices

1. **Use template inheritance** for common layouts
2. **Create macro libraries** for reusable components
3. **Leverage filters** for string transformations
4. **Use blocks** for customization points
5. **Keep logic minimal** - complex logic belongs in code, not templates
6. **Document your macros** with comments
7. **Test templates** with various contexts

## Migration from Handlebars

Nunjucks syntax is similar to Handlebars with some differences:

| Handlebars | Nunjucks | Notes |
|------------|----------|-------|
| `{{#if condition}}` | `{% if condition %}` | Block syntax |
| `{{#each items}}` | `{% for item in items %}` | Loop syntax |
| `{{> partial}}` | `{% include 'partial' %}` | Partials/includes |
| `{{helper param}}` | `{{ param \| filter }}` | Filters instead of helpers |
| N/A | `{% extends "base" %}` | Template inheritance (Nunjucks only) |
| N/A | `{% macro name() %}` | Macros (Nunjucks only) |

All Handlebars helpers are available as Nunjucks filters, so migration is straightforward.
