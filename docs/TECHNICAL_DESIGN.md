# Technical design / architecture

**Runtime:** desktop browser, Canvas2D + Web Audio API + ES modules. **Build:** no external runtime dependency, no bundler, Node 20+ for the local server and built-in tests.

## Modules and ownership
- `src/content.js`: immutable specification tables; chapter IDs, prompts, narrative, weapons, enemy stats, difficulties and achievements.
- `src/simulation.js`: deterministic level generation and game rules; map BFS, LOS, movement, combat, enemy state machines, progression. This module is DOM-free and unit-tested with Node.
- `src/render.js`: software-rendered pseudo-3D raycasting, procedural wall textures and enemy/item billboards, PS1-style post effects, minimap and weapon art.
- `src/audio.js`: AudioContext mixer, synthesized interactive effects, drone layers and WAV loop playback with fallbacks.
- `src/main.js`: DOM UI state machine, keyboard/mouse, Pointer Lock, menu routes, pause, checkpoints, localStorage, achievements and render/audio event bridge.
- `scripts/server.mjs`: development HTTP server with path traversal protection and MIME mapping.

## Game state and transition contracts
`menu → difficulty/chapter-select → intro → play → pause/journal/settings → play` or `play → dead → retry` or `play → chapter-complete → next-intro → play` or `play → ending-choice → ending → menu`. Game simulation only advances in `play`. Menus remain operable with mouse clicks and standard focus. The view reuses one animation frame loop.

`createRun(chapterIndex,difficulty,challenge,seedOverride,carry)` generates a fresh independent level and player state. `updateRun(run,controls,dt)` clamps frame delta to 0.05s, updates simulation and returns an array of typed events. `interact(run)`, `reload(run)`, `fire(run)` and `selectWeapon(run,id)` expose discrete actions. The frontend translates events into UI notifications and SFX.

## Spatial model
A zero grid cell is navigable; a one is blocked. Coarse raycasting samples wall intersections using DDA, rendered at a fixed 2-pixel horizontal step. Sprites are perspective-scaled and depth-clipped against the wall buffer. Enemy routes are shortest-path BFS over the same grid. Sight checks sample grid walls along the vector to prevent shooting or detecting through solid walls.

## Persistence schema
Key: `signal-lost-save-v1` in browser localStorage. Version 1 object contains settings, highest unlocked chapter, completed chapter IDs, achievement IDs, chapter best times/stats, last chapter checkpoint descriptor and collected records. The current chapter is restarted on Continue; **mid-chapter saving is not implemented**. No private or sensitive user data is transmitted or collected. Invalid or unavailable localStorage is caught and falls back to defaults.

## Audio pipeline
All assets are original. Render five chapter themes deterministically with `python3 scripts/generate_audio.py`. Each WAV is mono 11025 Hz, 12 seconds, 16-bit PCM. The audio module loads and loops the matching file at chapter entry; on fetch/decode failure the live oscillator drone remains playable. Sound effects are synthesized on demand after a user gesture initializes AudioContext; browser autoplay restrictions therefore apply naturally.

## Performance budget (design targets, not verified measurements)
- Default internal resolution: 480×270 (adjustable 0.5–1.25x).
- 2-column raycaster stride with fog and occlusion; target 30–60 FPS on integrated desktop GPUs.
- Sprite textures and walls are generated locally once and cached.
- No dependency on CDN, API or external asset service.
- Test future mobile/responsive targets separately; touch aiming is not implemented.

## Known engineering work
- Add an actual browser E2E suite on CI with Playwright and controlled display environment.
- Benchmark render loop; consider OffscreenCanvas/WebGL acceleration if FPS degrades.
- Add gamepad support, remappable key bindings, explicit pause for accessibility, reduced-motion defaults, and in-game calibration.
- Improve enemy auditory localization, direct visual attack animations and user-facing hit confirmation.
- Refactor `src/main.js` into testable UI controller modules as menus expand.

## Standalone export

`python3 scripts/build_offline.py` combines the five JavaScript modules, inlines styles and embeds all five original WAV tracks as base64, producing `play-offline.html`. The generated distribution can be opened locally from a browser without a server. Changes to the modular source require rebuilding that artifact. The self-contained output is syntax-checked using Node after extraction but still needs a real-browser playthrough.
