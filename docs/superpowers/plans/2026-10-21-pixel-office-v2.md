# Pixel Office v2 (top-down, resizable) Implementation Plan

> Executed inline (superpowers:executing-plans). Spec: docs/superpowers/specs/2026-10-21-pixel-office-design.md, section "Bản 2".
> Reference mockup: .superpowers/brainstorm/1438-1792555239/content/topdown.html

**Goal:** Replace the side-view house with a 400×300 Stardew-style top-down house in a resizable 4:3 window where characters walk between desks, lounge, kitchen and garden.

## Global Constraints
- Logical scene 400×300; default window 800×600; min 400×300; aspect 4:3; integer scale = floor(min(w/400, h/300)), letterbox `#0a0818`.
- Walk speed 24 px/s through door waypoints. Brain (`brain.js`), hooks, server, bubbles, lines.json unchanged except anchors/scale plumbing.

## Review Focus
- Resize to odd sizes (e.g. 1013×700): canvas stays integer-scaled and centered, bubbles/HUD stay aligned.
- Action changes while a character is mid-walk: it re-targets smoothly, never teleports.
- Character absent → enter: appears at the garden gate and walks in.
- Window restored off-screen after monitor change: falls back to default position.

### Task 1: Navigation graph + spots (`src/renderer/scene/nav.js`, test `test/nav.test.js`)
- Produces: `SPOTS` (named {x,y} foot positions: `seat:<role>`, `stand:<role>`, `rest:<role>`, `sleep:<role>`, `gate`), `walkPath(from:{x,y}, toSpot:string) -> [{x,y}]` via room waypoints + doors, `spotFor(role, action, data) -> string`, `walkMs(role, to)` (desk→desk ×2 / 24 px/s, for the brain).
- Tests: every path starts at `from`, ends at the spot; consecutive points share a room or pass a door (no wall crossing: each segment stays inside one room rect or a door rect); `spotFor` mapping per spec; walkMs > 0.

### Task 2: Body mover (`src/renderer/scene/mover.js`, test `test/mover.test.js`)
- Produces: `createMover(startSpot) -> { setTarget(spot), step(dtMs) -> {x,y,moving,dir,arrived} }`, follows `walkPath` at 24 px/s; re-target mid-walk starts from current position.
- Tests: reaches target in ≈ length/24 s; re-target mid-way changes destination without jump (distance moved per step ≤ speed·dt); `arrived` true only at the end.

### Task 3: Top-down scene (`src/renderer/scene/td/*.js` replacing side-view draw; keep `gfx.js`, `light.js` generalized to W/H params)
- Produces: `createScene(canvas) -> { render(chars, f, now, {dim}) -> anchors }` with the same contract as v1; internally one mover per role; poses per action at each spot type; ports + fixes mockup (easel, sofa occlusion, HUD placement).
- Verify: `?debug=all` screenshots at 800×600 — every action readable, walking through doors, no console errors.

### Task 4: Resizable window + responsive renderer
- `main.js`: `resizable:true, transparent:false, minWidth:400, minHeight:300, setAspectRatio(4/3)`, persist `{x,y,width,height}`, tray "Về 800×600".
- Renderer: compute integer scale on resize, size `#frame` = 400s×300s centered; `mountBubbles` takes a scale getter; CSS uses `--s`.
- Verify: Electron window drag-resize (programmatic SetWindowPos to 1013×700 and 1600×1200), screenshots aligned; demo run end-to-end.

### Task 5: Final review (fresh reviewer), fix Critical/Important with tests.
