import pino from 'pino';

const logger = pino({ name: 'mcp:prompts' });

export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
  handler: (args: Record<string, string>) => Promise<{ role: string; content: string }[]>;
}

export function createPrompts(): PromptDefinition[] {
  return [
    {
      name: 'scrapin_find_symbol',
      description: 'Find documentation for a specific API symbol across all indexed sources',
      arguments: [
        { name: 'symbol', description: 'The symbol name to search for', required: true },
        { name: 'package', description: 'Optional package name to scope the search', required: false },
      ],
      handler: async (args) => {
        logger.info({ symbol: args['symbol'] }, 'Prompt: scrapin_find_symbol');
        return [{
          role: 'user',
          content: `Search for documentation about the symbol "${args['symbol']}"${args['package'] ? ` from package "${args['package']}"` : ''}. Use scrapin_search first, then scrapin_graph_query with include_siblings: true to get the full context. If the symbol is not found, suggest running scrapin_crawl_source for the relevant documentation source.`,
        }];
      },
    },

    {
      name: 'scrapin_check_drift',
      description: 'Run a comprehensive drift check across code and agents',
      arguments: [],
      handler: async () => {
        logger.info('Prompt: scrapin_check_drift');
        return [{
          role: 'user',
          content: `Run a comprehensive drift check:
1. Call scrapin_code_drift_scan to check for codebase API drift
2. Call scrapin_agent_drift_status to check for agent prompt drift
3. Summarize findings with severity levels
4. For any drift score > 5, show detailed information using scrapin_agent_drift_detail
5. Recommend specific actions to resolve any detected drift`,
        }];
      },
    },

    {
      name: 'scrapin_find_algorithm',
      description: 'Find the best algorithm or pattern for a given problem',
      arguments: [
        { name: 'problem', description: 'Description of the problem to solve', required: true },
        { name: 'constraints', description: 'Any constraints (time/space complexity, language)', required: false },
      ],
      handler: async (args) => {
        logger.info({ problem: args['problem'] }, 'Prompt: scrapin_find_algorithm');
        return [{
          role: 'user',
          content: `Find the best algorithm for: "${args['problem']}"${args['constraints'] ? `. Constraints: ${args['constraints']}` : ''}.

Use scrapin_algo_search to find matching algorithms. For the top results, use scrapin_algo_detail to get full code examples and complexity analysis. Compare options and recommend the best fit with rationale.`,
        }];
      },
    },

    {
      name: 'scrapin_setup_interview',
      description: 'Start a comprehensive interactive interview to understand project requirements before generating configuration',
      arguments: [
        { name: 'project_type', description: 'Optional hint about project type', required: false },
      ],
      handler: async (args) => {
        logger.info({ projectType: args['project_type'] }, 'Prompt: scrapin_setup_interview');
        return [{
          role: 'user',
          content: `Start a comprehensive, interactive project interview. This is NOT a quick setup — it's a thorough discovery process.

RULES:
- Ask ONE question at a time and wait for the answer before proceeding
- NEVER use dates or timelines unless the user specifically asks
- Generate follow-up questions based on each answer — adapt dynamically
- Cover ALL of these areas through natural conversation:
  1. Project identity (name, purpose, who it's for, what problem it solves)
  2. Tech stack (languages, frameworks, databases, infrastructure)
  3. Architecture (monolith/microservices, API style, data flow)
  4. Team & workflow (team size, branching strategy, review process)
  5. Testing philosophy (unit/integration/e2e preferences, coverage goals)
  6. Security & compliance (auth model, data sensitivity, regulatory needs)
  7. Deployment (environments, CI/CD, cloud provider, containers)
  8. Domain concepts (key entities, business rules, invariants)
  9. Code conventions (naming, file organization, logging, error handling)
  10. Pain points (what's hard now, what breaks often, what's undocumented)
  11. Goals (what would "great" look like for tooling, what to prioritize)

Start with a warm, open-ended question about the project. Be curious and thorough.
${args['project_type'] ? `The user hinted this is a "${args['project_type']}" project — use that as a starting point.` : ''}`,
        }];
      },
    },
  ];
}
