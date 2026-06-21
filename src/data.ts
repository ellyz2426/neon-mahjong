// Neon Mahjong VR - Game Data (Extended)

// ── Tile types ──────────────────────────────────────────────
export interface TileType {
  id: number;
  suit: string;
  rank: number | string;
  label: string;
  color: string;
  matchGroup: number;
}

const SUIT_COLORS = { dot: '#00ccff', bam: '#00ff88', char: '#ff4466' };
const DOT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BAM_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const CHAR_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const WIND_LABELS = ['E', 'S', 'W', 'N'];
const DRAGON_LABELS = ['R', 'G', 'W'];
const FLOWER_LABELS = ['F1', 'F2', 'F3', 'F4'];
const SEASON_LABELS = ['S1', 'S2', 'S3', 'S4'];

export const TILE_TYPES: TileType[] = [];

for (let i = 0; i < 9; i++) {
  TILE_TYPES.push({
    id: i, suit: 'dot', rank: i + 1,
    label: DOT_LABELS[i], color: SUIT_COLORS.dot, matchGroup: i,
  });
}
for (let i = 0; i < 9; i++) {
  TILE_TYPES.push({
    id: 9 + i, suit: 'bam', rank: i + 1,
    label: BAM_LABELS[i], color: SUIT_COLORS.bam, matchGroup: 9 + i,
  });
}
for (let i = 0; i < 9; i++) {
  TILE_TYPES.push({
    id: 18 + i, suit: 'char', rank: i + 1,
    label: CHAR_LABELS[i], color: SUIT_COLORS.char, matchGroup: 18 + i,
  });
}
for (let i = 0; i < 4; i++) {
  TILE_TYPES.push({
    id: 27 + i, suit: 'wind', rank: WIND_LABELS[i],
    label: WIND_LABELS[i], color: '#ffffff', matchGroup: 27 + i,
  });
}
const DRAGON_COLORS = ['#ff2222', '#22ff22', '#ffffff'];
for (let i = 0; i < 3; i++) {
  TILE_TYPES.push({
    id: 31 + i, suit: 'dragon', rank: DRAGON_LABELS[i],
    label: DRAGON_LABELS[i], color: DRAGON_COLORS[i], matchGroup: 31 + i,
  });
}
for (let i = 0; i < 4; i++) {
  TILE_TYPES.push({
    id: 34 + i, suit: 'flower', rank: FLOWER_LABELS[i],
    label: FLOWER_LABELS[i], color: '#ff88ff', matchGroup: 34,
  });
}
for (let i = 0; i < 4; i++) {
  TILE_TYPES.push({
    id: 38 + i, suit: 'season', rank: SEASON_LABELS[i],
    label: SEASON_LABELS[i], color: '#ffaa00', matchGroup: 35,
  });
}

export function generateTileSet(): number[] {
  const tiles: number[] = [];
  for (let i = 0; i < 34; i++) {
    for (let c = 0; c < 4; c++) tiles.push(i);
  }
  for (let i = 34; i < 42; i++) tiles.push(i);
  return tiles; // 144
}

// ── Layouts ─────────────────────────────────────────────────
export interface TilePosition {
  col: number;
  row: number;
  layer: number;
}

