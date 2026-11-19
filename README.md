[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/local-deviant/ember-meadow-4837/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/local-deviant/ember-meadow-4837/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice City Cover Studio

A multi-panel GTA-style cover maker for the make.fun bounty
`gta6-cover-art-01`. Pick a layout, pick a grade, drop in your photos,
set the lettering, and export a finished cover — all in the browser,
offline, no libraries.

## What it does

- **5 layouts**: Hero + 3, Grid 9, Full Bleed + strip 4, Tilted
  Snapshots (tilted panels over a sunset backdrop), and a vertical
  Story layout.
- **5 canvas grades**: Neon Sunset, Vice Gold, Hot Pink Night, Palm
  Noir, Ocean Drive — 256-entry gradient-map LUTs applied per pixel,
  plus seeded film grain and an optional vignette.
- **Lettering**: auto-fit Anton captions with outline and magenta
  shadow, neon Pacifico subtitles, an "EST. 2026" star badge.
- **Per-panel photos**: upload many, drag-and-drop, click a panel to
  select it, then drag to pan, scroll to zoom, rotate ±5°, flip, or
  reset. Positions are clamped so a photo always covers its panel.
- **Export**: 1080×1080, 1080×1350, 1920×1080, or all three at once
  as PNGs.
- **Deterministic scenes**: `?shot=cover|editor|portrait|square`
  renders a fixed scene for screenshots.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Files

- `app/` — the cover maker (HTML, CSS, ES modules, local OFL fonts)
- `app/samples/` — two starter photos
- `screenshots/` — 4 renders from the app itself
- `main.ts` — entrypoint: hands `app/` and `screenshots/` to the
  grader and writes `dossier.json`
- `serve.ts` — tiny static server for local tries

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22, standard library only. No network requests, no tracking.
