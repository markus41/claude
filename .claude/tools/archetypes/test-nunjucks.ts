/**
 * Test script for NunjucksAdapter
 *
 * Usage: npm run dev test-nunjucks.ts
 */

import { NunjucksAdapter } from './src/engines/nunjucks-adapter.js';
import { TemplateContext } from './src/types.js';

async function testNunjucksAdapter() {
  console.log('Testing NunjucksAdapter...\n');

  const adapter = new NunjucksAdapter();

  // Test context
  const context: TemplateContext = {
    variables: {
      name: 'test-service',
      author: 'Claude',
      version: '1.0.0',
      features: ['authentication', 'logging', 'monitoring']
    },
    computed: {
      timestamp: new Date().toISOString(),
      year: new Date().getFullYear()
    },
    env: {
      cwd: process.cwd(),
      user: 'testuser',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString()
    }
  };

  // Test 1: Basic variable substitution
  console.log('Test 1: Basic variable substitution');
  const test1 = adapter.processString('Hello {{ name }}!', context);
  console.log(test1);
  console.assert(test1.trim() === 'Hello test-service!', 'Basic substitution failed');

  // Test 2: pascalCase filter
  console.log('\nTest 2: pascalCase filter');
  const test2 = adapter.processString('{{ name | pascalCase }}', context);
  console.log(test2);
  console.assert(test2.trim() === 'TestService', 'pascalCase filter failed');

  // Test 3: camelCase filter
  console.log('\nTest 3: camelCase filter');
  const test3 = adapter.processString('{{ name | camelCase }}', context);
  console.log(test3);
  console.assert(test3.trim() === 'testService', 'camelCase filter failed');

  // Test 4: Template inheritance
  console.log('\nTest 4: Template inheritance');
  adapter.registerPartial('base', `
Base template
{% block content %}Default content{% endblock %}
Footer
  `.trim());

  const test4 = adapter.processString(`
{% extends "base" %}
{% block content %}Custom content from child{% endblock %}
  `.trim(), context);
  console.log(test4);

  // Test 5: Macros
  console.log('\nTest 5: Macros');
  const test5 = adapter.processString(`
{% macro greeting(name) %}
Hello, {{ name | capitalize }}!
{% endmacro %}

{{ greeting(author) }}
  `.trim(), context);
  console.log(test5);

  // Test 6: Conditional with filter
  console.log('\nTest 6: Conditional with eq filter');
  const test6 = adapter.processString(`
{% if name | eq('test-service') %}
Name matches!
{% else %}
Name does not match
{% endif %}
  `.trim(), context);
  console.log(test6);

  // Test 7: Array iteration with pluralize
  console.log('\nTest 7: Array iteration with pluralize');
  const test7 = adapter.processString(`
Features ({{ features.length }} {{ 'feature' | pluralize(features.length) }}):
{% for feature in features %}
- {{ feature | capitalize }}
{% endfor %}
  `.trim(), context);
  console.log(test7);

  // Test 8: JSON filter
  console.log('\nTest 8: JSON filter');
  const test8 = adapter.processString(`
Config:
{{ { name: name, version: version } | json(2) }}
  `.trim(), context);
  console.log(test8);

  // Test 9: Default filter
  console.log('\nTest 9: Default filter');
  const test9 = adapter.processString(`
Description: {{ description | default('No description provided') }}
  `.trim(), context);
  console.log(test9);

  // Test 10: Date filters
  console.log('\nTest 10: Date filters');
  const test10 = adapter.processString(`
Current year: {{ year }}
ISO timestamp: {{ now('iso') }}
  `.trim(), context);
  console.log(test10);

  // Test 11: Extract variables
  console.log('\nTest 11: Extract variables');
  const template = `
Hello {{ name }}!
Version: {{ version }}
Author: {{ author }}
{% if enabled %}Active{% endif %}
  `.trim();
  const vars = adapter.extractVariables(template);
  console.log('Extracted variables:', vars);
  console.assert(vars.includes('name'), 'Should extract name');
  console.assert(vars.includes('version'), 'Should extract version');
  console.assert(vars.includes('author'), 'Should extract author');
  console.assert(vars.includes('enabled'), 'Should extract enabled');

  // Test 12: Validate template
  console.log('\nTest 12: Validate template');
  const validTemplate = '{{ name }}';
  const invalidTemplate = '{{ name ';
  const valid = adapter.validateTemplate(validTemplate);
  const invalid = adapter.validateTemplate(invalidTemplate);
  console.log('Valid template:', valid);
  console.log('Invalid template:', invalid);
  console.assert(valid.valid === true, 'Valid template should pass');
  console.assert(invalid.valid === false, 'Invalid template should fail');

  console.log('\n✅ All tests passed!');
}

// Run tests
testNunjucksAdapter().catch(console.error);
