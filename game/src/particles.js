// Particles: one THREE.Points pool for nitro flames, crash sparks, muzzle
// flashes and coin sparkles. Fixed-size buffers, no allocation per frame.
import * as THREE from 'three';

const MAX = 420;

export function createParticles(state) {
  const positions = new Float32Array(MAX * 3);
  const colors = new Float32Array(MAX * 3);
  for (let i = 0; i < MAX; i += 1) { positions[i * 3 + 1] = -999; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  state.scene.add(points);
  state.particles = {
    points, positions, colors,
    vel: new Float32Array(MAX * 3),
    life: new Float32Array(MAX),
    maxLife: new Float32Array(MAX),
    cursor: 0,
  };
  return state.particles;
}

export function spawnBurst(state, x, y, z, color, count, speed, life, up) {
  const p = state.particles;
  if (!p) return;
  const col = new THREE.Color(color);
  for (let n = 0; n < count; n += 1) {
    const i = p.cursor;
    p.cursor = (p.cursor + 1) % MAX;
    p.positions[i * 3] = x;
    p.positions[i * 3 + 1] = y;
    p.positions[i * 3 + 2] = z;
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    p.vel[i * 3] = Math.cos(a) * s;
    p.vel[i * 3 + 1] = (up || 0.5) * speed * Math.random() + 1;
    p.vel[i * 3 + 2] = Math.sin(a) * s;
    p.colors[i * 3] = col.r; p.colors[i * 3 + 1] = col.g; p.colors[i * 3 + 2] = col.b;
    p.life[i] = life * (0.6 + Math.random() * 0.6);
    p.maxLife[i] = p.life[i];
  }
  p.points.geometry.attributes.position.needsUpdate = true;
  p.points.geometry.attributes.color.needsUpdate = true;
}

export function spawnNitroFlame(state, car) {
  if (!car) return;
  const bx = car.x - Math.sin(car.angle) * 2.3;
  const bz = car.z - Math.cos(car.angle) * 2.3;
  spawnBurst(state, bx, 0.6, bz, 0xff7a1e, 3, 2.5, 0.35, 0.4);
  spawnBurst(state, bx, 0.6, bz, 0xffd23e, 2, 1.5, 0.3, 0.4);
}

export function updateParticles(state, dt) {
  const p = state.particles;
  if (!p) return;
  let any = false;
  for (let i = 0; i < MAX; i += 1) {
    if (p.life[i] <= 0) continue;
    any = true;
    p.life[i] -= dt;
    if (p.life[i] <= 0) { p.positions[i * 3 + 1] = -999; continue; }
    p.vel[i * 3 + 1] -= 6 * dt;
    p.positions[i * 3] += p.vel[i * 3] * dt;
    p.positions[i * 3 + 1] += p.vel[i * 3 + 1] * dt;
    p.positions[i * 3 + 2] += p.vel[i * 3 + 2] * dt;
    if (p.positions[i * 3 + 1] < 0.05) { p.positions[i * 3 + 1] = 0.05; p.vel[i * 3 + 1] = 0; }
  }
  if (any) p.points.geometry.attributes.position.needsUpdate = true;
}
