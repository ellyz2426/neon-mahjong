// Neon Mahjong VR - Main Game System (Round 4 - Enhanced)

import {
  createSystem,
  InputComponent,
  Vector3,
} from '@iwsdk/core';
import { GameState } from '../state';
import { TileRenderer } from '../renderer';
import { AudioManager } from '../audio';
import { ParticleSystem } from '../particles';
import { ScorePopupSystem } from '../score-popup';
import { LAYOUTS, GAME_MODES, CHALLENGES, type GameMode, type ChallengeDef, type Difficulty, POWERUPS, type PowerUpType, COMBO_LABELS, type TileSkin } from '../data';

export type GameScreen = 'title' | 'modeselect' | 'layoutselect' | 'countdown'
  | 'playing' | 'pause' | 'gameover' | 'achievements' | 'stats'
  | 'settings' | 'skins' | 'help' | 'leaderboard' | 'tutorial' | 'challengeselect'
  | 'difficultyselect';

export class GameSystem extends createSystem({}) {
  private _state!: GameState;
  private _renderer!: TileRenderer;
  private _audio!: AudioManager;
  private _particles!: ParticleSystem;
  private _scorePopups!: ScorePopupSystem;

  _screen: GameScreen = 'title';
  private _onScreenChange: ((screen: GameScreen) => void) | null = null;

  // Input
  private inputCooldown = 0;
  private stickCooldown = 0;

  // Countdown
  private countdownValue = 3;
  private countdownTimer = 0;

  // Hint
  private hintPair: [number, number] | null = null;
  private hintTimer = 0;

  // Pending game start
  private pendingMode: GameMode = 'classic';
  private pendingLayout = 0;
  private pendingChallengeId: string | null = null;
  private showTutorial = false;

  // Auto-complete
  private autoCompleteAvailable = false;
  private onAutoCompleteReady: (() => void) | null = null;
  
  // Power-up callbacks
  private onPowerUpEarnedCb: ((type: PowerUpType) => void) | null = null;
  private onPowerUpActivatedCb: ((type: PowerUpType) => void) | null = null;
  private onPowerUpExpiredCb: ((type: PowerUpType) => void) | null = null;

