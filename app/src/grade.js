// grade.js — colour grades for Vice City Cover Studio.
// A grade is a colour ramp: five stops from shadow to highlight. We turn
// the ramp into a 256-entry lookup table, then remap every pixel's
// luminance through it, so a plain photo takes on a sunset or neon cast.
// Grain and vignette are drawn on top for the printed-poster feel.

export const GRADES = [
  { id: "neon-sunset", name: "Neon Sunset" },
  { id: "vice-gold", name: "Vice Gold" },
  { id: "hot-pink-night", name: "Hot Pink Night" },
  { id: "palm-noir", name: "Palm Noir" },
  { id: "teal-dusk", name: "Teal Dusk" },
];

// Five stops per grade: [r, g, b] from the darkest shadow to the brightest
// highlight. These ramps are the studio's own palette, mixed by hand.
const RAMPS = {
  "neon-sunset": [
    [10, 0, 24],
    [59, 10, 94],
    [255, 46, 136],
    [255, 138, 61],
    [255, 233, 168],
  ],
  "vice-gold": [
    [5, 5, 5],
    [10, 46, 46],
    [15, 118, 110],
    [245, 185, 66],
    [255, 243, 196],
  ],
  "hot-pink-night": [
    [2, 1, 8],
    [11, 16, 53],
    [109, 40, 217],
    [255, 77, 157],
    [255, 228, 241],
  ],
  "palm-noir": [
    [0, 0, 0],
    [26, 26, 26],
    [128, 128, 128],
    [232, 224, 208],
    [255, 248, 236],
  ],
  "teal-dusk": [
    [1, 10, 15],
    [6, 42, 51],
    [14, 116, 144],
    [255, 122, 89],
    [255, 232, 201],
  ],
};

// Linear interpolation between two stops.
function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// Build the 256-entry lookup table for a grade id. The table holds
// [r, g, b] triples, one per luminance level 0..255.
export function makeLut(gradeId) {
  const ramp = RAMPS[gradeId] || RAMPS["neon-sunset"];
  const lut = new Uint8Array(256 * 3);
  const spans = ramp.length - 1;
  for (let i = 0; i < 256; i++) {
    const pos = (i / 255) * spans;
    const seg = Math.min(spans - 1, Math.floor(pos));
    const t = pos - seg;
    const [r, g, b] = mix(ramp[seg], ramp[seg + 1], t);
    lut[i * 3] = r;
    lut[i * 3 + 1] = g;
    lut[i * 3 + 2] = b;
  }
  return lut;
}

// Remap an ImageData's pixels through the lookup table in place.
// strength 0 leaves the photo untouched, 1 replaces it with the ramp.
export function applyGrade(imageData, lut, strength = 0.85) {
  const d = imageData.data;
  const s = Math.max(0, Math.min(1, strength));
  if (s <= 0) return imageData;
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    const j = lum * 3;
    d[i] = Math.round(d[i] * (1 - s) + lut[j] * s);
    d[i + 1] = Math.round(d[i + 1] * (1 - s) + lut[j + 1] * s);
    d[i + 2] = Math.round(d[i + 2] * (1 - s) + lut[j + 2] * s);
  }
  return imageData;
}

// A tiny deterministic PRNG (mulberry32) so the grain looks the same on
// every run of the same cover.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sprinkle monochrome grain over an ImageData in place. amount is the
// peak brightness shift (0..~24). The seed keeps it deterministic.
export function addGrain(imageData, amount = 9, seed = 20261119) {
  const d = imageData.data;
  const rnd = mulberry32(seed);
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 2 * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  return imageData;
}

// Darken the corners with a radial gradient, drawn on a 2D context.
export function addVignette(ctx, w, h, strength = 0.32) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.max(w, h) * 0.72;
  const g = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
