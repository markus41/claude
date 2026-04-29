---
name: ONNX Runtime Inference
description: Use when the user asks about ort 2.0-rc.12, ONNX Runtime in Rust, Silero VAD, ECAPA-TDNN speaker embeddings, or running on-device ML in a Tauri/Rust app.
version: 0.1.0
---

# On-Device ML Inference with `ort` 2.0

`ort` is the Rust binding for ONNX Runtime. Version `2.0-rc.12` is current API; `1.x` API is incompatible.

## Cargo

```toml
[dependencies]
ort = { version = "2.0.0-rc.12", features = ["load-dynamic"] }
ndarray = "0.15"
```

`load-dynamic` defers ONNX Runtime resolution to runtime — let users supply the DLL/dylib via `ORT_DYLIB_PATH`, or bundle it as a Tauri resource. The default `download-binaries` feature pulls the lib at build time but inflates binary size and may fail in offline CI.

## Session setup (load once, reuse)

```rust
use ort::{
    session::{Session, builder::GraphOptimizationLevel},
    execution_providers::CPUExecutionProvider,
};
use std::sync::Arc;

pub struct InferenceState {
    pub vad: Arc<Session>,
    pub speaker: Arc<Session>,
}

pub fn load_models(resource_dir: &Path) -> ort::Result<InferenceState> {
    let vad = Session::builder()?
        .with_optimization_level(GraphOptimizationLevel::Level3)?
        .with_intra_threads(1)?           // VAD is tiny; single thread reduces latency
        .commit_from_file(resource_dir.join("silero_vad.onnx"))?;

    let speaker = Session::builder()?
        .with_optimization_level(GraphOptimizationLevel::Level3)?
        .with_execution_providers([CPUExecutionProvider::default().build()])?
        .commit_from_file(resource_dir.join("ecapa_tdnn.onnx"))?;

    Ok(InferenceState {
        vad: Arc::new(vad),
        speaker: Arc::new(speaker),
    })
}
```

Call once during `tauri::Builder::default().setup(|app| { ... })` and `app.manage(state)`.

## Silero VAD (per-frame voice detection)

Silero VAD takes 512 samples @ 16 kHz, returns probability of speech.
```rust
use ndarray::{Array1, Array2};

pub fn is_speech(session: &Session, frame_16k: &[f32], state_h: &mut Array2<f32>, state_c: &mut Array2<f32>) -> ort::Result<f32> {
    let input = Array1::from_vec(frame_16k.to_vec()).insert_axis(ndarray::Axis(0));
    let sr = ndarray::Array0::from_elem((), 16000_i64);

    let outputs = session.run(ort::inputs![
        "input" => input,
        "sr" => sr,
        "h" => state_h.view(),
        "c" => state_c.view(),
    ]?)?;

    let prob: f32 = outputs["output"].try_extract_tensor::<f32>()?[[0, 0]];
    *state_h = outputs["hn"].try_extract_tensor::<f32>()?.to_owned().into_dimensionality()?;
    *state_c = outputs["cn"].try_extract_tensor::<f32>()?.to_owned().into_dimensionality()?;
    Ok(prob)
}
```
Threshold ~0.5 for speech start, ~0.35 for end (hysteresis). Reset `h`/`c` to zeros between sessions.

## ECAPA-TDNN speaker embeddings

ECAPA-TDNN takes mel-filterbank features (80-dim) and emits a 192-dim embedding. Cosine similarity > ~0.65 = same speaker.
```rust
let mfcc = compute_logmel(audio_16k, n_mels=80, win=400, hop=160);   // shape (80, T)
let input = Array2::from(mfcc).insert_axis(ndarray::Axis(0));         // (1, 80, T)
let outputs = session.run(ort::inputs!["feats" => input]?)?;
let emb: Vec<f32> = outputs["embedding"].try_extract_tensor::<f32>()?.iter().copied().collect();
// L2 normalize before cosine.
```

## Threading

- ONNX Runtime sessions are **`Send + Sync`** in `ort` 2.x — share via `Arc<Session>` across tokio tasks.
- Run inference on a `tokio::task::spawn_blocking` task: it's CPU-heavy and would block the runtime if put on a regular task.

## Bundling models with Tauri

In `tauri.conf.json`:
```json
"bundle": {
  "resources": ["models/silero_vad.onnx", "models/ecapa_tdnn.onnx"]
}
```
Resolve at runtime:
```rust
let resource_path = app.path().resolve("models/silero_vad.onnx", BaseDirectory::Resource)?;
```

## Pitfalls

- **rc.12 API change**: `Session::run` takes `ort::inputs![]?` (note the `?`), not `vec![]`. Older snippets use `Value::from_array` — that's pre-rc.
- **Loading model from `Vec<u8>`**: use `Session::builder()?.commit_from_memory(&bytes)?` if you ship the model embedded.
- **GPU on desktop**: `CUDAExecutionProvider` requires a matching CUDA install on the user's machine; for distribution stick with CPU + maybe DirectML on Windows.
