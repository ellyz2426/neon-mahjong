// Neon Mahjong VR - UI System (Extended)

import {
  createSystem,
  PanelUI,
  PanelDocument,
  UIKitDocument,
  UIKit,
  World,
  eq,
} from '@iwsdk/core';
import { GameState } from '../state';
import { GameSystem, type GameScreen } from './game-system';
import { AudioManager } from '../audio';
import { TileRenderer } from '../renderer';
import {
  TILE_TYPES, THEMES, LAYOUTS, GAME_MODES,
  ACHIEVEMENTS, CHALLENGES, type GameMode,
} from '../data';

function setText(doc: UIKitDocument | undefined | null, id: string, text: string): void {
  if (!doc) return;
  const el = doc.getElementById(id) as UIKit.Text | undefined;
  el?.setProperties({ text });
}

export class UISystem extends createSystem({
  titlePanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/title.json')],
  },
  hudPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/hud.json')],
  },
  modePanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/modeselect.json')],
  },
  layoutPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/layout.json')],
  },
  goPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/gameover.json')],
  },
  pausePanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/pause.json')],
  },
  achPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/achvlist.json')],
  },
  statsPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/stats.json')],
  },
  settingsPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/settings.json')],
  },
  skinsPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/skins.json')],
  },
  helpPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/help.json')],
  },
  lbPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/leaderboard.json')],
  },
  cdPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/countdown.json')],
  },
  toastPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/toast.json')],
  },
  tutPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/tutorial.json')],
  },
  challengePanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/challenge.json')],
  },
}) {
  private _state!: GameState;
  private _gameSystem!: GameSystem;
  private _audio!: AudioManager;
  private _tileRenderer!: TileRenderer;

  // Panel docs
  private titleDoc: UIKitDocument | null = null;
  private hudDoc: UIKitDocument | null = null;
  private modeDoc: UIKitDocument | null = null;
  private layoutDoc: UIKitDocument | null = null;
  private goDoc: UIKitDocument | null = null;
  private pauseDoc: UIKitDocument | null = null;
  private achDoc: UIKitDocument | null = null;
  private statsDoc: UIKitDocument | null = null;
  private settingsDoc: UIKitDocument | null = null;
  private skinsDoc: UIKitDocument | null = null;
  private helpDoc: UIKitDocument | null = null;
  private lbDoc: UIKitDocument | null = null;
  private cdDoc: UIKitDocument | null = null;
  private toastDoc: UIKitDocument | null = null;
  private tutDoc: UIKitDocument | null = null;
  private challengeDoc: UIKitDocument | null = null;

  // Panel entities
  private titleEntity: import('@iwsdk/core').Entity | null = null;
  private hudEntity: import('@iwsdk/core').Entity | null = null;
  private modeEntity: import('@iwsdk/core').Entity | null = null;
  private layoutEntity: import('@iwsdk/core').Entity | null = null;
  private goEntity: import('@iwsdk/core').Entity | null = null;
  private pauseEntity: import('@iwsdk/core').Entity | null = null;
  private achEntity: import('@iwsdk/core').Entity | null = null;
  private statsEntity: import('@iwsdk/core').Entity | null = null;
  private settingsEntity: import('@iwsdk/core').Entity | null = null;
  private skinsEntity: import('@iwsdk/core').Entity | null = null;
  private helpEntity: import('@iwsdk/core').Entity | null = null;
  private lbEntity: import('@iwsdk/core').Entity | null = null;
  private cdEntity: import('@iwsdk/core').Entity | null = null;
  private toastEntity: import('@iwsdk/core').Entity | null = null;
  private tutEntity: import('@iwsdk/core').Entity | null = null;
  private challengeEntity: import('@iwsdk/core').Entity | null = null;

  // State
  private achPage = 0;
  private toastTimer = 0;
  private currentScreen: GameScreen = 'title';
  private boundDocs = false;

  setRefs(refs: {
    state: GameState;
    gameSystem: GameSystem;
    audio: AudioManager;
    tileRenderer: TileRenderer;
  }): void {
    this._state = refs.state;
    this._gameSystem = refs.gameSystem;
    this._audio = refs.audio;
    this._tileRenderer = refs.tileRenderer;

    this._gameSystem.onScreenChange((screen) => {
      this.currentScreen = screen;
      this.updateVisibility();
      this.updateScreenContent(screen);
    });

    this._state.onAchievement = (id) => {
      this._audio.playAchievement();
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (ach) this.showToast(`Achievement: ${ach.name}`);
    };

    this._state.onTimerUpdate = () => {
      this.updateHUD();
    };
    this._state.onBoardUpdate = () => {
      this.updateHUD();
    };
    this._state.onCombo = (combo) => {
      this._audio.playCombo(combo);
      if (combo >= 3) this.showToast(`COMBO x${combo}!`);
    };

    this._gameSystem.setAutoCompleteReadyCallback(() => {
      this.showToast('Auto-complete ready! Press A');
    });
  }

  // ── Panel Binding ─────────────────────────────────────────
  private tryBindDocs(): void {
    if (this.boundDocs) return;

    const bindPanel = (
      query: string,
      setDoc: (doc: UIKitDocument) => void,
      setEntity: (e: import('@iwsdk/core').Entity) => void,
      setupFn?: (doc: UIKitDocument) => void,
    ) => {
      const q = (this as any)[query];
      if (!q) return;
      for (const entity of q) {
        const panelDoc = entity.get(PanelDocument);
        if (panelDoc?.document) {
          setDoc(panelDoc.document);
          setEntity(entity);
          if (setupFn) setupFn(panelDoc.document);
          return;
        }
      }
    };

    bindPanel('titlePanel',
      d => { this.titleDoc = d; }, e => { this.titleEntity = e; },
      d => this.setupTitle(d));
    bindPanel('hudPanel',
      d => { this.hudDoc = d; }, e => { this.hudEntity = e; });
    bindPanel('modePanel',
      d => { this.modeDoc = d; }, e => { this.modeEntity = e; },
      d => this.setupModeSelect(d));
    bindPanel('layoutPanel',
      d => { this.layoutDoc = d; }, e => { this.layoutEntity = e; },
      d => this.setupLayoutSelect(d));
    bindPanel('goPanel',
      d => { this.goDoc = d; }, e => { this.goEntity = e; },
      d => this.setupGameOver(d));
    bindPanel('pausePanel',
      d => { this.pauseDoc = d; }, e => { this.pauseEntity = e; },
      d => this.setupPause(d));
    bindPanel('achPanel',
      d => { this.achDoc = d; }, e => { this.achEntity = e; },
      d => this.setupAchievements(d));
    bindPanel('statsPanel',
      d => { this.statsDoc = d; }, e => { this.statsEntity = e; },
      d => this.setupStats(d));
    bindPanel('settingsPanel',
      d => { this.settingsDoc = d; }, e => { this.settingsEntity = e; },
      d => this.setupSettings(d));
    bindPanel('skinsPanel',
      d => { this.skinsDoc = d; }, e => { this.skinsEntity = e; },
      d => this.setupSkins(d));
    bindPanel('helpPanel',
      d => { this.helpDoc = d; }, e => { this.helpEntity = e; },
      d => this.setupHelp(d));
    bindPanel('lbPanel',
      d => { this.lbDoc = d; }, e => { this.lbEntity = e; },
      d => this.setupLeaderboard(d));
    bindPanel('cdPanel',
      d => { this.cdDoc = d; }, e => { this.cdEntity = e; });
    bindPanel('toastPanel',
      d => { this.toastDoc = d; }, e => { this.toastEntity = e; });
    bindPanel('tutPanel',
      d => { this.tutDoc = d; }, e => { this.tutEntity = e; },
      d => this.setupTutorial(d));
    bindPanel('challengePanel',
      d => { this.challengeDoc = d; }, e => { this.challengeEntity = e; },
      d => this.setupChallengeSelect(d));

    // Check if all main panels bound
    if (this.titleDoc && this.hudDoc) {
      this.boundDocs = true;
      this.updateVisibility();
      this.updateTitleScreen();
    }
  }

  // ── Button Handlers Setup ─────────────────────────────────
  private setupTitle(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-play', () => {
      this._audio.playClick();
      this._gameSystem.goTo('modeselect');
    });
    this.addClick(doc, 'btn-leaderboard', () => {
      this._audio.playClick();
      this.updateLeaderboard();
      this._gameSystem.goTo('leaderboard');
    });
    this.addClick(doc, 'btn-achievements', () => {
      this._audio.playClick();
      this.achPage = 0;
      this.updateAchievements();
      this._gameSystem.goTo('achievements');
    });
    this.addClick(doc, 'btn-stats', () => {
      this._audio.playClick();
      this.updateStats();
      this._gameSystem.goTo('stats');
    });
    this.addClick(doc, 'btn-skins', () => {
      this._audio.playClick();
      this.updateSkins();
      this._gameSystem.goTo('skins');
    });
    this.addClick(doc, 'btn-settings', () => {
      this._audio.playClick();
      this.updateSettings();
      this._gameSystem.goTo('settings');
    });
    this.addClick(doc, 'btn-help', () => {
      this._audio.playClick();
      this._gameSystem.goTo('help');
    });
  }

  private setupModeSelect(doc: UIKitDocument): void {
    const modes: [string, GameMode][] = [
      ['btn-classic', 'classic'], ['btn-timed', 'timed'], ['btn-zen', 'zen'],
      ['btn-daily', 'daily'], ['btn-speed', 'speed'], ['btn-practice', 'practice'],
      ['btn-challenge', 'challenge'],
    ];
    for (const [btn, mode] of modes) {
      this.addClick(doc, btn, () => {
        this._audio.playClick();
        this._gameSystem.startGameSetup(mode);
      });
    }
    this.addClick(doc, 'btn-mode-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('title');
    });
  }

  private setupLayoutSelect(doc: UIKitDocument): void {
    const layouts: [string, number][] = [
      ['btn-fortress', 0], ['btn-pyramid', 1], ['btn-tower', 2],
      ['btn-cross', 3], ['btn-diamond', 4], ['btn-spiral', 5],
    ];
    for (const [btn, idx] of layouts) {
      this.addClick(doc, btn, () => {
        this._audio.playClick();
        this._gameSystem.startWithLayout(idx);
      });
    }
    this.addClick(doc, 'btn-layout-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('modeselect');
    });
  }

  private setupChallengeSelect(doc: UIKitDocument): void {
    for (let i = 0; i < CHALLENGES.length; i++) {
      this.addClick(doc, `ch-${i}`, () => {
        this._audio.playClick();
        this._gameSystem.startChallengeSetup(CHALLENGES[i].id);
      });
    }
    this.addClick(doc, 'btn-ch-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('modeselect');
    });
  }

  private setupGameOver(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-rematch', () => {
      this._audio.playClick();
      this._gameSystem.beginCountdown();
    });
    this.addClick(doc, 'btn-go-menu', () => {
      this._audio.playClick();
      this.updateTitleScreen();
      this._gameSystem.goTo('title');
    });
  }

  private setupPause(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-resume', () => {
      this._audio.playClick();
      this._gameSystem.togglePause();
    });
    this.addClick(doc, 'btn-hint', () => {
      this._audio.playClick();
      this._gameSystem.togglePause();
      setTimeout(() => this._gameSystem.requestHint(), 100);
    });
    this.addClick(doc, 'btn-shuffle', () => {
      this._audio.playClick();
      this._gameSystem.togglePause();
      setTimeout(() => this._gameSystem.requestShuffle(), 100);
    });
    this.addClick(doc, 'btn-autocomplete', () => {
      this._audio.playClick();
      if (this._gameSystem.isAutoCompleteAvailable()) {
        this._gameSystem.togglePause();
        setTimeout(() => this._gameSystem.triggerAutoComplete(), 100);
      }
    });
    this.addClick(doc, 'btn-quit', () => {
      this._audio.playClick();
      this._audio.stopMusic();
      this._state.saveStats();
      this._tileRenderer.clearBoard();
      this.updateTitleScreen();
      this._gameSystem.goTo('title');
    });
  }

  private setupAchievements(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-ach-prev', () => {
      this._audio.playClick();
      if (this.achPage > 0) { this.achPage--; this.updateAchievements(); }
    });
    this.addClick(doc, 'btn-ach-next', () => {
      this._audio.playClick();
      const maxPage = Math.ceil(ACHIEVEMENTS.length / 15) - 1;
      if (this.achPage < maxPage) { this.achPage++; this.updateAchievements(); }
    });
    this.addClick(doc, 'btn-ach-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('title');
    });
  }

  private setupStats(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-stats-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('title');
    });
  }

  private setupSettings(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-master-down', () => {
      this._audio.masterVol = Math.max(0, this._audio.masterVol - 0.1);
      this._audio.updateVolumes();
      this.updateSettings();
    });
    this.addClick(doc, 'btn-master-up', () => {
      this._audio.masterVol = Math.min(1, this._audio.masterVol + 0.1);
      this._audio.updateVolumes();
      this.updateSettings();
    });
    this.addClick(doc, 'btn-sfx-down', () => {
      this._audio.sfxVol = Math.max(0, this._audio.sfxVol - 0.1);
      this._audio.updateVolumes();
      this.updateSettings();
    });
    this.addClick(doc, 'btn-sfx-up', () => {
      this._audio.sfxVol = Math.min(1, this._audio.sfxVol + 0.1);
      this._audio.updateVolumes();
      this.updateSettings();
    });
    this.addClick(doc, 'btn-music-down', () => {
      this._audio.musicVol = Math.max(0, this._audio.musicVol - 0.1);
      this._audio.updateVolumes();
      this.updateSettings();
    });
    this.addClick(doc, 'btn-music-up', () => {
      this._audio.musicVol = Math.min(1, this._audio.musicVol + 0.1);
      this._audio.updateVolumes();
      this.updateSettings();
    });
    this.addClick(doc, 'btn-theme-prev', () => {
      this._audio.playClick();
      this._state.currentThemeIdx = (this._state.currentThemeIdx - 1 + THEMES.length) % THEMES.length;
      this._tileRenderer.applyTheme(this._state.currentThemeIdx);
      this._state.trackTheme(THEMES[this._state.currentThemeIdx].id);
      this.updateSettings();
    });
    this.addClick(doc, 'btn-theme-next', () => {
      this._audio.playClick();
      this._state.currentThemeIdx = (this._state.currentThemeIdx + 1) % THEMES.length;
      this._tileRenderer.applyTheme(this._state.currentThemeIdx);
      this._state.trackTheme(THEMES[this._state.currentThemeIdx].id);
      this.updateSettings();
    });
    this.addClick(doc, 'btn-settings-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('title');
    });
  }

  private setupSkins(doc: UIKitDocument): void {
    for (let i = 0; i < THEMES.length; i++) {
      this.addClick(doc, `btn-skin-${i}`, () => {
        this._audio.playClick();
        this._state.currentThemeIdx = i;
        this._tileRenderer.applyTheme(i);
        this._state.trackTheme(THEMES[i].id);
        this.updateSkins();
      });
    }
    this.addClick(doc, 'btn-skins-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('title');
    });
  }

  private setupHelp(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-help-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('title');
    });
  }

  private setupLeaderboard(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-lb-back', () => {
      this._audio.playClick();
      this._gameSystem.goTo('title');
    });
  }

  private setupTutorial(doc: UIKitDocument): void {
    this.addClick(doc, 'btn-tut-ok', () => {
      this._audio.playClick();
      this._gameSystem.beginCountdown();
    });
  }

  // ── Click helper ──────────────────────────────────────────
  private addClick(doc: UIKitDocument, id: string, handler: () => void): void {
    const el = doc.getElementById(id);
    if (el) {
      el.addEventListener('click', handler);
    }
  }

  // ── Panel Visibility ──────────────────────────────────────
  private updateVisibility(): void {
    const map: [GameScreen, import('@iwsdk/core').Entity | null][] = [
      ['title', this.titleEntity],
      ['playing', this.hudEntity],
      ['modeselect', this.modeEntity],
      ['layoutselect', this.layoutEntity],
      ['gameover', this.goEntity],
      ['pause', this.pauseEntity],
      ['achievements', this.achEntity],
      ['stats', this.statsEntity],
      ['settings', this.settingsEntity],
      ['skins', this.skinsEntity],
      ['help', this.helpEntity],
      ['leaderboard', this.lbEntity],
      ['countdown', this.cdEntity],
      ['tutorial', this.tutEntity],
      ['challengeselect', this.challengeEntity],
    ];
    for (const [screen, entity] of map) {
      if (entity?.object3D) {
        entity.object3D.visible = this.currentScreen === screen;
      }
    }
  }

  // ── Content Updates ───────────────────────────────────────
  private updateScreenContent(screen: GameScreen): void {
    switch (screen) {
      case 'countdown':
        setText(this.cdDoc, 'cd-text', this._gameSystem.getCountdownValue().toString());
        break;
      case 'gameover':
        this.updateGameOver();
        break;
      case 'challengeselect':
        this.updateChallengeSelect();
        break;
      case 'pause':
        this.updatePauseMenu();
        break;
    }
  }

  private updateTitleScreen(): void {
    if (!this.titleDoc) return;
    const s = this._state.stats;
    setText(this.titleDoc, 'level-display', `Level ${s.level} - ${s.xp} XP`);
    setText(this.titleDoc, 'wins-display', `${s.gamesWon} wins | ${s.gamesPlayed} games`);
  }

  updateHUD(): void {
    if (!this.hudDoc || !this._state.board) return;
    const b = this._state.board;
    const modeDef = GAME_MODES.find(m => m.id === b.mode)!;

    setText(this.hudDoc, 'hud-score', `Score: ${b.score}`);
    setText(this.hudDoc, 'hud-combo', b.combo > 1 ? `x${b.combo}` : '');
    setText(this.hudDoc, 'hud-matches', `Matches: ${b.matchCount}/${b.totalPairs}`);
    const remaining = b.tiles.filter(t => !t.removed).length;
    setText(this.hudDoc, 'hud-tiles', `Tiles: ${remaining}`);

    const hasTimeLimit = modeDef.timeLimit > 0 || (b.challengeId && b.timeRemaining > 0);
    if (hasTimeLimit) {
      setText(this.hudDoc, 'hud-time', `Time: ${this._state.formatTime(b.timeRemaining)}`);
    } else {
      setText(this.hudDoc, 'hud-time', `Time: ${this._state.formatTime(b.elapsedTime)}`);
    }
    setText(this.hudDoc, 'hud-mode', b.challengeId ? 'Challenge' : modeDef.name);
    setText(this.hudDoc, 'hud-layout', LAYOUTS[b.layoutIdx].name);
  }

  private updateGameOver(): void {
    if (!this.goDoc || !this._state.board) return;
    const b = this._state.board;

    let title = b.won ? 'BOARD CLEARED!' : 'NO MOVES LEFT';

    // Challenge result
    if (b.challengeId && b.won) {
      const ch = CHALLENGES.find(c => c.id === b.challengeId);
      if (ch) {
        const meetsScore = ch.targetScore === 0 || b.score >= ch.targetScore;
        const meetsCombo = ch.minCombo === 0 || b.bestCombo >= ch.minCombo;
        const meetsHints = ch.maxHints === -1 || b.hintsUsed <= ch.maxHints;
        title = (meetsScore && meetsCombo && meetsHints) ? 'CHALLENGE COMPLETE!' : 'OBJECTIVE FAILED';
      }
    }

    setText(this.goDoc, 'go-title', title);
    setText(this.goDoc, 'go-score', `Score: ${b.score}`);
    setText(this.goDoc, 'go-matches', `Matches: ${b.matchCount}`);
    setText(this.goDoc, 'go-time', `Time: ${this._state.formatTime(b.elapsedTime)}`);
    setText(this.goDoc, 'go-combo', `Best Combo: x${b.bestCombo}`);
    setText(this.goDoc, 'go-hints', `Hints Used: ${b.hintsUsed}`);
    setText(this.goDoc, 'go-shuffles', `Shuffles: ${b.shufflesUsed}`);
    const xp = b.won ? Math.floor(b.score / 10) + 50 : 0;
    setText(this.goDoc, 'go-xp', `+${xp} XP`);

    // Win streak info
    if (b.won && this._state.stats.winStreak > 1) {
      setText(this.goDoc, 'go-shuffles', `Win Streak: ${this._state.stats.winStreak}`);
    }
  }

  private updateChallengeSelect(): void {
    if (!this.challengeDoc) return;
    const completed = this._state.stats.challengesCompleted;
    setText(this.challengeDoc, 'ch-progress', `${completed.size} / ${CHALLENGES.length} completed`);

    for (let i = 0; i < CHALLENGES.length; i++) {
      const ch = CHALLENGES[i];
      const done = completed.has(ch.id);
      const prefix = done ? '[DONE] ' : '';
      setText(this.challengeDoc, `ch-${i}`, `${prefix}${ch.name} - ${ch.description}`);
    }
  }

  private updatePauseMenu(): void {
    // Nothing special needed - auto-complete button click is handled in setup
  }

  private updateAchievements(): void {
    if (!this.achDoc) return;
    const perPage = 15;
    const total = ACHIEVEMENTS.length;
    const maxPage = Math.ceil(total / perPage) - 1;
    const start = this.achPage * perPage;
    const unlocked = this._state.stats.unlockedAchievements;

    setText(this.achDoc, 'ach-count', `${unlocked.size} / ${total}`);
    setText(this.achDoc, 'ach-page', `${this.achPage + 1}/${maxPage + 1}`);

    for (let i = 0; i < perPage; i++) {
      const idx = start + i;
      if (idx < total) {
        const a = ACHIEVEMENTS[idx];
        const done = unlocked.has(a.id);
        setText(this.achDoc, `ach-${i}`, `${done ? '[*]' : '[ ]'} ${a.name} - ${a.desc}`);
      } else {
        setText(this.achDoc, `ach-${i}`, '');
      }
    }
  }

  private updateStats(): void {
    if (!this.statsDoc) return;
    const s = this._state.stats;
    setText(this.statsDoc, 'stat-0', `Games Played: ${s.gamesPlayed}`);
    setText(this.statsDoc, 'stat-1', `Games Won: ${s.gamesWon}`);
    setText(this.statsDoc, 'stat-2', `Total Matches: ${s.totalMatches}`);
    setText(this.statsDoc, 'stat-3', `Best Score: ${s.bestScore}`);
    setText(this.statsDoc, 'stat-4', `Best Combo: x${s.bestCombo}`);
    setText(this.statsDoc, 'stat-5', `Fastest Win: ${s.fastestWin === Infinity ? '--:--' : this._state.formatTime(s.fastestWin)}`);
    setText(this.statsDoc, 'stat-6', `Hints Used: ${s.hintsUsed}`);
    setText(this.statsDoc, 'stat-7', `Shuffles Used: ${s.shufflesUsed}`);
    setText(this.statsDoc, 'stat-8', `Total Tiles Cleared: ${s.totalTilesCleared}`);
    setText(this.statsDoc, 'stat-9', `Win Streak: ${s.winStreak} (Best: ${s.bestWinStreak})`);
    setText(this.statsDoc, 'stat-10', `Level: ${s.level} (${s.xp} XP)`);
  }

  private updateSettings(): void {
    if (!this.settingsDoc) return;
    setText(this.settingsDoc, 'master-vol', Math.round(this._audio.masterVol * 100).toString());
    setText(this.settingsDoc, 'sfx-vol', Math.round(this._audio.sfxVol * 100).toString());
    setText(this.settingsDoc, 'music-vol', Math.round(this._audio.musicVol * 100).toString());
    setText(this.settingsDoc, 'theme-name', THEMES[this._state.currentThemeIdx].name);
  }

  private updateSkins(): void {
    if (!this.skinsDoc) return;
    for (let i = 0; i < THEMES.length; i++) {
      const equipped = i === this._state.currentThemeIdx;
      setText(this.skinsDoc, `btn-skin-${i}`,
        `${THEMES[i].name}${equipped ? ' [EQUIPPED]' : ''}`);
    }
  }

  private updateLeaderboard(): void {
    if (!this.lbDoc) return;
    const lb = this._state.stats.leaderboard;
    for (let i = 0; i < 10; i++) {
      if (i < lb.length) {
        setText(this.lbDoc, `lb-${i}`, `${i + 1}. ${lb[i].score} (${lb[i].mode}) ${lb[i].date}`);
      } else {
        setText(this.lbDoc, `lb-${i}`, `${i + 1}. ---`);
      }
    }
  }

  // ── Toast ─────────────────────────────────────────────────
  private showToast(text: string): void {
    if (!this.toastEntity?.object3D || !this.toastDoc) return;
    setText(this.toastDoc, 'toast-text', text);
    this.toastEntity.object3D.visible = true;
    this.toastTimer = 2.5;
  }

  // ── Update ────────────────────────────────────────────────
  update(delta: number, _time: number): void {
    if (!this.boundDocs) {
      this.tryBindDocs();
    }

    const dt = delta / 1000;

    // Update HUD every frame when playing
    if (this.currentScreen === 'playing') {
      this.updateHUD();
    }

    // Toast timer
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0 && this.toastEntity?.object3D) {
        this.toastEntity.object3D.visible = false;
      }
    }
  }
}
