// Aruna Bay — effects: a small particle pool (muzzle flash, tire smoke,
// impact sparks) built from THREE.Points so it costs almost nothing.

import * as THREE from 'three';
import { makeGlowTexture } from './textures.js';

const MAX_PARTICLES = 400;

export function createEffects(scene) {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(MAX_PARTICLES * 3);
  const colors = new Float32Array(MAX_PARTICLES * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.7,
    map: makeGlowTexture(),
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);
  const particles = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    particles.push({ alive: false, x: 0, y: -100, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, r: 1, g: 1, b: 1 });
  }
  return { points, particles, cursor: 0 };
}

function spawn(effects, x, y, z, vx, vy, vz, life, r, g, b) {
  const p = effects.particles[effects.cursor];
  effects.cursor = (effects.cursor + 1) % MAX_PARTICLES;
  p.alive = true;
  p.x = x; p.y = y; p.z = z;
  p.vx = vx; p.vy = vy; p.vz = vz;
  p.life = life; p.maxLife = life;
  p.r = r; p.g = g; p.b = b;
}

export function burstSparks(effects, pos, count = 14) {
  for (let i = 0; i < count; i++) {
    spawn(effects, pos.x, pos.y, pos.z,
      (Math.random() - 0.5) * 10, Math.random() * 6 + 2, (Math.random() - 0.5) * 10,
      0.4 + Math.random() * 0.3, 1, 0.75, 0.25);
  }
}

export function burstSmoke(effects, pos) {
  spawn(effects, pos.x, pos.y + 0.3, pos.z,
    (Math.random() - 0.5) * 1.5, 1.2, (Math.random() - 0.5) * 1.5,
    0.9, 0.55, 0.55, 0.55);
}

export function burstMuzzle(effects, pos, dir) {
  for (let i = 0; i < 8; i++) {
    spawn(effects, pos.x, pos.y, pos.z,
      dir.x * 12 + (Math.random() - 0.5) * 4,
      dir.y * 12 + (Math.random() - 0.5) * 4,
      dir.z * 12 + (Math.random() - 0.5) * 4,
      0.12, 1, 0.85, 0.3);
  }
}

// A short celebratory burst for mission completion.
export function burstConfetti(effects, pos) {
  const colors = [[1, 0.85, 0.3], [1, 0.3, 0.6], [0.3, 0.9, 1], [0.5, 1, 0.4]];
  for (let i = 0; i < 40; i++) {
    const c = colors[i % colors.length];
    spawn(effects, pos.x, pos.y + 2, pos.z,
      (Math.random() - 0.5) * 8, Math.random() * 8 + 3, (Math.random() - 0.5) * 8,
      1.2 + Math.random() * 0.6, c[0], c[1], c[2]);
  }
}

export function updateEffects(effects, dt) {
  const posAttr = effects.points.geometry.attributes.position;
  const colAttr = effects.points.geometry.attributes.color;
  for (let i = 0; i < MAX_PARTICLES; i++) {
    const p = effects.particles[i];
    if (!p.alive) {
      posAttr.setXYZ(i, 0, -100, 0);
      colAttr.setXYZ(i, 0, 0, 0);
      continue;
    }
    p.life -= dt;
    if (p.life <= 0) {
      p.alive = false;
      posAttr.setXYZ(i, 0, -100, 0);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vy -= 4 * dt;
    const fade = p.life / p.maxLife;
    posAttr.setXYZ(i, p.x, p.y, p.z);
    colAttr.setXYZ(i, p.r * fade, p.g * fade, p.b * fade);
  }
  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
}
