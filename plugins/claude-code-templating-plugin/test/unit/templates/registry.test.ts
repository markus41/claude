/**
 * Template Registry Tests
 *
 * Unit tests for registry search and version ordering behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateRegistry } from '../../../src/templates/registry.js';
import type { TemplateRegistryEntry } from '../../../src/types/template.js';

describe('TemplateRegistry', () => {
  let registry: TemplateRegistry;

  beforeEach(() => {
    registry = new TemplateRegistry('/tmp/registry-cache');
  });

  it('search filters by query and applies list options', async () => {
    const entries: TemplateRegistryEntry[] = [
      {
        name: 'fastapi-service',
        version: '1.0.0',
        description: 'FastAPI service template',
        format: 'cookiecutter',
        source: { type: 'local', location: '/tmp/fastapi' },
        tags: ['python', 'fastapi'],
      },
      {
        name: 'fastapi-pipeline',
        version: '1.0.0',
        description: 'Harness pipeline for FastAPI',
        format: 'harness',
        source: { type: 'local', location: '/tmp/fastapi-pipeline' },
        tags: ['pipeline'],
      },
      {
        name: 'react-app',
        version: '1.0.0',
        description: 'React template',
        format: 'cookiecutter',
        source: { type: 'local', location: '/tmp/react' },
      },
    ];

    (registry as any).cache = {
      entries,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };

    const results = await registry.search('fastapi', { format: 'cookiecutter' });

    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe('fastapi-service');
  });

  it('returns the latest semver-like version for get()', async () => {
    const entries: TemplateRegistryEntry[] = [
      {
        name: 'example',
        version: '1.2.0',
        description: 'Example template',
        format: 'cookiecutter',
        source: { type: 'local', location: '/tmp/example' },
      },
      {
        name: 'example',
        version: '1.10.0',
        description: 'Example template',
        format: 'cookiecutter',
        source: { type: 'local', location: '/tmp/example' },
      },
      {
        name: 'example',
        version: '1.2.1',
        description: 'Example template',
        format: 'cookiecutter',
        source: { type: 'local', location: '/tmp/example' },
      },
      {
        name: 'example',
        version: '1.0.0-beta',
        description: 'Example template',
        format: 'cookiecutter',
        source: { type: 'local', location: '/tmp/example' },
      },
    ];

    (registry as any).cache = {
      entries,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0',
    };

    const result = await registry.get('example');

    expect(result?.version).toBe('1.10.0');
  });
});
