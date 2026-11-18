# Product Requirements & Traceability — SIGNAL LOST

**Product:** browser-based first-person, single-player survival horror shooter. **Target:** desktop Chrome/Firefox/Edge with Web Audio and Canvas2D; keyboard/mouse primary. **Build:** 0.9.0. **Scope:** five sequential chapters with meaningful beginning, middle, end.

Status meaning: **Implemented** means source exists with local automated verification where indicated, not a public release certification. **QA pending** means implemented but not comprehensively browser-playtested. **Planned** means absent or not production-ready.

| ID | Requirement | Acceptance criterion | Implementation / status |
|---|---|---|---|
| FR-001 | Five story chapters | Each playable from entry to exit or final choice | `content.js`, `simulation.js`; implemented, full manual QA pending |
| FR-002 | Main menu | New, continue, chapter select, challenges, settings, credits | `main.js`; implemented, UI QA pending |
| FR-003 | Persistent progress | Complete chapter unlocks next; continue restarts current chapter | localStorage in `main.js`; implemented, browser QA pending |
| FR-004 | First-person movement | WASD, mouse view, collisions, sprint and stamina | `simulation.js`, `main.js`; implemented, logic tested |
| FR-005 | Stealth | Crouch reduces speed/noise/visibility; sprint louder | `simulation.js`; implemented, balance QA pending |
| FR-006 | Combat | Four weapons, mag/reserve, cooldown, reload, LOS hit check | `simulation.js`; implemented, logic tested |
| FR-007 | Enemy variety | Watcher, Matron, Crawler, Husk, Siren, Archivist | `content.js`, `simulation.js`; implemented, balance QA pending |
| FR-008 | Scarcity | Health, flashlight battery, ammunition, pickups | `simulation.js`; implemented |
| FR-009 | Difficulty | Story, Survivor, Nightmare, No Return | `content.js`, `simulation.js`; implemented, balance QA pending |
| FR-010 | Challenge modes | 30-min clock, no flashlight, no firearms | `simulation.js`; implemented, playtesting pending |
| FR-011 | Chapter objectives | 3–4 chapter-specific goals, main console gates where relevant | `simulation.js`; implemented, unit-tested |
| FR-012 | Boss gating | Final boss cannot be harmed before anchors are removed | `simulation.js`; implemented, unit-tested |
| FR-013 | Narration | Radio intro/outro plus 15 in-world notes | `content.js`, `main.js`; implemented |
| FR-014 | Branching endings | At least 2 endings and secret all-note ending | `main.js`, `content.js`; implemented, campaign-level testing pending |
| FR-015 | Menu and HUD | Legible objectives, vitals, ammo, contextual prompts | HTML/CSS; implemented, visual QA pending |
| FR-016 | Settings | Master/music/SFX, sensitivity, brightness, FOV, resolution, motion, scanlines, subtitles, minimap, crosshair | `main.js`, `render.js`, `audio.js`; implemented, persistence QA pending |
| FR-017 | Music & sound | Distinct original tracks per chapter and reactive cues | `assets/audio`, `audio.js`; implemented; audio mix QA pending |
| FR-018 | Offline capability | No external network or third-party CDN runtime dependency | source and static assets; implemented |
| FR-019 | Difficulty failsafe | All mandatory nodes reachable, no map spawn inside wall | deterministic `buildLevel`, automated tests; verified for release seeds |
| FR-020 | Achievements | Track key progression/performance feats | `main.js`, `content.js`; implemented, UI QA pending |
| NFR-001 | FPS | Aim 30–60 FPS desktop at base scale | Performance benchmark required; planned |
| NFR-002 | Accessibility | Adjustable display/audio settings, keyboard support | Partial; dedicated audit planned |
| NFR-003 | Browser coverage | Chrome, Firefox, Edge current stable | Manual matrix planned |
| NFR-004 | Recovery | Save failure must not crash gameplay | `try/catch`; additional storage tests planned |
| NFR-005 | Security | No network secrets, no telemetry, safe static hosting | architecture implemented; independent audit planned |
| NFR-006 | Internationalization | English complete, additional languages optional | English shipped; localization planned |
| NFR-007 | Art quality | Replace procedural placeholders with bespoke models/animation | Planned, see production backlog |
| NFR-008 | Release packaging | QA-passed website and distributable build | Planned |

## Explicit out-of-scope for the current build

Multiplayer, cloud saving, accounts, real-money purchases, asset marketplaces, external voice AI, randomized paid content, console binaries, VR, and native mobile touch controls.

## Exit criteria to call the project “finished”

- All FR checks demonstrated in a fresh browser session, including difficulty and challenge paths.
- All five chapters played start-to-end, endings viewed, and checkpoint restore verified.
- No unresolved P0 or P1 bug, documented accessibility and performance results.
- Final art, animation, audio mix, credits, licensing and build artifacts approved.

At v0.9.0 these exit criteria are **not yet met**. The repository is a working pre-release, not a falsely claimed commercial release.
