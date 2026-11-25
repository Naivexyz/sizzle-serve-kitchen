// world.js — the state of one shift and every rule that changes it: customers
// arriving and giving up, food on the grill cooking and burning, layers landing
// on the plate, and a finished plate being served for money. Rendering and input
// live elsewhere; this file only knows the game.

import { DISHES, GRILLED, INGREDIENTS, SHIRT_COLORS, SKIN_TONES, TUNING } from './config.js';

let nextOrderId = 1;

// A fresh shift. `rng` is a seeded Rng (random.js) so scripted scenes replay exactly.
export function createWorld(rng) {
  return {
    rng,
    screen: 'title',        // title | playing | paused | over
    timeLeft: TUNING.shiftSeconds,
    elapsed: 0,
    spawnIn: TUNING.firstOrderDelay,
    orders: [],             // { id, dish, patience, patienceMax, skin, shirt, bob }
    plate: [],              // layers: { ing, cooked } bottom first
    grill: Array.from({ length: TUNING.grillSlots }, () => null), // { ing, t, stage }
    earnings: 0,
    served: 0,
    perfects: 0,
    lost: 0,
    streak: 0,
    bestStreak: 0,
    floaters: [],           // { x, y, text, color, t, life }
    events: [],             // sound cues for main.js: 'pop', 'coin', ...
    shake: 0,               // seconds of screen shake left (a refused serve)
    message: '',            // transient centre-strip text ("No matching order!")
    messageT: 0,
  };
}

// How far through the shift we are, 0 at opening to 1 at closing: the rush dial.
function rushOf(world) {
  return Math.min(1, world.elapsed / TUNING.shiftSeconds);
}

export function spawnOrder(world) {
  if (world.orders.length >= TUNING.maxOrders) return;
  const rush = rushOf(world);
  const patience = world.rng.range(
    TUNING.patienceEnd + (TUNING.patienceStart - TUNING.patienceEnd) * (1 - rush) - 6,
    TUNING.patienceStart - (TUNING.patienceStart - TUNING.patienceEnd) * rush,
  );
  world.orders.push({
    id: nextOrderId++,
    dish: world.rng.pick(DISHES),
    patience,
    patienceMax: patience,
    skin: world.rng.pick(SKIN_TONES),
    shirt: world.rng.pick(SHIRT_COLORS),
    bob: world.rng.range(0, Math.PI * 2),
  });
  world.events.push('bell');
}

// Clicking a bin: cold ingredients land on the plate at once; grilled ones claim
// a free grill slot instead. Returns a short reason when the move is refused.
export function addIngredient(world, ingId) {
  const def = INGREDIENTS[ingId];
  if (!def) return 'unknown';
  if (def.grill) {
    const slot = world.grill.findIndex((s) => s === null);
    if (slot === -1) { world.message = 'The grill is full!'; world.messageT = 1.4; return 'grill-full'; }
    world.grill[slot] = { ing: ingId, t: 0, stage: 'cooking' };
    world.events.push('sizzle');
    return 'grilling';
  }
  if (world.plate.length >= TUNING.maxPlateLayers) {
    world.message = 'The plate is full!'; world.messageT = 1.4; return 'plate-full';
  }
  world.plate.push({ ing: ingId, cooked: false });
  world.events.push('pop');
  return 'plated';
}

// Clicking a grill slot: a cooked item moves to the plate, a burnt one is binned,
// and one still cooking just gets a nudge (nothing happens).
export function takeFromGrill(world, slotIndex) {
  const slot = world.grill[slotIndex];
  if (!slot) return 'empty';
  if (slot.stage === 'cooking') return 'still-cooking';
  if (slot.stage === 'burnt') {
    world.grill[slotIndex] = null;
    world.events.push('thud');
    return 'binned';
  }
  if (world.plate.length >= TUNING.maxPlateLayers) {
    world.message = 'The plate is full!'; world.messageT = 1.4; return 'plate-full';
  }
  world.grill[slotIndex] = null;
  world.plate.push({ ing: slot.ing, cooked: true });
  world.events.push('pop');
  return 'plated';
}

export function trashPlate(world) {
  if (world.plate.length === 0) return;
  world.plate = [];
  world.events.push('thud');
}

// Does the plate hold exactly this dish? Layers must match as a set, and every
// layer the recipe grills must have arrived cooked.
export function plateMatchesDish(plate, dish) {
  if (plate.length !== dish.layers.length) return false;
  const needed = [...dish.layers].sort();
  const held = plate.map((l) => l.ing).sort();
  if (!needed.every((ing, i) => ing === held[i])) return false;
  return plate.every((l) => !GRILLED.has(l.ing) || l.cooked);
}