function makeFortress(): TilePosition[] {
  const pos: TilePosition[] = [];
  for (let r = 0; r < 8; r++) {
    let cStart = 0, cEnd = 11;
    if (r === 0 || r === 7) { cStart = 2; cEnd = 9; }
    else if (r === 1 || r === 6) { cStart = 1; cEnd = 10; }
    for (let c = cStart; c <= cEnd; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // 84 layer 0
  for (let r = 2; r <= 5; r++) {
    for (let c = 3; c <= 8; c++) pos.push({ col: c, row: r, layer: 1 });
  }
  // +24 = 108
  for (let r = 2; r <= 5; r++) {
    for (let c = 4; c <= 7; c++) pos.push({ col: c, row: r, layer: 2 });
  }
  // +16 = 124
  for (let r = 3; r <= 4; r++) {
    for (let c = 4; c <= 7; c++) pos.push({ col: c, row: r, layer: 3 });
  }
  // +8 = 132
  for (let r = 3; r <= 4; r++) {
    for (let c = 5; c <= 6; c++) pos.push({ col: c, row: r, layer: 4 });
  }
  // +4 = 136
  pos.push({ col: -1, row: 3, layer: 0 });
  pos.push({ col: -1, row: 4, layer: 0 });
  pos.push({ col: 12, row: 3, layer: 0 });
  pos.push({ col: 12, row: 4, layer: 0 });
  // +4 = 140
  pos.push({ col: 5, row: 3, layer: 5 });
  pos.push({ col: 6, row: 3, layer: 5 });
  pos.push({ col: 5, row: 4, layer: 5 });
  pos.push({ col: 6, row: 4, layer: 5 });
  // +4 = 144
  return pos;
}

function makePyramid(): TilePosition[] {
  const pos: TilePosition[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) pos.push({ col: c, row: r, layer: 0 });
  }
  for (let r = 1; r < 7; r++) {
    for (let c = 1; c < 9; c++) pos.push({ col: c, row: r, layer: 1 });
  }
  for (let r = 2; r < 6; r++) {
    for (let c = 3; c < 7; c++) pos.push({ col: c, row: r, layer: 2 });
  }
  return pos;
}

function makeTower(): TilePosition[] {
  const pos: TilePosition[] = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) pos.push({ col: c, row: r, layer: 0 });
  }
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) pos.push({ col: c, row: r, layer: 1 });
  }
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 5; c++) pos.push({ col: c, row: r, layer: 2 });
  }
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 5; c++) pos.push({ col: c, row: r, layer: 3 });
  }
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 5; c++) pos.push({ col: c, row: r, layer: 4 });
  }
  for (let r = 2; r < 4; r++) {
    for (let c = 2; c < 4; c++) pos.push({ col: c, row: r, layer: 5 });
  }
  for (let r = 2; r < 4; r++) {
    for (let c = 2; c < 4; c++) pos.push({ col: c, row: r, layer: 6 });
  }
  // 128 → add wings
  pos.push({ col: -1, row: 1, layer: 0 }); pos.push({ col: -1, row: 2, layer: 0 });
  pos.push({ col: -1, row: 3, layer: 0 }); pos.push({ col: -1, row: 4, layer: 0 });
  pos.push({ col: 6, row: 1, layer: 0 }); pos.push({ col: 6, row: 2, layer: 0 });
  pos.push({ col: 6, row: 3, layer: 0 }); pos.push({ col: 6, row: 4, layer: 0 });
  pos.push({ col: 1, row: -1, layer: 0 }); pos.push({ col: 2, row: -1, layer: 0 });
  pos.push({ col: 3, row: -1, layer: 0 }); pos.push({ col: 4, row: -1, layer: 0 });
  pos.push({ col: 1, row: 6, layer: 0 }); pos.push({ col: 2, row: 6, layer: 0 });
  pos.push({ col: 3, row: 6, layer: 0 }); pos.push({ col: 4, row: 6, layer: 0 });
  return pos;
}

