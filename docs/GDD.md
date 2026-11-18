# GAME DESIGN DOCUMENT — THE MAZE: SIGNAL LOST

**Revision:** 0.9.0 / 18 Nov 2026. **Genre:** single-player first-person survival horror + shooter + escape. **Visual direction:** late-1990s low-resolution psychological horror. **Platform:** desktop web. **Intended rating direction:** mature teens/adults, fictional violence, sustained dread, dark themes. **Business model:** no monetization in this build.

## 1. Vision

You are **Iris Vale**, following a radio transmission from her missing brother through five impossible layers beneath the abandoned St. Vesper Annex. The player must survive by navigating and conserving resources. Firing a weapon is not always the right answer: sight can immobilize a threat, noise attracts another, and memory holds the key to the final choice.

**Three pillars**

1. **Dread in the gap between light and sound.** Corridors restrict sightlines; audio suggests threats before they appear. Flashlight illumination is a resource, not a free convenience.
2. **Combat as a desperate decision.** Every shot has an opportunity cost: finite ammo and noise. Movement, observation, concealment and pathfinding remain valid ways through most encounters.
3. **Escape reveals the story.** Each chapter has a self-contained gate, a narrative discovery, a new enemy behaviour and a climax. Collectibles unlock an optional third ending.

## 2. Target experience and pacing

- 5 chapters, each estimated 10–25 minutes on a first playthrough **(design target, not measured)**.
- First-time full run target 75–120 minutes; repeats can be faster. This is a *goal*, pending playtest.
- Every chapter follows: disorienting arrival → exploration → first evidence → threat escalation → objective completion → red exit or final choice.
- Radio messages create a story beat at arrival and after significant objectives; the journal stores 3 optional notes per chapter.

## 3. Player loop

`LISTEN → EXPLORE → DISCOVER → SCAVENGE → EVADE / FIGHT → ACTIVATE → ESCAPE`

**Navigation:** WASD move, mouse/keyboard look, Shift sprint, C/Ctrl crouch. Collision checks player radius against the map grid, axis by axis, to prevent walking through corners. Sprint raises noise and drains stamina; crouch lowers speed, noise and detection range.

**Survival resources:** health 0–100, battery 0–100, stamina 0–100, weapon ammo by magazine and reserves. Health reaches zero → death screen and chapter restart. Battery reaches zero → automatic flashlight shutdown. Stamina replenishes when not sprinting.

**Interaction:** press E within reach of an objective, powered console, or red exit. Pickups and records are acquired by proximity. Each objective has an explicit progress counter. The final boss becomes vulnerable only after all anchors are activated/destroyed.

**Combat:** camera-aligned, line-of-sight checked hitscan. Pistol is precise and quick, shotgun is close-range multishot, nailgun is sustained fire, flare is slower but stuns. Damage depends on enemy type and equipment; the Husk reduces normal projectile damage. Weapons have fire cooldowns and reload timers. Gunshots create noise, drawing nearby threats.

## 4. Enemies — behaviour contract

| Archetype | Player read | AI behaviour | Counterplay |
|---|---|---|---|
| **Watcher** (Ch. 1, 5) | Motionless face with red eyes | Pursues on LOS/noise; freezes while directly watched | Face it while backing away; don't get trapped |
| **Matron** (Ch. 2, 4) | Pale nurse silhouette | Longer hearing radius; faster on alert | Crouch, avoid gunfire |
| **Crawler** (Ch. 2, 3, 4) | Small low-slung shape | Fast pursuit; lower health | Spot from a distance, control corners |
| **Husk** (Ch. 3, 5) | Broad furnace suit | Armored, slower, heavy hit | Stagger with flare or shotgun; evade |
| **Siren** (Ch. 4, 5) | Distorted humanoid | Periodic blink toward player's recent path | Keep distance, watch the radio disturbance |
| **Archivist** (Ch. 5) | Tall archive construct | Invulnerable until 4 anchors broken; heavy damage | Break anchors, then sustained fire; nonlethal escape in Silent Hands |

**AI states:** `sealed → patrol → chase ↔ frozen/stunned → dead`. Target acquisition via LOS, hearing and short-term alert timer. Chase uses a BFS grid route refreshed periodically; steering moves towards the next path cell. No path through solid walls. Hit reaction creates temporary stun.

## 5. Weapons and progression

