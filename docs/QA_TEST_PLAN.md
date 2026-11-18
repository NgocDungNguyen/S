# QA plan — reproducible gates

**Current automated baseline:** `npm run check` — syntax check plus Node.js built-in gameplay tests. Browser E2E and human playtests are still pending. A repository commit is not proof of a shippable commercial game.

## Smoke test in supported desktop browser
1. Start server (`npm start`), open `http://localhost:4173` in latest Chrome, Edge and Firefox.
2. Check menu renders, New Game → Survivor → Chapter 1 intro → Enter, Pointer Lock, movement/looking.
3. Verify sound starts after user interaction; increase/decrease master/music/SFX and confirm persistence after refresh.
4. Acquire pistol near spawn, collect objective, examine journal, fire/reload/switch weapons, pick up health/ammo.
5. Compare walking/crouching/sprinting near Watcher and Matron. Watcher should stop while observed. Death must allow Retry.
6. Collect all fragments, interact with red door, verify chapter complete and Continue selection.
7. Test Chapter 2/4 console interlock, Chapter 3 valve gates, Chapter 5 shield → four anchors → boss kill → ending choice.
8. Collect all 15 notes and verify third ending becomes available; verify unlock and Continue after reload.
9. Repeat flow in Story, Nightmare, No Return and challenges The Clock, Blackout, Silent Hands. Confirm Silent Hands' final nonlethal path.
10. Resize to 1366×768 and 1920×1080; change resolution, FOV, brightness, minimap, scanlines, crosshair and camera shake. Check no clipping or unreadable text.

## Automated unit suite
- Five chapter map connectivity, required target placement, deterministic generation, line-of-sight.
- Weapon ownership, reload cannot generate ammo, final boss shield, objective/console gate transitions.
- Movement collision, challenge restrictions and all-difficulty initialization.
- Run `npm test`, require zero failures, before every merge.

## Save and resilience tests
- Full Continue from chapter boundary; Save & Menu; reopen same browser.
- Invalid/blocked storage, private browsing, first launch, delete save, ironman death reset.
- Lock/unlock Pointer Lock on ESC, tab switching, lost window focus.
- AudioContext suspended/unavailable, file loading failure and low-power mode.
- Confirm HTTP errors cause graceful fallback or visible error rather than silent hangs.

## Bug reports
Title, build/commit SHA, browser/device, chapter/difficulty/challenge, steps to reproduce, actual versus expected, screen recording/screenshot, console trace, regression classification, severity (P0–P3). Block shipping for all P0/P1.

## Coverage and known limits
Unit tests already pass on game simulation. Chromium in the execution sandbox is governed by an administrator URL blocklist, preventing a reliable visual browser test; **browser QA is not asserted complete**. No automated performance profile or accessibility certification has been conducted. Treat the game as pre-release and recruit external testers before release status changes.
