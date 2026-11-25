// shots.js — the scripted scenes behind the entry's screenshots. Each scene is
// a real world built by world.js's own rules and then arranged by hand (an
// order half stacked, a pan mid-cook, the end-of-shift receipt), frozen for
// the camera: opening the game with ?shot=cover|serve|rush|end&seed=1 shows
// that scene exactly, every time, because the world is dealt from the seed.

import { DISHES, SHIRT_COLORS, SKIN_TONES, TUNING } from './config.js';
import { Rng } from './random.js';
import { createWorld } from './world.js';

let shotOrderId = 101;

function makeOrder(world, dishId, patienceFrac) {
  const dish = DISHES.find((d) => d.id === dishId);
  const patienceMax = 60;
  return {
    id: shotOrderId++,
    dish,
    patience: patienceMax * patienceFrac,
    patienceMax,
    skin: world.rng.pick(SKIN_TONES),
    shirt: world.rng.pick(SHIRT_COLORS),
    bob: world.rng.range(0, Math.PI * 2),
  };
}

function layer(ing, cooked = false) {
  return { ing, cooked };
}

function baseWorld(seed, timeLeft) {
  const world = createWorld(new Rng(seed));
  world.screen = 'playing';
  world.elapsed = TUNING.shiftSeconds - timeLeft;
  world.timeLeft = timeLeft;
  world.spawnIn = 99; // the scene is frozen: nobody new walks in
  return world;
}

// The cover: mid-rush, a Classic Burger half stacked, a patty on the grill.
function coverScene(seed) {
  const world = baseWorld(seed, 84);
  world.orders = [
    makeOrder(world, 'classic-burger', 0.82),
    makeOrder(world, 'breakfast-bun', 0.6),
    makeOrder(world, 'garden-burger', 0.93),
  ];
  world.plate = [layer('bun'), layer('patty', true), layer('cheese')];
  world.grill[0] = { ing: 'patty', t: 2.6, stage: 'cooking' };
  world.grill[1] = { ing: 'bacon', t: 3.4, stage: 'done' };
  world.earnings = 46;
  world.served = 3;
  world.streak = 3;
  world.bestStreak = 4;
  world.floaters = [{ x: 580, y: 352, text: '+$16', color: '#ffd54f', t: 0.2, life: 9 }];
  return world;
}

// A finished Classic Burger on the plate, its ticket at the front of the board:
// the plate ready to serve that the bounty asks a screenshot to show.
function serveScene(seed) {
  const world = baseWorld(seed, 57);
  world.orders = [
    makeOrder(world, 'classic-burger', 0.74),
    makeOrder(world, 'club-sandwich', 0.5),
    makeOrder(world, 'cheese-burger', 0.88),
  ];
  world.plate = [
    layer('bun'), layer('patty', true), layer('cheese'),
    layer('lettuce'), layer('tomato'), layer('bun'),
  ];
  world.grill[2] = { ing: 'egg', t: 3.8, stage: 'done' };
  world.earnings = 88;
  world.served = 6;
  world.streak = 5;
  world.bestStreak = 5;
  world.floaters = [{ x: 580, y: 268, text: 'READY TO SERVE!', color: '#8be28b', t: 0.2, life: 9 }];
  return world;
}

// The rush at its peak: four tickets, every pan busy, the clock running down.
function rushScene(seed) {
  const world = baseWorld(seed, 33);
  world.orders = [
    makeOrder(world, 'chicken-melt', 0.42),
    makeOrder(world, 'double-stack', 0.66),
    makeOrder(world, 'blt-stack', 0.24),
    makeOrder(world, 'breakfast-bun', 0.79),
  ];
  world.plate = [layer('bun'), layer('chicken', true)];
  world.grill[0] = { ing: 'chicken', t: 5.2, stage: 'done' };
  world.grill[1] = { ing: 'patty', t: 1.4, stage: 'cooking' };
  world.grill[2] = { ing: 'bacon', t: 2.7, stage: 'cooking' };
  world.earnings = 132;
  world.served = 9;
  world.lost = 1;
  world.streak = 7;
  world.bestStreak = 7;
  world.floaters = [
    { x: 580, y: 350, text: '+$21', color: '#ffd54f', t: 0.2, life: 9 },
    { x: 580, y: 384, text: 'PERFECT STACK!', color: '#8be28b', t: 0.5, life: 9 },
  ];
  return world;
}

// Closing time: the receipt card over a kitchen that has earned its stars.
function endScene(seed) {
  const world = baseWorld(seed, 0);
  world.screen = 'over';
  world.orders = [makeOrder(world, 'garden-burger', 0.5)];
  world.plate = [layer('bun'), layer('lettuce')];
  world.earnings = 186;
  world.served = 14;
  world.perfects = 5;
  world.bestStreak = 9;
  world.lost = 2;
  return world;
}

const SCENES = { cover: coverScene, serve: serveScene, rush: rushScene, end: endScene };

// Returns the frozen world for a ?shot= name, or null when there is none.
export function setupShotScene(name, seed) {
  const build = SCENES[name];
  return build ? build(seed) : null;
}
