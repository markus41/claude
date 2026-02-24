/**
 * Tests for Hook Loader
 *
 * @module test_hook_loader
 */

import * as path from 'path';
import * as assert from 'assert';
import {
  loadHooks,
  validateHookConfig,
  validateMatcherPatterns,
  resolveScriptPath,
  getHooksForEvent,
  shouldTriggerHook,
  HookValidationError,
} from '../../lib/hook-loader';

describe('Hook Loader', () => {
  const pluginRoot = path.resolve(__dirname, '../..');
  const hooksPath = path.join(pluginRoot, 'hooks', 'hooks.json');

  describe('loadHooks', () => {
    it('should load and validate hooks.json', () => {
      const config = loadHooks(hooksPath);
      assert.ok(config);
      assert.ok(config.UserPromptSubmit || config.PostToolUse || config.PreToolUse);
    });

    it('should throw on non-existent file', () => {
      assert.throws(() => {
        loadHooks('/nonexistent/path/hooks.json');
      }, Error);
    });
  });

  describe('validateHookConfig', () => {
    it('should validate correct hook configuration', () => {
      const validConfig = {
        hooks: [
          {
            name: 'test-hook',
            event: 'UserPromptSubmit',
            type: 'prompt',
            prompt: 'Test prompt content',
          },
        ],
      };

      const result = validateHookConfig(validConfig);
      assert.ok(result.UserPromptSubmit?.length === 1);
    });

    it('should reject prompt hook without prompt field', () => {
      const invalidConfig = {
        hooks: [
          {
            event: 'UserPromptSubmit',
            type: 'prompt',
          },
        ],
      };

      assert.throws(() => {
        validateHookConfig(invalidConfig);
      }, HookValidationError);
    });

    it('should reject unknown fields with clear errors', () => {
      const invalidConfig = {
        hooks: [
          {
            event: 'UserPromptSubmit',
            type: 'prompt',
            prompt: 'Hello',
            bogus: true,
          },
        ],
      };

      assert.throws(() => {
        validateHookConfig(invalidConfig);
      }, HookValidationError);
    });
  });

  describe('validateMatcherPatterns', () => {
    it('should accept valid regex patterns', () => {
      const config = {
        UserPromptSubmit: [
          {
            event: 'UserPromptSubmit' as const,
            type: 'prompt' as const,
            matcher: '\b[A-Z]{2,10}-\d+\b',
            prompt: 'Test',
          },
        ],
      };

      assert.doesNotThrow(() => {
        validateMatcherPatterns(config);
      });
    });

    it('should reject invalid regex patterns', () => {
      const config = {
        UserPromptSubmit: [
          {
            event: 'UserPromptSubmit' as const,
            type: 'prompt' as const,
            matcher: '[invalid(regex',
            prompt: 'Test',
          },
        ],
      };

      assert.throws(() => {
        validateMatcherPatterns(config);
      }, HookValidationError);
    });
  });

  describe('getHooksForEvent', () => {
    it('should retrieve hooks for specific event type', () => {
      const config = loadHooks(hooksPath);
      const hooks = getHooksForEvent(config, 'UserPromptSubmit');
      assert.ok(Array.isArray(hooks));
    });

    it('should return empty array for event with no hooks', () => {
      const config = {};
      const hooks = getHooksForEvent(config, 'UserPromptSubmit');
      assert.strictEqual(hooks.length, 0);
    });
  });

  describe('shouldTriggerHook', () => {
    it('should trigger hook without matcher', () => {
      const hook = {
        event: 'UserPromptSubmit' as const,
        type: 'prompt' as const,
        prompt: 'Test',
      };

      assert.strictEqual(shouldTriggerHook(hook, 'anything'), true);
    });

    it('should trigger hook when pattern matches', () => {
      const hook = {
        event: 'UserPromptSubmit' as const,
        type: 'prompt' as const,
        matcher: '\bAI-\d+\b',
        prompt: 'Test',
      };

      assert.strictEqual(shouldTriggerHook(hook, 'Working on AI-123'), true);
    });
  });

  describe('resolveScriptPath - Path Traversal Protection', () => {
    it('should reject paths with .. traversal', () => {
      const basePath = '/plugins/jira-orchestrator';

      assert.throws(() => {
        resolveScriptPath('../../etc/passwd', basePath);
      }, HookValidationError);
    });

    it('should allow valid relative paths within plugin root', () => {
      const basePath = '/plugins/jira-orchestrator';
      const scriptPath = 'scripts/test-hook.sh';

      assert.doesNotThrow(() => {
        const resolved = resolveScriptPath(scriptPath, basePath);
        assert.ok(resolved.includes('scripts/test-hook.sh'));
      });
    });
  });
});
