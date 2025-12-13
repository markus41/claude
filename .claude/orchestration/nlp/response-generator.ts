/**
 * Response Generation System
 * Generates natural language responses for user interactions
 */

import type {
  NLPResponse,
  ResponseType,
  ResponseTemplate,
  GeneratedWorkflow,
  GeneratedAction,
  Intent,
} from './types.js';

export class ResponseGenerator {
  private templates: Map<string, ResponseTemplate[]> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Generate confirmation response
   */
  generateConfirmation(workflow: GeneratedWorkflow, actions: GeneratedAction[]): NLPResponse {
    const params = this.workflowParametersToString(workflow);
    const actionsList = actions.map((a, i) => `${i + 1}. ${a.description}`).join('\n');

    const text = `I'll ${workflow.name.replace(/-/g, ' ')} with the following steps:\n\n${actionsList}\n\nParameters:\n${params}\n\nConfidence: ${workflow.confidence}%\n\nShould I proceed?`;

    return {
      text,
      type: 'confirmation',
      workflow,
      actions,
    };
  }

  /**
   * Generate clarification request
   */
  generateClarification(
    intent: Intent,
    missingSlots: string[],
    suggestions?: string[]
  ): NLPResponse {
    const reason = `I need more information to ${intent.name.replace(/-/g, ' ')}.`;
    const missing = missingSlots.length > 0
      ? `\n\nMissing: ${missingSlots.join(', ')}`
      : '';

    const suggestedQuestions = missingSlots.map((slot) => {
      switch (slot) {
        case 'environment':
          return 'Which environment? (development, staging, production)';
        case 'service':
          return 'Which service?';
        case 'version':
          return 'Which version?';
        default:
          return `What ${slot}?`;
      }
    });

    const text = `${reason}${missing}`;

    return {
      text,
      type: 'clarification',
      clarificationNeeded: {
        reason,
        missingSlots,
        options: suggestions,
        suggestedQuestions,
      },
      suggestions,
    };
  }

  /**
   * Generate error response
   */
  generateError(error: string, suggestions?: string[]): NLPResponse {
    return {
      text: `Error: ${error}`,
      type: 'error',
      suggestions,
    };
  }

  /**
   * Generate success response
   */
  generateSuccess(workflow: GeneratedWorkflow, message?: string): NLPResponse {
    const defaultMessage = `Successfully completed ${workflow.name.replace(/-/g, ' ')}.`;

    return {
      text: message || defaultMessage,
      type: 'success',
      workflow,
    };
  }

  /**
   * Generate information response
   */
  generateInformation(intent: Intent, data: any): NLPResponse {
    let text = '';

    switch (intent.name) {
      case 'check_status':
        text = this.formatStatusInfo(data);
        break;

      case 'list_resources':
        text = this.formatResourceList(data);
        break;

      case 'get_help':
        text = this.formatHelpInfo(data);
        break;

      default:
        text = JSON.stringify(data, null, 2);
    }

    return {
      text,
      type: 'information',
      metadata: data,
    };
  }

  /**
   * Generate suggestion response
   */
  generateSuggestion(suggestions: string[], context?: string): NLPResponse {
    const text = context
      ? `${context}\n\nSuggestions:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : `Here are some suggestions:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;

    return {
      text,
      type: 'suggestion',
      suggestions,
    };
  }

  /**
   * Format workflow parameters as string
   */
  private workflowParametersToString(workflow: GeneratedWorkflow): string {
    return workflow.parameters
      .map((p) => {
        const confidence = p.inferred ? ` (inferred, ${p.confidence}%)` : '';
        return `- ${p.name}: ${p.value}${confidence}`;
      })
      .join('\n');
  }

  /**
   * Format status information
   */
  private formatStatusInfo(data: any): string {
    if (typeof data === 'string') return data;

    const lines: string[] = ['Status Information:'];

    if (data.service) lines.push(`Service: ${data.service}`);
    if (data.environment) lines.push(`Environment: ${data.environment}`);
    if (data.status) lines.push(`Status: ${data.status}`);
    if (data.health) lines.push(`Health: ${data.health}`);
    if (data.uptime) lines.push(`Uptime: ${data.uptime}`);

    return lines.join('\n');
  }

