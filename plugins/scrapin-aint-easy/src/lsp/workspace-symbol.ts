import pino from 'pino';
import { type GraphAdapter, type SearchResult } from '../core/graph.js';

const logger = pino({ name: 'lsp-workspace-symbol' });

/**
 * LSP SymbolKind constants (subset used here).
 * See: https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#symbolKind
 */
const SymbolKind = {
  File: 1,
  Module: 2,
  Namespace: 3,
  Package: 4,
  Class: 5,
  Method: 6,
  Property: 7,
  Function: 12,
  Variable: 13,
  Constant: 14,
  Interface: 11,
  Enum: 10,
  Struct: 23,
  TypeParameter: 26,
} as const;

type SymbolKindValue = (typeof SymbolKind)[keyof typeof SymbolKind];

export interface WorkspaceSymbolResult {
  name: string;
  kind: SymbolKindValue;
  location: {
    uri: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
  };
  containerName: string;
}

interface WorkspaceSymbolParams {
  query: string;
}

const MAX_RESULTS = 50;

export async function handleWorkspaceSymbol(
  params: WorkspaceSymbolParams,
  graphAdapter: GraphAdapter,
): Promise<WorkspaceSymbolResult[]> {
  const { query } = params;

  if (!query || query.length < 2) {
    return [];
  }

  logger.debug({ query }, 'Workspace symbol search');

  const searchResults = await graphAdapter.search(query, MAX_RESULTS);

  return searchResults.map(resultToWorkspaceSymbol);
}

function resultToWorkspaceSymbol(result: SearchResult): WorkspaceSymbolResult {
  const kind = mapLabelToSymbolKind(result.label);
  const virtualUri = `scrapin://${encodeURIComponent(result.id)}`;

  return {
    name: result.name,
    kind,
    location: {
      uri: virtualUri,
      range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
      },
    },
    containerName: result.label,
  };
}

function mapLabelToSymbolKind(label: string): SymbolKindValue {
  switch (label) {
    case 'Symbol':
      return SymbolKind.Function;
    case 'Module':
      return SymbolKind.Module;
    case 'Source':
      return SymbolKind.Package;
    case 'Page':
      return SymbolKind.File;
    case 'AlgoNode':
      return SymbolKind.Class;
    case 'Pattern':
      return SymbolKind.Interface;
    case 'AgentDef':
      return SymbolKind.Namespace;
    case 'Example':
      return SymbolKind.Variable;
    default:
      return SymbolKind.Variable;
  }
}
