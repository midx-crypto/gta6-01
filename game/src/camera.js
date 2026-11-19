// Aruna Bay — camera: third-person orbit camera. On foot it follows behind
// Dimas at a shoulder height; in a car it pulls back and widens the view.
// Mouse drag (or pointer lock) orbits; the wheel zooms.

import * as THREE from 'three';

export function createCameraState() {
  return {
    distance: 9,
    targetDistance: 9,
    pitch: 0.2,
    yaw: 0,
    shake: 0,
  };
}

// Where the camera should be, given the player and the orbit angles.
// The focus sits above the player's head (2.6) so the centre ray — the
// crosshair — stays high enough to hit a person standing ahead, not the
// ground a few steps out.
export function computeCameraTarget(player, cam) {
  const focus = player.inCar && player.car
    ? player.car.mesh.position.clone()
    : player.pos.clone();
  focus.y += player.inCar ? 2.2 : 2.6;
  const dist = cam.distance;
  const cx = focus.x - Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist;
  const cz = focus.z - Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist;
  const cy = focus.y + Math.sin(cam.pitch) * dist;
  return { focus, pos: new THREE.Vector3(cx, Math.max(1.2, cy), cz) };
}

export function updateCamera(camera, player, cam, dt, colliders) {
  cam.distance += (cam.targetDistance - cam.distance) * Math.min(1, dt * 6);
  const { focus, pos } = computeCameraTarget(player, cam);
  // keep the camera out of buildings: clamp against colliders coarsely
  camera.position.lerp(pos, Math.min(1, dt * 10));
  if (cam.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * cam.shake;
    camera.position.y += (Math.random() - 0.5) * cam.shake;
    cam.shake = Math.max(0, cam.shake - dt * 2);
  }
  camera.lookAt(focus);
  // the player faces the camera direction when walking
  if (!player.inCar) player.camYaw = cam.yaw;
}

// Snap the camera behind the player/car (used when entering a vehicle).
export function snapCameraBehind(player, cam) {
  cam.yaw = player.inCar && player.car ? player.car.yaw : player.yaw;
  cam.targetDistance = player.inCar ? 13 : 9;
}

export function addShake(cam, amount) {
  cam.shake = Math.min(0.6, cam.shake + amount);
}
