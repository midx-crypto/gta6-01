// HUD: DOM overlay — health, money, respect, wanted stars, speedometer,
// nitro bar, ammo, radio, objective, district, minimap, messages and every
// screen overlay (title, pause, mission, garage, weapon wheel, busted...).
import { wantedStars, formatMoney } from './config.js';
import { stationBlurb } from './radio.js';
import { rankName } from './respect.js';
import { dayIntro } from './days.js';
import { drawMinimap } from './minimap.js';
import { garageRows, REPAIR_PRICE } from './garage.js';
import { currentSpeedKmh } from './driving.js';
import { districtNameAt } from './districts.js';

function $(id) { return document.getElementById(id); }

export function buildHUD(state, actions) {
  const minimap = $('minimap');
  document.querySelectorAll('#screen-title button, #screen-pause button, #screen-missiondone button, #screen-missionfail button, #screen-busted button, #screen-wasted button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'start') actions.onStart(false);
      else if (action === 'continue') actions.onStart(true);
      else if (action === 'resume') actions.onResume();
      else if (action === 'save-quit') actions.onSaveQuit();
      else if (action === 'next-mission') actions.onNextMission();
      else if (action === 'retry-mission') actions.onRetryMission();
      else if (action === 'respawn') actions.onRespawn();
    });
  });
  $('garage-close').addEventListener('click', () => actions.onCloseGarage());
  $('garage-menu').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-buy]');
    if (!btn) return;
    const [kind, index] = btn.dataset.buy.split(':');
    if (kind === 'repair') actions.onRepair();
    else if (kind === 'weapon') actions.onBuyWeapon(btn.dataset.weapon);
    else if (kind === 'ammo') actions.onBuyAmmo(btn.dataset.weapon);
    else if (kind === 'car') actions.onSwitchCar(Number(index));
    else actions.onBuyUpgrade(Number(index), kind);
  });
  $('weapon-wheel').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-weapon]');
    if (btn) actions.onSelectWeapon(btn.dataset.weapon);
  });
  return { minimap };
}

let lastTextUpdate = 0;
export function updateHUD(state, hud, dt) {
  const now = performance.now();
  if (now - lastTextUpdate > 120) {
    lastTextUpdate = now;
    $('hud-money').textContent = formatMoney(state.money);
    $('hud-respect').textContent = rankName(state) + ' (' + state.respect + ')';
    $('hud-day').textContent = 'HARI ' + state.day + '/3';
    $('hud-wanted').textContent = wantedStars(state.wanted);
    $('hud-wanted').style.color = state.wanted >= 4 ? '#ff4444' : '#ffd23e';
    $('hud-health-fill').style.width = Math.max(0, state.health) + '%';
    $('hud-health-num').textContent = Math.ceil(Math.max(0, state.health));
    $('hud-speed').textContent = currentSpeedKmh(state);
    $('hud-nitro-fill').style.width = state.nitro + '%';
    const w = state.weapons[state.currentWeapon];
    $('hud-weapon').textContent = w.name;
    $('hud-ammo').textContent = w.ammo + ' / ' + w.reserve;
    $('hud-radio').textContent = state.radioOn ? '♪ ' + stationBlurb(state.radioStation) : '♪ Radio mati (Q)';
    $('hud-district').textContent = districtNameAt(state.player.x, state.player.z);
    $('hud-coins').textContent = 'Koin ' + state.coinsGot + '/' + state.coinsTotal;
    $('hud-objective').textContent = '► ' + state.objective.text;
    $('hud-message').textContent = state.messageTimer > 0 ? state.message : '';
    $('hud-mission').textContent = state.mission ? ('MISI ' + state.mission.id + ': ' + state.mission.title) : 'Bebas — tekan J untuk job, G di garasi';
    $('hud-timer').textContent = state.missionTimer > 0 ? '⏱ ' + Math.ceil(state.missionTimer) + ' dtk' : '';
    $('hud-stunt').textContent = state.airScore > 0 ? 'Stunt: ' + state.airScore + ' poin' : '';
  }
  if (hud.minimap) drawMinimap(state, hud.minimap);
  $('hud').style.display = (state.mode === 'title' || state.mode === 'daycard') ? 'none' : 'block';
  $('crosshair').style.display = (state.mode === 'play' && state.player.onFoot) ? 'block' : 'none';
}
