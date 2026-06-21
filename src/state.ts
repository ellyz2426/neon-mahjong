// Neon Mahjong VR - Game State Manager (Extended)

import {
  type TileType, TILE_TYPES, type TilePosition,
  type GameMode, GAME_MODES, LAYOUTS, ACHIEVEMENTS, CHALLENGES,
  type ThemeDef, THEMES, generateTileSet, type ChallengeDef,
  type Difficulty, DIFFICULTIES, calculateGrade, type GradeResult,
} from './data';

// ── Tile Instance ───────────────────────────────────────────
export interface TileInstance {
  idx: number;           // unique tile index (0-143)
  typeId: number;        // index into TILE_TYPES
  col: number;
  row: number;
  layer: number;
  removed: boolean;
  selected: boolean;
}

// ── Persistent Stats ────────────────────────────────────────
export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalMatches: number;
  bestScore: number;
  bestCombo: number;
  fastestWin: number;     // seconds, Infinity if none
  hintsUsed: number;
  shufflesUsed: number;
  totalTilesCleared: number;
  playTimeMinutes: number;
  xp: number;
  level: number;
  dailyWins: number;
  layoutWins: Set<string>;
  themesUsed: Set<string>;
  unlockedAchievements: Set<string>;
  leaderboard: { score: number; mode: string; date: string }[];
  winStreak: number;
  bestWinStreak: number;
  modesWon: Set<string>;
  challengesCompleted: Set<string>;
  hardWins: number;
  perModeStats: Map<string, { played: number; won: number; bestScore: number }>;
  perLayoutStats: Map<string, { played: number; won: number }>;
}

// ── Board State ─────────────────────────────────────────────
export interface BoardState {
  tiles: TileInstance[];
  mode: GameMode;
  layoutIdx: number;
  score: number;
  combo: number;
  bestCombo: number;
  matchCount: number;
  totalPairs: number;
  hintsUsed: number;
  shufflesUsed: number;
  elapsedTime: number;    // seconds
  timeRemaining: number;  // for timed modes
  gameOver: boolean;
  won: boolean;
  paused: boolean;
  undoStack: [number, number][]; // pairs of tile indices for undo
  challengeId: string | null;
  firstMatchDone: boolean;
  autoCompleted: boolean;
  difficulty: Difficulty;
  resumed: boolean;
}

// ── Seeded random for daily puzzles ─────────────────────────
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Game State ──────────────────────────────────────────────
export class GameState {
  board: BoardState | null = null;
  stats: PlayerStats;
  currentThemeIdx = 0;
  currentLayoutIdx = 0;
  currentDifficulty: Difficulty = 'normal';
  lastGrade: GradeResult | null = null;

  // Callbacks
  onMatch: ((a: TileInstance, b: TileInstance, score: number) => void) | null = null;
  onSelect: ((t: TileInstance) => void) | null = null;
  onDeselect: (() => void) | null = null;
  onGameOver: ((won: boolean) => void) | null = null;
  onAchievement: ((id: string) => void) | null = null;
  onBoardUpdate: (() => void) | null = null;
  onCombo: ((combo: number) => void) | null = null;
  onShuffle: (() => void) | null = null;
  onTimerUpdate: ((time: number) => void) | null = null;
  onAutoComplete: (() => void) | null = null;

  private lastMatchTime = 0;
  private comboTimeout = 3000; // ms

  constructor() {
    this.stats = this.loadStats();
  }

