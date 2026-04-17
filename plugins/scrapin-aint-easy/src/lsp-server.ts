import { createServer, type Socket } from 'node:net';
import pino from 'pino';
import { type GraphAdapter } from './core/graph.js';
import { type VectorStore } from './core/vector.js';
import { SymbolResolver } from './lsp/resolver.js';
import { handleHover } from './lsp/hover.js';
import { handleDefinition } from './lsp/definition.js';
import { handleWorkspaceSymbol } from './lsp/workspace-symbol.js';
import { handleScrapinRefresh, handleScrapinAlgoSearch } from './lsp/custom-methods.js';

const logger = pino({ name: 'lsp-server' });

// ── JSON-RPC Types ──

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// ── Error Codes ──

const ErrorCode = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InternalError: -32603,
} as const;

// ── Server Config ──

interface LspServerConfig {
  port?: number;
  transport: 'stdio' | 'tcp';
}

interface ServerDependencies {
  graphAdapter: GraphAdapter;
  vectorStore: VectorStore;
  sourcesConfig: Record<string, unknown>;
  crawler?: unknown;
  algoManager?: unknown;
}

// ── Message Framing ──

/**
 * Encode a JSON-RPC response with Content-Length header framing.
 */
function encodeMessage(msg: JsonRpcResponse): Buffer {
  const body = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(body, 'utf-8')}\r\n\r\n`;
  return Buffer.from(header + body, 'utf-8');
}

/**
 * Parse Content-Length framed messages from a buffer.
 * Returns parsed messages and any remaining buffer data.
 */
function parseFramedMessages(buffer: Buffer): {
  messages: JsonRpcRequest[];
  remaining: Buffer;
} {
  const messages: JsonRpcRequest[] = [];
  let offset = 0;

  while (offset < buffer.length) {
    const headerEnd = findHeaderEnd(buffer, offset);
    if (headerEnd < 0) break;

    const headerStr = buffer.subarray(offset, headerEnd).toString('utf-8');
    const contentLength = parseContentLength(headerStr);
    if (contentLength === null) break;

    const bodyStart = headerEnd + 4; // skip \r\n\r\n
    const bodyEnd = bodyStart + contentLength;
    if (bodyEnd > buffer.length) break;

    const bodyStr = buffer.subarray(bodyStart, bodyEnd).toString('utf-8');
    try {
      const parsed = JSON.parse(bodyStr) as JsonRpcRequest;
      messages.push(parsed);
    } catch {
      logger.warn('Failed to parse JSON-RPC message body');
    }

    offset = bodyEnd;
  }

  return {
    messages,
    remaining: buffer.subarray(offset),
  };
}

function findHeaderEnd(buffer: Buffer, offset: number): number {
  for (let i = offset; i < buffer.length - 3; i++) {
    if (
      buffer[i] === 0x0d &&      // \r
      buffer[i + 1] === 0x0a &&  // \n
      buffer[i + 2] === 0x0d &&  // \r
      buffer[i + 3] === 0x0a     // \n
    ) {
      return i;
    }
  }
  return -1;
}

function parseContentLength(header: string): number | null {
  const match = /Content-Length:\s*(\d+)/i.exec(header);
  if (!match?.[1]) return null;
  const value = parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

// ── Request Dispatcher ──

class LspDispatcher {
  private readonly resolver: SymbolResolver;
  private readonly graphAdapter: GraphAdapter;
  private readonly fileCache = new Map<string, string>();
  private readonly crawler: unknown;
  private readonly algoManager: unknown;

  constructor(deps: ServerDependencies) {
    this.graphAdapter = deps.graphAdapter;
    this.resolver = new SymbolResolver(
      deps.graphAdapter,
      deps.vectorStore,
      deps.sourcesConfig as Record<string, { base_url?: string; label?: string }>,
    );
    this.crawler = deps.crawler;
    this.algoManager = deps.algoManager;
  }

  async dispatch(request: JsonRpcRequest): Promise<JsonRpcResponse | null> {
    const { method, id } = request;
    const params = (request.params ?? {}) as Record<string, unknown>;

    logger.debug({ method, id }, 'Dispatching LSP request');

    try {
      switch (method) {
        case 'initialize':
          return this.handleInitialize(id);
        case 'initialized':
          return this.handleInitialized();
        case 'textDocument/hover':
          return this.handleWithId(id, () => this.dispatchHover(params));
        case 'textDocument/definition':
          return this.handleWithId(id, () => this.dispatchDefinition(params));
        case 'workspace/symbol':
          return this.handleWithId(id, () => this.dispatchWorkspaceSymbol(params));
        case '$/scrapin/refresh':
          return this.dispatchRefresh(params);
        case '$/scrapin/algosearch':
          return this.handleWithId(id, () => this.dispatchAlgoSearch(params));
        case 'shutdown':
          return this.handleShutdown(id);
        case 'exit':
          return this.handleExit();
        default:
          return this.methodNotFound(id, method);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ method, error: message }, 'Dispatch error');
      return makeError(id ?? null, ErrorCode.InternalError, message);
    }
  }

  private handleInitialize(
    id: number | string | undefined,
  ): JsonRpcResponse {
    return makeResult(id ?? null, {
      capabilities: {
        hoverProvider: true,
        definitionProvider: true,
        workspaceSymbolProvider: true,
        textDocumentSync: {
          openClose: true,
          change: 1, // Full content sync
        },
      },
      serverInfo: {
        name: 'scrapin-aint-easy-lsp',
        version: '1.0.0',
      },
    });
  }

  private handleInitialized(): null {
    logger.info('LSP client confirmed initialization');
    return null; // Notification, no response
  }

  private async dispatchHover(
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const hoverParams = {
      textDocument: params['textDocument'] as { uri: string },
      position: params['position'] as { line: number; character: number },
    };
    return handleHover(hoverParams, this.resolver, this.fileCache);
  }

  private async dispatchDefinition(
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const defParams = {
      textDocument: params['textDocument'] as { uri: string },
      position: params['position'] as { line: number; character: number },
    };
    return handleDefinition(defParams, this.resolver, this.fileCache);
  }

  private async dispatchWorkspaceSymbol(
    params: Record<string, unknown>,
  ): Promise<unknown> {
    const wsParams = { query: params['query'] as string };
    return handleWorkspaceSymbol(wsParams, this.graphAdapter);
  }

  private async dispatchRefresh(
    params: Record<string, unknown>,
  ): Promise<null> {
    if (!this.crawler) {
      logger.warn('Refresh requested but no crawler configured');
      return null;
    }

    const refreshParams = {
      symbol: params['symbol'] as string,
      sourceKey: params['sourceKey'] as string | undefined,
    };

    // Fire and forget - notification, no response
    const crawlerTyped = this.crawler as {
      crawlSymbol(symbol: string, sourceKey?: string): Promise<void>;
    };
    handleScrapinRefresh(refreshParams, crawlerTyped).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error({ error: msg }, 'Background refresh failed');
    });

    return null;
  }

  private async dispatchAlgoSearch(
    params: Record<string, unknown>,
  ): Promise<unknown> {
    if (!this.algoManager) {
      return { results: [], total: 0 };
    }

    const searchParams = {
      query: params['query'] as string,
      category: params['category'] as string | undefined,
    };

    const algoTyped = this.algoManager as {
      search(
        query: string,
        category?: string,
      ): Promise<
        Array<{
          name: string;
          category: string;
          description: string;
          complexity: string;
          sourceKey: string;
        }>
      >;
    };

    return handleScrapinAlgoSearch(searchParams, algoTyped);
  }

  private handleShutdown(
    id: number | string | undefined,
  ): JsonRpcResponse {
    logger.info('LSP shutdown requested');
    return makeResult(id ?? null, null);
  }

  private handleExit(): null {
    logger.info('LSP exit requested');
    process.exit(0);
  }

  private methodNotFound(
    id: number | string | undefined,
    method: string,
  ): JsonRpcResponse | null {
    // Notifications (no id) with unknown methods are silently ignored
    if (id === undefined) return null;

    return makeError(
      id,
      ErrorCode.MethodNotFound,
      `Method not found: ${method}`,
    );
  }

  private async handleWithId(
    id: number | string | undefined,
    handler: () => Promise<unknown>,
  ): Promise<JsonRpcResponse> {
    const result = await handler();
    return makeResult(id ?? null, result);
  }

  /**
   * Update the file cache when textDocument/didOpen or didChange arrives.
   */
  updateFileCache(uri: string, content: string): void {
    this.fileCache.set(uri, content);
  }

  /**
   * Remove from cache on textDocument/didClose.
   */
  removeFromFileCache(uri: string): void {
    this.fileCache.delete(uri);
  }
}

// ── Response Helpers ──

function makeResult(
  id: number | string | null,
  result: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result };
}

function makeError(
  id: number | string | null,
  code: number,
  message: string,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// ── Stdio Transport ──

function startStdioTransport(dispatcher: LspDispatcher): void {
  logger.info('Starting LSP server on stdio');

  let buffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

  process.stdin.on('data', (chunk: Buffer) => {
    buffer = Buffer.concat([buffer, chunk]);

    const { messages, remaining } = parseFramedMessages(buffer);
    buffer = remaining;

    for (const msg of messages) {
      handleIncomingMessage(dispatcher, msg, writeStdio);
    }
  });

  process.stdin.on('end', () => {
    logger.info('Stdio input ended, shutting down');
    process.exit(0);
  });
}

function writeStdio(response: JsonRpcResponse): void {
  const encoded = encodeMessage(response);
  process.stdout.write(encoded);
}

// ── TCP Transport ──

function startTcpTransport(
  dispatcher: LspDispatcher,
  port: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = createServer((socket: Socket) => {
      logger.info(
        { remote: socket.remoteAddress },
        'LSP TCP client connected',
      );

      let buffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

      socket.on('data', (chunk: Buffer) => {
        buffer = Buffer.concat([buffer, chunk]);

        const { messages, remaining } = parseFramedMessages(buffer);
        buffer = remaining;

        const writeTcp = (response: JsonRpcResponse): void => {
          if (!socket.destroyed) {
            socket.write(encodeMessage(response));
          }
        };

        for (const msg of messages) {
          handleIncomingMessage(dispatcher, msg, writeTcp);
        }
      });

      socket.on('close', () => {
        logger.info('LSP TCP client disconnected');
      });

      socket.on('error', (err) => {
        logger.error({ error: err.message }, 'TCP socket error');
      });
    });

    server.on('error', (err) => {
      logger.error({ error: err.message }, 'TCP server error');
      reject(err);
    });

    server.listen(port, () => {
      logger.info({ port }, 'LSP TCP server listening');
      resolve();
    });
  });
}

// ── Shared Message Handler ──

function handleIncomingMessage(
  dispatcher: LspDispatcher,
  msg: JsonRpcRequest,
  send: (response: JsonRpcResponse) => void,
): void {
  // Handle textDocument sync notifications inline
  if (msg.method === 'textDocument/didOpen') {
    const params = msg.params as Record<string, unknown> | undefined;
    const textDoc = params?.['textDocument'] as
      | { uri: string; text: string }
      | undefined;
    if (textDoc) {
      dispatcher.updateFileCache(textDoc.uri, textDoc.text);
    }
    return;
  }

  if (msg.method === 'textDocument/didChange') {
    const params = msg.params as Record<string, unknown> | undefined;
    const textDoc = params?.['textDocument'] as { uri: string } | undefined;
    const changes = params?.['contentChanges'] as
      | Array<{ text: string }>
      | undefined;
    if (textDoc && changes?.[0]) {
      dispatcher.updateFileCache(textDoc.uri, changes[0].text);
    }
    return;
  }

  if (msg.method === 'textDocument/didClose') {
    const params = msg.params as Record<string, unknown> | undefined;
    const textDoc = params?.['textDocument'] as { uri: string } | undefined;
    if (textDoc) {
      dispatcher.removeFromFileCache(textDoc.uri);
    }
    return;
  }

  // Dispatch async request/notification
  dispatcher
    .dispatch(msg)
    .then((response) => {
      if (response !== null) {
        send(response);
      }
    })
    .catch((err: unknown) => {
      const errMsg = err instanceof Error ? err.message : String(err);
      logger.error({ method: msg.method, error: errMsg }, 'Unhandled dispatch error');
      if (msg.id !== undefined) {
        send(makeError(msg.id, ErrorCode.InternalError, errMsg));
      }
    });
}

// ── Public Entry Point ──

export async function startLspServer(
  config: LspServerConfig,
  graphAdapter: GraphAdapter,
  vectorStore: VectorStore,
  sourcesConfig: Record<string, unknown>,
): Promise<void> {
  const dispatcher = new LspDispatcher({
    graphAdapter,
    vectorStore,
    sourcesConfig,
  });

  if (config.transport === 'stdio') {
    startStdioTransport(dispatcher);
  } else if (config.transport === 'tcp') {
    const port = config.port ?? 7998;
    await startTcpTransport(dispatcher, port);
  } else {
    throw new Error(`Unsupported transport: ${config.transport as string}`);
  }

  logger.info({ transport: config.transport }, 'LSP server started');
}
