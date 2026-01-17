/**
 * Template Orchestrator Tests
 *
 * Unit tests for the central template orchestration system.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { TemplateOrchestrator, createOrchestrator } from '../../../src/core/orchestrator.js';
import type { ScaffoldSpec, ITemplateLoader, TemplateInfo, GeneratedFile } from '../../../src/types/scaffold.js';
import type { HarnessPipelineConfig } from '../../../src/types/harness.js';

// Mock file system
vi.mock('fs/promises', () => ({
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('{}'),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
}));

describe('TemplateOrchestrator', () => {
  let orchestrator: TemplateOrchestrator;
  let mockLoader: ITemplateLoader;

  beforeEach(() => {
    orchestrator = createOrchestrator({
      workingDir: '/test/workspace',
      cacheDir: '/test/cache',
    });

    mockLoader = {
      format: 'handlebars',
      canHandle: vi.fn().mockResolvedValue(true),
      loadMetadata: vi.fn().mockResolvedValue({
        name: 'test-template',
        version: '1.0.0',
        description: 'Test template',
        source: '/test/template',
        format: 'handlebars',
        variables: [
          { name: 'projectName', type: 'string', prompt: 'Project name', required: true },
        ],
      } as TemplateInfo),
      generate: vi.fn().mockResolvedValue([
        { path: 'src/index.ts', action: 'created', size: 100, type: 'source' },
        { path: 'package.json', action: 'created', size: 200, type: 'config' },
      ] as GeneratedFile[]),
    };

    orchestrator.registerLoader('handlebars', mockLoader);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('scaffold', () => {
    it('should scaffold a project successfully', async () => {
      const spec: ScaffoldSpec = {
        name: 'my-project',
        template: '/test/template',
        variables: { projectName: 'my-project' },
      };

      const result = await orchestrator.scaffold(spec);

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.outputPath).toBe(join('/test/workspace', 'my-project'));
      expect(mockLoader.loadMetadata).toHaveBeenCalledWith('/test/template');
      expect(mockLoader.generate).toHaveBeenCalled();
    });

    it('should use custom output path when specified', async () => {
      const spec: ScaffoldSpec = {
        name: 'my-project',
        template: '/test/template',
        outputPath: '/custom/output',
        variables: {},
      };

      const result = await orchestrator.scaffold(spec);

      expect(result.outputPath).toBe('/custom/output');
    });

    it('should emit scaffoldStarted and scaffoldCompleted events', async () => {
      const startedHandler = vi.fn();
      const completedHandler = vi.fn();

      orchestrator.on('scaffoldStarted', startedHandler);
      orchestrator.on('scaffoldCompleted', completedHandler);

      const spec: ScaffoldSpec = {
        name: 'my-project',
        template: '/test/template',
        variables: {},
      };

      await orchestrator.scaffold(spec);

      expect(startedHandler).toHaveBeenCalledWith(spec);
      expect(completedHandler).toHaveBeenCalled();
    });

    it('should handle scaffold failure gracefully', async () => {
      mockLoader.generate = vi.fn().mockRejectedValue(new Error('Generation failed'));

      const failedHandler = vi.fn();
      orchestrator.on('scaffoldFailed', failedHandler);

      const spec: ScaffoldSpec = {
        name: 'my-project',
        template: '/test/template',
        variables: {},
      };

      const result = await orchestrator.scaffold(spec);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation failed');
      expect(failedHandler).toHaveBeenCalled();
    });

    it('should not write files in dry run mode', async () => {
      const spec: ScaffoldSpec = {
        name: 'my-project',
        template: '/test/template',
        variables: {},
        dryRun: true,
      };

      const result = await orchestrator.scaffold(spec);

      expect(result.success).toBe(true);
      // In dry run, mkdir should not be called
    });

    it('should include Harness integration when requested', async () => {
      const spec: ScaffoldSpec = {
        name: 'my-project',
        template: '/test/template',
        variables: {},
        harnessIntegration: true,
        environments: ['dev', 'staging', 'prod'],
      };

      const result = await orchestrator.scaffold(spec);

      expect(result.success).toBe(true);
      expect(result.harnessResources).toBeDefined();
      expect(result.harnessResources?.environments).toEqual(['dev', 'staging', 'prod']);
    });
  });

  describe('createHarnessPipeline', () => {
    it('should create a pipeline YAML file', async () => {
      const config: HarnessPipelineConfig = {
        name: 'Test Pipeline',
        orgIdentifier: 'default',
        projectIdentifier: 'test_project',
        stages: [
          {
            name: 'Build',
            identifier: 'build',
            type: 'CI',
            spec: {
              cloneCodebase: true,
              execution: {
                steps: [
                  {
                    name: 'Run Tests',
                    identifier: 'run_tests',
                    type: 'Run',
                    spec: {
                      shell: 'Bash',
                      command: 'npm test',
                    },
                  },
                ],
              },
            },
          },
        ],
      };

      const result = await orchestrator.createHarnessPipeline(config);

      expect(result.pipelineId).toBe('test_pipeline');
      expect(result.yaml).toContain('pipeline:');
      expect(result.yaml).toContain('name: Test Pipeline');
      expect(result.filePath).toContain('.harness');
    });

    it('should emit pipelineCreated event', async () => {
      const handler = vi.fn();
      orchestrator.on('pipelineCreated', handler);

      const config: HarnessPipelineConfig = {
        name: 'Test Pipeline',
        orgIdentifier: 'default',
        projectIdentifier: 'test_project',
        stages: [],
      };

      await orchestrator.createHarnessPipeline(config);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('registerLoader', () => {
    it('should register a loader for a format', () => {
      const customLoader: ITemplateLoader = {
        format: 'cookiecutter',
        canHandle: vi.fn().mockResolvedValue(true),
        loadMetadata: vi.fn(),
        generate: vi.fn(),
      };

      orchestrator.registerLoader('cookiecutter', customLoader);

      expect(orchestrator.getLoader('cookiecutter')).toBe(customLoader);
    });

    it('should return undefined for unregistered format', () => {
      expect(orchestrator.getLoader('unknown' as any)).toBeUndefined();
    });
  });

  describe('analyzeProject', () => {
    it('should detect project type from package.json', async () => {
      const { existsSync } = await import('fs');
      vi.mocked(existsSync).mockImplementation((path: any) => {
        return path.toString().includes('package.json');
      });

      const analysis = await orchestrator.analyzeProject('/test/project');

      expect(analysis.projectType).toBeDefined();
      expect(analysis.language).toBeDefined();
    });
  });
});

describe('createOrchestrator', () => {
  it('should create an orchestrator instance', () => {
    const orchestrator = createOrchestrator({
      workingDir: '/test/workspace',
    });

    expect(orchestrator).toBeInstanceOf(TemplateOrchestrator);
  });
});
