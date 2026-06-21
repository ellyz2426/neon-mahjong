// Neon Mahjong VR - Entry Point

import {
  World,
  PanelUI,
} from '@iwsdk/core';
import { GameState } from './state';
import { TileRenderer } from './renderer';
import { AudioManager } from './audio';
import { GameSystem } from './systems/game-system';
import { UISystem } from './systems/ui-system';

async function main(): Promise<void> {
  const container = document.getElementById('app') as HTMLDivElement;

  const world = await World.create(container, {
    xr: { offer: 'once' },
    browserControls: true,
  } as Parameters<typeof World.create>[1]);

  // Camera position - looking at the board
  world.camera.position.set(0, 2.2, 1.0);
  world.camera.lookAt(0, 0.8, -1.5);

  // Core managers
  const state = new GameState();
  const audio = new AudioManager();
  const tileRenderer = new TileRenderer(world, state);

  // Register ECS systems
  world.registerSystem(GameSystem);
  world.registerSystem(UISystem);

  const gameSystem = world.getSystem(GameSystem) as unknown as GameSystem;
  gameSystem.setRefs({ state, tileRenderer, audio });

  const uiSystem = world.getSystem(UISystem) as unknown as UISystem;
  uiSystem.setRefs({ state, gameSystem, audio, tileRenderer });

  // Create panels
  createPanels(world);

  // Init audio on first interaction
  const initAudio = () => audio.init();
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { once: true });
}

function createPanels(world: World): void {
  const panelConfigs: { name: string; y: number; visible: boolean }[] = [
    { name: 'title', y: 1.1, visible: true },
    { name: 'hud', y: 1.8, visible: false },
    { name: 'modeselect', y: 1.1, visible: false },
    { name: 'layout', y: 1.1, visible: false },
    { name: 'gameover', y: 1.1, visible: false },
    { name: 'pause', y: 1.1, visible: false },
    { name: 'achvlist', y: 1.0, visible: false },
    { name: 'stats', y: 1.1, visible: false },
    { name: 'settings', y: 1.1, visible: false },
    { name: 'skins', y: 1.1, visible: false },
    { name: 'help', y: 1.0, visible: false },
    { name: 'leaderboard', y: 1.0, visible: false },
    { name: 'countdown', y: 1.4, visible: false },
    { name: 'toast', y: 2.1, visible: false },
    { name: 'tutorial', y: 1.1, visible: false },
  ];

  for (const cfg of panelConfigs) {
    const entity = world.createTransformEntity();
    entity.object3D!.position.set(0, cfg.y, -1.5);
    entity.addComponent(PanelUI, { config: `./ui/${cfg.name}.json` });
    entity.object3D!.visible = cfg.visible;
  }
}

main().catch(console.error);
