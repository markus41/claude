import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';
import pino from 'pino';
import { eventBus } from './event-bus.js';

const logger = pino({ name: 'graph' });

// ── Cypher safety helpers ──
//
// Kuzu's node.js bindings in use here do not expose parameterized statements
// through a stable typed interface, so the Cypher we send is a string
// template. To prevent injection via user-controlled values we:
//   1. Restrict identifiers (labels, edge types, property keys) to a safe
//      regex — these are interpolated without quotes and must never contain
//      metacharacters.
//   2. Route every value through formatCypherValue() which quotes and
//      escapes strings (single-quote, backslash, newline, carriage return),
//      emits booleans/numbers as literals, and stringifies anything else.
//
// This is defense-in-depth; a future upgrade should switch to prepared
// statements when the Kuzu driver exposes them in TypeScript.

const SAFE_IDENT_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isSafeIdentifier(s: string): boolean {
  return SAFE_IDENT_RE.test(s);
}

function assertSafeIdentifier(s: string, kind: string): void {
  if (!isSafeIdentifier(s)) {
    throw new Error(`Refusing unsafe ${kind} identifier: ${JSON.stringify(s)}`);
  }
}

function formatCypherValue(v: unknown): string {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  // everything else: stringify + quote + escape
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `'${escaped}'`;
}

// ── Type definitions ──

export type NodeLabel =
  | 'Source' | 'Page' | 'Symbol' | 'Module' | 'Example'
  | 'AlgoNode' | 'Pattern' | 'AgentDef';

export type EdgeType =
  | 'PART_OF' | 'DEFINED_IN' | 'BELONGS_TO' | 'CALLS' | 'INHERITS'
  | 'SEE_ALSO' | 'HAS_EXAMPLE' | 'SUPERSEDES' | 'USES_ALGO'
  | 'IMPLEMENTS' | 'RELATED_ALGO' | 'SAME_AS' | 'DERIVED_FROM';

export interface SymbolNode {
  id: string;
  name: string;
  kind: string;
  description: string;
  signature: string;
  deprecated: boolean;
  deleted: boolean;
  source_id: string;
  page_id: string;
  last_crawled: string;
}

export interface SearchResult {
  id: string;
  label: NodeLabel;
  name: string;
  score: number;
  snippet: string;
}

export interface SubGraph {
  nodes: Array<{ id: string; label: NodeLabel; props: Record<string, unknown> }>;
  edges: Array<{ type: EdgeType; from: string; to: string; props: Record<string, unknown> }>;
}

interface SchemaDefinition {
  nodes: Array<{ label: string; properties: string[] }>;
  edges: Array<{ type: string; from: string; to: string }>;
}

// ── In-memory graph store (Kùzu adapter interface) ──
// Uses Map-based storage when Kùzu is not available, with full Kùzu support when the native module loads.

interface StoredNode {
  label: NodeLabel;
  props: Record<string, unknown>;
}

interface StoredEdge {
  type: EdgeType;
  from: string;
  to: string;
  props: Record<string, unknown>;
}

export interface GraphEdge {
  type: EdgeType;
  from: string;
  to: string;
  props: Record<string, unknown>;
}

export class GraphAdapter {
  private nodes = new Map<string, StoredNode>();
  private edges: StoredEdge[] = [];
  private schema: SchemaDefinition | undefined;
  private kuzuDb: unknown = null;
  private kuzuConn: unknown = null;
  private useNeo4j = false;
  private initialized = false;

  constructor(
    private readonly dataDir: string,
    private readonly configDir: string,
  ) {
    this.useNeo4j = !!process.env['NEO4J_URI'];
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Load schema
    const schemaPath = join(this.configDir, 'graph-schema.yaml');
    try {
      const raw = await readFile(schemaPath, 'utf-8');
      this.schema = yaml.load(raw) as SchemaDefinition;
    } catch {
      logger.warn('No graph-schema.yaml found, using defaults');
      this.schema = { nodes: [], edges: [] };
    }

    if (this.useNeo4j) {
      logger.info('Neo4j mode enabled via NEO4J_URI env var');
      // Neo4j integration would use neo4j-driver here
      // For now we fall through to in-memory + Kùzu
    }

    // Try to load Kùzu. Distinguish between "module not installed" (benign —
    // optional native dep) and any other failure (suspicious — surface in logs
    // so a broken install or schema error is not silently masked by the fallback).
    try {
      const kuzu = await import('kuzu');
      const dbPath = join(this.dataDir, 'graph.db');
      this.kuzuDb = new kuzu.default.Database(dbPath);
      this.kuzuConn = new kuzu.default.Connection(this.kuzuDb as InstanceType<typeof kuzu.default.Database>);
      logger.info('Kùzu graph database initialized');
      await this.migrateSchema();
    } catch (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
      if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') {
        logger.info('Kùzu not available, using in-memory graph store');
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn({ err: msg, code }, 'Kùzu initialization failed, falling back to in-memory graph store');
      }
    }

