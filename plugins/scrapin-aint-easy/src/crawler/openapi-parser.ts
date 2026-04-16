import pino from 'pino';

const logger = pino({ name: 'openapi-parser' });

export interface ParamInfo {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  description: string;
  type: string;
}

export interface ResponseInfo {
  status: string;
  description: string;
  contentType: string;
}

export interface SyntheticPage {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: ParamInfo[];
  responses: ResponseInfo[];
  markdown: string;
}

interface OpenApiParameter {
  name?: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: { type?: string };
}

interface OpenApiResponse {
  description?: string;
  content?: Record<string, unknown>;
}

interface OpenApiOperation {
  summary?: string;
  description?: string;
  parameters?: OpenApiParameter[];
  responses?: Record<string, OpenApiResponse>;
  deprecated?: boolean;
  tags?: string[];
  operationId?: string;
}

interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
  head?: OpenApiOperation;
  options?: OpenApiOperation;
  parameters?: OpenApiParameter[];
}

interface OpenApiSpec {
  info?: { title?: string; version?: string; description?: string };
  paths?: Record<string, OpenApiPathItem>;
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

function extractParams(
  operation: OpenApiOperation,
  pathItem: OpenApiPathItem,
): ParamInfo[] {
  const raw = [
    ...(pathItem.parameters ?? []),
    ...(operation.parameters ?? []),
  ];

  const seen = new Set<string>();
  const params: ParamInfo[] = [];

  for (const p of raw) {
    const key = `${p.in ?? 'unknown'}:${p.name ?? 'unnamed'}`;
    if (seen.has(key)) continue;
    seen.add(key);

    params.push({
      name: p.name ?? 'unnamed',
      in: (p.in ?? 'query') as ParamInfo['in'],
      required: p.required ?? false,
      description: p.description ?? '',
      type: p.schema?.type ?? 'string',
    });
  }

  return params;
}

function extractResponses(operation: OpenApiOperation): ResponseInfo[] {
  const responses: ResponseInfo[] = [];
  const rawResponses = operation.responses ?? {};

  for (const [status, resp] of Object.entries(rawResponses)) {
    const contentTypes = resp.content ? Object.keys(resp.content) : [];
    responses.push({
      status,
      description: resp.description ?? '',
      contentType: contentTypes[0] ?? 'application/json',
    });
  }

  return responses;
}

function buildMarkdown(
  path: string,
  method: string,
  operation: OpenApiOperation,
  parameters: ParamInfo[],
  responses: ResponseInfo[],
): string {
  const lines: string[] = [];
  const upperMethod = method.toUpperCase();

  lines.push(`## ${upperMethod} ${path}`);
  lines.push('');

  if (operation.deprecated) {
    lines.push('> **DEPRECATED**');
    lines.push('');
  }

  if (operation.summary) {
    lines.push(operation.summary);
    lines.push('');
  }

  if (operation.description) {
    lines.push(operation.description);
    lines.push('');
  }

  if (operation.tags && operation.tags.length > 0) {
    lines.push(`**Tags:** ${operation.tags.join(', ')}`);
    lines.push('');
  }

  if (parameters.length > 0) {
    lines.push('### Parameters');
    lines.push('');
    lines.push('| Name | In | Type | Required | Description |');
    lines.push('|------|-----|------|----------|-------------|');
    for (const p of parameters) {
      const req = p.required ? 'Yes' : 'No';
      lines.push(`| ${p.name} | ${p.in} | ${p.type} | ${req} | ${p.description} |`);
    }
    lines.push('');
  }

  if (responses.length > 0) {
    lines.push('### Responses');
    lines.push('');
    lines.push('| Status | Content-Type | Description |');
    lines.push('|--------|-------------|-------------|');
    for (const r of responses) {
      lines.push(`| ${r.status} | ${r.contentType} | ${r.description} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Parse an OpenAPI spec (URL or local file path) into synthetic documentation pages,
 * one per operation (method + path).
 */
export async function parseOpenApiSpec(specUrlOrPath: string): Promise<SyntheticPage[]> {
  logger.debug({ specUrlOrPath }, 'Parsing OpenAPI spec');

  const parser = await import('@readme/openapi-parser');
  const parserMod = parser.default ?? parser;

  const api = (await parserMod.dereference(specUrlOrPath)) as OpenApiSpec;
  const paths = api.paths ?? {};
  const pages: SyntheticPage[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem) continue;

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (!operation) continue;

      const parameters = extractParams(operation, pathItem);
      const responses = extractResponses(operation);
      const markdown = buildMarkdown(path, method, operation, parameters, responses);

      pages.push({
        path,
        method: method.toUpperCase(),
        summary: operation.summary ?? '',
        description: operation.description ?? '',
        parameters,
        responses,
        markdown,
      });
    }
  }

  logger.info({ specUrlOrPath, pageCount: pages.length }, 'OpenAPI parsing complete');
  return pages;
}
