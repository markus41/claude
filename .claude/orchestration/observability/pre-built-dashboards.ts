/**
 * Pre-Built Dashboards
 *
 * Establishes default dashboard templates for system overview, agent performance,
 * and cost tracking to streamline initial setup and improve operational visibility.
 */

import { Dashboard, DashboardPanel } from './types.js';

/**
 * System Overview Dashboard
 * Provides comprehensive view of system health, load, and errors
 */
export const systemOverviewDashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'System Overview',
  description: 'Comprehensive system health, load, and error metrics',
  tags: ['system', 'health', 'overview'],
  refreshInterval: 30,
  timeRange: { type: 'relative', value: '1h' },
  isDefault: true,
  isPublic: true,
  panels: [
    // System Health
    {
      title: 'System Health Status',
      type: 'stat',
      query: {
        metrics: ['system_health'],
        timeRange: { type: 'relative', value: '5m' },
        granularity: 'minute',
        aggregations: ['avg'],
      },
      visualization: {
        unit: 'percent',
        decimals: 1,
        thresholds: [
          { value: 0, color: 'red', label: 'Critical' },
          { value: 70, color: 'yellow', label: 'Warning' },
          { value: 90, color: 'green', label: 'Healthy' },
        ],
      },
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
    // Total Requests
    {
      title: 'Request Rate',
      type: 'timeseries',
      query: {
        metrics: ['request_total'],
        timeRange: { type: 'relative', value: '1h' },
        granularity: 'minute',
        aggregations: ['sum'],
      },
      visualization: {
        unit: 'req/s',
        colors: ['#1f77b4'],
        legend: { show: true, position: 'bottom' },
      },
      position: { x: 6, y: 0, w: 9, h: 4 },
    },
    // Error Rate
    {
      title: 'Error Rate',
      type: 'timeseries',
      query: {
        metrics: ['error_total'],
        timeRange: { type: 'relative', value: '1h' },
        granularity: 'minute',
        aggregations: ['sum'],
      },
      visualization: {
        unit: 'errors/min',
        colors: ['#d62728'],
        thresholds: [
          { value: 0, color: 'green' },
          { value: 10, color: 'yellow' },
          { value: 50, color: 'red' },
        ],
      },
      position: { x: 15, y: 0, w: 9, h: 4 },
    },
    // Response Time
    {
      title: 'Response Time (P95)',
      type: 'timeseries',
      query: {
        metrics: ['response_time_seconds'],
        timeRange: { type: 'relative', value: '1h' },
        granularity: 'minute',
        aggregations: ['p95'],
      },
      visualization: {
        unit: 'ms',
        decimals: 2,
        colors: ['#2ca02c'],
      },
      position: { x: 0, y: 4, w: 12, h: 6 },
    },
    // CPU Usage
    {
      title: 'CPU Usage',
      type: 'gauge',
      query: {
        metrics: ['cpu_usage_percent'],
        timeRange: { type: 'relative', value: '5m' },
        granularity: 'minute',
        aggregations: ['avg'],
      },
      visualization: {
        unit: 'percent',
        decimals: 1,
        thresholds: [
          { value: 0, color: 'green' },
          { value: 70, color: 'yellow' },
          { value: 90, color: 'red' },
        ],
      },
      position: { x: 12, y: 4, w: 6, h: 6 },
    },
    // Memory Usage
    {
      title: 'Memory Usage',
      type: 'gauge',
      query: {
        metrics: ['memory_usage_percent'],
        timeRange: { type: 'relative', value: '5m' },
        granularity: 'minute',
        aggregations: ['avg'],
      },
      visualization: {
        unit: 'percent',
        decimals: 1,
        thresholds: [
          { value: 0, color: 'green' },
          { value: 80, color: 'yellow' },
          { value: 95, color: 'red' },
        ],
      },
      position: { x: 18, y: 4, w: 6, h: 6 },
    },
  ],
};

/**
 * Agent Performance Dashboard
 * Tracks agent execution metrics, success rates, and token usage
 */
