/**
 * Manage AlgoNode entries in the knowledge graph and vector store.
 * Provides upsert, relationship linking, search, and detail retrieval.
 */

import pino from 'pino';
import { type GraphAdapter, type EdgeType, type SearchResult, type SubGraph } from '../core/graph.js';
import { type VectorStore, type VectorSearchResult } from '../core/vector.js';
import { ALGO_CATEGORIES, type AlgoCategory, type AlgoNodeData } from './algo-sources.js';

const logger = pino({ name: 'algo-graph' });

// ── Result types ──

export interface AlgoSearchResult {
  id: string;
  name: string;
  category: AlgoCategory;
  score: number;
  snippet: string;
  hasTs: boolean;
  hasPy: boolean;
}

export interface AlgoDetailResult {
  algo: AlgoNodeData;
  related: Array<{
    id: string;
    name: string;
    category: AlgoCategory;
    edgeType: EdgeType;
    strength: 'weak' | 'strong';
  }>;
}

// ── Manager class ──

export class AlgoGraphManager {
  constructor(
    private readonly graph: GraphAdapter,
    private readonly vectors: VectorStore,
  ) {}

  /**
   * Upsert an AlgoNode into the graph and its embedding into the vector
   * store. Idempotent — repeated calls with the same id replace the entry.
   */
  async upsertAlgo(algo: AlgoNodeData): Promise<void> {
    // Store in graph
    await this.graph.upsertNode('AlgoNode', {
      id: algo.id,
      name: algo.name,
      category: algo.category,
      complexity_time: algo.complexity_time,
      complexity_space: algo.complexity_space,
      description: algo.description,
      source_url: algo.source_url,
      code_ts: algo.code_ts,
      code_py: algo.code_py,
      tags: algo.tags.join(','),
      last_crawled: algo.last_crawled,
    });

    // Build embedding text: name + category + description + tags
    const embeddingText = [
      algo.name,
      algo.category,
      algo.description,
      algo.complexity_time,
      ...algo.tags,
    ].join(' ');

    await this.vectors.add(algo.id, 'AlgoNode', embeddingText);

    logger.debug({ id: algo.id, name: algo.name }, 'Upserted algo node');
  }

  /**
   * Compute RELATED_ALGO edges between all AlgoNode pairs.
   *
   * - Same category = weak edge (weight 0.3)
   * - Shared tags (Jaccard >= 0.2) = strong edge (weight = Jaccard)
   *
   * Returns the number of edges created.
   */
  async linkRelatedAlgos(): Promise<number> {
    const allNodes = await this.graph.getNodesByLabel('AlgoNode');
    let edgeCount = 0;

    // Pre-index tag sets for Jaccard computation
    const tagSets = new Map<string, Set<string>>();
    const categories = new Map<string, string>();

    for (const node of allNodes) {
      const id = node.id;
      const rawTags = node.props['tags'];
      const tagStr = typeof rawTags === 'string' ? rawTags : '';
      tagSets.set(id, new Set(tagStr.split(',').filter(Boolean)));
      categories.set(id, (node.props['category'] as string) || '');
    }

    // Pairwise comparison (skip self, skip duplicate pairs)
    const ids = [...tagSets.keys()];
    for (let i = 0; i < ids.length; i++) {
      const idA = ids[i];
      if (!idA) continue;
      const tagsA = tagSets.get(idA);
      const catA = categories.get(idA);
      if (!tagsA) continue;

      for (let j = i + 1; j < ids.length; j++) {
        const idB = ids[j];
        if (!idB) continue;
        const tagsB = tagSets.get(idB);
        const catB = categories.get(idB);
        if (!tagsB) continue;

        const jaccard = jaccardSimilarity(tagsA, tagsB);
        const sameCategory = catA === catB && catA !== '';

        if (jaccard >= 0.2) {
          // Strong relationship via shared tags
          await this.graph.upsertEdge('RELATED_ALGO', idA, idB, {
            strength: 'strong',
            weight: jaccard,
          });
          edgeCount++;
        } else if (sameCategory) {
          // Weak relationship via same category
          await this.graph.upsertEdge('RELATED_ALGO', idA, idB, {
            strength: 'weak',
            weight: 0.3,
          });
          edgeCount++;
        }
      }
    }

    logger.info({ edgeCount, nodeCount: ids.length }, 'Linked related algos');
    return edgeCount;
  }

