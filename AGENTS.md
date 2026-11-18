# STUDIO AGENTS — COLLABORATION CONTRACT

This file defines **six specialist workstreams** for maintainers or coding agents. It is not a claim that background autonomous agents are currently running. Each agent should make a bounded, reviewable change and hand work back to the integrator; no agent may deploy, rewrite history, or silently change approved narrative.

## Shared mission and scope

Ship an accessible, stable, original, five-chapter retro survival horror FPS. Preserve the Chapter 1 identity: maze, three fragments, red exit, observation-frozen Watcher, and scavenged weapons. Own all original content and maintain third-party attribution. First optimize a finished, testable game loop; then improve visual/audio fidelity.

| Workstream | Primary files | Deliverables | Acceptance gate |
|---|---|---|---|
| **GAME DIRECTOR / PRODUCER** | `docs/GDD.md`, `docs/REQUIREMENTS.md`, `docs/PRODUCTION_BACKLOG.md` | Experience pillars, scope control, prioritization, release decisions | Every feature has a testable requirement and severity |
| **GAMEPLAY ENGINEER** | `src/simulation.js`, `src/content.js`, `tests/` | Player, weapon, AI, bosses, maze, difficulty, challenges | `npm run check` passes; every chapter remains solvable |
| **LEVEL & NARRATIVE DESIGNER** | `src/content.js`, `docs/STORY_BIBLE.md`, `docs/LEVEL_DESIGN.md` | Five complete arcs, environmental cues, collectible records, endings | No plot contradiction; no mandatory objective in solid wall |
| **ART / VFX DESIGNER** | `src/render.js`, `styles.css`, `assets/*.svg` | Silhouettes, legibility, PS1 shader aesthetic, menus, feedback | Readable navigation on 1366×768 and 1920×1080 |
| **AUDIO DESIGNER** | `src/audio.js`, `assets/audio/`, `scripts/generate_audio.py` | Original chapter themes, alerts, 3D-style threat cues, mixer | No silent errors; all authored sound has reproducible source |
| **QA / RELEASE ENGINEER** | `.github/`, `tests/`, `docs/QA_TEST_PLAN.md`, `docs/RELEASE_CHECKLIST.md` | Regression suite, playtest reports, release gates | All P0/P1 closed; reproducible smoke test artifacts |

## Workflow

1. Read `README.md`, `docs/GDD.md`, and the relevant discipline specification before changing code.
2. File an issue with **context / acceptance criteria / risks**. Use branch `feature/<area>-<ticket>` or `fix/<area>-<ticket>`.
3. Keep gameplay rules in `simulation.js`, data in `content.js`, browser/UI in `main.js`, pixels in `render.js`, and audio in `audio.js`.
4. Maintain ES module compatibility and Node.js built-in test runner. Do not introduce an npm dependency without reviewing its footprint, license, security and offline implications.
5. For any gameplay rule, add or update a unit test. Validate all five map seeds and the last-chapter win condition.
6. PR description must include **what changed**, **tests run**, **screenshots or recordings if UI changes**, **remaining risks**, **rollback plan**.
7. Integrator reviews merge conflicts and updates the changelog. Never directly overwrite another workstream's file without coordinating.

## Definition of done

- Acceptance criteria demonstrated in automated tests or a documented manual playtest.
- No errors in browser console (where browser testing is available).
- Pause/resume, save/load, input focus, display sizing and sound settings behave correctly.
- Chapter remains winnable in Story/Survivor/Nightmare/No Return and in special challenges.
- Art/audio source and licensing documented; assets load from static server with no external network.
- Documentation accurately distinguishes verified work from planned work.

## Incident / stop conditions

**P0:** game fails to load, save corruption, hard progression block, unrecoverable death loop. **P1:** broken major controls, absent audio, unbeatable boss, repeated crashes. Stop release; write a reproducible report. Do not use real-world harmful procedures in game design documentation. Studio fiction is sufficient.

## Suggested parallel ticket queue

- Gameplay: deterministic objective placement and multi-difficulty playthrough tests.
- Narrative: hand-author optional environmental storytelling scenes between procedural sectors.
- Art: unique attack/reaction frame sets for five enemy archetypes.
- Audio: mix mastering, attack telegraphs, spatial panning, optional voice performances.
- QA: full playthrough matrix, accessibility tests, performance benchmarks.
- Producer: release criteria, credits, Steam/itch distribution planning.

All specialist responsibilities above are **handoff instructions for future human or automated contributors**, not ongoing unattended processes.
