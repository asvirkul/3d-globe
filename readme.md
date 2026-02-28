# GlobeEngine

Modular Three.js-based globe rendering engine with layered architecture, controller lifecycle management and safe WebGL teardown.

Designed for scalable 3D globe applications (country highlighting, dynamic layers, zoom-aware systems, etc.).

---

## Installation

```bash
npm install
```

---

## Development

```bash
npm run dev
```

---

## Basic Usage

```ts
import { GlobeEngine } from './engine/GlobeEngine'

const engine = new GlobeEngine(container)

engine.start()

// later
engine.stop()

// when cleaning up
engine.destroy()
```

---

## Engine Lifecycle

| Method      | Description |
|-------------|------------|
| `start()`   | Starts the render loop |
| `stop()`    | Stops the render loop |
| `destroy()` | Fully disposes scene, controllers, geometries, materials, textures and WebGL context |

The engine is safe for SPA usage and supports clean re-initialization.

---

## Architecture

### Core
- **GlobeEngine** — render loop, scene, camera, renderer and lifecycle management

### Controllers

Controllers are lifecycle-aware modules:

```ts
export type Controller = {
  update(delta: number): void
  dispose?(): void
  onResize?(width: number, height: number): void
}
```

They:
- receive frame updates
- can react to container resize
- clean up resources on engine destruction

Example controllers:
- CameraController
- OrbitController
- LightController
- StarsController
- CloudController

---

### Scene Objects

Encapsulated Three.js scene components:

- Earth mesh
- Cloud layers
- Star field
- Light overlay
- Country borders layer

---

## Resize Handling

- Uses `ResizeObserver`
- Container-based resize (not window-based)
- Safe for React / dynamic layouts
- Pixel ratio capped for performance

---

## Memory Safety

`destroy()` performs:

- Controller disposal
- Geometry disposal
- Material disposal
- Texture disposal
- Scene clearing
- WebGL context loss
- DOM cleanup

Prevents WebGL memory leaks.