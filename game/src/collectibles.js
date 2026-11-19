// Koin Bahari: 20 collectibles hidden across all five districts, the beach,
// the pier and the volcano viewpoint. Each is worth $25 and respect.
import * as THREE from 'three';
import { COIN_VALUE } from './config.js';
import { pickupSound } from './audio.js';

export const COIN_SPOTS = [
  [-170, 100], [-220, 180], [-160, 40], [-100, -20], [-240, 100],
  [20, -100], [60, -120], [80, -60], [120, -160], [0, -40],
  [200, 40], [235, 100], [210, -40], [250, 160], [280, 100],
  [-80, -300], [-120, -360], [-40, -380], [90, -380], [120, -340],
];

export function createCoins(state) {
  state.coins = [];
  const geo = new THREE.TorusGeometry(0.55, 0.22, 10, 18);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffd23e });
  for (let i = 0; i < COIN_SPOTS.length; i += 1) {
    const [x, z] = COIN_SPOTS[i];
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 1.1, z);
    mesh.rotation.x = Math.PI / 2;
    state.scene.add(mesh);
    state.coins.push({ mesh, x, z, taken: false, index: i, phase: i * 0.7 });
  }
  state.coinsTotal = COIN_SPOTS.length;
}

export function updateCoins(state, dt) {
  for (const coin of state.coins) {
    if (coin.taken) continue;
    coin.phase += dt * 2;
    coin.mesh.rotation.z += dt * 1.5;
    coin.mesh.position.y = 1.1 + Math.sin(coin.phase) * 0.25;
    const d = Math.hypot(state.player.x - coin.x, state.player.z - coin.z);
    if (d < 2.4) {
      coin.taken = true;
      state.scene.remove(coin.mesh);
      state.coinsGot += 1;
      state.money += COIN_VALUE;
      state.respect += 1;
      if (!state.flags.coinsCollected) state.flags.coinsCollected = [];
      state.flags.coinsCollected.push(coin.index);
      pickupSound();
      state.message = 'Koin Bahari ' + state.coinsGot + '/' + state.coinsTotal + '! +$' + COIN_VALUE;
      state.messageTimer = 2;
      if (state.coinsGot >= state.coinsTotal) {
        state.money += 500;
        state.message = 'SEMUA KOIN BAHARI! Bonus +$500!';
        state.messageTimer = 4;
      }
    }
  }
}

export function applyCollectedCoins(state, indices) {
  for (const i of indices || []) {
    const coin = state.coins[i];
    if (coin && !coin.taken) {
      coin.taken = true;
      state.scene.remove(coin.mesh);
    }
  }
  state.coinsGot = (indices || []).length;
}
