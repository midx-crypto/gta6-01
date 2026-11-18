// Solara Nights — shots.js
// Deterministic screenshot modes: ?shot=start|play|chase|end&seed=1 puts the
// game in a fixed, photogenic state so every screenshot is reproducible.

import { CFG } from './config.js';
import { makeCar } from './vehicles.js';
import { makePed } from './pedestrians.js';
import { startMission } from './missions.js';

export function applyShotMode(S, shot) {
  if (!shot) return;
  if (shot === 'start') {
    S.state = 'title';
    return;
  }
  if (shot === 'play') {
    S.state = 'play';
    // Raka on foot at a busy intersection, first mission live.
    S.player.x = 1000;
    S.player.y = 1000;
    S.player.angle = -Math.PI / 2;
    startMission(S, 0);
    S.message = 'Misi 1: Kenalan di Dermaga — sampai ke penanda kuning.';
    S.msgT = 6;
    return;
  }
  if (shot === 'chase') {
    S.state = 'play';
    // Raka in a red car on the main avenue, wanted level 3, police closing in.
    const car = makeCar(1400, 1000, 0, '#d94f3d', 'player');
    car.driver = 'player';
    car.speed = 380;
    S.cars.push(car);
    S.player.inCar = car;
    S.player.x = car.x;
    S.player.y = car.y;
    S.wanted = 3;
    startMission(S, 1);
    S.message = 'Misi 2: Mobil Pesanan — antar mobil curian ke Bengkel Bayu!';
    S.msgT = 6;
    // Two police cars in pursuit, one ahead cutting across.
    const p1 = makeCar(1180, 1000, 0, '#1c2f4a', 'police');
    p1.driver = 'police';
    p1.speed = 480;
    S.cars.push(p1);
    const p2 = makeCar(1560, 940, Math.PI, '#1c2f4a', 'police');
    p2.driver = 'police';
    p2.speed = 460;
    S.cars.push(p2);
    const p3 = makeCar(1400, 1180, -Math.PI / 2, '#1c2f4a', 'police');
    p3.driver = 'police';
    p3.speed = 440;
    S.cars.push(p3);
    return;
  }
  if (shot === 'mission') {
    S.state = 'play';
    // Raka on foot at the warehouse yard, mission 3 live, guards closing in.
    S.player.x = 1000;
    S.player.y = 860;
    S.player.angle = 0;
    S.wanted = 2;
    startMission(S, 2);
    S.message = 'Misi 3: Tagihan Terakhir — lumpuhkan 3 penjaga gudang!';
    S.msgT = 6;
    return;
  }
  if (shot === 'end') {
    S.state = 'done';
    S.player.money = 1300;
    S.missionIdx = 3;
    return;
  }
}

// A small crowd of pedestrians near a point, for lively screenshots.
export function seedCrowd(S, cx, cy, n) {
  for (let i = 0; i < n; i++) {
    const ped = makePed(S, false);
    ped.x = cx + S.rng.range(-260, 260);
    ped.y = cy + S.rng.range(-200, 200);
    S.peds.push(ped);
  }
}
