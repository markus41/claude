#!/usr/bin/env node
/**
 * Lessons Learned MCP Server
 *
 * A self-learning knowledge base that captures errors, fixes, and patterns.
 * Tools:
 *   - lessons_search: Search lessons by keyword, tool, or status
 *   - lessons_add: Add a new lesson (error + fix + prevention)
 *   - lessons_resolve: Mark a lesson as resolved with fix details
 *   - lessons_patterns: Extract recurring patterns from lessons
 *   - lessons_stats: Get statistics on error frequency and resolution
 *   - rules_suggest: Suggest new rules based on unresolved patterns
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { createInterface } from 'readline';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const LESSONS_FILE = join(PROJECT_DIR, '.claude', 'rules', 'lessons-learned.md');
const LESSONS_DB = join(PROJECT_DIR, '.claude', 'logs', 'lessons-db.jsonl');

// Ensure directories exist
for (const f of [LESSONS_FILE, LESSONS_DB]) {
  const dir = dirname(f);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function readLessonsDB() {
  if (!existsSync(LESSONS_DB)) return [];
  return readFileSync(LESSONS_DB, 'utf-8')
    .split('\n')
    .filter(line => line.trim())
    .map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(Boolean);
}

function appendLesson(lesson) {
  const entry = { ...lesson, id: Date.now().toString(36), timestamp: new Date().toISOString() };
  const line = JSON.stringify(entry) + '\n';
  writeFileSync(LESSONS_DB, existsSync(LESSONS_DB) ? readFileSync(LESSONS_DB, 'utf-8') + line : line);

  // Also append to the markdown file
  const mdEntry = `\n### ${entry.status === 'RESOLVED' ? 'RESOLVED' : 'NEEDS_FIX'}: ${entry.tool} - ${entry.error_summary} (${entry.timestamp})\n- **Tool:** ${entry.tool}\n- **Error:** ${entry.error}\n- **Fix:** ${entry.fix || 'Pending'}\n- **Prevention:** ${entry.prevention || 'Pending'}\n- **Status:** ${entry.status}\n`;

  if (existsSync(LESSONS_FILE)) {
    writeFileSync(LESSONS_FILE, readFileSync(LESSONS_FILE, 'utf-8') + mdEntry);
  }
  return entry;
}

function handleRequest(request) {
  const { method, params, id } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0', id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'lessons-learned', version: '1.0.0' }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0', id,
      result: {
        tools: [
          {
            name: 'lessons_search',
            description: 'Search the lessons-learned knowledge base by keyword, tool name, or status. Use this BEFORE starting work to check for known issues.',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search keyword (matches error, tool, fix, prevention fields)' },
                status: { type: 'string', enum: ['NEEDS_FIX', 'RESOLVED', 'all'], description: 'Filter by status' },
                tool: { type: 'string', description: 'Filter by tool name (Bash, Edit, etc.)' },
                limit: { type: 'number', description: 'Max results (default 10)' }
              }
            }
          },
          {
            name: 'lessons_add',
            description: 'Add a new lesson to the knowledge base. Use after encountering an error to capture it for future prevention.',
            inputSchema: {
              type: 'object',
              properties: {
                tool: { type: 'string', description: 'Tool that failed (Bash, Edit, etc.)' },
                error_summary: { type: 'string', description: 'Brief one-line description of the error' },
                error: { type: 'string', description: 'Full error message or description' },
                context: { type: 'string', description: 'What was being attempted when the error occurred' },
                fix: { type: 'string', description: 'How the error was fixed (if known)' },
                prevention: { type: 'string', description: 'How to prevent this in the future' },
                tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' }
              },
              required: ['tool', 'error_summary', 'error']
            }
          },
          {
            name: 'lessons_resolve',
            description: 'Mark an existing lesson as resolved and document the fix.',
            inputSchema: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Lesson ID to resolve' },
                fix: { type: 'string', description: 'Description of the fix applied' },
                prevention: { type: 'string', description: 'How to prevent this in the future' },
                rule_suggestion: { type: 'string', description: 'Suggested rule to add to .claude/rules/' }
              },
              required: ['id', 'fix']
            }
          },
          {
            name: 'lessons_patterns',
            description: 'Analyze lessons to find recurring error patterns. Returns clusters of similar errors with frequency counts.',
            inputSchema: {
              type: 'object',
              properties: {
                min_frequency: { type: 'number', description: 'Minimum occurrences to be considered a pattern (default 2)' },
                time_window_days: { type: 'number', description: 'Only look at lessons from the last N days (default 30)' }
              }
            }
          },
          {
            name: 'lessons_stats',
            description: 'Get statistics on the lessons knowledge base: total entries, resolution rate, most common tools/errors, trends.',
            inputSchema: { type: 'object', properties: {} }
          },
          {
            name: 'rules_suggest',
            description: 'Based on resolved lessons, suggest new rules to add to .claude/rules/ files to prevent recurring errors.',
            inputSchema: {
              type: 'object',
              properties: {
                category: { type: 'string', description: 'Filter suggestions to a category (docker, k8s, git, code, etc.)' }
              }
            }
          }
        ]
      }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      let result;

      switch (name) {
        case 'lessons_search': {
          let lessons = readLessonsDB();
          if (args.status && args.status !== 'all') lessons = lessons.filter(l => l.status === args.status);
          if (args.tool) lessons = lessons.filter(l => l.tool?.toLowerCase().includes(args.tool.toLowerCase()));
          if (args.query) {
            const q = args.query.toLowerCase();
            lessons = lessons.filter(l =>
              (l.error || '').toLowerCase().includes(q) ||
              (l.error_summary || '').toLowerCase().includes(q) ||
              (l.fix || '').toLowerCase().includes(q) ||
              (l.prevention || '').toLowerCase().includes(q) ||
              (l.tags || []).some(t => t.toLowerCase().includes(q))
            );
          }
          result = lessons.slice(-(args.limit || 10));
          break;
        }

        case 'lessons_add': {
          const entry = appendLesson({
            ...args,
            status: args.fix ? 'RESOLVED' : 'NEEDS_FIX'
          });
          result = { message: `Lesson ${entry.id} added`, entry };
          break;
        }

        case 'lessons_resolve': {
          const lessons = readLessonsDB();
          const idx = lessons.findIndex(l => l.id === args.id);
          if (idx === -1) { result = { error: `Lesson ${args.id} not found` }; break; }
          lessons[idx] = { ...lessons[idx], status: 'RESOLVED', fix: args.fix, prevention: args.prevention || lessons[idx].prevention, resolved_at: new Date().toISOString() };
          writeFileSync(LESSONS_DB, lessons.map(l => JSON.stringify(l)).join('\n') + '\n');
          result = { message: `Lesson ${args.id} resolved`, entry: lessons[idx] };
          break;
        }

        case 'lessons_patterns': {
          const lessons = readLessonsDB();
          const minFreq = args.min_frequency || 2;
          const cutoff = args.time_window_days ? new Date(Date.now() - args.time_window_days * 86400000).toISOString() : '1970-01-01';
          const recent = lessons.filter(l => l.timestamp >= cutoff);

          // Group by tool
          const byTool = {};
          recent.forEach(l => {
            const key = l.tool || 'unknown';
            if (!byTool[key]) byTool[key] = [];
            byTool[key].push(l);
          });

          // Group by error keyword
          const errorWords = {};
          recent.forEach(l => {
            const words = (l.error_summary || l.error || '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
            words.forEach(w => {
              if (!errorWords[w]) errorWords[w] = [];
              errorWords[w].push(l.id);
            });
          });

          const patterns = Object.entries(byTool)
            .filter(([, entries]) => entries.length >= minFreq)
            .map(([tool, entries]) => ({
              tool,
              count: entries.length,
              resolved: entries.filter(e => e.status === 'RESOLVED').length,
              unresolved: entries.filter(e => e.status === 'NEEDS_FIX').length,
              examples: entries.slice(-3).map(e => e.error_summary)
            }))
            .sort((a, b) => b.count - a.count);

          result = { total_lessons: recent.length, patterns, top_error_keywords: Object.entries(errorWords).filter(([, ids]) => ids.length >= minFreq).sort((a, b) => b[1].length - a[1].length).slice(0, 10).map(([word, ids]) => ({ word, count: ids.length })) };
          break;
        }

        case 'lessons_stats': {
          const lessons = readLessonsDB();
          const resolved = lessons.filter(l => l.status === 'RESOLVED');
          const unresolved = lessons.filter(l => l.status === 'NEEDS_FIX');
          const byTool = {};
          lessons.forEach(l => { byTool[l.tool || 'unknown'] = (byTool[l.tool || 'unknown'] || 0) + 1; });

          result = {
            total: lessons.length,
            resolved: resolved.length,
            unresolved: unresolved.length,
            resolution_rate: lessons.length ? (resolved.length / lessons.length * 100).toFixed(1) + '%' : '0%',
            by_tool: Object.entries(byTool).sort((a, b) => b[1] - a[1]),
            recent_5: lessons.slice(-5).map(l => ({ id: l.id, tool: l.tool, summary: l.error_summary, status: l.status })),
            oldest_unresolved: unresolved.slice(0, 5).map(l => ({ id: l.id, tool: l.tool, summary: l.error_summary, timestamp: l.timestamp }))
          };
          break;
        }

        case 'rules_suggest': {
          const lessons = readLessonsDB().filter(l => l.status === 'RESOLVED' && l.prevention);
          if (args.category) {
            const cat = args.category.toLowerCase();
            const filtered = lessons.filter(l =>
              (l.tags || []).some(t => t.toLowerCase().includes(cat)) ||
              (l.tool || '').toLowerCase().includes(cat) ||
              (l.prevention || '').toLowerCase().includes(cat)
            );
            result = {
              category: args.category,
              suggestions: filtered.map(l => ({
                from_lesson: l.id,
                rule: l.prevention,
                context: l.error_summary
              }))
            };
          } else {
            result = {
              suggestions: lessons.map(l => ({
                from_lesson: l.id,
                tool: l.tool,
                rule: l.prevention,
                context: l.error_summary
              })).slice(-20)
            };
          }
          break;
        }

        default:
          result = { error: `Unknown tool: ${name}` };
      }

      return {
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0', id,
        result: { content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }], isError: true }
      };
    }
  }

  // Handle notifications (no response needed)
  if (!id) return null;

  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

// Stdio transport
const rl = createInterface({ input: process.stdin });
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  while (true) {
    const newlineIdx = buffer.indexOf('\n');
    if (newlineIdx === -1) break;
    const line = buffer.slice(0, newlineIdx).trim();
    buffer = buffer.slice(newlineIdx + 1);
    if (!line) continue;
    try {
      const request = JSON.parse(line);
      const response = handleRequest(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (e) {
      // Skip malformed JSON
    }
  }
});

process.stderr.write('Lessons Learned MCP server started\n');
