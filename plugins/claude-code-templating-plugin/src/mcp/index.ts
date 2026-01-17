/**
 * MCP (Model Context Protocol) Client Module
 *
 * Exports the MCP Client Manager for orchestrating connections to multiple
 * MCP servers and executing tools, reading resources, and retrieving prompts.
 */

export { MCPClientManager, createMCPClientManager } from './client-manager.js';
export type * from '../types/mcp.js';
