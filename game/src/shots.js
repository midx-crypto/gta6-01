// Shot scenes: ?shot=start|play|chase|mission|race|garage|end&seed=1 stages a
// deterministic frame of the real game — no fake poses, the state is set and
// the renderer paints it. main.js renders twice, then sets __shotReady.
import { makeCarMesh } from './vehicles.js';
import { spawnEnemy } from './combat.js';
import { startRace } from './races.js';
import { spawnBurst } from './particles.js';
import { setWanted, placePoliceCar } from './police.js';

export function stageShot(name, ctx) {
  const { state } = ctx;
  state.shotMode = name;
  state.shotCamera = null;
  if (name === 'start') {
    state.mode = 'title';
    state.player.x = 60; state.player.z = -120; state.player.angle = 0; state.player.onFoot = true;
    ctx.playerMesh.position.set(60, 0, -120);
    state.shotCamera = { pos: [95, 55, -30], look: [0, 12, -120] };
    return { screen: 'title' };
  }
  if (name === 'chase') {
    state.mode = 'play';
    const car = state.cars.find((c) => c.owned) || state.cars[0];
    state.car = car;
    state.player.onFoot = false;
    car.x = 120; car.z = -180; car.angle = Math.PI; car.speed = 38;
    car.mesh.position.set(120, 0, -180);
    car.mesh.rotation.y = Math.PI;
    state.player.x = 120; state.player.z = -180; state.player.angle = Math.PI;
    state.nitro = 62; state.nitroActive = true;
    setWanted(state, 5);
    if (state.heli) state.heli.angle = -Math.PI / 2 + 0.45;
    placePoliceCar(state, 114, -212, 0);
    placePoliceCar(state, 126, -218, 0);
    placePoliceCar(state, 120, -148, Math.PI);
    state.objective = { text: 'Kabur ke Bukit! Lolos dari Air-1', x: 90, z: -380, kind: 'escape' };
    state.mission = { id: 12, title: 'Pelarian Terakhir' };
    state.day = 3;
    state.cameraYaw = Math.PI;
    spawnBurst(state, 120, 0.8, -177, 0xff7a1e, 24, 4, 0.6, 0.8);
    spawnBurst(state, 120, 0.8, -177, 0xffd23e, 14, 3, 0.5, 0.8);
    return { screen: 'play' };
  }
  if (name === 'mission') {
    state.mode = 'wheel';
    state.player.x = 60; state.player.z = -115; state.player.angle = Math.PI; state.player.onFoot = true;
    ctx.playerMesh.position.set(60, 0, -115);
    ctx.playerMesh.rotation.y = Math.PI;
    setWanted(state, 4);
    if (state.heli) state.heli.angle = -Math.PI / 2;
    placePoliceCar(state, 44, -138, Math.PI);
    state.currentWeapon = 'smg';
    state.weapons.smg.ammo = 30; state.weapons.smg.reserve = 90;
    state.objective = { text: 'Habisi 8 penjaga Plaza Menara', x: 60, z: -120, kind: 'kill' };
    state.mission = { id: 10, title: 'Masuk ke Balai Kota' };
    state.day = 3;
    for (let i = 0; i < 6; i += 1) spawnEnemy(state, 55 + i * 4, -135 - (i % 3) * 5, 100);
    state.cameraYaw = Math.PI;
    return { screen: 'wheel' };
  }
  if (name === 'race') {
    state.mode = 'play';
    const car = state.cars.find((c) => c.owned) || state.cars[0];
    state.car = car;
    state.player.onFoot = false;
    startRace(state);
    // Boardwalk ramp, heading east along the beach: sea on the left, resort
    // on the right, no volcano in the way.
    car.x = -62; car.z = -310; car.angle = Math.PI / 2; car.speed = 30; car.y = 4.5; car.vy = 3;
    car.mesh.position.set(-62, 4.5, -310);
    car.mesh.rotation.y = Math.PI / 2;
    car.mesh.rotation.x = -0.14;
    state.player.x = -62; state.player.z = -310; state.player.angle = Math.PI / 2;
    state.airborne = true; state.airTime = 0.9;
    state.nitro = 74; state.nitroActive = true;
    state.objective = { text: 'Checkpoint 2/7 — kalahkan Doni!', x: -140, z: -380, kind: 'race' };
    state.mission = { id: 3, title: 'Balapan Pertama' };
    state.day = 1;
    state.cameraYaw = Math.PI / 2;
    state.shotCamera = { pos: [-54, 6, -296], look: [-60, 4, -310] };
    spawnBurst(state, -65, 4, -310, 0xff7a1e, 20, 4, 0.6, 0.6);
    if (ctx.rivalMesh) {
      ctx.rivalMesh.visible = true;
      ctx.rivalMesh.position.set(-38, 0, -310);
      ctx.rivalMesh.rotation.y = Math.PI / 2;
      state.race.rivalX = -38; state.race.rivalZ = -310; state.race.rivalAngle = Math.PI / 2;
    }
    return { screen: 'play' };
  }
  if (name === 'garage') {
    state.mode = 'garage';
    state.player.x = -182; state.player.z = 148; state.player.onFoot = true;
    ctx.playerMesh.position.set(-182, 0, 148);
    state.money = 1250;
    state.respect = 180;
    state.objective = { text: 'Garasi Pak Hendra — upgrade mobilmu', x: -190, z: 140, kind: 'goto' };
    state.day = 2;
    state.shotCamera = { pos: [-168, 7, 158], look: [-182, 1.5, 132] };
    return { screen: 'garage' };
  }
  if (name === 'end') {
    state.mode = 'missiondone';
    state.flags.lastReward = { money: 1500, respect: 200, title: 'Pelarian Terakhir' };
    state.flags.gameComplete = true;
    state.player.x = 90; state.player.z = -380; state.player.onFoot = true;
    ctx.playerMesh.position.set(90, 0, -380);
    state.day = 3;
    state.shotCamera = { pos: [120, 42, -300], look: [0, 8, -330] };
    return { screen: 'missiondone' };
  }
  return stageShot('start', ctx);
}
