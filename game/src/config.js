// config.js — the menu: ingredients, dishes, and the numbers that tune a shift.
// Everything the rest of the game needs to know about food lives here.

// An ingredient with `grill` set cannot go straight on the plate: clicking its bin
// sends it to the grill, where it cooks for `cookSeconds` and then has `burnSeconds`
// of grace before it burns. `draw` names the colours render.js paints it with.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     key: '1', grill: false, layer: 13, draw: { top: '#f2b25c', side: '#d98e35', seed: '#ffe9bd' } },
  bread:   { name: 'Bread',   key: '2', grill: false, layer: 10, draw: { top: '#eec27f', side: '#c68f3f', seed: '#f7dc9f' } },
  patty:   { name: 'Patty',   key: '3', grill: true, cookSeconds: 4.2, burnSeconds: 3.0, layer: 15, draw: { raw: '#b0584a', top: '#7c4a2d', side: '#5d3620', seed: '#8f5e38' } },
  chicken: { name: 'Chicken', key: '4', grill: true, cookSeconds: 5.0, burnSeconds: 3.0, layer: 14, draw: { raw: '#e8a58f', top: '#d9903f', side: '#b06f27', seed: '#e8ab54' } },
  bacon:   { name: 'Bacon',   key: '5', grill: true, cookSeconds: 3.2, burnSeconds: 2.4, layer: 8,  draw: { raw: '#d77f76', top: '#a83c31', side: '#7e2a21', seed: '#e39a8d' } },
  egg:     { name: 'Egg',     key: '6', grill: true, cookSeconds: 3.6, burnSeconds: 2.6, layer: 9,  draw: { raw: '#f3e3c2', top: '#fdf6e3', side: '#e8cf9e', seed: '#f7b731' } },
  cheese:  { name: 'Cheese',  key: '7', grill: false, layer: 7,  draw: { top: '#ffc93c', side: '#eda812', seed: '#ffd968' } },
  lettuce: { name: 'Lettuce', key: '8', grill: false, layer: 8,  draw: { top: '#7ec850', side: '#57a838', seed: '#a5e284' } },
  tomato:  { name: 'Tomato',  key: '9', grill: false, layer: 9,  draw: { top: '#ef5350', side: '#c93a36', seed: '#ff8a75' } },
  avocado: { name: 'Avocado', key: '0', grill: false, layer: 9,  draw: { top: '#a9c46a', side: '#5e7d32', seed: '#e9e4b8' } },
};

// The order the bins stand on the counter, left to right.
export const BIN_ORDER = ['bun', 'bread', 'patty', 'chicken', 'bacon', 'egg', 'cheese', 'lettuce', 'tomato', 'avocado'];

// A dish is a stack of layers, bottom first. Layers marked in `grilled` must arrive
// cooked off the grill; the rest come straight from their bins.
export const DISHES = [
  { id: 'classic-burger', name: 'Classic Burger', price: 14, layers: ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'bun'] },
  { id: 'double-stack',   name: 'Double Stack',   price: 19, layers: ['bun', 'patty', 'cheese', 'patty', 'bacon', 'bun'] },
  { id: 'cheese-burger',  name: 'Cheese Burger',  price: 13, layers: ['bun', 'patty', 'cheese', 'cheese', 'bun'] },
  { id: 'garden-burger',  name: 'Garden Burger',  price: 13, layers: ['bun', 'lettuce', 'tomato', 'avocado', 'cheese', 'bun'] },
  { id: 'breakfast-bun',  name: 'Breakfast Bun',  price: 12, layers: ['bun', 'egg', 'bacon', 'cheese', 'bun'] },
  { id: 'chicken-melt',   name: 'Chicken Melt',   price: 15, layers: ['bun', 'chicken', 'cheese', 'tomato', 'bun'] },
  { id: 'blt-stack',      name: 'BLT Stack',      price: 11, layers: ['bread', 'bacon', 'lettuce', 'tomato', 'bread'] },
  { id: 'club-sandwich',  name: 'Club Sandwich',  price: 17, layers: ['bread', 'chicken', 'bacon', 'lettuce', 'tomato', 'bread'] },
];

export const GRILLED = new Set(Object.keys(INGREDIENTS).filter((id) => INGREDIENTS[id].grill));

export const TUNING = {
  shiftSeconds: 120,          // one shift lasts two minutes
  maxOrders: 4,               // tickets that fit on the order board
  grillSlots: 3,              // pans on the grill
  maxPlateLayers: 8,          // the plate holds at most this many layers
  firstOrderDelay: 0.8,       // seconds before the first customer arrives
  spawnEveryStart: 8.5,       // seconds between customers early in the shift
  spawnEveryEnd: 5.0,         // ... and near closing time (the rush builds)
  patienceStart: 68,          // seconds a customer waits early on
  patienceEnd: 46,            // ... and late in the shift
  perfectBonus: 3,            // dollars for stacking a dish in exact recipe order
  walkoutFine: 4,             // dollars lost when a customer gives up and leaves
  comboStep: 0.1,             // each streak step adds 10% to what a serve pays
  comboCap: 1.0,              // ... up to double money at a 10+ streak
  tipFraction: 0.5,           // a full patience bar left is worth half the price again
  starThresholds: [55, 110, 170], // earnings that earn 1, 2 and 3 stars
};

// Customer faces the tickets wear, happiest first; patience picks the face.
export const FACES = ['😀', '🙂', '😐', '😟', '😡'];
export const SKIN_TONES = ['#ffdfc4', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
export const SHIRT_COLORS = ['#ef5350', '#42a5f5', '#66bb6a', '#ab47bc', '#ffa726', '#26a69a'];
