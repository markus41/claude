/**
 * Internal pub/sub event bus for cross-module communication.
 * Type-safe event emission and subscription.
 */

export interface ScrapinEvents {
  'crawl:start': { sourceKey: string; url: string };
  'crawl:complete': { sourceKey: string; pagesProcessed: number; durationMs: number };
  'crawl:error': { sourceKey: string; url: string; error: string };
  'graph:upsert': { nodeLabel: string; nodeId: string };
  'graph:stale': { pageId: string };
  'drift:code': { missingCount: number; deprecatedCount: number; staleCount: number };
  'drift:agent': { agentId: string; driftScore: number; driftType: string };
  'drift:cron': { jobId: string; driftRatio: number };
  'algo:indexed': { sourceKey: string; count: number };
  'lsp:hover': { symbol: string; found: boolean };
  'scheduler:job-start': { jobId: string };
  'scheduler:job-complete': { jobId: string; durationMs: number };
  'scheduler:job-error': { jobId: string; error: string };
}

type EventHandler<T> = (data: T) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<string, Array<EventHandler<unknown>>>();

  on<K extends keyof ScrapinEvents>(event: K, handler: EventHandler<ScrapinEvents[K]>): () => void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler as EventHandler<unknown>);
    this.handlers.set(event, list);

    return () => {
      const idx = list.indexOf(handler as EventHandler<unknown>);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  async emit<K extends keyof ScrapinEvents>(event: K, data: ScrapinEvents[K]): Promise<void> {
    const list = this.handlers.get(event);
    if (!list) return;
    const promises = list.map((handler) => {
      try {
        const result = handler(data);
        return result instanceof Promise ? result : Promise.resolve();
      } catch (err) {
        return Promise.reject(err);
      }
    });
    await Promise.allSettled(promises);
  }

  off(event: keyof ScrapinEvents): void {
    this.handlers.delete(event);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
