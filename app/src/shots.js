// Vice City Cover Studio — deterministic screenshot scenes.
//
// `?shot=` picks a scene for screenshots, so every capture is repeatable:
// the same query always renders the same cover with the same photos,
// layout, grade and caption. Scenes:
//   cover    — the exported cover alone, landscape 1920x1080
//   editor   — the full editor with a photo loaded
//   portrait — the exported cover alone, portrait 1080x1350
//   square   — the exported cover alone, square 1080x1080
// Extra params: layout, grade, caption, subtitle, photo (pier/boulevard).
// After the scene renders, window.__shotReady is set to true so a
// headless capture knows the frame is done.

export const SHOT_SIZES = {
  cover: [1920, 1080],
  editor: [1920, 1080],
  portrait: [1080, 1350],
  square: [1080, 1080],
};

export function parseShot(search) {
  const params = new URLSearchParams(search || '');
  const shot = params.get('shot') || '';
  if (!shot) return null;
  const mode = SHOT_SIZES[shot] ? shot : 'cover';
  return {
    mode,
    size: SHOT_SIZES[mode],
    layout: params.get('layout') || '',
    grade: params.get('grade') || '',
    caption: params.get('caption') || '',
    subtitle: params.get('subtitle') || '',
    photo: params.get('photo') || '',
  };
}

export function isCoverOnlyShot(mode) {
  return mode === 'cover' || mode === 'portrait' || mode === 'square';
}

export function markShotReady() {
  window.__shotReady = true;
}
