// Neon Mahjong VR - Main Game System

import {
  createSystem,
  InputComponent,
} from '@iwsdk/core';
import { GameState } from '../state';
import { TileRenderer } from '../renderer';
import { AudioManager } from '../audio';
import { LAYOUTS, GAME_MODES, type GameMode } from '../data';

export type GameScreen = 'title' | 'modeselect' | 'layoutselect' | 'countdown'
  | 'playing' | 'pause' | 'gameover' | 'achievements' | 'stats'
  | 'settings' | 'skins' | 'help' | 'leaderboard' | 'tutorial';

export class GameSystem extends createSystem({}) {
  private _state!: GameState;
  private _renderer!: TileRenderer;
  private _audio!: AudioManager;

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
  private showTutorial = false;

  setRefs(refs: {
    state: GameState;
    tileRenderer: TileRenderer;
    audio: AudioManager;
  }): void {
    this._state = refs.state;
    this._renderer = refs.tileRenderer;
    this._audio = refs.audio;

    // Wire state callbacks
    this._state.onMatch = (a, b) => {
      this._renderer.removeTile(a.idx);
      this._renderer.removeTile(b.idx);
      this._audio.playMatch();
      this.clearHints();
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
    };
    this._state.onShuffle = () => {
      this._renderer.refreshAllTiles();
      this._audio.playShuffle();
    };
    this._state.onGameOver = (won) => {
      if (won) this._audio.playWin();
      else this._audio.playLose();
      this._audio.stopMusic();
      this._screen = 'gameover';
      this._onScreenChange?.('gameover');
    };
    this._state.onAchievement = (_id) => {
      this._audio.playAchievement();
    };

    // Mouse input for tile selection
    const canvas = this.world.renderer.domElement;
    canvas.addEventListener('click', (e: MouseEvent) => {
      this._audio.init();
      if (this._screen !== 'playing') return;
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

  // ── Screen Management ─────────────────────────────────────
  goTo(screen: GameScreen): void {
    this._screen = screen;
    this._onScreenChange?.(screen);
  }

  // ── Game Flow ─────────────────────────────────────────────
  startGameSetup(mode: GameMode): void {
    this.pendingMode = mode;
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
    this._state.startGame(this.pendingMode, this.pendingLayout);
    this._renderer.buildBoard();
    this._audio.startMusic();
    this.goTo('playing');
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
        this._renderer.buildBoard();
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

    // Thumbstick = rotate board
    if (this.stickCooldown <= 0) {
      const stick = rightPad.getAxesValues(InputComponent.Thumbstick);
      if (stick) {
        const { x } = stick;
        if (Math.abs(x) > 0.5) {
          const boardGroup = this._renderer['boardGroup'];
          if (boardGroup) {
            boardGroup.rotation.y += x > 0 ? 0.3 : -0.3;
          }
          this.stickCooldown = 0.25;
        }
      }
    }

    // Left grip = shuffle
    const leftPad = inputMgr.xr.gamepads.left;
    if (leftPad) {
      if (leftPad.getButtonDown(InputComponent.A_Button) && this.inputCooldown <= 0) {
        this.requestShuffle();
        this.inputCooldown = 0.3;
      }
    }
  }
}
