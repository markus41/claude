---
name: Animation & 3D Layer
description: Use when the user asks about Framer Motion 11, React Three Fiber, drei, postprocessing, Three.js 0.169, or Rive in a desktop app. Covers animation orchestration, 3D scenes, performance budgets in a Tauri webview.
version: 0.1.0
---

# Framer Motion 11 + React Three Fiber + Rive

Three layers of motion in a desktop app:

| Layer | Library | Use for |
|-------|---------|---------|
| 2D layout / micro-interactions | Framer Motion 11 | Page transitions, list reorders, presence, drag, gestures |
| 3D scenes / data viz | React Three Fiber + drei + postprocessing | Real-time 3D, particles, shader effects, point clouds |
| Designer-driven complex animations | Rive | Vector animations with state machines authored in Rive editor |

## Framer Motion 11 — patterns that matter

### `LayoutGroup` + `layoutId` for shared element transitions

```tsx
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

function MeetingList({ meetings, selected, onSelect }) {
  return (
    <LayoutGroup>
      {meetings.map((m) => (
        <motion.div
          key={m.id}
          layout
          layoutId={`meeting-${m.id}`}
          onClick={() => onSelect(m.id)}
        >
          {m.title}
        </motion.div>
      ))}
      <AnimatePresence>
        {selected && (
          <motion.div
            layoutId={`meeting-${selected}`}
            className="detail"
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}
```

### `useMotionValue` + `useTransform` for audio-driven UI

Audio level from a Tauri event → live reactive bar without re-renders:
```tsx
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

export function LevelMeter() {
  const level = useMotionValue(0);
  const width = useTransform(level, [0, 1], ['0%', '100%']);

  useEffect(() => {
    let unlisten = () => {};
    listen<number>('audio:level', (e) => level.set(e.payload)).then((u) => { unlisten = u; });
    return () => unlisten();
  }, [level]);

  return <motion.div className="meter" style={{ width }} />;
}
```
This bypasses React reconciliation — value updates go straight to the DOM each frame. Critical for 60Hz audio meters.

### Reduce-motion compliance

```tsx
import { useReducedMotion } from 'framer-motion';

const prefersReduced = useReducedMotion();
<motion.div animate={prefersReduced ? {} : { x: 100 }} />
```
Always respect; macOS/Windows expose this via accessibility settings and Tauri webviews honor it.

## React Three Fiber + drei

### Canvas with proper DPR and Suspense

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stats } from '@react-three/drei';
import { Suspense } from 'react';

export function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}                    // cap pixel ratio at 2× — saves GPU on retina
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 1.5, 4], fov: 45 }}
      shadows
    >
      <Suspense fallback={null}>
        <Environment preset="studio" />
        <Model url="/models/agent.glb" />
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      </Suspense>
      {import.meta.env.DEV && <Stats />}
    </Canvas>
  );
}
```

### Loading models with DRACO + KTX2 (compressed assets)

```tsx
import { useGLTF } from '@react-three/drei';

useGLTF.preload('/models/agent.glb');                // pre-warm
useGLTF.setDecoderPath('/draco/');                   // serve draco WASM as Tauri resource

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}
```

Serve `draco/` and `basis/` as bundled Tauri resources so they load offline:
```jsonc
"bundle": {
  "resources": ["models/**/*", "draco/**/*", "basis/**/*"]
}
```

### Performance-critical: `useFrame` budget

```tsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

function Spinner() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta;     // delta-based; frame-rate independent
  });
  return <mesh ref={ref}><boxGeometry /><meshStandardMaterial /></mesh>;
}
```

Hard rules:
- **Never allocate inside `useFrame`** (no `new Vector3()`, no `.clone()`). Hoist to refs.
- **Avoid React state changes per frame** — they trigger reconciliation. Mutate refs directly.
- **`<Stats />` in dev only.** It's expensive.
- **`frameloop="demand"`** for static scenes that only animate on interaction:
  ```tsx
  <Canvas frameloop="demand">{...}</Canvas>
  // To trigger a frame: invalidate() from useThree
  ```

## Postprocessing (`@react-three/postprocessing`)

```tsx
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing';

<EffectComposer multisampling={0} disableNormalPass>
  <Bloom intensity={0.6} luminanceThreshold={0.85} />
  <DepthOfField focusDistance={0.01} focalLength={0.05} bokehScale={2} />
  <Vignette eskil={false} offset={0.1} darkness={0.6} />
</EffectComposer>
```

Postprocessing is a **GPU cost multiplier** — each effect is a fullscreen pass. On laptop integrated graphics, two passes max for steady 60fps.

## Rive

Rive runtimes ship vector scenes with state machines + inputs. Use for designer-authored complex animations (loaders, branded micro-interactions, characters).

```tsx
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';

export function VoiceAvatar({ isSpeaking, level }: { isSpeaking: boolean; level: number }) {
  const { rive, RiveComponent } = useRive({
    src: '/rive/voice_avatar.riv',
    stateMachines: 'main',
    autoplay: true,
  });
  const speakingInput = useStateMachineInput(rive, 'main', 'isSpeaking');
  const levelInput = useStateMachineInput(rive, 'main', 'level');     // numeric

  useEffect(() => { if (speakingInput) speakingInput.value = isSpeaking; }, [isSpeaking, speakingInput]);
  useEffect(() => { if (levelInput) levelInput.value = level * 100; }, [level, levelInput]);

  return <RiveComponent style={{ width: 200, height: 200 }} />;
}
```

Rive `.riv` files go in Tauri resources; load via `convertFileSrc` if you need to serve them from `$APPDATA`.

## Performance budget (whole-app)

| Workload | 60 fps cap |
|----------|------------|
| Framer Motion layout transitions | < 50 elements at once with `layout` |
| R3F draw calls per frame | ~100 on integrated GPU, 1000+ on dGPU |
| R3F triangle count | ~250k integrated, ~5M dGPU |
| Postprocessing passes | 2 on integrated, 4+ on dGPU |
| Rive runtime | 60 fps for typical UI scenes; profile if combining > 3 |

## Pitfalls

- **Animating expensive layouts** (`grid`, large lists) with Framer Motion `layout`: jank. Virtualize first.
- **R3F with Suspense fallback inside `Canvas`** but no `Suspense` outside — must wrap Canvas itself (DOM Suspense) AND inside it (3D content).
- **Three.js resource leaks**: dispose geometries/materials/textures on unmount. drei helpers handle this; manual primitives don't.
- **Rive in a hidden tab**: still consumes CPU. Pause via `rive.pause()` when off-screen.
- **High DPI scaling**: cap `dpr` to 2 — 3× retina kills GPU.
