/**
 * WebSocket Client
 *
 * Production-ready WebSocket client with automatic reconnection, heartbeat,
 * type-safe event handling, and comprehensive error recovery.
 *
 * Best for: Enterprise applications requiring resilient real-time communication
 * with robust error handling and connection lifecycle management.
 *
 * @example
 * ```typescript
 * const client = new WebSocketClient({
 *   url: 'ws://localhost:8000/ws/swarm',
 *   sessionId: 'session-123',
 *   agentId: 'workflow-monitor',
 * });
 *
 * client.on(WSMessageType.NODE_STARTED, (data) => {
 *   console.log('Node started:', data.node_id);
 * });
 *
 * await client.connect();
 * ```
 */

import {
  ConnectionStatus,
  WSMessageType,
  WSMessage,
  parseWSMessage,
  isMessageType,
  EventHandler,
  EventSubscription,
} from './events';
import {
  ReconnectionManager,
  ReconnectionConfig,
  DEFAULT_RECONNECTION_CONFIG,
} from './reconnection';

/**
 * WebSocket client configuration
 */
export interface WebSocketClientConfig {
  /** WebSocket server URL (without session ID) */
  url: string;
  /** Session ID to connect to */
  sessionId: string;
  /** Agent/client identifier */
  agentId: string;
  /** Heartbeat interval in milliseconds (0 to disable) */
  heartbeatInterval?: number;
  /** Heartbeat timeout in milliseconds */
  heartbeatTimeout?: number;
  /** Reconnection configuration */
  reconnection?: Partial<ReconnectionConfig>;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * WebSocket client events
 */
export interface WebSocketClientEvents {
  /** Connection status changed */
  statusChange: (status: ConnectionStatus) => void;
  /** Connection opened */
  open: () => void;
  /** Connection closed */
  close: (event: CloseEvent) => void;
  /** Connection error */
  error: (error: Error) => void;
  /** Message received (before type-specific handlers) */
  message: (message: WSMessage) => void;
}

/**
 * Production-ready WebSocket client with automatic reconnection
 */
export class WebSocketClient {
  private config: Required<WebSocketClientConfig>;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectionManager: ReconnectionManager;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private eventHandlers: Map<string, Set<EventHandler<any>>> = new Map();
  private clientEventHandlers: Partial<WebSocketClientEvents> = {};
  private manualDisconnect = false;
  private lastPongTime = 0;

  constructor(config: WebSocketClientConfig) {
    this.config = {
      heartbeatInterval: 30000, // 30 seconds
      heartbeatTimeout: 10000, // 10 seconds
      debug: false,
      reconnection: DEFAULT_RECONNECTION_CONFIG,
      ...config,
    };

    this.reconnectionManager = new ReconnectionManager(this.config.reconnection);
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTED) {
      this.log('Already connected');
      return;
    }

    if (this.status === ConnectionStatus.CONNECTING) {
      this.log('Connection already in progress');
      return;
    }

