// Radio: three original stations, each with its own tempo, scale and step
// pattern. The patterns are data; audio.js turns them into WebAudio notes.
export const RADIO_STATIONS = [
  {
    name: 'BARA FM', genre: 'Funk Pantai', tempo: 116,
    scale: [220, 261.63, 293.66, 329.63, 392, 440, 523.25],
    bass: [110, 110, 130.81, 98],
    pattern: [0, -1, 2, -1, 4, -1, 3, 5, 0, -1, 2, 4, 5, 4, 2, 1],
  },
  {
    name: 'OMBAK CHILL', genre: 'Lo-fi Senja', tempo: 76,
    scale: [196, 220, 246.94, 293.66, 329.63, 392, 440],
    bass: [98, 87.31, 110, 82.41],
    pattern: [0, -1, -1, 2, -1, -1, 4, -1, 3, -1, -1, 2, -1, 1, -1, -1],
  },
  {
    name: 'DANGDUT BARA', genre: 'Dangdut Koplo', tempo: 132,
    scale: [233.08, 261.63, 311.13, 349.23, 415.3, 466.16, 523.25],
    bass: [116.54, 116.54, 146.83, 98],
    pattern: [0, 2, 1, 2, 4, 2, 3, 4, 5, 4, 3, 2, 1, 2, 0, -1],
  },
];

export function stationName(index) {
  return RADIO_STATIONS[((index % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length].name;
}
export function stationGenre(index) {
  return RADIO_STATIONS[((index % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length].genre;
}
export function nextStationIndex(index) { return (index + 1) % RADIO_STATIONS.length; }

// Station blurbs shown on the HUD when the player switches station.
export function stationBlurb(index) {
  const s = RADIO_STATIONS[((index % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length];
  return s.name + ' — ' + s.genre;
}