export const agentPerformanceDashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Agent Performance',
  description: 'Agent execution metrics, success rates, duration, and token usage',
  tags: ['agents', 'performance', 'monitoring'],
  refreshInterval: 60,
  timeRange: { type: 'relative', value: '24h' },
  isDefault: false,
  isPublic: true,
  panels: [
    // Agent Success Rate
    {
      title: 'Agent Success Rate',
      type: 'stat',
      query: {
        metrics: ['agent_success_rate'],
        timeRange: { type: 'relative', value: '24h' },
        granularity: 'hour',
        aggregations: ['avg'],
      },
      visualization: {
        unit: 'percent',
        decimals: 2,
        thresholds: [
          { value: 0, color: 'red' },
          { value: 90, color: 'yellow' },
          { value: 98, color: 'green' },
        ],
      },
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
    // Agent Executions
    {
      title: 'Agent Executions',
      type: 'timeseries',
      query: {
        metrics: ['agent_execution_total'],
        dimensions: ['agent_type'],
        timeRange: { type: 'relative', value: '24h' },
        granularity: 'hour',
        aggregations: ['sum'],
      },
      visualization: {
        unit: 'executions',
        legend: { show: true, position: 'right' },
      },
      position: { x: 6, y: 0, w: 18, h: 4 },
    },
    // Execution Duration
    {
      title: 'Agent Execution Duration (P90)',
      type: 'timeseries',
      query: {
        metrics: ['agent_execution_duration_seconds'],
        dimensions: ['agent_type'],
        timeRange: { type: 'relative', value: '24h' },
        granularity: 'hour',
        aggregations: ['p90'],
      },
      visualization: {
        unit: 's',
        decimals: 2,
        legend: { show: true, position: 'bottom' },
      },
      position: { x: 0, y: 4, w: 12, h: 6 },
    },
    // Tokens Used
    {
      title: 'Token Usage by Agent',
      type: 'bar',
      query: {
        metrics: ['agent_tokens_used'],
        dimensions: ['agent_type'],
        timeRange: { type: 'relative', value: '24h' },
        granularity: 'day',
        aggregations: ['sum'],
        orderBy: [{ field: 'agent_tokens_used_sum', direction: 'desc' }],
        limit: 10,
      },
      visualization: {
        unit: 'tokens',
        legend: { show: false },
      },
      position: { x: 12, y: 4, w: 12, h: 6 },
    },
    // Error Rate by Agent
    {
      title: 'Agent Error Rate',
      type: 'heatmap',
      query: {
        metrics: ['agent_error_rate'],
        dimensions: ['agent_type'],
        timeRange: { type: 'relative', value: '24h' },
        granularity: 'hour',
        aggregations: ['avg'],
      },
      visualization: {
        unit: 'percent',
        decimals: 1,
        thresholds: [
          { value: 0, color: '#00FF00' },
          { value: 5, color: '#FFFF00' },
          { value: 10, color: '#FF0000' },
        ],
      },
      position: { x: 0, y: 10, w: 24, h: 6 },
    },
  ],
};

/**
 * Cost Tracking Dashboard
 * Monitors LLM API costs, token usage, and budget tracking
 */
export const costTrackingDashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Cost Tracking',
  description: 'LLM API costs, token usage, and budget monitoring',
  tags: ['cost', 'budget', 'finops'],
  refreshInterval: 300,
  timeRange: { type: 'relative', value: '30d' },
  isDefault: false,
  isPublic: false,
  panels: [
    // Total Cost Today
    {
      title: 'Today\'s Total Cost',
      type: 'stat',
      query: {
        metrics: ['llm_cost_usd'],
        timeRange: { type: 'relative', value: '1d' },
        granularity: 'day',
        aggregations: ['sum'],
      },
      visualization: {
        unit: 'currencyUSD',
        decimals: 2,
        colors: ['#1f77b4'],
      },
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
    // Monthly Cost
    {
      title: 'Monthly Cost',
      type: 'stat',
      query: {
        metrics: ['llm_cost_usd'],
        timeRange: { type: 'relative', value: '30d' },
        granularity: 'month',
        aggregations: ['sum'],
      },
      visualization: {
        unit: 'currencyUSD',
        decimals: 2,
        colors: ['#2ca02c'],
        thresholds: [
          { value: 0, color: 'green' },
          { value: 8000, color: 'yellow', label: '80% Budget' },
          { value: 10000, color: 'red', label: 'Over Budget' },
        ],
      },
      position: { x: 6, y: 0, w: 6, h: 4 },
    },
    // Cost Trend
    {
      title: 'Daily Cost Trend',
      type: 'timeseries',
      query: {
        metrics: ['llm_cost_usd'],
        timeRange: { type: 'relative', value: '30d' },
        granularity: 'day',
        aggregations: ['sum'],
      },
      visualization: {
        unit: 'currencyUSD',
        decimals: 2,
        colors: ['#ff7f0e'],
      },
      position: { x: 12, y: 0, w: 12, h: 4 },
    },
    // Cost by Model
    {
      title: 'Cost by Model',
      type: 'pie',
      query: {
        metrics: ['llm_cost_usd'],
        dimensions: ['model'],
        timeRange: { type: 'relative', value: '30d' },
        granularity: 'month',
        aggregations: ['sum'],
      },
      visualization: {
        unit: 'currencyUSD',
        decimals: 2,
        legend: { show: true, position: 'right' },
      },
      position: { x: 0, y: 4, w: 8, h: 6 },
    },
    // Token Usage by Model
    {
      title: 'Token Usage by Model',
      type: 'bar',
      query: {
        metrics: ['llm_tokens_total'],
        dimensions: ['model'],
        timeRange: { type: 'relative', value: '30d' },
        granularity: 'month',
        aggregations: ['sum'],
        orderBy: [{ field: 'llm_tokens_total_sum', direction: 'desc' }],
      },
      visualization: {
        unit: 'tokens',
        legend: { show: false },
      },
      position: { x: 8, y: 4, w: 8, h: 6 },
    },
    // Top Cost Agents
    {
      title: 'Top 10 Agents by Cost',
      type: 'table',
      query: {
        metrics: ['llm_cost_usd'],
        dimensions: ['agent_name'],
        timeRange: { type: 'relative', value: '30d' },
        granularity: 'month',
        aggregations: ['sum'],
        orderBy: [{ field: 'llm_cost_usd_sum', direction: 'desc' }],
        limit: 10,
      },
      visualization: {
        unit: 'currencyUSD',
        decimals: 2,
      },
      position: { x: 16, y: 4, w: 8, h: 6 },
    },
  ],
};

/**
 * Get all pre-built dashboards
 */
export function getPreBuiltDashboards(): Array<Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>> {
  return [
    systemOverviewDashboard,
    agentPerformanceDashboard,
    costTrackingDashboard,
  ];
}