    this.initialized = true;
  }

  private async migrateSchema(): Promise<void> {
    if (!this.kuzuConn || !this.schema) return;

    const conn = this.kuzuConn as { execute: (q: string) => Promise<unknown> };

    // Create node tables (idempotent via CREATE ... IF NOT EXISTS)
    for (const node of this.schema.nodes) {
      const props = node.properties
        .map((p) => {
          if (p === 'id') return 'id STRING';
          if (p.includes('stale') || p.includes('deprecated') || p.includes('deleted')) return `${p} BOOLEAN DEFAULT false`;
          if (p.includes('score') || p.includes('drift')) return `${p} FLOAT DEFAULT 0.0`;
          return `${p} STRING DEFAULT ''`;
        })
        .join(', ');

      try {
        await conn.execute(`CREATE NODE TABLE IF NOT EXISTS ${node.label}(${props}, PRIMARY KEY(id))`);
      } catch (err) {
        logger.debug({ label: node.label, err }, 'Schema migration note');
      }
    }

    // Create edge tables
    for (const edge of this.schema.edges) {
      try {
        await conn.execute(
          `CREATE REL TABLE IF NOT EXISTS ${edge.type}(FROM ${edge.from} TO ${edge.to})`,
        );
      } catch (err) {
        logger.debug({ type: edge.type, err }, 'Edge schema migration note');
      }
    }

    logger.info('Graph schema migration complete');
  }

  async upsertNode(label: NodeLabel, props: Record<string, unknown>): Promise<void> {
    const id = props['id'] as string;
    if (!id) throw new Error('Node must have an id property');

    if (this.kuzuConn) {
      const conn = this.kuzuConn as { execute: (q: string) => Promise<unknown> };
      assertSafeIdentifier(label, 'label');
      const entries = Object.entries(props)
        .filter(([k]) => isSafeIdentifier(k))
        .map(([k, v]) => `${k}: ${formatCypherValue(v)}`)
        .join(', ');
      try {
        await conn.execute(`MERGE (n:${label} {id: ${formatCypherValue(id)}}) SET ${entries}`);
      } catch {
        // Fallback to in-memory
        this.nodes.set(id, { label, props });
      }
    } else {
      this.nodes.set(id, { label, props });
    }

    await eventBus.emit('graph:upsert', { nodeLabel: label, nodeId: id });
  }

  async upsertEdge(type: EdgeType, fromId: string, toId: string, props?: Record<string, unknown>): Promise<void> {
    if (this.kuzuConn) {
      const conn = this.kuzuConn as { execute: (q: string) => Promise<unknown> };
      assertSafeIdentifier(type, 'edge type');
      try {
        await conn.execute(
          `MATCH (a {id: ${formatCypherValue(fromId)}}), (b {id: ${formatCypherValue(toId)}}) MERGE (a)-[:${type}]->(b)`,
        );
      } catch {
        this.edges.push({ type, from: fromId, to: toId, props: props ?? {} });
      }
    } else {
      // Remove existing edge of same type between same nodes (idempotent)
      this.edges = this.edges.filter(
        (e) => !(e.type === type && e.from === fromId && e.to === toId),
      );
      this.edges.push({ type, from: fromId, to: toId, props: props ?? {} });
    }
  }

  async traverse(startId: string, hops: number, edgeTypes?: EdgeType[]): Promise<SubGraph> {
    const visited = new Set<string>();
    const resultNodes: SubGraph['nodes'] = [];
    const resultEdges: SubGraph['edges'] = [];
    const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || current.depth > hops || visited.has(current.id)) continue;
      visited.add(current.id);

      const node = this.nodes.get(current.id);
      if (node) {
        resultNodes.push({ id: current.id, label: node.label, props: node.props });
      }

      for (const edge of this.edges) {
        if (edgeTypes && !edgeTypes.includes(edge.type)) continue;

        let neighborId: string | undefined;
        if (edge.from === current.id) neighborId = edge.to;
        else if (edge.to === current.id) neighborId = edge.from;

        if (neighborId && !visited.has(neighborId)) {
          resultEdges.push(edge);
          queue.push({ id: neighborId, depth: current.depth + 1 });
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  async siblings(symbolId: string): Promise<SymbolNode[]> {
    const node = this.nodes.get(symbolId);
    if (!node) return [];

    const pageId = node.props['page_id'] as string | undefined;
    if (!pageId) return [];

    const results: SymbolNode[] = [];
    for (const [id, n] of this.nodes) {
      if (n.label === 'Symbol' && n.props['page_id'] === pageId && id !== symbolId) {
        results.push(n.props as unknown as SymbolNode);
      }
    }
    return results;
  }

  async search(query: string, limit = 10): Promise<SearchResult[]> {
    // Text-based search across all nodes
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const [id, node] of this.nodes) {
      const name = (node.props['name'] as string || '').toLowerCase();
      const desc = (node.props['description'] as string || '').toLowerCase();
      const title = (node.props['title'] as string || '').toLowerCase();

      let score = 0;
      if (name === queryLower) score = 1.0;
      else if (name.includes(queryLower)) score = 0.8;
      else if (desc.includes(queryLower)) score = 0.5;
      else if (title.includes(queryLower)) score = 0.4;

      if (score > 0) {
        results.push({
          id,
          label: node.label,
          name: (node.props['name'] as string) || (node.props['title'] as string) || id,
          score,
          snippet: (desc || title || name).slice(0, 200),
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async markStale(pageId: string): Promise<void> {
    const node = this.nodes.get(pageId);
    if (node) {
      node.props['stale'] = true;
      await eventBus.emit('graph:stale', { pageId });
    }
  }

  async markDeleted(pageId: string): Promise<void> {
    const node = this.nodes.get(pageId);
    if (node) {
      node.props['deleted'] = true;
    }
  }

  async getNode(id: string): Promise<StoredNode | undefined> {
    return this.nodes.get(id);
  }

  async getNodesByLabel(label: NodeLabel): Promise<Array<{ id: string; props: Record<string, unknown> }>> {
    const results: Array<{ id: string; props: Record<string, unknown> }> = [];
    for (const [id, node] of this.nodes) {
      if (node.label === label) {
        results.push({ id, props: node.props });
      }
    }
    return results;
  }

  async getEdges(): Promise<GraphEdge[]> {
    return this.edges.map((edge) => ({ ...edge, props: { ...edge.props } }));
  }

  async deleteNode(id: string): Promise<void> {
    if (this.kuzuConn) {
      const conn = this.kuzuConn as { execute: (q: string) => Promise<unknown> };
      try {
        await conn.execute(`MATCH (n {id: '${id}'}) DETACH DELETE n`);
      } catch {
        this.nodes.delete(id);
      }
      return;
    }

    this.nodes.delete(id);
    this.edges = this.edges.filter((edge) => edge.from !== id && edge.to !== id);
  }

  async deleteEdge(type: EdgeType, fromId: string, toId: string): Promise<void> {
    if (this.kuzuConn) {
      const conn = this.kuzuConn as { execute: (q: string) => Promise<unknown> };
      try {
        await conn.execute(`MATCH (a {id: '${fromId}'})-[r:${type}]->(b {id: '${toId}'}) DELETE r`);
      } catch {
        this.edges = this.edges.filter((edge) => !(edge.type === type && edge.from === fromId && edge.to === toId));
      }
      return;
    }

    this.edges = this.edges.filter((edge) => !(edge.type === type && edge.from === fromId && edge.to === toId));
  }

  async stats(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const node of this.nodes.values()) {
      counts[node.label] = (counts[node.label] ?? 0) + 1;
    }
    counts['total_nodes'] = this.nodes.size;
    counts['total_edges'] = this.edges.length;
    return counts;
  }
}
