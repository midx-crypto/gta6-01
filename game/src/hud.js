// Aruna Bay — HUD: DOM overlays (health, money, wanted stars, speed, objective,
// crosshair, menus) plus a 2D canvas minimap drawn top-down every frame.

import { currentMission, currentStep, missionObjectiveText } from './missions.js';

export function buildHud() {
  const hud = {};
  hud.root = document.getElementById('hud');
  hud.minimap = document.getElementById('minimap');
  hud.mmCtx = hud.minimap.getContext('2d');
  hud.healthFill = document.getElementById('health-fill');
  hud.healthText = document.getElementById('health-text');
  hud.money = document.getElementById('money');
  hud.stars = document.getElementById('stars');
  hud.speed = document.getElementById('speed');
  hud.objective = document.getElementById('objective');
  hud.objectiveTitle = document.getElementById('objective-title');
  hud.message = document.getElementById('message');
  hud.crosshair = document.getElementById('crosshair');
  hud.startScreen = document.getElementById('start-screen');
  hud.pauseScreen = document.getElementById('pause-screen');
  hud.endScreen = document.getElementById('end-screen');
  hud.endTitle = document.getElementById('end-title');
  hud.endText = document.getElementById('end-text');
  hud.hint = document.getElementById('hint');
  hud.ammo = document.getElementById('ammo');
  return hud;
}

export function showStart(hud, show) {
  hud.startScreen.style.display = show ? 'flex' : 'none';
}

export function showPause(hud, show) {
  hud.pauseScreen.style.display = show ? 'flex' : 'none';
}

export function showEnd(hud, title, text) {
  hud.endTitle.textContent = title;
  hud.endText.textContent = text;
  hud.endScreen.style.display = 'flex';
}

export function hideEnd(hud) {
  hud.endScreen.style.display = 'none';
}

function starsText(wanted) {
  let s = '';
  for (let i = 0; i < 5; i++) s += i < wanted ? '★' : '☆';
  return s;
}

export function updateHud(hud, G, dt) {
  const p = G.player;
  hud.healthFill.style.width = `${p.health}%`;
  hud.healthFill.style.background = p.health > 50 ? '#4ad87a' : p.health > 25 ? '#e8c832' : '#d84a4a';
  hud.healthText.textContent = `❤ ${Math.round(p.health)}`;
  hud.money.textContent = `$${p.money.toLocaleString('en-US')}`;
  hud.stars.textContent = starsText(G.police.wanted);
  hud.stars.style.color = G.police.wanted > 0 ? '#ffd94d' : '#888888';
  const speed = p.inCar && p.car ? Math.abs(p.car.speed) * 3.6 : 0;
  hud.speed.textContent = p.inCar ? `${Math.round(speed)} km/h` : '';
  hud.ammo.textContent = p.inCar ? '' : `🔫 ${p.ammo}`;
  hud.objectiveTitle.textContent = missionObjectiveText(G.missions);
  const step = G.missions.active ? currentStep(G.missions) : null;
  hud.objective.textContent = step ? step.label : '';
  if (G.missions.messageTimer > 0) {
    hud.message.textContent = G.missions.message;
    hud.message.style.display = 'block';
  } else {
    hud.message.style.display = 'none';
  }
  hud.crosshair.style.display = (!p.inCar && G.mode === 'playing') ? 'block' : 'none';
  drawMinimap(hud, G);
}

// Flash a short toast under the objective (pickup, save, entering a car).
export function flashHint(hud, text, seconds = 3) {
  hud.hint.textContent = text;
  hud.hint.style.display = 'block';
  hud.hint.dataset.until = String(performance.now() + seconds * 1000);
}

export function tickHint(hud) {
  if (hud.hint.dataset.until && performance.now() > Number(hud.hint.dataset.until)) {
    hud.hint.style.display = 'none';
    hud.hint.dataset.until = '';
  }
}

// Top-down minimap: roads, sea, beach, player arrow, police, beacon, target.
export function drawMinimap(hud, G) {
  const ctx = hud.mmCtx;
  const S = 200;
  const scale = S / 480; // world [-240, 240] maps onto the canvas
  const toX = (x) => (x + 240) * scale;
  const toY = (z) => (z + 240) * scale;
  ctx.clearRect(0, 0, S, S);
  // land
  ctx.fillStyle = '#3a3f2e';
  ctx.fillRect(0, 0, S, S);
  // sea
  ctx.fillStyle = '#1e6f8e';
  ctx.fillRect(toX(215), 0, S - toX(215), S);
  // sand
  ctx.fillStyle = '#e8c98f';
  ctx.fillRect(toX(185), 0, toX(215) - toX(185), S);
  // roads
  ctx.strokeStyle = '#5a5a5a';
  ctx.lineWidth = 4;
  for (let v = -150; v <= 150; v += 50) {
    ctx.beginPath(); ctx.moveTo(toX(v), 0); ctx.lineTo(toX(v), S); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, toY(v)); ctx.lineTo(S, toY(v)); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(toX(186), 0); ctx.lineTo(toX(186), S); ctx.stroke();
  // park
  ctx.fillStyle = '#4d8a4a';
  ctx.fillRect(toX(1), toY(-149), 48 * scale, 48 * scale);
  const blip = (x, z, color, r) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(toX(x), toY(z), r, 0, Math.PI * 2);
    ctx.fill();
  };
  // mission beacon
  if (G.missions.beacon) {
    const b = G.missions.beacon.position;
    blip(b.x, b.z, '#ffd94d', 7);
    ctx.strokeStyle = '#ffd94d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(toX(b.x), toY(b.z), 10 + Math.sin(performance.now() * 0.005) * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  // chase target
  if (G.missions.targetCar) {
    const t = G.missions.targetCar.mesh.position;
    blip(t.x, t.z, '#ff4444', 6);
  }
  // police cars
  for (const car of G.police.cars) {
    const m = car.mesh.position;
    blip(m.x, m.z, '#4a7ad8', 4);
  }
  // traffic
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (const car of G.traffic) {
    const m = car.mesh.position;
    ctx.fillRect(toX(m.x) - 1.5, toY(m.z) - 1.5, 3, 3);
  }
  // player arrow
  const px = toX(G.player.pos.x);
  const py = toY(G.player.pos.z);
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(-G.player.yaw);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.lineTo(6, 6);
  ctx.lineTo(0, 3);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // north marker
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Arial';
  ctx.fillText('N', 6, 14);
}
