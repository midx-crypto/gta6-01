// Weapons: the three guns, their stats, ammo economy and the weapon wheel.
// The wheel is a DOM overlay; this module owns selection and reloading rules.
export const WEAPON_LIST = ['pistol', 'smg', 'shotgun'];
export const WEAPON_LABELS = { pistol: 'Pistol', smg: 'SMG', shotgun: 'Shotgun' };
export const WEAPON_PRICES = { smg: 400, shotgun: 600 };
export const AMMO_PRICES = { pistol: 40, smg: 80, shotgun: 100 };

export function hasWeapon(state, id) {
  const w = state.weapons[id];
  return w && (w.ammo > 0 || w.reserve > 0 || id === 'pistol');
}
export function giveWeapon(state, id, ammo, reserve) {
  const w = state.weapons[id];
  if (!w) return false;
  w.ammo += ammo;
  w.reserve += reserve;
  return true;
}
export function selectWeapon(state, id) {
  if (!WEAPON_LIST.includes(id)) return false;
  if (!hasWeapon(state, id)) {
    state.message = WEAPON_LABELS[id] + ' belum kamu miliki. Beli di garasi? Tidak — temukan di jalan.';
    state.messageTimer = 2.5;
    return false;
  }
  state.currentWeapon = id;
  return true;
}
export function reloadWeapon(state) {
  const w = state.weapons[state.currentWeapon];
  if (!w || w.reserve <= 0) return false;
  const magSize = state.currentWeapon === 'pistol' ? 12 : state.currentWeapon === 'smg' ? 30 : 6;
  const need = magSize - w.ammo;
  if (need <= 0) return false;
  const take = Math.min(need, w.reserve);
  w.ammo += take;
  w.reserve -= take;
  return true;
}
export function buyAmmo(state, id) {
  const price = AMMO_PRICES[id];
  if (state.money < price) { state.message = 'Uang tidak cukup untuk amunisi.'; state.messageTimer = 2; return false; }
  state.money -= price;
  giveWeapon(state, id, 0, id === 'pistol' ? 60 : id === 'smg' ? 90 : 18);
  state.message = 'Amunisi ' + WEAPON_LABELS[id] + ' dibeli.';
  state.messageTimer = 2;
  return true;
}

// The garage also sells the SMG and Shotgun; the wheel only lists owned guns.
export function buyWeapon(state, id) {
  const price = WEAPON_PRICES[id];
  if (state.money < price) { state.message = 'Uang tidak cukup untuk ' + WEAPON_LABELS[id] + '.'; state.messageTimer = 2; return false; }
  if (hasWeapon(state, id) && state.weapons[id].ammo + state.weapons[id].reserve > 0) {
    state.message = WEAPON_LABELS[id] + ' sudah kamu miliki.';
    state.messageTimer = 2;
    return false;
  }
  state.money -= price;
  giveWeapon(state, id, id === 'smg' ? 30 : 6, id === 'smg' ? 90 : 18);
  state.message = WEAPON_LABELS[id] + ' dibeli! Tekan 2/3 untuk pakai.';
  state.messageTimer = 3;
  return true;
}
