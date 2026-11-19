// The garage: Pak Hendra's workshop. Buy engine, nitro and armour upgrades
// for your three owned cars, repair, and buy guns and ammo. Prices rise per
// level; respect rank Legenda unlocks the top level.
export const UPGRADE_DEFS = {
  engine: { name: 'Mesin', prices: [250, 500, 900], desc: '+4 km/jam top speed per level' },
  nitro: { name: 'Nitro', prices: [200, 400, 700], desc: 'Boost lebih kuat dan tahan lama' },
  armor: { name: 'Armor', prices: [200, 400, 700], desc: '+25 max health per level' },
};
export const REPAIR_PRICE = 50;

export function upgradePrice(kind, level) {
  const def = UPGRADE_DEFS[kind];
  if (!def || level >= def.prices.length) return null;
  return def.prices[level];
}

export function buyUpgrade(state, carIndex, kind) {
  const car = state.owned[carIndex];
  if (!car) return false;
  const level = car[kind];
  const price = upgradePrice(kind, level);
  if (price === null) { state.message = UPGRADE_DEFS[kind].name + ' sudah max.'; state.messageTimer = 2; return false; }
  if (level >= 2 && state.respect < 500) {
    state.message = 'Level 3 butuh rank Legenda (500 respect).';
    state.messageTimer = 2.5;
    return false;
  }
  if (state.money < price) { state.message = 'Uang tidak cukup.'; state.messageTimer = 2; return false; }
  state.money -= price;
  car[kind] += 1;
  if (kind === 'armor') state.maxHealth = 100 + car.armor * 25;
  state.message = UPGRADE_DEFS[kind].name + ' ' + car.name + ' naik ke level ' + car[kind] + '.';
  state.messageTimer = 2.5;
  return true;
}

export function repairCar(state) {
  if (state.money < REPAIR_PRICE) { state.message = 'Uang tidak cukup untuk servis.'; state.messageTimer = 2; return false; }
  state.money -= REPAIR_PRICE;
  state.health = state.maxHealth;
  state.nitro = 100;
  state.message = 'Mobil diservis: health penuh, nitro penuh.';
  state.messageTimer = 2.5;
  return true;
}

export function switchActiveCar(state, index) {
  if (!state.owned[index]) return false;
  state.activeOwned = index;
  state.message = 'Mobil aktif: ' + state.owned[index].name;
  state.messageTimer = 2;
  return true;
}

export function openGarage(state) {
  state.previousMode = state.mode === 'garage' ? 'play' : state.mode;
  state.mode = 'garage';
}
export function closeGarage(state) {
  state.mode = 'play';
}
export function nearGarage(state) {
  return Math.hypot(state.player.x - (-190), state.player.z - 140) < 14;
}

// Garage menu rows for the HUD: one row per car, one per upgrade.
export function garageRows(state) {
  return state.owned.map((car, i) => ({
    index: i,
    name: car.name,
    active: i === state.activeOwned,
    engine: car.engine, nitro: car.nitro, armor: car.armor,
    enginePrice: upgradePrice('engine', car.engine),
    nitroPrice: upgradePrice('nitro', car.nitro),
    armorPrice: upgradePrice('armor', car.armor),
  }));
}
export function carTopSpeedWithUpgrades(car) {
  return 46 + car.engine * 4 + car.nitro * 1.5;
}
