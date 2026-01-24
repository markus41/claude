/**
 * Workflow Template Importer
 * Loads JSON workflow templates into React Flow format
 */

import { Node, Edge } from 'reactflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
}

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    type: string;
    config?: Record<string, any>;
    description?: string;
  };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export class WorkflowImporter {
  /**
   * Load a workflow template from JSON file
   */
  static async loadTemplate(filePath: string): Promise<WorkflowTemplate> {
    try {
      const response = await fetch(filePath);
      const template = await response.json();
      return template as WorkflowTemplate;
    } catch (error) {
      console.error('Failed to load workflow template:', error);
      throw new Error(`Cannot load template from ${filePath}`);
    }
  }

  /**
   * Convert workflow template to React Flow format
   */
  static convertToReactFlow(template: WorkflowTemplate): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = template.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        ...node.data,
        // Add template-specific styling
        isTemplate: true,
        templateId: template.id,
        // Include configuration for node properties panel
        config: node.data.config || {},
        description: node.data.description || '',
      },
    }));

    const edges: Edge[] = template.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      // Add template-specific styling
      style: { stroke: '#3b82f6', strokeWidth: 2 },
      animated: edge.label === 'retry' || edge.label === 'quality-failed',
    }));

    return { nodes, edges };
  }

  /**
   * Get available workflow templates
   */
  static async getAvailableTemplates(): Promise<WorkflowTemplate[]> {
    const templates: WorkflowTemplate[] = [];

    try {
      // Load built-in templates
      const jiraDevTemplate = await this.loadTemplate('/src/workflows/jira-dev-workflow-template.json');
      templates.push(jiraDevTemplate);

      // Add more templates here as they're created

    } catch (error) {
      console.warn('Some templates failed to load:', error);
    }

    return templates;
  }

  /**
   * Validate template structure
   */
  static validateTemplate(template: any): boolean {
    const required = ['id', 'name', 'nodes', 'edges'];
    return required.every(field => field in template);
  }

  /**
   * Apply template variables to workflow
   */
  static applyVariables(
    template: WorkflowTemplate,
    variables: Record<string, any>
  ): WorkflowTemplate {
    const processedTemplate = JSON.parse(JSON.stringify(template));

    // Replace variables in node configurations
    processedTemplate.nodes.forEach((node: WorkflowNode) => {
      if (node.data.config) {
        node.data.config = this.replaceVariables(node.data.config, variables);
      }
      if (node.data.description) {
        node.data.description = this.replaceVariables(node.data.description, variables);
      }
    });

    return processedTemplate;
  }

  /**
   * Replace template variables with actual values
   */
  private static replaceVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === 'string') {
      return obj.replace(/\$\{([^}]+)\}/g, (match, key) => {
        return variables[key] || match;
      });
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.replaceVariables(item, variables));
    } else if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.replaceVariables(value, variables);
      }
      return result;
    }
    return obj;
  }

  /**
   * Export current workflow as template
   */
  static exportAsTemplate(
    nodes: Node[],
    edges: Edge[],
    metadata: { name: string; description: string; version?: string }
  ): WorkflowTemplate {
    const template: WorkflowTemplate = {
      id: `custom-${Date.now()}`,
      name: metadata.name,
      description: metadata.description,
      version: metadata.version || '1.0.0',
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type || 'default',
        position: node.position,
        data: {
          label: node.data.label || 'Untitled Node',
          type: node.data.type || 'default',
          config: node.data.config || {},
          description: node.data.description || '',
        },
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
      })),
    };

    return template;
  }
}

/**
 * Built-in template configurations for Jira integration
 */
export const JIRA_TEMPLATE_CONFIG = {
  jiraProject: 'DEMO',
  jiraBaseUrl: 'https://your-org.atlassian.net',
  localWorkspace: 'C:\\Users\\MarkusAhling\\pro\\alpha-0.1\\claude',
  gitDefaultBranch: 'main',
  testCoverageThreshold: 80,
  slackChannel: '#dev-updates',
};

export default WorkflowImporter;