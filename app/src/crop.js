// crop.js — per-panel photo placement for Vice City Cover Studio.
// Each panel remembers which photo it shows and how that photo is
// cropped: a pan offset, a zoom factor, a rotation and an optional flip.
// Drawing uses cover-fit, so the panel is always filled edge to edge.

// A fresh panel state. photo is an index into the studio's photo list.
export function createPanel(photo = 0) {
  return {
    photo,
    panX: 0, // -1..1, fraction of the photo's width
    panY: 0, // -1..1, fraction of the photo's height
    zoom: 1, // 1 = cover-fit, larger = closer
    rot: 0, // degrees, clockwise
    flip: false,
  };
}

// Keep the pan inside the photo so no empty edge shows. The bound
// shrinks as the zoom grows: at zoom 1 the photo just covers the panel,
// so the pan must stay near zero; zoomed in, it can wander further.
export function clampPan(panel) {
  const slack = Math.max(0, (panel.zoom - 1) / panel.zoom) * 0.5;
  panel.panX = Math.max(-slack, Math.min(slack, panel.panX));
  panel.panY = Math.max(-slack, Math.min(slack, panel.panY));
  panel.zoom = Math.max(1, Math.min(4, panel.zoom));
  // Keep the rotation in a single turn so repeated Rotate clicks wrap.
  panel.rot = ((panel.rot % 360) + 360) % 360;
  return panel;
}

// Draw one photo into a panel rect on ctx, honouring the panel state.
// The photo is cover-fit, then panned, zoomed, rotated and flipped.
// The panel's rotation is applied around its own centre.
export function drawPanelPhoto(ctx, img, rect, panel) {
  if (!img || !img.naturalWidth) return;
  const p = clampPan({ ...panel });
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  ctx.translate(cx, cy);
  if (p.rot) ctx.rotate((p.rot * Math.PI) / 180);
  if (p.flip) ctx.scale(-1, 1);

  // Cover-fit: scale so the photo covers the panel, then zoom.
  const fit = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = fit * p.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  // Pan moves the photo in the opposite direction of the drag.
  const dx = -p.panX * dw * 0.5;
  const dy = -p.panY * dh * 0.5;
  ctx.drawImage(img, dx - dw / 2, dy - dh / 2, dw, dh);
  ctx.restore();
}

// Draw the poster's inked edge around a panel: a dark border with a
// thin bright inner line, so panels read as separate poster art.
export function drawPanelEdge(ctx, rect, tilt = 0) {
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (tilt) ctx.rotate((tilt * Math.PI) / 180);
  const hw = rect.w / 2;
  const hh = rect.h / 2;
  ctx.lineWidth = Math.max(3, Math.round(Math.min(rect.w, rect.h) * 0.012));
  ctx.strokeStyle = "#0d0018";
  ctx.strokeRect(-hw, -hh, rect.w, rect.h);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.strokeRect(-hw + 4, -hh + 4, rect.w - 8, rect.h - 8);
  ctx.restore();
}
