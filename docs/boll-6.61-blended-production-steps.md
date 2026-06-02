# BOLLFILTER TYP 6.61 — Blended Production Step List (2D + 3D)

**Goal:** ~2:30 animation — Filtration phase + Back-flushing phase  
**Reference:** Manual §5–6, drawings **Z32326 Bl.1 / Bl.2**  
**Output:** MP4 1920×1080

---

## Overview — three layers

| Layer | Tool | What it delivers |
|-------|------|------------------|
| **A — Structure** | Blender (or traced PNG from manual) | Cross-section housing, candles, plug, valves, air tank |
| **B — Flow** | Blender particles **or** PowerPoint arrows | Outside→in / inside→out |
| **C — Polish** | CapCut / DaVinci + Taglish VO | Labels, ΔP gauge, timing, export |

---

## PHASE 0 — Prep (Day 0, ~1 hr)

| Step | 2D | 3D | Done |
|------|----|----|:----:|
| 0.1 | Save manual pics **Bl.1** & **Bl.2** as `ref-filtration.png`, `ref-backflush.png` | Same refs in Blender background | ☐ |
| 0.2 | Read §5 + §6 once; mark valve states (open/closed) per phase | — | ☐ |
| 0.3 | Copy Taglish VO from `boll-6.61-filtration-backflush-animation.md` to one doc | — | ☐ |
| 0.4 | Create folders: `/project/refs` `/project/blender` `/project/export` `/project/audio` | — | ☐ |

---

## PHASE 1 — Blockout (2D trace OR Blender blockout)

### Track 2D (faster submission)

| Step | Action | Done |
|------|--------|:----:|
| 1.1 | New slide **1920×1080**, dark blue or white technical background | ☐ |
| 1.2 | Insert **ref-filtration.png**, 50% opacity, lock layer | ☐ |
| 1.3 | Trace with shapes: housing rectangle, 4–6 candle tubes, inlet (right), outlet (bottom), air tank (right) | ☐ |
| 1.4 | Duplicate slide → rename `SCENE_FILTRATION` / `SCENE_BACKFLUSH` | ☐ |
| 1.5 | Add text placeholders: `OUTSIDE→INSIDE`, `SLUDGE CLOSED`, `ΔP` | ☐ |

### Track 3D (parallel or instead of 1.2–1.3)

| Step | Blender action | Done |
|------|----------------|:----:|
| 1.B1 | New file `boll_661_filter.blend`, units **Metric** | ☐ |
| 1.B2 | Add **Empty** “ROOT”; scale reference: housing ~2 m wide (doesn’t matter, keep proportional) | ☐ |
| 1.B3 | **Housing:** cube, boolean or edit mode → C-shaped cross-section (use ref image as **Background Image** in front view, N-panel) | ☐ |
| 1.B4 | **Candles:** 4–6 cylinders, array modifier along chamber | ☐ |
| 1.B5 | **Change-over plug:** cylinder through centre; separate object for rotation animation | ☐ |
| 1.B6 | **Air receiver:** cylinder right side + small torus for gauge | ☐ |
| 1.B7 | **Valves (simple):** sludge = box at bottom outlet; flushing = box on pipe to receiver | ☐ |
| 1.B8 | **Motor:** box on top + small cylinder shaft → plug | ☐ |
| 1.B9 | Materials: housing grey `#808080`, candles brass `#B8860B`, clean flow blue, dirty brown | ☐ |
| 1.B10 | Camera: **Orthographic**, front or slight angle; frame full unit | ☐ |

**Blended decision point:**  
- **Deadline tight?** Finish Phase 1 on **2D track only**, skip to Phase 3.  
- **Want 3D look?** Complete 1.B1–1.B10, then Phase 2B.

---

## PHASE 2A — Filtration animation (2D)

| Step | Action | Timecode target | Done |
|------|--------|-----------------|:----:|
| 2A.1 | Slide `SCENE_FILTRATION` — draw **arrow path**: inlet (right) → down → across chamber → **through candle walls inward** | 0:10–0:35 | ☐ |
| 2A.2 | Animate arrows: PowerPoint **Motion path** or Canva **Animate** → loop or wipe | | ☐ |
| 2A.3 | Brown **dots** on **outer** candle surface (appear gradually) | | ☐ |
| 2A.4 | Blue arrow to **outlet** (bottom) | | ☐ |
| 2A.5 | Sludge valve icon **RED + CLOSED**; flushing valve **CLOSED** | | ☐ |
| 2A.6 | Air tank gauge graphic **FULL** (green) | | ☐ |
| 2A.7 | Export slide animation as `02_filtration.mp4` (or PNG sequence) | | ☐ |

---

## PHASE 2B — Filtration animation (Blender)

| Step | Blender action | Done |
|------|----------------|:----:|
| 2B.1 | Collection `FLOW_FILTRATION` | ☐ |
| 2B.2 | **Geometry nodes** or **ICO sphere particles** on inlet: emit toward candles, force **Voronoi toward candle centre** (simple: animated **cone** empties as fake flow) | ☐ |
| 2B.3 | **Easier shortcut:** 3–5 **curve** objects with **Curve modifier** + **Build** modifier; material emission blue; animate start/end | ☐ |
| 2B.4 | Dirt: brown particles **stick** to candle outer faces (particle **Hair** on candle mesh, brown) | ☐ |
| 2B.5 | Frame **1–120** (5 s @24fps): particles flow; frame **120** hold | ☐ |
| 2B.6 | Text objects (or compositor): `OUTSIDE → INSIDE`, `SLUDGE CLOSED` | ☐ |
| 2B.7 | Render `02_filtration_####.png` or MP4 | ☐ |

---

## PHASE 3A — Backflush animation (2D)

