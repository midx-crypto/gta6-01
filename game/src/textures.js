// Canvas-painted textures: every facade, road, sign and container skin is
// drawn here at boot, so the game loads zero image files and zero network.
import * as THREE from 'three';

function makeCanvas(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildingTexture(base, litRatio, seed) {
  return makeCanvas(128, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 2);
    let n = seed;
    const rnd = () => { n = (n * 16807) % 2147483647; return n / 2147483647; };
    for (let y = 10; y < h - 10; y += 22) {
      for (let x = 10; x < w - 10; x += 20) {
        const lit = rnd() < litRatio;
        g.fillStyle = lit ? (rnd() < 0.7 ? '#ffd98a' : '#9fd8ff') : 'rgba(20,28,44,0.85)';
        g.fillRect(x, y, 12, 14);
      }
    }
  });
}

export function roadTexture() {
  const tex = makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#3a3a40'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#43434a';
    for (let i = 0; i < 40; i += 1) g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    g.fillStyle = '#f2e6a0'; g.fillRect(w / 2 - 2, 8, 4, 34); g.fillRect(w / 2 - 2, 86, 4, 34);
    g.fillStyle = '#e8e8e8'; g.fillRect(4, 0, 3, h); g.fillRect(w - 7, 0, 3, h);
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function groundTexture(base, speckle) {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = speckle;
    for (let i = 0; i < 90; i += 1) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  });
}

export function signTexture(text, bg, fg) {
  return makeCanvas(256, 64, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = fg; g.font = 'bold 30px system-ui, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 1);
  });
}

export function containerTexture(color) {
  return makeCanvas(128, 64, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    for (let x = 0; x < w; x += 16) g.fillRect(x, 0, 3, h);
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.font = 'bold 18px system-ui, sans-serif';
    g.fillText('BARA', 14, 34);
  });
}

// A neon sign texture with two lines, for shop fronts and the festival.
export function neonSignTexture(line1, line2, bg, fg) {
  return makeCanvas(256, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = 'bold 34px system-ui, sans-serif';
    g.fillText(line1, w / 2, line2 ? h / 2 - 20 : h / 2);
    if (line2) { g.font = 'bold 24px system-ui, sans-serif'; g.fillText(line2, w / 2, h / 2 + 26); }
  });
}

// Warm sand with speckles for the Pantai beach strip.
export function sandTexture() {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#e8d194'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d8bf7a';
    for (let i = 0; i < 120; i += 1) g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 20; i += 1) g.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  });
}
