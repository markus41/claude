export interface ScrapinConfig {
  dataDir: string;
  configDir: string;
  logLevel: string;
  mcp: {
    enabled: boolean;
    transport: 'stdio';
  };
  lsp: {
    enabled: boolean;
    port: number;
    transport: 'stdio' | 'tcp';
  };
  cron: {
    enabled: boolean;
    maxConcurrentJobs: number;
  };
  crawl: {
    defaultConcurrency: number;
    defaultRps: number;
    defaultRetryAttempts: number;
    defaultBackoff: 'exponential' | 'linear';
    maxResponseTokens: number;
  };
  graph: {
    backend: 'kuzu' | 'neo4j';
    neo4jUri?: string;
    neo4jUser?: string;
    neo4jPassword?: string;
  };
  interview: {
    enabled: boolean;
    minQuestions: number;
    adaptiveFollowups: boolean;
    noDatesUnlessAsked: boolean;
  };
}

export const DEFAULT_CONFIG: ScrapinConfig = {
  dataDir: 'data',
  configDir: 'config',
  logLevel: 'info',
  mcp: {
    enabled: true,
    transport: 'stdio',
  },
  lsp: {
    enabled: false,
    port: 7070,
    transport: 'stdio',
  },
  cron: {
    enabled: true,
    maxConcurrentJobs: 3,
  },
  crawl: {
    defaultConcurrency: 5,
    defaultRps: 2,
    defaultRetryAttempts: 3,
    defaultBackoff: 'exponential',
    maxResponseTokens: 4096,
  },
  graph: {
    backend: 'kuzu',
  },
  interview: {
    enabled: true,
    minQuestions: 15,
    adaptiveFollowups: true,
    noDatesUnlessAsked: true,
  },
};
