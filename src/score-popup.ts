// Neon Mahjong VR - Floating Score Popups

import {
  Group,
  Mesh,
  MeshBasicMaterial,
  CanvasTexture,
  PlaneGeometry,
  Color,
  Object3D,
  DoubleSide,
} from '@iwsdk/core';

interface ScorePopup {
  mesh: Mesh;
  life: number;
  startY: number;
  speed: number;
}

const POPUP_GEO = new PlaneGeometry(0.2, 0.08);

export class ScorePopupSystem {
  private group: Group;
  private popups: ScorePopup[] = [];
  private pool: Mesh[] = [];
  private texCache = new Map<string, CanvasTexture>();

  constructor(parent: Object3D) {
    this.group = new Group();
    parent.add(this.group);
  }

  show(
    worldX: number,
    worldY: number,
    worldZ: number,
    text: string,
    color = '#00ffff',
    size = 1.0,
  ): void {
    const texture = this.getTexture(text, color);
    const mesh = this.getMesh();

    (mesh.material as MeshBasicMaterial).map = texture;
    (mesh.material as MeshBasicMaterial).opacity = 1;
    (mesh.material as MeshBasicMaterial).needsUpdate = true;

    const scale = 0.15 * size;
    mesh.scale.set(scale * 3, scale, 1);
    mesh.position.set(
      worldX + (Math.random() - 0.5) * 0.05,
      worldY + 0.1,
      worldZ,
    );
    mesh.visible = true;
    this.group.add(mesh);

    this.popups.push({
      mesh,
      life: 1.5,
      startY: worldY + 0.1,
      speed: 0.15 + Math.random() * 0.05,
    });
  }

  private getTexture(text: string, color: string): CanvasTexture {
    const key = `${text}|${color}`;
    if (this.texCache.has(key)) return this.texCache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 64);

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = color;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    ctx.shadowBlur = 0;

    const tex = new CanvasTexture(canvas);
    this.texCache.set(key, tex);
    return tex;
  }

  private getMesh(): Mesh {
    if (this.pool.length > 0) return this.pool.pop()!;

    const mat = new MeshBasicMaterial({
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: DoubleSide,
    });
    return new Mesh(POPUP_GEO, mat);
  }

  update(dt: number): void {
    const dead: number[] = [];

    for (let i = 0; i < this.popups.length; i++) {
      const p = this.popups[i];
      p.life -= dt;

      if (p.life <= 0) {
        dead.push(i);
        continue;
      }

      // Float upward
      p.mesh.position.y += p.speed * dt;

      // Fade out in last 0.5s
      if (p.life < 0.5) {
        const alpha = p.life / 0.5;
        (p.mesh.material as MeshBasicMaterial).opacity = alpha;
        // Scale up slightly while fading
        const s = p.mesh.scale.x;
        p.mesh.scale.set(s, p.mesh.scale.y * (1 + dt * 0.5), 1);
      }
    }

    for (let i = dead.length - 1; i >= 0; i--) {
      const idx = dead[i];
      const p = this.popups[idx];
      this.group.remove(p.mesh);
      p.mesh.visible = false;
      this.pool.push(p.mesh);
      this.popups.splice(idx, 1);
    }

    while (this.pool.length > 20) {
      const m = this.pool.pop()!;
      m.geometry.dispose();
      (m.material as MeshBasicMaterial).dispose();
    }
  }
}
