// wording.js — caption lettering for Vice City Cover Studio.
// The title is set in Anton, all caps, white with a dark ink outline and
// a hard offset shadow, so it reads at thumbnail size. The subtitle is
// Pacifico, a neon script with a pink glow. Sizes auto-fit the title
// block: we measure the text and shrink until it fits.

export const TITLE_FONT = "Anton";
export const SCRIPT_FONT = "Pacifico";

// Find the largest font size (between minSize and maxSize) at which the
// text fits inside maxWidth. Returns the size in pixels.
export function fitCaptionSize(ctx, text, maxWidth, maxSize, minSize, fontFamily) {
  const words = (text || "").toUpperCase();
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${size}px ${fontFamily}, sans-serif`;
    if (ctx.measureText(words).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

// Draw the main caption centred in a rect. The text is upper-cased,
// outlined in near-black, filled white, and dropped a few pixels down
// and right in a hot pink shadow for the poster look.
export function drawCaption(ctx, text, rect, opts = {}) {
  const words = (text || "VICE CITY").toUpperCase();
  const family = opts.font || TITLE_FONT;
  const pad = rect.w * 0.02;
  const maxWidth = rect.w - pad * 2;
  const maxSize = opts.maxSize || Math.floor(rect.h * 0.62);
  const minSize = Math.max(18, Math.floor(rect.h * 0.22));
  const size = fitCaptionSize(ctx, words, maxWidth, maxSize, minSize, family);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const shadow = Math.max(2, Math.round(size * 0.06));

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${size}px ${family}, sans-serif`;
  // Pink drop shadow first, then the dark ink outline, then the white fill.
  ctx.fillStyle = opts.shadowColor || "#ff2e88";
  ctx.fillText(words, cx + shadow, cy + shadow);
  ctx.lineWidth = Math.max(2, Math.round(size * 0.09));
  ctx.strokeStyle = opts.outlineColor || "#12001f";
  ctx.lineJoin = "round";
  ctx.strokeText(words, cx, cy);
  ctx.fillStyle = opts.fillColor || "#ffffff";
  ctx.fillText(words, cx, cy);
  ctx.restore();
  return size;
}

// Draw the neon script subtitle beneath the caption, centred in a rect.
// The glow comes from a pink shadowBlur; the script is Pacifico.
export function drawSubtitle(ctx, text, rect, opts = {}) {
  const words = text || "";
  if (!words.trim()) return 0;
  const family = opts.font || SCRIPT_FONT;
  const pad = rect.w * 0.03;
  const maxWidth = rect.w - pad * 2;
  const maxSize = opts.maxSize || Math.floor(rect.h * 0.72);
  const minSize = Math.max(14, Math.floor(rect.h * 0.3));
  let size = maxSize;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  while (size > minSize) {
    ctx.font = `${size}px ${family}, cursive`;
    if (ctx.measureText(words).width <= maxWidth) break;
    size -= 2;
  }
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.font = `${size}px ${family}, cursive`;
  ctx.shadowColor = opts.glowColor || "#ff4dd2";
  ctx.shadowBlur = Math.max(6, Math.round(size * 0.45));
  ctx.fillStyle = opts.fillColor || "#ffd7ef";
  ctx.fillText(words, cx, cy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(words, cx, cy);
  ctx.restore();
  return size;
}

// Draw a small ribbon badge ("EST. 2026" style) with two stars, used in
// a corner of the cover as an original mark. Returns nothing.
export function drawBadge(ctx, text, x, y, scale = 1) {
  const label = (text || "EST. 2026").toUpperCase();
  const h = 34 * scale;
  ctx.save();
  ctx.font = `bold ${Math.round(15 * scale)}px ${TITLE_FONT}, sans-serif`;
  const tw = ctx.measureText(label).width;
  const w = tw + 34 * scale;
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(10,0,24,0.82)";
  // roundRect is supported in current desktop Chrome; fall back to a
  // plain rectangle on any canvas that lacks it, so the badge never fails.
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(0, 0, w, h, h / 2);
  } else {
    ctx.rect(0, 0, w, h);
  }
  ctx.fill();
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  ctx.fillStyle = "#ffd166";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("★", 10 * scale, h / 2 + 1);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, 26 * scale, h / 2 + 1);
  ctx.restore();
}
