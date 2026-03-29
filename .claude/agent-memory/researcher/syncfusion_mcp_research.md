---
name: Syncfusion MCP Server Packages
description: Complete inventory of official Syncfusion MCP servers available on npm with installation and tool information
type: reference
---

# Syncfusion MCP Server Packages

**Date**: 2026-03-29
**Status**: Verified via npm registry and official Syncfusion documentation

## Framework-Specific MCP Servers

### React
- **Package**: `@syncfusion/react-assistant`
- **Installation**: `npx -y @syncfusion/react-assistant@latest`
- **Configuration**: Requires Syncfusion API key as environment variable
- **Tools**: Code generation, component documentation, troubleshooting for 145+ React components
- **Design Systems**: Tailwind3 CSS, Bootstrap 5.3, Material 3, Fluent 2
- **Transport**: stdio via npx

### Blazor
- **Package**: `@syncfusion/blazor-assistant`
- **Installation**: `npx -y @syncfusion/blazor-assistant@latest`
- **Configuration**: Requires Syncfusion API key as environment variable
- **Tools**: Code generation, component documentation, troubleshooting for Blazor components
- **Transport**: stdio via npx
- **Access**: Unlimited access to MCP server

### Vue
- **Package**: `@syncfusion/vue-assistant`
- **Version**: 2.0.0 (as of 2026-03-29)
- **Installation**: `npm install @syncfusion/vue-assistant` or `npx @syncfusion/vue-assistant@latest`
- **Tools**: AI-powered assistance for Vue development with Syncfusion components
- **Transport**: stdio via npx

### TypeScript
- **Package**: `@syncfusion/typescript-assistant` (inferred from documentation)
- **Documentation**: Available at https://ej2.syncfusion.com/documentation/mcp-server/overview

### .NET MAUI
- **Package**: `@syncfusion/maui-assistant`
- **Documentation**: Available at https://help.syncfusion.com/maui/ai-coding-assistant/mcp-server

## Utility MCP Servers

### MongoDB
- **Package**: `@syncfusion/mongodb-mcp-server`
- **Version**: 0.2.0 (as of 2026-03-29)
- **Installation**: `npm install @syncfusion/mongodb-mcp-server`
- **Purpose**: Model Context Protocol server for MongoDB connections

### Figma
- **Package**: `@syncfusion/figma-mcp-server`
- **Installation**: `npm install @syncfusion/figma-mcp-server`
- **Purpose**: Provides access to Figma files via MCP (works with Continue)

### Playwright
- **Package**: `@syncfusion/playwright-mcp-server`
- **Installation**: `npm install @syncfusion/playwright-mcp-server`
- **Purpose**: MCP server for Playwright integration

### Sequential Thinking
- **Package**: `@syncfusion/sequential-thinking-mcp-server`
- **Installation**: `npm install @syncfusion/sequential-thinking-mcp-server`
- **Purpose**: Provides tools for dynamic and reflective problem-solving through structured thinking

## Configuration Pattern for Claude Code

All Syncfusion MCP servers using stdio transport follow this pattern in `.mcp.json`:

```json
{
  "mcpServers": {
    "syncfusionReactAssistant": {
      "command": "npx",
      "args": ["-y", "@syncfusion/react-assistant@latest"],
      "env": {
        "SYNCFUSION_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Key Features

All Syncfusion component MCP servers provide:
- Intelligent code generation for Syncfusion components
- Detailed component documentation and usage examples
- Real-time troubleshooting assistance
- Context-aware suggestions for common integration challenges
- Integration with VS Code, Code Studio, JetBrains IDEs, and Claude

## Official Documentation

- **React MCP**: https://ej2.syncfusion.com/react/documentation/ai-coding-assistant/mcp-server
- **Blazor MCP**: https://blazor.syncfusion.com/documentation/ai-coding-assistant/mcp-server
- **Vue MCP**: npm package at https://www.npmjs.com/package/@syncfusion/vue-assistant
- **MongoDB MCP**: npm package at https://www.npmjs.com/package/@syncfusion/mongodb-mcp-server
- **Figma MCP**: npm package at https://www.npmjs.com/package/@syncfusion/figma-mcp-server

## Use Cases

- **React projects**: Use `@syncfusion/react-assistant` for building UIs with 145+ Syncfusion React components
- **Blazor projects**: Use `@syncfusion/blazor-assistant` for .NET/Blazor development
- **Vue projects**: Use `@syncfusion/vue-assistant` for Vue.js development
- **Data access**: Use `@syncfusion/mongodb-mcp-server` for MongoDB integration
- **Design workflows**: Use `@syncfusion/figma-mcp-server` for Figma file access in AI workflows
- **Testing**: Use `@syncfusion/playwright-mcp-server` for Playwright test automation
