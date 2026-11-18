# Original art, music, sound and effects bible

## Creative direction
Analog nightmare, late-1990s low-resolution survival horror. The palette is desaturated mineral colors accented by dangerous deep red. The player must be able to read an exit against dark corridors; avoid covering all critical information in noise. Game UI combines monospace system labels with a serif title. Typography is high contrast and scalable.

## Art inventory — implemented
- Original `assets/keyart.svg` (1200×675): retro corridor, red door, silhouette, editorial title.
- Original `assets/icon.svg`: red door/favicon.
- Procedurally generated, cached 64px wall textures for concrete, clinical tile, corroded metal and transmitter panels; all authored in `src/render.js`.
- Organic, procedurally drawn distorted anatomy for each enemy type, red exit, fragments/anchors, notes, consoles and weapon/resource pickups; dynamically drawn using Canvas2D from source (no stock art).
- Procedural held-weapon foreground silhouettes for four firearms; muzzle flash, screen grain, scanlines, vignette, low-res renderer and hit vignette.

## Music inventory — implemented
The `assets/audio/` directory includes five original 24-second crossfaded atmospheric music loops; authored by `scripts/generate_audio.py` using oscillator synthesis, distant detuned intervals, heartbeat and filtered noise. Runtime adds generative drone and threat intensity to a crossfading loop. No samples were copied from commercial recordings.

| Chapter | WAV source | Music direction |
|---|---|---|
| 01 Maze | `01_the_maze.wav` | Industrial sub-bass, distant dissonance |
| 02 Ward | `02_the_ward.wav` | Hollow clinical hum, breathing electronics |
| 03 Foundry | `03_the_foundry.wav` | Unstable furnace beats |
| 04 Transmission | `04_the_transmission.wav` | Fading radio intervals |
| 05 Heart | `05_the_heart.wav` | Slow pulse, unresolved chord |

## Original SFX set — synthesized in runtime
Footstep, sprint, pistol report, shotgun blast, nailgun pop, flare ignition, reload click, pickup chime, fragment pickup, door/console, hurt, death, enemy vocal texture, tape static, recovered note and UI confirmation. Different musical and noise envelopes are generated with the Web Audio API; no external third-party audio assets are required.

## Future art/audio polish requirements
Current rendering is a **procedural low-fidelity art pass**, not five photorealistic 3D levels. A production-quality future pass requires rigged/animated enemy models, location-specific props, meaningful signage, interactive door/console motion, distinct impact/weapon animations, authored environment scenes, audio occlusion/spatialization and human-recorded dialogue. These are backlog items, not shipped features. Finalize a legal asset ledger and approval of each new external library, sample or voice performance before commercial release.

## Accessibility and mix specifications
All essential audio clues must also have an optional legible subtitle or visual threat indicator. Maintain independent master/music/SFX levels. Avoid sudden audio peaks; the AudioContext master uses a compressor. Support reduced motion and scanline toggles. QA the music, bass and transient peaks on both headphones and typical speakers. Repeated 24s loops may still sound repetitive over long sessions; expand cue variety in subsequent mix passes.

## November 2026 presentation overhaul
Enemy art now uses layered organic silhouettes, body horror damage, mutations, irregular eyes/teeth and torn clothing. Wall surfaces include mold, cracks and corrosion. Flashlight atmosphere, drifting dust and video tearing enhance spatial dread. Runtime audio includes dual heartbeat, distant structural knocks, breath, band-pass whispering and danger stingers. These changes upgrade an indie retro art direction, but **do not constitute an externally playtested or commercially certified visual/audio master**.
