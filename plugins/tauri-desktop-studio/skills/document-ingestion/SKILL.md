---
name: Document Ingestion
description: Use when the user asks about parsing .docx files with mammoth, rendering markdown with react-markdown, virtualized long-list rendering with react-virtuoso, or building a transcript/document viewer in a Tauri app.
version: 0.1.0
---

# Document Ingestion & Rendering

The Discovery Co-Pilot stack uses three libraries together for a transcript / document feed:

| Need | Library |
|------|---------|
| Parse `.docx` to plain text or HTML | `mammoth` |
| Render markdown safely | `react-markdown` + `remark-gfm` + `rehype-sanitize` |
| Virtualize long transcript / chunk feeds | `react-virtuoso` |

## .docx ingestion with mammoth

```typescript
// src/lib/docx.ts
import mammoth from 'mammoth';

export async function docxToHtml(buffer: ArrayBuffer): Promise<string> {
  const { value, messages } = await mammoth.convertToHtml(
    { arrayBuffer: buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
      ],
      ignoreEmptyParagraphs: true,
    }
  );
  if (messages.length) console.warn('mammoth warnings:', messages);
  return value;
}

export async function docxToMarkdown(buffer: ArrayBuffer): Promise<string> {
  const { value } = await mammoth.convertToMarkdown({ arrayBuffer: buffer });
  return value;
}

export async function docxToText(buffer: ArrayBuffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer });
  return value;
}
```

### From a Tauri file dialog

```typescript
import { open } from '@tauri-apps/plugin-dialog';
import { readFile } from '@tauri-apps/plugin-fs';

export async function importDocx(): Promise<string | null> {
  const path = await open({
    filters: [{ name: 'Word', extensions: ['docx'] }],
    multiple: false,
  });
  if (!path || Array.isArray(path)) return null;

  const bytes = await readFile(path);
  return await docxToMarkdown(bytes.buffer);
}
```

Capability:
```json
{ "permissions": ["dialog:allow-open", "fs:allow-read-file", { "identifier": "fs:scope", "allow": ["$DOCUMENT/**", "$DOWNLOAD/**", "$DESKTOP/**"] }] }
```

### From a drag-drop into a Tauri window

```typescript
import { listen } from '@tauri-apps/api/event';
import { readFile } from '@tauri-apps/plugin-fs';

await listen<string[]>('tauri://file-drop', async (e) => {
  for (const path of e.payload) {
    if (!path.endsWith('.docx')) continue;
    const bytes = await readFile(path);
    const md = await docxToMarkdown(bytes.buffer);
    // ...feed into viewer
  }
});
```

## Markdown rendering with react-markdown

```bash
pnpm add react-markdown remark-gfm rehype-sanitize rehype-highlight
```

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';

export function MarkdownView({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize, rehypeHighlight]}
      components={{
        a: ({ href, children }) => (
          <a href={href} onClick={(e) => { e.preventDefault(); openSafely(href); }}>
            {children}
          </a>
        ),
        code: ({ inline, className, children }) =>
          inline ? <code className={className}>{children}</code>
                 : <pre><code className={className}>{children}</code></pre>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

async function openSafely(url?: string) {
  if (!url) return;
  // Tauri shell.open requires capability; route through it instead of letting the webview navigate
  const { open } = await import('@tauri-apps/plugin-shell');
  await open(url);
}
```

`rehype-sanitize` is non-optional — markdown can carry HTML, and a transcript may contain user-generated content. Without sanitization, you have an XSS surface.

## Virtualized rendering with react-virtuoso

For a transcript with thousands of utterances, never render them all at once.

```tsx
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

interface Chunk { id: string; speaker: string; text: string; ts: number; isFinal: boolean }

export function TranscriptFeed({ chunks, onAppend }: { chunks: Chunk[]; onAppend: (c: Chunk) => void }) {
  const virtuoso = useRef<VirtuosoHandle>(null);

  // Auto-stick to bottom on append
  useEffect(() => {
    let unlisten = () => {};
    listen<Chunk>('transcript:chunk', (e) => {
      onAppend(e.payload);
      virtuoso.current?.scrollToIndex({ index: 'LAST', behavior: 'smooth' });
    }).then((u) => { unlisten = u; });
    return () => unlisten();
  }, [onAppend]);

  return (
    <Virtuoso
      ref={virtuoso}
      data={chunks}
      itemContent={(index, c) => (
        <div className={`chunk ${c.isFinal ? 'final' : 'interim'}`}>
          <span className="speaker">{c.speaker}</span>
          <span className="text">{c.text}</span>
        </div>
      )}
      followOutput="smooth"          // auto-scroll if user is at the bottom
      increaseViewportBy={400}        // pre-render 400px above/below viewport
    />
  );
}
```

### Grouped virtuoso (utterances by speaker)

```tsx
import { GroupedVirtuoso } from 'react-virtuoso';

const groups = useMemo(() => groupBy(chunks, (c) => c.speaker), [chunks]);
const groupCounts = useMemo(() => Object.values(groups).map((g) => g.length), [groups]);
const flat = useMemo(() => Object.values(groups).flat(), [groups]);

return (
  <GroupedVirtuoso
    groupCounts={groupCounts}
    groupContent={(i) => <div className="speaker-header">{Object.keys(groups)[i]}</div>}
    itemContent={(i) => <div>{flat[i].text}</div>}
  />
);
```

### Performance tips

- `itemContent` must be **stable** (avoid inline factories that close over changing state where unnecessary). Memoize child components.
- Use `<Virtuoso style={{ height: '100%' }} />` inside a flex parent — virtuoso needs an explicit pixel height.
- For very long sessions (10k+ chunks), keep "raw" chunks in IndexedDB / Tauri SQLite and load windows lazily via `range` callbacks.

## Putting it together

```tsx
function MeetingView({ chunks }: { chunks: Chunk[] }) {
  const [doc, setDoc] = useState<string>('');

  return (
    <div className="layout">
      <aside>
        <button onClick={async () => {
          const md = await importDocx();
          if (md) setDoc(md);
        }}>
          Import .docx context
        </button>
        {doc && <MarkdownView content={doc} />}
      </aside>
      <main>
        <TranscriptFeed chunks={chunks} onAppend={(c) => useStore.getState().append(c)} />
      </main>
    </div>
  );
}
```

## Pitfalls

- **mammoth in a Web Worker**: the `arrayBuffer` source works in workers; HTML output via `messages` channel. Move parsing off the main thread for large docs.
- **react-markdown with `dangerouslySetInnerHTML`**: never. Use `rehype-sanitize`.
- **Virtuoso `followOutput: true` always**: locks the user out of scrolling up. Use `followOutput: 'smooth'` with the built-in detection of "at bottom".
- **Re-rendering all chunks because the array reference changes**: append immutably with the same identity for unchanged items, or use `computeItemKey` to give Virtuoso a stable id per row.
- **Loading 200MB .docx**: mammoth reads everything into memory. For huge files, fall back to extracting via a Rust-side crate (`docx-rs`) and stream paragraphs over an IPC channel.
