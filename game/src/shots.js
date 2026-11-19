// Aruna Bay — deterministic screenshot modes. ?shot=start|play|chase|mission|end
// &seed=1 puts the game in a fixed, reproducible state so the screenshots the
// maker takes are real renders of the game, not staged images.

import { syncPoliceUnits } from './police.js';

export function parseShotMode() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1');
  if (!shot) return null;
  return { shot, seed: Number.isFinite(seed) ? seed : 1 };
}

// Apply a shot mode to a freshly built game. Called once after init, before
// the first rendered frame that matters.
export function applyShotMode(G, mode) {
  const { shot } = mode;
  if (shot === 'start') {
    // start screen over a slow cinematic orbit of the city
    G.mode = 'menu';
    G.cinematic = true;
    return;
  }
  // every other mode starts playing immediately, with a fixed camera
  G.mode = 'playing';
  G.shotMode = true;
  G.hud.startScreen.style.display = 'none';
  if (shot === 'play') {
    // driving up the neon strip: Kafe Senja sign ahead, traffic on the road
    const car = G.cars.find((c) => c.parked);
    if (car) {
      G.player.inCar = true;
      G.player.car = car;
      car.parked = false;
      car.isPlayerCar = true;
      car.mesh.position.set(-100, 0, 30);
      car.yaw = 0;
      car.speed = 18;
      G.player.mesh.visible = false;
      G.player.pos.copy(car.mesh.position);
      G.cam.yaw = 0;
      G.cam.pitch = 0.28;
      G.cam.targetDistance = 12;
    }
  } else if (shot === 'chase') {
    // driving down the beach road with 3 wanted stars; the camera looks back
    // from ahead so the police tail is in frame behind the player car
    const car = G.cars.find((c) => c.parked);
    if (car) {
      G.player.inCar = true;
      G.player.car = car;
      car.parked = false;
      car.isPlayerCar = true;
      car.mesh.position.set(186, 0, 40);
      car.yaw = Math.PI;
      car.speed = 24;
      G.player.mesh.visible = false;
      G.player.pos.copy(car.mesh.position);
      G.cam.yaw = 0.6;
      G.cam.pitch = 0.3;
      G.cam.targetDistance = 11;
    }
    G.police.wanted = 3;
    G.police.heatTimer = 0;
    syncPoliceUnits(G.scene, G.police, G.player.pos);
    // park the police tail right behind the player so it reads in the shot
    const tailSpots = [[186, 56], [178, 62], [192, 64]];
    G.police.cars.forEach((pc, i) => {
      const s = tailSpots[i % tailSpots.length];
      pc.mesh.position.set(s[0], 0, s[1]);
      pc.yaw = Math.PI;
      pc.speed = 26;
    });
    startMissionQuiet(G);
  } else if (shot === 'mission') {
    // mission 3 shootout at the warehouse: enemies ahead on the road
    G.player.pos.set(136, 0, 108);
    G.player.mesh.position.copy(G.player.pos);
    G.cam.yaw = 0.7;
    G.cam.pitch = 0.2;
    G.missions.index = 2;
    G.startMission(2);
  } else if (shot === 'end') {
    // mission-complete screen over the pier at dusk
    G.player.pos.set(200, 0, -25);
    G.player.mesh.position.copy(G.player.pos);
    G.cam.yaw = -Math.PI / 2;
    G.mode = 'complete';
    G.hud.endTitle.textContent = 'MISI SELESAI';
    G.hud.endText.textContent = 'Perampokan Bank Aruna berhasil! +$5.000 — Dimas kini legenda Kota Aruna.';
    G.hud.endScreen.style.display = 'flex';
  }
}

// The chase cover shot also wants an objective on screen, so start mission 1
// without the big intro message.
function startMissionQuiet(G) {
  G.missions.index = 0;
  G.startMission(0);
  G.missions.messageTimer = 0;
}
