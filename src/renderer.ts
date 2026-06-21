// Neon Mahjong VR - 3D Tile Renderer (Round 4 - Enhanced)

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

// ── Tile entrance animation state ───────────────────────────
interface TileEntrance {
  mesh: Mesh;
  targetY: number;
  delay: number;
  elapsed: number;
  duration: number;
  done: boolean;
}

// ── Renderer ────────────────────────────────────────────────
export class TileRenderer {
  private world: World;
  private state: GameState;
  private boardGroup: Group;
  private tileMeshes: Map<number, Mesh> = new Map();
  private tilePositions: Map<number, Vector3> = new Map();
  private currentTheme: ThemeDef;
  private raycaster: Raycaster;
  private floorGrid: GridHelper | null = null;
  private ambientLight: AmbientLight | null = null;
  private pointLights: PointLight[] = [];

  // Board centering offsets
  private centerX = 0;
  private centerY = 0;

  // Entrance animation
  private entranceAnims: TileEntrance[] = [];
  private entranceActive = false;

  // Hover
  private hoveredIdx: number | null = null;

  // Free tile highlighting
  private freeTileGlow = false;
  private freeTileGlowPhase = 0;
  private freeTileSet = new Set<number>();

  // Camera zoom
  private zoomLevel = 1.0;
  private targetZoom = 1.0;

  // Board idle animation
  private boardTime = 0;

  // Ambient background particles
  private ambientParticles: { mesh: Mesh; velocity: Vector3; baseY: number }[] = [];

  // Match line effect
  private matchLines: { line: Line; life: number; maxLife: number }[] = [];

  constructor(world: World, state: GameState) {
    this.world = world;
    this.state = state;
    this.boardGroup = new Group();
    this.currentTheme = THEMES[state.currentThemeIdx];
    this.raycaster = new Raycaster();
    this.setupScene();
    this.setupZoom();
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

    // Ambient background particles
    this.createAmbientParticles();
  }