  private loadStats(): PlayerStats {
    try {
      const raw = localStorage.getItem('neon-mahjong-stats');
      if (raw) {
        const d = JSON.parse(raw);
        return {
          ...d,
          fastestWin: d.fastestWin ?? Infinity,
          layoutWins: new Set(d.layoutWins || []),
          themesUsed: new Set(d.themesUsed || []),
          unlockedAchievements: new Set(d.unlockedAchievements || []),
          leaderboard: d.leaderboard || [],
          winStreak: d.winStreak || 0,
          bestWinStreak: d.bestWinStreak || 0,
          modesWon: new Set(d.modesWon || []),
          challengesCompleted: new Set(d.challengesCompleted || []),
          hardWins: d.hardWins || 0,
          perModeStats: new Map(Object.entries(d.perModeStats || {})),
          perLayoutStats: new Map(Object.entries(d.perLayoutStats || {})),
        };
      }
    } catch { /* ignore */ }
    return {
      gamesPlayed: 0, gamesWon: 0, totalMatches: 0, bestScore: 0,
      bestCombo: 1, fastestWin: Infinity, hintsUsed: 0, shufflesUsed: 0,
      totalTilesCleared: 0, playTimeMinutes: 0, xp: 0, level: 1,
      dailyWins: 0, layoutWins: new Set(), themesUsed: new Set(),
      unlockedAchievements: new Set(), leaderboard: [],
      winStreak: 0, bestWinStreak: 0, modesWon: new Set(),
      challengesCompleted: new Set(),
      hardWins: 0,
      perModeStats: new Map(),
      perLayoutStats: new Map(),
    };
  }

  saveStats(): void {
    try {
      const d: Record<string, unknown> = {
        ...this.stats,
        layoutWins: [...this.stats.layoutWins],
        themesUsed: [...this.stats.themesUsed],
        unlockedAchievements: [...this.stats.unlockedAchievements],
        modesWon: [...this.stats.modesWon],
        challengesCompleted: [...this.stats.challengesCompleted],
        perModeStats: Object.fromEntries(this.stats.perModeStats),
        perLayoutStats: Object.fromEntries(this.stats.perLayoutStats),
      };
      localStorage.setItem('neon-mahjong-stats', JSON.stringify(d));
    } catch { /* ignore */ }
  }

  // ── Board Generation ──────────────────────────────────────
  startGame(mode: GameMode, layoutIdx: number, challengeId: string | null = null, difficulty: Difficulty = 'normal', resumed = false): void {
    const positions = LAYOUTS[layoutIdx].generate();
    const tileTypeIds = generateTileSet();
    const diffDef = DIFFICULTIES.find(d => d.id === difficulty)!;

    // For daily mode, use date-based seed
    let rng = Math.random;
    if (mode === 'daily') {
      const now = new Date();
      const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      rng = seededRandom(seed);
    }

    // Shuffle tile type assignments
    shuffle(tileTypeIds, rng);

    // Create tile instances
    const tiles: TileInstance[] = positions.map((pos, idx) => ({
      idx,
      typeId: tileTypeIds[idx],
      col: pos.col,
      row: pos.row,
      layer: pos.layer,
      removed: false,
      selected: false,
    }));

    const modeDef = GAME_MODES.find(m => m.id === mode)!;

    // Apply difficulty modifiers to hints and shuffles
    let hintsAllowed = modeDef.hintsAllowed;
    let shufflesAllowed = modeDef.shufflesAllowed;
    let timeLimit = modeDef.timeLimit;

    if (hintsAllowed > 0) hintsAllowed = Math.max(1, Math.round(hintsAllowed * diffDef.hintMod));
    if (shufflesAllowed > 0) shufflesAllowed = Math.max(1, Math.round(shufflesAllowed * diffDef.shuffleMod));
    if (timeLimit > 0) timeLimit = Math.round(timeLimit * diffDef.timeMod);

    // Apply challenge overrides
    if (challengeId) {
      const ch = CHALLENGES.find(c => c.id === challengeId);
      if (ch && ch.timeLimit > 0) timeLimit = ch.timeLimit;
    }

    this.board = {
      tiles,
      mode,
      layoutIdx,
      score: 0,
      combo: 1,
      bestCombo: 1,
      matchCount: 0,
      totalPairs: tiles.length / 2,
      hintsUsed: 0,
      shufflesUsed: 0,
      elapsedTime: 0,
      timeRemaining: timeLimit,
      gameOver: false,
      won: false,
      paused: false,
      undoStack: [],
      challengeId,
      firstMatchDone: false,
      autoCompleted: false,
      difficulty,
      resumed,
    };

    this.lastMatchTime = 0;
    this.currentLayoutIdx = layoutIdx;
    this.stats.gamesPlayed++;
    this.checkAchievement('play5', this.stats.gamesPlayed >= 5);
    this.checkAchievement('play10', this.stats.gamesPlayed >= 10);
    this.checkAchievement('play25', this.stats.gamesPlayed >= 25);
    this.checkAchievement('play50', this.stats.gamesPlayed >= 50);
    this.checkAchievement('play100', this.stats.gamesPlayed >= 100);
    this.saveStats();
  }