  /**
   * Format resource list
   */
  private formatResourceList(data: any): string {
    if (Array.isArray(data)) {
      return `Found ${data.length} resource(s):\n${data.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
    }

    if (typeof data === 'object') {
      const lines: string[] = ['Resources:'];
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          lines.push(`\n${key}: ${value.length} item(s)`);
          lines.push(...value.map((v, i) => `  ${i + 1}. ${v}`));
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
      return lines.join('\n');
    }

    return String(data);
  }

  /**
   * Format help information
   */
  private formatHelpInfo(data: any): string {
    const lines: string[] = [
      'Available Commands:',
      '',
      'Deployment:',
      '  - Deploy to <environment>',
      '  - Rollback deployment',
      '',
      'Build & Test:',
      '  - Build the project',
      '  - Run tests',
      '  - Run <test-type> tests',
      '',
      'Code Review:',
      '  - Review the code',
      '  - Review <file>',
      '',
      'Resources:',
      '  - Create <resource>',
      '  - Update <resource>',
      '  - Delete <resource>',
      '',
      'Information:',
      '  - Check status',
      '  - List resources',
      '',
      'Debug:',
      '  - Debug the issue',
      '  - Monitor logs',
    ];

    return lines.join('\n');
  }

  /**
   * Add custom template
   */
  addTemplate(template: ResponseTemplate): void {
    const key = template.intent || template.type;
    if (!this.templates.has(key)) {
      this.templates.set(key, []);
    }
    this.templates.get(key)!.push(template);
  }

  /**
   * Get template
   */
  getTemplate(type: ResponseType, intent?: string): ResponseTemplate | null {
    const key = intent || type;
    const templates = this.templates.get(key);
    if (!templates || templates.length === 0) return null;

    // Return random template for variety
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Apply template
   */
  applyTemplate(template: ResponseTemplate, variables: Record<string, any>): string {
    let text = template.template;

    for (const [key, value] of Object.entries(variables)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }

    return text;
  }

  /**
   * Load default templates
   */
  private loadDefaultTemplates(): void {
    // Confirmation templates
    this.addTemplate({
      type: 'confirmation',
      template: 'Ready to {action}. Proceed?',
      requiredVariables: ['action'],
      examples: ['Ready to deploy to production. Proceed?'],
    });

    // Clarification templates
    this.addTemplate({
      type: 'clarification',
      template: 'I need to know {missing} to continue.',
      requiredVariables: ['missing'],
      examples: ['I need to know the environment to continue.'],
    });

    // Error templates
    this.addTemplate({
      type: 'error',
      template: 'Sorry, {error}. {suggestion}',
      requiredVariables: ['error'],
      examples: ['Sorry, I could not find that resource. Try listing all resources first.'],
    });

    // Success templates
    this.addTemplate({
      type: 'success',
      template: 'Successfully {action}.',
      requiredVariables: ['action'],
      examples: ['Successfully deployed to production.'],
    });
  }
}

/**
 * Generate conversational responses
 */
export class ConversationalResponses {
  /**
   * Generate acknowledgment
   */
  static acknowledge(intent: Intent): string {
    const actions = {
      deploy_application: 'Got it, deploying',
      build_project: 'Starting build',
      run_tests: 'Running tests',
      check_status: 'Checking status',
      create_resource: 'Creating resource',
      update_resource: 'Updating resource',
      delete_resource: 'Deleting resource',
    } as const;

    return actions[intent.name as keyof typeof actions] || 'Working on it';
  }

  /**
   * Generate thinking message
   */
  static thinking(): string {
    const messages = [
      'Let me check...',
      'One moment...',
      'Processing...',
      'Looking into that...',
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Generate completion message
   */
  static completed(intent: Intent): string {
    const messages = {
      deploy_application: 'Deployment complete',
      build_project: 'Build finished',
      run_tests: 'Tests completed',
      create_resource: 'Resource created',
      update_resource: 'Resource updated',
      delete_resource: 'Resource deleted',
    } as const;

    return messages[intent.name as keyof typeof messages] || 'Done';
  }

  /**
   * Generate retry message
   */
  static retry(attempts: number): string {
    if (attempts === 1) return 'Let me try that again...';
    if (attempts === 2) return 'Trying one more time...';
    return `Attempt ${attempts}...`;
  }

  /**
   * Generate timeout message
   */
  static timeout(): string {
    return 'This is taking longer than expected. Would you like to continue waiting?';
  }
}
