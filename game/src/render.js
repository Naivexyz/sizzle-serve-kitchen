// render.js — everything the player sees, drawn on one 1280x800 canvas: the
// bistro wall and lamps, the order board with its tickets, the grill, the
// assembly plate with its stack of layers, the serving pass with its checklist,
// and the ingredient bins along the counter. It also owns the layout rectangles
// input.js hit-tests against, so what is drawn is exactly what is clickable.

import { BIN_ORDER, GRILLED, INGREDIENTS } from './config.js';
import { plateMatchesDish, starsFor } from './world.js';

export const VIEW = { w: 1280, h: 800 };

// Clickable rectangles, in canvas coordinates.
export const LAYOUT = {
  bins: BIN_ORDER.map((id, i) => ({ id, x: 26 + i * 122, y: 606, w: 112, h: 118 })),
  grillSlots: [0, 1, 2].map((i) => ({ slot: i, x: 52 + i * 96, y: 372, w: 84, h: 84 })),
  serveBtn: { x: 842, y: 470, w: 258, h: 58 },
  trashBtn: { x: 1112, y: 470, w: 128, h: 58 },
  pauseBtn: { x: 1172, y: 12, w: 44, h: 36 },
  soundBtn: { x: 1120, y: 12, w: 44, h: 36 },
};