| Step | Action | Timecode | Done |
|------|--------|----------|:----:|
| 3A.1 | Slide `SCENE_BACKFLUSH` — copy filtration art | 0:45–1:55 | ☐ |
| 3A.2 | **ΔP gauge** graphic: needle rises (0:35–0:45) — separate mini slide or same | ☐ |
| 3A.3 | Animate **plug rotation** 15–30° (PowerPoint spin on grouped shape) | 0:45–1:00 | ☐ |
| 3A.4 | Highlight **reserve chamber** — green outline; arrow to outlet still blue | | ☐ |
| 3A.5 | **Sludge valve** → OPEN (icon turns green, arrow down to “OVFL TK” label) | 1:00–1:10 | ☐ |
| 3A.6 | **Flushing valve** OPEN; air tank gauge pulses (grey dashed arrows) | 1:10–1:20 | ☐ |
| 3A.7 | **Reverse arrows** on dirty chamber candles: **inside → outside** | 1:20–1:35 | ☐ |
| 3A.8 | Brown particles move **down** to sludge line | | ☐ |
| 3A.9 | Sludge **CLOSE**; show **refill bore** arrow filling chamber (1:35–1:55) | | ☐ |
| 3A.10 | Export `03_backflush.mp4` | | ☐ |

---

## PHASE 3B — Backflush animation (Blender)

| Step | Blender action | Frame (24fps) | Done |
|------|----------------|---------------|:----:|
| 3B.1 | Collection `FLOW_BACKFLUSH` | | ☐ |
| 3B.2 | Animate **plug** Z-rotation **0°→25°** frames 1080–1200 | 45–50 s | ☐ |
| 3B.3 | **Reserve chamber** material → emissive green tint frames 1200+ | | ☐ |
| 3B.4 | **Sludge valve** mesh: scale Y open frames 1200–1230 | | ☐ |
| 3B.5 | **Flushing valve** open frames 1260–1290 | | ☐ |
| 3B.6 | Reverse flow curves: animate from **candle centre outward** brown+blue mix | 1290–1380 | ☐ |
| 3B.7 | Particle dump down sludge pipe frames 1380–1440 | | ☐ |
| 3B.8 | Close valves 1440–1500; refill: blue level plane rises in chamber 1500–1560 | | ☐ |
| 3B.9 | Render `03_backflush_####.png` | | ☐ |

---

## PHASE 4 — Blended merge (2D + 3D together)

| Step | Action | Done |
|------|--------|:----:|
| 4.1 | Import in **DaVinci Resolve** or **CapCut**: Title → Filtration → ΔP → Backflush → Summary → End | ☐ |
| 4.2 | **If blended:** use Blender render as **bottom layer**; add 2D arrows in editor if Blender flow too weak | ☐ |
| 4.3 | **If 2D only:** stack slides + transitions **Morph** (PowerPoint export) or **Dissolve** 0.5 s | ☐ |
| 4.4 | Record **Taglish VO** (phone mic quiet room) → `audio/vo.wav` | ☐ |
| 4.5 | Sync VO to scenes (see timecodes in `boll-6.61-animation-storyboard-taglish.md`) | ☐ |
| 4.6 | On-screen English labels: `OUTSIDE→INSIDE`, `COUNTER-CURRENT`, `SLUDGE OPEN/CLOSED` | ☐ |
| 4.7 | Fixed subtitle bottom: *Schematic — BOLL TYP 6.61 — refer to ship manual* | ☐ |
| 4.8 | Optional: 5 s P&ID inset (ship 2536–2540) — **2D only**, last scene | ☐ |
| 4.9 | Export **MP4 H.264 1080p 24fps** → `export/BOLL_661_FINAL.mp4` | ☐ |

---

## PHASE 5 — QC before submit

| Check | Done |
|-------|:----:|
| Filtration flow = **outside → inside** | ☐ |
| Backflush flow = **inside → outside** (counter-current) | ☐ |
| Reserve chamber on-line during backflush | ☐ |
| Sludge closed (filtration) / open then closed (backflush) | ☐ |
| Motor shown ON only during backflush | ☐ |
| Total length 2:00–3:00 (adjust to school requirement) | ☐ |
| VO matches valve sequence | ☐ |

---

## Recommended blended path (best quality / reasonable time)

```text
Day 1 AM   Phase 0 + Phase 1 (2D trace)           → static cross-section
Day 1 PM   Phase 2A + 3A (2D arrows)              → working draft MP4
Day 2 AM   Phase 1B (Blender blockout)            → optional upgrade
Day 2 PM   Phase 2B + 3B (render 5s + 70s clips)  → replace 2D body
Day 3      Phase 4–5 (merge, VO, QC, export)      → FINAL
```

**Minimum submit (1 day):** Phase 0 → 1 (2D) → 2A → 3A → 4 → 5  
**Blended submit (2–3 days):** 2D arrows **over** Blender still/render (hybrid)

---

## Quick Blender shortcuts (if stuck)

| Problem | Fix |
|---------|-----|
| Flow hard to see | Skip particles; use **animated arrows** from Phase 2A in compositor on top of Blender PNG |
| Plug rotation wrong pivot | Set origin of plug to centre line: `Object → Set Origin → Origin to 3D Cursor` |
| Render too slow | **Eevee** not Cycles; 64 samples; 1280×720 draft first |
| No Blender skill yet | **Blended = 2D only** — still passes if §5/§6 sequence correct |

---

## File checklist at hand-in

```
export/BOLL_661_FINAL.mp4
refs/ref-filtration.png
refs/ref-backflush.png
blender/boll_661_filter.blend          (if used)
docs/boll-6.61-filtration-backflush-animation.md  (reference cite)
```

---

*Step list synced to BOLL manual Sections 5–6 and storyboard `boll-6.61-animation-storyboard-taglish.md`.*
