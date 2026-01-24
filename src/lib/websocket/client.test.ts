/**
 * WebSocket Client Tests
 *
 * Comprehensive test suite for WebSocketClient with mocked WebSocket.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocketClient } from './client';
import { ConnectionStatus, WSMessageType } from './events';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN; // Start as open for simplicity
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Immediately call onopen for synchronous testing
    queueMicrotask(() => {
      this.onopen?.(new Event('open'));
    });
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    const event = new CloseEvent('close', { code: 1000, reason: 'Normal closure' });
    queueMicrotask(() => {
      this.onclose?.(event);
    });
  }

  // Helper to simulate receiving a message
  simulateMessage(data: any): void {
    if (this.readyState === MockWebSocket.OPEN && this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  // Helper to simulate error
  simulateError(): void {
    this.onerror?.(new Event('error'));
  }
}

describe('WebSocketClient', () => {
  beforeEach(() => {
    // @ts-ignore - Mock WebSocket globally
    global.WebSocket = MockWebSocket as any;
  });

  describe('Connection', () => {
    it('should connect successfully', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0, // Disable heartbeat for testing
      });

      const statusChanges: ConnectionStatus[] = [];
      client.onClientEvent('statusChange', (status) => {
        statusChanges.push(status);
      });

      await client.connect();

      expect(client.getStatus()).toBe(ConnectionStatus.CONNECTED);
      expect(statusChanges).toContain(ConnectionStatus.CONNECTING);
      expect(statusChanges).toContain(ConnectionStatus.CONNECTED);
    });

    it('should build correct WebSocket URL', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'session-123',
        agentId: 'agent-456',
        heartbeatInterval: 0,
      });

      await client.connect();

      expect(client.getSessionId()).toBe('session-123');
      expect(client.getAgentId()).toBe('agent-456');
    });

    it('should not connect if already connected', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      await client.connect();
      const statusBefore = client.getStatus();

      // Try to connect again
      await client.connect();

      expect(client.getStatus()).toBe(statusBefore);
      expect(client.getStatus()).toBe(ConnectionStatus.CONNECTED);
    });

    it('should disconnect cleanly', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      await client.connect();
      expect(client.isConnected()).toBe(true);

      client.disconnect();

      // Wait for async close
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(client.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('Message Handling', () => {
    it('should receive and parse messages', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      await client.connect();

      const receivedMessages: any[] = [];
      client.on(WSMessageType.NODE_STARTED, (data) => {
        receivedMessages.push(data);
      });

      // Simulate receiving a message
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: WSMessageType.NODE_STARTED,
        session_id: 'test-session',
        data: {
          node_id: 'node-1',
          status: 'running',
        },
        timestamp: new Date().toISOString(),
      });

      expect(receivedMessages).toHaveLength(1);
      expect(receivedMessages[0]).toMatchObject({
        node_id: 'node-1',
        status: 'running',
      });
    });

    it('should handle multiple subscribers', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      await client.connect();

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      client.on(WSMessageType.NODE_STARTED, handler1);
      client.on(WSMessageType.NODE_STARTED, handler2);

      // Simulate message
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: WSMessageType.NODE_STARTED,
        session_id: 'test-session',
        data: { node_id: 'node-1' },
        timestamp: new Date().toISOString(),
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe correctly', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      await client.connect();

      const handler = vi.fn();
      const subscription = client.on(WSMessageType.NODE_STARTED, handler);

      // Send first message
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: WSMessageType.NODE_STARTED,
        session_id: 'test-session',
        data: { node_id: 'node-1' },
        timestamp: new Date().toISOString(),
      });

      expect(handler).toHaveBeenCalledTimes(1);

      // Unsubscribe
      subscription.unsubscribe();

      // Send second message
      ws.simulateMessage({
        type: WSMessageType.NODE_STARTED,
        session_id: 'test-session',
        data: { node_id: 'node-2' },
        timestamp: new Date().toISOString(),
      });

      // Should still be 1 (not called again)
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle PONG messages', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;

      // PONG should not trigger general handlers
      const generalHandler = vi.fn();
      client.onClientEvent('message', generalHandler);

      ws.simulateMessage({
        type: WSMessageType.PONG,
        session_id: 'test-session',
        data: { agent_id: 'test-agent' },
        timestamp: new Date().toISOString(),
      });

      // PONG is handled internally, not emitted to message handler
      expect(generalHandler).not.toHaveBeenCalled();
    });
  });

  describe('Sending Messages', () => {
    it('should send messages when connected', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      await client.connect();

      const ws = (client as any).ws as MockWebSocket;
      const sendSpy = vi.spyOn(ws, 'send');

      const result = client.send(WSMessageType.PING, { test: 'data' });

      expect(result).toBe(true);
      expect(sendSpy).toHaveBeenCalledTimes(1);

      const sentData = JSON.parse(sendSpy.mock.calls[0][0]);
      expect(sentData).toMatchObject({
        type: WSMessageType.PING,
        session_id: 'test-session',
        data: { test: 'data' },
      });
      expect(sentData).toHaveProperty('timestamp');
    });

    it('should not send when disconnected', () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      const result = client.send(WSMessageType.PING);

      expect(result).toBe(false);
    });
  });

  describe('Client Events', () => {
    it('should emit open event', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      const openHandler = vi.fn();
      client.onClientEvent('open', openHandler);

      await client.connect();

      expect(openHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit statusChange events', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      const statusChanges: ConnectionStatus[] = [];
      client.onClientEvent('statusChange', (status) => {
        statusChanges.push(status);
      });

      await client.connect();

      expect(statusChanges).toContain(ConnectionStatus.CONNECTING);
      expect(statusChanges).toContain(ConnectionStatus.CONNECTED);
    });

    it('should emit close event on disconnect', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      const closeHandler = vi.fn();
      client.onClientEvent('close', closeHandler);

      await client.connect();
      client.disconnect();

      // Wait for async close
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(closeHandler).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe from client events', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      const handler = vi.fn();
      const subscription = client.onClientEvent('statusChange', handler);

      await client.connect();

      const callsBefore = handler.mock.calls.length;

      // Unsubscribe
      subscription.unsubscribe();

      // Disconnect (should trigger statusChange, but handler unsubscribed)
      client.disconnect();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Should not have been called again
      expect(handler.mock.calls.length).toBe(callsBefore);
    });
  });

  describe('Connection Status', () => {
    it('should report correct connection status', async () => {
      const client = new WebSocketClient({
        url: 'ws://localhost:8000/ws/swarm',
        sessionId: 'test-session',
        agentId: 'test-agent',
        heartbeatInterval: 0,
      });

      expect(client.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
      expect(client.isConnected()).toBe(false);

      await client.connect();

      expect(client.getStatus()).toBe(ConnectionStatus.CONNECTED);
      expect(client.isConnected()).toBe(true);

      client.disconnect();
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(client.getStatus()).toBe(ConnectionStatus.DISCONNECTED);
      expect(client.isConnected()).toBe(false);
    });
  });
});
