// Renderer and camera: WebGL setup plus the third-person follow camera
// that chases Mira on foot and in the car, with mouse-drag orbit.
import * as THREE from 'three';

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = false;
  return renderer;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 1500);
  camera.position.set(-180, 30, 160);
  return camera;
}

export function resizeRenderer(renderer, camera) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

export function updateCamera(state, camera, dt) {
  if (state.shotCamera) {
    camera.position.set(state.shotCamera.pos[0], state.shotCamera.pos[1], state.shotCamera.pos[2]);
    camera.lookAt(state.shotCamera.look[0], state.shotCamera.look[1], state.shotCamera.look[2]);
    return;
  }
  const tx = state.player.x;
  const tz = state.player.z;
  const inCar = !state.player.onFoot;
  const dist = inCar ? 13.5 : 9.5;
  const height = inCar ? 5.6 : 4.6;
  const yaw = state.cameraYaw;
  const cx = tx - Math.sin(yaw) * dist;
  const cz = tz - Math.cos(yaw) * dist;
  const k = 1 - Math.exp(-dt * 7);
  camera.position.x += (cx - camera.position.x) * k;
  camera.position.y += (height - camera.position.y) * k;
  camera.position.z += (cz - camera.position.z) * k;
  camera.lookAt(tx, inCar ? 1.6 : 1.8, tz);
}