function makeCross(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Center 4x4
  for (let r = 3; r < 7; r++) {
    for (let c = 3; c < 7; c++) pos.push({ col: c, row: r, layer: 0 });
  }
  // Arms
  for (let r = 0; r < 3; r++) {
    for (let c = 3; c < 7; c++) pos.push({ col: c, row: r, layer: 0 });
  }
  for (let r = 7; r < 10; r++) {
    for (let c = 3; c < 7; c++) pos.push({ col: c, row: r, layer: 0 });
  }
  for (let r = 3; r < 7; r++) {
    for (let c = 0; c < 3; c++) pos.push({ col: c, row: r, layer: 0 });
  }
  for (let r = 3; r < 7; r++) {
    for (let c = 7; c < 10; c++) pos.push({ col: c, row: r, layer: 0 });
  }
  // 64 layer 0
  for (let r = 3; r < 7; r++) {
    for (let c = 3; c < 7; c++) pos.push({ col: c, row: r, layer: 1 });
  }
  // 80
  for (let c = 2; c < 8; c++) {
    pos.push({ col: c, row: -1, layer: 0 });
    pos.push({ col: c, row: 10, layer: 0 });
  }
  for (let r = 2; r < 8; r++) {
    pos.push({ col: -1, row: r, layer: 0 });
    pos.push({ col: 10, row: r, layer: 0 });
  }
  // 104
  for (let r = 3; r < 7; r++) {
    for (let c = 3; c < 7; c++) pos.push({ col: c, row: r, layer: 2 });
  }
  // 120
  for (let r = 4; r < 6; r++) {
    for (let c = 4; c < 6; c++) pos.push({ col: c, row: r, layer: 3 });
  }
  // 124
  const extras: [number, number][] = [
    [2, 0], [7, 0], [2, 9], [7, 9],
    [0, 2], [0, 7], [9, 2], [9, 7],
    [1, 1], [8, 1], [1, 8], [8, 8],
    [2, 1], [7, 1], [2, 8], [7, 8],
    [1, 2], [1, 7], [8, 2], [8, 7],
  ];
  for (const [c, r] of extras) {
    if (pos.length >= 144) break;
    pos.push({ col: c, row: r, layer: 0 });
  }
  return pos.slice(0, 144);
}

