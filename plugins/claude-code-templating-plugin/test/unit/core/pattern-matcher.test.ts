/**
 * Pattern Matcher Tests
 *
 * Unit tests for intent detection and routing.
 */

import { describe, it, expect } from 'vitest';
import { PatternMatcher, createPatternMatcher } from '../../../src/core/pattern-matcher.js';
import type { ProjectAnalysis } from '../../../src/types/scaffold.js';

describe('PatternMatcher', () => {
  let matcher: PatternMatcher;

  beforeEach(() => {
    matcher = createPatternMatcher();
  });

  describe('match', () => {
    it('should detect scaffold intent', () => {
      const result = matcher.match('create a new fastapi microservice called user-service');

      expect(result.type).toBe('scaffold');
      expect(result.confidence).toBeGreaterThan(0.3);
      expect(result.entities.name).toBe('user-service');
    });

    it('should detect pipeline intent', () => {
      const result = matcher.match('create a harness pipeline for ci/cd');

      expect(result.type).toBe('pipeline');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect template intent', () => {
      const result = matcher.match('create a harness step template for database migration');

      expect(result.type).toBe('template');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect generate intent', () => {
      const result = matcher.match('generate api client from openapi spec');

      expect(result.type).toBe('generate');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect analyze intent', () => {
      const result = matcher.match('analyze the project structure');

      expect(result.type).toBe('analyze');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should return unknown for unrecognized input', () => {
      const result = matcher.match('hello world');

      expect(result.type).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should extract template name from input', () => {
      const result = matcher.match('scaffold using react-typescript template');

      expect(result.entities.template).toBe('react-typescript');
    });

    it('should extract environments from input', () => {
      const result = matcher.match('deploy to dev, staging, prod');

      expect(result.entities.environments).toBe('dev,staging,prod');
    });

    it('should suggest appropriate template for fastapi', () => {
      const result = matcher.match('create a fastapi python api');

      expect(result.suggestedTemplate).toBe('fastapi-microservice');
      expect(result.format).toBe('cookiecutter');
      expect(result.projectType).toBe('api');
    });

    it('should suggest appropriate template for react', () => {
      const result = matcher.match('scaffold a react typescript frontend webapp');

      expect(result.suggestedTemplate).toBe('react-typescript');
      expect(result.projectType).toBe('webapp');
    });

    it('should suggest appropriate template for spring boot', () => {
      const result = matcher.match('create a spring boot java microservice');

      expect(result.suggestedTemplate).toBe('spring-boot-service');
      expect(result.format).toBe('maven-archetype');
    });

    it('should use context for better matching', () => {
      const context = {
        projectAnalysis: {
          projectType: 'api' as const,
          language: 'python',
          frameworks: ['fastapi'],
          patterns: [],
          suggestedVariables: {},
        },
      };

      const result = matcher.match('add ci/cd', context);

      expect(result.projectType).toBe('api');
    });
  });

  describe('detectTemplateFormat', () => {
    it('should detect cookiecutter format', () => {
      expect(matcher.detectTemplateFormat('/path/to/cookiecutter-template')).toBe('cookiecutter');
      expect(matcher.detectTemplateFormat('gh:user/cookiecutter-django')).toBe('cookiecutter');
    });

    it('should detect copier format', () => {
      expect(matcher.detectTemplateFormat('/path/to/copier-template')).toBe('copier');
    });

    it('should detect maven archetype format', () => {
      expect(matcher.detectTemplateFormat('/path/to/maven-archetype')).toBe('maven-archetype');
    });

    it('should detect harness format', () => {
      expect(matcher.detectTemplateFormat('/path/.harness/pipeline.yaml')).toBe('harness');
      expect(matcher.detectTemplateFormat('harness-pipeline-template')).toBe('harness');
    });

    it('should detect handlebars format', () => {
      expect(matcher.detectTemplateFormat('/path/template.hbs')).toBe('handlebars');
    });

    it('should default to handlebars for unknown formats', () => {
      expect(matcher.detectTemplateFormat('/path/to/unknown')).toBe('handlebars');
    });
  });

  describe('detectProjectType', () => {
    it('should detect webapp from react framework', () => {
      const analysis: ProjectAnalysis = {
        projectType: 'unknown',
        language: 'typescript',
        frameworks: ['react'],
        patterns: [],
        suggestedVariables: {},
      };

      expect(matcher.detectProjectType(analysis)).toBe('webapp');
    });

    it('should detect api from express framework', () => {
      const analysis: ProjectAnalysis = {
        projectType: 'unknown',
        language: 'typescript',
        frameworks: ['express'],
        patterns: [],
        suggestedVariables: {},
      };

      expect(matcher.detectProjectType(analysis)).toBe('api');
    });

    it('should detect microservice from spring framework', () => {
      const analysis: ProjectAnalysis = {
        projectType: 'unknown',
        language: 'java',
        frameworks: ['spring'],
        patterns: [],
        suggestedVariables: {},
      };

      expect(matcher.detectProjectType(analysis)).toBe('microservice');
    });

    it('should detect infrastructure from terraform', () => {
      const analysis: ProjectAnalysis = {
        projectType: 'unknown',
        language: 'hcl',
        frameworks: ['terraform'],
        patterns: [],
        suggestedVariables: {},
      };

      expect(matcher.detectProjectType(analysis)).toBe('infrastructure');
    });

    it('should use existing projectType if not unknown', () => {
      const analysis: ProjectAnalysis = {
        projectType: 'cli',
        language: 'go',
        frameworks: [],
        patterns: [],
        suggestedVariables: {},
      };

      expect(matcher.detectProjectType(analysis)).toBe('cli');
    });
  });

  describe('getSuggestionsForType', () => {
    it('should return suggestions for api type', () => {
      const suggestions = matcher.getSuggestionsForType('api');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.projectType === 'api')).toBe(true);
    });

    it('should return suggestions for webapp type', () => {
      const suggestions = matcher.getSuggestionsForType('webapp');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.template === 'react-typescript')).toBe(true);
    });

    it('should return empty array for unknown type', () => {
      const suggestions = matcher.getSuggestionsForType('unknown');

      expect(suggestions).toEqual([]);
    });
  });
});

describe('createPatternMatcher', () => {
  it('should create a pattern matcher instance', () => {
    const matcher = createPatternMatcher();
    expect(matcher).toBeInstanceOf(PatternMatcher);
  });
});
