# Hand-Tracking Galaxy

An interactive 3D spiral galaxy built with React, Three.js, and MediaPipe. You can drag the scene with a mouse, watch an automatic cinematic camera, or control the camera with your hand through a webcam: move your hand to orbit the galaxy and pinch your thumb and index finger to zoom.

The project is currently named `react-vite-tailwind` in `package.json` and is a single-page, client-only WebGL application.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [How the Application Works](#how-the-application-works)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Clone the Repository](#clone-the-repository)
- [Install Dependencies](#install-dependencies)
- [Development Server](#development-server)
- [Production Build](#production-build)
- [Preview the Production Build](#preview-the-production-build)
- [Available Scripts](#available-scripts)
- [Webcam Permissions and Browser Requirements](#webcam-permissions-and-browser-requirements)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Known Limitations](#known-limitations)
- [License](#license)
- [Contributing](#contributing)

---

## Overview

Hand-Tracking Galaxy renders a procedurally generated spiral galaxy in the browser and lets the user explore it in three ways:

1. **Cinematic mode** — an automatic, slowly drifting camera orbits and weaves around the galaxy.
2. **Manual mode** — drag to orbit and scroll to zoom with standard Three.js orbit controls.
3. **Hand-control mode** — the webcam tracks one hand; the palm position steers the camera around the galaxy and a thumb-to-index pinch controls zoom.

There is no server, database, or backend. All rendering, procedural generation, and hand-landmark inference happen in the browser. The MediaPipe runtime and model, however, are downloaded from public CDNs at runtime (see [Webcam Permissions and Browser Requirements](#webcam-permissions-and-browser-requirements)).

## Features

- **Procedural spiral galaxy** — a `THREE.Points` cloud (default 90,000 stars, adjustable up to 200,000) generated from branch, spin, radius, and randomness parameters. Stars are colored by lerping between an inner and outer color, and rendered with additive blending.
- **Orbiting planets** — 0 to 16 procedural planets on tilted orbits, with emissive materials and optional rings.
- **Glowing galactic core** — an emissive sphere with a pulsing scale plus a point light.
- **Starfield background** — 4,000 distant stars via `@react-three/drei`'s `Stars`.
- **Three camera modes** — cinematic auto-camera, mouse orbit controls, and hand-driven camera.
- **Hand tracking** — one-hand tracking through MediaPipe `HandLandmarker`; palm position maps to orbit azimuth/elevation and a pinch gesture maps to camera zoom.
- **Live hand preview** — a mirrored webcam feed with a drawn hand-skeleton overlay (joints and connections).
- **Control panel** — live sliders for star count, radius, branches, spin, randomness, and star size; toggles for the X-axis tumble and cinematic camera; a planet-count slider; four color presets; core/edge color pickers; and a reset button.

> Note: an on-screen instruction pill ("Move hand to orbit · pinch to zoom") exists in `src/App.tsx` but is currently commented out, so it is not visible in the UI.

## Technology Stack

| Technology | Version (as declared) | Role in this project |
| --- | --- | --- |
| [React](https://react.dev/) | 19.2.6 | UI rendering and state for the control panel and app shell. |
| [react-dom](https://react.dev/) | 19.2.6 | Mounts the React app in `src/main.tsx`. |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | Type-safe source; `tsconfig.json` is used for editor/type checking. |
| [Vite](https://vite.dev/) | 7.3.2 | Dev server and production bundler. |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | 5.1.1 | React Fast Refresh / JSX transform in Vite. |
| [Three.js](https://threejs.org/) | 0.186.0 | WebGL 3D engine; all geometry, materials, and math. |
| [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) | 9.7.0 | React renderer for Three.js (`Canvas`, `useFrame`, `useThree`). |
| [@react-three/drei](https://github.com/pmndrs/drei) | 10.7.8 | Helpers used: `Stars` and `OrbitControls`. |
| [@mediapipe/tasks-vision](https://developers.google.com/mediapipe) | ^1.0.1 | `FilesetResolver` and `HandLandmarker` for webcam hand tracking. |
| [Tailwind CSS](https://tailwindcss.com/) | 4.1.17 | Utility-class styling. Loaded through the `@tailwindcss/vite` plugin. |
| [@tailwindcss/vite](https://tailwindcss.com/) | 4.1.17 | Tailwind v4 Vite integration. |
| [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) | 2.3.0 | Inlines all JS and CSS into a single `dist/index.html`. |
| [@types/node](https://www.npmjs.com/package/@types/node) | 22.19.17 | Node types for `vite.config.ts`. |

### Installed but not actively used

- **`clsx` (2.1.1)** and **`tailwind-merge` (3.4.0)** — a `cn()` helper is defined in `src/utils/cn.ts`, but that helper is not imported anywhere in the application. These packages are therefore currently unused.
- **`@types/three`** — type definitions for Three.js, used for editor/type checking only.

## How the Application Works

### 1. Startup

`src/main.tsx` mounts `<App />` into `#root` inside React `StrictMode`. `App` renders a full-screen `@react-three/fiber` `<Canvas>` with a dark background, fog, and several scene components. The camera starts at `[4, 4, 6]` with a 60° field of view. Hand tracking is **not** started automatically — it begins only when the user clicks the "Control with your hand" button.

### 2. Scene composition

Inside the canvas:

- `CoreGlow` — emissive core sphere with a pulsing scale and a `pointLight`.
- `Galaxy` — the spiral point cloud.
- `Planets` — orbiting planets.
- `HandCameraController` — active only while hand tracking runs.
- `CinematicCamera` — active when cinematic mode is on and hand tracking is off.
- `OrbitControls` — rendered only when both cinematic mode and hand tracking are off.
- `Stars`, `ambientLight`, background color, and fog.

### 3. Webcam permission and initialization

Clicking the hand-control button calls `start()` in `src/useHandTracking.ts`, which:

1. Creates a `HandLandmarker` (once) with `runningMode: "VIDEO"`, `numHands: 1`, and the `"GPU"` delegate. The WASM fileset is resolved from the jsDelivr CDN and the `.task` model is fetched from `storage.googleapis.com` (see the CDN caveat below).
2. Requests the webcam with `navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } })`.
3. Assigns the stream to the hidden `<video>` element inside `HandOverlay` and plays it.

### 4. Hand detection and landmark processing

A `requestAnimationFrame` loop runs while tracking is active. Each new video frame is passed to `landmarker.detectForVideo(video, timestamp)`. For the first detected hand:

- Landmark X coordinates are mirrored (`1 - p.x`) so the experience matches a mirror.
- `thumb = landmark[4]`, `index = landmark[8]`, `wrist = landmark[0]`, `middleMcp = landmark[9]`.
- The palm center is the midpoint of `wrist` and `middleMcp`.
- Hand size is `dist(wrist, middleMcp)`; pinch distance `dist(thumb, index)` is normalized by hand size.
- The normalized distance is mapped to a `pinch` value in `0..1` (`1` = fully pinched), and `pinching` becomes `true` when `pinch > 0.6`.

Results are written to a mutable module-level singleton `handState` (`present`, `x`, `y`, `pinch`, `pinching`, `landmarks`) that the 3D layer reads.

### 5. Gesture / position mapping

`src/HandCameraController.tsx` reads `handState` every frame and smooths it:

- **Palm X** (`0..1`) → orbit azimuth, mapped to roughly ±π.
- **Palm Y** (`0..1`) → orbit elevation, clamped to ±1.2 radians to avoid flipping.
- **Pinch** (`0..1`) → camera radius, interpolated between `14` (open hand) and `3.5` (pinched).
- When no hand is detected, the azimuth slowly drifts as a cinematic idle.

The only recognized gesture is **pinch-to-zoom**. There is no other gesture logic in the codebase.

### 6. Galaxy rendering and animation

`src/Galaxy.tsx` builds a `BufferGeometry` with `position`, `color`, and `aScale` attributes. Star positions are computed from per-star radius, branch angle, spin, and signed randomness; colors lerp from the inside color to the outside color as radius increases. The geometry is memoized on the params object, so changing a slider regenerates the cloud.

In `useFrame`, the galaxy is constrained to rotate **only around the X axis**. When `tumble` is on it rocks via `sin(t * 0.5)`; otherwise it eases to a fixed tilt. Planets orbit and spin on their own in `src/Planets.tsx`.

### 7. Cleanup

`stop()` cancels the animation frame, stops all media tracks, clears `video.srcObject`, resets `handState`, and sets status back to `idle`. It is also called by the hook's `useEffect` cleanup on unmount. **The `HandLandmarker` instance is not closed/disposed** when tracking stops; it is cached and reused on the next start, and released only when the page is unloaded.

### CDN dependency caveat

The runtime MediaPipe assets are loaded from external URLs, not from the installed npm package:

- WASM fileset: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm`
- Model: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`

The WASM path is pinned to **0.10.3** while `package.json` declares `@mediapipe/tasks-vision` `^1.0.1`. These are not guaranteed to match. This also means the first hand-tracking start **requires network access**, and the app cannot be fully offline unless those assets are vendored locally.

## Project Structure

```
hand-tracking-galaxy/
├── index.html                     # Vite HTML entry; mounts #root
├── package.json                   # Name, scripts, dependencies (name: react-vite-tailwind)
├── tsconfig.json                  # TypeScript config (bundler mode, @/* path alias)
├── vite.config.ts                 # React + Tailwind + single-file plugins, @ alias
├── yarn.lock                      # Yarn lockfile (present locally; gitignored — see note)
├── .gitignore                     # Ignores node_modules and yarn.lock
└── src/
    ├── main.tsx                   # React entry, StrictMode + createRoot
    ├── App.tsx                    # App shell, Canvas, control panel, presets, hand toggle
    ├── index.css                  # Tailwind import, base styles, custom slider styling
    ├── Galaxy.tsx                 # Procedural spiral galaxy + GalaxyParams/defaults
    ├── Planets.tsx                # Orbiting procedural planets with optional rings
    ├── CoreGlow.tsx               # Pulsing emissive core + point light
    ├── CinematicCamera.tsx        # Automatic orbiting camera
    ├── HandCameraController.tsx   # Hand-driven orbit/zoom camera
    ├── HandOverlay.tsx            # Mirrored webcam preview + hand skeleton canvas
    ├── useHandTracking.ts         # MediaPipe setup, detection loop, handState singleton
    └── utils/
        └── cn.ts                  # clsx + tailwind-merge helper (currently unused)
```

There is no `public/` directory and no committed test, lint, or CI configuration.

## Prerequisites

- **Node.js** — a version supported by Vite 7 (Node.js 20.19+ or 22.12+; Node 24 was used to verify this README).
- **npm** or **Yarn** — whichever matches your workflow (see the lockfile note below).
- A **webcam** and a modern Chromium-based browser (Chrome/Edge) or another browser with `getUserMedia` and WebAssembly/WebGL support, for hand control.
- **Network access** for the first hand-tracking start, to download the MediaPipe WASM runtime and model from their CDNs.

## Clone the Repository

Clone over HTTPS:

```bash
git clone https://github.com/codepaila/hand-tracking-galaxy.git
cd hand-tracking-galaxy
```

If that URL is not reachable for you, replace it with your own fork or mirror:

```bash
git clone <YOUR_REPOSITORY_URL>
cd hand-tracking-galaxy
```

## Install Dependencies

```bash
npm install
```

or:

```bash
yarn install
```

**Lockfile note:** A `yarn.lock` exists in the working tree, but `.gitignore` ignores `yarn.lock`, so it is **not committed**. A fresh clone therefore has no committed lockfile, and dependency resolution is not pinned by the repository. `yarn` was used to produce the existing local `yarn.lock`; both package managers work with the committed `package.json`. Pick one and stay consistent — avoid mixing npm and Yarn in the same checkout to prevent divergent `node_modules` and lockfiles.

## Development Server

```bash
npm run dev
```

or:

```bash
yarn dev
```

Vite prints a local URL (typically `http://localhost:5173/`). Open it in your browser. `localhost` counts as a secure context, so webcam access works there during development. Use the URL Vite actually reports if the default port is taken.

## Production Build

```bash
npm run build
```

or:

```bash
yarn build
```

This runs `vite build`. Because `vite-plugin-singlefile` is enabled in `vite.config.ts`, all JavaScript and CSS are inlined into a **single output file**:

```
dist/index.html
```

The verified build output is a single `dist/index.html` of roughly 1.3 MB (about 370 KB gzipped). There is no `dist/assets/` directory, because the single-file plugin removes separate chunks. No custom `base` path is configured in `vite.config.ts`.

## Preview the Production Build

```bash
npm run preview
```

or:

```bash
yarn preview
```

This runs `vite preview` and serves the contents of `dist/` locally. It is intended to verify the production build, **not** to act as a production web server.

## Available Scripts

Defined in `package.json`:

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Start the Vite development server with HMR. |
| `build` | `vite build` | Create the production bundle in `dist/`. |
| `preview` | `vite preview` | Serve the built `dist/` locally for verification. |

There are **no** `start`, `lint`, `test`, or `typecheck` scripts. This is a client-only Vite application; it uses `dev`, `build`, and `preview` only. There is also no `tsc` step in `build`, so `vite build` does not fail on TypeScript type errors — type checking relies on `tsconfig.json` in your editor.

## Webcam Permissions and Browser Requirements

### Granting camera permission

Hand tracking starts only after you click the hand-control button. On first use, the browser prompts for camera access. Choose **Allow**. If you previously blocked it, reset the permission for the site:

- **Chrome/Edge:** click the camera icon in the address bar → *Site settings* → set Camera to **Allow**, then reload.

### Why webcam access is needed

`useHandTracking.ts` calls `navigator.mediaDevices.getUserMedia` to read video frames. MediaPipe then detects hand landmarks from those frames to drive the camera.

### Secure context (localhost or HTTPS)

Browsers only expose `getUserMedia` in a **secure context**. Use `http://localhost` (or `http://127.0.0.1`) for development, and **HTTPS** for any deployed environment. Serving the built app over plain HTTP on a remote host will block the camera.

### Browser compatibility

The app relies on `navigator.mediaDevices.getUserMedia`, WebAssembly, WebGL, and the MediaPipe GPU delegate. Modern Chromium-based browsers (Chrome, Edge) are the most reliable. Safari and Firefox support the underlying APIs but may differ in GPU-delegate behavior.

### Is processing local?

MediaPipe's `HandLandmarker` runs **in the browser** via WebAssembly/the GPU delegate; video frames are fed to the local inference engine and are not uploaded to an application backend (there is none). However, the WASM runtime and the `.task` model are downloaded from `cdn.jsdelivr.net` and `storage.googleapis.com` at runtime, so the app is **not** fully offline and does make network requests to those hosts. The webcam preview is drawn to a mirrored `<video>` and a local `<canvas>`.

### If the webcam opens but no hand is detected

- Make sure your hand is clearly in frame and well lit; avoid strong backlighting.
- Hold your hand roughly at arm's length, palm toward the camera.
- Keep a single hand in view (only one hand is tracked, `numHands: 1`).
- Confirm the browser console shows no MediaPipe/WASM loading errors (a network or CDN failure prevents detection).
- Avoid low-light conditions, fast motion, and heavy occlusion of fingers.

### Required runtime assets and network

On start, these external resources are required:

- `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm` (WASM runtime)
- `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` (model)

If a firewall, ad blocker, or offline environment blocks these, hand tracking will fail even though the galaxy still renders.

## Environment Configuration

**No environment variables are required.** The source contains no `import.meta.env` or `process.env` usage, there is no `.env` file, and `vite.config.ts` defines no environment-dependent behavior. Do not create a `.env` file unless you intentionally add such configuration.

## Deployment

1. **Build:** run `npm run build` (or `yarn build`). The output is a single self-contained file at `dist/index.html` with all JS and CSS inlined.
2. **Host:** upload `dist/index.html` to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3 + CDN, etc.). Because everything is inlined, there are no separate asset files to configure, and relative subdirectory hosting generally works without a `base` path.
3. **HTTPS:** the deployed site **must** be served over HTTPS for webcam access to work. Plain HTTP remote hosting will break hand tracking.
4. **Network access:** the hosting environment/end users must be able to reach the MediaPipe CDN and model URLs listed above.
5. **No server needed:** there is no backend, database, or build-time server. Do not add one for this app.

> `vite preview` is a local verification tool only — do not use it as a production server.

There is no official demo URL or screenshot committed to this repository.

## Troubleshooting

### Dependency installation errors

- Ensure your Node version satisfies Vite 7 (Node.js 20.19+ / 22.12+). Node 24 was used for verification.
- Delete `node_modules` and reinstall. If you switch package managers, remove the other manager's lockfile first to avoid conflicts.
- If the mirror/registry is unreachable, configure your npm/Yarn registry appropriately.

### Vite startup errors

- A port conflict will make Vite pick another port; use the URL it prints.
- Delete stale `node_modules/.vite` cache if you see odd HMR or transform errors, then restart.

### TypeScript / build errors

- `vite build` does **not** type-check, so type errors surface in your editor via `tsconfig.json` (which enables `strict`, `noUnusedLocals`, and `noUnusedParameters`). Unused imports/locals will be flagged by the editor but will not fail the build.
- If `@/...` imports fail, confirm the `@` alias exists in both `vite.config.ts` and `tsconfig.json`.

### Webcam permission problems

- Use `localhost` or HTTPS.
- Re-enable camera permission in site settings and reload.
- Confirm no other application is exclusively holding the webcam.

### MediaPipe initialization failures

This is a **confirmed runtime dependency**: the WASM and model are fetched from external CDNs (and the WASM version is pinned to `0.10.3` while the npm package declares `^1.0.1`). A network failure or version mismatch here is the most likely cause of a "Failed to start hand tracking" error. Check the browser console/network tab for blocked requests to `cdn.jsdelivr.net` or `storage.googleapis.com`.

### Hand landmarks not detected

See [If the webcam opens but no hand is detected](#if-the-webcam-opens-but-no-hand-is-detected). Additionally, some GPUs/drivers may reject the `"GPU"` delegate; if detection never produces results, this is a candidate cause (the code has no CPU fallback).

### Galaxy rendering or performance issues

- The star-count slider goes up to 200,000 points with additive blending, which can be heavy on integrated GPUs. Lower the count if the frame rate drops.
- WebGL and the GPU delegate should be accelerated by the browser; software rendering will be slow.

### Incorrect production asset paths

The single-file build inlines everything into `dist/index.html`, so asset-path issues are unlikely. If you deploy under a subdirectory and something breaks, verify the host is serving that file at the expected path; the project does not configure a Vite `base`.

## Known Limitations

- **One hand only** (`numHands: 1`).
- **Only one gesture** — pinch maps to zoom. There is no fist/open-palm or other gesture logic.
- **Landmarker not disposed** on stop; it is cached until page unload.
- **No CPU fallback** if the GPU delegate fails to initialize.
- **CDN/version mismatch** between the installed `@mediapipe/tasks-vision` (`^1.0.1`) and the WASM path loaded at runtime (`0.10.3`).
- **Unused code/dependencies:** `src/utils/cn.ts` and its `clsx` / `tailwind-merge` dependencies are not used by the app.
- **No tests, linting, or CI** are configured.
- **Package name** is `react-vite-tailwind`, not `hand-tracking-galaxy`.
- **`yarn.lock` is gitignored**, so dependency versions are not pinned for fresh clones.
- The hand-control hint text is commented out in `App.tsx`.

## License

No `LICENSE` file exists in this repository. In the absence of a license, the default is that all rights are reserved by the copyright holder; you should not assume the project is open source or freely reusable. If you intend to distribute or reuse it, confirm licensing with the repository owner or add a license file.

## Contributing

There is currently no contribution guide, issue template, or CI. If you contribute, keep the existing structure and conventions, avoid mixing package managers, and do not commit a lockfile without updating `.gitignore` accordingly. For substantial changes, open an issue or discuss with the maintainer first.

---

### Validation performed

- Inspected all tracked source and config files.
- Confirmed build output with `yarn build` (single `dist/index.html`, ~1.3 MB / ~370 KB gzipped); the generated `dist/` was removed afterward to leave the repository unchanged.
- Confirmed no environment-variable usage, no `public/` directory, no license file, and no test/lint/CI configuration.
- Confirmed `cn`/`clsx`/`tailwind-merge` are currently unused.
