/**
 * Hook Loader for Claude Code Plugin Hook System
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { validateRegexPattern, safeRegexTest, RegexValidationError as SafeRegexValidationError } from './safe-regex';

const HookDefinitionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  event: z.enum(['UserPromptSubmit', 'PostToolUse', 'PreToolUse', 'Stop', 'SessionStart', 'TaskCompleted', 'SessionEnd']),
  matcher: z.string().min(1).optional(),
  type: z.enum(['prompt', 'command']),
  script: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  settings: z.record(z.unknown()).optional(),
}).strict().superRefine((data, ctx) => {
  if (data.type === 'command') {
    if (!data.script) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'script is required when type is "command"', path: ['script'] });
    if (data.prompt !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'prompt is not allowed when type is "command"', path: ['prompt'] });
  }
  if (data.type === 'prompt') {
    if (!data.prompt) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'prompt is required when type is "prompt"', path: ['prompt'] });
    if (data.script !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'script is not allowed when type is "prompt"', path: ['script'] });
  }
});

const HooksFileSchema = z.object({
  $schema: z.string().optional(),
  hooks: z.array(HookDefinitionSchema).min(1),
  settings: z.record(z.unknown()).optional(),
}).strict();

export type HookDefinition = z.infer<typeof HookDefinitionSchema>;
export type HookEventType = HookDefinition['event'];
export type HooksFile = z.infer<typeof HooksFileSchema>;
export type HooksConfig = Partial<Record<HookEventType, HookDefinition[]>>;

export class HookValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'HookValidationError';
  }
}
export class HookScriptError extends Error {
  constructor(message: string, public scriptPath?: string, public details?: any) {
    super(message);
    this.name = 'HookScriptError';
  }
}

export function loadHooksFile(hooksPath: string): unknown {
  if (!fs.existsSync(hooksPath)) throw new Error(`Hooks file not found: ${hooksPath}`);
  try {
    return JSON.parse(fs.readFileSync(hooksPath, 'utf-8'));
  } catch (error: any) {
    throw new Error(`Failed to parse hooks.json: ${error.message}`);
  }
}

function toEventMap(fileConfig: HooksFile): HooksConfig {
  return fileConfig.hooks.reduce<HooksConfig>((acc, hook) => {
    const list = acc[hook.event] ?? [];
    list.push(hook);
    acc[hook.event] = list;
    return acc;
  }, {});
}

export function validateHookConfig(config: unknown): HooksConfig {
  try {
    return toEventMap(HooksFileSchema.parse(config));
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const formatted = error.errors.map((err) => {
        const location = err.path.length ? err.path.join('.') : '<root>';
        return `  - ${location}: ${err.message}`;
      }).join('\n');
      throw new HookValidationError(`Hook configuration validation failed:\n${formatted}`, error.errors);
    }
    throw error;
  }
}

export function validateMatcherPatterns(config: HooksConfig): void {
  const errors: string[] = [];
  for (const [eventType, hooks] of Object.entries(config)) {
    if (!hooks) continue;
    hooks.forEach((hook, index) => {
      if (!hook.matcher) return;
      try { validateRegexPattern(hook.matcher); }
      catch (error: any) {
        const name = hook.name ?? `${hook.type}-hook`;
        if (error instanceof SafeRegexValidationError) {
          errors.push(`${eventType}[${index}] "${name}": Unsafe regex pattern "${hook.matcher}" - ${error.reason || error.message}`);
        } else {
          errors.push(`${eventType}[${index}] "${name}": Invalid regex pattern "${hook.matcher}" - ${error.message}`);
        }
      }
    });
  }
  if (errors.length) throw new HookValidationError(`Invalid matcher patterns found:\n${errors.map(e => `  - ${e}`).join('\n')}`);
}

export function validateScripts(config: HooksConfig, basePath: string): void {
  const errors: string[] = [];
  for (const [eventType, hooks] of Object.entries(config)) {
    if (!hooks) continue;
    hooks.forEach((hook, index) => {
      if (hook.type !== 'command' || !hook.script) return;
      const scriptPath = resolveScriptPath(hook.script, basePath);
      const name = hook.name ?? `${hook.type}-hook`;
      if (!fs.existsSync(scriptPath)) {
        errors.push(`${eventType}[${index}] "${name}": Script not found at ${scriptPath}`);
        return;
      }
      const stats = fs.statSync(scriptPath);
      if (!stats.isFile()) {
        errors.push(`${eventType}[${index}] "${name}": Path is not a file: ${scriptPath}`);
        return;
      }
      if (process.platform !== 'win32') {
        try { fs.accessSync(scriptPath, fs.constants.X_OK); }
        catch { errors.push(`${eventType}[${index}] "${name}": Script not executable: ${scriptPath} (run: chmod +x)`); }
      }
    });
  }
  if (errors.length) throw new HookScriptError(`Hook script validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
}

function validateScriptPath(scriptPath: string, resolvedPath: string, pluginRoot: string): void {
  if (scriptPath.includes('..') || (process.platform === 'win32' && /^[a-zA-Z]:/.test(scriptPath)) || (process.platform !== 'win32' && scriptPath.startsWith('/'))) {
    throw new HookValidationError(`Script path contains invalid characters or absolute path: ${scriptPath}`);
  }
  const normalizedRoot = path.resolve(pluginRoot);
  const normalizedPath = path.resolve(resolvedPath);
  if (!normalizedPath.startsWith(normalizedRoot + path.sep) && normalizedPath !== normalizedRoot) {
    throw new HookValidationError(`Script path escapes plugin root: ${scriptPath} (resolved to ${resolvedPath})`);
  }
}

export function resolveScriptPath(scriptPath: string, basePath: string): string {
  const resolved = scriptPath.replace(/\$\{(\w+)\}/g, (match, varName) => process.env[varName] || match);
  const absolutePath = path.isAbsolute(resolved) ? resolved : path.resolve(basePath, resolved);
  validateScriptPath(scriptPath, absolutePath, basePath);
  return absolutePath;
}

export function loadHooks(hooksPath: string, basePath?: string): HooksConfig {
  const resolvedBasePath = basePath || path.dirname(hooksPath);
  const rawConfig = loadHooksFile(hooksPath);
  const validatedConfig = validateHookConfig(rawConfig);
  validateMatcherPatterns(validatedConfig);
  validateScripts(validatedConfig, resolvedBasePath);
  return validatedConfig;
}

export function getHooksForEvent(config: HooksConfig, eventType: HookEventType): HookDefinition[] {
  return config[eventType] || [];
}

export function shouldTriggerHook(hook: HookDefinition, matchString: string): boolean {
  if (!hook.matcher) return true;
  try {
    const regex = new RegExp(hook.matcher);
    return safeRegexTest(regex, matchString, 100);
  } catch (error) {
    console.error(`Regex execution error in hook "${hook.name || hook.type}": ${error}`);
    return false;
  }
}
