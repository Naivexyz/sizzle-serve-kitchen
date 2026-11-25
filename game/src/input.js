// input.js — mouse and keyboard control. Pointer positions are converted from
// page coordinates into the canvas's fixed 1280x800 space and hit-tested
// against render.js's LAYOUT rectangles; keys mirror the same actions (the
// number on each bin, Q/W/E for the grill pans, Space to serve, and so on).
// It calls the action callbacks main.js gives it and tracks what is hovered
// so render.js can highlight it.

import { INGREDIENTS } from './config.js';
import { LAYOUT, VIEW } from './render.js';

function toCanvasCoords(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.w,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.h,
  };
}

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

// What a point hits: { kind: 'bin'|'grill'|'serve'|'trash'|'pause'|'sound'|'stage', ... }
export function hitTest(x, y) {
  for (const bin of LAYOUT.bins) if (inside(x, y, bin)) return { kind: 'bin', id: bin.id };
  for (const slot of LAYOUT.grillSlots) if (inside(x, y, slot)) return { kind: 'grill', slot: slot.slot };
  if (inside(x, y, LAYOUT.serveBtn)) return { kind: 'serve' };
  if (inside(x, y, LAYOUT.trashBtn)) return { kind: 'trash' };
  if (inside(x, y, LAYOUT.pauseBtn)) return { kind: 'pause' };
  if (inside(x, y, LAYOUT.soundBtn)) return { kind: 'sound' };
  return { kind: 'stage' };
}

// actions: { bin(id), grill(slot), serve(), trash(), pause(), sound(), stage() }
// hover: an object render.js reads — { bin, grill, button } — updated on move.
export function attachInput(canvas, actions, hover) {
  canvas.addEventListener('pointermove', (event) => {
    const { x, y } = toCanvasCoords(canvas, event);
    const hit = hitTest(x, y);
    hover.bin = hit.kind === 'bin' ? hit.id : null;
    hover.grill = hit.kind === 'grill' ? hit.slot : null;
    hover.button = hit.kind === 'trash' ? 'trash' : null;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const { x, y } = toCanvasCoords(canvas, event);
    const hit = hitTest(x, y);
    if (hit.kind === 'bin') actions.bin(hit.id);
    else if (hit.kind === 'grill') actions.grill(hit.slot);
    else if (hit.kind === 'serve') actions.serve();
    else if (hit.kind === 'trash') actions.trash();
    else if (hit.kind === 'pause') actions.pause();
    else if (hit.kind === 'sound') actions.sound();
    else actions.stage();
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key;
    const binId = Object.keys(INGREDIENTS).find((id) => INGREDIENTS[id].key === key);
    if (binId) { actions.bin(binId); return; }
    const lower = key.toLowerCase();
    if (lower === 'q' || lower === 'w' || lower === 'e') {
      actions.grill({ q: 0, w: 1, e: 2 }[lower]);
    } else if (key === ' ') {
      event.preventDefault();
      actions.serve();
    } else if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      actions.trash();
    } else if (lower === 'p' || key === 'Escape') {
      actions.pause();
    } else if (lower === 'm') {
      actions.sound();
    } else if (key === 'Enter') {
      actions.stage();
    }
  });
}
