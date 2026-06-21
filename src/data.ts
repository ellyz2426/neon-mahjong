// Neon Mahjong VR - Game Data

// ── Tile types ──────────────────────────────────────────────
export interface TileType {
  id: number;
  suit: string;
  rank: number | string;
  label: string;     // Short label for canvas texture
  color: string;     // Primary color
  matchGroup: number; // Tiles with same matchGroup can match
}

// Match groups: 0-8 dots, 9-17 bamboo, 18-26 chars, 27-30 winds, 31-33 dragons, 34 flowers, 35 seasons
const SUITS = ['dot', 'bam', 'char'] as const;
const SUIT_COLORS = { dot: '#00ccff', bam: '#00ff88', char: '#ff4466' };
const DOT_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const BAM_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const CHAR_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
const WIND_LABELS = ['E', 'S', 'W', 'N'];
const DRAGON_LABELS = ['R', 'G', 'W'];
const FLOWER_LABELS = ['F1', 'F2', 'F3', 'F4'];
const SEASON_LABELS = ['S1', 'S2', 'S3', 'S4'];

export const TILE_TYPES: TileType[] = [];

// Dots 1-9 (match groups 0-8)
for (let i = 0; i < 9; i++) {
  TILE_TYPES.push({
    id: i, suit: 'dot', rank: i + 1,
    label: DOT_LABELS[i], color: SUIT_COLORS.dot, matchGroup: i,
  });
}
// Bamboo 1-9 (match groups 9-17)
for (let i = 0; i < 9; i++) {
  TILE_TYPES.push({
    id: 9 + i, suit: 'bam', rank: i + 1,
    label: BAM_LABELS[i], color: SUIT_COLORS.bam, matchGroup: 9 + i,
  });
}
// Characters 1-9 (match groups 18-26)
for (let i = 0; i < 9; i++) {
  TILE_TYPES.push({
    id: 18 + i, suit: 'char', rank: i + 1,
    label: CHAR_LABELS[i], color: SUIT_COLORS.char, matchGroup: 18 + i,
  });
}
// Winds (match groups 27-30)
for (let i = 0; i < 4; i++) {
  TILE_TYPES.push({
    id: 27 + i, suit: 'wind', rank: WIND_LABELS[i],
    label: WIND_LABELS[i], color: '#ffffff', matchGroup: 27 + i,
  });
}
// Dragons (match groups 31-33)
const DRAGON_COLORS = ['#ff2222', '#22ff22', '#ffffff'];
for (let i = 0; i < 3; i++) {
  TILE_TYPES.push({
    id: 31 + i, suit: 'dragon', rank: DRAGON_LABELS[i],
    label: DRAGON_LABELS[i], color: DRAGON_COLORS[i], matchGroup: 31 + i,
  });
}
// Flowers (match group 34 - all match each other)
for (let i = 0; i < 4; i++) {
  TILE_TYPES.push({
    id: 34 + i, suit: 'flower', rank: FLOWER_LABELS[i],
    label: FLOWER_LABELS[i], color: '#ff88ff', matchGroup: 34,
  });
}
// Seasons (match group 35 - all match each other)
for (let i = 0; i < 4; i++) {
  TILE_TYPES.push({
    id: 38 + i, suit: 'season', rank: SEASON_LABELS[i],
    label: SEASON_LABELS[i], color: '#ffaa00', matchGroup: 35,
  });
}

// Total: 42 types. Standard set: 4 copies each of types 0-33, 1 each of 34-41 = 136 + 8 = 144
export function generateTileSet(): number[] {
  const tiles: number[] = [];
  // 4 copies of each standard type (0-33)
  for (let i = 0; i < 34; i++) {
    for (let c = 0; c < 4; c++) tiles.push(i);
  }
  // 1 copy each of flowers and seasons (34-41)
  for (let i = 34; i < 42; i++) tiles.push(i);
  return tiles; // 136 + 8 = 144
}

// ── Layouts ─────────────────────────────────────────────────
export interface TilePosition {
  col: number;
  row: number;
  layer: number;
}

