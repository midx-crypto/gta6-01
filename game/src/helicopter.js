// Air-1, the police helicopter: appears at wanted 4-5, circles the player,
// pins them with a visible searchlight cone and a spotlight, and calls in
// ground units. The rotor sound follows it.
import * as THREE from 'three';
import { rotorSound } from './audio.js';

export function createHelicopter(state) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 6.5), new THREE.MeshLambertMaterial({ color: 0x1a2e5a }));
  body.position.y = 0;
  group.add(body);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 4.5), new THREE.MeshLambertMaterial({ color: 0x1a2e5a }));
  tail.position.set(0, 0.2, -5);
  group.add(tail);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 2.0), new THREE.MeshLambertMaterial({ color: 0x9fd8ff }));
  glass.position.set(0, 0.3, 2.2);
  group.add(glass);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.08, 0.5), new THREE.MeshLambertMaterial({ color: 0x181818 }));
  rotor.position.y = 1.1;
  group.add(rotor);
  const rotor2 = rotor.clone(); rotor2.rotation.y = Math.PI / 2; group.add(rotor2);
  const skidL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 4.5), new THREE.MeshLambertMaterial({ color: 0x181818 }));
  skidL.position.set(-1.2, -1.0, 0); group.add(skidL);
  const skidR = skidL.clone(); skidR.position.x = 1.2; group.add(skidR);
  const coneGeo = new THREE.ConeGeometry(4.5, 34, 16, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xfff2b8, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = -17;
  cone.rotation.x = Math.PI;
  group.add(cone);
  const spot = new THREE.SpotLight(0xfff2b8, 900, 90, 0.22, 0.5, 1.2);
  group.add(spot);
  group.add(spot.target);
  group.userData.rotor = rotor;
  group.userData.rotor2 = rotor2;
  group.userData.cone = cone;
  group.userData.spot = spot;
  group.visible = false;
  state.scene.add(group);
  state.heli = { mesh: group, angle: 0, active: false };
  return state.heli;
}

export function updateHelicopter(state, dt) {
  const heli = state.heli;
  if (!heli) return;
  const want = state.wanted >= 4;
  heli.active = want;
  heli.mesh.visible = want;
  rotorSound(want);
  if (!want) return;
  heli.angle += dt * 0.55;
  const px = state.player.x;
  const pz = state.player.z;
  const hx = px + Math.cos(heli.angle) * 30;
  const hz = pz + Math.sin(heli.angle) * 30;
  const hy = 13 + Math.sin(state.time * 0.8) * 1.5;
  heli.mesh.position.set(hx, hy, hz);
  heli.mesh.lookAt(px, 0, pz);
  heli.mesh.userData.rotor.rotation.y += dt * 22;
  heli.mesh.userData.rotor2.rotation.y += dt * 22;
  heli.mesh.userData.spot.target.position.set(px - hx, -hy, pz - hz);
  heli.mesh.userData.cone.position.y = -hy / 2 - 0.5;
  heli.mesh.userData.cone.scale.set(1, hy / 30, 1);
}

// The searchlight's ground spot: where the beam lands, for the minimap.
export function heliGroundSpot(state) {
  if (!state.heli || !state.heli.active) return null;
  return { x: state.player.x, z: state.player.z };
}
