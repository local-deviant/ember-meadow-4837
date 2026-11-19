// Vice City Cover Studio — cover lettering.
//
// The title block is drawn on canvas with the bundled OFL fonts: Anton
// for the big block caption (shrunk with measureText until it fits) and
// Pacifico for the neon script subtitle. Nothing here loads a font from
// the network; both fonts are files under app/fonts/.

export const TITLE_FONT = 'Anton';
export const SCRIPT_FONT = 'Pacifico';

// Find the biggest Anton size (in px) that lets `text` fit `maxWidth`.
// Starts from `startSize` and steps down; never goes below `minSize`.
export function fitCaptionSize(ctx, text, maxWidth, startSize, minSize) {
  let size = startSize;
  ctx.font = `${size}px ${TITLE_FONT}, sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= Math.max(2, Math.round(size * 0.04));
    ctx.font = `${size}px ${TITLE_FONT}, sans-serif`;
  }
  return size;
}

// Draw the title band: dark gradient, accent rule on top, huge caption,
// neon script subtitle underneath, and a small "EST. 2026" star badge.
export function drawTitleBlock(ctx, band, caption, subtitle, accent, opts = {}) {
  const { x, y, w, h } = band;
  const pad = Math.max(10, w * 0.028);

  // Band background: deep violet-black fading up into the photo area.
  const bg = ctx.createLinearGradient(0, y, 0, y + h);
  bg.addColorStop(0, '#12081f');
  bg.addColorStop(0.12, '#170a2a');
  bg.addColorStop(1, '#0a0512');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  // Neon accent rule along the top edge of the band.
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, Math.max(3, h * 0.03));

  const captionText = (caption || 'VICE CITY').toUpperCase();
  const maxTextW = w - pad * 2;
  const captionSize = fitCaptionSize(ctx, captionText, maxTextW, h * 0.46, h * 0.16);
  const captionY = y + pad * 0.4 + captionSize * 0.86;

  // Caption: white fill, dark outline, warm drop shadow for punch.
  ctx.save();
  ctx.font = `${captionSize}px ${TITLE_FONT}, sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.55)';
  ctx.shadowBlur = captionSize * 0.12;
  ctx.shadowOffsetY = captionSize * 0.045;
  ctx.lineWidth = Math.max(2, captionSize * 0.07);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 4, 18, 0.85)';
  ctx.strokeText(captionText, x + pad, captionY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(captionText, x + pad, captionY);
  ctx.restore();

  // Subtitle in neon script, tucked under the caption on the left.
  if (subtitle) {
    const scriptSize = Math.min(h * 0.24, captionSize * 0.42);
    const scriptY = captionY + scriptSize * 1.15;
    ctx.save();
    ctx.font = `${scriptSize}px ${SCRIPT_FONT}, cursive`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = accent;
    ctx.shadowBlur = scriptSize * 0.5;
    ctx.fillStyle = accent;
    ctx.fillText(subtitle, x + pad, scriptY);
    ctx.restore();
  }

  // Star badge on the right: three stars + EST. 2026 in a small pill.
  const badgeText = 'EST. 2026';
  const starSize = Math.max(12, h * 0.14);
  ctx.save();
  ctx.font = `${Math.round(starSize)}px ${TITLE_FONT}, sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = accent;
  const stars = '★ ★ ★';
  const badgeY = y + h * 0.32;
  ctx.fillText(stars, x + w - pad, badgeY);
  ctx.font = `${Math.round(starSize * 0.72)}px ${TITLE_FONT}, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(badgeText, x + w - pad, badgeY + starSize * 1.15);
  ctx.restore();

  if (opts.showTag !== false) {
    ctx.save();
    ctx.font = `${Math.round(Math.max(11, h * 0.09))}px ${TITLE_FONT}, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText('VICE CITY  •  COVER STUDIO', x + pad, y + h - pad * 0.55);
    ctx.restore();
  }
}

// Measure a caption at a given size without drawing it.
export function captionWidth(ctx, text, size) {
  ctx.font = `${size}px ${TITLE_FONT}, sans-serif`;
  return ctx.measureText(text.toUpperCase()).width;
}
