// Solara Nights — hud.js
// The HUD: health, cash, ammo, wanted stars, mission tracker, message feed,
// and the live minimap of Kota Solara in the corner.

import { CFG, GAME_NAME, CITY_NAME } from './config.js';
import { currentMission, missionProgressText } from './missions.js';

export function drawHud(S, ctx, w, h) {
  const p = S.player;
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // Top-left: wanted stars.
  ctx.fillStyle = 'rgba(10, 12, 18, 0.55)';
  roundRect(ctx, 12, 12, 220, 34, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('★'.repeat(S.wanted) + '☆'.repeat(CFG.WANTED_MAX - S.wanted), 22, 37);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(S.wanted > 0 ? 'WANTED' : 'AMAN', 150, 36);

  // Top-left below: health bar.
  ctx.fillStyle = 'rgba(10, 12, 18, 0.55)';
  roundRect(ctx, 12, 54, 220, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#222';
  roundRect(ctx, 22, 62, 140, 14, 7);
  ctx.fill();
  ctx.fillStyle = p.hp > 30 ? '#4fc25e' : '#e84a3d';
  roundRect(ctx, 22, 62, Math.max(0, 140 * (p.hp / CFG.PLAYER_HP)), 14, 7);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(`HP ${Math.max(0, Math.ceil(p.hp))}`, 170, 75);

  // Top-right: cash + ammo.
  ctx.fillStyle = 'rgba(10, 12, 18, 0.55)';
  roundRect(ctx, w - 232, 12, 220, 62, 8);
  ctx.fill();
  ctx.fillStyle = '#7ee787';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`$${p.money}`, w - 24, 38);
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Pistol ${p.ammo}/${p.reserveAmmo}`, w - 24, 62);
  ctx.textAlign = 'left';

  // Mission tracker, top centre.
  const m = currentMission(S);
  if (m) {
    const text = missionProgressText(S);
    ctx.font = 'bold 15px sans-serif';
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(10, 12, 18, 0.6)';
    roundRect(ctx, (w - tw) / 2 - 14, 12, tw + 28, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd23d';
    ctx.textAlign = 'center';
    ctx.fillText(text, w / 2, 35);
    ctx.textAlign = 'left';
  }

  // Centre message feed.
  if (S.msgT > 0 && S.message) {
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(10, 12, 18, 0.65)';
    const tw = ctx.measureText(S.message).width;
    roundRect(ctx, (w - tw) / 2 - 12, h - 150, tw + 24, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(S.message, w / 2, h - 128);
    ctx.textAlign = 'left';
  }

  // Controls hint, bottom-left.
  ctx.fillStyle = 'rgba(10, 12, 18, 0.5)';
  roundRect(ctx, 12, h - 62, 430, 50, 8);
  ctx.fill();
  ctx.fillStyle = '#ddd';
  ctx.font = '13px sans-serif';
  ctx.fillText('WASD jalan / nyetir   •   E curi mobil / keluar   •   Mouse bidik, klik tembak', 22, h - 42);
  ctx.fillText('R isi peluru   •   P jeda   •   M suara   •   F keluar mobil', 22, h - 22);

  // Speedometer while driving, above the minimap.
  if (p.inCar) {
    const kmh = Math.round(Math.abs(p.inCar.speed) * 0.36);
    ctx.fillStyle = 'rgba(10, 12, 18, 0.6)';
    roundRect(ctx, w - 182, h - 258, 168, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${kmh} km/j`, w - 26, h - 231);
    ctx.textAlign = 'left';
  }

  // Busted warning pulse.
  if (S.bustedT > 0.4) {
    ctx.fillStyle = `rgba(232, 74, 61, ${0.25 + 0.2 * Math.sin(S.time * 10)})`;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POLISI MENANGKAPMU — LARILAH!', w / 2, 110);
    ctx.textAlign = 'left';
  }

  drawMinimap(S, ctx, w, h);
  ctx.restore();
}

