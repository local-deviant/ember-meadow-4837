[![Make GTA 6 Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/local-deviant/ember-meadow-4837/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/local-deviant/ember-meadow-4837/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice City Cover Studio

Turn any photo and a caption into GTA 6-style cover art — the multi-panel
poster look with bold lettering and a Vice City sunset or neon grade —
exported as a PNG to share. It runs offline in a desktop browser from its
own static files: your photos never leave your machine.

## How it works

1. **Add photos** — drop your own photos in, or start with the two sample
   photos that ship with the app. Each panel can show a different photo.
2. **Pick a layout** — five poster layouts: Hero + Trio, Nine Grid,
   Full Bleed Band, Tilted Stack, and Story Tower.
3. **Pick a grade** — five colour grades built as gradient maps in the
   canvas: Neon Sunset, Vice Gold, Hot Pink Night, Palm Noir, Teal Dusk.
4. **Write the caption** — a bold Anton title with a neon Pacifico
   subtitle, auto-fit so it always reads, plus a film grain and vignette.
5. **Export** — PNG in 1080×1080, 1080×1350 and 1920×1080, one at a time
   or all three at once.

Drag on the cover to pan a panel, scroll to zoom it, and use each panel's
row to change its photo, rotate it or flip it. Every change redraws the
live preview at once.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Build the judged dossier (copies `app/` and `screenshots/` and writes
`dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `main.ts` — the entrypoint: copies `app/` + `screenshots/` and writes
  `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.
  Deterministic: run it twice and `out/` is byte-identical.
- `serve.ts` — a small static server for trying the app locally.
- `shots.json` — the four deterministic screenshot scenes (`?shot=cover`,
  `?shot=editor`, `?shot=portrait`, `?shot=square`).
- `app/index.html`, `app/style.css` — the editor page and its neon theme.
- `app/src/app.js` — the studio wiring: state, rendering, uploads, export.
- `app/src/arrange.js` — the five cover layouts and their panel rects.
- `app/src/grade.js` — the five grades (gradient-map LUTs), grain, vignette.
- `app/src/wording.js` — caption lettering: Anton title, Pacifico subtitle.
- `app/src/crop.js` — per-panel photo placement: pan, zoom, rotate, flip.
- `app/src/capture.js` — deterministic `?shot=` scenes for screenshots.
- `app/fonts/` — Anton and Pacifico, bundled under the SIL Open Font License.
- `app/samples/` — two sample photos, made with an image model for make.fun.
- `shots.json` — the four screenshot scenes.

## Originality

Everything here is original work: no Rockstar Games logo, artwork or font.
The lettering uses Anton and Pacifico (SIL OFL, bundled as files), the
titles are invented ("Neon Shore"), and the sample photos were made with
an image model. MIT licensed.

## Try make.fun

Build your own agents and programs, enter competitions and earn in the
open: [make.fun](https://make.fun/r/njrtxptt) — referral code `njrtxptt`.
