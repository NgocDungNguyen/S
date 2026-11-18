# Level design specification

Levels use a deterministic, connected, seeded grid with 1-unit corridors, hand-sized chambers, and distant red exits. Every required objective, collectible note and enemy spawns on a navigable cell. Chapter colors, objective names, enemies, console gating and chapter size are controlled in `src/content.js`.

| Chapter | Grid | Route | Encounter teaching | Required gates |
|---|---:|---|---|---|
| 01 Maze | 21×21 | Intake to red door | Look at the Watcher to interrupt chase | 3 fragments |
| 02 Ward | 23×23 | Hospital to generator | Crouch past Matron, manage hearing | 3 bands + console |
| 03 Foundry | 25×25 | Furnaces to blast exit | Armor and close-range burst | 3 valves |
| 04 Transmission | 25×25 | Array to frequency console | Siren blinking; maintain spatial awareness | 3 relays + console |
| 05 Heart | 27×27 | Archive to carrier | Four anchors remove boss shield | 4 anchors + Archivist (except Silent Hands) |

The original prototype is archived unmodified in `legacy/`. The new rendering architecture is a grid-based raycaster, not a literal scene port. This is a deliberately contained reinterpretation of the player's original Chapter 1 concept.

## Spatial guidelines
- Entrances orient toward an open adjacent tile and initially offer a reachable pistol pickup.
- At least three graph cells separate mandatory objectives in typical layouts. Do not place enemies directly on the entry tile.
- Visibility is tuned through render fog and the flashlight cone. Player navigation remains possible in low brightness; hand-authored signposting and alternate routes are still planned.
- A red exit sprite represents the chapter gate. It is not passable until the objective requirements are met.
- Notes are optional, three per chapter, and drive the all-fifteen true-ending condition.

## Visual and audio progression
The color and sound palette changes per chapter: moss-green concrete; cold sterile green; iron orange; radio violet; deep crimson/bone. Distinct procedural texture treatments remain coherent with the first game's PS1 aesthetic. Future hand-authored levels should preserve these thematic beats and scripted encounters.

## Acceptance tests
Run `npm test` for seed connectivity. During manual QA, verify objective pickup via E, exit gate, console interlock, enemy sight/noise response and recovery after death. Re-run across all four difficulties and three challenges. Document failed routes with chapter, seed, coordinates and reproduction steps.