function drawMinimap(S, ctx, w, h) {
  const size = 168;
  const x0 = w - size - 14;
  const y0 = h - size - 14;
  const sx = size / CFG.WORLD_W;
  const sy = size / CFG.WORLD_H;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 12, 18, 0.72)';
  roundRect(ctx, x0 - 6, y0 - 6, size + 12, size + 12, 10);
  ctx.fill();
  ctx.beginPath();
  ctx.rect(x0, y0, size, size);
  ctx.clip();
  // Land and sea.
  ctx.fillStyle = '#5d9b4a';
  ctx.fillRect(x0, y0, size, size);
  ctx.fillStyle = '#2f7fb8';
  ctx.fillRect(x0, y0 + 2120 * sy, size, size);
  ctx.fillStyle = '#e8d29a';
  ctx.fillRect(x0, y0 + 2120 * sy, size, 10 * sy + 4);
  // Roads.
  ctx.strokeStyle = '#3a3f47';
  ctx.lineWidth = 5;
  for (const rx of S.world.roadsX) {
    ctx.beginPath();
    ctx.moveTo(x0 + rx * sx, y0);
    ctx.lineTo(x0 + rx * sx, y0 + size);
    ctx.stroke();
  }
  for (const ry of S.world.roadsY) {
    ctx.beginPath();
    ctx.moveTo(x0, y0 + ry * sy);
    ctx.lineTo(x0 + size, y0 + ry * sy);
    ctx.stroke();
  }
  // Objective marker.
  const m = currentMission(S);
  if (m) {
    const obj = m.objective;
    ctx.fillStyle = '#ffd23d';
    ctx.beginPath();
    ctx.arc(x0 + obj.x * sx, y0 + obj.y * sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  // Police dots.
  ctx.fillStyle = '#4a90e8';
  for (const car of S.cars) {
    if (car.kind === 'police' && !car.dead) {
      ctx.beginPath();
      ctx.arc(x0 + car.x * sx, y0 + car.y * sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Player arrow.
  const p = S.player;
  ctx.save();
  ctx.translate(x0 + p.x * sx, y0 + p.y * sy);
  ctx.rotate(p.angle);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(7, 0);
  ctx.lineTo(-5, -5);
  ctx.lineTo(-5, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(CITY_NAME, x0, y0 - 8);
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawTitleScreen(S, ctx, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#ff9a3d');
  grad.addColorStop(0.55, '#c94a6a');
  grad.addColorStop(1, '#2b1a4a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Sun, kept clear of the title text.
  ctx.fillStyle = '#ffd23d';
  ctx.beginPath();
  ctx.arc(w * 0.87, h * 0.2, 62, 0, Math.PI * 2);
  ctx.fill();
  // Skyline silhouette.
  ctx.fillStyle = 'rgba(20, 10, 40, 0.85)';
  const base = h * 0.78;
  const heights = [0.22, 0.34, 0.18, 0.4, 0.26, 0.36, 0.2, 0.3, 0.24, 0.38];
  const bw = w / heights.length;
  heights.forEach((hh, i) => {
    ctx.fillRect(i * bw + 6, base - h * hh, bw - 12, h * hh + h * 0.22);
  });
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(GAME_NAME, w / 2, h * 0.34);
  ctx.fillStyle = '#fff';
  ctx.font = '22px sans-serif';
  ctx.fillText(`Kota pesisir ${CITY_NAME} — Raka pulang, dan kota ini punya tagihan untuknya.`, w / 2, h * 0.42);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#ffd23d';
  ctx.fillText('Tekan ENTER untuk mulai  •  Lanjutkan simpanan dengan C', w / 2, h * 0.55);
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('WASD bergerak • E curi mobil • Mouse bidik, klik tembak • P jeda • 3 misi cerita • Wanted 0-5', w / 2, h * 0.62);
  ctx.fillText('Game original. Kota, karakter, dan cerita dibuat untuk game ini.', w / 2, h * 0.9);
  ctx.restore();
}

export function drawEndScreen(S, ctx, w, h, kind) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 16, 0.82)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  if (kind === 'done') {
    ctx.fillStyle = '#7ee787';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('SOLARA MILIKMU', w / 2, h * 0.36);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Semua misi selesai. Raka mengantongi $${S.player.money}.`, w / 2, h * 0.44);
  } else if (kind === 'busted') {
    ctx.fillStyle = '#e84a3d';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('BUSTED!', w / 2, h * 0.36);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Polisi Solara menangkap Raka. Uang hasil misi disita sebagian.', w / 2, h * 0.44);
  } else {
    ctx.fillStyle = '#e84a3d';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('WASTED!', w / 2, h * 0.36);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Raka tumbang di jalanan Solara. Bangkit lagi dan coba sekali lagi.', w / 2, h * 0.44);
  }
  ctx.fillStyle = '#ffd23d';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Tekan ENTER untuk main lagi  •  Tekan T untuk kembali ke menu', w / 2, h * 0.58);
  ctx.restore();
}

export function drawPauseScreen(S, ctx, w, h) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 16, 0.7)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('JEDA', w / 2, h * 0.4);
  ctx.font = '18px sans-serif';
  ctx.fillText('P / Esc lanjut  •  S simpan progres  •  T menu utama  •  M suara', w / 2, h * 0.48);
  ctx.restore();
}
