// Neon Mahjong VR - 3D Tile Renderer

import {
  World,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Group,
  Object3D,
  Color,
  CanvasTexture,
  PointLight,
  AmbientLight,
  FogExp2,
  GridHelper,
  PlaneGeometry,
  MeshBasicMaterial,
  LineBasicMaterial,
  BufferGeometry,
  Line,
  Float32BufferAttribute,
  Vector3,
  Raycaster,
  Camera,
} from '@iwsdk/core';
import { TileInstance, GameState } from './state';
import { TILE_TYPES, THEMES, type ThemeDef } from './data';

// Tile dimensions (meters)
const TILE_W = 0.12;
const TILE_H = 0.16;
const TILE_D = 0.06;
const TILE_GAP = 0.005;
const LAYER_OFFSET = TILE_D + 0.002;

// ── Canvas texture generation ───────────────────────────────
const textureCache = new Map<string, CanvasTexture>();

function createTileTexture(label: string, color: string, suit: string): CanvasTexture {
  const key = `${label}|${color}|${suit}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, 128, 128);

  // Border
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 120, 120);

  // Suit indicator (small text at top)
  ctx.fillStyle = color + '66';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  const suitLabel = suit === 'dot' ? 'DOT' : suit === 'bam' ? 'BAM' : suit === 'char' ? 'CHR'
    : suit === 'wind' ? 'WND' : suit === 'dragon' ? 'DRG'
    : suit === 'flower' ? 'FLR' : 'SZN';
  ctx.fillText(suitLabel, 64, 24);

  // Main symbol
  ctx.fillStyle = color;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 64, 72);

  // Glow effect
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fillText(label, 64, 72);
  ctx.shadowBlur = 0;

  const tex = new CanvasTexture(canvas);
  textureCache.set(key, tex);
  return tex;
}

// ── Renderer ────────────────────────────────────────────────
export class TileRenderer {
  private world: World;
  private state: GameState;
  private boardGroup: Group;
  private tileMeshes: Map<number, Mesh> = new Map();
  private selectedGlowMesh: Mesh | null = null;
  private hintMeshes: [Mesh, Mesh] | null = null;
  private currentTheme: ThemeDef;
  private raycaster: Raycaster;
  private floorGrid: GridHelper | null = null;
  private ambientLight: AmbientLight | null = null;
  private pointLights: PointLight[] = [];

  constructor(world: World, state: GameState) {
    this.world = world;
    this.state = state;
    this.boardGroup = new Group();
    this.currentTheme = THEMES[state.currentThemeIdx];
    this.raycaster = new Raycaster();
    this.setupScene();
  }

  private setupScene(): void {
    const scene = this.world.scene;

    // Background
    scene.background = new Color(this.currentTheme.bgColor);
    scene.fog = new FogExp2(this.currentTheme.fogColor, 0.04);

    // Ambient light
    this.ambientLight = new AmbientLight(this.currentTheme.ambientColor, 0.6);
    scene.add(this.ambientLight);

    // Point lights
    const createLight = (x: number, y: number, z: number, color: number, intensity: number) => {
      const light = new PointLight(color, intensity, 15);
      light.position.set(x, y, z);
      scene.add(light);
      this.pointLights.push(light);
      return light;
    };
    createLight(0, 3, 0, 0x00ccff, 2);
    createLight(-2, 2, -1, 0x0066ff, 1);
    createLight(2, 2, -1, 0x00ffcc, 1);

    // Floor grid
    this.floorGrid = new GridHelper(20, 40, this.currentTheme.gridColor, this.currentTheme.gridColor);
    this.floorGrid.position.y = -0.05;
    scene.add(this.floorGrid);

    // Board group
    this.boardGroup.position.set(0, 0.8, -1.5);
    scene.add(this.boardGroup);
  }

  // ── Board Rendering ───────────────────────────────────────
  buildBoard(): void {
    // Clear old tiles
    this.clearBoard();

    if (!this.state.board) return;

    const tiles = this.state.board.tiles;

    // Center the layout
    let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity;
    for (const t of tiles) {
      if (t.col < minC) minC = t.col;
      if (t.col > maxC) maxC = t.col;
      if (t.row < minR) minR = t.row;
      if (t.row > maxR) maxR = t.row;
    }
    const centerX = (minC + maxC) / 2;
    const centerY = (minR + maxR) / 2;

    for (const tile of tiles) {
      const mesh = this.createTileMesh(tile);
      const x = (tile.col - centerX) * (TILE_W + TILE_GAP);
      const y = tile.layer * LAYER_OFFSET;
      const z = -(tile.row - centerY) * (TILE_H + TILE_GAP);
      mesh.position.set(x, y, z);
      mesh.userData['tileIdx'] = tile.idx;
      this.boardGroup.add(mesh);
      this.tileMeshes.set(tile.idx, mesh);
    }
  }

  private createTileMesh(tile: TileInstance): Mesh {
    const tileType = TILE_TYPES[tile.typeId];
    const texture = createTileTexture(tileType.label, tileType.color, tileType.suit);

    const edgeColor = new Color(this.currentTheme.tileEdge);
    const baseColor = new Color(this.currentTheme.tileBase);

    // Top face: textured. Other faces: base color
    const topMat = new MeshStandardMaterial({
      map: texture,
      emissive: edgeColor,
      emissiveIntensity: 0.1,
      roughness: 0.4,
      metalness: 0.3,
    });
    const sideMat = new MeshStandardMaterial({
      color: baseColor,
      emissive: edgeColor,
      emissiveIntensity: 0.05,
      roughness: 0.5,
      metalness: 0.2,
    });
    const bottomMat = new MeshStandardMaterial({
      color: baseColor,
      roughness: 0.7,
      metalness: 0.1,
    });

    // Box: [+x, -x, +y, -y, +z, -z]
    const materials = [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat];

    const geo = new BoxGeometry(TILE_W, TILE_D, TILE_H);
    const mesh = new Mesh(geo, materials);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  clearBoard(): void {
    while (this.boardGroup.children.length > 0) {
      const child = this.boardGroup.children[0];
      this.boardGroup.remove(child);
      if (child instanceof Mesh) {
        child.geometry.dispose();
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(m => m.dispose());
      }
    }
    this.tileMeshes.clear();
  }

  // ── Tile Updates ──────────────────────────────────────────
  removeTile(idx: number): void {
    const mesh = this.tileMeshes.get(idx);
    if (!mesh) return;

    // Animate removal (scale down + fade)
    const startScale = mesh.scale.clone();
    const startY = mesh.position.y;
    const duration = 400;
    const start = performance.now();

    const animate = () => {
      const t = Math.min((performance.now() - start) / duration, 1);
      const ease = 1 - (1 - t) * (1 - t); // ease-out quad

      mesh.scale.setScalar(1 - ease);
      mesh.position.y = startY + ease * 0.2;
      mesh.rotation.y = ease * Math.PI;

      // Fade materials
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        if (m instanceof MeshStandardMaterial) {
          m.opacity = 1 - ease;
          m.transparent = true;
        }
      }

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        this.boardGroup.remove(mesh);
        mesh.geometry.dispose();
        const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        ms.forEach(m => m.dispose());
        this.tileMeshes.delete(idx);
      }
    };
    requestAnimationFrame(animate);
  }

  updateTileVisual(idx: number, tile: TileInstance): void {
    const mesh = this.tileMeshes.get(idx);
    if (!mesh) return;

    // Update texture for shuffle
    const tileType = TILE_TYPES[tile.typeId];
    const texture = createTileTexture(tileType.label, tileType.color, tileType.suit);
    const mats = mesh.material as MeshStandardMaterial[];
    if (mats[2]) {
      mats[2].map = texture;
      mats[2].needsUpdate = true;
    }
  }

  setTileSelected(idx: number, selected: boolean): void {
    const mesh = this.tileMeshes.get(idx);
    if (!mesh) return;

    const mats = mesh.material as MeshStandardMaterial[];
    const selectedColor = new Color(this.currentTheme.tileSelected);

    for (const m of mats) {
      if (selected) {
        m.emissive = selectedColor;
        m.emissiveIntensity = 0.6;
      } else {
        m.emissive = new Color(this.currentTheme.tileEdge);
        m.emissiveIntensity = m === mats[2] ? 0.1 : 0.05;
      }
    }

    // Scale feedback
    mesh.scale.setScalar(selected ? 1.1 : 1.0);
  }

  setTileHint(idx: number, highlight: boolean): void {
    const mesh = this.tileMeshes.get(idx);
    if (!mesh) return;

    const mats = mesh.material as MeshStandardMaterial[];
    for (const m of mats) {
      if (highlight) {
        m.emissive = new Color(0x00ff88);
        m.emissiveIntensity = 0.5;
      } else {
        m.emissive = new Color(this.currentTheme.tileEdge);
        m.emissiveIntensity = m === mats[2] ? 0.1 : 0.05;
      }
    }
  }

  clearHints(): void {
    if (!this.state.board) return;
    for (const tile of this.state.board.tiles) {
      if (!tile.removed) {
        this.setTileHint(tile.idx, false);
      }
    }
  }

  // ── Raycasting ────────────────────────────────────────────
  raycast(ndcX: number, ndcY: number, camera: Camera): number | null {
    this.raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, camera);
    const hits = this.raycaster.intersectObjects(this.boardGroup.children, false);
    for (const hit of hits) {
      const tileIdx = hit.object.userData['tileIdx'];
      if (tileIdx !== undefined) return tileIdx as number;
    }
    return null;
  }

  // ── Theme ─────────────────────────────────────────────────
  applyTheme(themeIdx: number): void {
    this.currentTheme = THEMES[themeIdx];
    const scene = this.world.scene;

    scene.background = new Color(this.currentTheme.bgColor);
    if (scene.fog instanceof FogExp2) {
      (scene.fog as FogExp2).color = new Color(this.currentTheme.fogColor);
    }
    if (this.ambientLight) {
      this.ambientLight.color = new Color(this.currentTheme.ambientColor);
    }
    if (this.floorGrid) {
      // Recreate grid
      scene.remove(this.floorGrid);
      this.floorGrid = new GridHelper(20, 40, this.currentTheme.gridColor, this.currentTheme.gridColor);
      this.floorGrid.position.y = -0.05;
      scene.add(this.floorGrid);
    }

    // Rebuild tile textures with new theme
    textureCache.clear();
    if (this.state.board) {
      this.buildBoard();
    }
  }

  // ── Refresh on shuffle ────────────────────────────────────
  refreshAllTiles(): void {
    if (!this.state.board) return;
    for (const tile of this.state.board.tiles) {
      if (!tile.removed) {
        this.updateTileVisual(tile.idx, tile);
      }
    }
  }

  // ── Cleanup ───────────────────────────────────────────────
  dispose(): void {
    this.clearBoard();
    textureCache.clear();
  }
}