  /**
   * Search for algorithms by natural-language query, optionally filtered
   * by category and/or language availability.
   */
  async searchAlgos(
    query: string,
    category?: string,
    language?: 'ts' | 'py',
  ): Promise<AlgoSearchResult[]> {
    // Vector similarity search
    const vectorHits = await this.vectors.search(query, 30, 'AlgoNode');

    // Graph text search for supplementary results
    const graphHits = await this.graph.search(query, 20);
    const graphAlgoHits = graphHits.filter((h: SearchResult) => h.label === 'AlgoNode');

    // Merge results, deduplicate by id, sum scores
    const scoreMap = new Map<string, { score: number; snippet: string }>();

    for (const hit of vectorHits) {
      const existing = scoreMap.get(hit.id);
      const combined = (existing?.score ?? 0) + hit.score;
      scoreMap.set(hit.id, {
        score: combined,
        snippet: existing?.snippet ?? hit.text.slice(0, 200),
      });
    }

    for (const hit of graphAlgoHits) {
      const existing = scoreMap.get(hit.id);
      const combined = (existing?.score ?? 0) + hit.score * 0.5;
      scoreMap.set(hit.id, {
        score: combined,
        snippet: existing?.snippet ?? hit.snippet,
      });
    }

    // Enrich with node properties and apply filters
    const results: AlgoSearchResult[] = [];

    for (const [id, merged] of scoreMap) {
      const node = await this.graph.getNode(id);
      if (!node) continue;

      const props = node.props;
      const nodeCat = (props['category'] as string) || '';
      const codeTs = (props['code_ts'] as string) || '';
      const codePy = (props['code_py'] as string) || '';

      // Apply category filter
      if (category && nodeCat !== category) continue;

      // Apply language filter
      if (language === 'ts' && !codeTs) continue;
      if (language === 'py' && !codePy) continue;

      // Validate category is a known AlgoCategory
      const validCategory = isValidCategory(nodeCat) ? nodeCat : 'data-structures';

      results.push({
        id,
        name: (props['name'] as string) || id,
        category: validCategory,
        score: merged.score,
        snippet: merged.snippet,
        hasTs: codeTs.length > 0,
        hasPy: codePy.length > 0,
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 20);
  }

  /**
   * Retrieve full detail for a specific algorithm, including its related
   * algorithms (1-hop RELATED_ALGO traversal).
   */
  async getAlgoDetail(name: string): Promise<AlgoDetailResult | null> {
    // Find node by name search
    const hits = await this.graph.search(name, 5);
    const algoHit = hits.find((h: SearchResult) => h.label === 'AlgoNode');
    if (!algoHit) return null;

    const node = await this.graph.getNode(algoHit.id);
    if (!node) return null;

    // Reconstruct AlgoNodeData from stored props
    const props = node.props;
    const tagsStr = (props['tags'] as string) || '';
    const algo: AlgoNodeData = {
      id: algoHit.id,
      name: (props['name'] as string) || '',
      category: validateCategory((props['category'] as string) || ''),
      complexity_time: (props['complexity_time'] as string) || 'unknown',
      complexity_space: (props['complexity_space'] as string) || 'unknown',
      description: (props['description'] as string) || '',
      source_url: (props['source_url'] as string) || '',
      code_ts: (props['code_ts'] as string) || '',
      code_py: (props['code_py'] as string) || '',
      tags: tagsStr.split(',').filter(Boolean),
      last_crawled: (props['last_crawled'] as string) || '',
    };

    // Traverse 1-hop RELATED_ALGO edges
    const subgraph = await this.graph.traverse(algoHit.id, 1, ['RELATED_ALGO']);
    const related: AlgoDetailResult['related'] = [];

    for (const relNode of subgraph.nodes) {
      if (relNode.id === algoHit.id) continue;
      const relProps = relNode.props;
      const edge = subgraph.edges.find(
        (e: SubGraph['edges'][number]) =>
          (e.from === algoHit.id && e.to === relNode.id) ||
          (e.to === algoHit.id && e.from === relNode.id),
      );

      related.push({
        id: relNode.id,
        name: (relProps['name'] as string) || relNode.id,
        category: validateCategory((relProps['category'] as string) || ''),
        edgeType: 'RELATED_ALGO',
        strength: (edge?.props['strength'] as 'weak' | 'strong') || 'weak',
      });
    }

    return { algo, related };
  }
}

// ── Helpers ──

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function isValidCategory(value: string): value is AlgoCategory {
  return (ALGO_CATEGORIES as readonly string[]).includes(value);
}

function validateCategory(value: string): AlgoCategory {
  return isValidCategory(value) ? value : 'data-structures';
}
