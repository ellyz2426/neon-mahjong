// Neon Mahjong VR - Particle System for match effects

import {
  Group,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  BoxGeometry,
  Color,
  Vector3,
  Object3D,
} from '@iwsdk/core';

interface Particle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  fadeStart: number;
  rotSpeed: Vector3;
}

const PARTICLE_GEO_SPHERE = new SphereGeometry(0.008, 4, 4);
const PARTICLE_GEO_BOX = new BoxGeometry(0.01, 0.01, 0.01);

export class ParticleSystem {
  private group: Group;
  private particles: Particle[] = [];
  private pool: Mesh[] = [];

  constructor(parent: Object3D) {
    this.group = new Group();
    parent.add(this.group);
  }

  // Emit burst of particles at world position
  emitBurst(
    worldPos: Vector3,
    count: number,
    color: number | string,
    speed = 0.8,
    life = 0.8,
  ): void {
    const c = new Color(color);

    for (let i = 0; i < count; i++) {
      const mesh = this.getMesh(c, i % 2 === 0);

      // Random direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const sp = speed * (0.3 + Math.random() * 0.7);
      const vx = Math.sin(phi) * Math.cos(theta) * sp;
      const vy = Math.cos(phi) * sp * 0.5 + speed * 0.3;
      const vz = Math.sin(phi) * Math.sin(theta) * sp;

      mesh.position.copy(worldPos);
      mesh.scale.setScalar(0.5 + Math.random() * 1.0);
      mesh.visible = true;
      this.group.add(mesh);

      const maxLife = life * (0.5 + Math.random() * 0.5);
      this.particles.push({
        mesh,
        velocity: new Vector3(vx, vy, vz),
        life: maxLife,
        maxLife,
        fadeStart: maxLife * 0.4,
        rotSpeed: new Vector3(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 8,
        ),
      });
    }
  }

  // Emit combo celebration (bigger burst)
  emitCombo(worldPos: Vector3, comboLevel: number): void {
    const colors = [0x00ffff, 0x00ff88, 0xff44ff, 0xffaa00, 0xff4466];
    const count = Math.min(comboLevel * 8, 60);
    const speed = 0.6 + comboLevel * 0.15;
    const life = 0.8 + comboLevel * 0.1;

    for (let i = 0; i < count; i++) {
      const color = colors[i % colors.length];
      this.emitBurst(worldPos, 1, color, speed, life);
    }
  }

  // Score popup effect - ring of particles
  emitScoreRing(worldPos: Vector3, color: number): void {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const mesh = this.getMesh(new Color(color), true);
      mesh.position.copy(worldPos);
      mesh.scale.setScalar(0.6);
      mesh.visible = true;
      this.group.add(mesh);

      this.particles.push({
        mesh,
        velocity: new Vector3(
          Math.cos(angle) * 0.5,
          0.3,
          Math.sin(angle) * 0.5,
        ),
        life: 0.6,
        maxLife: 0.6,
        fadeStart: 0.3,
        rotSpeed: new Vector3(0, 4, 0),
      });
    }
  }

  private getMesh(color: Color, box: boolean): Mesh {
    // Reuse from pool if possible
    if (this.pool.length > 0) {
      const m = this.pool.pop()!;
      (m.material as MeshBasicMaterial).color.copy(color);
      (m.material as MeshBasicMaterial).opacity = 1;
      return m;
    }

    const mat = new MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
    return new Mesh(box ? PARTICLE_GEO_BOX : PARTICLE_GEO_SPHERE, mat);
  }

  update(dt: number): void {
    const gravity = -1.5;
    const dead: number[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        dead.push(i);
        continue;
      }

      // Physics
      p.velocity.y += gravity * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      // Rotation
      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      // Fade
      if (p.life < p.fadeStart) {
        const alpha = p.life / p.fadeStart;
        (p.mesh.material as MeshBasicMaterial).opacity = alpha;
        p.mesh.scale.setScalar(alpha * 0.8 + 0.2);
      }
    }

    // Remove dead particles
    for (let i = dead.length - 1; i >= 0; i--) {
      const idx = dead[i];
      const p = this.particles[idx];
      this.group.remove(p.mesh);
      p.mesh.visible = false;
      this.pool.push(p.mesh);
      this.particles.splice(idx, 1);
    }

    // Cap pool size
    while (this.pool.length > 100) {
      const m = this.pool.pop()!;
      m.geometry.dispose();
      (m.material as MeshBasicMaterial).dispose();
    }
  }

  get activeCount(): number {
    return this.particles.length;
  }
}
