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

// ── NEW LAYOUT: Dragon ──────────────────────────────────────
function makeDragon(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: serpentine body (S-curve)
  // Top curve (head)
  for (let c = 4; c <= 10; c++) pos.push({ col: c, row: 0, layer: 0 });
  for (let c = 3; c <= 4; c++) pos.push({ col: c, row: 1, layer: 0 });
  for (let c = 9; c <= 11; c++) pos.push({ col: c, row: 1, layer: 0 });
  // Head horn
  pos.push({ col: 11, row: 0, layer: 0 });
  pos.push({ col: 12, row: 0, layer: 0 });

  // Upper body
  for (let c = 1; c <= 4; c++) pos.push({ col: c, row: 2, layer: 0 });
  for (let c = 0; c <= 2; c++) pos.push({ col: c, row: 3, layer: 0 });
  for (let c = 0; c <= 3; c++) pos.push({ col: c, row: 4, layer: 0 });

  // Mid curve
  for (let c = 2; c <= 8; c++) pos.push({ col: c, row: 5, layer: 0 });
  for (let c = 7; c <= 10; c++) pos.push({ col: c, row: 6, layer: 0 });
  for (let c = 8; c <= 11; c++) pos.push({ col: c, row: 7, layer: 0 });

  // Lower body
  for (let c = 7; c <= 11; c++) pos.push({ col: c, row: 8, layer: 0 });
  for (let c = 4; c <= 8; c++) pos.push({ col: c, row: 9, layer: 0 });

  // Tail
  for (let c = 1; c <= 4; c++) pos.push({ col: c, row: 10, layer: 0 });
  pos.push({ col: 0, row: 10, layer: 0 });
  pos.push({ col: 0, row: 11, layer: 0 });

  // Layer 1: spine along body center
  for (let c = 5; c <= 9; c++) pos.push({ col: c, row: 0, layer: 1 });
  pos.push({ col: 3, row: 2, layer: 1 }); pos.push({ col: 4, row: 2, layer: 1 });
  pos.push({ col: 1, row: 3, layer: 1 }); pos.push({ col: 2, row: 3, layer: 1 });
  pos.push({ col: 1, row: 4, layer: 1 }); pos.push({ col: 2, row: 4, layer: 1 });
  for (let c = 3; c <= 7; c++) pos.push({ col: c, row: 5, layer: 1 });
  pos.push({ col: 8, row: 6, layer: 1 }); pos.push({ col: 9, row: 6, layer: 1 });
  pos.push({ col: 9, row: 7, layer: 1 }); pos.push({ col: 10, row: 7, layer: 1 });
  pos.push({ col: 8, row: 8, layer: 1 }); pos.push({ col: 9, row: 8, layer: 1 });
  pos.push({ col: 5, row: 9, layer: 1 }); pos.push({ col: 6, row: 9, layer: 1 });

  // Layer 2: central jewels
  pos.push({ col: 7, row: 0, layer: 2 });
  pos.push({ col: 5, row: 5, layer: 2 }); pos.push({ col: 6, row: 5, layer: 2 });
  pos.push({ col: 9, row: 7, layer: 2 });

  // Pad to 144
  const extras: [number,number][] = [
    [5,1],[6,1],[7,1],[8,1],
    [5,2],[6,2],[7,2],[8,2],
    [3,3],[4,3],[5,3],
    [3,4],[4,4],[5,4],
    [9,4],[10,4],
    [9,5],[10,5],
    [3,6],[4,6],[5,6],[6,6],
    [3,7],[4,7],[5,7],[6,7],[7,7],
    [3,8],[4,8],[5,8],[6,8],
    [2,9],[3,9],[7,9],[8,9],
    [5,10],[6,10],[7,10],
    [1,11],[2,11],[3,11],
  ];
  for (const [c, r] of extras) {
    const key = `${c},${r},0`;
    const exists = pos.some(p => p.col === c && p.row === r && p.layer === 0);
    if (!exists && pos.length < 144) pos.push({ col: c, row: r, layer: 0 });
  }
  return pos.slice(0, 144);
}

