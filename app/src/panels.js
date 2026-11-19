// Vice City Cover Studio — photo panels.
//
// Each panel owns one photo plus its own crop: zoom, pan offsets, rotation
// and flip. A panel is rendered by drawing its photo cover-fit into a
// small offscreen canvas, running the grade over those pixels, then
// stamping the graded tile onto the cover with the panel's rotation and a
// white poster border. Keeping the grade on the small tile (not the whole
// cover) keeps previews fast and exports sharp.

import { applyGrade } from './grades.js';

export function defaultPanelState(photoIndex, index) {
  // Vary the starting crop a little per panel so a grid of one photo
  // still reads as different shots. Panel 0 (the hero) keeps a low zoom
  // and a slight downward shift so faces at the top of a portrait photo
  // stay in frame.
  if (index === 0) {
    return { photo: photoIndex, zoom: 1.02, ox: 0, oy: 0.3, rot: 0, flip: false };
  }
  return {
    photo: photoIndex,
    zoom: 1.08 + (index % 3) * 0.1,
    ox: (((index * 37) % 41) - 20) / 160,
    oy: 0.3 + (((index * 53) % 31) - 15) / 200,
    rot: 0,
    flip: false,
  };
}

// Cover-fit draw of one image into a rect, honouring zoom / pan / flip.
// `ctx` is already translated so (0,0) is the tile's top-left.
function drawCoverFit(ctx, img, w, h, panel) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * panel.zoom;
  const dw = iw * base;
  const dh = ih * base;
  // Clamp the pan so the photo always covers the tile: a wide pan must
  // never leave a bare strip along any edge.
  let dx = (w - dw) / 2 + panel.ox * w;
  let dy = (h - dh) / 2 + panel.oy * h;
  dx = Math.max(w - dw, Math.min(0, dx));
  dy = Math.max(h - dh, Math.min(0, dy));
  ctx.save();
  if (panel.flip) {
    ctx.translate(w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-w / 2, 0);
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function roundedPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// Render one panel onto the cover context. `tile` is a reusable offscreen
// canvas the caller owns; it is resized to the panel on every call.
export function drawPhotoPanel(ctx, tile, img, panel, rect, grade, options) {
  const w = Math.max(2, Math.round(rect.w));
  const h = Math.max(2, Math.round(rect.h));
  tile.width = w;
  tile.height = h;
  const tctx = tile.getContext('2d', { willReadFrequently: true });
  tctx.clearRect(0, 0, w, h);
  drawCoverFit(tctx, img, w, h, panel);
  const imageData = tctx.getImageData(0, 0, w, h);
  applyGrade(imageData, grade, {
    grain: options.grain,
    seed: 7 + options.panelIndex * 13,
  });
  tctx.putImageData(imageData, 0, 0);

  // Stamp the graded tile onto the cover, rotated around its centre.
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const corner = Math.max(2, Math.min(rect.w, rect.h) * 0.02);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((panel.rot || 0) + (rect.rot || 0)) * Math.PI / 180);
  roundedPath(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, corner);
  ctx.clip();
  ctx.drawImage(tile, -rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.restore();

  // White poster border + soft drop shadow around the tile.
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(((panel.rot || 0) + (rect.rot || 0)) * Math.PI / 180);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = Math.max(6, rect.w * 0.015);
  ctx.shadowOffsetY = Math.max(3, rect.h * 0.01);
  ctx.lineWidth = Math.max(2, Math.min(rect.w, rect.h) * 0.012);
  ctx.strokeStyle = '#fdf6ec';
  roundedPath(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, corner);
  ctx.stroke();
  ctx.restore();

  return { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
}

// A sunset gradient backdrop for the tilted-snapshot layout.
export function drawSunsetBackdrop(ctx, W, H) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#7597de');
  sky.addColorStop(0.62, '#ff7e5f');
  sky.addColorStop(0.8, '#feb47b');
  sky.addColorStop(1, '#1b0b2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Low sun disc.
  const sunX = W * 0.72;
  const sunY = H * 0.52;
  const sunR = Math.min(W, H) * 0.16;
  const sun = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR);
  sun.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  sun.addColorStop(0.6, 'rgba(255, 120, 90, 0.75)');
  sun.addColorStop(1, 'rgba(255, 120, 90, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  // Palm-ish silhouette band along the bottom of the photo area.
  ctx.fillStyle = 'rgba(16, 6, 28, 0.55)';
  ctx.fillRect(0, H * 0.68, W, H * 0.32);
}

// Soft vignette over the whole cover.
export function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.72,
  );
  g.addColorStop(0, 'rgba(0, 0, 0, 0)');
  g.addColorStop(1, 'rgba(8, 2, 16, 0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
