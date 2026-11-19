// Vice City Cover Studio — layout definitions.
//
// Each layout describes, for a cover of width W and height H, where every
// photo panel sits and where the title block sits. All coordinates are
// fractions of the cover size, so one layout works at 1080x1080, 1080x1350
// and 1920x1080 without any special casing. Panels carry a rotation in
// degrees (0 for the straight poster layouts); the title block is the band
// the big caption lives in.

export const LAYOUTS = [
  { id: 'hero', label: 'Hero + 3', hint: 'One big photo, three small ones' },
  { id: 'grid9', label: 'Grid 9', hint: 'Nine-panel poster collage' },
  { id: 'fullbleed', label: 'Full Bleed', hint: 'One photo, strip of four' },
  { id: 'tilted', label: 'Tilted Snapshots', hint: 'Slanted prints on sunset' },
  { id: 'story', label: 'Story', hint: 'Tall stack for portrait posts' },
];

function rect(x, y, w, h, rot = 0) {
  return { x, y, w, h, rot };
}

// Split a horizontal band into n equal panels with a gap between them.
function rowPanels(x, y, w, h, n, gap) {
  const totalGap = gap * (n - 1);
  const pw = (w - totalGap) / n;
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(rect(x + i * (pw + gap), y, pw, h));
  return out;
}

// Split a vertical band into n equal panels with a gap between them.
function columnPanels(x, y, w, h, n, gap) {
  const totalGap = gap * (n - 1);
  const ph = (h - totalGap) / n;
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(rect(x, y + i * (ph + gap), w, ph));
  return out;
}

// The title band every layout reserves at the bottom of the cover.
function titleBand(W, H, fraction) {
  const h = H * fraction;
  return { x: 0, y: H - h, w: W, h };
}

export function layoutPanels(layoutId, W, H) {
  const gap = Math.max(4, Math.round(Math.min(W, H) * 0.012));
  const id = LAYOUTS.some((item) => item.id === layoutId) ? layoutId : 'hero';

  if (id === 'hero') {
    const title = titleBand(W, H, 0.2);
    const photoH = title.y - gap;
    const heroW = W * 0.62;
    const sideX = heroW + gap;
    const sideW = W - sideX;
    return {
      panels: [
        rect(0, 0, heroW, photoH),
        ...columnPanels(sideX, 0, sideW, photoH, 3, gap),
      ],
      title,
      backdrop: 'dark',
    };
  }

  if (id === 'grid9') {
    const title = titleBand(W, H, 0.18);
    const gridH = title.y - gap;
    const panels = [];
    const cellW = (W - gap * 2) / 3;
    const cellH = (gridH - gap * 2) / 3;
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        panels.push(rect(c * (cellW + gap), r * (cellH + gap), cellW, cellH));
      }
    }
    return { panels, title, backdrop: 'dark' };
  }

  if (id === 'fullbleed') {
    const title = titleBand(W, H, 0.2);
    const stripH = H * 0.17;
    const stripY = title.y - gap - stripH;
    const photoH = stripY - gap;
    return {
      panels: [
        rect(0, 0, W, photoH),
        ...rowPanels(0, stripY, W, stripH, 4, gap),
      ],
      title,
      backdrop: 'dark',
    };
  }

  if (id === 'tilted') {
    const title = titleBand(W, H, 0.2);
    const areaH = title.y - gap;
    const pw = W * 0.44;
    const ph = areaH * 0.82;
    return {
      panels: [
        rect(W * 0.03, areaH * 0.06, pw, ph, -6),
        rect(W * 0.31, areaH * 0.1, pw, ph, 3),
        rect(W * 0.56, areaH * 0.04, pw * 0.82, ph * 0.94, -2),
      ],
      title,
      backdrop: 'sunset',
    };
  }

  // story: tall stack, built for the 1080x1350 portrait size.
  const title = titleBand(W, H, 0.26);
  const midH = H * 0.22;
  const midY = title.y - gap - midH;
  const topH = midY - gap;
  return {
    panels: [
      rect(0, 0, W, topH),
      ...rowPanels(0, midY, W, midH, 2, gap),
    ],
    title,
    backdrop: 'dark',
  };
}

export function layoutById(layoutId) {
  return LAYOUTS.find((item) => item.id === layoutId) || LAYOUTS[0];
}
