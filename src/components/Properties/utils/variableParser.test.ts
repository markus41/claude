/**
 * Variable Expression Parser Tests
 *
 * Comprehensive test suite for variable parsing and validation.
 * Validates expression extraction, validation, and replacement.
 */

import { describe, it, expect } from 'vitest';
import {
  extractVariables,
  validateVariable,
  validateAllVariables,
  replaceVariables,
  getAvailableVariables,
  formatVariable,
  hasVariables,
  BUILT_IN_VARIABLES,
  type VariableContext,
} from './variableParser';
import type { VisualWorkflowNode } from '@/types/workflow';

describe('extractVariables', () => {
  it('should extract single variable', () => {
    const text = 'Process {{ task_node.output }}';
    const variables = extractVariables(text);

    expect(variables).toHaveLength(1);
    expect(variables[0].source).toBe('task_node');
    expect(variables[0].path).toBe('output');
    expect(variables[0].isBuiltIn).toBe(false);
  });

  it('should extract multiple variables', () => {
    const text = 'Use {{ workflow.id }} to process {{ task.output.data }}';
    const variables = extractVariables(text);

    expect(variables).toHaveLength(2);
    expect(variables[0].source).toBe('workflow');
    expect(variables[0].path).toBe('id');
    expect(variables[1].source).toBe('task');
    expect(variables[1].path).toBe('output.data');
  });

  it('should extract variables with filters', () => {
    const text = 'Count: {{ tasks | length }}';
    const variables = extractVariables(text);

    expect(variables).toHaveLength(1);
    expect(variables[0].source).toBe('tasks');
    expect(variables[0].filters).toEqual(['length']);
  });

  it('should extract variables with multiple filters', () => {
    const text = '{{ items | filter | sort | length }}';
    const variables = extractVariables(text);

    expect(variables).toHaveLength(1);
    expect(variables[0].filters).toEqual(['filter', 'sort', 'length']);
  });

  it('should handle variables with whitespace', () => {
    const text = '{{  workflow.id  }}';
    const variables = extractVariables(text);

    expect(variables).toHaveLength(1);
    expect(variables[0].source).toBe('workflow');
    expect(variables[0].path).toBe('id');
  });

  it('should return empty array for text without variables', () => {
    const text = 'No variables here';
    const variables = extractVariables(text);

    expect(variables).toHaveLength(0);
  });

  it('should track variable positions', () => {
    const text = 'Start {{ var1 }} middle {{ var2 }} end';
    const variables = extractVariables(text);

    expect(variables[0].startIndex).toBe(6);
    expect(variables[0].endIndex).toBe(16);
    expect(variables[1].startIndex).toBe(24);
    expect(variables[1].endIndex).toBe(34);
  });

  it('should identify built-in variables', () => {
    const text = '{{ workflow.id }} and {{ custom_node.output }}';
    const variables = extractVariables(text);

    expect(variables[0].isBuiltIn).toBe(true);
    expect(variables[1].isBuiltIn).toBe(false);
  });
});

