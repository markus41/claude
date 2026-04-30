/**
 * Cursor pagination helpers for Linear's Connection types.
 *
 * Reference: https://linear.app/developers/pagination
 */

export interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface Connection<T> {
  nodes: T[];
  pageInfo: PageInfo;
}

export type FetchPage<T> = (cursor: string | null) => Promise<Connection<T>>;

/**
 * Yields every node across all pages. Honours rate-limit pause via the optional
 * `pauseUntil` callback (returns a Date or null).
 */
export async function* paginateAll<T>(
  fetch: FetchPage<T>,
  pauseUntil?: () => Promise<Date | null>
): AsyncGenerator<T> {
  let cursor: string | null = null;
  while (true) {
    const pause = await pauseUntil?.();
    if (pause && pause.getTime() > Date.now()) {
      await sleep(pause.getTime() - Date.now());
    }
    const page = await fetch(cursor);
    yield* page.nodes;
    if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor) return;
    cursor = page.pageInfo.endCursor;
  }
}

/** Collect all pages into an array (use with care for large result sets). */
export async function collectAll<T>(fetch: FetchPage<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const node of paginateAll(fetch)) out.push(node);
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
