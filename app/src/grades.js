// Vice City Cover Studio — colour grades.
//
// A grade is a gradient map: the brightness of each pixel picks a colour
// from a hand-built ramp, then the mapped colour is blended back with the
// original photo so faces and detail stay readable. The ramp is baked into
// a 256-entry lookup table once per grade, and the per-pixel pass is a
// plain loop over ImageData — no CSS filter, no library, fully offline.
// Grain is added with a tiny seeded generator so every export of the same
// cover is byte-identical.

export const GRADES = [
  {
    id: 'neon-sunset',
    label: 'Neon Sunset',
    accent: '#ff2e88',
    stops: [
      [0.0, 26, 11, 46],
      [0.25, 94, 16, 96],
      [0.5, 255, 46, 136],
      [0.75, 255, 122, 61],
      [1.0, 255, 179, 71],
    ],
    strength: 0.62,
    saturate: 1.25,
  },
  {
    id: 'vice-gold',
    label: 'Vice Gold',
    accent: '#f5b942',
    stops: [
      [0.0, 6, 42, 42],
      [0.3, 18, 84, 78],
      [0.55, 196, 138, 44],
      [0.8, 245, 185, 66],
      [1.0, 255, 243, 214],
    ],
    strength: 0.55,
    saturate: 1.15,
  },
  {
    id: 'hot-pink',
    label: 'Hot Pink Night',
    accent: '#ff5da2',
    stops: [
      [0.0, 11, 16, 53],
      [0.3, 48, 32, 110],
      [0.55, 178, 44, 140],
      [0.8, 255, 93, 162],
      [1.0, 255, 227, 241],
    ],
    strength: 0.6,
    saturate: 1.3,
  },
  {
    id: 'palm-noir',
    label: 'Palm Noir',
    accent: '#e8d9b0',
    stops: [
      [0.0, 8, 8, 10],
      [0.35, 74, 70, 66],
      [0.65, 168, 160, 148],
      [1.0, 252, 246, 232],
    ],
    strength: 0.7,
    saturate: 0.25,
  },
  {
    id: 'ocean-drive',
    label: 'Ocean Drive',
    accent: '#19c3e6',
    stops: [
      [0.0, 4, 18, 46],
      [0.3, 10, 74, 120],
      [0.55, 25, 195, 230],
      [0.8, 120, 226, 214],
      [1.0, 255, 233, 176],
    ],
    strength: 0.58,
    saturate: 1.2,
  },
];

export function gradeById(gradeId) {
  return GRADES.find((item) => item.id === gradeId) || GRADES[0];
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

// Bake a grade's stops into a 256-entry ramp: ramp[i] = [r, g, b].
export function buildGradeRamp(grade) {
  const ramp = new Array(256);
  const stops = grade.stops;
  for (let i = 0; i < 256; i += 1) {
    const t = i / 255;
    let s = 0;
    while (s < stops.length - 2 && t > stops[s + 1][0]) s += 1;
    const a = stops[s];
    const b = stops[s + 1];
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    ramp[i] = [mix(a[1], b[1], f), mix(a[2], b[2], f), mix(a[3], b[3], f)];
  }
  return ramp;
}

// Deterministic pseudo-random generator (mulberry32) for grain.
export function seededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

// Apply a grade in place to ImageData. `grain` adds fine film grain with a
// fixed seed so repeated renders of the same cover match exactly.
export function applyGrade(imageData, grade, options = {}) {
  const ramp = buildGradeRamp(grade);
  const data = imageData.data;
  const strength = grade.strength;
  const keep = 1 - strength;
  const sat = grade.saturate;
  const grainAmount = options.grain ? 9 : 0;
  const rand = seededRandom(options.seed ?? 7);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    const mapped = ramp[lum];
    // Blend mapped colour with the original, then push saturation.
    let nr = mapped[0] * strength + r * keep;
    let ng = mapped[1] * strength + g * keep;
    let nb = mapped[2] * strength + b * keep;
    if (sat !== 1) {
      const grey = 0.299 * nr + 0.587 * ng + 0.114 * nb;
      nr = grey + (nr - grey) * sat;
      ng = grey + (ng - grey) * sat;
      nb = grey + (nb - grey) * sat;
    }
    if (grainAmount > 0) {
      const noise = (rand() - 0.5) * 2 * grainAmount;
      nr += noise;
      ng += noise;
      nb += noise;
    }
    data[i] = nr < 0 ? 0 : nr > 255 ? 255 : nr;
    data[i + 1] = ng < 0 ? 0 : ng > 255 ? 255 : ng;
    data[i + 2] = nb < 0 ? 0 : nb > 255 ? 255 : nb;
  }
  return imageData;
}

// A small swatch strip for the grade buttons: the ramp as CSS stops.
export function gradeSwatchCss(grade) {
  return grade.stops
    .map(([t, r, g, b]) => `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)}) ${Math.round(t * 100)}%`)
    .join(', ');
}
