// app.js — main wiring for Vice City Cover Studio.
// Owns the studio state, draws the cover onto a canvas, wires the
// editor controls, loads the sample photos, takes uploads, and exports
// PNGs in the three post sizes. All drawing goes through renderCoverTo,
// so the preview, the export and the ?shot= scenes share one renderer.

import { LAYOUTS, EXPORT_SIZES, panelsFor } from "./arrange.js";
import { GRADES, makeLut, applyGrade, addGrain, addVignette } from "./grade.js";
import { drawCaption, drawSubtitle, drawBadge } from "./wording.js";
import { createPanel, drawPanelPhoto, drawPanelEdge } from "./crop.js";
import { SCENES, shotFromUrl, applyScene } from "./capture.js";

const SAMPLE_PHOTOS = [
  { name: "Boulevard", src: "samples/boulevard.jpg" },
  { name: "Pier", src: "samples/pier.jpg" },
];

const state = {
  layout: "hero-trio",
  grade: "neon-sunset",
  caption: "VICE CITY",
  subtitle: "Neon Shore",
  size: "wide",
  grain: true,
  vignette: true,
  photos: [], // { name, img } in load order
  panels: [createPanel(0), createPanel(1), createPanel(0), createPanel(1)],
  selected: 0,
};

let preview = null;
let previewCtx = null;
let lutCache = {};

// Make sure the panels array matches the current layout's panel count:
// keep the panels we already have, create fresh ones for new slots.
function syncPanels() {
  const need = panelsFor(state.layout, 100, 100).panels.length;
  while (state.panels.length < need) {
    state.panels.push(createPanel(state.panels.length % Math.max(1, state.photos.length)));
  }
  state.panels.length = need;
  state.selected = Math.min(state.selected, need - 1);
}

function lutFor(gradeId) {
  if (!lutCache[gradeId]) lutCache[gradeId] = makeLut(gradeId);
  return lutCache[gradeId];
}

// Grade one photo into an offscreen canvas of the panel's size, then
// return that canvas so the caller can draw it (tilted if needed).
function gradedPanel(img, rect, panel) {
  const off = document.createElement("canvas");
  off.width = Math.max(2, rect.w);
  off.height = Math.max(2, rect.h);
  const octx = off.getContext("2d");
  drawPanelPhoto(octx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, panel);
  const data = octx.getImageData(0, 0, off.width, off.height);
  applyGrade(data, lutFor(state.grade), 0.85);
  octx.putImageData(data, 0, 0);
  return off;
}