    this.manualDisconnect = false;
    await this.establishConnection();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.manualDisconnect = true;
    this.reconnectionManager.stop();
    this.stopHeartbeat();
    this.closeWebSocket();
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Send message to server
   *
   * @param type - Message type
   * @param data - Message data
   */
  send(type: WSMessageType | string, data: Record<string, unknown> = {}): boolean {
    if (!this.isConnected()) {
      this.log('Cannot send message: not connected', 'error');
      return false;
    }

    try {
      const message: WSMessage = {
        type,
        session_id: this.config.sessionId,
        data,
        timestamp: new Date().toISOString(),
      };

      this.ws!.send(JSON.stringify(message));
      this.log(`Sent message: ${type}`, 'debug');
      return true;
    } catch (error) {
      this.log(`Failed to send message: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Subscribe to specific message type
   *
   * @param type - Message type to listen for
   * @param handler - Event handler
   * @returns Subscription object
   */
  on<T = unknown>(
    type: WSMessageType | string,
    handler: EventHandler<T>
  ): EventSubscription {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }

    this.eventHandlers.get(type)!.add(handler);
    this.log(`Subscribed to: ${type}`, 'debug');

    return {
      unsubscribe: () => {
        this.eventHandlers.get(type)?.delete(handler);
        this.log(`Unsubscribed from: ${type}`, 'debug');
      },
    };
  }

  /**
   * Subscribe to client lifecycle events
   *
   * @param event - Event name
   * @param handler - Event handler
   */
  onClientEvent<K extends keyof WebSocketClientEvents>(
    event: K,
    handler: WebSocketClientEvents[K]
  ): EventSubscription {
    this.clientEventHandlers[event] = handler;

    return {
      unsubscribe: () => {
        delete this.clientEventHandlers[event];
      },
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.config.sessionId;
  }

  /**
   * Get agent ID
   */
  getAgentId(): string {
    return this.config.agentId;
  }

  /**
   * Establish WebSocket connection
   */
  private async establishConnection(): Promise<void> {
    this.setStatus(ConnectionStatus.CONNECTING);

    try {
      const wsUrl = this.buildWebSocketUrl();
      this.log(`Connecting to: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketHandlers();

      // Wait for connection or error
      await this.waitForConnection();

      this.log('Connected successfully');
      this.setStatus(ConnectionStatus.CONNECTED);
      this.reconnectionManager.recordSuccess();
      this.startHeartbeat();
      this.clientEventHandlers.open?.();
    } catch (error) {
      this.log(`Connection failed: ${error}`, 'error');
      this.handleConnectionError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Build WebSocket URL with session and agent parameters
   */
  private buildWebSocketUrl(): string {
    const baseUrl = this.config.url.replace(/\/$/, '');
    const sessionPath = `/${this.config.sessionId}`;
    const params = new URLSearchParams({ agent_id: this.config.agentId });
    return `${baseUrl}${sessionPath}?${params.toString()}`;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('WebSocket opened');
    };

    this.ws.onclose = (event) => {
      this.log(`WebSocket closed: ${event.code} ${event.reason}`);
      this.handleDisconnect(event);
    };

    this.ws.onerror = (event) => {
      this.log('WebSocket error occurred', 'error');
      this.handleError(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  /**
   * Wait for WebSocket connection to open
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000); // 10 second timeout

      const originalOnOpen = this.ws.onopen;
      const originalOnError = this.ws.onerror;

      this.ws.onopen = (event) => {
        clearTimeout(timeout);
        originalOnOpen?.call(this.ws, event);
        resolve();
      };

      this.ws.onerror = (event) => {
        clearTimeout(timeout);
        originalOnError?.call(this.ws, event);
        reject(new Error('Connection error'));
      };
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const raw = JSON.parse(data);
      const message = parseWSMessage(raw);

      this.log(`Received: ${message.type}`, 'debug');

      // Handle PONG messages for heartbeat
      if (isMessageType(message, WSMessageType.PONG)) {
        this.handlePong();
        return;
      }

      // Emit to general message handler
      this.clientEventHandlers.message?.(message);

      // Emit to type-specific handlers
      const handlers = this.eventHandlers.get(message.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.data, message);
          } catch (error) {
            this.log(`Handler error for ${message.type}: ${error}`, 'error');
          }
        });
      }
    } catch (error) {
      this.log(`Failed to parse message: ${error}`, 'error');
    }
  }

  /**
   * Handle WebSocket disconnect
   */
  private handleDisconnect(event: CloseEvent): void {
    this.stopHeartbeat();
    this.clientEventHandlers.close?.(event);

    if (this.manualDisconnect) {
      this.setStatus(ConnectionStatus.DISCONNECTED);
      return;
    }

    // Attempt reconnection
    this.setStatus(ConnectionStatus.RECONNECTING);
    this.log('Starting reconnection process');

    this.reconnectionManager.start(
      () => this.establishConnection(),
      (error) => {
        this.log(`Reconnection failed: ${error.message}`, 'error');
        this.setStatus(ConnectionStatus.FAILED);
        this.clientEventHandlers.error?.(error);
      }
    );
  }

  /**
   * Handle connection error
   */
  private handleConnectionError(error: Error): void {
    this.reconnectionManager.recordFailure(error);
    this.clientEventHandlers.error?.(error);
  }

  /**
   * Handle general error
   */
  private handleError(error: Error): void {
    this.log(`Error: ${error.message}`, 'error');
    this.clientEventHandlers.error?.(error);
  }

  /**
   * Start heartbeat mechanism
   */
  private startHeartbeat(): void {
    if (this.config.heartbeatInterval === 0) {
      return;
    }

    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);

    this.log(`Heartbeat started: ${this.config.heartbeatInterval}ms`, 'debug');
  }

  /**
   * Stop heartbeat mechanism
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }

    this.log('Heartbeat stopped', 'debug');
  }

  /**
   * Send heartbeat ping
   */
  private sendHeartbeat(): void {
    if (!this.isConnected()) {
      return;
    }

    this.send(WSMessageType.PING);

    // Set timeout for pong response
    this.heartbeatTimeoutTimer = setTimeout(() => {
      this.log('Heartbeat timeout - connection lost', 'error');
      this.closeWebSocket();
    }, this.config.heartbeatTimeout);
  }

  /**
   * Handle heartbeat pong
   */
  private handlePong(): void {
    this.lastPongTime = Date.now();

    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }

    this.log('Heartbeat pong received', 'debug');
  }

  /**
   * Close WebSocket connection
   */
  private closeWebSocket(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        this.log(`Error closing WebSocket: ${error}`, 'error');
      }
      this.ws = null;
    }
  }

  /**
   * Set connection status
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      const previousStatus = this.status;
      this.status = status;
      this.log(`Status: ${previousStatus} -> ${status}`);
      this.clientEventHandlers.statusChange?.(status);
    }
  }

  /**
   * Log message
   */
  private log(message: string, level: 'info' | 'debug' | 'error' = 'info'): void {
    if (!this.config.debug && level === 'debug') {
      return;
    }

    const prefix = `[WebSocketClient:${this.config.sessionId}:${this.config.agentId}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message);
        break;
      case 'debug':
        console.debug(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }
}
