// arrange.js — cover layouts for Vice City Cover Studio.
// Every layout is a function of the canvas size: it returns the panel
// rectangles (normalised, then scaled to pixels) plus the title block
// where the caption lives. Nothing here reads any other file; the
// numbers below are the layout's own design.

export const LAYOUTS = [
  { id: "hero-trio", name: "Hero + Trio" },
  { id: "grid-nine", name: "Nine Grid" },
  { id: "fullbleed-band", name: "Full Bleed Band" },
  { id: "tilted-stack", name: "Tilted Stack" },
  { id: "story-tower", name: "Story Tower" },
];

// Look up a layout by id; falls back to the first layout so a bad
// ?shot= scene or a stale saved choice never breaks the renderer.
export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// A panel rect: x, y, w, h are fractions of the canvas (0..1).
// rot is a tilt in degrees around the panel centre (0 = straight).
// gap is the fraction of the canvas kept as gutter between panels.
function rect(x, y, w, h, rot = 0) {
  return { x, y, w, h, rot };
}

// Panels + title block for one layout at a canvas of width w, height h.
// Returns pixel rects: { panels: [...], title: {...} }.
export function panelsFor(layoutId, w, h) {
  const px = (r) => ({
    x: Math.round(r.x * w),
    y: Math.round(r.y * h),
    w: Math.round(r.w * w),
    h: Math.round(r.h * h),
    rot: r.rot || 0,
  });
  const title = (r) => ({
    x: Math.round(r.x * w),
    y: Math.round(r.y * h),
    w: Math.round(r.w * w),
    h: Math.round(r.h * h),
  });

  switch (layoutId) {
    case "hero-trio": {
      // One tall hero on the left, three small panels stacked on the right.
      // The caption sits across the bottom of the hero.
      return {
        panels: [
          px(rect(0.015, 0.015, 0.60, 0.97)),
          px(rect(0.635, 0.015, 0.35, 0.313)),
          px(rect(0.635, 0.343, 0.35, 0.313)),
          px(rect(0.635, 0.672, 0.35, 0.313)),
        ],
        title: title(rect(0.035, 0.74, 0.56, 0.22)),
      };
    }
    case "grid-nine": {
      // A 3x3 poster grid with a title band along the bottom.
      const cells = [];
      const gw = 0.97 / 3;
      const gh = 0.80 / 3;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          cells.push(px(rect(0.015 + col * gw, 0.015 + row * gh, gw - 0.01, gh - 0.01)));
        }
      }
      return { panels: cells, title: title(rect(0.02, 0.83, 0.96, 0.15)) };
    }
    case "fullbleed-band": {
      // One photo fills the whole cover; a strip of three small panels
      // rides along the bottom and the title floats at the top.
      return {
        panels: [
          px(rect(0, 0, 1, 1)),
          px(rect(0.02, 0.76, 0.306, 0.21)),
          px(rect(0.347, 0.76, 0.306, 0.21)),
          px(rect(0.674, 0.76, 0.306, 0.21)),
        ],
        title: title(rect(0.03, 0.03, 0.94, 0.15)),
      };
    }
    case "tilted-stack": {
      // Three snapshots tossed on the poster at slight angles, polaroid style.
      // The title block anchors the top.
      return {
        panels: [
          px(rect(0.05, 0.20, 0.44, 0.52, -6)),
          px(rect(0.51, 0.17, 0.44, 0.52, 5)),
          px(rect(0.27, 0.55, 0.46, 0.40, -2)),
        ],
        title: title(rect(0.04, 0.02, 0.92, 0.13)),
      };
    }
    case "story-tower":
    default: {
      // Portrait story: a title block on top, three panels stacked below.
      return {
        panels: [
          px(rect(0.05, 0.21, 0.90, 0.25)),
          px(rect(0.05, 0.475, 0.90, 0.25)),
          px(rect(0.05, 0.73, 0.90, 0.25)),
        ],
        title: title(rect(0.04, 0.015, 0.92, 0.18)),
      };
    }
  }
}

// Which export sizes each layout suits best (used by the export buttons).
export const EXPORT_SIZES = [
  { id: "square", label: "1080 x 1080", w: 1080, h: 1080 },
  { id: "portrait", label: "1080 x 1350", w: 1080, h: 1350 },
  { id: "wide", label: "1920 x 1080", w: 1920, h: 1080 },
];
