---
name: Next.js Static Export for Tauri
description: Use when the user asks how to ship Next.js 15 + React 19 inside Tauri, configure static export, handle dynamic routes, or wire client-only components to Tauri APIs.
version: 0.1.0
---

# Next.js 15 + React 19 inside Tauri

Tauri loads bundled HTML/JS, not a Node server — so Next.js must be in static export mode.

## `next.config.mjs`

```js
/** @type {import('next').NextConfig} */
export default {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  // Strict mode catches React 19 transitional bugs early:
  reactStrictMode: true,
};
```

## What works / what doesn't

| Feature | OK in Tauri? |
|---------|-------------|
| App Router (`app/`) | Yes |
| Server Components | Yes (rendered at build time) |
| `'use client'` components | Yes |
| Dynamic routes (`[slug]`) | Yes — but you must `generateStaticParams` |
| Server Actions | **No** — there's no Node server |
| `next/image` with optimizer | **No** — use `unoptimized: true` |
| `cookies()` / `headers()` from `next/headers` | **No** at runtime — only at build |
| Middleware | **No** |
| API routes (`route.ts`) | **No** — replace with `invoke()` to Rust |

## Tauri API access pattern

The renderer needs to detect Tauri context (vs SSR build) and import Tauri APIs only client-side:

```typescript
// src/lib/tauri/client.ts
'use client';

import type { invoke as InvokeFn } from '@tauri-apps/api/core';

let cachedInvoke: typeof InvokeFn | null = null;

export async function getInvoke(): Promise<typeof InvokeFn> {
  if (cachedInvoke) return cachedInvoke;
  if (typeof window === 'undefined') {
    throw new Error('Tauri APIs are client-only');
  }
  const mod = await import('@tauri-apps/api/core');
  cachedInvoke = mod.invoke;
  return cachedInvoke;
}
```

Wrap components that use Tauri in `'use client'`:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { getInvoke } from '@/lib/tauri/client';

export function DeviceList() {
  const [devices, setDevices] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const invoke = await getInvoke();
      setDevices(await invoke<string[]>('list_audio_devices'));
    })();
  }, []);
  return <ul>{devices.map((d) => <li key={d}>{d}</li>)}</ul>;
}
```

## Routing within Tauri

`tauri.conf.json` `build.frontendDist: "../out"` after `next build` produces `out/`. Tauri serves it from a custom protocol — links work normally, but absolute paths like `/foo` must match the `out/` layout (use `trailingSlash: true` so `/foo/` resolves to `out/foo/index.html`).

## Zustand 5 store

```typescript
// src/state/audio.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AudioState {
  level: number;
  isCapturing: boolean;
  setLevel: (v: number) => void;
  setCapturing: (v: boolean) => void;
}

export const useAudio = create<AudioState>()(
  immer((set) => ({
    level: 0,
    isCapturing: false,
    setLevel: (v) => set((s) => { s.level = v; }),
    setCapturing: (v) => set((s) => { s.isCapturing = v; }),
  }))
);
```

Subscribing to Tauri events:
```tsx
'use client';
import { useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useAudio } from '@/state/audio';

export function LevelMeter() {
  const level = useAudio((s) => s.level);
  const setLevel = useAudio((s) => s.setLevel);

  useEffect(() => {
    let unlisten = () => {};
    listen<number>('audio:level', (e) => setLevel(e.payload)).then((u) => { unlisten = u; });
    return () => unlisten();
  }, [setLevel]);

  return <div className="meter" style={{ width: `${level * 100}%` }} />;
}
```

## Pitfalls

- **`Image` from `next/image` with remote URLs**: requires the optimizer; either pre-fetch and bundle, or use a plain `<img>`.
- **Dynamic `import()` of Tauri APIs in a Server Component**: build-time error. Must be inside `'use client'`.
- **React 19 + libs**: many libs still type-check against React 18. Add `peerDependencies` overrides in `package.json` if you hit prop type mismatches.
- **`trailingSlash: false`**: links break in production because Tauri's asset protocol can't fall back to `index.html`. Keep `true`.