| Weapon | Source | Gameplay niche | Magazine | Design risk |
|---|---|---|---:|---|
| M1911 Pistol | Found early in Ch. 1 | Accurate all-round | 9 | Avoid overabundant 9mm ammo |
| 12G Shotgun | Available Ch. 2 onward | High close-range burst | 2 | Shotgun recoil/ammo scarcity |
| Industrial Nailer | Available Ch. 3 onward | Rapid suppression | 24 | Noise/aggression tradeoff |
| Signal Flare | Available Ch. 4 onward | Stun/escape from crowd | 1 | High utility without trivializing encounters |

Weapon acquisition and reload tuning live in `src/content.js`. Weapon state is carried across chapters as **ownership**, while chapter starts restock limited ammunition for recoverability and balance. No crafting or upgrades are promised in the current build.

## 6. Difficulty and modifiers

| Mode | Enemy speed | Damage | Supplies | Win/lose |
|---|---:|---:|---:|---|
| Story | 75% | 45% | More | Chapter checkpoint |
| Survivor | 100% | 100% | Standard | Chapter checkpoint |
| Nightmare | 127% | 140% | Fewer | Chapter checkpoint |
| No Return | 130% | 155% | Very scarce | Death resets campaign progress |

Challenge modes are campaign-level modifiers: **The Clock** (30-minute deadline); **Blackout** (flashlight locked off); **Silent Hands** (weapons disabled, alternate final escape). Combining challenge mode with difficulty increases replayability; numerical balancing remains playtest-driven.

## 7. Chapter content requirements

### Chapter 1 — THE MAZE

Theme: buried service passages, damp concrete, red gate. Recover **3 memory fragments**. Introduce no-map navigation, flashlight, firearm pickup and the Watcher. Teach observation-freeze by visual feedback. Exit through the red door. Narrative: the basement should not exist.

### Chapter 2 — THE WARD

Theme: abandoned clinic and patient records. Recover **3 ID bands**, activate emergency console, escape. Matron's hearing pushes crouch/stealth. Narrative reveal: Iris was registered as an eight-year-old patient in 1998, even though she remembers no admission.

### Chapter 3 — THE FOUNDRY

Theme: incinerator and scorched machinery. Close **3 pressure valves** and pass the blast gate. Introduce armored Husk and higher-pressure resource economy. Narrative reveal: Project Palinode harvested memories to keep an anomalous signal contained.

### Chapter 4 — THE TRANSMISSION

Theme: transmitter array, radio static, purple interference. Align **3 signal relays**, activate frequency console, escape the Siren. Narrative reveal: Iris's voice exists on old tapes made before she spoke those words.

### Chapter 5 — THE HEART

Theme: archive core and living recording. Break **4 anchors**. Expose and defeat the Archivist, or bypass it nonlethally in Silent Hands. Reach final transmitter and make a choice. The third ending requires recovering all **15 documents** across five chapters.

## 8. UI and interaction requirements

- Menus: New, Continue, Chapter Select, Challenges, Settings, Achievements, Credits/Controls, Pause, Death, Chapter Complete, Ending.
- HUD displays objective, chapter, difficulty, timer, HP, battery, stamina, weapon mag/reserve, contextual E prompt, flashlight state.
- Journal is opened with J; collected records are persistent after completing chapters.
- Feedback events: pickups, objectives, gunfire, damage, death, chapter complete; sound and text paired.
- Accessibility levers: brightness, FOV, sensitivity, resolution, subtitles, scanlines, camera shake, minimap, crosshair, audio mix.

## 9. Game-feel and presentation

Low internal resolution with integer-ish pixel blocks, heavy fog, limited draw distance, grunge wall textures, sprite billboards, light cones, screen noise, vignette, sudden red signals. Color scripts: Chapter 1 olive-grey, 2 institutional teal, 3 rust-orange, 4 bruised violet, 5 red-and-bone. Build believable fear through **anticipation, audio and meaningful action**, not continuous jump scares.

## 10. Success measurements (future playtests)

- Completion: 90%+ testers can finish Ch. 1 without external instructions after two attempts.
- Comprehension: 80%+ testers can articulate the Watcher counterplay by minute five.
- Reliability: 0 progression-blocking defects during 10 full start-to-end QA runs.
- Experience: target high tension without motion sickness or unreadable UI; collect voluntary feedback and revise FOV/lighting.

These metrics are targets, **not observed results**.
