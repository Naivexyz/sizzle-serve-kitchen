// main.js — boots the game: wires the world, the renderer, the input and the
// sound bank together and runs the frame loop. With ?shot=<scene> in the URL it
// instead freezes one of shots.js's scripted scenes for the entry's screenshots.

import { SoundBank } from './audio.js';
import { attachInput } from './input.js';
import { Rng } from './random.js';
import { drawGame } from './render.js';
import { setupShotScene } from './shots.js';
import {
  addIngredient, createWorld, servePlate, takeFromGrill, trashPlate, updateWorld,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const sound = new SoundBank();

const params = new URLSearchParams(location.search);
const shotWorld = setupShotScene(params.get('shot'), Number(params.get('seed') ?? 1) || 1);

let world = shotWorld ?? createWorld(new Rng((Date.now() % 2147483647) + 1));
const hover = { bin: null, grill: null, button: null };

// The world's event names are the sound bank's method names, plus the bell.
const EVENT_SOUNDS = {
  pop: 'pop', sizzle: 'sizzle', ready: 'ready', coin: 'coin', perfect: 'perfect',
  buzz: 'buzz', alarm: 'alarm', thud: 'thud', bell: 'ready',
};

function drainEvents() {
  for (const event of world.events) {
    const method = EVENT_SOUNDS[event];
    if (method && sound[method]) sound[method]();
  }
  world.events.length = 0;
}

function startShift() {
  world = createWorld(world.rng);
  world.screen = 'playing';
  drainEvents();
}

const actions = {
  bin(id) {
    sound.unlock();
    if (world.screen !== 'playing' || shotWorld) return;
    addIngredient(world, id);
    drainEvents();
  },
  grill(slot) {
    sound.unlock();
    if (world.screen !== 'playing' || shotWorld) return;
    takeFromGrill(world, slot);
    drainEvents();
  },
  serve() {
    sound.unlock();
    if (shotWorld) return;
    if (world.screen === 'title' || world.screen === 'over') { startShift(); return; }
    if (world.screen !== 'playing') return;
    servePlate(world);
    drainEvents();
  },
  trash() {
    sound.unlock();
    if (world.screen !== 'playing' || shotWorld) return;
    trashPlate(world);
    drainEvents();
  },
  pause() {
    sound.unlock();
    if (shotWorld) return;
    if (world.screen === 'playing') world.screen = 'paused';
    else if (world.screen === 'paused') world.screen = 'playing';
  },
  sound() {
    sound.unlock();
    sound.muted = !sound.muted;
    if (!sound.muted) sound.click();
  },
  stage() {
    sound.unlock();
    if (shotWorld) return;
    if (world.screen === 'title' || world.screen === 'over') startShift();
    else if (world.screen === 'paused') world.screen = 'playing';
  },
};

attachInput(canvas, actions, hover);

let last = performance.now();
let lastStatus = '';

function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;
  if (world.screen === 'playing' && !shotWorld) {
    updateWorld(world, dt);
    drainEvents();
  }
  drawGame(ctx, world, { now, hoverBin: hover.bin, hoverGrill: hover.grill, hoverButton: hover.button, muted: sound.muted });
  const line = world.screen === 'playing'
    ? `Sizzle and Serve: $${world.earnings} earned, ${world.served} dishes served, ${Math.ceil(world.timeLeft)} seconds left in the shift.`
    : `Sizzle and Serve: ${world.screen}.`;
  if (line !== lastStatus) {
    lastStatus = line;
    status.textContent = line;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
