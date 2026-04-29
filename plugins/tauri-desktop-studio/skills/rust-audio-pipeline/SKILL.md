---
name: Rust Audio Pipeline
description: Use when the user asks about cpal, WASAPI loopback capture, microphone input, RNNoise denoising, audio ring buffers, lock-free audio threading, or real-time audio in Rust/Tauri.
version: 0.1.0
---

# Real-Time Audio Pipeline (Rust)

For desktop apps that capture and process system audio + mic in real time (transcription, speaker ID, VAD).

## Crate stack

```toml
[dependencies]
cpal = "0.15"
nnnoiseless = "0.5"          # pure-Rust RNNoise port
crossbeam-channel = "0.5"
parking_lot = "0.12"
bytes = "1"
tokio = { version = "1", features = ["full"] }
```

## Architecture: never block the audio thread

```
[ cpal callback (RT thread) ]
        │
        │  crossbeam-channel::Sender<f32 chunk>   (bounded, drop on full)
        ▼
[ tokio worker (async) ]
        │
        │  nnnoiseless denoise → resample → VAD → ECAPA-TDNN
        ▼
[ tauri event "audio:transcript" → renderer ]
```

The cpal callback runs on a real-time OS thread. It must do **only**: sample type conversion + bounded channel send. No allocations, no locks, no logging.

## Device enumeration (mic + WASAPI loopback)

```rust
use cpal::traits::{DeviceTrait, HostTrait};

let host = cpal::default_host();
let mics: Vec<_> = host.input_devices()?.collect();
let speakers_loopback: Vec<_> = host.output_devices()?
    .filter_map(|d| d.name().ok().map(|n| (n, d)))
    .collect();

// On Windows, output devices double as loopback sources via WASAPI.
let loopback_device = host.default_output_device().ok_or("no output")?;
let supported_config = loopback_device.default_output_config()?;
```

## Capture loop

```rust
use cpal::{Sample, SampleFormat};
use crossbeam_channel::bounded;

let (tx, rx) = bounded::<Vec<f32>>(64);   // ~1 sec at 64 chunks of 256 samples

let stream = device.build_input_stream(
    &config.into(),
    move |data: &[f32], _| {
        // RT thread — keep it minimal.
        let _ = tx.try_send(data.to_vec());  // drop if consumer is behind
    },
    |err| eprintln!("audio err: {err}"),
    None,
)?;
stream.play()?;

// Move `stream` into AppState so it lives as long as the session.
```

## RNNoise denoising

```rust
use nnnoiseless::DenoiseState;

let mut denoiser = DenoiseState::new();
let mut out = [0.0f32; DenoiseState::FRAME_SIZE];   // 480 samples @ 48 kHz

while let Ok(chunk) = rx.recv_async().await {
    for frame in chunk.chunks_exact(DenoiseState::FRAME_SIZE) {
        denoiser.process_frame(&mut out, frame);
        // out is now denoised — feed to VAD.
    }
}
```

## Sample-rate conversion

cpal gives you the device's native rate (often 48 kHz). VAD and Whisper want 16 kHz. Use `rubato` (better quality) or a simple decimation if quality permits:
```rust
// 48 kHz → 16 kHz by averaging triplets
let resampled: Vec<f32> = chunk
    .chunks_exact(3)
    .map(|c| (c[0] + c[1] + c[2]) / 3.0)
    .collect();
```

## Common pitfalls

- **Allocating in the cpal callback**: causes audible glitches. Use a pre-sized `Vec` and `extend_from_slice` if you must own the data, or `try_send(data.to_vec())` while accepting that you allocate (fine on Windows; risky on macOS/Linux at low latency).
- **Unbounded channel**: leak risk if the consumer stalls. Bounded + `try_send` with drop is the right default.
- **Holding a `Mutex` in the callback**: can priority-invert with the audio thread. Use `parking_lot::RwLock` only outside the callback.
- **Forgetting `stream.play()`**: building the stream doesn't start it.
- **Linux**: ALSA loopback isn't standard; you typically need PulseAudio or PipeWire monitor sources.
