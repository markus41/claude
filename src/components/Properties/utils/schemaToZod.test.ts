/**
 * JSON Schema to Zod Conversion Tests
 *
 * Comprehensive test suite for schema conversion utility.
 * Validates all JSON Schema features and edge cases.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  convertJsonSchemaToZod,
  convertPropertyToZod,
  validateAgainstSchema,
  SchemaConversionError,
} from './schemaToZod';
import type { NodeSchema, NodeSchemaProperty } from '@/types/workflow';

describe('convertPropertyToZod', () => {
  describe('string types', () => {
    it('should convert basic string property', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        description: 'Test string',
      };

      const schema = convertPropertyToZod(property, 'testField');
      const result = schema.safeParse('hello');

      expect(result.success).toBe(true);
    });

    it('should apply minLength constraint', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        minLength: 5,
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse('abc').success).toBe(false);
      expect(schema.safeParse('abcde').success).toBe(true);
    });

    it('should apply maxLength constraint', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        maxLength: 10,
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse('12345678901').success).toBe(false);
      expect(schema.safeParse('1234567890').success).toBe(true);
    });

    it('should apply pattern validation', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        pattern: '^[a-z]+$',
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse('ABC').success).toBe(false);
      expect(schema.safeParse('abc').success).toBe(true);
    });

    it('should apply email format validation', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        format: 'email',
      };

      const schema = convertPropertyToZod(property, 'email');

      expect(schema.safeParse('invalid-email').success).toBe(false);
      expect(schema.safeParse('test@example.com').success).toBe(true);
    });

    it('should apply url format validation', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        format: 'uri',
      };

      const schema = convertPropertyToZod(property, 'url');

      expect(schema.safeParse('not-a-url').success).toBe(false);
      expect(schema.safeParse('https://example.com').success).toBe(true);
    });

    it('should apply uuid format validation', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        format: 'uuid',
      };

      const schema = convertPropertyToZod(property, 'id');

      expect(schema.safeParse('invalid-uuid').success).toBe(false);
      expect(schema.safeParse('123e4567-e89b-42d3-a456-426614174000').success).toBe(true);
    });

    it('should apply enum constraint', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        enum: ['option1', 'option2', 'option3'],
      };

      const schema = convertPropertyToZod(property, 'choice');

      expect(schema.safeParse('invalid').success).toBe(false);
      expect(schema.safeParse('option1').success).toBe(true);
      expect(schema.safeParse('option2').success).toBe(true);
    });

    it('should apply default value', () => {
      const property: NodeSchemaProperty = {
        type: 'string',
        default: 'default-value',
      };

      const schema = convertPropertyToZod(property, 'field');
      const result = schema.parse(undefined);

      expect(result).toBe('default-value');
    });
  });

  describe('number types', () => {
    it('should convert basic number property', () => {
      const property: NodeSchemaProperty = {
        type: 'number',
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse(42).success).toBe(true);
      expect(schema.safeParse('not-a-number').success).toBe(false);
    });

    it('should apply minimum constraint', () => {
      const property: NodeSchemaProperty = {
        type: 'number',
        minimum: 10,
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse(5).success).toBe(false);
      expect(schema.safeParse(10).success).toBe(true);
      expect(schema.safeParse(15).success).toBe(true);
    });

    it('should apply maximum constraint', () => {
      const property: NodeSchemaProperty = {
        type: 'number',
        maximum: 100,
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse(150).success).toBe(false);
      expect(schema.safeParse(100).success).toBe(true);
      expect(schema.safeParse(50).success).toBe(true);
    });

    it('should apply default value', () => {
      const property: NodeSchemaProperty = {
        type: 'number',
        default: 42,
      };

      const schema = convertPropertyToZod(property, 'field');
      const result = schema.parse(undefined);

      expect(result).toBe(42);
    });
  });

  describe('boolean types', () => {
    it('should convert basic boolean property', () => {
      const property: NodeSchemaProperty = {
        type: 'boolean',
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse(true).success).toBe(true);
      expect(schema.safeParse(false).success).toBe(true);
      expect(schema.safeParse('not-boolean').success).toBe(false);
    });

    it('should apply default value', () => {
      const property: NodeSchemaProperty = {
        type: 'boolean',
        default: true,
      };

      const schema = convertPropertyToZod(property, 'field');
      const result = schema.parse(undefined);

      expect(result).toBe(true);
    });
  });

  describe('array types', () => {
    it('should convert array with string items', () => {
      const property: NodeSchemaProperty = {
        type: 'array',
        items: {
          type: 'string',
        },
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse(['a', 'b', 'c']).success).toBe(true);
      expect(schema.safeParse([1, 2, 3]).success).toBe(false);
    });

    it('should apply minLength constraint', () => {
      const property: NodeSchemaProperty = {
        type: 'array',
        minLength: 2,
        items: {
          type: 'string',
        },
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse(['a']).success).toBe(false);
      expect(schema.safeParse(['a', 'b']).success).toBe(true);
    });

    it('should throw error if items not defined', () => {
      const property: NodeSchemaProperty = {
        type: 'array',
      };

      expect(() => convertPropertyToZod(property, 'testField')).toThrow(
        SchemaConversionError
      );
    });
  });

  describe('object types', () => {
    it('should convert nested object', () => {
      const property: NodeSchemaProperty = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse({ name: 'John', age: 30 }).success).toBe(true);
      expect(schema.safeParse({ name: 'John' }).success).toBe(true);
    });

    it('should handle empty object schema', () => {
      const property: NodeSchemaProperty = {
        type: 'object',
      };

      const schema = convertPropertyToZod(property, 'testField');

      expect(schema.safeParse({}).success).toBe(true);
      expect(schema.safeParse({ any: 'value' }).success).toBe(true);
    });
  });
});

describe('convertJsonSchemaToZod', () => {
  it('should convert complete schema', () => {
    const schema: NodeSchema = {
      type: 'object',
      properties: {
        model: {
          type: 'string',
          enum: ['claude-opus-4', 'claude-sonnet-4'],
        },
        maxContext: {
          type: 'number',
          minimum: 10000,
          maximum: 200000,
          default: 80000,
        },
        enableLogging: {
          type: 'boolean',
          default: false,
        },
      },
      required: ['model', 'maxContext'],
    };

    const zodSchema = convertJsonSchemaToZod(schema);

    // Valid data
    const validData = {
      model: 'claude-opus-4',
      maxContext: 80000,
      enableLogging: true,
    };
    expect(zodSchema.safeParse(validData).success).toBe(true);

    // Missing required field
    const missingRequired = {
      maxContext: 80000,
    };
    expect(zodSchema.safeParse(missingRequired).success).toBe(false);

    // Invalid enum value
    const invalidEnum = {
      model: 'invalid-model',
      maxContext: 80000,
    };
    expect(zodSchema.safeParse(invalidEnum).success).toBe(false);

    // Out of range number
    const outOfRange = {
      model: 'claude-opus-4',
      maxContext: 300000,
    };
    expect(zodSchema.safeParse(outOfRange).success).toBe(false);
  });

  it('should make all fields optional when makeOptional is true', () => {
    const schema: NodeSchema = {
      type: 'object',
      properties: {
        field1: { type: 'string' },
        field2: { type: 'number' },
      },
      required: ['field1', 'field2'],
    };

    const zodSchema = convertJsonSchemaToZod(schema, { makeOptional: true });

    expect(zodSchema.safeParse({}).success).toBe(true);
    expect(zodSchema.safeParse({ field1: 'test' }).success).toBe(true);
  });

  it('should apply strict mode by default', () => {
    const schema: NodeSchema = {
      type: 'object',
      properties: {
        field1: { type: 'string' },
      },
    };

    const zodSchema = convertJsonSchemaToZod(schema);

    expect(zodSchema.safeParse({ field1: 'test', unknown: 'value' }).success).toBe(false);
  });

  it('should allow unknown properties when strict is false', () => {
    const schema: NodeSchema = {
      type: 'object',
      properties: {
        field1: { type: 'string' },
      },
    };

    const zodSchema = convertJsonSchemaToZod(schema, { strict: false });

    expect(zodSchema.safeParse({ field1: 'test', unknown: 'value' }).success).toBe(true);
  });

  it('should throw error for non-object root schema', () => {
    const schema: NodeSchema = {
      type: 'string',
    } as NodeSchema;

    expect(() => convertJsonSchemaToZod(schema)).toThrow(SchemaConversionError);
  });
});

describe('validateAgainstSchema', () => {
  it('should validate data successfully', () => {
    const schema: NodeSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number', minimum: 0 },
      },
      required: ['name'],
    };

    const data = {
      name: 'John',
      age: 30,
    };

    const result = validateAgainstSchema(schema, data);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(data);
    }
  });

  it('should return validation errors', () => {
    const schema: NodeSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number', minimum: 0 },
      },
      required: ['name'],
    };

    const data = {
      age: -5,
    };

    const result = validateAgainstSchema(schema, data);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThan(0);
    }
  });
});

describe('edge cases', () => {
  it('should handle invalid regex pattern gracefully', () => {
    const property: NodeSchemaProperty = {
      type: 'string',
      pattern: '[invalid(regex',
    };

    expect(() => convertPropertyToZod(property, 'testField')).toThrow(
      SchemaConversionError
    );
  });

  it('should handle deeply nested objects', () => {
    const property: NodeSchemaProperty = {
      type: 'object',
      properties: {
        level1: {
          type: 'object',
          properties: {
            level2: {
              type: 'object',
              properties: {
                level3: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    };

    const schema = convertPropertyToZod(property, 'nested');
    const data = {
      level1: {
        level2: {
          level3: 'deep value',
        },
      },
    };

    expect(schema.safeParse(data).success).toBe(true);
  });

  it('should handle arrays of objects', () => {
    const property: NodeSchemaProperty = {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          value: { type: 'number' },
        },
      },
    };

    const schema = convertPropertyToZod(property, 'items');
    const data = [
      { id: 'a', value: 1 },
      { id: 'b', value: 2 },
    ];

    expect(schema.safeParse(data).success).toBe(true);
  });
});