// Fortress (classic turtle) - 144 tiles across 5 layers
function makeFortress(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: large base
  // Row patterns for classic layout (12 cols, 8 rows with gaps)
  const l0rows: [number, number][] = [
    [0, 12], // row 0: cols 0-11
    [0, 12], // row 1
    [0, 12], // row 2
    [0, 14], // row 3: wider with ears
    [0, 14], // row 4
    [0, 12], // row 5
    [0, 12], // row 6
    [0, 12], // row 7
  ];
  // Actually, let me do a specific Turtle layout
  // Classic Turtle has a specific pattern. Let me define it precisely.
  // Layer 0: the big base
  const layer0: [number, number, number][] = [];
  // Rows 0,7: cols 2-9
  for (const r of [0, 7]) {
    for (let c = 2; c <= 9; c++) layer0.push([c, r, 0]);
  }
  // Rows 1,6: cols 1-10
  for (const r of [1, 6]) {
    for (let c = 1; c <= 10; c++) layer0.push([c, r, 0]);
  }
  // Rows 2,5: cols 0-11
  for (const r of [2, 5]) {
    for (let c = 0; c <= 11; c++) layer0.push([c, r, 0]);
  }
  // Rows 3,4: cols 0-12 (wide with ears)
  for (const r of [3, 4]) {
    for (let c = 0; c <= 12; c++) layer0.push([c, r, 0]);
  }
  // Total layer 0: 8*2 + 10*2 + 12*2 + 13*2 = 16+20+24+26 = 86

  // Layer 1: smaller
  const layer1: [number, number, number][] = [];
  for (const r of [1, 6]) {
    for (let c = 3; c <= 8; c++) layer1.push([c, r, 1]);
  }
  for (const r of [2, 3, 4, 5]) {
    for (let c = 2; c <= 9; c++) layer1.push([c, r, 1]);
  }
  // Total: 6*2 + 8*4 = 12+32 = 44

  // Layer 2
  const layer2: [number, number, number][] = [];
  for (const r of [2, 5]) {
    for (let c = 4; c <= 7; c++) layer2.push([c, r, 2]);
  }
  for (const r of [3, 4]) {
    for (let c = 4; c <= 7; c++) layer2.push([c, r, 2]);
  }
  // Total: 4*4 = 16 -- too many, need to trim

  // Adjust to hit 144 total. Let me recalculate:
  // 86 + 44 + 16 = 146 -- need to remove 2
  // Remove corners from layer 2:
  // layer2 without (4,2) and (7,5)
  const layer2adj: [number, number, number][] = [];
  for (const r of [2, 3, 4, 5]) {
    for (let c = 4; c <= 7; c++) {
      if ((r === 2 && c === 4) || (r === 5 && c === 7)) continue;
      layer2adj.push([c, r, 2]);
    }
  }
  // Total: 14

  // Actually let me just do a simpler well-balanced layout
  // Layer 0: ~80, Layer 1: ~40, Layer 2: ~16, Layer 3: ~6, Layer 4: ~2
  // Let me redo this more carefully
  pos.length = 0;

  // Layer 0 (base): 12x8 grid with cuts = exactly 86 tiles
  for (let r = 0; r < 8; r++) {
    let cStart = 0, cEnd = 11;
    if (r === 0 || r === 7) { cStart = 2; cEnd = 9; }
    else if (r === 1 || r === 6) { cStart = 1; cEnd = 10; }
    else if (r === 2 || r === 5) { cStart = 0; cEnd = 11; }
    else { cStart = 0; cEnd = 11; } // rows 3,4
    for (let c = cStart; c <= cEnd; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Count: 8+10+12+12+12+12+10+8 = 84

  // Layer 1: 8x6 inner = 48 -- too much with 84
  // Need 144 - 84 = 60 more. Let me adjust.
  // Layer 1: 6x4 = 24
  for (let r = 2; r <= 5; r++) {
    for (let c = 3; c <= 8; c++) {
      pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // +24 = 108

  // Layer 2: 4x4 centered = 16
  for (let r = 2; r <= 5; r++) {
    for (let c = 4; c <= 7; c++) {
      pos.push({ col: c, row: r, layer: 2 });
    }
  }
  // +16 = 124

  // Layer 3: 4x2 centered = 8
  for (let r = 3; r <= 4; r++) {
    for (let c = 4; c <= 7; c++) {
      pos.push({ col: c, row: r, layer: 3 });
    }
  }
  // +8 = 132

  // Layer 4: 2x2 centered = 4
  for (let r = 3; r <= 4; r++) {
    for (let c = 5; c <= 6; c++) {
      pos.push({ col: c, row: r, layer: 4 });
    }
  }
  // +4 = 136

  // Need 8 more. Add ears to layer 0
  // Left ear row 3: col -1, Right ear row 3: col 12
  // Left ear row 4: col -1, Right ear row 4: col 12
  pos.push({ col: -1, row: 3, layer: 0 });
  pos.push({ col: -1, row: 4, layer: 0 });
  pos.push({ col: 12, row: 3, layer: 0 });
  pos.push({ col: 12, row: 4, layer: 0 });
  // +4 = 140

  // Top cap: single stack
  pos.push({ col: 5, row: 3, layer: 5 });
  pos.push({ col: 6, row: 3, layer: 5 });
  pos.push({ col: 5, row: 4, layer: 5 });
  pos.push({ col: 6, row: 4, layer: 5 });
  // +4 = 144

  return pos;
}

function makePyramid(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: 10x8 = 80
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 10; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Layer 1: 8x6 = 48
  for (let r = 1; r < 7; r++) {
    for (let c = 1; c < 9; c++) {
      pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // 80 + 48 = 128
  // Layer 2: 4x4 = 16
  for (let r = 2; r < 6; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 2 });
    }
  }
  // 128 + 16 = 144
  return pos;
}

function makeTower(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: 6x6 = 36
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Layer 1: 6x6 = 36
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // Layer 2: 4x4 = 16
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 5; c++) {
      pos.push({ col: c, row: r, layer: 2 });
    }
  }
  // Layer 3: 4x4 = 16
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 5; c++) {
      pos.push({ col: c, row: r, layer: 3 });
    }
  }
  // 36+36+16+16 = 104
  // Layer 4: 4x4 = 16
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 5; c++) {
      pos.push({ col: c, row: r, layer: 4 });
    }
  }
  // 120
  // Layer 5: 2x2 = 4
  for (let r = 2; r < 4; r++) {
    for (let c = 2; c < 4; c++) {
      pos.push({ col: c, row: r, layer: 5 });
    }
  }
  // 124 -- need 20 more
  // Layer 6: 2x2 = 4
  for (let r = 2; r < 4; r++) {
    for (let c = 2; c < 4; c++) {
      pos.push({ col: c, row: r, layer: 6 });
    }
  }
  // 128. Add extra base tiles:
  // Extend layer 0 by adding ring
  pos.push({ col: -1, row: 1, layer: 0 });
  pos.push({ col: -1, row: 2, layer: 0 });
  pos.push({ col: -1, row: 3, layer: 0 });
  pos.push({ col: -1, row: 4, layer: 0 });
  pos.push({ col: 6, row: 1, layer: 0 });
  pos.push({ col: 6, row: 2, layer: 0 });
  pos.push({ col: 6, row: 3, layer: 0 });
  pos.push({ col: 6, row: 4, layer: 0 });
  // 136
  pos.push({ col: 1, row: -1, layer: 0 });
  pos.push({ col: 2, row: -1, layer: 0 });
  pos.push({ col: 3, row: -1, layer: 0 });
  pos.push({ col: 4, row: -1, layer: 0 });
  pos.push({ col: 1, row: 6, layer: 0 });
  pos.push({ col: 2, row: 6, layer: 0 });
  pos.push({ col: 3, row: 6, layer: 0 });
  pos.push({ col: 4, row: 6, layer: 0 });
  // 144
  return pos;
}

