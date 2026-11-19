// Vice City Cover Studio — editor wiring and cover renderer.
//
// This module owns the app state, draws the live preview, wires every
// control, and renders full-size exports. The cover itself is drawn by
// one function, renderCover, shared by the preview, the exports and the
// deterministic ?shot= scenes, so the screenshot always shows exactly
// what an export looks like.

import { LAYOUTS, layoutPanels, layoutById } from './layouts.js';
import { GRADES, gradeById, gradeSwatchCss } from './grades.js';
import { drawTitleBlock } from './lettering.js';
import { defaultPanelState, drawPhotoPanel, drawSunsetBackdrop, drawVignette } from './panels.js';
import { parseShot, isCoverOnlyShot, markShotReady } from './shots.js';

const SIZES = [
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
];

const SAMPLES = [
  { name: 'Boulevard', src: 'samples/boulevard.jpg' },
  { name: 'Pier', src: 'samples/pier.jpg' },
];

const state = {
  layout: 'hero',
  grade: 'neon-sunset',
  caption: 'SUNSET HEIST',
  subtitle: 'Vice City Nights',
  grain: true,
  vignette: true,
  size: SIZES[0],
  photos: [],
  panels: [],
  selected: 0,
};

let previewCanvas = null;
let previewCtx = null;
let tileCanvas = null;
let statusEl = null;
let shot = null;

function $(id) {
  return document.getElementById(id);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load ' + src));
    img.src = src;
  });
}

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch (err) {
    setStatus('Fonts loading late — lettering falls back to sans.');
  }
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

// Draw the whole cover onto `canvas` at W x H. Pure function of state:
// same state, same pixels (grain is seeded, fonts are local).
export function renderCover(canvas, W, H) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const plan = layoutPanels(state.layout, W, H);

  ctx.fillStyle = '#0a0512';
  ctx.fillRect(0, 0, W, H);
  if (plan.backdrop === 'sunset') drawSunsetBackdrop(ctx, W, H);

  plan.panels.forEach((panelRect, i) => {
    const panelState = state.panels[i] || defaultPanelState(0, i);
    const photo = state.photos[panelState.photo] || state.photos[0];
    if (!photo) return;
    drawPhotoPanel(ctx, tileCanvas, photo.img, panelState, panelRect, grade, {
      grain: state.grain,
      panelIndex: i,
    });
  });

  if (state.vignette) drawVignette(ctx, W, H);
  drawTitleBlock(ctx, plan.title, state.caption, state.subtitle, grade.accent, {});
  return canvas;
}

function renderPreview() {
  if (!previewCanvas || state.photos.length === 0) return;
  const scale = 960 / state.size.w;
  const pw = Math.round(state.size.w * scale);
  const ph = Math.round(state.size.h * scale);
  renderCover(previewCanvas, pw, ph);
  previewCanvas.style.aspectRatio = `${pw} / ${ph}`;
}

// Rebuild the panel list whenever photos arrive, keeping any crop the
// user already set on a panel.
function ensurePanels() {
  for (let i = state.panels.length; i < 9; i += 1) {
    state.panels.push(defaultPanelState(i % Math.max(1, state.photos.length), i));
  }
}

function currentPlan() {
  return layoutPanels(state.layout, previewCanvas.width, previewCanvas.height);
}

