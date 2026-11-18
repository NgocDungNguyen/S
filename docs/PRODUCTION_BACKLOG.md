# Studio production backlog and milestones

The backlog distinguishes what exists from further work required for a polished game. Specialists are described in `AGENTS.md`; they are workstream responsibilities, not agents silently running in the background.

## Milestone A — core foundations (implemented for v0.9.0)
- [x] Preserve original Chapter 1 as a legacy reference.
- [x] Create dependency-free modular game engine, original campaign data, seeded level generator.
- [x] Implement five connected chapter objectives with final confrontation and narrative resolutions.
- [x] Add four weapon classes, six enemy archetypes, stealth, damage, pickups and save/unlock progression.
- [x] Add menu, settings, challenges, difficulty, collectible journal, original soundtrack and SFX.
- [x] Add game design/story/engineering docs and automated Node tests.

## Milestone B — stable playable vertical slice (P0/P1)
- [ ] Full Chapter 1 browser playthrough by human QA tester, recorded evidence and documented findings.
- [ ] Full campaign browser test across endings; fix reported progression blocks or script bugs.
- [ ] Verify all menus and save/restart/continue flows after reload; test storage failure paths.
- [ ] Benchmark software renderer (30+ FPS target) on supported hardware; optimize if necessary.
- [ ] Fix accessibility/readability and sound mixing issues from testers.
- [ ] Add automated browser E2E tests with screenshot diffing in a permissive environment.

## Milestone C — studio-quality content pass (P1/P2)
- [ ] Convert procedural tiles into five recognizable, designed environment layouts with landmarks and alternate routes.
- [ ] Hand-author level props, red exit interactions, context puzzles and encounter set pieces.
- [ ] Animate all five non-boss enemies and the boss (idle, attack, search, stagger, death).
- [ ] Upgrade weapon meshes/sprites and reload animations, hitscan feel, HUD hit markers and threat feedback.
- [ ] Create distinct recorded environmental sounds per chapter, spatialization, and professionally mastered themes.
- [ ] Record original dialogue and synchronize optional captions; no synthetic voice identity imitation.
- [ ] Tune difficulty curves, drops, routes and enemy behavior from session telemetry collected only with player consent.

## Milestone D — launch readiness (P0)
- [ ] Review all third-party licenses and performance/memory usage; remove unapproved content.
- [ ] Implement and test accessibility requirements, particularly color contrast and motion/audio cues.
- [ ] Finalize complete five-chapter story pacing, ending UX and credits.
- [ ] Test current Chrome/Firefox/Edge on supported Windows/macOS/Linux desktop hardware.
- [ ] Ensure 10 error-free complete campaigns; no open P0/P1 bugs.
- [ ] Create production website hosting, release candidate, changelog, rollback process and downloadable build.

## Decision gates
- Scope additions require explicit requirement ID + owner + estimated test effort.
- Do not trade chapter completion for decorative menu art or extra weapons.
- Use procedural originals initially to avoid unlicensed dependencies; replace with bespoke assets only with source/license provenance.
- Version is `0.9.0` until the release checklist and browser QA exit criteria are satisfied.
