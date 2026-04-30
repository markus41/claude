---
name: Deepgram Streaming STT
description: Use when the user asks about Deepgram SDK v3+ live streaming transcription, Nova-3 model, real-time speech-to-text with diarization, or pairing Deepgram with Tauri/Workers AI fallback.
version: 0.1.0
---

# Deepgram Live Streaming STT

Deepgram is the primary STT in the Discovery Co-Pilot stack; Workers AI Whisper-large-v3-turbo is the fallback (via `stt-fallback-worker`).

## Where to run it

| Pattern | Where | Pros | Cons |
|---------|-------|------|------|
| Direct from desktop | Tauri Rust → Deepgram WS | Lowest latency | API key on client (use temporary keys) |
| Via Cloudflare Worker proxy | Tauri → Worker → Deepgram | Hide key, add auth/quota | One extra hop |
| Hybrid: temporary tokens | Worker mints scoped key, Tauri opens WS | Best of both | More plumbing |

For prod, **mint scoped temporary keys server-side** (Worker), then connect directly. Deepgram supports per-project temporary tokens with TTL — fetch one per session.

## Server: Deepgram JS SDK v3+ on a Worker

Use this pattern in `oauth-provider` or a dedicated `deepgram-token-broker` Worker:

```typescript
import { DeepgramClient } from '@deepgram/sdk';

export interface Env {
  DEEPGRAM_API_KEY: string;       // master key, secret
  DEEPGRAM_PROJECT_ID: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Authn first — verify bearer JWT via shared-auth
    const dg = new DeepgramClient({ apiKey: env.DEEPGRAM_API_KEY });

    // Mint a 5-minute scoped key for this user session
    const { result, error } = await dg.manage.v1.createProjectKey(env.DEEPGRAM_PROJECT_ID, {
      comment: `live-stt for ${userId} session ${sessionId}`,
      scopes: ['usage:write'],
      time_to_live_in_seconds: 300,
    });
    if (error) return new Response(error.message, { status: 502 });

    return Response.json({
      key: result.key,
      keyId: result.api_key_id,
      expiresAt: Date.now() + 300_000,
    });
  }
};
```

Client requests a fresh token before opening a session; key auto-expires.

## Client: live transcription via Deepgram JS SDK v5

(SDK v5 is current; v3 patterns still work but v5 typings are tighter. Note: **string booleans** are required for many params.)

```typescript
import { DeepgramClient } from '@deepgram/sdk';

export async function startLiveTranscription(opts: {
  apiKey: string;
  onTranscript: (text: string, isFinal: boolean) => void;
  onSpeaker: (speaker: number) => void;
  onError: (e: Error) => void;
}) {
  const client = new DeepgramClient({ apiKey: opts.apiKey });

  const conn = await client.listen.v1.connect({
    model: 'nova-3',                  // current best general-purpose
    language: 'en',
    punctuate: 'true',
    interim_results: 'true',
    smart_format: 'true',
    diarize: 'true',
    endpointing: '500',               // ms of silence to trigger is_final
    vad_events: 'true',               // voice-activity-detection events
    utterance_end_ms: '1000',         // end-of-utterance detector
    keywords: 'Lobbi:5,Discovery:5',  // boost custom vocab (term:weight)
  });

  conn.on('open', () => console.log('DG connected'));

  conn.on('message', (data) => {
    if (data.type === 'Results') {
      const alt = data.channel?.alternatives?.[0];
      if (alt?.transcript) {
        opts.onTranscript(alt.transcript, !!data.is_final);
        if (alt.words?.[0]?.speaker !== undefined) {
          opts.onSpeaker(alt.words[0].speaker);
        }
      }
    } else if (data.type === 'UtteranceEnd') {
      // Natural conversation boundary — flush UI / synthesize
    } else if (data.type === 'SpeechStarted') {
      // Begin showing "listening" UI
    } else if (data.type === 'Metadata') {
      console.log('DG session', data.transaction_key);
    }
  });

  conn.on('error', (e) => opts.onError(e));
  conn.on('close', () => console.log('DG closed'));

  conn.connect();
  await conn.waitForOpen();

  // Returns a "send" handle; pipe in audio chunks (16-bit PCM @ 16kHz recommended)
  return {
    send(audio: ArrayBuffer | Uint8Array) {
      conn.sendMedia(audio);
    },
    keepAlive() {
      conn.socket.send(JSON.stringify({ type: 'KeepAlive' }));
    },
    finalize() {
      conn.sendFinalize({ type: 'Finalize' });
    },
    close() {
      conn.socket.send(JSON.stringify({ type: 'CloseStream' }));
      conn.close();
    },
  };
}
```

## Audio format

- 16-bit signed PCM, mono, 16000 Hz is the sweet spot
- Send small chunks (250 ms at most) for low latency
- If you have 48 kHz from cpal, downsample first (rubato or simple decimation)

## KeepAlive

If the user pauses speaking for > 10s, send `{ type: 'KeepAlive' }` to prevent Deepgram closing the socket:

```typescript
const keepAliveTimer = setInterval(() => session.keepAlive(), 5000);
// Clear on close
```

## Whisper fallback (Workers AI)

If Deepgram errors or rate-limits, fall back to Workers AI Whisper. Buffer the last N seconds of audio in a ring buffer; on Deepgram error, ship the buffer to `stt-fallback-worker`:

```typescript
// stt-fallback-worker
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const audio = await req.arrayBuffer();
    const result = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: [...new Uint8Array(audio)],
    });
    return Response.json(result);
  }
};
```

Whisper is non-streaming, so you eat ~500ms-1s extra latency, but the fallback is graceful.

## Speaker diarization

With `diarize: 'true'`, each `word` in `alternatives[0].words` carries a `speaker: number`. Combine with ECAPA-TDNN local embeddings (from the Rust audio pipeline skill) to map Deepgram speaker indices to your stable `userId` set:

```
Deepgram speaker=2 (transient) ↔ ECAPA cosine similarity 0.83 to "alice" → label = "alice"
```

## Pitfalls

- **String booleans**: SDK v5 expects `'true'`/`'false'` for many params. Numeric strings for ms.
- **Connecting from a Worker via `fetch`**: Workers don't support arbitrary outbound WebSocket clients via `fetch` upgrade. Use the SDK only from Node-style runtimes (desktop) or use Workers' `fetch(...)` upgrade with `Upgrade: websocket` for proxying.
- **Re-using a closed connection**: each session = one `connect()`. Tear down on close.
- **Forgetting `interim_results`**: you only see transcripts on `is_final` (per second-ish) — UI feels sluggish.
- **Keywords boost**: weight cap is roughly 10. Above that, accuracy drops.
- **Token leak**: never embed the master API key in the desktop binary. Mint short-lived scoped keys server-side per session.
