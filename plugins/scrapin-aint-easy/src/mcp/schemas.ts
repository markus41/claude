import { z } from 'zod';

export const PaginationInput = z.object({
  cursor: z.string().optional().describe('Opaque cursor from a previous paginated response'),
  page_size: z.number().int().min(1).max(100).default(10).describe('Rows to return per page'),
});

export const SearchInput = z.object({
  query: z.string().describe('Natural language or symbol name to search for'),
  limit: z.coerce.number().min(1).max(50).default(10),
  label_filter: z.enum(['Source', 'Page', 'Symbol', 'Module', 'Example', 'AlgoNode', 'Pattern', 'AgentDef']).optional(),
}).merge(PaginationInput);

export const GraphQueryInput = z.object({
  start_id: z.string().describe('Node ID to start traversal from'),
  hops: z.coerce.number().min(1).max(5).default(2),
  edge_types: z.array(z.string()).optional(),
  include_siblings: z.coerce.boolean().default(false),
}).merge(PaginationInput);

export const AlgoSearchInput = z.object({
  query: z.string().describe('Algorithm name or description'),
  category: z.string().optional(),
  language: z.enum(['ts', 'py']).optional(),
  limit: z.coerce.number().min(1).max(20).default(5),
}).merge(PaginationInput);

export const AlgoDetailInput = z.object({
  name: z.string().describe('Exact algorithm name'),
});

export const CronStatusInput = PaginationInput;

export const CrawlSourceInput = z.object({
  source_key: z.string().describe('Source key from sources.yaml'),
  force: z.coerce.boolean().default(false),
});

export const DiffInput = z.object({
  source_key: z.string(),
  page_id: z.string().optional(),
}).merge(PaginationInput);

export const LspHoverInput = z.object({
  symbol: z.string(),
  package_hint: z.string().optional(),
});

export const AddSourceInput = z.object({
  key: z.string(),
  name: z.string(),
  base_url: z.string().url(),
  sitemap: z.string().optional(),
  package_aliases: z.array(z.string()).default([]),
  concurrency: z.coerce.number().default(5),
  rps: z.coerce.number().default(2),
});

export const AddAlgoSourceInput = z.object({
  key: z.string(),
  url: z.string(),
  type: z.enum(['github_repo', 'sitemap_crawl', 'single_page']),
  paths: z.array(z.string()).optional(),
});

export const CodeDriftScanInput = z.object({
  project_root: z.string().optional(),
});

export const AgentDriftStatusInput = z.object({}).merge(PaginationInput);

export const AgentDriftDetailInput = z.object({
  agent_id: z.string(),
});

export const AgentDriftAckInput = z.object({
  agent_id: z.string(),
  notes: z.string().optional(),
});

export const AgentDriftDiffInput = z.object({
  agent_id: z.string(),
});

export const GraphStatsInput = z.object({});

export const CrawlFailuresInput = z.object({
  source_key: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const SourceHealthInput = z.object({});

export const CodexBootstrapInput = z.object({
  project_root: z.string().optional(),
  write_agents_file: z.coerce.boolean().default(false),
});
