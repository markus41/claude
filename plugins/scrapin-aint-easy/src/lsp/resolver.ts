import pino from 'pino';
import { type GraphAdapter, type SymbolNode, type SearchResult } from '../core/graph.js';
import { type VectorStore, type VectorSearchResult } from '../core/vector.js';

const logger = pino({ name: 'lsp-resolver' });

export interface ResolvedSymbol {
  id: string;
  name: string;
  kind: string;
  description: string;
  signature: string;
  deprecated: boolean;
  sourceId: string;
  pageId: string;
  canonicalUrl: string;
  siblings: string[];
}

interface SourceConfig {
  base_url?: string;
  label?: string;
  [key: string]: unknown;
}

export class SymbolResolver {
  private readonly graph: GraphAdapter;
  private readonly vector: VectorStore;
  private readonly sources: Record<string, SourceConfig>;

  constructor(
    graph: GraphAdapter,
    vector: VectorStore,
    sources: Record<string, SourceConfig>,
  ) {
    this.graph = graph;
    this.vector = vector;
    this.sources = sources;
  }

  async resolve(word: string, packageHint?: string): Promise<ResolvedSymbol | null> {
    // Try exact graph search first
    const exactResult = await this.tryExactMatch(word, packageHint);
    if (exactResult) return exactResult;

    // Fall back to vector similarity search
    const vectorResult = await this.tryVectorSearch(word, packageHint);
    if (vectorResult) return vectorResult;

    logger.debug({ word, packageHint }, 'Symbol not resolved');
    return null;
  }

  async resolveFromImports(
    word: string,
    imports: string[],
  ): Promise<ResolvedSymbol | null> {
    // Try each import package as a hint, prioritizing exact matches
    for (const pkg of imports) {
      const result = await this.tryExactMatch(word, pkg);
      if (result) return result;
    }

    // Try vector search scoped to each import package
    for (const pkg of imports) {
      const result = await this.tryVectorSearch(word, pkg);
      if (result) return result;
    }

    // Last resort: unscoped resolution
    return this.resolve(word);
  }

  formatAsMarkdown(resolved: ResolvedSymbol): string {
    const lines: string[] = [];

    const deprecatedBadge = resolved.deprecated ? ' **(deprecated)**' : '';
    lines.push(`### ${resolved.name}${deprecatedBadge}`);
    lines.push('');

    if (resolved.signature) {
      lines.push('```typescript');
      lines.push(resolved.signature);
      lines.push('```');
      lines.push('');
    }

    if (resolved.description) {
      lines.push(resolved.description);
      lines.push('');
    }

    if (resolved.kind) {
      lines.push(`**Kind:** ${resolved.kind}`);
      lines.push('');
    }

    if (resolved.canonicalUrl) {
      lines.push(`[Documentation](${resolved.canonicalUrl})`);
      lines.push('');
    }

    if (resolved.siblings.length > 0) {
      const siblingList = resolved.siblings.slice(0, 5).join(', ');
      const suffix = resolved.siblings.length > 5 ? ', ...' : '';
      lines.push(`**See also:** ${siblingList}${suffix}`);
    }

    return lines.join('\n');
  }

  private async tryExactMatch(
    word: string,
    packageHint?: string,
  ): Promise<ResolvedSymbol | null> {
    const results = await this.graph.search(word, 20);
    const filtered = this.filterByPackage(results, packageHint);

    // Find exact name match
    const exact = filtered.find(
      (r) => r.name.toLowerCase() === word.toLowerCase() && r.score >= 0.8,
    );
    if (!exact) return null;

    return this.buildResolvedSymbol(exact);
  }

  private async tryVectorSearch(
    word: string,
    packageHint?: string,
  ): Promise<ResolvedSymbol | null> {
    const labelFilter = packageHint ? undefined : 'Symbol';
    const vectorResults = await this.vector.search(word, 5, labelFilter);

    const matched = this.pickBestVectorMatch(vectorResults, word, packageHint);
    if (!matched) return null;

    // Cross-reference with graph to get full symbol data
    const node = await this.graph.getNode(matched.id);
    if (!node) return null;

    return this.nodeToResolved(matched.id, node.props);
  }

  private filterByPackage(
    results: SearchResult[],
    packageHint?: string,
  ): SearchResult[] {
    if (!packageHint) return results;

    const hintLower = packageHint.toLowerCase();
    return results.filter((r) => {
      const id = r.id.toLowerCase();
      return id.includes(hintLower);
    });
  }

  private pickBestVectorMatch(
    results: VectorSearchResult[],
    word: string,
    packageHint?: string,
  ): VectorSearchResult | undefined {
    const wordLower = word.toLowerCase();
    const threshold = 0.3;

    const candidates = results.filter((r) => r.score >= threshold);

    if (packageHint) {
      const hintLower = packageHint.toLowerCase();
      const scoped = candidates.find(
        (r) => r.id.toLowerCase().includes(hintLower),
      );
      if (scoped) return scoped;
    }

    // Prefer results whose text contains the word
    const textMatch = candidates.find(
      (r) => r.text.toLowerCase().includes(wordLower),
    );
    if (textMatch) return textMatch;

    return candidates[0];
  }

  private async buildResolvedSymbol(
    result: SearchResult,
  ): Promise<ResolvedSymbol | null> {
    const node = await this.graph.getNode(result.id);
    if (!node) return null;

    return this.nodeToResolved(result.id, node.props);
  }

  private async nodeToResolved(
    id: string,
    props: Record<string, unknown>,
  ): Promise<ResolvedSymbol> {
    const sourceId = (props['source_id'] as string) ?? '';
    const pageId = (props['page_id'] as string) ?? '';
    const canonicalUrl = this.buildCanonicalUrl(sourceId, pageId);

    const siblings = await this.graph.siblings(id);
    const siblingNames = siblings.map((s) => s.name);

    return {
      id,
      name: (props['name'] as string) ?? id,
      kind: (props['kind'] as string) ?? 'unknown',
      description: (props['description'] as string) ?? '',
      signature: (props['signature'] as string) ?? '',
      deprecated: (props['deprecated'] as boolean) ?? false,
      sourceId,
      pageId,
      canonicalUrl,
      siblings: siblingNames,
    };
  }

  private buildCanonicalUrl(sourceId: string, pageId: string): string {
    const sourceConfig = this.sources[sourceId];
    if (!sourceConfig) return '';

    const baseUrl = sourceConfig['base_url'] as string | undefined;
    if (!baseUrl) return '';

    // pageId is typically a relative path or slug
    const separator = baseUrl.endsWith('/') ? '' : '/';
    return `${baseUrl}${separator}${pageId}`;
  }
}