  setRefs(refs: {
    state: GameState;
    tileRenderer: TileRenderer;
    audio: AudioManager;
  }): void {
    this._state = refs.state;
    this._renderer = refs.tileRenderer;
    this._audio = refs.audio;

    // Create particle and score popup systems
    this._particles = new ParticleSystem(this.world.scene);
    this._scorePopups = new ScorePopupSystem(this.world.scene);

    // Wire state callbacks
    this._state.onMatch = (a, b, score) => {
      // Show match line before removing tiles
      this._renderer.showMatchLine(a.idx, b.idx);
      this._renderer.removeTile(a.idx);
      this._renderer.removeTile(b.idx);
      this._audio.playMatch();
      this.clearHints();

      // Particle effects at match position
      const posA = this._renderer.getTileWorldPos(a.idx);
      const posB = this._renderer.getTileWorldPos(b.idx);
      if (posA) {
        this._particles.emitBurst(posA, 12, this._renderer.getThemeEdgeColor());
        this._scorePopups.show(posA.x, posA.y + 0.15, posA.z, `+${score}`, '#00ffff');
      }
      if (posB) {
        this._particles.emitBurst(posB, 12, this._renderer.getThemeEdgeColor());
      }
    };
    this._state.onSelect = (t) => {
      this._renderer.setTileSelected(t.idx, true);
      this._audio.playSelect();
    };
    this._state.onDeselect = () => {
      if (this._state.board) {
        for (const tile of this._state.board.tiles) {
          if (!tile.removed) this._renderer.setTileSelected(tile.idx, false);
        }
      }
      this._audio.playDeselect();
    };
    this._state.onCombo = (combo) => {
      this._audio.playCombo(combo);
      // Combo particle burst at board center
      const center = new Vector3(0, 1.2, -1.5);
      this._particles.emitCombo(center, combo);

      // Combo announcer — find matching label
      const labelDef = COMBO_LABELS.slice().reverse().find(l => combo >= l.minCombo);
      if (labelDef) {
        const pos = new Vector3(0, 1.5, -1.5);
        this._scorePopups.show(pos.x, pos.y, pos.z, labelDef.label, labelDef.color);
      }

      // Screen shake on big combos
      if (combo >= 5) {
        const intensity = Math.min(0.02 + (combo - 5) * 0.005, 0.06);
        this._renderer.triggerShake(intensity, 0.3);
      }

      // Track combo achievements
      this._state.trackComboLabel(combo);
    };
    this._state.onShuffle = () => {
      this._renderer.refreshAllTiles();
      this._audio.playShuffle();
    };
    this._state.onGameOver = (won) => {
      if (won) {
        this._audio.playWin();
        // Win celebration particles
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const x = (Math.random() - 0.5) * 1.5;
            const pos = new Vector3(x, 1.0 + Math.random() * 0.5, -1.5);
            this._particles.emitCombo(pos, 8);
          }, i * 200);
        }
      } else {
        this._audio.playLose();
      }
      this._audio.stopMusic();
      this.autoCompleteAvailable = false;
      this._renderer.setFreeTileGlow(false);
      this._screen = 'gameover';
      this._onScreenChange?.('gameover');
    };
    this._state.onAchievement = (_id) => {
      this._audio.playAchievement();
    };
    this._state.onAutoComplete = () => {
      this.autoCompleteAvailable = true;
      this.onAutoCompleteReady?.();
    };

    // Power-up callbacks
    this._state.onPowerUpEarned = (type) => {
      this._audio.playAchievement();
      this.onPowerUpEarnedCb?.(type);
    };
    this._state.onPowerUpActivated = (type) => {
      this._audio.playHint();
      this.onPowerUpActivatedCb?.(type);
    };
    this._state.onPowerUpExpired = (type) => {
      this._audio.playDeselect();
      this.onPowerUpExpiredCb?.(type);
    };
    this._state.onRevealPairs = (pairs) => {
      for (const [a, b] of pairs) {
        this._renderer.setTileHint(a, true);
        this._renderer.setTileHint(b, true);
      }
      // Clear after 5 seconds
      setTimeout(() => {
        for (const [a, b] of pairs) {
          this._renderer.setTileHint(a, false);
          this._renderer.setTileHint(b, false);
        }
      }, 5000);
    };

    // Mouse input for tile selection
    const canvas = this.world.renderer.domElement;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragMoved = false;

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragMoved = false;
    });

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      // Hover effect
      if (this._screen === 'playing' && !isDragging) {
        const rect = canvas.getBoundingClientRect();
        const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this._renderer.setHovered(ndcX, ndcY, this.world.camera);
      }

      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        dragMoved = true;
        const boardGroup = this._renderer['boardGroup'];
        if (boardGroup && this._screen === 'playing') {
          boardGroup.rotation.y += dx * 0.005;
        }
        dragStartX = e.clientX;
        dragStartY = e.clientY;
      }
    });

    canvas.addEventListener('mouseup', (_e: MouseEvent) => {
      isDragging = false;
    });

    canvas.addEventListener('click', (e: MouseEvent) => {
      this._audio.init();
      if (this._screen !== 'playing' || dragMoved) return;
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const hitIdx = this._renderer.raycast(ndcX, ndcY, this.world.camera);
      if (hitIdx !== null) {
        this._state.selectTile(hitIdx);
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this._audio.init();
      this.handleKeyDown(e.key.toLowerCase());
    });

    // Check if tutorial needed
    this.showTutorial = !localStorage.getItem('neon-mahjong-tutorial-done');
  }

  onScreenChange(cb: (screen: GameScreen) => void): void {
    this._onScreenChange = cb;
  }

  setAutoCompleteReadyCallback(cb: () => void): void {
    this.onAutoCompleteReady = cb;
  }

  // ── Screen Management ─────────────────────────────────────
  goTo(screen: GameScreen): void {
    this._screen = screen;
    this._onScreenChange?.(screen);
  }

  // ── Game Flow ─────────────────────────────────────────────
  startGameSetup(mode: GameMode): void {
    this.pendingMode = mode;
    this.pendingChallengeId = null;
    if (mode === 'challenge') {
      this.goTo('challengeselect');
    } else {
      this.goTo('difficultyselect');
    }
  }

  startChallengeSetup(challengeId: string): void {
    this.pendingMode = 'challenge';
    this.pendingChallengeId = challengeId;
    this.goTo('difficultyselect');
  }

  selectDifficulty(difficulty: Difficulty): void {
    this._state.currentDifficulty = difficulty;
    this.goTo('layoutselect');
  }

  startWithLayout(layoutIdx: number): void {
    this.pendingLayout = layoutIdx;
    if (this.showTutorial) {
      this.showTutorial = false;
      localStorage.setItem('neon-mahjong-tutorial-done', '1');
      this.goTo('tutorial');
      return;
    }
    this.beginCountdown();
  }

  beginCountdown(): void {
    this.countdownValue = 3;
    this.countdownTimer = 0;
    this.goTo('countdown');
    this._audio.playCountdown();
  }

  startGame(): void {
    this._state.startGame(this.pendingMode, this.pendingLayout, this.pendingChallengeId, this._state.currentDifficulty);
    this._renderer.buildBoard(true);
    this._renderer.resetZoom();
    this._audio.startMusic();
    this.autoCompleteAvailable = false;
    this.goTo('playing');
  }

  resumeGame(): boolean {
    if (!this._state.resumeGame()) return false;
    this._renderer.buildBoard(true);
    this._renderer.resetZoom();
    this._audio.startMusic();
    this.autoCompleteAvailable = false;
    this.goTo('playing');
    return true;
  }

  saveCurrentGame(): boolean {
    return this._state.saveGame();
  }

  hasSavedGame(): boolean {
    return this._state.hasSavedGame();
  }

  triggerAutoComplete(): void {
    if (this.autoCompleteAvailable && this._state.board && !this._state.board.gameOver) {
      this.autoCompleteAvailable = false;
      this._state.autoComplete();
    }
  }

  toggleFreeTileGlow(): boolean {
    const on = this._renderer.toggleFreeTileGlow();
    if (on) {
      this._audio.playHint();
    }
    return on;
  }

  isFreeTileGlowOn(): boolean {
    return this._renderer.isFreeTileGlowOn();
  }

  getCountdownValue(): number {
    return this.countdownValue;
  }

  getState(): GameState {
    return this._state;
  }

  getRenderer(): TileRenderer {
    return this._renderer;
  }

  getAudio(): AudioManager {
    return this._audio;
  }

  isAutoCompleteAvailable(): boolean {
    return this.autoCompleteAvailable;
  }

  // ── Power-ups ─────────────────────────────────────────────
  activatePowerUp(type: PowerUpType): boolean {
    return this._state.activatePowerUp(type);
  }

  setPowerUpCallbacks(
    onEarned: (type: PowerUpType) => void,
    onActivated: (type: PowerUpType) => void,
    onExpired: (type: PowerUpType) => void,
  ): void {
    this.onPowerUpEarnedCb = onEarned;
    this.onPowerUpActivatedCb = onActivated;
    this.onPowerUpExpiredCb = onExpired;
  }

  // ── Quick Play ────────────────────────────────────────────
  quickPlay(): void {
    const modes: GameMode[] = ['classic', 'timed', 'zen', 'speed'];
    const mode = modes[Math.floor(Math.random() * modes.length)];
    const layoutIdx = Math.floor(Math.random() * LAYOUTS.length);
    this.pendingMode = mode;
    this.pendingLayout = layoutIdx;
    this.pendingChallengeId = null;
    this._state.currentDifficulty = 'normal';
    this._state.trackQuickPlay();
    this.beginCountdown();
  }

  // ── Tile Skins ────────────────────────────────────────────
  setSkin(skin: TileSkin): void {
    this._renderer.setSkin(skin);
    this._state.trackSkin(skin);
  }

  getSkin(): TileSkin {
    return this._renderer.getSkin();
  }

  // ── Input ─────────────────────────────────────────────────
  private handleKeyDown(key: string): void {
    if (this._screen === 'playing') {
      if (key === 'escape' || key === 'p') {
        this.togglePause();
      } else if (key === 'h') {
        this.requestHint();
      } else if (key === 's') {
        this.requestShuffle();
      } else if (key === 'z') {
        this._state.undo();
        this._renderer.buildBoard(false);
      } else if (key === 'a' && this.autoCompleteAvailable) {
        this.triggerAutoComplete();
      } else if (key === 'f') {
        this.toggleFreeTileGlow();
      } else if (key === '+' || key === '=') {
        this._renderer.zoomIn();
      } else if (key === '-' || key === '_') {
        this._renderer.zoomOut();
      } else if (key === '0') {
        this._renderer.resetZoom();
      } else if (key === '1') {
        this.activatePowerUp('freeze');
      } else if (key === '2') {
        this.activatePowerUp('double');
      } else if (key === '3') {
        this.activatePowerUp('reveal');
      } else if (key === '4') {
        this.activatePowerUp('wildcard');
      }
    } else if (this._screen === 'pause') {
      if (key === 'escape' || key === 'p') {
        this.togglePause();
      }
    }
  }

  togglePause(): void {
    if (!this._state.board) return;
    if (this._screen === 'playing') {
      this._state.board.paused = true;
      this.goTo('pause');
    } else if (this._screen === 'pause') {
      this._state.board.paused = false;
      this.goTo('playing');
    }
  }

  requestHint(): void {
    this.clearHints();
    const hint = this._state.useHint();
    if (hint) {
      this.hintPair = hint;
      this.hintTimer = 3;
      this._renderer.setTileHint(hint[0], true);
      this._renderer.setTileHint(hint[1], true);
      this._audio.playHint();
    } else {
      this._audio.playInvalid();
    }
  }

  requestShuffle(): void {
    if (!this._state.shuffleBoard()) {
      this._audio.playInvalid();
    }
  }

  private clearHints(): void {
    if (this.hintPair) {
      this._renderer.setTileHint(this.hintPair[0], false);
      this._renderer.setTileHint(this.hintPair[1], false);
      this.hintPair = null;
    }
    this.hintTimer = 0;
  }

  // ── Update Loop ───────────────────────────────────────────
  update(delta: number, _time: number): void {
    const dt = delta / 1000;

    if (this.inputCooldown > 0) this.inputCooldown -= dt;
    if (this.stickCooldown > 0) this.stickCooldown -= dt;

    // XR input
    this.handleXRInput();

    if (this._screen === 'countdown') {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 1) {
        this.countdownTimer = 0;
        this.countdownValue--;
        if (this.countdownValue <= 0) {
          this._audio.playCountdownGo();
          this.startGame();
        } else {
          this._audio.playCountdown();
          this._onScreenChange?.('countdown');
        }
      }
    }

    if (this._screen === 'playing') {
      this._state.tick(dt);

      if (this.hintTimer > 0) {
        this.hintTimer -= dt;
        if (this.hintTimer <= 0) {
          this.clearHints();
        }
      }
    }

    // Update particles and score popups
    this._particles.update(dt);
    this._scorePopups.update(dt);

    // Update renderer animations (entrance, glow, zoom, idle)
    this._renderer.updateAnimations(dt);
  }

  private handleXRInput(): void {
    if (this._screen !== 'playing') return;

    const inputMgr = this.world.input as any;
    if (!inputMgr?.xr?.gamepads) return;

    const rightPad = inputMgr.xr.gamepads.right;
    if (!rightPad) return;

    // A button = hint
    if (rightPad.getButtonDown(InputComponent.A_Button) && this.inputCooldown <= 0) {
      this.requestHint();
      this.inputCooldown = 0.3;
    }

    // B button = pause
    if (rightPad.getButtonDown(InputComponent.B_Button) && this.inputCooldown <= 0) {
      this.togglePause();
      this.inputCooldown = 0.3;
    }

    // Right thumbstick X = rotate board, Y = zoom
    if (this.stickCooldown <= 0) {
      const stick = rightPad.getAxesValues(InputComponent.Thumbstick);
      if (stick) {
        const { x, y } = stick;
        if (Math.abs(x) > 0.5) {
          const boardGroup = this._renderer['boardGroup'];
          if (boardGroup) {
            boardGroup.rotation.y += x > 0 ? 0.3 : -0.3;
          }
          this.stickCooldown = 0.25;
        }
        if (Math.abs(y) > 0.5) {
          if (y > 0) this._renderer.zoomIn();
          else this._renderer.zoomOut();
          this.stickCooldown = 0.25;
        }
      }
    }

    // Left pad
    const leftPad = inputMgr.xr.gamepads.left;
    if (leftPad) {
      // Left A = shuffle
      if (leftPad.getButtonDown(InputComponent.A_Button) && this.inputCooldown <= 0) {
        this.requestShuffle();
        this.inputCooldown = 0.3;
      }
      // Left B = toggle free tile glow
      if (leftPad.getButtonDown(InputComponent.B_Button) && this.inputCooldown <= 0) {
        if (this.autoCompleteAvailable) {
          this.triggerAutoComplete();
        } else {
          this.toggleFreeTileGlow();
        }
        this.inputCooldown = 0.3;
      }
    }
  }
}