// ── NEW LAYOUT: Butterfly ───────────────────────────────────
function makeButterfly(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: two wings (left and right halves) with a central spine
  // Left wing
  for (let r = 0; r < 8; r++) {
    const dist = Math.abs(r - 3.5);
    const width = Math.max(1, Math.round(5 - dist));
    for (let c = 0; c < width; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Right wing (mirrored)
  for (let r = 0; r < 8; r++) {
    const dist = Math.abs(r - 3.5);
    const width = Math.max(1, Math.round(5 - dist));
    for (let c = 0; c < width; c++) {
      pos.push({ col: 11 - c, row: r, layer: 0 });
    }
  }
  // Spine (center column)
  for (let r = 0; r < 8; r++) {
    pos.push({ col: 5, row: r, layer: 0 });
    pos.push({ col: 6, row: r, layer: 0 });
  }
  // Remove duplicates
  const seen = new Set<string>();
  const unique: TilePosition[] = [];
  for (const p of pos) {
    const k = `${p.col},${p.row},${p.layer}`;
    if (!seen.has(k)) { seen.add(k); unique.push(p); }
  }
  // Layer 1: center 6x4
  for (let r = 2; r < 6; r++) {
    for (let c = 3; c < 9; c++) {
      unique.push({ col: c, row: r, layer: 1 });
    }
  }
  // Layer 2: center 4x2
  for (let r = 3; r < 5; r++) {
    for (let c = 4; c < 8; c++) {
      unique.push({ col: c, row: r, layer: 2 });
    }
  }
  // Layer 3: center 2x2
  for (let r = 3; r < 5; r++) {
    for (let c = 5; c < 7; c++) {
      unique.push({ col: c, row: r, layer: 3 });
    }
  }
  // Pad to 144
  const wingExtras: [number,number][] = [
    [-1,3],[-1,4],[12,3],[12,4],
    [0,-1],[11,-1],[0,8],[11,8],
    [1,-1],[10,-1],[1,8],[10,8],
  ];
  for (const [c,r] of wingExtras) {
    if (unique.length >= 144) break;
    unique.push({ col: c, row: r, layer: 0 });
  }
  return unique.slice(0, 144);
}

// ── NEW LAYOUT: Turtle ──────────────────────────────────────
function makeTurtle(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: oval shell 10x6 = 60
  for (let r = 0; r < 6; r++) {
    let cStart = 0, cEnd = 9;
    if (r === 0 || r === 5) { cStart = 2; cEnd = 7; }
    else if (r === 1 || r === 4) { cStart = 1; cEnd = 8; }
    for (let c = cStart; c <= cEnd; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Head: 2 tiles extending from top
  pos.push({ col: 4, row: -1, layer: 0 });
  pos.push({ col: 5, row: -1, layer: 0 });
  // Tail: 2 tiles extending from bottom
  pos.push({ col: 4, row: 6, layer: 0 });
  pos.push({ col: 5, row: 6, layer: 0 });
  // Legs: 4 corners
  pos.push({ col: 0, row: -1, layer: 0 });
  pos.push({ col: 9, row: -1, layer: 0 });
  pos.push({ col: 0, row: 6, layer: 0 });
  pos.push({ col: 9, row: 6, layer: 0 });

  // Layer 1: inner shell 8x4 = 32
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 9; c++) {
      pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // Layer 2: 6x4 = 24
  for (let r = 1; r < 5; r++) {
    for (let c = 2; c < 8; c++) {
      pos.push({ col: c, row: r, layer: 2 });
    }
  }
  // Layer 3: 4x2 = 8
  for (let r = 2; r < 4; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 3 });
    }
  }
  // Layer 4: 2x2 = 4
  for (let r = 2; r < 4; r++) {
    for (let c = 4; c < 6; c++) {
      pos.push({ col: c, row: r, layer: 4 });
    }
  }
  // Layer 5: cap
  pos.push({ col: 4, row: 2, layer: 5 });
  pos.push({ col: 5, row: 2, layer: 5 });
  pos.push({ col: 4, row: 3, layer: 5 });
  pos.push({ col: 5, row: 3, layer: 5 });

  return pos.slice(0, 144);
}

// ── NEW LAYOUT: Diamond ─────────────────────────────────────
function makeDiamond(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: diamond shape ~72 tiles
  const center = 6;
  for (let r = 0; r < 13; r++) {
    const dist = Math.abs(r - center);
    const half = 6 - dist;
    if (half < 0) continue;
    for (let c = center - half; c <= center + half; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Should be ~91 tiles. Trim to 80 by narrowing
  // Actually let me compute: r=0: 1, r=1: 3, r=2: 5, r=3: 7, r=4: 9, r=5: 11, r=6: 13, r=7: 11, ...
  // Total: 1+3+5+7+9+11+13+11+9+7+5+3+1 = 85
  // Trim to 80 by removing corners: take first 80
  while (pos.length > 80) pos.pop();

  // Layer 1: smaller diamond 40 tiles
  for (let r = 2; r < 11; r++) {
    const dist = Math.abs(r - center);
    const half = 4 - dist;
    if (half < 0) continue;
    for (let c = center - half; c <= center + half; c++) {
      pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // r=2: dist=4, half=0: 1, r=3: dist=3, half=1: 3, r=4: half=2: 5, r=5: half=3: 7, r=6: half=4: 9
  // r=7: 7, r=8: 5, r=9: 3, r=10: 1 = 1+3+5+7+9+7+5+3+1 = 41
  // Trim
  while (pos.length > 80 + 40) pos.pop();

  // Layer 2: 16 tiles
  for (let r = 4; r < 9; r++) {
    const dist = Math.abs(r - center);
    const half = 2 - dist;
    if (half < 0) continue;
    for (let c = center - half; c <= center + half; c++) {
      pos.push({ col: c, row: r, layer: 2 });
    }
  }
  // r=4: dist=2, half=0: 1, r=5: half=1: 3, r=6: half=2: 5, r=7: 3, r=8: 1 = 13

  // Layer 3: 4 tiles
  for (let r = 5; r < 8; r++) {
    const dist = Math.abs(r - center);
    const half = 1 - dist;
    if (half < 0) continue;
    for (let c = center - half; c <= center + half; c++) {
      pos.push({ col: c, row: r, layer: 3 });
    }
  }
  // r=5: 1, r=6: 3, r=7: 1 = 5

  // Layer 4: cap
  pos.push({ col: center, row: center, layer: 4 });

  // Need exactly 144. Pad or trim.
  // Current: 80 + 40 + 13 + 5 + 1 = 139. Need 5 more.
  // Add wing tips
  pos.push({ col: 0, row: 5, layer: 0 });
  pos.push({ col: 0, row: 7, layer: 0 });
  pos.push({ col: 12, row: 5, layer: 0 });
  pos.push({ col: 12, row: 7, layer: 0 });
  pos.push({ col: center, row: center, layer: 5 });

  return pos.slice(0, 144);
}

// ── NEW LAYOUT: Spiral ──────────────────────────────────────
function makeSpiral(): TilePosition[] {
  const pos: TilePosition[] = [];

  // Layer 0: rectangular base 10x8 = 80
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }

  // Layer 1: offset spiral ring = 36 tiles
  // Outer ring of 6x6
  const l1Center = { c: 5, r: 4 };
  for (let r = 1; r < 7; r++) {
    for (let c = 2; c < 8; c++) {
      const onEdge = r === 1 || r === 6 || c === 2 || c === 7;
      if (onEdge) pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // Ring: (6+6)*2 - 4 = 20. Too few, fill inner
  for (let r = 2; r < 6; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // +16 = 80+20+16 = 116

  // Layer 2: central block 4x3 = 12
  for (let r = 3; r < 6; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 2 });
    }
  }
  // 128

  // Layer 3: 2x3 = 6
  for (let r = 3; r < 6; r++) {
    for (let c = 4; c < 6; c++) {
      pos.push({ col: c, row: r, layer: 3 });
    }
  }
  // 134

  // Layer 4: 2x2 = 4
  for (let r = 3; r < 5; r++) {
    for (let c = 4; c < 6; c++) {
      pos.push({ col: c, row: r, layer: 4 });
    }
  }
  // 138

  // Extra layer 0 tiles for wings
  pos.push({ col: -1, row: 3, layer: 0 });
  pos.push({ col: -1, row: 4, layer: 0 });
  pos.push({ col: 10, row: 3, layer: 0 });
  pos.push({ col: 10, row: 4, layer: 0 });
  // 142

  // Cap
  pos.push({ col: 4, row: 4, layer: 5 });
  pos.push({ col: 5, row: 4, layer: 5 });
  // 144

  return pos.slice(0, 144);
}

export interface LayoutDef {
  name: string;
  description: string;
  generate: () => TilePosition[];
}

export const LAYOUTS: LayoutDef[] = [
  { name: 'Fortress', description: '6 layers', generate: makeFortress },
  { name: 'Pyramid', description: 'Wide base', generate: makePyramid },
  { name: 'Tower', description: 'Deep stack', generate: makeTower },
  { name: 'Cross', description: 'Wide spread', generate: makeCross },
  { name: 'Diamond', description: 'Concentric', generate: makeDiamond },
  { name: 'Spiral', description: 'Layered ring', generate: makeSpiral },
  { name: 'Butterfly', description: 'Twin wings', generate: makeButterfly },
  { name: 'Turtle', description: 'Shell stack', generate: makeTurtle },
];

// ── Game Modes ──────────────────────────────────────────────
export type GameMode = 'classic' | 'timed' | 'zen' | 'daily' | 'speed' | 'practice' | 'challenge';

export interface GameModeDef {
  id: GameMode;
  name: string;
  description: string;
  timeLimit: number;
  hintsAllowed: number;
  shufflesAllowed: number;
}

export const GAME_MODES: GameModeDef[] = [
  { id: 'classic', name: 'Classic', description: 'Clear the board', timeLimit: 0, hintsAllowed: 3, shufflesAllowed: 3 },
  { id: 'timed', name: 'Timed', description: 'Beat the clock', timeLimit: 300, hintsAllowed: 3, shufflesAllowed: 2 },
  { id: 'zen', name: 'Zen', description: 'No pressure', timeLimit: 0, hintsAllowed: -1, shufflesAllowed: -1 },
  { id: 'daily', name: 'Daily', description: 'Today puzzle', timeLimit: 0, hintsAllowed: 3, shufflesAllowed: 3 },
  { id: 'speed', name: 'Speed', description: 'Fast bonus', timeLimit: 60, hintsAllowed: 1, shufflesAllowed: 1 },
  { id: 'practice', name: 'Practice', description: 'Free play', timeLimit: 0, hintsAllowed: -1, shufflesAllowed: -1 },
  { id: 'challenge', name: 'Challenge', description: 'Beat objectives', timeLimit: 240, hintsAllowed: 2, shufflesAllowed: 2 },
];

// ── Challenge Objectives ────────────────────────────────────
export interface ChallengeDef {
  id: string;
  name: string;
  description: string;
  targetScore: number;
  minCombo: number;
  maxHints: number;
  timeLimit: number;
}

export const CHALLENGES: ChallengeDef[] = [
  { id: 'ch1', name: 'Warmup', description: 'Score 3000', targetScore: 3000, minCombo: 0, maxHints: 3, timeLimit: 300 },
  { id: 'ch2', name: 'Combo King', description: 'Get x5 combo', targetScore: 0, minCombo: 5, maxHints: 3, timeLimit: 300 },
  { id: 'ch3', name: 'No Help', description: 'Win with 0 hints', targetScore: 0, minCombo: 0, maxHints: 0, timeLimit: 0 },
  { id: 'ch4', name: 'Speed Run', description: 'Clear in 2 min', targetScore: 0, minCombo: 0, maxHints: -1, timeLimit: 120 },
  { id: 'ch5', name: 'High Roller', description: 'Score 8000', targetScore: 8000, minCombo: 0, maxHints: 3, timeLimit: 300 },
  { id: 'ch6', name: 'Perfectionist', description: 'x8 combo + clear', targetScore: 0, minCombo: 8, maxHints: 0, timeLimit: 0 },
  { id: 'ch7', name: 'Lightning', description: 'Clear in 90 sec', targetScore: 0, minCombo: 0, maxHints: 1, timeLimit: 90 },
  { id: 'ch8', name: 'Score Master', description: 'Score 15000', targetScore: 15000, minCombo: 0, maxHints: -1, timeLimit: 600 },
];

// ── Difficulty Tiers ────────────────────────────────────────
export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultyDef {
  id: Difficulty;
  name: string;
  hintMod: number;      // multiplier for hint limit
  shuffleMod: number;   // multiplier for shuffle limit
  timeMod: number;      // multiplier for time limit (higher = more time)
  scoreMod: number;     // score multiplier
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: 'easy', name: 'Easy', hintMod: 2, shuffleMod: 2, timeMod: 1.5, scoreMod: 0.8 },
  { id: 'normal', name: 'Normal', hintMod: 1, shuffleMod: 1, timeMod: 1, scoreMod: 1.0 },
  { id: 'hard', name: 'Hard', hintMod: 0.5, shuffleMod: 0.5, timeMod: 0.7, scoreMod: 1.5 },
];

// ── Themes ──────────────────────────────────────────────────
export interface ThemeDef {
  id: string;
  name: string;
  tileBase: number;
  tileEdge: number;
  tileFace: string;
  tileSelected: number;
  bgColor: number;
  gridColor: number;
  ambientColor: number;
  fogColor: number;
}

export const THEMES: ThemeDef[] = [
  { id: 'neon', name: 'Neon', tileBase: 0x0a1628, tileEdge: 0x00ccff, tileFace: '', tileSelected: 0x00ffff, bgColor: 0x050a14, gridColor: 0x003366, ambientColor: 0x334466, fogColor: 0x050a14 },
  { id: 'hologram', name: 'Hologram', tileBase: 0x0a0a2e, tileEdge: 0x4444ff, tileFace: '#8888ff', tileSelected: 0x6666ff, bgColor: 0x020210, gridColor: 0x222266, ambientColor: 0x222244, fogColor: 0x020210 },
  { id: 'mono', name: 'Monochrome', tileBase: 0x222222, tileEdge: 0x888888, tileFace: '#ffffff', tileSelected: 0xffffff, bgColor: 0x0a0a0a, gridColor: 0x333333, ambientColor: 0x444444, fogColor: 0x0a0a0a },
  { id: 'plasma', name: 'Plasma', tileBase: 0x1a0028, tileEdge: 0xff44ff, tileFace: '#ff88ff', tileSelected: 0xff66ff, bgColor: 0x0a0014, gridColor: 0x440066, ambientColor: 0x332244, fogColor: 0x0a0014 },
  { id: 'solar', name: 'Solar', tileBase: 0x1a1400, tileEdge: 0xffaa00, tileFace: '#ffcc44', tileSelected: 0xffcc00, bgColor: 0x0a0800, gridColor: 0x443300, ambientColor: 0x443322, fogColor: 0x0a0800 },
  { id: 'arctic', name: 'Arctic', tileBase: 0x0a1a2a, tileEdge: 0x88ccff, tileFace: '#aaddff', tileSelected: 0xbbddff, bgColor: 0x040810, gridColor: 0x223344, ambientColor: 0x334466, fogColor: 0x040810 },
  { id: 'ember', name: 'Ember', tileBase: 0x1a0a00, tileEdge: 0xff4400, tileFace: '#ff8844', tileSelected: 0xff6622, bgColor: 0x0a0400, gridColor: 0x442200, ambientColor: 0x443322, fogColor: 0x0a0400 },
  { id: 'jade', name: 'Jade', tileBase: 0x0a1a0a, tileEdge: 0x22cc44, tileFace: '#44ff66', tileSelected: 0x33ff55, bgColor: 0x040a04, gridColor: 0x224422, ambientColor: 0x224422, fogColor: 0x040a04 },
];

// ── Achievements (60 total) ─────────────────────────────────
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Basics
  { id: 'first_match', name: 'First Match', desc: 'Match your first pair' },
  { id: 'first_win', name: 'First Victory', desc: 'Clear a board' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Clear under 3 min' },
  { id: 'lightning', name: 'Lightning', desc: 'Clear under 2 min' },
  { id: 'no_hints', name: 'Unassisted', desc: 'Win without hints' },
  { id: 'no_shuffle', name: 'No Shuffle', desc: 'Win without shuffle' },
  { id: 'purist', name: 'Purist', desc: 'Win: no hints or shuffles' },
  // Combos
  { id: 'combo3', name: 'Triple Threat', desc: 'Reach combo x3' },
  { id: 'combo5', name: 'Combo King', desc: 'Reach combo x5' },
  { id: 'combo8', name: 'Combo Master', desc: 'Reach combo x8' },
  { id: 'combo10', name: 'Unstoppable', desc: 'Reach max combo x10' },
  // Volume
  { id: 'matches10', name: '10 Matches', desc: '10 matches in one game' },
  { id: 'matches50', name: 'Halfway', desc: '50 matches in one game' },
  { id: 'matches72', name: 'Full Clear', desc: 'Match all 72 pairs' },
  { id: 'total100', name: 'Century', desc: '100 total matches' },
  { id: 'total500', name: 'Veteran', desc: '500 total matches' },
  { id: 'total1000', name: 'Grand Master', desc: '1000 total matches' },
  // Games played
  { id: 'play5', name: 'Regular', desc: 'Play 5 games' },
  { id: 'play10', name: 'Dedicated', desc: 'Play 10 games' },
  { id: 'play25', name: 'Devoted', desc: 'Play 25 games' },
  { id: 'play50', name: 'Obsessed', desc: 'Play 50 games' },
  // Wins
  { id: 'win3', name: 'Hat Trick', desc: 'Win 3 games' },
  { id: 'win10', name: 'Champion', desc: 'Win 10 games' },
  { id: 'win25', name: 'Legend', desc: 'Win 25 games' },
  // Score
  { id: 'score5k', name: 'High Score', desc: 'Score 5000 in one game' },
  { id: 'score10k', name: 'Score Master', desc: 'Score 10000' },
  { id: 'score20k', name: 'Score Legend', desc: 'Score 20000' },
  // Modes
  { id: 'timed_win', name: 'Beat the Clock', desc: 'Win a Timed game' },
  { id: 'speed_win', name: 'Speed Racer', desc: 'Win a Speed game' },
  { id: 'daily_win', name: 'Daily Champion', desc: 'Win a Daily puzzle' },
  { id: 'daily3', name: 'Daily Streak', desc: 'Win 3 Daily puzzles' },
  { id: 'challenge_win', name: 'Challenger', desc: 'Beat a Challenge' },
  { id: 'challenge3', name: 'Challenge Streak', desc: 'Beat 3 Challenges' },
  { id: 'challenge_all', name: 'Challenge Master', desc: 'Beat all 8 Challenges' },
  // Layouts
  { id: 'fortress_win', name: 'Fortress Cleared', desc: 'Win on Fortress' },
  { id: 'pyramid_win', name: 'Pyramid Cleared', desc: 'Win on Pyramid' },
  { id: 'tower_win', name: 'Tower Cleared', desc: 'Win on Tower' },
  { id: 'cross_win', name: 'Cross Cleared', desc: 'Win on Cross' },
  { id: 'diamond_win', name: 'Diamond Cleared', desc: 'Win on Diamond' },
  { id: 'spiral_win', name: 'Spiral Cleared', desc: 'Win on Spiral' },
  { id: 'all_layouts', name: 'Conqueror', desc: 'Win on every layout' },
  // Themes
  { id: 'theme_change', name: 'Fashionista', desc: 'Change tile theme' },
  { id: 'all_themes', name: 'Collector', desc: 'Try every theme' },
  // XP / Level
  { id: 'xp100', name: 'Rising Star', desc: 'Reach 100 XP' },
  { id: 'xp500', name: 'Experienced', desc: 'Reach 500 XP' },
  { id: 'xp1000', name: 'Seasoned', desc: 'Reach 1000 XP' },
  { id: 'level5', name: 'Leveled Up', desc: 'Reach level 5' },
  { id: 'level10', name: 'Expert', desc: 'Reach level 10' },
  { id: 'level20', name: 'Master', desc: 'Reach level 20' },
  // Win streaks
  { id: 'streak3', name: 'Hot Streak', desc: '3 wins in a row' },
  { id: 'streak5', name: 'On Fire', desc: '5 wins in a row' },
  { id: 'streak10', name: 'Invincible', desc: '10 wins in a row' },
  // Misc
  { id: 'auto_complete', name: 'Auto Pilot', desc: 'Use auto-complete' },
  { id: 'fast_match', name: 'Quick Draw', desc: 'Match within 2 sec of start' },
  { id: 'perfect_timed', name: 'Time Lord', desc: 'Timed win with 60+ sec left' },
  { id: 'score_popup', name: 'Big Points', desc: 'Score 1000+ in one match' },
  { id: 'play100', name: 'Centurion', desc: 'Play 100 games' },
  { id: 'win50', name: 'Grandmaster', desc: 'Win 50 games' },
  { id: 'all_modes', name: 'Versatile', desc: 'Win in every mode' },
  { id: 'hard_win', name: 'Iron Will', desc: 'Win on Hard difficulty' },
  { id: 'hard_no_hint', name: 'Fearless', desc: 'Hard win with no hints' },
  // New layout achievements
  { id: 'butterfly_win', name: 'Butterfly Wings', desc: 'Win on Butterfly' },
  { id: 'turtle_win', name: 'Turtle Shell', desc: 'Win on Turtle' },
  // Difficulty achievements
  { id: 'easy_win', name: 'Gentle Start', desc: 'Win on Easy' },
  { id: 'hard3', name: 'Hardened', desc: '3 Hard wins' },
  { id: 'hard10', name: 'Unyielding', desc: '10 Hard wins' },
  // Save/resume
  { id: 'resume_win', name: 'Comeback', desc: 'Win a resumed game' },
  // Variety
  { id: 'all8_layouts', name: 'Explorer', desc: 'Win on all 8 layouts' },
  { id: 'tiles500', name: 'Tile Collector', desc: 'Clear 500 total tiles' },
  { id: 'tiles2000', name: 'Tile Hoarder', desc: 'Clear 2000 total tiles' },
  { id: 'playtime30', name: 'Dedicated Player', desc: 'Play 30 min total' },
  { id: 'playtime120', name: 'Marathon Player', desc: 'Play 2 hours total' },
];