// Was the dish stacked in the recipe's exact order, bottom to top?
export function plateIsPerfectOrder(plate, dish) {
  return plate.length === dish.layers.length && plate.every((l, i) => l.ing === dish.layers[i]);
}

// Serve the plate: the first order it satisfies takes it. Pays the price, a tip
// for patience left, a perfect-stacking bonus and the streak multiplier.
export function servePlate(world) {
  if (world.plate.length === 0) { world.message = 'The plate is empty!'; world.messageT = 1.4; return null; }
  const index = world.orders.findIndex((o) => plateMatchesDish(world.plate, o.dish));
  if (index === -1) {
    world.message = 'No order matches this plate!';
    world.messageT = 1.6;
    world.shake = 0.3;
    world.events.push('buzz');
    return null;
  }
  const [order] = world.orders.splice(index, 1);
  const perfect = plateIsPerfectOrder(world.plate, order.dish);
  const tip = Math.round(order.dish.price * TUNING.tipFraction * (order.patience / order.patienceMax));
  const comboMult = 1 + Math.min(TUNING.comboCap, world.streak * TUNING.comboStep);
  const paid = Math.round((order.dish.price + tip + (perfect ? TUNING.perfectBonus : 0)) * comboMult);
  world.earnings += paid;
  world.served += 1;
  if (perfect) world.perfects += 1;
  world.streak += 1;
  world.bestStreak = Math.max(world.bestStreak, world.streak);
  world.plate = [];
  world.floaters.push({ x: 640, y: 300, text: `+$${paid}`, color: '#ffd54f', t: 0, life: 1.2 });
  if (perfect) world.floaters.push({ x: 640, y: 336, text: 'PERFECT STACK!', color: '#8be28b', t: 0, life: 1.4 });
  world.events.push(perfect ? 'perfect' : 'coin');
  return { order, paid, perfect };
}

function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, t: 0, life: 1.3 });
}

// Advance the world by dt seconds. Only called while the shift is running.
export function updateWorld(world, dt) {
  world.elapsed += dt;
  world.timeLeft = Math.max(0, TUNING.shiftSeconds - world.elapsed);
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt);
  if (world.messageT > 0) world.messageT = Math.max(0, world.messageT - dt);

  // The grill: cooking -> done -> burnt, each with its cue the moment it turns.
  for (const slot of world.grill) {
    if (!slot) continue;
    const def = INGREDIENTS[slot.ing];
    slot.t += dt;
    if (slot.stage === 'cooking' && slot.t >= def.cookSeconds) {
      slot.stage = 'done';
      world.events.push('ready');
    } else if (slot.stage === 'done' && slot.t >= def.cookSeconds + def.burnSeconds) {
      slot.stage = 'burnt';
      world.events.push('alarm');
      addFloater(world, 205, 400, 'BURNT!', '#ef5350');
    }
  }

  // Customers: patience drains; an empty bar walks out and costs a fine.
  for (let i = world.orders.length - 1; i >= 0; i--) {
    const order = world.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      world.orders.splice(i, 1);
      world.lost += 1;
      world.streak = 0;
      world.earnings = Math.max(0, world.earnings - TUNING.walkoutFine);
      addFloater(world, 150 + i * 300, 250, `-$${TUNING.walkoutFine} walked out!`, '#ef5350');
      world.events.push('buzz');
    }
  }

  // New customers arrive on the rush's schedule.
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnOrder(world);
    const rush = rushOf(world);
    world.spawnIn = TUNING.spawnEveryStart + (TUNING.spawnEveryEnd - TUNING.spawnEveryStart) * rush;
    world.spawnIn *= world.rng.range(0.85, 1.2);
  }

  // Floaters drift up and fade.
  for (let i = world.floaters.length - 1; i >= 0; i--) {
    const f = world.floaters[i];
    f.t += dt;
    f.y -= 34 * dt;
    if (f.t >= f.life) world.floaters.splice(i, 1);
  }

  if (world.timeLeft <= 0 && world.screen === 'playing') {
    world.screen = 'over';
    world.events.push('bell');
  }
}

// Star rating for the results card: 0-3 from the shift's earnings.
export function starsFor(earnings) {
  return TUNING.starThresholds.filter((t) => earnings >= t).length;
}