function makeCross(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: cross shape, 4 arms + center
  // Center block 4x4
  for (let r = 3; r < 7; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Top arm: cols 4-5, rows 0-2
  for (let r = 0; r < 3; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Bottom arm
  for (let r = 7; r < 10; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Left arm
  for (let r = 3; r < 7; r++) {
    for (let c = 0; c < 3; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Right arm
  for (let r = 3; r < 7; r++) {
    for (let c = 7; c < 10; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Count: 16 + 12 + 12 + 12 + 12 = 64

  // Layer 1: center 4x4 = 16
  for (let r = 3; r < 7; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 1 });
    }
  }
  // 80

  // Layer 0 extensions: arm tips wider
  for (let c = 2; c < 8; c++) {
    pos.push({ col: c, row: -1, layer: 0 });
    pos.push({ col: c, row: 10, layer: 0 });
  }
  for (let r = 2; r < 8; r++) {
    pos.push({ col: -1, row: r, layer: 0 });
    pos.push({ col: 10, row: r, layer: 0 });
  }
  // +12+12 = 24 → 104

  // Layer 2: 4x4 = 16
  for (let r = 3; r < 7; r++) {
    for (let c = 3; c < 7; c++) {
      pos.push({ col: c, row: r, layer: 2 });
    }
  }
  // 120

  // Layer 3: 2x2 = 4
  for (let r = 4; r < 6; r++) {
    for (let c = 4; c < 6; c++) {
      pos.push({ col: c, row: r, layer: 3 });
    }
  }
  // 124

  // Add more base tiles to reach 144:
  // Extra arm tiles
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

export interface LayoutDef {
  name: string;
  description: string;
  generate: () => TilePosition[];
}

export const LAYOUTS: LayoutDef[] = [
  { name: 'Fortress', description: '5 layers', generate: makeFortress },
  { name: 'Pyramid', description: 'Wide base', generate: makePyramid },
  { name: 'Tower', description: 'Deep stack', generate: makeTower },
  { name: 'Cross', description: 'Wide spread', generate: makeCross },
];

// ── Game Modes ──────────────────────────────────────────────
export type GameMode = 'classic' | 'timed' | 'zen' | 'daily' | 'speed' | 'practice';

export interface GameModeDef {
  id: GameMode;
  name: string;
  description: string;
  timeLimit: number; // 0 = no limit, otherwise seconds
  hintsAllowed: number; // -1 = unlimited
  shufflesAllowed: number;
}

export const GAME_MODES: GameModeDef[] = [
  { id: 'classic', name: 'Classic', description: 'Clear the board', timeLimit: 0, hintsAllowed: 3, shufflesAllowed: 3 },
  { id: 'timed', name: 'Timed', description: 'Beat the clock', timeLimit: 300, hintsAllowed: 3, shufflesAllowed: 2 },
  { id: 'zen', name: 'Zen', description: 'No pressure', timeLimit: 0, hintsAllowed: -1, shufflesAllowed: -1 },
  { id: 'daily', name: 'Daily', description: 'Today puzzle', timeLimit: 0, hintsAllowed: 3, shufflesAllowed: 3 },
  { id: 'speed', name: 'Speed', description: 'Fast bonus', timeLimit: 60, hintsAllowed: 1, shufflesAllowed: 1 },
  { id: 'practice', name: 'Practice', description: 'Free play', timeLimit: 0, hintsAllowed: -1, shufflesAllowed: -1 },
];

// ── Themes ──────────────────────────────────────────────────
export interface ThemeDef {
  id: string;
  name: string;
  tileBase: number;      // tile body color (hex)
  tileEdge: number;      // tile edge color
  tileFace: string;      // canvas text color override (null = use type color)
  tileSelected: number;  // selected glow color
  bgColor: number;       // scene background
  gridColor: number;     // floor grid color
  ambientColor: number;
  fogColor: number;
}

export const THEMES: ThemeDef[] = [
  { id: 'neon', name: 'Neon', tileBase: 0x0a1628, tileEdge: 0x00ccff, tileFace: '', tileSelected: 0x00ffff, bgColor: 0x050a14, gridColor: 0x003366, ambientColor: 0x334466, fogColor: 0x050a14 },
  { id: 'hologram', name: 'Hologram', tileBase: 0x0a0a2e, tileEdge: 0x4444ff, tileFace: '#8888ff', tileSelected: 0x6666ff, bgColor: 0x020210, gridColor: 0x222266, ambientColor: 0x222244, fogColor: 0x020210 },
  { id: 'mono', name: 'Monochrome', tileBase: 0x222222, tileEdge: 0x888888, tileFace: '#ffffff', tileSelected: 0xffffff, bgColor: 0x0a0a0a, gridColor: 0x333333, ambientColor: 0x444444, fogColor: 0x0a0a0a },
  { id: 'plasma', name: 'Plasma', tileBase: 0x1a0028, tileEdge: 0xff44ff, tileFace: '#ff88ff', tileSelected: 0xff66ff, bgColor: 0x0a0014, gridColor: 0x440066, ambientColor: 0x332244, fogColor: 0x0a0014 },
  { id: 'solar', name: 'Solar', tileBase: 0x1a1400, tileEdge: 0xffaa00, tileFace: '#ffcc44', tileSelected: 0xffcc00, bgColor: 0x0a0800, gridColor: 0x443300, ambientColor: 0x443322, fogColor: 0x0a0800 },
];

// ── Achievements ────────────────────────────────────────────
export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Basics
  { id: 'first_match', name: 'First Match', desc: 'Match your first pair' },
  { id: 'first_win', name: 'First Victory', desc: 'Clear a board' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Clear a board under 3 minutes' },
  { id: 'lightning', name: 'Lightning', desc: 'Clear a board under 2 minutes' },
  { id: 'no_hints', name: 'Unassisted', desc: 'Win without using hints' },
  { id: 'no_shuffle', name: 'No Shuffle', desc: 'Win without shuffling' },
  { id: 'purist', name: 'Purist', desc: 'Win with no hints or shuffles' },
  // Combos
  { id: 'combo3', name: 'Triple Threat', desc: 'Reach combo x3' },
  { id: 'combo5', name: 'Combo King', desc: 'Reach combo x5' },
  { id: 'combo8', name: 'Combo Master', desc: 'Reach combo x8' },
  { id: 'combo10', name: 'Unstoppable', desc: 'Reach max combo x10' },
  // Volume
  { id: 'matches10', name: '10 Matches', desc: 'Make 10 matches in one game' },
  { id: 'matches50', name: 'Halfway', desc: 'Make 50 matches in one game' },
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
  { id: 'score10k', name: 'Score Master', desc: 'Score 10000 in one game' },
  { id: 'score20k', name: 'Score Legend', desc: 'Score 20000 in one game' },
  // Modes
  { id: 'timed_win', name: 'Beat the Clock', desc: 'Win a Timed game' },
  { id: 'speed_win', name: 'Speed Racer', desc: 'Win a Speed game' },
  { id: 'daily_win', name: 'Daily Champion', desc: 'Win a Daily puzzle' },
  { id: 'daily3', name: 'Daily Streak', desc: 'Win 3 Daily puzzles' },
  // Layouts
  { id: 'fortress_win', name: 'Fortress Cleared', desc: 'Win on Fortress' },
  { id: 'pyramid_win', name: 'Pyramid Cleared', desc: 'Win on Pyramid' },
  { id: 'tower_win', name: 'Tower Cleared', desc: 'Win on Tower' },
  { id: 'cross_win', name: 'Cross Cleared', desc: 'Win on Cross' },
  { id: 'all_layouts', name: 'Conqueror', desc: 'Win on every layout' },
  // Themes
  { id: 'theme_change', name: 'Fashionista', desc: 'Change tile theme' },
  { id: 'all_themes', name: 'Collector', desc: 'Try every theme' },
  // Misc
  { id: 'xp100', name: 'Rising Star', desc: 'Reach 100 XP' },
  { id: 'level5', name: 'Leveled Up', desc: 'Reach level 5' },
  { id: 'level10', name: 'Expert', desc: 'Reach level 10' },
];
