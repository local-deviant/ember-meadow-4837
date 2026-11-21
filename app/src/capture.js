// capture.js — deterministic ?shot= scenes for Vice City Cover Studio.
// Each scene is a named preset the app applies when the page opens with
// ?shot=<name>: a layout, a grade, a caption and which sample photos go
// where, so the screenshots are reproducible. "cover" draws the exported
// cover full-frame; "editor" shows the editor with a photo loaded.

export const SCENES = {
  cover: {
    layout: "hero-trio",
    grade: "neon-sunset",
    caption: "VICE CITY",
    subtitle: "Neon Shore",
    size: "wide",
    photos: [0, 1, 0, 1],
    note: "Exported cover, landscape",
  },
  editor: {
    layout: "grid-nine",
    grade: "vice-gold",
    caption: "VICE CITY",
    subtitle: "Neon Shore",
    size: "square",
    photos: [0, 1, 0, 1, 0, 1, 0, 1, 0],
    note: "Editor with a photo loaded",
  },
  portrait: {
    layout: "story-tower",
    grade: "hot-pink-night",
    caption: "VICE CITY",
    subtitle: "Neon Shore",
    size: "portrait",
    photos: [1, 0, 1],
    note: "Exported cover, portrait",
  },
  square: {
    layout: "tilted-stack",
    grade: "teal-dusk",
    caption: "VICE CITY",
    subtitle: "Neon Shore",
    size: "square",
    photos: [0, 1, 0],
    note: "Exported cover, square",
  },
};

// The scene names, in the order shots.json lists them.
export function sceneNames() {
  return Object.keys(SCENES);
}

// Read ?shot= from the page URL. Returns the scene name or null.
export function shotFromUrl() {
  try {
    const name = new URLSearchParams(window.location.search).get("shot");
    return name && SCENES[name] ? name : null;
  } catch {
    return null;
  }
}

// Apply a scene to the studio state object (layout, grade, caption,
// subtitle, export size and the photo index of each panel).
export function applyScene(state, name) {
  const scene = SCENES[name];
  if (!scene) return false;
  state.layout = scene.layout;
  state.grade = scene.grade;
  state.caption = scene.caption;
  state.subtitle = scene.subtitle;
  state.size = scene.size;
  state.panels = state.panels.map((panel, i) => ({
    ...panel,
    photo: scene.photos[i % scene.photos.length],
  }));
  return true;
}