  // ── Free Tile Detection ───────────────────────────────────
  isTileFree(tile: TileInstance): boolean {
    if (tile.removed || !this.board) return false;
    const { tiles } = this.board;

    // Check if anything is on top
    const hasOnTop = tiles.some(t =>
      !t.removed && t !== tile &&
      t.layer === tile.layer + 1 &&
      Math.abs(t.col - tile.col) < 1 &&
      Math.abs(t.row - tile.row) < 1
    );
    if (hasOnTop) return false;

    // Check if both sides are blocked
    const blockedLeft = tiles.some(t =>
      !t.removed && t !== tile &&
      t.layer === tile.layer &&
      t.col === tile.col - 1 &&
      t.row === tile.row
    );
    const blockedRight = tiles.some(t =>
      !t.removed && t !== tile &&
      t.layer === tile.layer &&
      t.col === tile.col + 1 &&
      t.row === tile.row
    );

    return !(blockedLeft && blockedRight);
  }

  getFreeTiles(): TileInstance[] {
    if (!this.board) return [];
    return this.board.tiles.filter(t => !t.removed && this.isTileFree(t));
  }

  // ── Matching ──────────────────────────────────────────────
  canMatch(a: TileInstance, b: TileInstance): boolean {
    if (a.idx === b.idx || a.removed || b.removed) return false;
    const typeA = TILE_TYPES[a.typeId];
    const typeB = TILE_TYPES[b.typeId];
    return typeA.matchGroup === typeB.matchGroup;
  }

  selectTile(tileIdx: number): void {
    if (!this.board || this.board.gameOver || this.board.paused) return;
    const tile = this.board.tiles[tileIdx];
    if (!tile || tile.removed || !this.isTileFree(tile)) return;

    // Find currently selected
    const selected = this.board.tiles.find(t => t.selected && !t.removed);

    if (selected) {
      if (selected.idx === tileIdx) {
        // Deselect
        selected.selected = false;
        this.onDeselect?.();
        return;
      }
      if (this.canMatch(selected, tile)) {
        // Match!
        this.executeMatch(selected, tile);
      } else {
        // Different tile, deselect old and select new
        selected.selected = false;
        tile.selected = true;
        this.onSelect?.(tile);
      }
    } else {
      tile.selected = true;
      this.onSelect?.(tile);
    }
  }