describe('validateVariable', () => {
  const mockNodes: VisualWorkflowNode[] = [
    {
      id: 'task_node',
      type: 'phase.code',
      position: { x: 0, y: 0 },
      data: { label: 'Task Node' },
    },
    {
      id: 'api_node',
      type: 'action.api_call',
      position: { x: 0, y: 0 },
      data: { label: 'API Node' },
    },
  ];

  const context: VariableContext = {
    nodes: mockNodes,
    workflowId: 'workflow-123',
  };

  describe('built-in variables', () => {
    it('should validate valid built-in variable', () => {
      const variable = {
        source: 'workflow',
        path: 'id',
        raw: '{{ workflow.id }}',
        expression: 'workflow.id',
        startIndex: 0,
        endIndex: 16,
        isBuiltIn: true,
      };

      const result = validateVariable(variable, context);

      expect(result.valid).toBe(true);
      expect(result.type).toBe('string');
    });

    it('should reject invalid built-in category', () => {
      const variable = {
        source: 'invalid',
        path: 'field',
        raw: '{{ invalid.field }}',
        expression: 'invalid.field',
        startIndex: 0,
        endIndex: 20,
        isBuiltIn: false,
      };

      const result = validateVariable(variable, context);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject invalid built-in field', () => {
      const variable = {
        source: 'workflow',
        path: 'invalid_field',
        raw: '{{ workflow.invalid_field }}',
        expression: 'workflow.invalid_field',
        startIndex: 0,
        endIndex: 28,
        isBuiltIn: true,
      };

      const result = validateVariable(variable, context);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown field');
    });

    it('should provide suggestions for typos', () => {
      const variable = {
        source: 'workflw',
        path: 'id',
        raw: '{{ workflw.id }}',
        expression: 'workflw.id',
        startIndex: 0,
        endIndex: 16,
        isBuiltIn: false,
      };

      const result = validateVariable(variable, context);

      expect(result.valid).toBe(false);
      // Should not suggest as not in nodes and too different from built-ins
    });
  });

  describe('node references', () => {
    it('should validate valid node reference', () => {
      const variable = {
        source: 'task_node',
        path: 'output',
        raw: '{{ task_node.output }}',
        expression: 'task_node.output',
        startIndex: 0,
        endIndex: 22,
        isBuiltIn: false,
      };

      const result = validateVariable(variable, context);

      expect(result.valid).toBe(true);
    });

    it('should reject non-existent node', () => {
      const variable = {
        source: 'missing_node',
        path: 'output',
        raw: '{{ missing_node.output }}',
        expression: 'missing_node.output',
        startIndex: 0,
        endIndex: 25,
        isBuiltIn: false,
      };

      const result = validateVariable(variable, context);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should detect circular references', () => {
      const variable = {
        source: 'current_node',
        path: 'output',
        raw: '{{ current_node.output }}',
        expression: 'current_node.output',
        startIndex: 0,
        endIndex: 25,
        isBuiltIn: false,
      };

      const contextWithCurrent: VariableContext = {
        ...context,
        currentNodeId: 'current_node',
        nodes: [
          ...mockNodes,
          {
            id: 'current_node',
            type: 'phase.code',
            position: { x: 0, y: 0 },
            data: { label: 'Current Node' },
          },
        ],
      };

      const result = validateVariable(variable, contextWithCurrent);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Circular reference');
    });
  });

  describe('custom variables', () => {
    it('should validate custom variables', () => {
      const variable = {
        source: 'custom_var',
        raw: '{{ custom_var }}',
        expression: 'custom_var',
        startIndex: 0,
        endIndex: 16,
        isBuiltIn: false,
      };

      const contextWithCustom: VariableContext = {
        ...context,
        customVariables: {
          custom_var: 'string',
        },
      };

      const result = validateVariable(variable, contextWithCustom);

      expect(result.valid).toBe(true);
      expect(result.type).toBe('string');
    });
  });

  describe('identifier validation', () => {
    it('should reject invalid identifier characters', () => {
      const variable = {
        source: 'invalid-name',
        raw: '{{ invalid-name }}',
        expression: 'invalid-name',
        startIndex: 0,
        endIndex: 18,
        isBuiltIn: false,
      };

      const result = validateVariable(variable, context);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid variable name');
    });

    it('should allow underscores in identifiers', () => {
      const variable = {
        source: 'valid_name',
        raw: '{{ valid_name.output }}',
        expression: 'valid_name.output',
        startIndex: 0,
        endIndex: 23,
        isBuiltIn: false,
      };

      const contextWithNode: VariableContext = {
        ...context,
        nodes: [
          {
            id: 'valid_name',
            type: 'phase.code',
            position: { x: 0, y: 0 },
            data: { label: 'Valid Name' },
          },
        ],
      };

      const result = validateVariable(variable, contextWithNode);

      expect(result.valid).toBe(true);
    });
  });
});

describe('replaceVariables', () => {
  it('should replace single variable', () => {
    const text = 'Process {{ task.output }}';
    const values = {
      'task.output': 'result-data',
    };

    const result = replaceVariables(text, values);

    expect(result).toBe('Process result-data');
  });

  it('should replace multiple variables', () => {
    const text = '{{ workflow.id }}: Process {{ task.output }}';
    const values = {
      'workflow.id': 'wf-123',
      'task.output': 'result',
    };

    const result = replaceVariables(text, values);

    expect(result).toBe('wf-123: Process result');
  });

  it('should handle object values with JSON serialization', () => {
    const text = 'Data: {{ task.output }}';
    const values = {
      'task.output': { status: 'success', count: 5 },
    };

    const result = replaceVariables(text, values);

    expect(result).toBe('Data: {"status":"success","count":5}');
  });

  it('should leave unreplaced variables as-is', () => {
    const text = 'Known {{ var1 }} and unknown {{ var2 }}';
    const values = {
      var1: 'value1',
    };

    const result = replaceVariables(text, values);

    expect(result).toBe('Known value1 and unknown {{ var2 }}');
  });
});