  private setupZoom(): void {
    const canvas = this.world.renderer.domElement;
    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      this.targetZoom = Math.max(0.5, Math.min(2.0, this.targetZoom - e.deltaY * 0.001));
    }, { passive: false });
  }

  // ── Board Rendering ───────────────────────────────────────
  buildBoard(animate = true): void {
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
    this.centerX = (minC + maxC) / 2;
    this.centerY = (minR + maxR) / 2;

    // Find max layer for staggered entrance
    let maxLayer = 0;
    for (const t of tiles) {
      if (t.layer > maxLayer) maxLayer = t.layer;
    }

    this.entranceAnims = [];
    this.entranceActive = animate;

    for (const tile of tiles) {
      if (tile.removed) continue;
      const mesh = this.createTileMesh(tile);
      const x = (tile.col - this.centerX) * (TILE_W + TILE_GAP);
      const y = tile.layer * LAYER_OFFSET;
      const z = -(tile.row - this.centerY) * (TILE_H + TILE_GAP);
      mesh.position.set(x, y, z);
      mesh.userData['tileIdx'] = tile.idx;
      this.boardGroup.add(mesh);
      this.tileMeshes.set(tile.idx, mesh);

      // Cache world position for particles
      this.tilePositions.set(tile.idx, new Vector3(
        this.boardGroup.position.x + x,
        this.boardGroup.position.y + y,
        this.boardGroup.position.z + z,
      ));

      // Entrance animation
      if (animate) {
        const delay = tile.layer * 0.15 + Math.random() * 0.1;
        mesh.position.y = y + 0.8; // Start above
        mesh.scale.setScalar(0.01);
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of mats) {
          if (m instanceof MeshStandardMaterial) {
            m.transparent = true;
            m.opacity = 0;
          }
        }
        this.entranceAnims.push({
          mesh,
          targetY: y,
          delay,
          elapsed: 0,
          duration: 0.4,
          done: false,
        });
      }
    }

    // Update free tiles
    this.updateFreeTileSet();
  }

  private createTileMesh(tile: TileInstance): Mesh {
    const tileType = TILE_TYPES[tile.typeId];
    const texture = createTileTexture(tileType.label, tileType.color, tileType.suit);

    const edgeColor = new Color(this.currentTheme.tileEdge);
    const baseColor = new Color(this.currentTheme.tileBase);

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
    this.tilePositions.clear();
    this.entranceAnims = [];
    this.entranceActive = false;
    this.freeTileSet.clear();
  }

  // ── Public accessors for particles ────────────────────────
  getTileWorldPos(idx: number): Vector3 | null {
    return this.tilePositions.get(idx) || null;
  }

  getThemeEdgeColor(): number {
    return this.currentTheme.tileEdge;
  }

  // ── Free tile highlighting ────────────────────────────────
  toggleFreeTileGlow(): boolean {
    this.freeTileGlow = !this.freeTileGlow;
    if (!this.freeTileGlow) {
      // Reset all tile emissives
      this.resetAllEmissives();
    }
    return this.freeTileGlow;
  }

  setFreeTileGlow(on: boolean): void {
    this.freeTileGlow = on;
    if (!on) this.resetAllEmissives();
  }

  isFreeTileGlowOn(): boolean {
    return this.freeTileGlow;
  }

  updateFreeTileSet(): void {
    this.freeTileSet.clear();
    if (!this.state.board) return;
    const free = this.state.getFreeTiles();
    for (const t of free) {
      this.freeTileSet.add(t.idx);
    }
  }

  private resetAllEmissives(): void {
    if (!this.state.board) return;
    for (const tile of this.state.board.tiles) {
      if (!tile.removed && !tile.selected) {
        const mesh = this.tileMeshes.get(tile.idx);
        if (mesh) {
          const mats = mesh.material as MeshStandardMaterial[];
          for (const m of mats) {
            m.emissive = new Color(this.currentTheme.tileEdge);
            m.emissiveIntensity = m === mats[2] ? 0.1 : 0.05;
          }
        }
      }
    }
  }

  // ── Hover ─────────────────────────────────────────────────
  setHovered(ndcX: number, ndcY: number, camera: Camera): void {
    const oldHover = this.hoveredIdx;
    this.raycaster.setFromCamera({ x: ndcX, y: ndcY } as any, camera);
    const hits = this.raycaster.intersectObjects(this.boardGroup.children, false);

    let newHover: number | null = null;
    for (const hit of hits) {
      const tileIdx = hit.object.userData['tileIdx'];
      if (tileIdx !== undefined) {
        // Only hover if tile is free
        if (this.state.board) {
          const tile = this.state.board.tiles[tileIdx];
          if (tile && !tile.removed && this.state.isTileFree(tile)) {
            newHover = tileIdx;
          }
        }
        break;
      }
    }

    if (newHover === oldHover) return;

    // Remove old hover effect
    if (oldHover !== null) {
      const mesh = this.tileMeshes.get(oldHover);
      if (mesh && this.state.board) {
        const tile = this.state.board.tiles[oldHover];
        if (tile && !tile.selected) {
          const mats = mesh.material as MeshStandardMaterial[];
          for (const m of mats) {
            m.emissive = new Color(this.currentTheme.tileEdge);
            m.emissiveIntensity = m === mats[2] ? 0.1 : 0.05;
          }
          mesh.scale.setScalar(1.0);
        }
      }
    }

    // Apply new hover effect
    if (newHover !== null) {
      const mesh = this.tileMeshes.get(newHover);
      if (mesh && this.state.board) {
        const tile = this.state.board.tiles[newHover];
        if (tile && !tile.selected) {
          const mats = mesh.material as MeshStandardMaterial[];
          const hoverColor = new Color(this.currentTheme.tileSelected);
          for (const m of mats) {
            m.emissive = hoverColor;
            m.emissiveIntensity = 0.3;
          }
          mesh.scale.setScalar(1.05);
        }
      }
    }

    this.hoveredIdx = newHover;
  }

  clearHover(): void {
    if (this.hoveredIdx !== null) {
      const mesh = this.tileMeshes.get(this.hoveredIdx);
      if (mesh && this.state.board) {
        const tile = this.state.board.tiles[this.hoveredIdx];
        if (tile && !tile.selected) {
          const mats = mesh.material as MeshStandardMaterial[];
          for (const m of mats) {
            m.emissive = new Color(this.currentTheme.tileEdge);
            m.emissiveIntensity = m === mats[2] ? 0.1 : 0.05;
          }
          mesh.scale.setScalar(1.0);
        }
      }
      this.hoveredIdx = null;
    }
  }

  // ── Tile Updates ──────────────────────────────────────────
  removeTile(idx: number): void {
    const mesh = this.tileMeshes.get(idx);
    if (!mesh) return;

    if (this.hoveredIdx === idx) this.hoveredIdx = null;

    const startY = mesh.position.y;
    const duration = 400;
    const start = performance.now();

    const animate = () => {
      const t = Math.min((performance.now() - start) / duration, 1);
      const ease = 1 - (1 - t) * (1 - t);

      mesh.scale.setScalar(1 - ease);
      mesh.position.y = startY + ease * 0.2;
      mesh.rotation.y = ease * Math.PI;

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

        // Update free tile set after removal
        this.updateFreeTileSet();
      }
    };
    requestAnimationFrame(animate);
  }

  updateTileVisual(idx: number, tile: TileInstance): void {
    const mesh = this.tileMeshes.get(idx);
    if (!mesh) return;

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
      scene.remove(this.floorGrid);
      this.floorGrid = new GridHelper(20, 40, this.currentTheme.gridColor, this.currentTheme.gridColor);
      this.floorGrid.position.y = -0.05;
      scene.add(this.floorGrid);
    }

    textureCache.clear();
    if (this.state.board) {
      this.buildBoard(false);
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
    this.updateFreeTileSet();
  }

  // ── Ambient Background Particles ────────────────────────────
  private createAmbientParticles(): void {
    const scene = this.world.scene;
    const particleGeo = new BoxGeometry(0.015, 0.015, 0.015);

    for (let i = 0; i < 30; i++) {
      const hue = Math.random();
      const color = new Color().setHSL(hue * 0.3 + 0.5, 0.8, 0.5); // cyan-purple range
      const mat = new MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.2 + Math.random() * 0.3,
        depthWrite: false,
      });
      const mesh = new Mesh(particleGeo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 6,
        Math.random() * 3,
        -1.5 + (Math.random() - 0.5) * 4,
      );
      mesh.scale.setScalar(0.3 + Math.random() * 0.7);
      scene.add(mesh);

      this.ambientParticles.push({
        mesh,
        velocity: new Vector3(
          (Math.random() - 0.5) * 0.02,
          0.01 + Math.random() * 0.02,
          (Math.random() - 0.5) * 0.01,
        ),
        baseY: mesh.position.y,
      });
    }
  }

  // ── Match Line Effect ─────────────────────────────────────
  showMatchLine(idxA: number, idxB: number): void {
    const posA = this.tilePositions.get(idxA);
    const posB = this.tilePositions.get(idxB);
    if (!posA || !posB) return;

    const points = new Float32BufferAttribute([
      posA.x, posA.y + 0.03, posA.z,
      posB.x, posB.y + 0.03, posB.z,
    ], 3);
    const geo = new BufferGeometry();
    geo.setAttribute('position', points);
    const mat = new LineBasicMaterial({
      color: this.currentTheme.tileEdge,
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
    });
    const line = new Line(geo, mat);
    this.world.scene.add(line);

    this.matchLines.push({ line, life: 0.6, maxLife: 0.6 });
  }

  // ── Per-frame update ──────────────────────────────────────
  updateAnimations(dt: number): void {
    // Entrance animations
    if (this.entranceActive) {
      let allDone = true;
      for (const anim of this.entranceAnims) {
        if (anim.done) continue;
        anim.elapsed += dt;
        if (anim.elapsed < anim.delay) {
          allDone = false;
          continue;
        }
        const t = Math.min((anim.elapsed - anim.delay) / anim.duration, 1);
        // Elastic ease-out
        const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t) * Math.cos((t * 10 - 0.75) * (2 * Math.PI / 3));

        anim.mesh.position.y = anim.targetY + (1 - ease) * 0.8;
        anim.mesh.scale.setScalar(ease);

        const mats = Array.isArray(anim.mesh.material) ? anim.mesh.material : [anim.mesh.material];
        for (const m of mats) {
          if (m instanceof MeshStandardMaterial) {
            m.opacity = ease;
          }
        }

        if (t >= 1) {
          anim.done = true;
          // Restore non-transparent
          for (const m of mats) {
            if (m instanceof MeshStandardMaterial) {
              m.transparent = false;
              m.opacity = 1;
            }
          }
        } else {
          allDone = false;
        }
      }
      if (allDone) {
        this.entranceActive = false;
        this.entranceAnims = [];
      }
    }

    // Free tile glow pulse
    if (this.freeTileGlow && this.state.board && !this.entranceActive) {
      this.freeTileGlowPhase += dt * 2.5;
      const pulse = 0.15 + Math.sin(this.freeTileGlowPhase) * 0.1;
      const glowColor = new Color(0x00ff88);

      for (const tile of this.state.board.tiles) {
        if (tile.removed || tile.selected) continue;
        const mesh = this.tileMeshes.get(tile.idx);
        if (!mesh) continue;

        const isFree = this.freeTileSet.has(tile.idx);
        if (isFree && this.hoveredIdx !== tile.idx) {
          const mats = mesh.material as MeshStandardMaterial[];
          for (const m of mats) {
            m.emissive = glowColor;
            m.emissiveIntensity = pulse;
          }
        }
      }
    }

    // Camera zoom smooth lerp
    if (Math.abs(this.zoomLevel - this.targetZoom) > 0.001) {
      this.zoomLevel += (this.targetZoom - this.zoomLevel) * 0.1;
      const basePos = new Vector3(0, 2.2, 1.0);
      const direction = new Vector3(0, -1.4, -2.5).normalize();
      const dist = basePos.distanceTo(new Vector3(0, 0.8, -1.5));
      const zoomedDist = dist / this.zoomLevel;
      const lookTarget = new Vector3(0, 0.8, -1.5);
      const zoomDir = new Vector3().subVectors(basePos, lookTarget).normalize();
      this.world.camera.position.copy(lookTarget).addScaledVector(zoomDir, zoomedDist);
      this.world.camera.lookAt(0, 0.8, -1.5);
    }

    // Board idle floating
    this.boardTime += dt;
    const floatY = Math.sin(this.boardTime * 0.5) * 0.005;
    this.boardGroup.position.y = 0.8 + floatY;

    // Ambient particle drift
    for (const p of this.ambientParticles) {
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;
      p.mesh.rotation.y += dt * 0.3;
      p.mesh.rotation.x += dt * 0.2;

      // Wrap particles when they drift too far
      if (p.mesh.position.y > 4) {
        p.mesh.position.y = -0.5;
        p.mesh.position.x = (Math.random() - 0.5) * 6;
      }
      if (Math.abs(p.mesh.position.x) > 4) {
        p.mesh.position.x = -Math.sign(p.mesh.position.x) * 3.5;
      }

      // Gentle sine-wave horizontal drift
      const sineOffset = Math.sin(this.boardTime * 0.3 + p.baseY * 2) * 0.002;
      p.mesh.position.x += sineOffset;
    }

    // Match line fade
    for (let i = this.matchLines.length - 1; i >= 0; i--) {
      const ml = this.matchLines[i];
      ml.life -= dt;
      if (ml.life <= 0) {
        this.world.scene.remove(ml.line);
        ml.line.geometry.dispose();
        (ml.line.material as LineBasicMaterial).dispose();
        this.matchLines.splice(i, 1);
      } else {
        const alpha = ml.life / ml.maxLife;
        (ml.line.material as LineBasicMaterial).opacity = alpha * 0.8;
      }
    }
  }

  // ── Zoom control ──────────────────────────────────────────
  zoomIn(): void {
    this.targetZoom = Math.min(2.0, this.targetZoom + 0.15);
  }

  zoomOut(): void {
    this.targetZoom = Math.max(0.5, this.targetZoom - 0.15);
  }

  resetZoom(): void {
    this.targetZoom = 1.0;
  }

  // ── Cleanup ───────────────────────────────────────────────
  dispose(): void {
    this.clearBoard();
    textureCache.clear();
  }
}
