#!/usr/bin/env node
// Project Management Plugin — MCP Server (stdio, JSON-RPC).
//
// Exposes transactional tools over the state in .claude/projects/{id}/.
// All mutations go through the shared pm-state library so locking, schema
// validation, and atomic rename semantics apply uniformly.

import { createInterface } from 'node:readline';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import {
  projectDir,
  listProjects,
  readProject,
  readTasks,
  findTask,
  mutateTasks,
  mutateProject,
  writeCheckpoint,
  nextTask,
  unblockedTasks,
  loadValidators,
  validateProject,
  validateTasks,
} from '../lib/pm-state.mjs';

const SERVER_INFO = { name: 'pm-mcp', version: '1.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'pm_list_projects',
    description: 'List every project under .claude/projects/ with id, name, status, and task counts.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'pm_get_project',
    description: 'Return the full project.json record for a given project id.',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: {
        project_id: { type: 'string', description: 'Project id (lowercase slug).' },
      },
    },
  },
  {
    name: 'pm_get_tasks',
    description: 'Return tasks.json for a project, optionally filtered by status, phase, or parent.',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: {
        project_id: { type: 'string' },
        status: { type: 'string', description: 'Filter to a single status (e.g. PENDING).' },
        phase_id: { type: 'string' },
        parent_id: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 500 },
      },
    },
  },
  {
    name: 'pm_get_task',
    description: 'Fetch a single task by id.',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'task_id'],
      properties: {
        project_id: { type: 'string' },
        task_id: { type: 'string', pattern: '^T-[0-9]+$' },
      },
    },
  },
  {
    name: 'pm_next_task',
    description: 'Return the highest-priority unblocked task. Uses the same scoring as /pm:work Phase 1.',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: {
        project_id: { type: 'string' },
        focus_phase_id: { type: 'string' },
        focus_epic_id: { type: 'string' },
        focus_story_id: { type: 'string' },
      },
    },
  },
  {
    name: 'pm_unblocked_tasks',
    description: 'List all currently unblocked PENDING or RESEARCHED tasks.',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: { project_id: { type: 'string' } },
    },
  },
  {
    name: 'pm_update_task_status',
    description: 'Transition a task to a new status. Applies atomic write + schema validation.',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'task_id', 'status'],
      properties: {
        project_id: { type: 'string' },
        task_id: { type: 'string', pattern: '^T-[0-9]+$' },
        status: {
          type: 'string',
          enum: [
            'PENDING', 'IN_RESEARCH', 'RESEARCHED', 'IN_PROGRESS',
            'VALIDATING', 'PARENT', 'COMPLETE', 'BLOCKED', 'SKIPPED', 'FAILED',
          ],
        },
        blocked_reason: { type: 'string' },
        actual_minutes: { type: 'integer', minimum: 0 },
        execution_notes: { type: 'string' },
      },
    },
  },
  {
    name: 'pm_add_task',
    description: 'Append a new task to tasks.json. Id may be omitted (auto-assigned).',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'task'],
      properties: {
        project_id: { type: 'string' },
        task: {
          type: 'object',
          description: 'Partial task record. id/status/priority/created_at are auto-filled when missing.',
        },
      },
    },
  },
  {
    name: 'pm_complete_task',
    description: 'Mark a task COMPLETE. Records actual_minutes and completed_at.',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'task_id'],
      properties: {
        project_id: { type: 'string' },
        task_id: { type: 'string', pattern: '^T-[0-9]+$' },
        actual_minutes: { type: 'integer', minimum: 0 },
        execution_notes: { type: 'string' },
      },
    },
  },
  {
    name: 'pm_block_task',
    description: 'Mark a task BLOCKED with a human-readable reason.',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'task_id', 'reason'],
      properties: {
        project_id: { type: 'string' },
        task_id: { type: 'string', pattern: '^T-[0-9]+$' },
        reason: { type: 'string', minLength: 3 },
      },
    },
  },
  {
    name: 'pm_checkpoint',
    description: 'Write a checkpoint snapshot of project.json + tasks.json to checkpoints/.',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: { project_id: { type: 'string' } },
    },
  },
  {
    name: 'pm_get_research',
    description: 'Read the cached research brief for a task, if any.',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'task_id'],
      properties: {
        project_id: { type: 'string' },
        task_id: { type: 'string', pattern: '^T-[0-9]+$' },
      },
    },
  },
  {
    name: 'pm_put_research',
    description: 'Write a research brief to research/{task_id}.md and update the task record.',
    inputSchema: {
      type: 'object',
      required: ['project_id', 'task_id', 'markdown'],
      properties: {
        project_id: { type: 'string' },
        task_id: { type: 'string', pattern: '^T-[0-9]+$' },
        markdown: { type: 'string', minLength: 1 },
      },
    },
  },
  {
    name: 'pm_validate',
    description: 'Validate project.json and tasks.json against the plugin schemas. Returns the list of errors.',
    inputSchema: {
      type: 'object',
      required: ['project_id'],
      properties: { project_id: { type: 'string' } },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

function requireArg(args, key) {
  if (args[key] === undefined || args[key] === null || args[key] === '') {
    throw new Error(`missing required argument: ${key}`);
  }
  return args[key];
}

function summary(project) {
  const tasks = readTasks(project.id);
  const counts = { total: 0, pending: 0, in_progress: 0, complete: 0, blocked: 0 };
  for (const t of tasks.tasks || []) {
    counts.total += 1;
    if (t.status === 'PENDING') counts.pending += 1;
    else if (t.status === 'IN_PROGRESS') counts.in_progress += 1;
    else if (t.status === 'COMPLETE') counts.complete += 1;
    else if (t.status === 'BLOCKED') counts.blocked += 1;
  }
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    counts,
  };
}

function autoTaskId(tasks) {
  let maxN = 0;
  for (const t of tasks) {
    const m = (t.id || '').match(/^T-(\d+)$/);
    if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
  }
  return `T-${String(maxN + 1).padStart(3, '0')}`;
}

const HANDLERS = {
  async pm_list_projects() {
    return listProjects().map((p) => summary(p.project));
  },

  async pm_get_project(args) {
    const project = readProject(requireArg(args, 'project_id'));
    if (!project) throw new Error(`project not found: ${args.project_id}`);
    return project;
  },

  async pm_get_tasks(args) {
    const id = requireArg(args, 'project_id');
    let tasks = (readTasks(id).tasks || []).slice();
    if (args.status) tasks = tasks.filter((t) => t.status === args.status);
    if (args.phase_id) tasks = tasks.filter((t) => t.phase_id === args.phase_id || t.phase === args.phase_id);
    if (args.parent_id) tasks = tasks.filter((t) => t.parent_id === args.parent_id);
    if (args.limit) tasks = tasks.slice(0, args.limit);
    return { project_id: id, count: tasks.length, tasks };
  },

  async pm_get_task(args) {
    const id = requireArg(args, 'project_id');
    const taskId = requireArg(args, 'task_id');
    const task = findTask(readTasks(id), taskId);
    if (!task) throw new Error(`task not found: ${taskId}`);
    return task;
  },

  async pm_next_task(args) {
    const id = requireArg(args, 'project_id');
    const focus = {
      phase_id: args.focus_phase_id,
      epic_id: args.focus_epic_id,
      story_id: args.focus_story_id,
    };
    const hasFocus = Object.values(focus).some(Boolean);
    const task = nextTask(readTasks(id), hasFocus ? { focus } : {});
    return { task };
  },

  async pm_unblocked_tasks(args) {
    const id = requireArg(args, 'project_id');
    const ready = unblockedTasks(readTasks(id));
    return { count: ready.length, tasks: ready };
  },

  async pm_update_task_status(args) {
    const id = requireArg(args, 'project_id');
    const taskId = requireArg(args, 'task_id');
    const status = requireArg(args, 'status');
    const result = await mutateTasks(id, (tasks) => {
      const task = (tasks.tasks || []).find((t) => t.id === taskId);
      if (!task) throw new Error(`task not found: ${taskId}`);
      task.status = status;
      if (status === 'BLOCKED') {
        if (!args.blocked_reason) throw new Error('blocked_reason is required when status=BLOCKED');
        task.blocked_reason = args.blocked_reason;
      } else if (task.blocked_reason && status !== 'BLOCKED') {
        task.blocked_reason = null;
      }
      if (status === 'COMPLETE') {
        task.completed_at = new Date().toISOString();
        if (args.actual_minutes !== undefined) task.actual_minutes = args.actual_minutes;
      }
      if (args.execution_notes) {
        task.execution_notes = task.execution_notes
          ? `${task.execution_notes}\n${args.execution_notes}`
          : args.execution_notes;
      }
      return tasks;
    });
    return { updated: taskId, status, tasks_count: (result?.tasks || []).length };
  },

  async pm_add_task(args) {
    const id = requireArg(args, 'project_id');
    const newTask = requireArg(args, 'task');
    if (typeof newTask !== 'object' || Array.isArray(newTask)) throw new Error('task must be an object');
    await mutateTasks(id, (tasks) => {
      const arr = tasks.tasks || [];
      const taskId = newTask.id || autoTaskId(arr);
      if (arr.some((t) => t.id === taskId)) throw new Error(`task id already exists: ${taskId}`);
      const filled = {
        id: taskId,
        title: newTask.title || 'Untitled task',
        description: newTask.description || '',
        level: newTask.level || 'task',
        status: newTask.status || 'PENDING',
        priority: newTask.priority || 'MEDIUM',
        dependencies: newTask.dependencies || [],
        completion_criteria: newTask.completion_criteria || [],
        created_at: newTask.created_at || new Date().toISOString(),
        ...newTask,
      };
      arr.push(filled);
      tasks.tasks = arr;
      return tasks;
    });
    return { added: newTask.id || 'auto' };
  },

  async pm_complete_task(args) {
    return HANDLERS.pm_update_task_status({
      project_id: args.project_id,
      task_id: args.task_id,
      status: 'COMPLETE',
      actual_minutes: args.actual_minutes,
      execution_notes: args.execution_notes,
    });
  },

  async pm_block_task(args) {
    return HANDLERS.pm_update_task_status({
      project_id: args.project_id,
      task_id: args.task_id,
      status: 'BLOCKED',
      blocked_reason: requireArg(args, 'reason'),
    });
  },

  async pm_checkpoint(args) {
    const id = requireArg(args, 'project_id');
    const file = writeCheckpoint(id);
    if (!file) throw new Error(`project not found: ${id}`);
    return { checkpoint: file };
  },

  async pm_get_research(args) {
    const id = requireArg(args, 'project_id');
    const taskId = requireArg(args, 'task_id');
    const file = join(projectDir(id), 'research', `${taskId}.md`);
    if (!existsSync(file)) return { project_id: id, task_id: taskId, found: false };
    return { project_id: id, task_id: taskId, found: true, markdown: readFileSync(file, 'utf8') };
  },

  async pm_put_research(args) {
    const id = requireArg(args, 'project_id');
    const taskId = requireArg(args, 'task_id');
    const markdown = requireArg(args, 'markdown');
    const dir = join(projectDir(id), 'research');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${taskId}.md`);
    writeFileSync(file, markdown);
    await mutateTasks(id, (tasks) => {
      const task = (tasks.tasks || []).find((t) => t.id === taskId);
      if (task) task.research_file = `research/${taskId}.md`;
      return tasks;
    }).catch(() => null); // not fatal if task doesn't exist yet
    return { file };
  },

  async pm_validate(args) {
    const id = requireArg(args, 'project_id');
    const project = readProject(id);
    const tasks = readTasks(id);
    const project_errors = project ? validateProject(project) : ['project.json missing'];
    const tasks_errors = validateTasks(tasks);
    return { project_errors, tasks_errors };
  },
};

// ---------------------------------------------------------------------------
// JSON-RPC dispatch
// ---------------------------------------------------------------------------

async function handleRequest(request) {
  const { method, params, id } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
      },
    };
  }

  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  }

  if (method === 'tools/call') {
    const { name, arguments: args = {} } = params || {};
    const handler = HANDLERS[name];
    if (!handler) {
      return {
        jsonrpc: '2.0', id,
        error: { code: -32601, message: `unknown tool: ${name}` },
      };
    }
    try {
      const result = await handler(args);
      return {
        jsonrpc: '2.0', id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0', id,
        error: { code: -32000, message: err.message || String(err) },
      };
    }
  }

  return {
    jsonrpc: '2.0', id,
    error: { code: -32601, message: `unknown method: ${method}` },
  };
}

// ---------------------------------------------------------------------------
// stdio transport
// ---------------------------------------------------------------------------

async function main() {
  await loadValidators();
  const rl = createInterface({ input: process.stdin, terminal: false });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let request;
    try {
      request = JSON.parse(trimmed);
    } catch {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'parse error' },
      }) + '\n');
      continue;
    }
    const response = await handleRequest(request);
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

main().catch((err) => {
  process.stderr.write(`pm-mcp fatal: ${err.stack || err.message}\n`);
  process.exit(1);
});