describe('getAvailableVariables', () => {
  const mockNodes: VisualWorkflowNode[] = [
    {
      id: 'task_node',
      type: 'phase.code',
      position: { x: 0, y: 0 },
      data: { label: 'Task Node' },
    },
    {
      id: 'api_node',
      type: 'action.api_call',
      position: { x: 0, y: 0 },
      data: { label: 'API Call' },
    },
  ];

  it('should return all built-in variables', () => {
    const context: VariableContext = {
      nodes: [],
    };

    const available = getAvailableVariables(context);

    // Check for some built-in variables
    expect(available.some((v) => v.path === 'workflow.id')).toBe(true);
    expect(available.some((v) => v.path === 'trigger.data')).toBe(true);
  });

  it('should return node variables', () => {
    const context: VariableContext = {
      nodes: mockNodes,
    };

    const available = getAvailableVariables(context);

    expect(available.some((v) => v.path === 'task_node.output')).toBe(true);
    expect(available.some((v) => v.path === 'api_node.output')).toBe(true);
  });

  it('should exclude current node to prevent circular references', () => {
    const context: VariableContext = {
      nodes: mockNodes,
      currentNodeId: 'task_node',
    };

    const available = getAvailableVariables(context);

    expect(available.some((v) => v.path === 'task_node.output')).toBe(false);
    expect(available.some((v) => v.path === 'api_node.output')).toBe(true);
  });

  it('should include custom variables', () => {
    const context: VariableContext = {
      nodes: [],
      customVariables: {
        custom1: 'string',
        custom2: 'number',
      },
    };

    const available = getAvailableVariables(context);

    expect(available.some((v) => v.path === 'custom1')).toBe(true);
    expect(available.some((v) => v.path === 'custom2')).toBe(true);
  });
});

describe('formatVariable', () => {
  it('should format variable with path', () => {
    const result = formatVariable('workflow', 'id');
    expect(result).toBe('{{ workflow.id }}');
  });

  it('should format variable without path', () => {
    const result = formatVariable('custom_var');
    expect(result).toBe('{{ custom_var }}');
  });

  it('should handle deep paths', () => {
    const result = formatVariable('task', 'output.data.items');
    expect(result).toBe('{{ task.output.data.items }}');
  });
});

describe('hasVariables', () => {
  it('should return true for text with variables', () => {
    expect(hasVariables('{{ workflow.id }}')).toBe(true);
    expect(hasVariables('Text with {{ variable }}')).toBe(true);
  });

  it('should return false for text without variables', () => {
    expect(hasVariables('Plain text')).toBe(false);
    expect(hasVariables('No vars here')).toBe(false);
  });
});

describe('validateAllVariables', () => {
  const mockNodes: VisualWorkflowNode[] = [
    {
      id: 'valid_node',
      type: 'phase.code',
      position: { x: 0, y: 0 },
      data: { label: 'Valid Node' },
    },
  ];

  it('should return only invalid variables', () => {
    const text = '{{ workflow.id }} {{ valid_node.output }} {{ invalid_node.output }}';
    const context: VariableContext = {
      nodes: mockNodes,
    };

    const invalid = validateAllVariables(text, context);

    expect(invalid).toHaveLength(1);
    expect(invalid[0].source).toBe('invalid_node');
    expect(invalid[0].validation.valid).toBe(false);
  });

  it('should return empty array if all variables valid', () => {
    const text = '{{ workflow.id }} {{ valid_node.output }}';
    const context: VariableContext = {
      nodes: mockNodes,
    };

    const invalid = validateAllVariables(text, context);

    expect(invalid).toHaveLength(0);
  });
});

describe('BUILT_IN_VARIABLES', () => {
  it('should define workflow variables', () => {
    expect(BUILT_IN_VARIABLES.workflow).toBeDefined();
    expect(BUILT_IN_VARIABLES.workflow.id).toBe('string');
    expect(BUILT_IN_VARIABLES.workflow.name).toBe('string');
  });

  it('should define trigger variables', () => {
    expect(BUILT_IN_VARIABLES.trigger).toBeDefined();
    expect(BUILT_IN_VARIABLES.trigger.data).toBe('object');
    expect(BUILT_IN_VARIABLES.trigger.type).toBe('string');
  });

  it('should define context variables', () => {
    expect(BUILT_IN_VARIABLES.context).toBeDefined();
    expect(BUILT_IN_VARIABLES.context.user_id).toBe('string');
  });
});
