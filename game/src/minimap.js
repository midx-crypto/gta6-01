// Minimap: a 2D canvas top-down view of Pulau Bara — districts, roads,
// bridges, the player arrow, mission marker, police, helicopter and coins.
import { DISTRICTS } from './config.js';

const MIN_X = -270; const MAX_X = 270;
const MIN_Z = -430; const MAX_Z = 230;

export function drawMinimap(state, canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  const sx = (x) => ((x - MIN_X) / (MAX_X - MIN_X)) * w;
  const sz = (z) => ((z - MIN_Z) / (MAX_Z - MIN_Z)) * h;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1e5a74';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#8a7a5a';
  ctx.fillRect(sx(-260), sz(-200), sx(260) - sx(-260), sz(220) - sz(-200));
  ctx.fillStyle = '#e8d194';
  ctx.fillRect(sx(-160), sz(-420), sx(160) - sx(-160), sz(-240) - sz(-420));
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(sx(d.x0), sz(d.z0), sx(d.x1) - sx(d.x0), sz(d.z1) - sz(d.z0));
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#3a3a40';
  for (const ax of [-200, -120, -40, 40, 120, 200]) ctx.fillRect(sx(ax - 5), sz(-200), 10 * (w / 540), sz(220) - sz(-200));
  for (const szv of [-160, -80, 0, 80, 160]) ctx.fillRect(sx(-260), sz(szv - 5), sx(260) - sx(-260), 10 * (h / 660));
  ctx.fillRect(sx(-128), sz(-240), 16 * (w / 540), sz(-200) - sz(-240));
  ctx.fillRect(sx(112), sz(-240), 16 * (w / 540), sz(-200) - sz(-240));
  ctx.fillStyle = '#c9a02e';
  ctx.fillRect(sx(-80), sz(-420), 8 * (w / 540), sz(-240) - sz(-420));
  ctx.fillRect(sx(80), sz(-420), 8 * (w / 540), sz(-240) - sz(-420));

  for (const coin of state.coins || []) {
    if (coin.taken) continue;
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.arc(sx(coin.x), sz(coin.z), 2, 0, Math.PI * 2); ctx.fill();
  }
  const obj = state.objective;
  if (obj) {
    const pulse = 5 + Math.sin(state.time * 5) * 2;
    ctx.fillStyle = '#ffd23e';
    ctx.beginPath(); ctx.arc(sx(obj.x), sz(obj.z), pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5a00';
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('!', sx(obj.x), sz(obj.z) + 4);
  }
  for (const car of state.policeCars || []) {
    ctx.fillStyle = '#2244ff';
    ctx.beginPath(); ctx.arc(sx(car.x), sz(car.z), 3.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const e of state.enemies || []) {
    if (!e.alive) continue;
    ctx.fillStyle = '#ff2222';
    ctx.beginPath(); ctx.arc(sx(e.x), sz(e.z), 3, 0, Math.PI * 2); ctx.fill();
  }
  if (state.heli && state.heli.active) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(sx(state.player.x), sz(state.player.z), 7, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.save();
  ctx.translate(sx(state.player.x), sz(state.player.z));
  ctx.rotate(Math.PI - state.player.angle);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
}
