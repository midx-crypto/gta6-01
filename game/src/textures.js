// Aruna Bay — procedural canvas textures. Every texture in the game is drawn
// here at runtime from canvas, so the game ships no image files at all.

import * as THREE from 'three';

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Building facade: lit windows on a warm wall, with a darker ground floor.
export function makeBuildingTexture(baseColor, litRatio, rng) {
  return canvasTexture(256, 512, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);
    // subtle vertical shading between window columns
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, 0, 2, h);
    }
    const cols = 6;
    const rows = 14;
    const cw = w / cols;
    const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const lit = rng() < litRatio;
        if (lit) {
          ctx.fillStyle = rng() < 0.7 ? '#ffd98a' : '#9fd8ff';
        } else {
          ctx.fillStyle = '#232a38';
        }
        ctx.fillRect(c * cw + 6, r * rh + 8, cw - 12, rh - 16);
      }
    }
    // ground floor: shopfront band
    ctx.fillStyle = 'rgba(20,16,12,0.85)';
    ctx.fillRect(0, h - 46, w, 46);
    ctx.fillStyle = '#ffcf7a';
    for (let x = 10; x < w - 10; x += 34) {
      ctx.fillRect(x, h - 38, 24, 26);
    }
  });
}

// Asphalt with a dashed centre line and edge lines, tiled along a road.
export function makeRoadTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2c2f36';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 40; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    ctx.fillStyle = '#e8d44d';
    ctx.fillRect(w / 2 - 2, 8, 4, 40);
    ctx.fillRect(w / 2 - 2, 72, 4, 40);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(4, 0, 3, h);
    ctx.fillRect(w - 7, 0, 3, h);
  });
}

// Sand with speckles and a wet band near the water.
export function makeSandTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#e8c98f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(160,120,70,0.25)' : 'rgba(255,240,200,0.3)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

// Neon shop sign: glowing text on a dark board.
export function makeNeonSignTexture(text, color) {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#120a18';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 26;
    ctx.fillStyle = color;
    ctx.fillText(text, w / 2, h / 2 + 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2 + 2);
  });
}

// A soft round sprite used for muzzle flashes, smoke and sparks.
export function makeGlowTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.4, 'rgba(255,220,140,0.8)');
    g.addColorStop(1, 'rgba(255,180,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

// Foamy shoreline texture for the water edge.
export function makeFoamTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1e6f8e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const y = 12 + i * 20;
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 16) {
        ctx.lineTo(x, y + Math.sin(x * 0.2 + i) * 5);
      }
      ctx.stroke();
    }
  });
}

// Palm frond silhouette used as an alpha-tested leaf texture.
export function makePalmTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#2f7a34';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(64, 64);
      ctx.quadraticCurveTo(
        64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40 - 12,
        64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60,
      );
      ctx.stroke();
    }
  });
}