// ── NEW LAYOUT: Phoenix ─────────────────────────────────────
function makePhoenix(): TilePosition[] {
  const pos: TilePosition[] = [];
  // Layer 0: bird shape — outspread wings + body

  // Left wing (rows 2-6, spreading left)
  for (let r = 2; r <= 6; r++) {
    const wingSpan = 5 - Math.abs(r - 4);
    for (let c = 5 - wingSpan; c <= 5; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Right wing (mirrored)
  for (let r = 2; r <= 6; r++) {
    const wingSpan = 5 - Math.abs(r - 4);
    for (let c = 7; c <= 7 + wingSpan; c++) {
      pos.push({ col: c, row: r, layer: 0 });
    }
  }
  // Body center spine
  for (let r = 0; r < 10; r++) {
    pos.push({ col: 6, row: r, layer: 0 });
  }
  // Head
  pos.push({ col: 5, row: 0, layer: 0 });
  pos.push({ col: 7, row: 0, layer: 0 });
  pos.push({ col: 5, row: 1, layer: 0 });
  pos.push({ col: 7, row: 1, layer: 0 });
  // Tail fan
  for (let c = 3; c <= 9; c++) {
    if (c !== 6) pos.push({ col: c, row: 8, layer: 0 });
  }
  for (let c = 2; c <= 10; c++) {
    if (c !== 6) pos.push({ col: c, row: 9, layer: 0 });
  }
  // Tail tips
  pos.push({ col: 1, row: 10, layer: 0 }); pos.push({ col: 3, row: 10, layer: 0 });
  pos.push({ col: 5, row: 10, layer: 0 }); pos.push({ col: 7, row: 10, layer: 0 });
  pos.push({ col: 9, row: 10, layer: 0 }); pos.push({ col: 11, row: 10, layer: 0 });

  // Deduplicate
  const seen = new Set<string>();
  const unique: TilePosition[] = [];
  for (const p of pos) {
    const k = `${p.col},${p.row},${p.layer}`;
    if (!seen.has(k)) { seen.add(k); unique.push(p); }
  }

  // Layer 1: body + wing inner
  for (let r = 1; r <= 7; r++) {
    unique.push({ col: 6, row: r, layer: 1 });
  }
  for (let r = 3; r <= 5; r++) {
    unique.push({ col: 4, row: r, layer: 1 });
    unique.push({ col: 5, row: r, layer: 1 });
    unique.push({ col: 7, row: r, layer: 1 });
    unique.push({ col: 8, row: r, layer: 1 });
  }

  // Layer 2: core
  for (let r = 3; r <= 5; r++) {
    unique.push({ col: 5, row: r, layer: 2 });
    unique.push({ col: 6, row: r, layer: 2 });
    unique.push({ col: 7, row: r, layer: 2 });
  }

  // Layer 3: heart
  unique.push({ col: 6, row: 3, layer: 3 });
  unique.push({ col: 6, row: 4, layer: 3 });
  unique.push({ col: 6, row: 5, layer: 3 });
  unique.push({ col: 5, row: 4, layer: 3 });
  unique.push({ col: 7, row: 4, layer: 3 });

  // Layer 4: crown
  unique.push({ col: 6, row: 4, layer: 4 });

  // Wing tip extras to reach 144
  const wingExtras: [number,number][] = [
    [0,3],[0,4],[0,5],[12,3],[12,4],[12,5],
    [1,2],[1,6],[11,2],[11,6],
    [2,1],[10,1],[2,7],[10,7],
    [4,8],[8,8],[4,9],[8,9],
    [6,10],[6,11],
  ];
  for (const [c,r] of wingExtras) {
    const k = `${c},${r},0`;
    if (!seen.has(k) && unique.length < 144) {
      seen.add(k);
      unique.push({ col: c, row: r, layer: 0 });
    }
  }

  return unique.slice(0, 144);
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
  { name: 'Dragon', description: 'Serpentine', generate: makeDragon },
  { name: 'Phoenix', description: 'Soaring bird', generate: makePhoenix },
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
  // Grade achievements
  { id: 'grade_s', name: 'S-Rank', desc: 'Earn an S grade' },
  { id: 'grade_a', name: 'A-Rank', desc: 'Earn an A grade or better' },
  { id: 'grade_s_hard', name: 'Perfection', desc: 'S grade on Hard difficulty' },
  { id: 'grade_s_speed', name: 'Speed Master', desc: 'S grade in Speed mode' },
  // Efficiency
  { id: 'no_undo', name: 'No Regrets', desc: 'Win without using undo' },
  { id: 'under_60', name: 'Minute Man', desc: 'Clear board in 60 sec' },
  { id: 'zen_30min', name: 'Zen Master', desc: 'Play Zen for 30+ min' },
  // Free tile glow
  { id: 'free_glow', name: 'Illuminated', desc: 'Use free tile glow' },
  // Zoom
  { id: 'zoom_user', name: 'Eagle Eye', desc: 'Use zoom controls' },
  // Volume achievements
  { id: 'matches100_game', name: 'Tile Marathon', desc: '100+ matches in one session' },
  { id: 'total2000', name: 'Tile Legend', desc: '2000 total matches' },
  { id: 'score50k', name: 'Score Titan', desc: 'Score 50000 in one game' },
  { id: 'all_themes_used', name: 'Style Icon', desc: 'Play with all 8 themes' },
  // Power-up achievements
  { id: 'first_powerup', name: 'Powered Up', desc: 'Use your first power-up' },
  { id: 'freeze_used', name: 'Ice Age', desc: 'Use Freeze power-up' },
  { id: 'double_used', name: 'Double Down', desc: 'Use Double Points power-up' },
  { id: 'reveal_used', name: 'All Seeing', desc: 'Use Reveal power-up' },
  { id: 'wildcard_used', name: 'Wild Card', desc: 'Use Wildcard power-up' },
  { id: 'all_powerups', name: 'Arsenal', desc: 'Use all 4 power-up types' },
  // Perfection
  { id: 'perfect_game', name: 'Flawless', desc: 'S-rank: no hints, shuffles, or undo' },
  { id: 'clear_45', name: 'Blitz', desc: 'Clear board in 45 seconds' },
  // Volume milestones
  { id: 'score100k', name: 'Score Overlord', desc: 'Score 100000 in one game' },
  { id: 'total5000', name: 'Tile Sage', desc: '5000 total matches' },
  { id: 'win100', name: 'Eternal Champion', desc: 'Win 100 games' },
  // Quick play
  { id: 'quick_play', name: 'Lucky Draw', desc: 'Use Quick Play' },
  // Match speed
  { id: 'match3_fast', name: 'Triple Tap', desc: '3 matches in 5 seconds' },
  { id: 'powerup3_game', name: 'Power Surge', desc: 'Use 3 power-ups in one game' },
  { id: 'combo_master_classic', name: 'Combo Purist', desc: 'x10 combo in Classic mode' },
  // Layout achievements: Dragon, Phoenix
  { id: 'dragon_win', name: 'Dragon Slayer', desc: 'Win on Dragon' },
  { id: 'phoenix_win', name: 'Phoenix Rising', desc: 'Win on Phoenix' },
  { id: 'all10_layouts', name: 'World Traveler', desc: 'Win on all 10 layouts' },
  // Tile skin achievements
  { id: 'skin_circuit', name: 'Wired Up', desc: 'Play with Circuit skin' },
  { id: 'skin_jade', name: 'Carved in Stone', desc: 'Play with Jade skin' },
  { id: 'all_skins', name: 'Fashionista Pro', desc: 'Try all tile skins' },
  // Combo announcer milestones
  { id: 'combo_great', name: 'Great Show', desc: 'Trigger a Great! combo' },
  { id: 'combo_legendary', name: 'Legend Status', desc: 'Trigger LEGENDARY! combo' },
  { id: 'combo_godlike', name: 'Ascended', desc: 'Trigger GODLIKE! combo' },
  // Volume milestone
  { id: 'matches200_game', name: 'Match Machine', desc: 'Match 200+ total' },
];

// ── Tile Skin Patterns ──────────────────────────────────────
export type TileSkin = 'default' | 'circuit' | 'jade';

export interface TileSkinDef {
  id: TileSkin;
  name: string;
  description: string;
  drawPattern: (ctx: CanvasRenderingContext2D, w: number, h: number, color: string) => void;
}

export const TILE_SKINS: TileSkinDef[] = [
  {
    id: 'default', name: 'Classic', description: 'Clean neon borders',
    drawPattern: (_ctx, _w, _h, _color) => {
      // Default: just border, done in the main texture fn
    },
  },
  {
    id: 'circuit', name: 'Circuit', description: 'PCB trace pattern',
    drawPattern: (ctx, w, h, color) => {
      ctx.strokeStyle = color + '33';
      ctx.lineWidth = 1;
      // Horizontal traces
      for (let y = 20; y < h; y += 18) {
        ctx.beginPath();
        ctx.moveTo(8, y);
        const midX = 30 + (y % 36 === 0 ? 20 : 0);
        ctx.lineTo(midX, y);
        ctx.lineTo(midX, y - 8);
        ctx.lineTo(midX + 15, y - 8);
        ctx.stroke();
      }
      // Vertical traces
      for (let x = 90; x < w; x += 22) {
        ctx.beginPath();
        ctx.moveTo(x, h - 8);
        ctx.lineTo(x, h - 35);
        ctx.lineTo(x + 10, h - 45);
        ctx.stroke();
      }
      // Nodes (small circles)
      ctx.fillStyle = color + '44';
      const nodes: [number,number][] = [[20,30],[100,20],[40,100],[90,90],[110,60]];
      for (const [nx,ny] of nodes) {
        ctx.beginPath();
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: 'jade', name: 'Jade Stone', description: 'Carved stone look',
    drawPattern: (ctx, w, h, color) => {
      // Inner frame (carved border effect)
      ctx.strokeStyle = color + '22';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      ctx.strokeRect(14, 14, w - 28, h - 28);
      // Corner ornaments
      const corners: [number,number,number][] = [[12,12,1],[w-12,12,1],[12,h-12,1],[w-12,h-12,1]];
      ctx.fillStyle = color + '33';
      for (const [cx,cy,s] of corners) {
        ctx.fillRect(cx - 3*s, cy - 3*s, 6*s, 6*s);
      }
      // Subtle texture dots
      ctx.fillStyle = color + '11';
      for (let i = 0; i < 20; i++) {
        const dx = 20 + (i * 37) % (w - 40);
        const dy = 30 + (i * 53) % (h - 60);
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
];

// ── Combo Announcer Labels ──────────────────────────────────
export const COMBO_LABELS: { minCombo: number; label: string; color: string }[] = [
  { minCombo: 3, label: 'Nice!', color: '#00ccff' },
  { minCombo: 4, label: 'Great!', color: '#00ff88' },
  { minCombo: 5, label: 'Awesome!', color: '#ffaa00' },
  { minCombo: 6, label: 'Amazing!', color: '#ff4466' },
  { minCombo: 7, label: 'Incredible!', color: '#ff44ff' },
  { minCombo: 8, label: 'LEGENDARY!', color: '#ffcc00' },
  { minCombo: 9, label: 'GODLIKE!', color: '#ff2222' },
  { minCombo: 10, label: 'UNSTOPPABLE!', color: '#ffffff' },
];

// ── Power-ups ───────────────────────────────────────────────
export type PowerUpType = 'freeze' | 'double' | 'reveal' | 'wildcard';

export interface PowerUpDef {
  id: PowerUpType;
  name: string;
  description: string;
  comboThreshold: number;  // combo level needed to earn
  duration: number;        // seconds (0 = instant/single-use)
  key: string;             // keyboard shortcut
}

export const POWERUPS: PowerUpDef[] = [
  { id: 'freeze', name: 'Freeze', description: 'Stop timer 15s', comboThreshold: 3, duration: 15, key: '1' },
  { id: 'double', name: '2x Points', description: 'Double score 30s', comboThreshold: 5, duration: 30, key: '2' },
  { id: 'reveal', name: 'Reveal', description: 'Show pairs 5s', comboThreshold: 7, duration: 5, key: '3' },
  { id: 'wildcard', name: 'Wildcard', description: 'Match any pair', comboThreshold: 10, duration: 0, key: '4' },
];

// ── Grade Calculation ───────────────────────────────────────
export interface GradeResult {
  grade: string;
  stars: number;
  efficiency: number;
}

export function calculateGrade(
  score: number,
  elapsedTime: number,
  hintsUsed: number,
  shufflesUsed: number,
  bestCombo: number,
  totalPairs: number,
  matchCount: number,
): GradeResult {
  const efficiency = totalPairs > 0 ? Math.round((matchCount / totalPairs) * 100) : 0;

  let points = 0;
  points += Math.min(score / 200, 40);
  points += Math.max(0, (300 - elapsedTime) / 10);
  points += Math.max(0, (5 - hintsUsed) * 3);
  points += Math.max(0, (3 - shufflesUsed) * 3);
  points += bestCombo * 1.5;

  let grade: string;
  let stars: number;
  if (points >= 80) { grade = 'S'; stars = 5; }
  else if (points >= 65) { grade = 'A'; stars = 4; }
  else if (points >= 50) { grade = 'B'; stars = 3; }
  else if (points >= 35) { grade = 'C'; stars = 2; }
  else { grade = 'D'; stars = 1; }

  return { grade, stars, efficiency };
}