const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function text(ctx, str, x, y, { size = 16, color = '#fff', bold = false, align = 'left', font = FONT } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? '700 ' : ''}${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// A five-pointed star path centred at (cx, cy), for the results card.
function star(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// One ingredient layer as it sits in a stack: a coloured slab with its own
// character (cheese drips, bacon waves, an egg's yolk, a bun's dome on top).
export function drawLayer(ctx, ing, cx, baseY, width, isTop) {
  const def = INGREDIENTS[ing];
  const d = def.draw;
  const h = def.layer;
  const x = cx - width / 2;
  const y = baseY - h;
  ctx.save();
  if (ing === 'bun' || ing === 'bread') {
    ctx.fillStyle = d.side;
    roundRect(ctx, x, y, width, h + 4, 6); ctx.fill();
    ctx.fillStyle = d.top;
    roundRect(ctx, x, y, width, h, 6); ctx.fill();
    if (isTop) { // the domed crown of the top bun
      ctx.beginPath();
      ctx.ellipse(cx, y + 2, width / 2, 15, 0, Math.PI, Math.PI * 2);
      ctx.fillStyle = d.top; ctx.fill();
      ctx.fillStyle = d.seed;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(cx + i * (width / 6), y - 6 + Math.abs(i) * 2, 3.4, 2, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (ing === 'cheese') {
    ctx.fillStyle = d.side;
    roundRect(ctx, x - 4, y, width + 8, h, 4); ctx.fill();
    ctx.fillStyle = d.top;
    roundRect(ctx, x - 4, y, width + 8, h - 2, 4); ctx.fill();
    ctx.beginPath(); // drips over the edge
    for (const fx of [0.18, 0.5, 0.82]) {
      ctx.moveTo(x + width * fx - 6, y + h - 2);
      ctx.lineTo(x + width * fx, y + h + 7);
      ctx.lineTo(x + width * fx + 6, y + h - 2);
    }
    ctx.fill();
  } else if (ing === 'lettuce') {
    ctx.fillStyle = d.side;
    ctx.beginPath();
    for (let px = 0; px <= width; px += 8) {
      const py = y + 3 + Math.sin(px * 0.22) * 3.4;
      if (px === 0) ctx.moveTo(x + px, py); else ctx.lineTo(x + px, py);
    }
    for (let px = width; px >= 0; px -= 8) ctx.lineTo(x + px, y + h + Math.sin(px * 0.22) * 3.4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = d.top;
    roundRect(ctx, x + 2, y + 2, width - 4, h - 5, 4); ctx.fill();
  } else if (ing === 'bacon') {
    for (const off of [-width * 0.22, width * 0.22]) {
      ctx.strokeStyle = d.side;
      ctx.lineWidth = 9;
      ctx.beginPath();
      for (let px = -width / 2 + 8; px <= width / 2 - 8; px += 6) {
        const py = baseY - h / 2 + Math.sin(px * 0.16 + off) * 2.6;
        if (px === -width / 2 + 8) ctx.moveTo(cx + px, py + off * 0.14); else ctx.lineTo(cx + px, py + off * 0.14);
      }
      ctx.stroke();
      ctx.strokeStyle = d.seed;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  } else if (ing === 'egg') {
    ctx.fillStyle = d.top;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - h / 2, width / 2, h / 2 + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = d.seed;
    ctx.beginPath();
    ctx.ellipse(cx, baseY - h / 2, 13, h / 2 - 1, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // patty, chicken, tomato, avocado: a shaded slab, each its own colour story.
    ctx.fillStyle = d.side;
    roundRect(ctx, x, y, width, h + 3, 7); ctx.fill();
    ctx.fillStyle = d.top;
    roundRect(ctx, x, y, width, h, 7); ctx.fill();
    if (ing === 'patty' || ing === 'chicken') {
      ctx.strokeStyle = 'rgba(60,32,12,0.45)';
      ctx.lineWidth = 2.4;
      for (const fx of [0.3, 0.5, 0.7]) {
        ctx.beginPath();
        ctx.moveTo(x + width * fx - 7, y + h - 3);
        ctx.lineTo(x + width * fx + 7, y + 3);
        ctx.stroke();
      }
    }
    if (ing === 'tomato') {
      ctx.fillStyle = d.seed;
      for (const fx of [0.28, 0.5, 0.72]) {
        ctx.beginPath();
        ctx.ellipse(x + width * fx, y + h / 2, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (ing === 'avocado') {
      ctx.fillStyle = d.seed;
      ctx.beginPath();
      ctx.ellipse(cx, y + h / 2, width * 0.2, h / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  return h;
}

// The whole stack on the plate, bottom layer first, with a soft shadow under it.
function drawPlateStack(ctx, plate, cx, plateY) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, plateY + 16, 128, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // the plate itself: rim, well and a warm highlight
  const plateGrad = ctx.createRadialGradient(cx, plateY, 20, cx, plateY, 128);
  plateGrad.addColorStop(0, '#fdfbf7');
  plateGrad.addColorStop(0.75, '#efe9dd');
  plateGrad.addColorStop(1, '#cfc6b2');
  ctx.fillStyle = plateGrad;
  ctx.beginPath();
  ctx.ellipse(cx, plateY, 128, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b7ab90';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, plateY, 92, 23, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e7dfcd';
  ctx.fill();

  let topY = plateY - 6;
  plate.forEach((layer, i) => {
    const w = 176 - Math.min(26, i * 3);
    topY -= drawLayer(ctx, layer.ing, cx, topY, w, i === plate.length - 1);
  });
  return topY;
}

// Wavy steam lines rising from (x, y); `now` animates them, `seed` varies them.
function drawSteam(ctx, x, y, now, seed, strength = 1) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let s = 0; s < 3; s++) {
    const sx = x + (s - 1) * 20;
    const phase = now * 2.1 + seed + s * 1.7;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const py = y - i * 9 * strength;
      const px = sx + Math.sin(phase + i * 0.9) * 5;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.globalAlpha = 0.16 + 0.1 * Math.sin(phase);
    ctx.stroke();
  }
  ctx.restore();
}

// A customer's face on a ticket: skin disc, hair, eyes and a mouth that flattens
// and turns down as patience runs out.
function drawFace(ctx, cx, cy, r, skin, shirt, patienceFrac, bob) {
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r + 9, r * 0.95, r * 0.5, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(cx, cy + bob, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.arc(cx, cy + bob - r * 0.55, r * 0.92, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  ctx.fillStyle = '#263238';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + s * r * 0.36, cy + bob - r * 0.08, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#263238';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (patienceFrac > 0.55) ctx.arc(cx, cy + bob + r * 0.28, r * 0.42, Math.PI * 0.2, Math.PI * 0.8);
  else if (patienceFrac > 0.28) {
    ctx.moveTo(cx - r * 0.3, cy + bob + r * 0.42);
    ctx.lineTo(cx + r * 0.3, cy + bob + r * 0.42);
  } else ctx.arc(cx, cy + bob + r * 0.72, r * 0.4, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
}

// A small chip naming one ingredient, used on tickets and the checklist.
function drawChip(ctx, x, y, w, ing, { cooked = false, h = 21 } = {}) {
  const def = INGREDIENTS[ing];
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  if (GRILLED.has(ing)) {
    ctx.strokeStyle = '#ef7d1a';
    ctx.lineWidth = 1.6;
    roundRect(ctx, x, y, w, h, h / 2); ctx.stroke();
  }
  ctx.fillStyle = def.draw.side;
  ctx.beginPath();
  ctx.arc(x + 11, y + h / 2, 6, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, def.name, x + 21, y + h / 2 + 0.5, { size: 12.5, color: '#4e342e', bold: true });
  if (cooked) text(ctx, '✓', x + w - 9, y + h / 2 + 0.5, { size: 12, color: '#43a047', bold: true, align: 'right' });
}

// One order ticket on the board.
function drawTicket(ctx, order, i, now) {
  const x = 24 + i * 308;
  const y = 74;
  const w = 292;
  const h = 168;
  const frac = Math.max(0, order.patience / order.patienceMax);
  ctx.save();
  ctx.translate(x + w / 2, y);
  ctx.rotate(Math.sin(order.id * 7.3) * 0.008);
  ctx.translate(-w / 2, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, 3, 6, w, h, 10); ctx.fill();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#fffdf4');
  grad.addColorStop(1, '#f6ead2');
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, w, h, 10); ctx.fill();
  ctx.fillStyle = '#c62828';
  ctx.beginPath();
  ctx.arc(w / 2, 9, 5, 0, Math.PI * 2);
  ctx.fill();

  drawFace(ctx, 40, 44, 23, order.skin, order.shirt, frac, Math.sin(now * 2 + order.bob) * 1.4);
  text(ctx, order.dish.name, 72, 34, { size: 19, color: '#3e2723', bold: true });
  text(ctx, `ORDER #${order.id}`, 72, 57, { size: 11.5, color: '#8d6e63', bold: true });
  ctx.fillStyle = '#2e7d32';
  roundRect(ctx, w - 66, 20, 54, 28, 8); ctx.fill();
  text(ctx, `$${order.dish.price}`, w - 39, 35, { size: 17, color: '#fff', bold: true, align: 'center' });

  // patience bar: green draining to red
  ctx.fillStyle = '#d7ccc8';
  roundRect(ctx, 14, 76, w - 28, 10, 5); ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#66bb6a' : frac > 0.26 ? '#ffa726' : '#ef5350';
  if (frac > 0.01) { roundRect(ctx, 14, 76, (w - 28) * frac, 10, 5); ctx.fill(); }

  // the recipe, as chips, two rows of three
  order.dish.layers.forEach((ing, li) => {
    const cx = 14 + (li % 3) * 90;
    const cy = 96 + Math.floor(li / 3) * 27;
    drawChip(ctx, cx, cy, 84, ing);
  });
  ctx.restore();
}

// The grill: a steel counter with three pans and whatever is cooking on them.
function drawGrill(ctx, world, now, hover) {
  ctx.fillStyle = '#37474f';
  roundRect(ctx, 24, 262, 312, 282, 14); ctx.fill();
  ctx.fillStyle = '#263238';
  roundRect(ctx, 24, 262, 312, 46, 14); ctx.fill();
  text(ctx, 'GRILL', 44, 286, { size: 19, color: '#ffcc80', bold: true });
  text(ctx, 'click a ready pan to plate it', 320, 286, { size: 12, color: '#b0bec5', align: 'right' });
  // the hot plate surface
  const surf = ctx.createLinearGradient(0, 330, 0, 470);
  surf.addColorStop(0, '#455a64');
  surf.addColorStop(1, '#263238');
  ctx.fillStyle = surf;
  roundRect(ctx, 40, 330, 280, 138, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,110,40,0.35)';
  ctx.lineWidth = 2;
  for (let gx = 60; gx <= 300; gx += 24) {
    ctx.beginPath(); ctx.moveTo(gx, 340); ctx.lineTo(gx, 458); ctx.stroke();
  }
  text(ctx, '3 pans · food burns if you leave it!', 180, 512, { size: 12.5, color: '#90a4ae', align: 'center' });

  LAYOUT.grillSlots.forEach((rect, i) => {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const slot = world.grill[i];
    ctx.fillStyle = '#10181c';
    ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hover === i ? '#ffcc80' : '#546e7a';
    ctx.lineWidth = hover === i ? 3.4 : 2;
    ctx.stroke();
    if (!slot) {
      text(ctx, `${i + 1}`, cx, cy, { size: 15, color: '#546e7a', bold: true, align: 'center' });
      return;
    }
    const def = INGREDIENTS[slot.ing];
    const frac = Math.min(1, slot.t / def.cookSeconds);
    // the food disc: raw colour easing to cooked, black when burnt
    let fill = def.draw.raw;
    if (slot.stage === 'done') fill = def.draw.top;
    if (slot.stage === 'burnt') fill = '#17110c';
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(cx, cy, 29, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath(); ctx.ellipse(cx - 8, cy - 10, 12, 7, -0.5, 0, Math.PI * 2); ctx.fill();
    // progress ring around the pan
    ctx.lineWidth = 5;
    if (slot.stage === 'cooking') {
      ctx.strokeStyle = '#ffb74d';
      ctx.beginPath(); ctx.arc(cx, cy, 36, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
      drawSteam(ctx, cx, cy - 34, now, i * 2.4, 0.7);
    } else if (slot.stage === 'done') {
      const pulse = 0.6 + 0.4 * Math.sin(now * 5 + i);
      ctx.strokeStyle = `rgba(105, 240, 130, ${pulse})`;
      ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.stroke();
      text(ctx, 'READY!', cx, cy + 52, { size: 13.5, color: '#69f082', bold: true, align: 'center' });
      drawSteam(ctx, cx, cy - 34, now, i * 2.4, 0.9);
    } else {
      ctx.strokeStyle = '#ef5350';
      ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.stroke();
      text(ctx, 'BURNT', cx, cy + 52, { size: 13.5, color: '#ef5350', bold: true, align: 'center' });
      drawSteam(ctx, cx, cy - 30, now, i * 3.1, 0.5);
    }
  });
}

// The right-hand pass: checklist for the front order, combo meter, serve & trash.
function drawPass(ctx, world, hover) {
  ctx.fillStyle = '#4e342e';
  roundRect(ctx, 824, 262, 432, 282, 14); ctx.fill();
  ctx.fillStyle = '#3e2723';
  roundRect(ctx, 824, 262, 432, 46, 14); ctx.fill();
  text(ctx, 'SERVING PASS', 844, 286, { size: 19, color: '#ffcc80', bold: true });

  const front = world.orders[0];
  if (front) {
    text(ctx, `Now cooking: ${front.dish.name}`, 844, 330, { size: 16.5, color: '#ffe0b2', bold: true });
    // checklist: for each distinct layer, how the kitchen stands
    const rows = [];
    for (const ing of front.dish.layers) {
      const row = rows.find((r) => r.ing === ing);
      if (row) row.need += 1; else rows.push({ ing, need: 1 });
    }
    rows.forEach((row, ri) => {
      const y = 344 + ri * 21;
      const plated = world.plate.filter((l) => l.ing === row.ing && (!GRILLED.has(row.ing) || l.cooked)).length;
      const onGrill = world.grill.filter((s) => s && s.ing === row.ing);
      const ready = onGrill.filter((s) => s.stage === 'done').length;
      const cooking = onGrill.filter((s) => s.stage === 'cooking').length;
      const have = Math.min(row.need, plated + ready);
      let state = 'still needed';
      let color = '#ffab91';
      if (have >= row.need) { state = 'on the plate ✓'; color = '#a5d6a7'; }
      else if (cooking > 0) { state = 'on the grill…'; color = '#ffcc80'; }
      else if (ready > 0) { state = 'ready on grill ✓'; color = '#a5d6a7'; }
      drawChip(ctx, 844, y - 9, 118, row.ing, { h: 19 });
      text(ctx, `× ${row.need}`, 972, y + 1, { size: 13.5, color: '#ffe0b2', bold: true });
      text(ctx, state, 1010, y + 1, { size: 13, color });
    });
  } else {
    text(ctx, 'Waiting for the first customer…', 844, 336, { size: 16, color: '#ffe0b2' });
    text(ctx, 'Orders appear on the board above.', 844, 362, { size: 13.5, color: '#bcaaa4' });
    text(ctx, 'Build a dish on the plate, then SERVE it.', 844, 384, { size: 13.5, color: '#bcaaa4' });
  }

  // streak meter
  const streakW = Math.min(1, world.streak / 10);
  text(ctx, world.streak > 1 ? `STREAK ×${world.streak} — bonus +${Math.min(100, world.streak * 10)}%` : 'STREAK — serve in a row to earn a bonus', 844, 460, { size: 12.5, color: '#ffcc80', bold: true });
  ctx.fillStyle = '#2d1c16';
  roundRect(ctx, 1080, 453, 160, 13, 6); ctx.fill();
  if (streakW > 0) {
    ctx.fillStyle = '#ff7043';
    roundRect(ctx, 1080, 453, 160 * streakW, 13, 6); ctx.fill();
  }

  // serve + trash buttons; serve lights up when the plate matches any order
  const canServe = world.orders.some((o) => plateMatchesDish(world.plate, o.dish));
  const sb = LAYOUT.serveBtn;
  ctx.fillStyle = canServe ? '#2e9e4f' : '#1f7a44';
  if (canServe) { ctx.shadowColor = 'rgba(80,255,140,0.55)'; ctx.shadowBlur = 18; }
  roundRect(ctx, sb.x, sb.y, sb.w, sb.h, 12); ctx.fill();
  ctx.shadowBlur = 0;
  text(ctx, 'SERVE  ⏎', sb.x + sb.w / 2, sb.y + sb.h / 2 + 1, { size: 23, color: '#fff', bold: true, align: 'center' });
  const tb = LAYOUT.trashBtn;
  ctx.fillStyle = hover === 'trash' ? '#8d4038' : '#6d322c';
  roundRect(ctx, tb.x, tb.y, tb.w, tb.h, 12); ctx.fill();
  text(ctx, 'TRASH', tb.x + tb.w / 2, tb.y + tb.h / 2 + 1, { size: 17, color: '#ffcdd2', bold: true, align: 'center' });
}

// The counter with its ten ingredient bins.
function drawBins(ctx, world, hover) {
  const wood = ctx.createLinearGradient(0, 556, 0, 800);
  wood.addColorStop(0, '#8d5a2b');
  wood.addColorStop(0.12, '#7a4a21');
  wood.addColorStop(1, '#5d3a1a');
  ctx.fillStyle = wood;
  ctx.fillRect(0, 556, 1280, 244);
  ctx.fillStyle = 'rgba(255,220,160,0.13)';
  ctx.fillRect(0, 556, 1280, 5);
  text(ctx, 'INGREDIENT COUNTER — click a bin (or press its number). Flame badge = goes on the grill first.', 26, 580, { size: 14.5, color: '#ffe0b2', bold: true });

  LAYOUT.bins.forEach((bin, i) => {
    const def = INGREDIENTS[bin.id];
    const isHover = hover === bin.id;
    ctx.fillStyle = isHover ? '#a06a33' : '#8a5a28';
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 12); ctx.fill();
    ctx.fillStyle = '#5f3c17';
    roundRect(ctx, bin.x + 7, bin.y + 7, bin.w - 14, 62, 9); ctx.fill();
    // a little pile of the ingredient in its tray
    for (let p = 0; p < 3; p++) {
      ctx.fillStyle = p === 1 ? def.draw.top : def.draw.side;
      ctx.beginPath();
      ctx.ellipse(bin.x + 30 + p * 26, bin.y + 44 - (p === 1 ? 7 : 0), 17, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (def.grill) {
      ctx.fillStyle = '#ef7d1a';
      ctx.beginPath();
      ctx.arc(bin.x + bin.w - 16, bin.y + 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3e0';
      ctx.beginPath();
      ctx.moveTo(bin.x + bin.w - 16, bin.y + 11);
      ctx.quadraticCurveTo(bin.x + bin.w - 10, bin.y + 20, bin.x + bin.w - 16, bin.y + 24);
      ctx.quadraticCurveTo(bin.x + bin.w - 22, bin.y + 20, bin.x + bin.w - 16, bin.y + 11);
      ctx.fill();
    }
    ctx.fillStyle = '#3e2723';
    roundRect(ctx, bin.x + 6, bin.y + 6, 21, 21, 6); ctx.fill();
    text(ctx, def.key, bin.x + 16.5, bin.y + 17, { size: 13, color: '#ffe0b2', bold: true, align: 'center' });
    text(ctx, def.name, bin.x + bin.w / 2, bin.y + 88, { size: 15.5, color: '#fff3e0', bold: true, align: 'center' });
    text(ctx, def.grill ? 'to the grill' : 'to the plate', bin.x + bin.w / 2, bin.y + 106, { size: 11.5, color: '#d7b899', align: 'center' });
  });
}

// Header: name, money, counts, the shift clock.
function drawHeader(ctx, world, muted) {
  ctx.fillStyle = '#241207';
  ctx.fillRect(0, 0, 1280, 58);
  ctx.fillStyle = '#ffb300';
  roundRect(ctx, 14, 10, 38, 38, 9); ctx.fill();
  text(ctx, 'S', 33, 30, { size: 24, color: '#3e2723', bold: true, align: 'center' });
  text(ctx, 'SIZZLE & SERVE', 62, 30, { size: 21, color: '#ffe0b2', bold: true });
  text(ctx, `$${world.earnings}`, 330, 30, { size: 22, color: '#ffd54f', bold: true });
  text(ctx, `served ${world.served}`, 470, 30, { size: 15.5, color: '#d7ccc8' });
  text(ctx, `lost ${world.lost}`, 580, 30, { size: 15.5, color: '#d7ccc8' });
  // shift timer
  const frac = Math.max(0, world.timeLeft / 120);
  ctx.fillStyle = '#3e2723';
  roundRect(ctx, 690, 17, 300, 24, 12); ctx.fill();
  ctx.fillStyle = frac > 0.3 ? '#66bb6a' : '#ef5350';
  if (frac > 0.005) { roundRect(ctx, 690, 17, 300 * frac, 24, 12); ctx.fill(); }
  const secs = Math.ceil(world.timeLeft);
  text(ctx, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 840, 30, { size: 16, color: '#fff', bold: true, align: 'center' });
  for (const [rect, label] of [[LAYOUT.soundBtn, muted ? 'OFF' : 'SOUND'], [LAYOUT.pauseBtn, 'II']]) {
    ctx.fillStyle = '#3e2723';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8); ctx.fill();
    text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, { size: label === 'II' ? 15 : 10.5, color: '#ffe0b2', bold: true, align: 'center' });
  }
}

// The room behind everything: tiled wall, shelf of jars, hanging lamps, pass rail.
function drawRoom(ctx, now) {
  const wall = ctx.createLinearGradient(0, 58, 0, 556);
  wall.addColorStop(0, '#5d7a52');
  wall.addColorStop(1, '#48603f');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 58, 1280, 498);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 1280; x += 80) { ctx.beginPath(); ctx.moveTo(x, 58); ctx.lineTo(x, 556); ctx.stroke(); }
  for (let y = 58; y <= 556; y += 62) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke(); }
  // shelf with jars, top right of the board
  ctx.fillStyle = '#6d4c2f';
  ctx.fillRect(1000, 120, 250, 10);
  const jarColors = ['#ef9a9a', '#a5d6a7', '#ffe082', '#90caf9', '#ce93d8'];
  jarColors.forEach((c, i) => {
    ctx.fillStyle = c;
    roundRect(ctx, 1014 + i * 48, 88, 30, 32, 5); ctx.fill();
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(1018 + i * 48, 82, 22, 7);
  });
  // pendant lamps with a warm glow over the board
  for (const lx of [180, 640, 1100]) {
    const glow = ctx.createRadialGradient(lx, 66, 6, lx, 66, 120);
    glow.addColorStop(0, 'rgba(255,214,120,0.5)');
    glow.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(lx - 120, 0, 240, 190);
    ctx.strokeStyle = '#2b1a10';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 34); ctx.stroke();
    ctx.fillStyle = '#2b1a10';
    ctx.beginPath();
    ctx.moveTo(lx - 20, 52); ctx.lineTo(lx + 20, 52); ctx.lineTo(lx + 9, 32); ctx.lineTo(lx - 9, 32);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.arc(lx, 56, 6 + Math.sin(now * 3 + lx) * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  // the rail the tickets hang from
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(0, 60, 1280, 8);
}

function drawFloaters(ctx, world) {
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / f.life);
    text(ctx, f.text, f.x, f.y, { size: 25, color: f.color, bold: true, align: 'center' });
  }
  ctx.globalAlpha = 1;
}

function drawMessage(ctx, world) {
  if (world.messageT <= 0 || !world.message) return;
  ctx.fillStyle = 'rgba(30,10,5,0.82)';
  const w = world.message.length * 11 + 44;
  roundRect(ctx, 640 - w / 2, 250, w, 38, 19); ctx.fill();
  text(ctx, world.message, 640, 270, { size: 17, color: '#ffcdd2', bold: true, align: 'center' });
}

function drawTitle(ctx, world, now) {
  ctx.fillStyle = 'rgba(24,12,4,0.66)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, 'SIZZLE & SERVE', 640, 168, { size: 74, color: '#ffb300', bold: true, align: 'center' });
  text(ctx, 'R U S H   H O U R   K I T C H E N', 640, 222, { size: 24, color: '#ffe0b2', bold: true, align: 'center' });
  ctx.fillStyle = 'rgba(255,248,232,0.96)';
  roundRect(ctx, 390, 268, 500, 218, 16); ctx.fill();
  text(ctx, 'HOW TO RUN YOUR SHIFT', 640, 300, { size: 19, color: '#b3541e', bold: true, align: 'center' });
  const lines = [
    '1.  Read the ticket on the order board.',
    '2.  Click bins to stack the dish on your plate.',
    '3.  Patties, chicken, bacon & eggs cook on the grill —',
    '     click a pan when it flashes READY to plate it.',
    '4.  Hit SERVE before the patience bar runs out.',
    'Tips for happy customers · bonuses for perfect stacks',
    'and serving streaks · burnt food and walk-outs cost you!',
  ];
  lines.forEach((line, i) => text(ctx, line, 428, 336 + i * 21, { size: 15.5, color: '#4e342e' }));
  const blink = Math.sin(now * 4) > -0.2;
  if (blink) text(ctx, 'CLICK OR PRESS ENTER TO OPEN', 640, 540, { size: 24, color: '#ffffff', bold: true, align: 'center' });
  text(ctx, '120 seconds · mouse & keyboard · keys 1-0 pick bins, Q/W/E work the grill, Space serves', 640, 586, { size: 14.5, color: '#d7ccc8', align: 'center' });
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(24,12,4,0.6)';
  ctx.fillRect(0, 0, 1280, 800);
  text(ctx, 'PAUSED', 640, 380, { size: 56, color: '#ffe0b2', bold: true, align: 'center' });
  text(ctx, 'Click or press P to get back to the rush', 640, 434, { size: 19, color: '#fff', align: 'center' });
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(24,12,4,0.68)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#fff8e8';
  roundRect(ctx, 415, 168, 450, 430, 14); ctx.fill();
  ctx.fillStyle = '#c62828';
  ctx.fillRect(415, 168, 450, 8);
  text(ctx, 'END OF SHIFT', 640, 214, { size: 30, color: '#3e2723', bold: true, align: 'center' });
  text(ctx, '— your receipt —', 640, 246, { size: 14, color: '#8d6e63', align: 'center' });
  const rows = [
    ['Dishes served', `${world.served}`],
    ['Perfect stacks', `${world.perfects}`],
    ['Best streak', `×${world.bestStreak}`],
    ['Customers lost', `${world.lost}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 292 + i * 36;
    text(ctx, k, 462, y, { size: 18, color: '#4e342e' });
    text(ctx, v, 818, y, { size: 18, color: '#4e342e', bold: true, align: 'right' });
    ctx.strokeStyle = '#e0d5c1';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(462, y + 17); ctx.lineTo(818, y + 17); ctx.stroke();
  });
  text(ctx, 'TOTAL EARNED', 462, 452, { size: 19, color: '#3e2723', bold: true });
  text(ctx, `$${world.earnings}`, 818, 452, { size: 26, color: '#2e7d32', bold: true, align: 'right' });
  const stars = starsFor(world.earnings);
  for (let s = 0; s < 3; s++) star(ctx, 576 + s * 64, 512, 24, s < stars ? '#ffb300' : '#ddd3bd');
  text(ctx, 'CLICK OR PRESS ENTER TO COOK AGAIN', 640, 566, { size: 16.5, color: '#b3541e', bold: true, align: 'center' });
}

// The one entry point main.js calls every frame. `ui` carries the clock and
// what the mouse is hovering: { now, hoverBin, hoverGrill, hoverButton, muted }.
export function drawGame(ctx, world, ui) {
  ctx.save();
  if (world.shake > 0) {
    const mag = world.shake * 14;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  drawRoom(ctx, ui.now);
  // order board backing
  ctx.fillStyle = 'rgba(38,24,14,0.55)';
  roundRect(ctx, 12, 64, 1256, 184, 12); ctx.fill();
  world.orders.forEach((order, i) => drawTicket(ctx, order, i, ui.now));
  if (world.orders.length === 0 && world.screen === 'playing') {
    text(ctx, 'The board is clear — next customer any second…', 640, 156, { size: 18, color: '#ffe0b2', align: 'center' });
  }
  drawGrill(ctx, world, ui.now, ui.hoverGrill);
  // assembly counter (centre)
  ctx.fillStyle = '#6d4c2f';
  roundRect(ctx, 352, 262, 456, 282, 14); ctx.fill();
  text(ctx, 'YOUR PLATE', 580, 290, { size: 19, color: '#ffcc80', bold: true, align: 'center' });
  text(ctx, world.plate.length ? `${world.plate.length} layer${world.plate.length > 1 ? 's' : ''} stacked` : 'click the bins below to start stacking', 580, 316, { size: 13, color: '#d7b899', align: 'center' });
  const topY = drawPlateStack(ctx, world.plate, 580, 486);
  if (world.plate.some((l) => l.cooked)) drawSteam(ctx, 580, topY - 6, ui.now, 4.2, 1);
  drawPass(ctx, world, ui.hoverButton);
  drawBins(ctx, world, ui.hoverBin);
  drawHeader(ctx, world, ui.muted);
  drawMessage(ctx, world);
  drawFloaters(ctx, world);
  if (world.screen === 'title') drawTitle(ctx, world, ui.now);
  if (world.screen === 'paused') drawPaused(ctx);
  if (world.screen === 'over') drawOver(ctx, world);
  ctx.restore();
}
