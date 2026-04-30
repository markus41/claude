---
name: Realtime WebSocket (Rust)
description: Use when the user asks about tokio-tungstenite, WebSocket clients in Rust, real-time streaming from a Tauri Rust backend to a Cloudflare Worker / Durable Object, reconnect strategies, or WS authentication.
version: 0.1.0
---

# tokio-tungstenite Real-Time WebSocket Patterns

For desktop apps that stream audio/transcripts to a Worker-hosted Durable Object or other realtime backend.

## Crates

```toml
[dependencies]
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = { version = "0.24", features = ["rustls-tls-webpki-roots"] }
futures-util = "0.3"
http = "1"
url = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
bytes = "1"
backoff = "0.4"
tracing = "0.1"
```

Use `rustls-tls-webpki-roots` to avoid linking OpenSSL (cleaner on Windows) and to use Mozilla's CA bundle.

## Connecting with auth headers

```rust
use http::Request;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use futures_util::{SinkExt, StreamExt};

pub async fn open_session(
    url: &str,
    bearer: &str,
    session_id: &str,
) -> anyhow::Result<()> {
    let req = Request::builder()
        .uri(url)
        .header("Authorization", format!("Bearer {bearer}"))
        .header("X-Session-Id", session_id)
        .header("Sec-WebSocket-Protocol", "lobbi.v1")
        .body(())?;

    let (mut ws, response) = connect_async(req).await?;
    tracing::info!(status = %response.status(), "ws connected");

    let (mut tx, mut rx) = ws.split();
    // hand `tx` to the audio worker, drive `rx` with a recv loop below
    Ok(())
}
```

**Why a custom `Request`** instead of just a URL: WebSocket auth via `Authorization` header isn't possible from a browser, but Tauri's Rust side has no such restriction — use it for clean bearer-token auth.

## Send loop (audio frames as binary)

```rust
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;

async fn send_loop(
    mut tx: impl SinkExt<Message, Error = tokio_tungstenite::tungstenite::Error> + Unpin,
    mut audio_rx: mpsc::Receiver<Vec<u8>>,
) -> anyhow::Result<()> {
    while let Some(chunk) = audio_rx.recv().await {
        tx.send(Message::Binary(chunk.into())).await?;
    }
    tx.send(Message::Close(None)).await?;
    Ok(())
}
```

## Receive loop (typed JSON messages)

```rust
#[derive(Debug, serde::Deserialize)]
#[serde(tag = "type")]
enum ServerMsg {
    #[serde(rename = "transcript")]
    Transcript { is_final: bool, text: String, ts: u64 },
    #[serde(rename = "speaker")]
    Speaker { id: String, confidence: f32 },
    #[serde(rename = "error")]
    Error { code: String, message: String },
}

async fn recv_loop(
    mut rx: impl StreamExt<Item = Result<Message, tokio_tungstenite::tungstenite::Error>> + Unpin,
    app: tauri::AppHandle,
) -> anyhow::Result<()> {
    while let Some(msg) = rx.next().await {
        match msg? {
            Message::Text(t) => {
                let parsed: ServerMsg = serde_json::from_str(&t)?;
                match parsed {
                    ServerMsg::Transcript { is_final, text, ts } => {
                        app.emit("transcript:chunk", serde_json::json!({ "isFinal": is_final, "text": text, "ts": ts }))?;
                    }
                    ServerMsg::Speaker { id, confidence } => {
                        app.emit("speaker:detected", serde_json::json!({ "id": id, "confidence": confidence }))?;
                    }
                    ServerMsg::Error { code, message } => {
                        tracing::warn!(code = %code, message = %message, "server error");
                    }
                }
            }
            Message::Ping(p) => { /* tungstenite auto-pongs by default */ }
            Message::Close(c) => {
                tracing::info!(close = ?c, "ws closed by server");
                break;
            }
            _ => {}
        }
    }
    Ok(())
}
```

## Heartbeat (Ping every 20s)

Cloudflare Workers WebSocket connections idle out around 60s without traffic. Send a ping if the channel is silent:

```rust
use tokio::time::{interval, Duration};

let mut ticker = interval(Duration::from_secs(20));
loop {
    tokio::select! {
        _ = ticker.tick() => {
            tx.send(Message::Ping(Vec::new().into())).await?;
        }
        Some(chunk) = audio_rx.recv() => {
            tx.send(Message::Binary(chunk.into())).await?;
        }
    }
}
```

## Reconnect with backoff

```rust
use backoff::{ExponentialBackoff, future::retry};

let policy = ExponentialBackoff {
    initial_interval: Duration::from_millis(500),
    max_interval: Duration::from_secs(30),
    max_elapsed_time: None,           // forever — desktop apps reconnect indefinitely
    randomization_factor: 0.4,
    multiplier: 2.0,
    ..Default::default()
};

retry(policy, || async {
    open_session(&url, &bearer, &session_id).await
        .map_err(backoff::Error::transient)
}).await?;
```

Reset state on each reconnect. Server-side, the Durable Object must accept a re-attach with the same `session_id` (idempotent).

## Cancellation: tokio_util::sync::CancellationToken

```rust
use tokio_util::sync::CancellationToken;

let cancel = CancellationToken::new();
let cancel_clone = cancel.clone();

let handle = tokio::spawn(async move {
    tokio::select! {
        _ = cancel_clone.cancelled() => {
            tracing::info!("ws cancelled");
            // graceful close
        }
        result = run_session() => {
            if let Err(e) = result { tracing::error!(?e); }
        }
    }
});

// Later, on user logout:
cancel.cancel();
let _ = handle.await;
```

## Backpressure

If the server can't keep up, the local send channel will fill. Use a **bounded `mpsc::channel(64)`** and drop oldest when full:
```rust
if let Err(mpsc::error::TrySendError::Full(_)) = audio_tx.try_send(chunk) {
    tracing::warn!("ws send channel full — dropping audio chunk");
}
```

For audio, dropping is correct behavior — silence is preferable to delayed playback.

## Pitfalls

- **Forgetting `Sec-WebSocket-Protocol`** when the server expects subprotocol negotiation: server returns 426.
- **Default tungstenite max-frame size (16 MiB)**: fine for audio chunks, but if you batch many seconds, configure via `WebSocketConfig`.
- **Awaiting `tx.send` and never reading from `rx`**: pings from the server back up. Always run send + receive in concurrent tasks (split first).
- **Reconnect re-creating duplicate sessions** server-side: include a stable `session_id` in the URL or header so the DO can detect "same client".
- **Holding the WebSocket across an OS sleep/resume**: the connection silently dies. Listen for `tauri-plugin-os` resume events and reconnect.