  private executeMatch(a: TileInstance, b: TileInstance): void {
    if (!this.board) return;

    a.removed = true;
    b.removed = true;
    a.selected = false;
    b.selected = false;

    // Fast match check (within 2 sec of game start)
    if (!this.board.firstMatchDone) {
      this.board.firstMatchDone = true;
      if (this.board.elapsedTime < 2) {
        this.checkAchievement('fast_match', true);
      }
    }

    // Combo
    const now = performance.now();
    if (now - this.lastMatchTime < this.comboTimeout && this.lastMatchTime > 0) {
      this.board.combo = Math.min(this.board.combo + 1, 10);
    } else {
      this.board.combo = 1;
    }
    this.lastMatchTime = now;

    if (this.board.combo > this.board.bestCombo) {
      this.board.bestCombo = this.board.combo;
    }
    if (this.board.combo > this.stats.bestCombo) {
      this.stats.bestCombo = this.board.combo;
    }

    // Score
    const baseScore = 100;
    const comboBonus = this.board.combo;
    const speedBonus = this.board.mode === 'speed' ? 2 : 1;
    const diffMod = DIFFICULTIES.find(d => d.id === this.board!.difficulty)?.scoreMod ?? 1;
    const points = Math.round(baseScore * comboBonus * speedBonus * diffMod);
    this.board.score += points;
    this.board.matchCount++;
    this.board.undoStack.push([a.idx, b.idx]);

    // Score popup achievement
    if (points >= 1000) {
      this.checkAchievement('score_popup', true);
    }

    // Stats
    this.stats.totalMatches++;
    this.stats.totalTilesCleared += 2;

    this.onMatch?.(a, b, points);
    if (this.board.combo > 1) this.onCombo?.(this.board.combo);

    // Speed mode: add time
    if (this.board.mode === 'speed') {
      this.board.timeRemaining += 5;
    }

    // Check achievements
    this.checkMatchAchievements();

    // Check win
    const remaining = this.board.tiles.filter(t => !t.removed);
    if (remaining.length === 0) {
      this.winGame();
    } else {
      // Check if auto-complete available (6 or fewer tiles, all free, all matchable)
      this.checkAutoComplete();
      // Check if any moves available
      this.checkStaleMate();
    }

    this.onBoardUpdate?.();
  }

  // ── Auto-Complete ─────────────────────────────────────────
  private checkAutoComplete(): void {
    if (!this.board || this.board.gameOver) return;
    const remaining = this.board.tiles.filter(t => !t.removed);
    if (remaining.length > 8 || remaining.length <= 0) return;

    // All remaining must be free
    const allFree = remaining.every(t => this.isTileFree(t));
    if (!allFree) return;

    // All must have a match
    let allMatchable = true;
    const used = new Set<number>();
    for (let i = 0; i < remaining.length; i++) {
      if (used.has(i)) continue;
      let found = false;
      for (let j = i + 1; j < remaining.length; j++) {
        if (used.has(j)) continue;
        if (this.canMatch(remaining[i], remaining[j])) {
          used.add(i);
          used.add(j);
          found = true;
          break;
        }
      }
      if (!found) { allMatchable = false; break; }
    }

    if (allMatchable && used.size === remaining.length) {
      this.onAutoComplete?.();
    }
  }

  autoComplete(): void {
    if (!this.board || this.board.gameOver) return;
    const remaining = this.board.tiles.filter(t => !t.removed);
    this.board.autoCompleted = true;
    this.checkAchievement('auto_complete', true);

    // Match all remaining pairs with a delay animation
    const pairs: [TileInstance, TileInstance][] = [];
    const used = new Set<number>();
    for (let i = 0; i < remaining.length; i++) {
      if (used.has(remaining[i].idx)) continue;
      for (let j = i + 1; j < remaining.length; j++) {
        if (used.has(remaining[j].idx)) continue;
        if (this.canMatch(remaining[i], remaining[j])) {
          pairs.push([remaining[i], remaining[j]]);
          used.add(remaining[i].idx);
          used.add(remaining[j].idx);
          break;
        }
      }
    }

    // Execute each pair with slight delay
    pairs.forEach((pair, index) => {
      setTimeout(() => {
        if (this.board && !this.board.gameOver) {
          this.executeMatch(pair[0], pair[1]);
        }
      }, index * 400);
    });
  }

  undo(): boolean {
    if (!this.board || this.board.undoStack.length === 0 || this.board.gameOver) return false;
    const [aIdx, bIdx] = this.board.undoStack.pop()!;
    const a = this.board.tiles[aIdx];
    const b = this.board.tiles[bIdx];
    a.removed = false;
    b.removed = false;
    this.board.matchCount--;
    this.board.score = Math.max(0, this.board.score - 100);
    this.onBoardUpdate?.();
    return true;
  }

