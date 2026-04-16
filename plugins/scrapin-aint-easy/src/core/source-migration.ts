import pino from 'pino';
import { type EdgeType, type GraphAdapter, type NodeLabel } from './graph.js';
import { toSourceId } from './ids.js';

const logger = pino({ name: 'source-migration' });

const SOURCE_AWARE_LABELS: NodeLabel[] = ['Page', 'Symbol', 'Module', 'Example'];

function mergeProps(
  canonicalProps: Record<string, unknown> | undefined,
  legacyProps: Record<string, unknown>,
  canonicalId: string,
): Record<string, unknown> {
  return {
    ...legacyProps,
    ...canonicalProps,
    id: canonicalId,
  };
}

export async function migrateLegacySourceIds(graph: GraphAdapter): Promise<void> {
  const sources = await graph.getNodesByLabel('Source');
  const legacySources = sources.filter((node) => !node.id.startsWith('source::'));

  if (legacySources.length === 0) {
    return;
  }

  const sourceMap = new Map(sources.map((node) => [node.id, node.props]));
  const rewrittenSources = new Set<string>();

  for (const legacy of legacySources) {
    const canonicalId = toSourceId(legacy.id);
    const canonicalProps = sourceMap.get(canonicalId);

    await graph.upsertNode('Source', mergeProps(canonicalProps, legacy.props, canonicalId));
    rewrittenSources.add(canonicalId);
  }

  for (const label of SOURCE_AWARE_LABELS) {
    const nodes = await graph.getNodesByLabel(label);
    for (const node of nodes) {
      const sourceId = node.props['source_id'];
      if (typeof sourceId !== 'string' || sourceId.length === 0) continue;
      const canonicalSourceId = toSourceId(sourceId);
      if (canonicalSourceId === sourceId) continue;

      await graph.upsertNode(label, {
        ...node.props,
        id: node.id,
        source_id: canonicalSourceId,
      });
      rewrittenSources.add(canonicalSourceId);
    }
  }

  const edges = await graph.getEdges();
  for (const edge of edges) {
    const canonicalTo = edge.type === 'PART_OF' ? toSourceId(edge.to) : edge.to;
    if (canonicalTo === edge.to) continue;

    await graph.upsertEdge(edge.type, edge.from, canonicalTo, edge.props);
    await graph.deleteEdge(edge.type as EdgeType, edge.from, edge.to);
    rewrittenSources.add(canonicalTo);
  }

  for (const legacy of legacySources) {
    await graph.deleteNode(legacy.id);
  }

  logger.info({ rewrittenSourceCount: rewrittenSources.size }, 'Legacy source ID migration complete');
}
