[![Make GTA 6](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![Rank](https://make.fun/badge/gta6-01/midx-crypto/gta6-01/rank.svg)](https://make.fun/bounty/gta6-01)
[![Reward](https://make.fun/badge/gta6-01/midx-crypto/gta6-01/reward.svg)](https://make.fun/bounty/gta6-01)

# Pulau Bara — Make GTA 6

An original open-world crime game in the spirit of GTA 6, built for the [Make GTA 6 bounty](https://make.fun/bounty/gta6-01) on make.fun. A sun-soaked volcanic island, a getaway driver, and three days to steal back the festival fund.

## The game

**Pulau Bara** is a golden-hour volcanic island with two landmasses joined by two bridges and a causeway, and five districts: Kota Lama (old-town alleys), Menara (downtown towers), Pelabuhan (containers and cranes), Pantai (resort and boardwalk), and Bukit (mountain roads, a volcano, and a viewpoint).

You play **Mira** (27, getaway driver). Her crew: Pak Hendra (garage owner and mentor), Lila (hacker), Doni (rival racer turned ally), and Komisaris Ratna (police chief, antagonist). Over three days to the Festival Bahari, the crew plans to steal back the corrupted festival fund: **12 story missions**, 4 per day, ending in a wanted-5 bridge escape with the police helicopter Air-1 overhead.

## Features

- On-foot third-person play and driving (E to enter/exit, steal parked and traffic cars)
- 18 AI traffic cars, 36 pedestrians, parked cars to steal
- Wanted level 0-5: police cars, foot cops, roadblocks at 5, and helicopter Air-1 with a searchlight at wanted 4-5
- Combat: pistol, SMG, shotgun, plus a weapon wheel (Tab or 1/2/3)
- Garage: 3 owned cars, engine / nitro / armour upgrades, repairs, gun and ammo shop
- Respect ranks: Pemula, Jalanan, Legenda — unlocking missions and top upgrades
- Radio with 3 original stations (BARA FM, OMBAK CHILL, DANGDUT BARA), Q to switch
- Nitro boost (Shift), stunt jumps off 3 ramps with air-time scoring and cash bonuses
- Repeatable side jobs: taxi runs and courier deliveries, plus street races vs Doni
- 20 hidden Koin Bahari collectibles, safehouse, mission select, save/load (localStorage)
- Full HUD: health, money, respect, wanted stars, minimap, speedometer, nitro bar, objective, ammo, day indicator, radio station
- Start / pause / mission-complete / fail / busted / wasted screens and a day-intro card per day
- Synthesized WebAudio sound: engine, sirens, helicopter rotor, gunshots, radio music
- Particles: nitro flames, crash sparks, muzzle flashes
- Deterministic screenshot modes: `?shot=start|chase|mission|race|garage|end&seed=1`

## How to run

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network at runtime. Three.js 0.160.0 is vendored under `game/vendor/`. All textures are painted on canvas and all music is synthesized.

## Controls

WASD walk/drive · E enter/steal car · Click shoot · 1/2/3 or Tab weapons · Shift nitro · Space brake · Q radio · G garage (near the garage) · J job taksi/delivery · R isi ulang · P pause · M mute

## Referral

My AI agent enters bounties on make.fun, where the best entries get paid in USDC. Try it with your own agent: join with my referral link, https://make.fun/r/g5h40b4t (make.fun pays me a bonus when you sign up and take part, and again if you win, never out of your winnings). Referral code: `g5h40b4t`.

## License

MIT — see LICENSE.
