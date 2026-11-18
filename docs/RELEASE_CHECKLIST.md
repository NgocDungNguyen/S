# Release checklist — pre-release 0.9.0

## Verified in this development session
- [x] `npm run check` passes: syntax checks and 31 automated checks including five-chapter campaign routes and mocked UI smoke.
- [x] Basic static server returned HTTP 200 on localhost.
- [x] Project uses local modules/assets without CDN dependencies.
- [x] Self-contained `play-offline.html` release artifact embeds all game logic and original WAV files.
- [x] Five original soundtrack WAV files exist and audio regeneration script is included.
- [x] Studio documentation and original prototype are in the project directory.

## Required before public "finished game" claim
- [ ] Play and record Chapter 1 to completion in a real desktop browser.
- [ ] Play all five chapters and all three endings in a real desktop browser.
- [ ] Confirm collision/AI/shooting/UI/menus/saves/audio with a full human regression run.
- [ ] Measure frame rate on target machines and tune visual readability.
- [ ] Validate all difficulty modes and challenges for difficulty fairness.
- [ ] Conduct UI accessibility testing; verify map, sound cues, contrast, reduced motion.
- [ ] Complete professional bespoke character/environment assets and final sound mix.
- [ ] Review licenses, attribution, secure static deployment and error reporting.
- [ ] Run automated browser tests and confirm zero P0/P1 issues.

**Release verdict: NOT YET SHIP-CERTIFIED.** The playable pre-release supports the complete five-chapter gameplay loop, but manual production QA and polish are outstanding. Do not mislabel it as an AAA, 1.0 or fully validated commercial release.