  private checkMatchAchievements(): void {
    if (!this.board) return;
    this.checkAchievement('first_match', true);
    this.checkAchievement('combo3', this.board.bestCombo >= 3);
    this.checkAchievement('combo5', this.board.bestCombo >= 5);
    this.checkAchievement('combo8', this.board.bestCombo >= 8);
    this.checkAchievement('combo10', this.board.bestCombo >= 10);
    this.checkAchievement('matches10', this.board.matchCount >= 10);
    this.checkAchievement('matches50', this.board.matchCount >= 50);
    this.checkAchievement('matches72', this.board.matchCount >= 72);
    this.checkAchievement('total100', this.stats.totalMatches >= 100);
    this.checkAchievement('total500', this.stats.totalMatches >= 500);
    this.checkAchievement('total1000', this.stats.totalMatches >= 1000);
    this.checkAchievement('score5k', this.board.score >= 5000);
    this.checkAchievement('score10k', this.board.score >= 10000);
    this.checkAchievement('score20k', this.board.score >= 20000);
    this.checkAchievement('score50k', this.board.score >= 50000);
    this.checkAchievement('total2000', this.stats.totalMatches >= 2000);
  }

  private winGame(): void {
    if (!this.board) return;
    this.board.gameOver = true;
    this.board.won = true;

    this.stats.gamesWon++;
    if (this.board.score > this.stats.bestScore) {
      this.stats.bestScore = this.board.score;
    }
    if (this.board.elapsedTime < this.stats.fastestWin) {
      this.stats.fastestWin = this.board.elapsedTime;
    }

    // Win streak
    this.stats.winStreak++;
    if (this.stats.winStreak > this.stats.bestWinStreak) {
      this.stats.bestWinStreak = this.stats.winStreak;
    }
    this.checkAchievement('streak3', this.stats.winStreak >= 3);
    this.checkAchievement('streak5', this.stats.winStreak >= 5);
    this.checkAchievement('streak10', this.stats.winStreak >= 10);

    // Grade calculation
    const gradeResult = calculateGrade(
      this.board.score, this.board.elapsedTime,
      this.board.hintsUsed, this.board.shufflesUsed,
      this.board.bestCombo, this.board.totalPairs,
      this.board.matchCount,
    );
    this.lastGrade = gradeResult;

    // Grade achievements
    this.checkAchievement('grade_a', gradeResult.grade === 'S' || gradeResult.grade === 'A');
    this.checkAchievement('grade_s', gradeResult.grade === 'S');
    if (gradeResult.grade === 'S') {
      this.checkAchievement('grade_s_hard', this.board.difficulty === 'hard');
      this.checkAchievement('grade_s_speed', this.board.mode === 'speed');
    }

    // New achievements
    this.checkAchievement('no_undo', this.board.undoStack.length === this.board.matchCount);
    this.checkAchievement('under_60', this.board.elapsedTime < 60);
    this.checkAchievement('score50k', this.board.score >= 50000);

    // XP (grade bonus)
    const gradeBonus = gradeResult.grade === 'S' ? 2 : gradeResult.grade === 'A' ? 1.5 : 1;
    const xpGain = Math.floor((this.board.score / 10 + 50) * gradeBonus);
    this.stats.xp += xpGain;
    this.stats.level = Math.floor(this.stats.xp / 200) + 1;

    // Layout wins
    const layoutName = LAYOUTS[this.board.layoutIdx].name.toLowerCase();
    this.stats.layoutWins.add(layoutName);

    // Modes won tracking
    this.stats.modesWon.add(this.board.mode);

    // Leaderboard
    this.stats.leaderboard.push({
      score: this.board.score,
      mode: this.board.mode,
      date: new Date().toISOString().slice(0, 10),
    });
    this.stats.leaderboard.sort((a, b) => b.score - a.score);
    if (this.stats.leaderboard.length > 10) {
      this.stats.leaderboard = this.stats.leaderboard.slice(0, 10);
    }

    // Achievements
    this.checkAchievement('first_win', true);
    this.checkAchievement('speed_demon', this.board.elapsedTime < 180);
    this.checkAchievement('lightning', this.board.elapsedTime < 120);
    this.checkAchievement('no_hints', this.board.hintsUsed === 0);
    this.checkAchievement('no_shuffle', this.board.shufflesUsed === 0);
    this.checkAchievement('purist', this.board.hintsUsed === 0 && this.board.shufflesUsed === 0);
    this.checkAchievement('win3', this.stats.gamesWon >= 3);
    this.checkAchievement('win10', this.stats.gamesWon >= 10);
    this.checkAchievement('win25', this.stats.gamesWon >= 25);
    this.checkAchievement('win50', this.stats.gamesWon >= 50);

    // Mode achievements
    if (this.board.mode === 'timed') {
      this.checkAchievement('timed_win', true);
      if (this.board.timeRemaining >= 60) {
        this.checkAchievement('perfect_timed', true);
      }
    }
    if (this.board.mode === 'speed') this.checkAchievement('speed_win', true);
    if (this.board.mode === 'daily') {
      this.checkAchievement('daily_win', true);
      this.stats.dailyWins++;
      this.checkAchievement('daily3', this.stats.dailyWins >= 3);
    }

    // Challenge completion
    if (this.board.challengeId) {
      const ch = CHALLENGES.find(c => c.id === this.board!.challengeId);
      if (ch) {
        const meetsScore = ch.targetScore === 0 || this.board.score >= ch.targetScore;
        const meetsCombo = ch.minCombo === 0 || this.board.bestCombo >= ch.minCombo;
        const meetsHints = ch.maxHints === -1 || this.board.hintsUsed <= ch.maxHints;
        if (meetsScore && meetsCombo && meetsHints) {
          this.stats.challengesCompleted.add(ch.id);
          this.checkAchievement('challenge_win', true);
          this.checkAchievement('challenge3', this.stats.challengesCompleted.size >= 3);
          this.checkAchievement('challenge_all', this.stats.challengesCompleted.size >= CHALLENGES.length);
        }
      }
    }

    // Layout achievements
    this.checkAchievement('fortress_win', this.stats.layoutWins.has('fortress'));
    this.checkAchievement('pyramid_win', this.stats.layoutWins.has('pyramid'));
    this.checkAchievement('tower_win', this.stats.layoutWins.has('tower'));
    this.checkAchievement('cross_win', this.stats.layoutWins.has('cross'));
    this.checkAchievement('diamond_win', this.stats.layoutWins.has('diamond'));
    this.checkAchievement('spiral_win', this.stats.layoutWins.has('spiral'));
    this.checkAchievement('butterfly_win', this.stats.layoutWins.has('butterfly'));
    this.checkAchievement('turtle_win', this.stats.layoutWins.has('turtle'));
    this.checkAchievement('all_layouts', this.stats.layoutWins.size >= LAYOUTS.length);
    this.checkAchievement('all8_layouts', this.stats.layoutWins.size >= 8);

    // All modes achievement
    const allModes: GameMode[] = ['classic', 'timed', 'zen', 'daily', 'speed', 'practice', 'challenge'];
    this.checkAchievement('all_modes', allModes.every(m => this.stats.modesWon.has(m)));

    // XP / level achievements
    this.checkAchievement('xp100', this.stats.xp >= 100);
    this.checkAchievement('xp500', this.stats.xp >= 500);
    this.checkAchievement('xp1000', this.stats.xp >= 1000);
    this.checkAchievement('level5', this.stats.level >= 5);
    this.checkAchievement('level10', this.stats.level >= 10);
    this.checkAchievement('level20', this.stats.level >= 20);

    // Difficulty achievements
    if (this.board.difficulty === 'hard') {
      this.stats.hardWins++;
      this.checkAchievement('hard_win', true);
      this.checkAchievement('hard_no_hint', this.board.hintsUsed === 0);
      this.checkAchievement('hard3', this.stats.hardWins >= 3);
      this.checkAchievement('hard10', this.stats.hardWins >= 10);
    }
    if (this.board.difficulty === 'easy') {
      this.checkAchievement('easy_win', true);
    }

    // Resume achievement
    if (this.board.resumed) {
      this.checkAchievement('resume_win', true);
    }

    // Tile clearing volume
    this.checkAchievement('tiles500', this.stats.totalTilesCleared >= 500);
    this.checkAchievement('tiles2000', this.stats.totalTilesCleared >= 2000);

    // Per-mode stats
    const modeKey = this.board.mode;
    const ms = this.stats.perModeStats.get(modeKey) || { played: 0, won: 0, bestScore: 0 };
    ms.played++;
    ms.won++;
    if (this.board.score > ms.bestScore) ms.bestScore = this.board.score;
    this.stats.perModeStats.set(modeKey, ms);

    // Per-layout stats
    const lk = layoutName;
    const ls = this.stats.perLayoutStats.get(lk) || { played: 0, won: 0 };
    ls.played++;
    ls.won++;
    this.stats.perLayoutStats.set(lk, ls);

    this.saveStats();
    this.onGameOver?.(true);
  }