// Draw the whole cover onto ctx at width w and height h. This is the
// single renderer used by the preview, the exports and the shot scenes.
export function renderCoverTo(ctx, w, h) {
  syncPanels();
  const { panels, title } = panelsFor(state.layout, w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0d0018";
  ctx.fillRect(0, 0, w, h);

  panels.forEach((rect, i) => {
    const panel = state.panels[i];
    const photo = state.photos[panel.photo];
    if (!photo || !photo.img) return;
    const graded = gradedPanel(photo.img, rect, panel);
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    if (rect.rot) ctx.rotate((rect.rot * Math.PI) / 180);
    ctx.drawImage(graded, -rect.w / 2, -rect.h / 2, rect.w, rect.h);
    ctx.restore();
    drawPanelEdge(ctx, rect, rect.rot);
  });

  // Title block: caption across the top of the block, subtitle below it.
  const capRect = { x: title.x, y: title.y, w: title.w, h: title.h * 0.62 };
  const subRect = { x: title.x, y: title.y + title.h * 0.64, w: title.w, h: title.h * 0.36 };
  drawCaption(ctx, state.caption, capRect);
  drawSubtitle(ctx, state.subtitle, subRect);
  drawBadge(ctx, "EST. 2026", Math.round(w * 0.03), Math.round(h * 0.03), Math.max(0.6, w / 1080));

  if (state.grain) {
    const data = ctx.getImageData(0, 0, w, h);
    addGrain(data, 9, 20261119);
    ctx.putImageData(data, 0, 0);
  }
  if (state.vignette) addVignette(ctx, w, h, 0.32);
}

function previewSize() {
  const size = EXPORT_SIZES.find((s) => s.id === state.size) || EXPORT_SIZES[2];
  const long = 900;
  const scale = long / Math.max(size.w, size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function renderPreview() {
  if (!preview || !previewCtx) return;
  const { w, h } = previewSize();
  preview.width = w;
  preview.height = h;
  renderCoverTo(previewCtx, w, h);
}

function photoOptions() {
  return state.photos.map((p, i) => ({ value: i, label: p.name }));
}

function buildPanelList() {
  const list = document.getElementById("panel-list");
  if (!list) return;
  list.innerHTML = "";
  syncPanels();
  state.panels.forEach((panel, i) => {
    const row = document.createElement("div");
    row.className = "panel-row" + (i === state.selected ? " selected" : "");
    row.dataset.index = String(i);

    const title = document.createElement("span");
    title.className = "panel-name";
    title.textContent = `Panel ${i + 1}`;
    row.appendChild(title);

    const pick = document.createElement("select");
    pick.className = "panel-photo";
    pick.setAttribute("aria-label", `Photo for panel ${i + 1}`);
    photoOptions().forEach((opt) => {
      const o = document.createElement("option");
      o.value = String(opt.value);
      o.textContent = opt.label;
      if (opt.value === panel.photo) o.selected = true;
      pick.appendChild(o);
    });
    pick.addEventListener("change", () => {
      panel.photo = Number(pick.value);
      renderPreview();
    });
    row.appendChild(pick);

    const zoom = document.createElement("input");
    zoom.type = "range";
    zoom.min = "1";
    zoom.max = "3";
    zoom.step = "0.05";
    zoom.value = String(panel.zoom);
    zoom.className = "panel-zoom";
    zoom.setAttribute("aria-label", `Zoom for panel ${i + 1}`);
    zoom.addEventListener("input", () => {
      panel.zoom = Number(zoom.value);
      renderPreview();
    });
    row.appendChild(zoom);

    const rot = document.createElement("button");
    rot.type = "button";
    rot.className = "mini-btn";
    rot.textContent = "Rotate";
    rot.addEventListener("click", () => {
      panel.rot = (panel.rot + 15) % 360;
      renderPreview();
    });
    row.appendChild(rot);

    const flip = document.createElement("button");
    flip.type = "button";
    flip.className = "mini-btn";
    flip.textContent = "Flip";
    flip.addEventListener("click", () => {
      panel.flip = !panel.flip;
      renderPreview();
    });
    row.appendChild(flip);

    row.addEventListener("click", (ev) => {
      if (ev.target === row || ev.target === title) {
        state.selected = i;
        buildPanelList();
        renderPreview();
      }
    });
    list.appendChild(row);
  });
}

function buildPickers() {
  const layoutBox = document.getElementById("layout-picker");
  if (layoutBox) {
    layoutBox.innerHTML = "";
    LAYOUTS.forEach((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pick" + (l.id === state.layout ? " active" : "");
      b.textContent = l.name;
      b.addEventListener("click", () => {
        state.layout = l.id;
        renderPreview();
        buildPanelList();
        buildPickers();
      });
      layoutBox.appendChild(b);
    });
  }
  const gradeBox = document.getElementById("grade-picker");
  if (gradeBox) {
    gradeBox.innerHTML = "";
    GRADES.forEach((g) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pick" + (g.id === state.grade ? " active" : "");
      b.textContent = g.name;
      b.addEventListener("click", () => {
        state.grade = g.id;
        renderPreview();
        buildPickers();
      });
      gradeBox.appendChild(b);
    });
  }
  const sizeBox = document.getElementById("size-picker");
  if (sizeBox) {
    sizeBox.innerHTML = "";
    EXPORT_SIZES.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pick" + (s.id === state.size ? " active" : "");
      b.textContent = s.label;
      b.addEventListener("click", () => {
        state.size = s.id;
        renderPreview();
        buildPickers();
      });
      sizeBox.appendChild(b);
    });
  }
}

function downloadPng(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(false);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(true);
    }, "image/png");
  });
}

async function exportOne(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId);
  if (!size) return false;
  const status = document.getElementById("export-status");
  if (state.photos.length === 0) {
    if (status) status.textContent = "Add a photo first — nothing to export yet.";
    return false;
  }
  const off = document.createElement("canvas");
  off.width = size.w;
  off.height = size.h;
  const octx = off.getContext("2d");
  renderCoverTo(octx, size.w, size.h);
  const ok = await downloadPng(off, `cover-${size.w}x${size.h}.png`);
  if (status) status.textContent = ok ? `Saved cover-${size.w}x${size.h}.png` : "Export failed";
  return ok;
}

async function exportAll() {
  for (const s of EXPORT_SIZES) {
    // A short pause between downloads so the browser keeps each one.
    await exportOne(s.id);
    await new Promise((r) => setTimeout(r, 350));
  }
}

function addPhotoFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        state.photos.push({ name: file.name.replace(/\.[^.]+$/, ""), img });
        resolve(true);
      };
      img.onerror = () => resolve(false);
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadSamples() {
  for (const sample of SAMPLE_PHOTOS) {
    const img = await loadImage(sample.src);
    if (img) state.photos.push({ name: sample.name, img });
  }
}