// Which panel (if any) sits under a point on the preview canvas.
function panelAt(clientX, clientY) {
  const rect = previewCanvas.getBoundingClientRect();
  const px = (clientX - rect.left) * (previewCanvas.width / rect.width);
  const py = (clientY - rect.top) * (previewCanvas.height / rect.height);
  const plan = currentPlan();
  for (let i = plan.panels.length - 1; i >= 0; i -= 1) {
    const r = plan.panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

function refreshPanelControls() {
  const panel = state.panels[state.selected];
  if (!panel) return;
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${currentPlan().panels.length}`;
  const select = $('panelPhoto');
  select.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = photo.name;
    select.appendChild(opt);
  });
  select.value = String(panel.photo);
  $('zoomRange').value = String(panel.zoom);
  $('zoomValue').textContent = `${panel.zoom.toFixed(2)}×`;
  $('flipBtn').textContent = panel.flip ? 'Flipped ✓' : 'Flip photo';
}

function buildButtons() {
  const layoutBox = $('layoutBtns');
  LAYOUTS.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = item.label;
    btn.title = item.hint;
    btn.addEventListener('click', () => {
      state.layout = item.id;
      state.selected = 0;
      syncActiveButtons();
      refreshPanelControls();
      renderPreview();
    });
    layoutBox.appendChild(btn);
  });

  const gradeBox = $('gradeBtns');
  GRADES.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip grade-chip';
    btn.textContent = item.label;
    btn.style.backgroundImage = `linear-gradient(90deg, ${gradeSwatchCss(item)})`;
    btn.addEventListener('click', () => {
      state.grade = item.id;
      syncActiveButtons();
      renderPreview();
    });
    gradeBox.appendChild(btn);
  });
}

function syncActiveButtons() {
  document.querySelectorAll('#layoutBtns .chip').forEach((btn, i) => {
    btn.classList.toggle('active', LAYOUTS[i].id === state.layout);
  });
  document.querySelectorAll('#gradeBtns .chip').forEach((btn, i) => {
    btn.classList.toggle('active', GRADES[i].id === state.grade);
  });
  document.querySelectorAll('#sizeBtns .chip').forEach((btn, i) => {
    btn.classList.toggle('active', SIZES[i].id === state.size.id);
  });
}

function buildSizeButtons() {
  const box = $('sizeBtns');
  SIZES.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = item.label;
    btn.addEventListener('click', () => {
      state.size = item;
      syncActiveButtons();
      renderPreview();
    });
    box.appendChild(btn);
  });
}

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed — canvas was empty.');
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(true);
    }, 'image/png');
  });
}

async function exportOne(size) {
  const off = document.createElement('canvas');
  renderCover(off, size.w, size.h);
  const ok = await downloadCanvas(off, `vice-city-cover-${size.w}x${size.h}.png`);
  if (ok) setStatus(`Saved vice-city-cover-${size.w}x${size.h}.png`);
  return ok;
}

async function exportAll() {
  setStatus('Exporting all three sizes…');
  for (const size of SIZES) {
    // eslint-disable-next-line no-await-in-loop
    await exportOne(size);
  }
  setStatus('Saved all three sizes — check your downloads.');
}

function wireEditor() {
  buildButtons();
  buildSizeButtons();
  syncActiveButtons();

  $('captionInput').addEventListener('input', (e) => {
    state.caption = e.target.value;
    renderPreview();
  });
  $('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value;
    renderPreview();
  });
  $('grainToggle').addEventListener('change', (e) => {
    state.grain = e.target.checked;
    renderPreview();
  });
  $('vignetteToggle').addEventListener('change', (e) => {
    state.vignette = e.target.checked;
    renderPreview();
  });

  $('fileInput').addEventListener('change', (e) => {
    addUploads(e.target.files);
    e.target.value = '';
  });

  const dropZone = $('dropZone');
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragging');
    addUploads(e.dataTransfer.files);
  });

  $('sampleBtns').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sample]');
    if (!btn) return;
    const index = Number(btn.dataset.sample);
    state.panels[state.selected].photo = index;
    refreshPanelControls();
    renderPreview();
  });

  $('panelPhoto').addEventListener('change', (e) => {
    state.panels[state.selected].photo = Number(e.target.value);
    renderPreview();
  });
  $('zoomRange').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    $('zoomValue').textContent = `${Number(e.target.value).toFixed(2)}×`;
    renderPreview();
  });
  $('rotLeft').addEventListener('click', () => nudgeRotation(-5));
  $('rotRight').addEventListener('click', () => nudgeRotation(5));
  $('flipBtn').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    panel.flip = !panel.flip;
    refreshPanelControls();
    renderPreview();
  });
  $('resetPanel').addEventListener('click', () => {
    state.panels[state.selected] = defaultPanelState(state.panels[state.selected].photo, state.selected);
    refreshPanelControls();
    renderPreview();
  });

  $('exportBtn').addEventListener('click', () => exportOne(state.size));
  $('exportAllBtn').addEventListener('click', exportAll);

  // Drag a photo to pan it; scroll to zoom it; click to pick a panel.
  let drag = null;
  previewCanvas.addEventListener('pointerdown', (e) => {
    const index = panelAt(e.clientX, e.clientY);
    if (index < 0) return;
    state.selected = index;
    refreshPanelControls();
    drag = { x: e.clientX, y: e.clientY, panel: { ...state.panels[index] } };
    previewCanvas.setPointerCapture(e.pointerId);
  });
  previewCanvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const rect = previewCanvas.getBoundingClientRect();
    const plan = currentPlan();
    const r = plan.panels[state.selected];
    const panel = state.panels[state.selected];
    panel.ox = drag.panel.ox + (e.clientX - drag.x) / rect.width
      * (previewCanvas.width / r.w);
    panel.oy = drag.panel.oy + (e.clientY - drag.y) / rect.height
      * (previewCanvas.height / r.h);
    panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox));
    panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy));
    renderPreview();
  });
  previewCanvas.addEventListener('pointerup', () => { drag = null; });
  previewCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const index = panelAt(e.clientX, e.clientY);
    if (index < 0) return;
    state.selected = index;
    const panel = state.panels[index];
    panel.zoom = Math.max(1, Math.min(3.5, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
    refreshPanelControls();
    renderPreview();
  }, { passive: false });
}

function nudgeRotation(delta) {
  const panel = state.panels[state.selected];
  panel.rot = Math.max(-30, Math.min(30, (panel.rot || 0) + delta));
  renderPreview();
}

async function addUploads(fileList) {
  const files = [...(fileList || [])].filter((f) => f.type.startsWith('image/'));
  if (files.length === 0) {
    setStatus('Drop an image file to add it as a photo.');
    return;
  }
  for (const file of files) {
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.photos.push({ name: file.name.replace(/\.[^.]+$/, ''), img });
    } catch (err) {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  ensurePanels();
  refreshPanelControls();
  renderPreview();
  setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} added — pick one per panel.`);
}

function applyShotParams() {
  if (!shot) return;
  if (shot.layout) state.layout = layoutById(shot.layout).id;
  if (shot.grade) state.grade = gradeById(shot.grade).id;
  if (shot.caption) state.caption = shot.caption;
  if (shot.subtitle) state.subtitle = shot.subtitle;
  if (shot.photo) {
    const index = SAMPLES.findIndex((s) => s.name.toLowerCase() === shot.photo.toLowerCase());
    if (index >= 0) {
      state.panels.forEach((panel, i) => {
        panel.photo = i % 2 === 0 ? index : 1 - index;
      });
    }
  }
  const [w, h] = shot.size;
  state.size = SIZES.find((s) => s.w === w && s.h === h) || { id: 'shot', label: `${w} × ${h}`, w, h };
}

async function start() {
  previewCanvas = $('previewCanvas');
  previewCtx = previewCanvas.getContext('2d');
  tileCanvas = document.createElement('canvas');
  statusEl = $('statusLine');
  shot = parseShot(window.location.search);

  await loadFonts();
  for (const sample of SAMPLES) {
    try {
      const img = await loadImage(sample.src);
      state.photos.push({ name: sample.name, img });
    } catch (err) {
      setStatus(`Sample photo missing: ${sample.src}`);
    }
  }
  ensurePanels();
  applyShotParams();

  if (shot && isCoverOnlyShot(shot.mode)) {
    document.body.classList.add('shot-cover');
    const shotCanvas = $('shotCanvas');
    renderCover(shotCanvas, shot.size[0], shot.size[1]);
    markShotReady();
    return;
  }

  wireEditor();
  if (shot && shot.mode === 'editor') {
    $('captionInput').value = state.caption;
    $('subtitleInput').value = state.subtitle;
  }
  refreshPanelControls();
  renderPreview();
  setStatus('Ready — pick a layout and grade, then export your cover.');
  markShotReady();
}

start().catch((err) => {
  setStatus('Could not start the studio: ' + err.message);
});