  private checkStaleMate(): void {
    if (!this.board) return;
    const free = this.getFreeTiles();
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (this.canMatch(free[i], free[j])) return; // moves available
      }
    }
    // No moves - game over (loss)
    this.board.gameOver = true;
    this.board.won = false;
    this.stats.winStreak = 0; // Reset win streak on loss
    this.saveStats();
    this.onGameOver?.(false);
  }

  // ── Hints ─────────────────────────────────────────────────
  findHint(): [number, number] | null {
    if (!this.board) return null;
    const free = this.getFreeTiles();
    for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        if (this.canMatch(free[i], free[j])) {
          return [free[i].idx, free[j].idx];
        }
      }
    }
    return null;
  }

  useHint(): [number, number] | null {
    if (!this.board || this.board.gameOver) return null;
    const modeDef = GAME_MODES.find(m => m.id === this.board!.mode)!;

    // Check challenge hint limit
    if (this.board.challengeId) {
      const ch = CHALLENGES.find(c => c.id === this.board!.challengeId);
      if (ch && ch.maxHints >= 0 && this.board.hintsUsed >= ch.maxHints) return null;
    } else if (modeDef.hintsAllowed !== -1 && this.board.hintsUsed >= modeDef.hintsAllowed) {
      return null;
    }

    const hint = this.findHint();
    if (hint) {
      this.board.hintsUsed++;
      this.stats.hintsUsed++;
    }
    return hint;
  }

  // ── Shuffle ───────────────────────────────────────────────
  shuffleBoard(): boolean {
    if (!this.board || this.board.gameOver) return false;
    const modeDef = GAME_MODES.find(m => m.id === this.board!.mode)!;
    if (modeDef.shufflesAllowed !== -1 && this.board.shufflesUsed >= modeDef.shufflesAllowed) {
      return false;
    }

    const active = this.board.tiles.filter(t => !t.removed);
    const typeIds = active.map(t => t.typeId);
    shuffle(typeIds);
    active.forEach((t, i) => { t.typeId = typeIds[i]; });

    this.board.shufflesUsed++;
    this.stats.shufflesUsed++;

    // Deselect
    this.board.tiles.forEach(t => { t.selected = false; });
    this.onDeselect?.();
    this.onShuffle?.();
    this.onBoardUpdate?.();

    // Check stalemate after shuffle
    this.checkStaleMate();
    return true;
  }

  // ── Timer ─────────────────────────────────────────────────
  tick(dt: number): void {
    if (!this.board || this.board.gameOver || this.board.paused) return;

    this.board.elapsedTime += dt;

    // Track total play time (in minutes)
    this.stats.playTimeMinutes += dt / 60;
    this.checkAchievement('playtime30', this.stats.playTimeMinutes >= 30);
    this.checkAchievement('playtime120', this.stats.playTimeMinutes >= 120);

    // Zen mode play time achievement
    if (this.board.mode === 'zen' && this.board.elapsedTime >= 1800) {
      this.checkAchievement('zen_30min', true);
    }

    const modeDef = GAME_MODES.find(m => m.id === this.board!.mode)!;
    const hasTimeLimit = modeDef.timeLimit > 0 || (this.board.challengeId && this.board.timeRemaining > 0);
    if (hasTimeLimit) {
      this.board.timeRemaining -= dt;
      if (this.board.timeRemaining <= 0) {
        this.board.timeRemaining = 0;
        this.board.gameOver = true;
        this.board.won = false;
        this.stats.winStreak = 0;
        this.saveStats();
        this.onGameOver?.(false);
      }
    }

    this.onTimerUpdate?.(this.board.elapsedTime);
  }

  // ── Achievements ──────────────────────────────────────────
  private checkAchievement(id: string, condition: boolean): void {
    if (!condition || this.stats.unlockedAchievements.has(id)) return;
    this.stats.unlockedAchievements.add(id);
    this.onAchievement?.(id);
    this.saveStats();
  }

  // ── Save / Resume ─────────────────────────────────────────
  saveGame(): boolean {
    if (!this.board || this.board.gameOver) return false;
    try {
      const save = {
        tiles: this.board.tiles.map(t => ({
          idx: t.idx, typeId: t.typeId, col: t.col, row: t.row,
          layer: t.layer, removed: t.removed,
        })),
        mode: this.board.mode,
        layoutIdx: this.board.layoutIdx,
        score: this.board.score,
        combo: this.board.combo,
        bestCombo: this.board.bestCombo,
        matchCount: this.board.matchCount,
        totalPairs: this.board.totalPairs,
        hintsUsed: this.board.hintsUsed,
        shufflesUsed: this.board.shufflesUsed,
        elapsedTime: this.board.elapsedTime,
        timeRemaining: this.board.timeRemaining,
        challengeId: this.board.challengeId,
        difficulty: this.board.difficulty,
        undoStack: this.board.undoStack,
      };
      localStorage.setItem('neon-mahjong-save', JSON.stringify(save));
      return true;
    } catch { return false; }
  }

  hasSavedGame(): boolean {
    return localStorage.getItem('neon-mahjong-save') !== null;
  }

  resumeGame(): boolean {
    try {
      const raw = localStorage.getItem('neon-mahjong-save');
      if (!raw) return false;
      const save = JSON.parse(raw);

      const tiles: TileInstance[] = save.tiles.map((t: any) => ({
        ...t, selected: false,
      }));

      this.board = {
        tiles,
        mode: save.mode,
        layoutIdx: save.layoutIdx,
        score: save.score,
        combo: save.combo || 1,
        bestCombo: save.bestCombo || 1,
        matchCount: save.matchCount,
        totalPairs: save.totalPairs,
        hintsUsed: save.hintsUsed,
        shufflesUsed: save.shufflesUsed,
        elapsedTime: save.elapsedTime,
        timeRemaining: save.timeRemaining,
        gameOver: false,
        won: false,
        paused: false,
        undoStack: save.undoStack || [],
        challengeId: save.challengeId || null,
        firstMatchDone: true,
        autoCompleted: false,
        difficulty: save.difficulty || 'normal',
        resumed: true,
      };

      this.currentLayoutIdx = save.layoutIdx;
      localStorage.removeItem('neon-mahjong-save');
      return true;
    } catch {
      localStorage.removeItem('neon-mahjong-save');
      return false;
    }
  }

  clearSavedGame(): void {
    localStorage.removeItem('neon-mahjong-save');
  }

  // Theme tracking
  trackTheme(themeId: string): void {
    this.stats.themesUsed.add(themeId);
    this.checkAchievement('theme_change', true);
    this.checkAchievement('all_themes', this.stats.themesUsed.size >= THEMES.length);
    this.checkAchievement('all_themes_used', this.stats.themesUsed.size >= 8);
    this.saveStats();
  }

  // New feature achievement trackers
  trackFreeGlowUsed(): void {
    this.checkAchievement('free_glow', true);
    this.saveStats();
  }

  trackZoomUsed(): void {
    this.checkAchievement('zoom_user', true);
    this.saveStats();
  }

  // ── Format helpers ────────────────────────────────────────
  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