function panelAtPoint(px, py) {
  const rect = preview.getBoundingClientRect();
  const scaleX = preview.width / rect.width;
  const scaleY = preview.height / rect.height;
  const x = (px - rect.left) * scaleX;
  const y = (py - rect.top) * scaleY;
  const { panels } = panelsFor(state.layout, preview.width, preview.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return -1;
}

function wireCanvas() {
  if (!preview) return;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  preview.addEventListener("pointerdown", (ev) => {
    const i = panelAtPoint(ev.clientX, ev.clientY);
    if (i >= 0) {
      state.selected = i;
      buildPanelList();
      renderPreview();
      dragging = true;
      lastX = ev.clientX;
      lastY = ev.clientY;
      preview.setPointerCapture(ev.pointerId);
    }
  });
  preview.addEventListener("pointermove", (ev) => {
    if (!dragging) return;
    const panel = state.panels[state.selected];
    if (!panel) return;
    const rect = preview.getBoundingClientRect();
    panel.panX += ((ev.clientX - lastX) / rect.width) * 2;
    panel.panY += ((ev.clientY - lastY) / rect.height) * 2;
    lastX = ev.clientX;
    lastY = ev.clientY;
    renderPreview();
  });
  preview.addEventListener("pointerup", () => {
    dragging = false;
  });
  preview.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    panel.zoom = Math.max(1, Math.min(4, panel.zoom + (ev.deltaY < 0 ? 0.12 : -0.12)));
    // Update just the selected row's slider instead of rebuilding the
    // whole panel list, so the slider keeps focus while scrolling.
    const row = document.querySelector(`.panel-row[data-index="${state.selected}"] .panel-zoom`);
    if (row) row.value = String(panel.zoom);
    renderPreview();
  }, { passive: false });
}

function wireControls() {
  const caption = document.getElementById("caption-input");
  if (caption) {
    caption.value = state.caption;
    caption.addEventListener("input", () => {
      state.caption = caption.value || "VICE CITY";
      renderPreview();
    });
  }
  const subtitle = document.getElementById("subtitle-input");
  if (subtitle) {
    subtitle.value = state.subtitle;
    subtitle.addEventListener("input", () => {
      state.subtitle = subtitle.value;
      renderPreview();
    });
  }
  const grain = document.getElementById("grain-toggle");
  if (grain) {
    grain.checked = state.grain;
    grain.addEventListener("change", () => {
      state.grain = grain.checked;
      renderPreview();
    });
  }
  const vignette = document.getElementById("vignette-toggle");
  if (vignette) {
    vignette.checked = state.vignette;
    vignette.addEventListener("change", () => {
      state.vignette = vignette.checked;
      renderPreview();
    });
  }
  const upload = document.getElementById("photo-upload");
  if (upload) {
    upload.addEventListener("change", async () => {
      const files = Array.from(upload.files || []).filter((f) => f.type.startsWith("image/"));
      for (const f of files) await addPhotoFile(f);
      buildPanelList();
      renderPreview();
      upload.value = "";
    });
  }
  const drop = document.getElementById("drop-zone");
  if (drop) {
    drop.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      drop.classList.add("dragging");
    });
    drop.addEventListener("dragleave", () => drop.classList.remove("dragging"));
    drop.addEventListener("drop", async (ev) => {
      ev.preventDefault();
      drop.classList.remove("dragging");
      const files = Array.from(ev.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
      for (const f of files) await addPhotoFile(f);
      buildPanelList();
      renderPreview();
    });
  }
  const exportButtons = document.querySelectorAll("[data-export]");
  exportButtons.forEach((b) => {
    b.addEventListener("click", () => exportOne(b.dataset.export));
  });
  const exportAllBtn = document.getElementById("export-all");
  if (exportAllBtn) exportAllBtn.addEventListener("click", exportAll);
}

async function bootStudio() {
  preview = document.getElementById("cover-canvas");
  previewCtx = preview ? preview.getContext("2d") : null;
  await loadSamples();

  const shot = shotFromUrl();
  if (shot) {
    applyScene(state, shot);
    if (shot === "cover" || shot === "portrait" || shot === "square") {
      document.body.classList.add("shot-cover");
    }
  }
  syncPanels();

  // Load the bundled fonts, then redraw so the lettering uses them.
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
  } catch {
    // If a font fails to load, the canvas falls back to sans-serif.
  }
  renderPreview();
  buildPanelList();
  buildPickers();
  wireControls();
  wireCanvas();
  renderPreview();
}

document.addEventListener("DOMContentLoaded", bootStudio);
