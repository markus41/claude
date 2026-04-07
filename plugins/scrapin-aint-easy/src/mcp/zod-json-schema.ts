import { z } from 'zod';

type JsonSchema = Record<string, unknown>;

function withDescription(schema: JsonSchema, zodSchema: z.ZodTypeAny): JsonSchema {
  if (zodSchema.description) {
    schema.description = zodSchema.description;
  }
  return schema;
}

function unwrapEffects(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  while (current._def.typeName === z.ZodFirstPartyTypeKind.ZodEffects) {
    current = (current as z.ZodEffects<z.ZodTypeAny>)._def.schema;
  }
  return current;
}

function isOptionalInput(schema: z.ZodTypeAny): boolean {
  const unwrapped = unwrapEffects(schema);
  if (unwrapped._def.typeName === z.ZodFirstPartyTypeKind.ZodOptional) return true;
  if (unwrapped._def.typeName === z.ZodFirstPartyTypeKind.ZodDefault) return true;
  return false;
}

function zodToJsonSchemaInternal(schema: z.ZodTypeAny): JsonSchema {
  const unwrapped = unwrapEffects(schema);
  const typeName = unwrapped._def.typeName;

  if (typeName === z.ZodFirstPartyTypeKind.ZodOptional) {
    return zodToJsonSchemaInternal((unwrapped as z.ZodOptional<z.ZodTypeAny>).unwrap());
  }
  if (typeName === z.ZodFirstPartyTypeKind.ZodDefault) {
    const defaultSchema = unwrapped as z.ZodDefault<z.ZodTypeAny>;
    const inner = zodToJsonSchemaInternal(defaultSchema._def.innerType);
    inner.default = defaultSchema._def.defaultValue();
    return withDescription(inner, unwrapped);
  }
  if (typeName === z.ZodFirstPartyTypeKind.ZodObject) {
    const objectSchema = unwrapped as z.ZodObject<z.ZodRawShape>;
    const shape = objectSchema.shape;
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToJsonSchemaInternal(value);
      if (!isOptionalInput(value)) required.push(key);
    }

    const result: JsonSchema = {
      type: 'object',
      properties,
      additionalProperties: false,
    };
    if (required.length > 0) result.required = required;
    return withDescription(result, unwrapped);
  }
  if (typeName === z.ZodFirstPartyTypeKind.ZodArray) {
    const arraySchema = unwrapped as z.ZodArray<z.ZodTypeAny>;
    return withDescription(
      {
        type: 'array',
        items: zodToJsonSchemaInternal(arraySchema.element),
      },
      unwrapped,
    );
  }
  if (typeName === z.ZodFirstPartyTypeKind.ZodEnum) {
    const enumSchema = unwrapped as z.ZodEnum<[string, ...string[]]>;
    return withDescription({ type: 'string', enum: enumSchema.options }, unwrapped);
  }
  if (typeName === z.ZodFirstPartyTypeKind.ZodString) return withDescription({ type: 'string' }, unwrapped);
  if (typeName === z.ZodFirstPartyTypeKind.ZodNumber) return withDescription({ type: 'number' }, unwrapped);
  if (typeName === z.ZodFirstPartyTypeKind.ZodBoolean) return withDescription({ type: 'boolean' }, unwrapped);
  if (typeName === z.ZodFirstPartyTypeKind.ZodLiteral) {
    const literal = (unwrapped as z.ZodLiteral<unknown>).value;
    return withDescription(
      {
        const: literal,
        type: typeof literal,
      },
      unwrapped,
    );
  }
  if (typeName === z.ZodFirstPartyTypeKind.ZodNullable) {
    const nullableSchema = unwrapped as z.ZodNullable<z.ZodTypeAny>;
    const inner = zodToJsonSchemaInternal(nullableSchema.unwrap());
    return withDescription({ anyOf: [inner, { type: 'null' }] }, unwrapped);
  }

  return {};
}

export function zodToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  return zodToJsonSchemaInternal(schema);
}
