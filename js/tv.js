"use strict";

// Smart TV launcher.
// Spatial focus, immersive backdrops, and one command path for keyboard, TV remotes,
// the on-screen pad, gamepads, and pointer input.

const PREVIEW_SECONDS = 60;
const STORAGE_KEY = "smarttv.v13";
const SAMPLE_PROGRESS = { "night-market": 0.42, "copper-line": 0.18 };
const IDLE_AMBIENT_MS = 120000;
const OSD_HIDE_MS = 4000;
const LONG_PRESS_MS = 550;
const UP_NEXT_MS = 8000;
const HERO_ROTATE_MS = 9000;

const catalog = [
  { id: "night-market", title: "Night Market", kind: "movie", genre: "Drama", year: 2024, minutes: 112, blurb: "A cook inherits a stall and the debts of the night shift.", colors: ["#241610", "#e07a45"] },
  { id: "salt-signal", title: "Salt and Signal", kind: "movie", genre: "Thriller", year: 2025, minutes: 104, blurb: "A radio operator traces a voice that only arrives with the tide.", colors: ["#102028", "#3ec7c2"] },
  { id: "glass-season", title: "Glass Season", kind: "movie", genre: "Romance", year: 2022, minutes: 98, blurb: "Two glaziers share a route and a winter they cannot postpone.", colors: ["#2a1c28", "#f0a0c0"] },
  { id: "last-tram", title: "The Last Tram", kind: "movie", genre: "Mystery", year: 2023, minutes: 121, blurb: "The final car of the night keeps a passenger who never boards.", colors: ["#1a1814", "#e0c36a"] },
  { id: "paper-kingdoms", title: "Paper Kingdoms", kind: "movie", genre: "Family", year: 2021, minutes: 96, blurb: "A librarian builds a city that folds flat at closing time.", colors: ["#2a2418", "#f0c48a"] },
  { id: "low-voltage", title: "Low Voltage", kind: "movie", genre: "Sci-fi", year: 2025, minutes: 118, blurb: "A repair crew keeps a district lit after the grid goes quiet.", colors: ["#10182a", "#7aa2ff"] },
  { id: "open-window", title: "Open Window", kind: "movie", genre: "Drama", year: 2026, minutes: 109, blurb: "Neighbors pass a summer by talking across one shared courtyard.", colors: ["#1c2418", "#b6d48a"] },
  { id: "warm-static", title: "Warm Static", kind: "movie", genre: "Comedy", year: 2020, minutes: 94, blurb: "A late-night host tries to finish one sincere episode.", colors: ["#2a1618", "#ff8b7a"] },
  { id: "copper-line", title: "Copper Line", kind: "show", genre: "Mystery", year: 2023, minutes: 48, blurb: "Transit police follow a theft that only happens between stations.", colors: ["#141c28", "#d08a4a"] },
  { id: "harbor-lights", title: "Harbor Lights", kind: "show", genre: "Drama", year: 2024, minutes: 52, blurb: "A port town keeps score of every ship that leaves after dark.", colors: ["#102030", "#6ec8ff"] },
  { id: "north-ordinary", title: "North of Ordinary", kind: "show", genre: "Comedy", year: 2022, minutes: 26, blurb: "A weather intern is posted to a town that does not need a forecast.", colors: ["#1a2430", "#f2d27a"] },
  { id: "small-constellations", title: "Small Constellations", kind: "show", genre: "Family", year: 2025, minutes: 24, blurb: "Kids map their block as if each porch light were a star.", colors: ["#241838", "#c9b6ff"] },
  { id: "field-notes", title: "Field Notes", kind: "show", genre: "Documentary", year: 2021, minutes: 44, blurb: "One researcher films a year of soil, rain, and lunch.", colors: ["#1c2818", "#9dcc74"] },
  { id: "blue-appointment", title: "Blue Appointment", kind: "show", genre: "Drama", year: 2026, minutes: 56, blurb: "A clinic night shift trades stories between appointments.", colors: ["#101828", "#8eb4ff"] },
  { id: "evening-desk", title: "Evening Desk", kind: "live", genre: "News", year: 2026, minutes: 0, blurb: "A calm half hour on the city, the weather, and late transit.", colors: ["#1a2744", "#6aa6ff"] },
  { id: "match-day", title: "Match Day", kind: "live", genre: "Sport", year: 2026, minutes: 0, blurb: "The local fixture, from the tunnel to the last whistle.", colors: ["#142616", "#7dce78"] },
  { id: "city-cam", title: "City Cam", kind: "live", genre: "Travel", year: 2026, minutes: 0, blurb: "A locked-off camera on the river, with no commentary.", colors: ["#10242a", "#78ddd4"] },
  { id: "concert-hour", title: "Concert Hour", kind: "live", genre: "Music", year: 2026, minutes: 0, blurb: "One stage, one hour, and the room noise left in.", colors: ["#2a1424", "#ff8ad4"] }
];

// Streaming services open in Chrome. If you already made a Chrome shortcut for one,
// the tile opens that shortcut instead (same name), so it keeps your sign-in and window.
const STREAMING = [
  { id: "netflix", name: "Netflix", mode: "web", url: "https://www.netflix.com/browse", blurb: "Films and series. Opens in Chrome.", colors: ["#140405", "#e50914"], word: "netflix" },
  { id: "sabcplus", name: "SABC Plus", mode: "web", url: "https://www.sabc-plus.com/", blurb: "SABC channels, live and on demand. Opens in Chrome.", colors: ["#061a33", "#2b8fe8"], word: "sabc" },
  { id: "dstv", name: "DStv", mode: "web", url: "https://now.dstv.com/", blurb: "DStv Stream: live channels and catch-up. Opens in Chrome.", colors: ["#03112a", "#1673ff"], word: "dstv" },
  { id: "spotify", name: "Spotify", mode: "web", url: "https://open.spotify.com/", blurb: "Music and podcasts. Opens in Chrome.", colors: ["#06140b", "#1ed760"], word: "spotify" },
  { id: "ytmusic", name: "YouTube Music", mode: "web", url: "https://music.youtube.com/", blurb: "Songs, albums, and mixes. Opens in Chrome.", colors: ["#170405", "#ff2a2a"], word: "ytmusic" }
];

const apps = [
  { id: "files", name: "My PC", icon: "pc", mode: "files", blurb: "Videos, music, and photos on this computer.", colors: ["#16202e", "#8ab4ff"] },
  { id: "cinema", name: "Cinema", icon: "film", mode: "kind", kind: "movie", blurb: "Films on this launcher.", colors: ["#3a1d14", "#e07a45"] },
  { id: "series", name: "Series", icon: "layers", mode: "kind", kind: "show", blurb: "Series and shorter episodes.", colors: ["#142033", "#7eb6ff"] },
  { id: "livedesk", name: "Live Desk", icon: "broadcast", mode: "kind", kind: "live", blurb: "The channels on the live row.", colors: ["#2a1216", "#ff6b6b"] },
  { id: "spotlight", name: "Spotlight", icon: "sparkle", mode: "all", blurb: "Every title on this TV.", colors: ["#241a33", "#d2b4ff"] },
  { id: "shelf", name: "My List", icon: "bookmark", mode: "list", blurb: "Titles you saved on this TV.", colors: ["#14261c", "#8fd0a8"] },
  { id: "weather", name: "Weather", icon: "sun", mode: "panel", blurb: "Clear over the demo city. This panel is a sample, not a live forecast.", colors: ["#163042", "#9ad7ff"] }
];

const paths = [
  {
    id: "streamer",
    title: "Google TV Streamer",
    body: "Plug a Google TV Streamer into the TV HDMI port and into power. Switch the TV to that HDMI input. Pair the voice remote, join Wi-Fi or Ethernet, and sign in with a Google account. Setup can run in the Google Home app or on the TV with the remote. An older Chromecast with Google TV uses this same HDMI setup. The streamer draws the home screen. The television stays the display."
  },
  {
    id: "builtin",
    title: "A set that already has Google TV",
    body: "Some Sony, TCL, Hisense, and Philips models ship with Google TV. Android TV is the platform underneath. Google TV is the home screen on current devices. Use the remote that came with the set and sign in with a Google account."
  },
  {
    id: "launcher",
    title: "This launcher",
    body: "Open index.html in a browser, or serve this folder and open the address on the TV browser. Press F for fullscreen. Arrows move, Enter opens, and Esc goes back. This demo keeps a list and a one-minute preview. It does not install the Play Store, and it does not change TV firmware."
  }
];

const FEATURED_IDS = ["low-voltage", "harbor-lights", "open-window", "match-day", "salt-signal"];
const TOP_TEN_IDS = ["harbor-lights", "low-voltage", "night-market", "copper-line", "open-window", "blue-appointment", "salt-signal", "small-constellations", "last-tram", "glass-season"];
const EPISODE_NAMES = ["Pilot", "The Long Way Round", "Signal and Noise", "Crossing", "Low Tide", "Night Shift", "Open Door", "Last Light"];
const GENRES = [...new Set(catalog.map((item) => item.genre))];
const KB_KEYS = "abcdefghijklmnopqrstuvwxyz1234567890".split("");
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;

const NAV = [
  { id: "search", label: "Search", icon: "search", iconOnly: true },
  { id: "home", label: "Home", icon: "home" },
  { id: "apps", label: "Apps", icon: "apps" },
  { id: "files", label: "My PC", icon: "pc" },
  { id: "list", label: "My List", icon: "bookmark" },
  { id: "settings", label: "Settings", icon: "sliders", iconOnly: true }
];

const SETTINGS_TABS = [
  { id: "display", label: "Display & motion" },
  { id: "wallpaper", label: "Wallpaper" },
  { id: "sound", label: "Sound" },
  { id: "playback", label: "Playback" },
  { id: "input", label: "Remote & keys" },
  { id: "googletv", label: "Get Google TV" },
  { id: "about", label: "About & reset" }
];

const DEFAULT_PREFS = {
  reduceMotion: false,
  largeText: false,
  sounds: false,
  ambient: true,
  autoplayNext: true,
  captions: false,
  remoteOpen: false,
  seenTips: false,
  wallpaper: "desktop",
  appVolume: 0.8
};

// The companion (server.py) unlocks files, Chrome shortcuts, wallpaper, system volume, and sources.
const server = {
  ok: false,
  canLaunch: false,
  volume: false,
  wallpaper: false,
  key: new URLSearchParams(location.search).get("key") || ""
};

const state = {
  screen: "home",
  focusKey: null,
  stack: [],
  appId: null,
  mediaId: null,
  query: "",
  helpId: "streamer",
  settingsTab: "display",
  heroIndex: 0,
  progress: {},
  watchedAt: {},
  mediaProgress: {},
  path: null,
  media: null,
  list: new Set(),
  prefs: { ...DEFAULT_PREFS },
  position: 0,
  playing: false,
  osdUntil: 0,
  upNext: null,
  overlay: null
};

const memory = Object.create(null);

const ui = {
  instantScroll: false,
  noScroll: false,
  hint: null,
  inputMode: "key",
  lastInput: Date.now(),
  lastMove: 0,
  lastTick: 0,
  lastSave: 0,
  heroChangedAt: Date.now(),
  press: null,
  sheetActions: [],
  sheetReturn: null,
  bdActive: 0,
  bdKey: "",
  bdTimer: 0,
  fiTimer: 0,
  tabTimer: 0,
  paneTimer: 0,
  idleTimer: 0,
  ambientTimer: 0,
  ambientIdx: 0,
  listening: false,
  rec: null,
  pointer: { x: -1, y: -1 },
  audio: null,
  gpRaf: 0,
  gp: {},
  chromeApps: [],
  library: null,
  places: null,
  lists: {},
  loading: {},
  away: false,
  wasFullscreen: false,
  refullscreen: false,
  volume: { level: 0.5, muted: false, known: false },
  volTimer: 0,
  volBusy: false,
  slideTimer: 0,
  pointerScroll: false,
  mediaSaveAt: 0,
  wallUrl: "",
  signalTimer: 0
};

/* ---------- Icons ---------- */

const ICONS = {
  play: '<path class="f" d="M7.5 4.9v14.2c0 .8.9 1.3 1.6.9l11.4-7.1c.6-.4.6-1.4 0-1.8L9.1 4C8.4 3.6 7.5 4.1 7.5 4.9z"/>',
  pause: '<rect class="f" x="6" y="4.5" width="4.2" height="15" rx="1.3"/><rect class="f" x="13.8" y="4.5" width="4.2" height="15" rx="1.3"/>',
  playpause: '<path class="f" d="M3.5 6.5v11l8-5.5z"/><path d="M15 6.5v11M20 6.5v11"/>',
  next: '<path class="f" d="M5 6.2v11.6c0 .7.8 1.1 1.4.7l8.4-5.8c.5-.4.5-1.1 0-1.4L6.4 5.5C5.8 5.1 5 5.5 5 6.2z"/><path d="M18.5 5.5v13"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.01"/>',
  home: '<path d="M4 11l8-6.5 8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  apps: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
  bookmark: '<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  sliders: '<path d="M4 7h9M18 7h2M4 17h3M12 17h8"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="9.5" cy="17" r="2.3"/>',
  chevL: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  chevR: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  chevU: '<path d="M5.5 14.5L12 8l6.5 6.5"/>',
  chevD: '<path d="M5.5 9.5L12 16l6.5-6.5"/>',
  restart: '<path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4"/><path d="M4.5 4.5V9H9"/>',
  back10: '<path d="M4.8 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 3.8v4.6h4.6"/><text x="12.6" y="15.3" text-anchor="middle">10</text>',
  fwd10: '<path d="M19.2 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 3.8v4.6h-4.6"/><text x="11.4" y="15.3" text-anchor="middle">10</text>',
  cc: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M10.6 10.3a2.3 2.3 0 1 0 0 3.4M17.1 10.3a2.3 2.3 0 1 0 0 3.4"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
  del: '<path d="M9 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5.5-6z"/><path d="M12 10l4 4M16 10l-4 4"/>',
  space: '<path d="M4.5 10.5v3.5h15v-3.5"/>',
  remote: '<rect x="8" y="2.5" width="8" height="19" rx="4"/><circle cx="12" cy="8" r="1.7"/><path d="M12 13.2v.01M12 16.6v.01"/>',
  dots: '<circle class="f" cx="6" cy="12" r="1.6"/><circle class="f" cx="12" cy="12" r="1.6"/><circle class="f" cx="18" cy="12" r="1.6"/>',
  film: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4"/>',
  layers: '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5"/><path d="M3.5 16.4L12 20.9l8.5-4.5"/>',
  broadcast: '<circle cx="12" cy="12" r="2"/><path d="M8.2 15.8a5.4 5.4 0 0 1 0-7.6M15.8 8.2a5.4 5.4 0 0 1 0 7.6M5.3 18.7a9.5 9.5 0 0 1 0-13.4M18.7 5.3a9.5 9.5 0 0 1 0 13.4"/>',
  sparkle: '<path d="M11 3.5l1.9 5.3 5.3 1.9-5.3 1.9L11 17.9l-1.9-5.3-5.3-1.9 5.3-1.9z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/>',
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.6 4.5 4.5 0 0 0 7 18.5z"/>',
  volume: '<path class="f" d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11"/>',
  volumeLow: '<path class="f" d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/>',
  mute: '<path class="f" d="M4 9.5h3.2L12 5.6v12.8l-4.8-3.9H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>',
  volUp: '<path d="M5 12h14M12 5v14"/>',
  volDown: '<path d="M5 12h14"/>',
  input: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/><path d="M9 10.5h6M12.5 8l2.5 2.5-2.5 2.5"/>',
  pc: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20"/>',
  folder: '<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.2h7a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  file: '<path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5z"/><path d="M13.5 3.5V8h4.5"/>',
  music: '<path d="M9 17.5V6l10-2v11.5"/><circle cx="6.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="15.5" r="2.5"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  desktop: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8.5 20h7M12 16.5V20M6 8h3v2.5H6z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.4 3.8 5.2 3.8 8.5S14.6 18.1 12 20.5C9.4 18.1 8.2 15.3 8.2 12S9.4 5.9 12 3.5z"/>',
  tv: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 20h8M9.5 2.5L12 5l2.5-2.5"/>',
  prev: '<path class="f" d="M19 6.2v11.6c0 .7-.8 1.1-1.4.7l-8.4-5.8c-.5-.4-.5-1.1 0-1.4l8.4-5.8c.6-.4 1.4 0 1.4.7z"/><path d="M5.5 5.5v13"/>',
  drive: '<rect x="3" y="7" width="18" height="10" rx="2.5"/><path d="M7 12h.01M10.5 12h6"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4v4.5H15"/>'
};

function icon(name, cls = "") {
  return `<svg class="ic${cls ? ` ${cls}` : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ""}</svg>`;
}

/* ---------- Helpers ---------- */

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function mod(value, size) {
  return ((value % size) + size) % size;
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function artOf(colors, seed) {
  const h = hash(seed);
  const x = 22 + (h % 56);
  const y = 14 + ((h >>> 8) % 40);
  return {
    cls: `art m${(h >>> 16) % 3}`,
    style: `--a:${colors[0]};--b:${colors[1]};--x:${x}%;--y:${y}%`
  };
}

function itemById(id) {
  return catalog.find((item) => item.id === id);
}

function streamingApps() {
  return STREAMING.map((app) => {
    const match = ui.chromeApps.find((c) => c.name.toLowerCase() === app.name.toLowerCase()
      || c.name.toLowerCase().startsWith(`${app.name.toLowerCase()} `));
    return match ? { ...app, chromeId: match.id, iconSrc: match.hasIcon ? iconUrl(match.id) : "" } : app;
  });
}

function chromeOnlyApps() {
  const taken = new Set(streamingApps().map((a) => a.chromeId).filter(Boolean));
  return ui.chromeApps.filter((c) => !taken.has(c.id)).map((c) => ({
    id: `chrome-${c.id}`,
    name: c.name.split(" - ")[0].trim(),
    fullName: c.name,
    mode: "chrome",
    chromeId: c.id,
    iconSrc: c.hasIcon ? iconUrl(c.id) : "",
    blurb: `Your ${c.browser} shortcut. Opens in its own window.`,
    colors: [`hsl(${hash(c.id) % 360} 35% 14%)`, `hsl(${hash(c.id) % 360} 55% 42%)`]
  }));
}

function allApps() {
  return [...streamingApps(), ...chromeOnlyApps(), ...apps];
}

function appById(id) {
  return allApps().find((app) => app.id === id);
}

/* ---------- Companion API ---------- */

function withKey(url) {
  return server.key ? `${url}${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(server.key)}` : url;
}

function fileUrl(path) {
  return withKey(`/api/file?path=${encodeURIComponent(path)}`);
}

function iconUrl(id) {
  return withKey(`/api/icon?id=${encodeURIComponent(id)}`);
}

async function api(path, body) {
  const opts = { headers: {} };
  if (server.key) opts.headers["X-TV-Key"] = server.key;
  if (body !== undefined) {
    opts.method = "POST";
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${res.status} ${res.statusText}`);
  return data;
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

function baseName(path) {
  return String(path).split(/[\\/]/).filter(Boolean).pop() || path;
}

function folderOf(path) {
  const parts = String(path).split(/[\\/]/).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 2] : "";
}

function stripExt(name) {
  return name.replace(/\.[^.]+$/, "");
}

function extOf(name) {
  const m = /\.([^.]+)$/.exec(name);
  return m ? m[1].toUpperCase() : "";
}

function byKind(kind) {
  return catalog.filter((item) => item.kind === kind);
}

function kindLabel(kind) {
  if (kind === "movie") return "Movie";
  if (kind === "show") return "Series";
  return "Live";
}

function progressOf(id) {
  return state.progress[id] || 0;
}

function isResumable(id) {
  const p = progressOf(id);
  return p > 0.02 && p < 0.98;
}

function hoursMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

function liveInfo(item) {
  const slot = 30;
  const now = new Date();
  const minute = (now.getMinutes() % slot) + now.getSeconds() / 60;
  const into = (minute + (hash(item.id) % slot)) % slot;
  return { progress: into / slot, left: Math.max(1, Math.ceil(slot - into)) };
}

function runtimeText(item) {
  if (item.kind === "live") return `Ends in ${liveInfo(item).left} min`;
  if (item.kind === "show") return `8 episodes · ${item.minutes}m`;
  return hoursMinutes(item.minutes);
}

function remainingText(item) {
  const left = Math.max(1, Math.round(item.minutes * (1 - progressOf(item.id))));
  return `${left} min left`;
}

function ratingOf(item) {
  const map = { Family: "All", Documentary: "7+", Thriller: "16+", News: "All", Sport: "All", Travel: "All", Music: "All" };
  return map[item.genre] || "13+";
}

function qualityOf(item) {
  if (item.kind === "live") return ["HD"];
  return item.year >= 2023 ? ["4K", "HDR"] : ["HD"];
}

function chipsHtml(item) {
  const boxed = [ratingOf(item), ...qualityOf(item)].map((text) => `<span class="chip">${esc(text)}</span>`).join("");
  const plain = [item.kind === "live" ? "On now" : String(item.year), runtimeText(item), item.genre].map(esc).join(" · ");
  const live = item.kind === "live" ? '<span class="chip chip--live">Live</span>' : "";
  return `<div class="chips">${live}${boxed}<span class="chip-plain">${plain}</span></div>`;
}

function captionFor(item) {
  if (isResumable(item.id)) return remainingText(item);
  if (item.kind === "live") return `${item.genre} · ends in ${liveInfo(item).left} min`;
  if (item.kind === "show") return `${item.genre} · Series`;
  return `${item.genre} · ${hoursMinutes(item.minutes)}`;
}

function resumeLine(item) {
  const pct = Math.round(progressOf(item.id) * 100);
  return `<div class="resume-line"><span class="meter"><span style="width:${pct}%"></span></span><span>${esc(remainingText(item))}</span></div>`;
}

function motionReduced() {
  return state.prefs.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatClock(totalSeconds) {
  const whole = Math.max(0, Math.round(totalSeconds || 0));
  if (whole >= 3600) {
    const h = Math.floor(whole / 3600);
    return `${h}:${String(Math.floor((whole % 3600) / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  }
  return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
}

function continueItems() {
  return catalog
    .filter((item) => isResumable(item.id))
    .sort((a, b) => (state.watchedAt[b.id] || 0) - (state.watchedAt[a.id] || 0));
}

function featuredList() {
  const list = FEATURED_IDS.map(itemById).filter(Boolean);
  const resume = continueItems()[0];
  return resume ? [resume, ...list.filter((item) => item.id !== resume.id)] : list;
}

function currentFeatured() {
  const list = featuredList();
  return list[mod(state.heroIndex, list.length)];
}

function nextItem(item) {
  const list = byKind(item.kind);
  if (list.length < 2) return null;
  return list[(list.indexOf(item) + 1) % list.length];
}

/* ---------- Storage ---------- */

function load() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    saved = null;
  }
  state.progress = saved && saved.progress && typeof saved.progress === "object" ? saved.progress : { ...SAMPLE_PROGRESS };
  state.watchedAt = saved && saved.watchedAt && typeof saved.watchedAt === "object" ? saved.watchedAt : {};
  state.mediaProgress = saved && saved.mediaProgress && typeof saved.mediaProgress === "object" ? saved.mediaProgress : {};
  state.list = new Set(saved && Array.isArray(saved.list) ? saved.list.filter(itemById) : []);
  state.prefs = { ...DEFAULT_PREFS, ...(saved && saved.prefs ? saved.prefs : {}) };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      progress: state.progress,
      watchedAt: state.watchedAt,
      mediaProgress: state.mediaProgress,
      list: [...state.list],
      prefs: state.prefs
    }));
  } catch {
    /* keep going if the browser blocks storage */
  }
}

function saveProgress() {
  if (!state.mediaId) return;
  state.progress[state.mediaId] = Math.min(1, state.position / PREVIEW_SECONDS);
  state.watchedAt[state.mediaId] = Date.now();
  save();
}

function applyPrefs() {
  const root = document.documentElement;
  root.classList.toggle("reduce-motion", motionReduced());
  root.classList.toggle("large-text", !!state.prefs.largeText);
}

/* ---------- Markup: shared pieces ---------- */

function navCurrent(id) {
  const base = state.stack.length ? state.stack[0].screen : state.screen;
  if (id === "apps" && base === "app") return true;
  return base === id;
}

function topbar() {
  const tabs = NAV.map((tab) => {
    const current = navCurrent(tab.id);
    return `<button type="button" class="tab${tab.iconOnly ? " tab--icon" : ""}" data-key="nav-${tab.id}" data-action="nav" data-id="${tab.id}" aria-label="${tab.label}"${current ? ' aria-current="page"' : ""}>${icon(tab.icon)}${tab.iconOnly ? "" : `<span>${tab.label}</span>`}</button>`;
  }).join("");
  return `
    <header class="topbar">
      <div class="brand"><img src="assets/logo.svg" width="40" height="40" alt="" /><span>Smart TV</span></div>
      <nav class="tabs glass" data-zone="nav" aria-label="Sections">${tabs}</nav>
      <div class="top-end">
        <button type="button" class="tab tab--icon" data-key="top-source" data-action="source" aria-label="Source (switch to browser or desktop)">${icon("input")}</button>
        <time id="clock" class="clock"></time><span class="avatar" aria-hidden="true">G</span>
      </div>
    </header>`;
}

function tile(item, section, opts = {}) {
  const variant = opts.variant || "wide";
  const art = artOf(item.colors, opts.seed || item.id);
  const live = item.kind === "live" ? liveInfo(item) : null;
  const bar = opts.noBar ? 0 : live ? live.progress : isResumable(item.id) ? progressOf(item.id) : 0;
  const caption = opts.caption || captionFor(item);
  const title = opts.title || item.title;
  const badge = live ? '<span class="badge badge--live">Live</span>' : opts.badge ? `<span class="badge">${esc(opts.badge)}</span>` : "";
  const rank = opts.rank ? `<span class="rank" aria-hidden="true">${opts.rank}</span>` : "";
  const classes = ["tile", `tile--${variant}`, opts.rank ? "tile--ranked" : ""].filter(Boolean).join(" ");
  return `
    <button type="button" class="${classes}" data-key="${section}-${item.id}${opts.suffix || ""}" data-action="${opts.action || "detail"}" data-id="${item.id}" data-item="${item.id}"${opts.start ? ' data-start="1"' : ""}${opts.preferred ? ' data-preferred="1"' : ""} aria-label="${esc(`${title}. ${caption}`)}">
      ${rank}
      <span class="tile-art ${art.cls}" style="${art.style}">
        ${badge}
        <span class="tile-title">${esc(title)}</span>
        ${bar ? `<span class="tile-bar"><span style="width:${(bar * 100).toFixed(1)}%"></span></span>` : ""}
        <span class="sheen"></span>
      </span>
      <span class="tile-cap">${esc(caption)}</span>
    </button>`;
}

function appTile(app, section, preferred = false) {
  const external = app.mode === "web" || app.mode === "chrome";
  let face;
  if (app.iconSrc) face = `<img class="app-icon" src="${esc(app.iconSrc)}" alt="" loading="lazy" decoding="async" />`;
  else if (external) face = `<span class="app-word app-word--${app.word || "plain"}">${esc(app.name)}</span>`;
  else face = icon(app.icon);
  const via = app.chromeId ? '<span class="app-via">Chrome app</span>' : "";
  const label = external ? `${app.name}. Opens in ${app.chromeId ? "its Chrome window" : "Chrome"}` : app.name;
  return `
    <button type="button" class="app-tile" data-key="${section}-${app.id}" data-action="app" data-id="${app.id}" data-app="${app.id}"${preferred ? ' data-preferred="1"' : ""} aria-label="${esc(label)}">
      <span class="app-art${external ? " app-art--brand" : ""}" style="--a:${app.colors[0]};--b:${app.colors[1]}">${face}${via}<span class="sheen"></span></span>
      <span class="tile-cap">${esc(app.name)}</span>
    </button>`;
}

function fileKey(path) {
  return hash(path).toString(36);
}

function fileTile(entry, section, opts = {}) {
  const art = artOf(["#151a24", `hsl(${hash(entry.name) % 360} 55% 52%)`], entry.path);
  const prog = state.mediaProgress[entry.path];
  const bar = prog && prog.d ? Math.min(1, prog.t / prog.d) : 0;
  const kindIcon = entry.type === "audio" ? "music" : entry.type === "image" ? "image" : "film";
  const cap = opts.caption || [folderOf(entry.path), formatBytes(entry.size)].filter(Boolean).join(" · ");
  const thumb = entry.type === "image"
    ? `<img class="thumb" src="${esc(fileUrl(entry.path))}" alt="" loading="lazy" decoding="async" />`
    : `<span class="kind-mark">${icon(kindIcon)}</span>`;
  return `
    <button type="button" class="tile tile--wide tile--file" data-key="${section}-${fileKey(entry.path)}" data-action="open-file" data-path="${esc(entry.path)}" data-ftype="${entry.type}" data-section="${section}"${opts.preferred ? ' data-preferred="1"' : ""} aria-label="${esc(`${entry.name}. ${cap}`)}">
      <span class="tile-art ${art.cls}" style="${art.style}">
        ${thumb}
        <span class="badge">${esc(extOf(entry.name))}</span>
        <span class="tile-title">${esc(stripExt(entry.name))}</span>
        ${bar > 0.01 && bar < 0.97 ? `<span class="tile-bar"><span style="width:${(bar * 100).toFixed(1)}%"></span></span>` : ""}
        <span class="sheen"></span>
      </span>
      <span class="tile-cap">${esc(cap)}</span>
    </button>`;
}

function folderTile(entry, section, opts = {}) {
  const ic = opts.icon || (entry.type === "drive" ? "drive" : "folder");
  return `
    <button type="button" class="folder-tile" data-key="${section}-${fileKey(entry.path)}" data-action="open-dir" data-path="${esc(entry.path)}"${opts.preferred ? ' data-preferred="1"' : ""} aria-label="${esc(`${entry.name}, ${opts.caption || "folder"}`)}">
      <span class="folder-ic">${icon(ic)}</span>
      <span class="folder-text"><span class="folder-name">${esc(entry.name)}</span><span class="folder-cap">${esc(opts.caption || "Folder")}</span></span>
    </button>`;
}

// Files the home screen and the media player share: rows keep their entries so Next/Previous work.
const fileSets = {};

function rememberSet(section, entries) {
  fileSets[section] = entries;
  return entries;
}

function localContinue() {
  return Object.entries(state.mediaProgress)
    .filter(([, p]) => p.d && p.t > 5 && p.t < p.d - 10 && p.type !== "image")
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, 12)
    .map(([path, p]) => ({ name: p.name || baseName(path), path, type: p.type, size: p.size || 0 }));
}

function rowHtml(id, title, tilesHtml, variant = "wide") {
  return `
    <section class="row row--${variant}" data-zone="row-${id}" data-remember="v" aria-label="${esc(title)}">
      <h2 class="row-title">${esc(title)}</h2>
      <div class="scroller"><div class="track">${tilesHtml}</div></div>
    </section>`;
}

function mediaRow(row) {
  const tiles = row.items.map((item, index) => tile(item, `r-${row.id}`, {
    variant: row.variant,
    rank: row.ranked ? index + 1 : 0
  })).join("");
  return rowHtml(row.id, row.title, tiles, row.variant);
}

/* ---------- Screens ---------- */

function homeRows() {
  const rows = [];
  const cont = continueItems();
  if (cont.length) rows.push({ id: "cont", title: "Continue watching", items: cont, variant: "wide" });
  rows.push({ id: "apps", title: "Your apps", apps: true });
  const pcCont = localContinue();
  if (pcCont.length) rows.push({ id: "pccont", title: "Continue on this PC", files: rememberSet("r-pccont", pcCont) });
  rows.push({ id: "top", title: "Top 10 today", items: TOP_TEN_IDS.map(itemById).filter(Boolean), variant: "tall", ranked: true });
  if (ui.library && ui.library.videos && ui.library.videos.length) {
    rows.push({ id: "pcvideo", title: "Videos on this PC", files: rememberSet("r-pcvideo", ui.library.videos) });
  }
  rows.push({ id: "live", title: "Live now", items: byKind("live"), variant: "wide" });
  if (ui.library && ui.library.music && ui.library.music.length) {
    rows.push({ id: "pcmusic", title: "Music on this PC", files: rememberSet("r-pcmusic", ui.library.music) });
  }
  const seed = cont[0];
  if (seed) {
    const similar = catalog.filter((item) => item.genre === seed.genre && item.id !== seed.id && item.kind !== "live");
    if (similar.length >= 2) rows.push({ id: "because", title: `Because you watched ${seed.title}`, items: similar, variant: "wide" });
  }
  rows.push({ id: "movies", title: "Movies", items: byKind("movie"), variant: "wide" });
  rows.push({ id: "series", title: "Series", items: byKind("show"), variant: "tall" });
  const mine = catalog.filter((item) => state.list.has(item.id));
  if (mine.length) rows.push({ id: "mine", title: "From My List", items: mine, variant: "wide" });
  return rows;
}

function heroInner(dir = 0) {
  const list = featuredList();
  const index = mod(state.heroIndex, list.length);
  const item = list[index];
  const resumable = isResumable(item.id);
  const inList = state.list.has(item.id);
  const anim = dir ? ` swap swap--${dir > 0 ? "next" : "prev"}` : "";
  const kicker = resumable ? "Continue watching" : index === 0 ? "Featured today" : "Featured";
  return `
    <div class="hero-info${anim}">
      <p class="kicker">${kicker} · ${kindLabel(item.kind)}</p>
      <h1 class="display">${esc(item.title)}</h1>
      ${chipsHtml(item)}
      <p class="blurb">${esc(item.blurb)}</p>
      ${resumable ? resumeLine(item) : ""}
      <div class="actions">
        <button type="button" class="btn btn--primary" data-key="hero-play" data-action="play" data-id="${item.id}" data-item="${item.id}" data-preferred="1">${icon("play")}<span>${resumable ? "Resume" : "Play"}</span></button>
        <button type="button" class="btn" data-key="hero-info" data-action="detail" data-id="${item.id}" data-item="${item.id}">${icon("info")}<span>Details</span></button>
        <button type="button" class="btn btn--icon" data-key="hero-list" data-action="toggle-list" data-id="${item.id}" data-item="${item.id}" aria-pressed="${inList}" aria-label="${inList ? "Remove from My List" : "Add to My List"}">${icon(inList ? "check" : "plus")}</button>
      </div>
    </div>
    <div class="hero-foot" aria-hidden="true">
      <div class="hero-dots">${list.map((_, i) => `<span${i === index ? ' class="on"' : ""}></span>`).join("")}</div>
      <span class="hero-hint">${icon("chevL")}${icon("chevR")}More featured</span>
    </div>`;
}

function renderHome() {
  const rows = homeRows().map((row) => {
    if (row.apps) return rowHtml(row.id, row.title, homeApps().map((app) => appTile(app, `r-${row.id}`)).join(""), "apps");
    if (row.files) return rowHtml(row.id, row.title, row.files.map((entry) => fileTile(entry, `r-${row.id}`)).join(""), "wide");
    return mediaRow(row);
  }).join("");
  return `
    <section class="hero" data-zone="hero" data-top>${heroInner()}</section>
    <div class="rows">${rows}</div>`;
}

function pageHead(title, lede, extra = "") {
  return `<header class="page-head">${extra}<div><h1>${esc(title)}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}</div></header>`;
}

function homeApps() {
  return [...streamingApps(), ...chromeOnlyApps(), apps[0], ...apps.slice(1).filter((a) => a.mode !== "list")];
}

function renderApps() {
  const chrome = chromeOnlyApps();
  const chromeNote = server.ok
    ? "Shortcuts you made in Chrome (⋮ → Cast, save, and share → Create shortcut, or Install) show up here."
    : "Start the companion (py server.py) and the shortcuts you made in Chrome show up here.";
  return `
    <div class="page">
      ${pageHead("Apps", "Streaming opens in Chrome. Everything else runs on this TV.")}
      <h2 class="block-title">Streaming</h2>
      <div class="grid grid--apps" data-zone="grid-stream">${streamingApps().map((app, i) => appTile(app, "stream", i === 0)).join("")}</div>
      <h2 class="block-title block-title--gap">From Chrome <span class="count">${chrome.length}</span></h2>
      ${chrome.length
        ? `<div class="grid grid--apps" data-zone="grid-chrome">${chrome.map((app) => appTile(app, "chrome")).join("")}</div>`
        : ""}
      <p class="lede lede--note">${esc(chromeNote)}</p>
      <h2 class="block-title block-title--gap">On this TV</h2>
      <div class="grid grid--apps" data-zone="grid-tv">${apps.map((app) => appTile(app, "tv")).join("")}</div>
    </div>`;
}

function renderList() {
  const items = catalog.filter((item) => state.list.has(item.id));
  if (!items.length) {
    return `
      <div class="page page--empty">
        <div class="empty">
          <span class="empty-mark">${icon("bookmark")}</span>
          <h1>Nothing saved yet</h1>
          <p class="lede">Choose <strong>My List</strong> on any title, or hold OK on a tile, and it lands here.</p>
          <div class="actions">
            <button type="button" class="btn btn--primary" data-key="list-home" data-action="nav" data-id="home" data-preferred="1">${icon("home")}<span>Browse Home</span></button>
            <button type="button" class="btn" data-key="list-search" data-action="nav" data-id="search">${icon("search")}<span>Search</span></button>
          </div>
        </div>
      </div>`;
  }
  return `
    <div class="page">
      ${pageHead("My List", `${items.length} saved · hold OK on a title to remove it`)}
      <div class="grid" data-zone="grid">${items.map((item, i) => tile(item, "list", { preferred: i === 0 })).join("")}</div>
    </div>`;
}

function searchScore(item, q) {
  const title = item.title.toLowerCase();
  if (title.startsWith(q)) return 100;
  if (title.split(/\s+/).some((word) => word.startsWith(q))) return 80;
  if (title.includes(q)) return 60;
  if (item.genre.toLowerCase().includes(q)) return 40;
  if (kindLabel(item.kind).toLowerCase().includes(q)) return 30;
  if (q.length >= 4 && item.blurb.toLowerCase().split(/\W+/).some((word) => word.startsWith(q))) return 10;
  return 0;
}

function genreChips() {
  return `<div class="gchips" data-zone="genres">${GENRES.map((genre) => `<button type="button" class="gchip" data-key="genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}" data-action="genre" data-id="${esc(genre)}">${esc(genre)}</button>`).join("")}</div>`;
}

function searchResults() {
  const q = state.query.trim().toLowerCase();
  if (!q) {
    const popular = TOP_TEN_IDS.slice(0, 6).map(itemById).filter(Boolean);
    return `
      <div class="results-block"><h2 class="block-title">Browse by genre</h2>${genreChips()}</div>
      <div class="results-block"><h2 class="block-title">Popular right now</h2>
        <div class="grid grid--compact" data-zone="results">${popular.map((item) => tile(item, "find")).join("")}</div>
      </div>`;
  }
  const media = catalog
    .map((item, order) => ({ item, order, score: searchScore(item, q) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((hit) => hit.item);
  const appHits = allApps().filter((app) => `${app.name} ${app.fullName || ""}`.toLowerCase().includes(q));
  if (!media.length && !appHits.length) {
    return `
      <div class="results-block">
        <h2 class="block-title">No matches for “${esc(state.query.trim())}”</h2>
        <p class="lede">Try a shorter word, or a genre:</p>
        ${genreChips()}
      </div>`;
  }
  const count = media.length + appHits.length;
  return `
    <div class="results-block">
      <h2 class="block-title">Top results <span class="count">${count}</span></h2>
      <div class="grid grid--compact" data-zone="results">
        ${appHits.map((app) => appTile(app, "find")).join("")}
        ${media.map((item) => tile(item, "find")).join("")}
      </div>
    </div>`;
}

function renderSearch() {
  const keys = KB_KEYS.map((ch) => `<button type="button" class="key" data-key="kb-${ch}" data-action="type" data-id="${ch}"${ch === "a" ? ' data-preferred="1"' : ""}>${ch}</button>`).join("");
  const voice = SpeechRec ? `<button type="button" class="key" data-key="kb-mic" data-action="voice" aria-label="Voice search">${icon("mic")}</button>` : "";
  const clear = `<button type="button" class="key${SpeechRec ? "" : " key--wide"}" data-key="kb-clear" data-action="type-clear" aria-label="Clear">${SpeechRec ? icon("close") : "Clear"}</button>`;
  return `
    <div class="page">
      <div class="search-layout">
        <section class="search-input" aria-label="Keyboard">
          <div class="query glass" id="query">
            ${icon("search")}
            <span id="query-text" class="query-text" data-placeholder="Titles, genres, apps" aria-live="polite">${esc(state.query)}</span><span class="caret" aria-hidden="true"></span>
          </div>
          <div class="keyboard" data-zone="kb">
            ${keys}
            <button type="button" class="key key--wide" data-key="kb-space" data-action="type" data-id=" " aria-label="Space">${icon("space")}<span>Space</span></button>
            <button type="button" class="key key--wide" data-key="kb-del" data-action="type-del" aria-label="Delete">${icon("del")}</button>
            ${voice}${clear}
          </div>
          <p class="hint">Type on a keyboard too. Backspace deletes.</p>
        </section>
        <section class="search-results" id="search-results" aria-label="Results">${searchResults()}</section>
      </div>
    </div>`;
}

function toggleRow(key, label, desc) {
  const on = !!state.prefs[key];
  return `
    <button type="button" class="switch-row" role="switch" aria-checked="${on}" data-key="pref-${key}" data-action="pref" data-id="${key}">
      <span class="sr-text"><span class="sr-label">${esc(label)}</span><span class="sr-desc">${esc(desc)}</span></span>
      <span class="switch" aria-hidden="true"><span></span></span>
    </button>`;
}

function paneHead(title, lede) {
  return `<h2 class="pane-title">${esc(title)}</h2><p class="lede">${esc(lede)}</p>`;
}

function settingsPane() {
  switch (state.settingsTab) {
    case "display":
      return paneHead("Display & motion", "Tuned for a screen across the room.")
        + toggleRow("reduceMotion", "Reduce motion", "Turns off zoom, parallax, and slide transitions. Your system setting applies too.")
        + toggleRow("largeText", "Larger text", "Raises type and tiles by about 12 percent.")
        + toggleRow("ambient", "Ambient mode", "After two minutes idle, shows slow artwork and the time.");
    case "wallpaper": {
      const wp = state.prefs.wallpaper;
      const choice = (id, title, desc, extra = "") => `
        <button type="button" class="switch-row choice${wp === id || (id === "file" && wp.startsWith("file:")) ? " is-chosen" : ""}" role="radio" aria-checked="${wp === id || (id === "file" && wp.startsWith("file:"))}" data-key="wall-${id}" data-action="wall" data-id="${id}"${extra}>
          <span class="sr-text"><span class="sr-label">${esc(title)}</span><span class="sr-desc">${esc(desc)}</span></span>
          <span class="radio" aria-hidden="true"></span>
        </button>`;
      const preview = ui.wallUrl ? `<div class="wall-preview" style="background-image:url('${esc(ui.wallUrl)}')"></div>` : "";
      return paneHead("Wallpaper", "Shown behind Home, Apps, My PC, and Settings.")
        + preview
        + choice("desktop", "Desktop wallpaper", server.wallpaper ? "The picture on your Windows desktop. This is the default." : "Needs the companion (py server.py) to read your desktop picture.")
        + choice("custom", "Choose an image…", "Pick any picture from this computer. It stays in this browser.")
        + (wp.startsWith("file:") ? choice("file", "Photo from My PC", baseName(wp.slice(5))) : "")
        + choice("art", "Title artwork", "Artwork that follows the title you focus, with no wallpaper.")
        + `<p class="lede lede--note">Tip: in My PC, hold OK on any photo and choose <strong>Set as wallpaper</strong>.</p>`;
    }
    case "sound":
      return paneHead("Sound", "Quiet by default.")
        + toggleRow("sounds", "Navigation sounds", "A soft tick when focus moves and a tone when you select.")
        + `<button type="button" class="path" data-key="test-sound" data-action="test-sound"><span class="path-title">Play a test sound</span></button>`;
    case "playback":
      return paneHead("Playback", "Applies to the preview player.")
        + toggleRow("autoplayNext", "Autoplay next", "When a preview ends, count down 8 seconds and play the next title.")
        + toggleRow("captions", "Captions", "Shows sample captions in the preview player.");
    case "input":
      return paneHead("Remote & keys", "A keyboard, the on-screen pad, a gamepad, a TV remote, or a mouse.")
        + toggleRow("remoteOpen", "On-screen remote", "Keeps the remote pad open in the corner.")
        + `<table class="keys">
            <tr><td><kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd></td><td>Move focus</td></tr>
            <tr><td><kbd>Enter</kbd></td><td>Select. Hold for options</td></tr>
            <tr><td><kbd>Esc</kbd> <kbd>Backspace</kbd></td><td>Back. On Home, back returns to the top</td></tr>
            <tr><td><kbd>M</kbd></td><td>Options for the focused title</td></tr>
            <tr><td><kbd>I</kbd></td><td>Source: switch to the browser or the desktop</td></tr>
            <tr><td><kbd>+</kbd> <kbd>−</kbd> <kbd>0</kbd></td><td>Volume up, down, and mute. Volume keys on the keyboard show the volume too</td></tr>
            <tr><td><kbd>/</kbd></td><td>Search</td></tr>
            <tr><td><kbd>F</kbd></td><td>Fullscreen</td></tr>
            <tr><td><kbd>K</kbd> <kbd>J</kbd> <kbd>L</kbd></td><td>Play or pause, back 10 s, forward 10 s</td></tr>
            <tr><td>Gamepad</td><td>D-pad or stick moves, A selects, B goes back, Y for options</td></tr>
            <tr><td>TV remote</td><td>Back and the media keys work on LG webOS and Samsung Tizen browsers</td></tr>
          </table>`;
    case "googletv":
      return paneHead("Get Google TV", "Pick a path. The open card has the steps.")
        + paths.map((path) => {
          const on = state.helpId === path.id;
          return `<button type="button" class="path${on ? " is-on" : ""}" data-key="path-${path.id}" data-action="help" data-id="${path.id}" aria-expanded="${on}">
              <span class="path-title">${esc(path.title)}</span>
              ${on ? `<span class="path-body">${esc(path.body)}</span>` : ""}
            </button>`;
        }).join("");
    default:
      return paneHead("About & reset", "Smart TV 13 · a browser launcher and media player with a remote.")
        + `<div class="status-card${server.ok ? " is-on" : ""}">
            <span class="status-dot" aria-hidden="true"></span>
            <div><p class="sr-label">${server.ok ? "Companion connected" : "Companion not running"}</p>
            <p class="sr-desc">${server.ok
              ? `My PC files, Chrome shortcuts (${ui.chromeApps.length}), desktop wallpaper${server.volume ? ", system volume" : ""}${server.canLaunch ? ", and source switching" : ""} are on.`
              : "Run <kbd>py server.py</kbd> in this folder, then open http://localhost:8787 to browse this PC, use your Chrome shortcuts, your desktop wallpaper, and system volume."}</p></div>
          </div>`
        + (server.ok ? `<button type="button" class="path" data-key="refresh-apps" data-action="refresh-apps"><span class="path-title">Look for new Chrome shortcuts</span><span class="path-body">Run this after you make a shortcut in Chrome.</span></button>` : "")
        + `<button type="button" class="path path--danger" data-key="reset-demo" data-action="reset">
            <span class="path-title">Reset demo data</span>
            <span class="path-body">Brings back the sample Continue watching row and clears My List. Your settings stay.</span>
          </button>`;
  }
}

function renderSettings() {
  const tabs = SETTINGS_TABS.map((tab) => `
    <button type="button" class="side-item${tab.id === state.settingsTab ? " is-on" : ""}" data-key="set-${tab.id}" data-action="settings-tab" data-id="${tab.id}"${tab.id === state.settingsTab ? ' data-preferred="1"' : ""}>
      <span>${esc(tab.label)}</span>${icon("chevR")}
    </button>`).join("");
  return `
    <div class="page">
      ${pageHead("Settings", "")}
      <div class="settings-grid">
        <nav class="side" data-zone="side" data-remember="all" aria-label="Settings sections">${tabs}</nav>
        <section class="pane glass" id="settings-pane" data-zone="pane">${settingsPane()}</section>
      </div>
    </div>`;
}

function episodesRow(item) {
  const tiles = EPISODE_NAMES.map((name, i) => tile(item, "ep", {
    seed: `${item.id}-e${i + 1}`,
    title: `${i + 1}. ${name}`,
    caption: `Episode ${i + 1} · ${item.minutes} min`,
    action: "play",
    start: true,
    suffix: `-e${i + 1}`,
    noBar: true
  })).join("");
  return rowHtml("eps", `Season 1 · ${EPISODE_NAMES.length} episodes`, tiles, "wide");
}

function moreRow(item) {
  const same = catalog.filter((other) => other.id !== item.id && other.genre === item.genre);
  const kind = catalog.filter((other) => other.id !== item.id && other.kind === item.kind && other.genre !== item.genre);
  const list = [...same, ...kind].slice(0, 10);
  if (!list.length) return "";
  return rowHtml("more", "More like this", list.map((other) => tile(other, "more")).join(""), "wide");
}

function renderDetail() {
  const item = itemById(state.mediaId) || catalog[0];
  const resumable = isResumable(item.id);
  const inList = state.list.has(item.id);
  return `
    <article class="detail">
      <section class="detail-hero" data-zone="detail-top" data-top>
        <div class="detail-info">
          <p class="kicker">${kindLabel(item.kind)} · ${esc(item.genre)}</p>
          <h1 class="display">${esc(item.title)}</h1>
          ${chipsHtml(item)}
          <p class="blurb">${esc(item.blurb)}</p>
          ${resumable ? resumeLine(item) : ""}
          <div class="actions">
            <button type="button" class="btn btn--primary" data-key="detail-play" data-action="play" data-id="${item.id}" data-item="${item.id}" data-preferred="1">${icon("play")}<span>${resumable ? "Resume" : item.kind === "live" ? "Watch live" : "Play"}</span></button>
            ${resumable ? `<button type="button" class="btn" data-key="detail-restart" data-action="play" data-start="1" data-id="${item.id}" data-item="${item.id}">${icon("restart")}<span>From start</span></button>` : ""}
            <button type="button" class="btn" data-key="detail-list" data-action="toggle-list" data-id="${item.id}" data-item="${item.id}" aria-pressed="${inList}">${icon(inList ? "check" : "plus")}<span>${inList ? "In My List" : "My List"}</span></button>
          </div>
        </div>
      </section>
      ${item.kind === "show" ? episodesRow(item) : ""}
      ${moreRow(item)}
    </article>`;
}

function renderWeather(app) {
  const days = [["Mon", "sun", 23, 14], ["Tue", "cloud", 20, 13], ["Wed", "sun", 24, 15], ["Thu", "cloud", 19, 12], ["Fri", "sun", 22, 13]];
  return `
    <section class="page weather">
      <p class="kicker">Weather · sample data</p>
      <div class="wx-now">
        <span class="wx-temp">21°</span>
        <div><p class="wx-cond">${icon("sun")}Clear</p><p class="lede">${esc(app.blurb)}</p></div>
      </div>
      <div class="wx-days">
        ${days.map(([day, ic, hi, lo]) => `<div class="wx-day glass"><span class="wx-name">${day}</span>${icon(ic)}<span class="wx-hi">${hi}°</span><span class="wx-lo">${lo}°</span></div>`).join("")}
      </div>
      <div class="actions">
        <button type="button" class="btn btn--primary" data-key="panel-back" data-action="back" data-preferred="1">${icon("chevL")}<span>Back</span></button>
      </div>
    </section>`;
}

function renderApp() {
  const app = appById(state.appId) || apps[0];
  if (app.mode === "panel") return renderWeather(app);
  const items = app.mode === "all" ? catalog : byKind(app.kind);
  const badge = `<span class="app-badge" style="--a:${app.colors[0]};--b:${app.colors[1]}">${icon(app.icon)}</span>`;
  return `
    <div class="page">
      ${pageHead(app.name, esc(app.blurb), badge)}
      <div class="grid" data-zone="grid">${items.map((item, i) => tile(item, `app-${app.id}`, { preferred: i === 0 })).join("")}</div>
    </div>`;
}

function renderPlayer() {
  const item = itemById(state.mediaId) || catalog[0];
  const art = artOf(item.colors, item.id);
  const live = item.kind === "live";
  const next = nextItem(item);
  const ctl = (key, action, ic, label, extra = "") => `<button type="button" class="ctl" data-key="${key}" data-action="${action}" aria-label="${esc(label)}" ${extra}>${icon(ic)}</button>`;
  return `
    <section class="player" id="player" aria-label="Preview player">
      <div class="stage grain ${art.cls}" style="${art.style}" data-action="stage"></div>
      <div class="stage-scrim" aria-hidden="true"></div>
      <p class="captions" id="captions"${state.prefs.captions ? "" : " hidden"}></p>
      <div class="osd" id="osd">
        <div class="osd-head">
          <p class="kicker">${live ? '<span class="chip chip--live">Live</span> ' : ""}Preview · ${PREVIEW_SECONDS}-second sample</p>
          <h1 class="display display--player">${esc(item.title)}</h1>
          ${chipsHtml(item)}
        </div>
        <div class="scrub${live ? " is-live" : ""}" id="scrub" tabindex="0" role="slider" data-key="player-scrub" data-action="toggle-play" aria-label="Playback position" aria-valuemin="0" aria-valuemax="${PREVIEW_SECONDS}" aria-valuenow="0">
          <span class="scrub-track"><span class="scrub-fill" id="scrub-fill"></span></span>
          <span class="scrub-knob" id="scrub-knob"></span>
          <span class="scrub-tip" id="scrub-tip">00:00</span>
        </div>
        <div class="osd-row">
          <span class="time" id="t-cur">00:00</span>
          <div class="controls">
            ${live ? "" : ctl("player-back10", "seek", "back10", "Back 10 seconds", 'data-delta="-10"')}
            <button type="button" class="ctl ctl--main" id="player-toggle" data-key="player-toggle" data-action="toggle-play" data-preferred="1" aria-label="Pause">${icon("pause")}</button>
            ${live ? "" : ctl("player-fwd10", "seek", "fwd10", "Forward 10 seconds", 'data-delta="10"')}
            ${ctl("player-cc", "captions", "cc", "Captions", `aria-pressed="${!!state.prefs.captions}"`)}
            ${next ? ctl("player-next", "next", "next", `Next: ${next.title}`) : ""}
          </div>
          <span class="time time--end" id="t-left">-01:00</span>
        </div>
      </div>
      <aside class="upnext glass" id="upnext" hidden></aside>
    </section>`;
}

/* ---------- My PC ---------- */

function companionCard(feature) {
  return `
    <div class="page page--empty">
      <div class="empty">
        <span class="empty-mark">${icon("pc")}</span>
        <h1>${esc(feature)} needs the companion</h1>
        <p class="lede">A web page can't see your files on its own. Start the small companion that came with Smart TV, then open the address it shows.</p>
        <div class="steps glass">
          <p><span class="step-n">1</span>Open a terminal in the Smart TV folder</p>
          <p><span class="step-n">2</span>Run <kbd>py server.py</kbd></p>
          <p><span class="step-n">3</span>It opens <strong>http://localhost:8787</strong> for you</p>
        </div>
        <div class="actions">
          <button type="button" class="btn btn--primary" data-key="companion-home" data-action="nav" data-id="home" data-preferred="1">${icon("home")}<span>Back to Home</span></button>
        </div>
      </div>
    </div>`;
}

function loadingView(text) {
  return `<div class="page page--empty"><div class="empty"><span class="spinner" aria-hidden="true"></span><p class="lede">${esc(text)}</p></div></div>`;
}

function ensurePlaces() {
  if (ui.places || ui.loading.places) return;
  ui.loading.places = true;
  api("/api/places")
    .then((data) => { ui.places = data; })
    .catch((err) => { ui.places = { error: err.message }; })
    .finally(() => {
      delete ui.loading.places;
      if (state.screen === "files" && !state.path) render(false);
    });
}

function ensureList(path) {
  if (ui.lists[path] || ui.loading[path]) return;
  ui.loading[path] = true;
  api(`/api/list?path=${encodeURIComponent(path)}`)
    .then((data) => { ui.lists[path] = data; })
    .catch((err) => { ui.lists[path] = { error: err.message }; })
    .finally(() => {
      delete ui.loading[path];
      if (state.screen === "files" && state.path === path) render(false);
    });
}

function renderFiles() {
  if (!server.ok) return companionCard("My PC");
  if (!state.path) {
    if (!ui.places) {
      ensurePlaces();
      return loadingView("Looking at this PC…");
    }
    if (ui.places.error) return `<div class="page">${pageHead("My PC", esc(ui.places.error))}</div>`;
    const places = ui.places.places.map((p, i) => folderTile({ ...p }, "place", { icon: p.icon, caption: p.path, preferred: i === 0 })).join("");
    const drives = ui.places.drives.map((d) => folderTile({ ...d, type: "drive" }, "drive", {
      caption: d.total ? `${formatBytes(d.free)} free of ${formatBytes(d.total)}` : d.path
    })).join("");
    return `
      <div class="page">
        ${pageHead("My PC", "Videos, music, and photos on this computer. Pick a place to start.")}
        <h2 class="block-title">Places</h2>
        <div class="grid grid--folders" data-zone="places">${places}</div>
        <h2 class="block-title block-title--gap">Drives</h2>
        <div class="grid grid--folders" data-zone="drives">${drives}</div>
      </div>`;
  }
  const data = ui.lists[state.path];
  if (!data) {
    ensureList(state.path);
    return loadingView(`Opening ${baseName(state.path)}…`);
  }
  const crumbs = state.path.split(/[\\/]/).filter(Boolean);
  const head = `
    <header class="page-head page-head--files">
      <span class="app-badge app-badge--plain">${icon("folder")}</span>
      <div>
        <p class="crumbs">${crumbs.map(esc).join(`<span class="crumb-sep">›</span>`)}</p>
        <h1>${esc(data.name || baseName(state.path))}</h1>
      </div>
    </header>`;
  if (data.error) {
    return `<div class="page">${head}<p class="lede">${esc(data.error)}</p>
      <div class="actions"><button type="button" class="btn btn--primary" data-key="files-back" data-action="back" data-preferred="1">${icon("chevL")}<span>Back</span></button></div></div>`;
  }
  const dirs = data.entries.filter((e) => e.type === "dir");
  const media = rememberSet("files", data.entries.filter((e) => e.type !== "dir"));
  const counts = ["video", "audio", "image"].map((t) => [t, media.filter((e) => e.type === t).length]).filter(([, n]) => n);
  const summary = [
    dirs.length ? `${dirs.length} folder${dirs.length === 1 ? "" : "s"}` : "",
    ...counts.map(([t, n]) => `${n} ${t === "video" ? "video" : t === "audio" ? "song" : "photo"}${n === 1 ? "" : "s"}`),
    data.otherCount ? `${data.otherCount} other file${data.otherCount === 1 ? "" : "s"} hidden` : ""
  ].filter(Boolean).join(" · ");
  const firstPreferred = (i) => i === 0;
  return `
    <div class="page">
      ${head}
      <p class="lede lede--note">${esc(summary || "This folder has no videos, music, or photos.")}${data.truncated ? " · showing the first 1,500" : ""}</p>
      ${dirs.length ? `<div class="grid grid--folders" data-zone="dirs">${dirs.map((d, i) => folderTile(d, "dir", { preferred: firstPreferred(i) })).join("")}</div>` : ""}
      ${media.length ? `<div class="grid grid--files${dirs.length ? " grid--gap" : ""}" data-zone="media">${media.map((e, i) => fileTile(e, "files", { preferred: !dirs.length && i === 0, caption: [formatBytes(e.size), new Date(e.mtime * 1000).toLocaleDateString()].join(" · ") })).join("")}</div>` : ""}
      ${!dirs.length && !media.length ? `<div class="actions"><button type="button" class="btn btn--primary" data-key="files-back" data-action="back" data-preferred="1">${icon("chevL")}<span>Back</span></button></div>` : ""}
    </div>`;
}

/* ---------- Media player (files on this PC) ---------- */

function currentEntry() {
  const m = state.media;
  return m ? m.list[m.index] : null;
}

function renderMedia() {
  const m = state.media;
  const entry = currentEntry();
  if (!entry) return "";
  const n = m.list.length;
  const position = n > 1 ? ` · ${m.index + 1} of ${n}` : "";
  const ctl = (key, action, ic, label, extra = "") => `<button type="button" class="ctl" data-key="${key}" data-action="${action}" aria-label="${esc(label)}" ${extra}>${icon(ic)}</button>`;
  const prev = n > 1 ? ctl("media-prev", "media-prev", "prev", "Previous") : "";
  const next = n > 1 ? ctl("media-next", "media-next", "next", "Next") : "";
  const folder = folderOf(entry.path);
  const art = artOf(["#10141c", `hsl(${hash(entry.name) % 360} 55% 50%)`], entry.path);

  if (entry.type === "image") {
    return `
      <section class="player media media--photo osd-on" id="player" aria-label="Photo viewer">
        <img class="photo-bg" src="${esc(fileUrl(entry.path))}" alt="" aria-hidden="true" />
        <img class="photo" id="photo" src="${esc(fileUrl(entry.path))}" alt="${esc(entry.name)}" />
        <div class="stage-scrim" aria-hidden="true"></div>
        <div class="osd" id="osd">
          <div class="osd-head">
            <p class="kicker">Photo${esc(position)} · ${esc(folder)}</p>
            <h1 class="display display--player">${esc(stripExt(entry.name))}</h1>
          </div>
          <div class="osd-row osd-row--photo">
            <span class="time">${esc(formatBytes(entry.size))}</span>
            <div class="controls">
              ${prev}
              <button type="button" class="ctl ctl--main" id="player-toggle" data-key="media-toggle" data-action="media-toggle" data-preferred="1" aria-label="Start slideshow">${icon("play")}</button>
              ${next}
              ${ctl("media-wall", "media-wall", "image", "Set as wallpaper")}
            </div>
            <span class="time time--end">${n > 1 ? "Left and right browse" : ""}</span>
          </div>
        </div>
      </section>`;
  }

  const audio = entry.type === "audio";
  const el = audio
    ? `<audio id="mv" src="${esc(fileUrl(entry.path))}" autoplay preload="metadata"></audio>`
    : `<video id="mv" class="mv" src="${esc(fileUrl(entry.path))}" autoplay playsinline preload="metadata"></video>`;
  const nowPlaying = audio ? `
    <div class="stage grain ${art.cls}" style="${art.style}" data-action="media-toggle"></div>
    <div class="now-playing">
      <span class="np-art ${art.cls}" style="${art.style}">${icon("music")}<span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span>
    </div>` : "";
  return `
    <section class="player media${audio ? " media--audio" : " media--video"}" id="player" aria-label="${audio ? "Music player" : "Video player"}">
      ${nowPlaying}
      ${el}
      <div class="stage-scrim" aria-hidden="true"${audio ? "" : ' data-action="media-toggle"'}></div>
      <div class="media-error" id="media-error" hidden></div>
      <div class="osd" id="osd">
        <div class="osd-head">
          <p class="kicker">${audio ? "Music" : "Video"}${esc(position)} · ${esc(folder)}</p>
          <h1 class="display display--player">${esc(stripExt(entry.name))}</h1>
        </div>
        <div class="scrub" id="scrub" tabindex="0" role="slider" data-key="player-scrub" data-action="media-toggle" aria-label="Playback position" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">
          <span class="scrub-track"><span class="scrub-fill" id="scrub-fill"></span></span>
          <span class="scrub-knob" id="scrub-knob"></span>
          <span class="scrub-tip" id="scrub-tip">00:00</span>
        </div>
        <div class="osd-row">
          <span class="time" id="t-cur">00:00</span>
          <div class="controls">
            ${prev}
            ${ctl("media-back10", "media-seek", "back10", "Back 10 seconds", 'data-delta="-10"')}
            <button type="button" class="ctl ctl--main" id="player-toggle" data-key="media-toggle" data-action="media-toggle" data-preferred="1" aria-label="Pause">${icon("pause")}</button>
            ${ctl("media-fwd10", "media-seek", "fwd10", "Forward 10 seconds", 'data-delta="10"')}
            ${next}
          </div>
          <span class="time time--end" id="t-left">--:--</span>
        </div>
      </div>
    </section>`;
}

function renderBody() {
  const screens = {
    files: renderFiles,
    media: renderMedia,
    home: renderHome,
    apps: renderApps,
    list: renderList,
    search: renderSearch,
    settings: renderSettings,
    detail: renderDetail,
    player: renderPlayer,
    app: renderApp
  };
  return (screens[state.screen] || renderHome)();
}

function screenTitle() {
  const item = itemById(state.mediaId);
  if (item && (state.screen === "detail" || state.screen === "player")) return item.title;
  if (state.screen === "app") return (appById(state.appId) || {}).name || "App";
  if (state.screen === "media" && currentEntry()) return currentEntry().name;
  if (state.screen === "files" && state.path) return baseName(state.path);
  const names = { home: "Home", apps: "Apps", list: "My List", search: "Search", settings: "Settings", files: "My PC" };
  return names[state.screen] || "Home";
}

function render(animate = true) {
  const root = document.getElementById("app");
  const fullscreenScreen = state.screen === "player" || state.screen === "media";
  const chrome = !fullscreenScreen && state.stack.length === 0;
  const prev = currentEl();
  if (prev) {
    const zone = prev.closest("[data-zone]");
    ui.hint = zone ? { zone: zone.dataset.zone, index: [...zone.querySelectorAll("[data-key]")].indexOf(prev) } : null;
  }
  document.body.dataset.screen = state.screen;
  document.body.classList.toggle("no-chrome", !chrome);
  document.body.classList.remove("in-rows", "scrolled");
  const backPill = !chrome && !fullscreenScreen
    ? `<button type="button" class="back-pill glass" data-action="back" tabindex="-1" aria-label="Back">${icon("chevL")}<span>Back</span></button>`
    : "";
  const enter = animate && !motionReduced() ? " enter" : "";
  root.innerHTML = `${chrome ? topbar() : backPill}<main id="screen" class="screen screen--${state.screen}${enter}">${renderBody()}</main>`;
  document.title = `Smart TV · ${screenTitle()}`;
  screenBackdrop();
  restoreFocus();
  tickClock();
  if (state.screen === "player") updatePlayerUi();
  if (state.screen === "media") wireMedia();
}

/* ---------- Backdrop and focus info ---------- */

function setBackdrop(seed, colors, immediate = false) {
  if (seed === ui.bdKey) return;
  ui.bdKey = seed;
  clearTimeout(ui.bdTimer);
  const apply = () => {
    const layers = document.querySelectorAll(".bd-layer");
    if (layers.length < 2) return;
    const art = artOf(colors, `${seed}-bd`);
    const next = layers[1 - ui.bdActive];
    const cur = layers[ui.bdActive];
    next.className = `bd-layer grain ${art.cls}`;
    next.style.cssText = art.style;
    void next.offsetWidth;
    next.classList.add("is-on", "is-top");
    cur.classList.remove("is-on", "is-top");
    ui.bdActive = 1 - ui.bdActive;
  };
  if (immediate) apply();
  else ui.bdTimer = setTimeout(apply, 110);
}

function screenBackdrop() {
  if (state.screen === "app") {
    const app = appById(state.appId);
    if (app) {
      setBackdrop(`app-${app.id}`, app.colors, true);
      return;
    }
  }
  const item = (state.screen === "detail" || state.screen === "player") && itemById(state.mediaId)
    ? itemById(state.mediaId)
    : currentFeatured();
  setBackdrop(item.id, item.colors, true);
}

function setFocusInfo(item, app) {
  clearTimeout(ui.fiTimer);
  ui.fiTimer = setTimeout(() => {
    const box = document.getElementById("focus-info");
    if (!box) return;
    let html = "";
    if (item) {
      html = `
        <p class="kicker">${kindLabel(item.kind)} · ${esc(item.genre)}</p>
        <h2 class="fi-title">${esc(item.title)}</h2>
        ${chipsHtml(item)}
        ${isResumable(item.id) ? resumeLine(item) : ""}
        <p class="blurb">${esc(item.blurb)}</p>`;
    } else if (app) {
      html = `<p class="kicker">App</p><h2 class="fi-title">${esc(app.name)}</h2><p class="blurb">${esc(app.blurb)}</p>`;
    }
    box.innerHTML = `<div class="fi-inner">${html}</div>`;
  }, 70);
}

function focusContext(el) {
  if (state.overlay) return;
  const inRows = state.screen === "home" && !!el.closest(".rows");
  document.body.classList.toggle("in-rows", inRows);
  const item = el.dataset.item ? itemById(el.dataset.item) : null;
  const app = el.dataset.app ? appById(el.dataset.app) : null;
  if (state.screen !== "detail" && state.screen !== "player" && state.screen !== "media") {
    if (item) setBackdrop(item.id, item.colors);
    else if (app) setBackdrop(`app-${app.id}`, app.colors);
  }
  if (inRows) setFocusInfo(item, app);
}

/* ---------- Focus engine ---------- */

function focusRoot() {
  return state.overlay ? document.getElementById("overlay") : document.getElementById("app");
}

function focusables() {
  const root = focusRoot();
  if (!root) return [];
  // The top bar is fixed while content scrolls, so while it is tucked away in the rows
  // its geometry would beat the (scrolled-off) hero. Leave it out until the hero has focus.
  const skipTopbar = document.body.classList.contains("in-rows");
  return [...root.querySelectorAll("[data-key]")].filter((el) => (
    !el.disabled
    && !el.closest("[hidden]")
    && !(skipTopbar && el.closest(".topbar"))
    && el.getClientRects().length > 0
  ));
}

function findKey(key) {
  return key ? focusables().find((el) => el.dataset.key === key) || null : null;
}

function currentEl(all = focusables()) {
  return all.find((el) => el === document.activeElement)
    || all.find((el) => el.dataset.key === state.focusKey)
    || null;
}

function focusEl(el, opts = {}) {
  if (!el) return;
  ui.noScroll = !!opts.noScroll;
  el.focus({ preventScroll: true });
  ui.noScroll = false;
}

function restoreFocus() {
  const all = focusables();
  let el = state.focusKey ? all.find((e) => e.dataset.key === state.focusKey) : null;
  if (!el && ui.hint) {
    const zoneEls = all.filter((e) => {
      const zone = e.closest("[data-zone]");
      return zone && zone.dataset.zone === ui.hint.zone;
    });
    if (zoneEls.length) el = zoneEls[Math.max(0, Math.min(ui.hint.index, zoneEls.length - 1))];
  }
  const screen = document.getElementById("screen");
  el = el
    || all.find((e) => e.dataset.preferred)
    || all.find((e) => screen && screen.contains(e))
    || all.find((e) => e.getAttribute("aria-current") === "page")
    || all[0];
  ui.hint = null;
  ui.instantScroll = true;
  ui.restoring = true;
  if (el) focusEl(el);
  ui.restoring = false;
  ui.instantScroll = false;
}

function findNext(cur, all, dir) {
  const c = cur.getBoundingClientRect();
  const horizontal = dir === "left" || dir === "right";
  const sign = dir === "right" || dir === "down" ? 1 : -1;
  const cMain = horizontal ? (c.left + c.right) / 2 : (c.top + c.bottom) / 2;
  const cCross = horizontal ? (c.top + c.bottom) / 2 : (c.left + c.right) / 2;
  const cands = [];
  for (const el of all) {
    if (el === cur) continue;
    const r = el.getBoundingClientRect();
    const rMain = horizontal ? (r.left + r.right) / 2 : (r.top + r.bottom) / 2;
    if ((rMain - cMain) * sign <= 1) continue;
    let gap;
    if (horizontal) gap = sign > 0 ? r.left - c.right : c.left - r.right;
    else gap = sign > 0 ? r.top - c.bottom : c.top - r.bottom;
    if (gap < -12) continue;
    const rCross = horizontal ? (r.top + r.bottom) / 2 : (r.left + r.right) / 2;
    const overlap = horizontal
      ? Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top)
      : Math.min(r.right, c.right) - Math.max(r.left, c.left);
    const crossGap = horizontal
      ? Math.max(0, r.top - c.bottom, c.top - r.bottom)
      : Math.max(0, r.left - c.right, c.left - r.right);
    cands.push({ el, r, gap: Math.max(0, gap), cross: Math.abs(rCross - cCross), overlap, crossGap });
  }
  if (!cands.length) return null;

  if (horizontal) {
    const inBand = cands.filter((cand) => cand.overlap > 2);
    if (inBand.length) {
      inBand.sort((a, b) => a.gap - b.gap || a.cross - b.cross);
      return inBand[0].el;
    }
    // Rows, grids, the hero, and the tabs end at their edge instead of hopping to another line.
    if (cur.closest(".scroller, .grid, .hero, .tabs, .controls, .actions")) return null;
    const near = cands.filter((cand) => cand.crossGap < window.innerHeight * 0.3);
    if (!near.length) return null;
    near.sort((a, b) => (a.gap + a.crossGap * 2) - (b.gap + b.crossGap * 2));
    return near[0].el;
  }

  cands.sort((a, b) => a.gap - b.gap);
  const nearest = cands[0];
  const tolerance = Math.max(16, nearest.r.height * 0.5);
  const band = cands.filter((cand) => cand.gap <= nearest.gap + tolerance);
  band.sort((a, b) => a.cross - b.cross);
  return band[0].el;
}

function preferInZone(cur, next, all, dir) {
  const from = cur.closest("[data-zone]");
  const to = next.closest("[data-zone]");
  if (!to || from === to) return next;
  if (to.dataset.zone === "nav") {
    return all.find((el) => to.contains(el) && el.getAttribute("aria-current") === "page") || next;
  }
  const rule = to.dataset.remember;
  if (rule === "all" || (rule === "v" && (dir === "up" || dir === "down"))) {
    const key = memory[to.dataset.zone];
    const remembered = key && all.find((el) => el.dataset.key === key && to.contains(el));
    if (remembered) return remembered;
  }
  return next;
}

function bump(el, dir) {
  if (!el || motionReduced()) return;
  const cls = `bump-${dir}`;
  el.classList.remove("bump-left", "bump-right", "bump-up", "bump-down");
  void el.offsetWidth;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 360);
}

function move(dir) {
  const now = performance.now();
  if (now - ui.lastMove < 55) return;
  ui.lastMove = now;
  const all = focusables();
  if (!all.length) return;
  const cur = currentEl(all);
  if (!cur) {
    focusEl(all.find((el) => el.dataset.preferred) || all[0]);
    return;
  }
  const next = findNext(cur, all, dir);
  if (!next) {
    if (cur.closest(".hero") && (dir === "left" || dir === "right")) {
      cycleHero(dir === "right" ? 1 : -1);
      sound("move");
      return;
    }
    bump(cur, dir);
    sound("edge");
    return;
  }
  focusEl(preferInZone(cur, next, all, dir));
  sound("move");
}

function revealTopbar() {
  const screen = document.getElementById("screen");
  if (!screen || state.screen !== "home" || !document.body.classList.contains("in-rows")) return;
  const hero = screen.querySelector(".hero");
  if (!hero) return;
  const top = hero.getBoundingClientRect().top - screen.getBoundingClientRect().top;
  if (top <= -screen.clientHeight * 0.18) return;
  document.body.classList.remove("in-rows");
  const heroBtn = hero.querySelector("[data-key]");
  const inRows = document.activeElement && document.activeElement.closest && document.activeElement.closest(".rows");
  if (heroBtn && inRows) focusEl(heroBtn, { noScroll: true });
}

function scrollFor(el) {
  if (ui.noScroll || state.overlay) return;
  const screen = document.getElementById("screen");
  if (!screen) return;
  const behavior = ui.instantScroll || motionReduced() ? "auto" : "smooth";
  const scroller = el.closest(".scroller");
  if (scroller) {
    const track = scroller.firstElementChild;
    const pad = track ? parseFloat(getComputedStyle(track).paddingLeft) || 0 : 0;
    scroller.scrollTo({ left: Math.max(0, el.offsetLeft - pad), behavior });
  }
  if (el.closest("[data-top]") || el.closest(".topbar")) {
    screen.scrollTo({ top: 0, behavior });
    return;
  }
  const sr = screen.getBoundingClientRect();
  const row = el.closest(".row");
  if (row && state.screen === "home") {
    const top = row.getBoundingClientRect().top - sr.top + screen.scrollTop;
    screen.scrollTo({ top: Math.max(0, top - screen.clientHeight * 0.42), behavior });
    return;
  }
  const target = row || el;
  const r = target.getBoundingClientRect();
  const margin = screen.clientHeight * 0.16;
  if (r.top < sr.top + margin || r.bottom > sr.bottom - margin) {
    const top = r.top - sr.top + screen.scrollTop;
    screen.scrollTo({ top: Math.max(0, top - (screen.clientHeight - r.height) / 2), behavior });
  }
}

function onFocusIn(event) {
  const el = event.target.closest ? event.target.closest("[data-key]") : null;
  if (!el) return;
  state.focusKey = el.dataset.key;
  const zone = el.closest("[data-zone]");
  if (zone && zone.dataset.remember) memory[zone.dataset.zone] = el.dataset.key;
  scrollFor(el);
  focusContext(el);
  if (el.dataset.action === "nav" && el.closest(".topbar") && ui.inputMode === "key" && !ui.restoring) scheduleTab(el);
  if (el.dataset.action === "settings-tab") schedulePane(el.dataset.id);
}

function scheduleTab(el) {
  clearTimeout(ui.tabTimer);
  const id = el.dataset.id;
  if (id === state.screen) return;
  ui.tabTimer = setTimeout(() => {
    if (state.focusKey === el.dataset.key && !state.overlay) openNav(id, true);
  }, 380);
}

function schedulePane(id) {
  clearTimeout(ui.paneTimer);
  if (id === state.settingsTab) return;
  ui.paneTimer = setTimeout(() => {
    state.settingsTab = id;
    refreshPane();
  }, 140);
}

/* ---------- Navigation and history ---------- */

function snapshot() {
  return {
    screen: state.screen,
    focusKey: state.focusKey,
    appId: state.appId,
    mediaId: state.mediaId,
    query: state.query,
    settingsTab: state.settingsTab,
    path: state.path,
    media: state.media
  };
}

function pushScreen(apply) {
  leavePlayer();
  state.stack.push(snapshot());
  apply();
  try {
    history.pushState({ tv: state.stack.length }, "");
  } catch {
    /* file:// pages can refuse history entries */
  }
  render();
}

function openNav(id, keepFocus = false) {
  if (state.screen === id && !state.stack.length) return;
  leavePlayer();
  state.stack = [];
  try {
    history.replaceState({ tv: 0 }, "");
  } catch {
    /* ignore */
  }
  state.screen = id;
  state.appId = null;
  state.path = null;
  state.focusKey = keepFocus ? `nav-${id}` : null;
  render();
}

function goHome() {
  if (state.overlay) closeOverlay(false);
  if (state.screen === "home" && !state.stack.length) {
    focusEl(findKey("hero-play"));
    return;
  }
  openNav("home");
}

function openDetail(id) {
  if (!itemById(id)) return;
  pushScreen(() => {
    state.screen = "detail";
    state.mediaId = id;
    state.focusKey = "detail-play";
  });
}

function startPlayback(id, fromStart) {
  const start = progressOf(id) * PREVIEW_SECONDS;
  state.position = fromStart || start > PREVIEW_SECONDS - 1 ? 0 : start;
  state.playing = true;
  state.upNext = null;
  state.osdUntil = Date.now() + OSD_HIDE_MS;
  ui.lastTick = Date.now();
}

function openPlayer(id, opts = {}) {
  if (!itemById(id)) return;
  pushScreen(() => {
    state.screen = "player";
    state.mediaId = id;
    startPlayback(id, !!opts.fromStart);
    state.focusKey = "player-toggle";
  });
}

function openApp(id) {
  const app = appById(id);
  if (!app) return;
  if (app.mode === "web" || app.mode === "chrome") {
    launchApp(app);
    return;
  }
  if (app.mode === "files") {
    pushScreen(() => {
      state.screen = "files";
      state.path = null;
      state.focusKey = null;
    });
    return;
  }
  pushScreen(() => {
    state.appId = id;
    state.focusKey = null;
    state.screen = app.mode === "list" ? "list" : "app";
  });
}

function leavePlayer() {
  if (state.screen === "media") {
    leaveMedia();
    return;
  }
  if (state.screen !== "player") return;
  state.playing = false;
  state.upNext = null;
  saveProgress();
}

function popScreen() {
  leavePlayer();
  const prev = state.stack.pop();
  if (!prev) {
    if (state.screen !== "home") {
      state.screen = "home";
      state.focusKey = null;
      state.appId = null;
      render();
    } else {
      const top = findKey("hero-play");
      if (top && document.activeElement !== top) focusEl(top);
    }
    return;
  }
  state.screen = prev.screen;
  state.focusKey = prev.focusKey;
  state.appId = prev.appId;
  state.mediaId = prev.mediaId;
  state.query = prev.query;
  state.settingsTab = prev.settingsTab;
  state.path = prev.path;
  state.media = prev.media;
  render();
}

function back() {
  if (ambientVisible()) {
    hideAmbient();
    return;
  }
  if (state.overlay) {
    closeOverlay();
    return;
  }
  sound("back");
  if (state.stack.length && history.state && history.state.tv === state.stack.length) {
    history.back();
    return;
  }
  popScreen();
}

function onPopState() {
  if (state.overlay) closeOverlay(false);
  popScreen();
}

/* ---------- Actions ---------- */

function activate(el) {
  if (!el) return;
  const action = el.dataset.action;
  const id = el.dataset.id || "";
  if (action !== "back") sound("select");
  switch (action) {
    case "nav":
      clearTimeout(ui.tabTimer);
      if (state.screen === id && !state.stack.length) focusIntoContent();
      else openNav(id, el.closest(".topbar") !== null);
      break;
    case "detail": openDetail(id); break;
    case "play": openPlayer(id, { fromStart: el.dataset.start === "1" }); break;
    case "app": openApp(id); break;
    case "toggle-list": toggleList(id); break;
    case "toggle-play": togglePlay(); break;
    case "stage": togglePlay(); break;
    case "seek": seek(Number(el.dataset.delta)); break;
    case "captions": toggleCaptions(); break;
    case "next": playNext(); break;
    case "upnext-play": playNext(); break;
    case "upnext-cancel": cancelUpNext(); break;
    case "help": state.helpId = id; refreshPane(); break;
    case "reset": confirmReset(); break;
    case "pref": togglePref(id); break;
    case "settings-tab":
      clearTimeout(ui.paneTimer);
      if (state.settingsTab !== id) {
        state.settingsTab = id;
        refreshPane();
      }
      focusEl(focusables().find((e) => e.closest("#settings-pane")));
      break;
    case "test-sound": {
      const was = state.prefs.sounds;
      state.prefs.sounds = true;
      sound("select");
      state.prefs.sounds = was;
      break;
    }
    case "type": typeChar(id); break;
    case "type-del": state.query = state.query.slice(0, -1); updateSearch(); break;
    case "type-clear": state.query = ""; updateSearch(); break;
    case "voice": startVoice(); break;
    case "genre":
      state.query = id;
      updateSearch();
      focusEl(focusables().find((e) => e.closest("#search-results") && e.dataset.item));
      break;
    case "open-dir": openDir(el.dataset.path); break;
    case "open-file": openFileFrom(el); break;
    case "media-toggle": mediaToggle(); break;
    case "media-seek": mediaSeek(Number(el.dataset.delta)); break;
    case "media-prev": mediaStep(-1); break;
    case "media-next": mediaStep(1); break;
    case "media-wall": { const e = currentEntry(); if (e) setWallpaper(`file:${e.path}`); break; }
    case "wall": chooseWallpaper(id); break;
    case "source": openSourceMenu(); break;
    case "refresh-apps": refreshApps(true); break;
    case "sheet": runSheet(Number(el.dataset.index)); break;
    case "sheet-close": closeOverlay(); break;
    case "back": back(); break;
    default: break;
  }
}

function focusIntoContent() {
  const screen = document.getElementById("screen");
  const first = focusables().find((el) => screen && screen.contains(el) && el.dataset.preferred)
    || focusables().find((el) => screen && screen.contains(el));
  focusEl(first);
}

function toggleList(id) {
  const item = itemById(id);
  if (!item) return;
  const added = !state.list.has(id);
  if (added) state.list.add(id);
  else state.list.delete(id);
  save();
  toast(added ? `Added ${item.title} to My List` : `Removed ${item.title} from My List`, added ? "check" : "close");
  render(false);
}

function removeFromContinue(id) {
  const item = itemById(id);
  delete state.progress[id];
  save();
  if (item) toast(`Removed ${item.title} from Continue watching`, "close");
  render(false);
}

function togglePref(key) {
  state.prefs[key] = !state.prefs[key];
  save();
  applyPrefs();
  if (key === "remoteOpen") renderRemote();
  if (key === "ambient") markActivity();
  refreshPane();
}

function refreshPane() {
  const pane = document.getElementById("settings-pane");
  if (!pane) return;
  const key = state.focusKey;
  pane.innerHTML = settingsPane();
  document.querySelectorAll(".side-item").forEach((btn) => {
    btn.classList.toggle("is-on", btn.dataset.id === state.settingsTab);
  });
  const el = findKey(key);
  if (el && document.activeElement !== el) focusEl(el);
}

function confirmReset() {
  openSheet({
    kicker: "Settings",
    title: "Reset demo data?",
    body: "Brings back the sample Continue watching row and clears My List. Your settings stay.",
    actions: [
      { label: "Reset", icon: "restart", danger: true, run: resetDemo },
      { label: "Cancel", icon: "close", run: () => {} }
    ]
  });
}

function resetDemo() {
  state.progress = { ...SAMPLE_PROGRESS };
  state.watchedAt = {};
  state.list = new Set();
  save();
  toast("Demo data reset", "check");
  state.focusKey = "reset-demo";
  render(false);
}

/* ---------- Hero ---------- */

function cycleHero(delta) {
  const list = featuredList();
  if (list.length < 2) return;
  state.heroIndex = mod(state.heroIndex + delta, list.length);
  ui.heroChangedAt = Date.now();
  const hero = document.querySelector(".hero");
  if (!hero) return;
  const key = state.focusKey;
  const hadFocus = hero.contains(document.activeElement);
  hero.innerHTML = heroInner(motionReduced() ? 0 : delta);
  if (hadFocus) {
    focusEl(findKey(key));
  } else if (!document.body.classList.contains("in-rows")) {
    const item = list[state.heroIndex];
    setBackdrop(item.id, item.colors);
  }
}

function tickHero() {
  if (state.screen !== "home" || state.stack.length || state.overlay || document.hidden || ambientVisible()) return;
  if (document.body.classList.contains("in-rows")) return;
  const now = Date.now();
  if (now - ui.lastInput < HERO_ROTATE_MS || now - ui.heroChangedAt < HERO_ROTATE_MS) return;
  cycleHero(1);
}

/* ---------- Player ---------- */

function osdVisible() {
  return !state.playing || !!state.upNext || !!state.overlay || Date.now() < state.osdUntil;
}

function showOsd() {
  state.osdUntil = Date.now() + OSD_HIDE_MS;
  if (state.screen === "media") updateMediaUi();
  else updatePlayerUi();
}

function togglePlay() {
  if (state.position >= PREVIEW_SECONDS - 0.2) {
    state.position = 0;
    state.playing = true;
    if (state.upNext) cancelUpNext(false);
  } else {
    state.playing = !state.playing;
  }
  ui.lastTick = Date.now();
  saveProgress();
  showOsd();
}

function seek(delta) {
  const item = itemById(state.mediaId);
  if (item && item.kind === "live") return;
  state.position = Math.min(PREVIEW_SECONDS, Math.max(0, state.position + delta));
  if (state.upNext && state.position < PREVIEW_SECONDS) cancelUpNext(false);
  saveProgress();
  showOsd();
}

function toggleCaptions() {
  state.prefs.captions = !state.prefs.captions;
  save();
  const cc = document.getElementById("captions");
  if (cc) cc.hidden = !state.prefs.captions;
  const btn = findKey("player-cc");
  if (btn) btn.setAttribute("aria-pressed", String(state.prefs.captions));
  toast(state.prefs.captions ? "Captions on" : "Captions off", "cc");
  showOsd();
}

function captionLine(item, pos) {
  const parts = [`[${item.genre.toLowerCase()} theme rises]`, ...item.blurb.split(/,\s+|\.\s*/).filter(Boolean), "[room tone]", "[music fades]"];
  const index = Math.min(parts.length - 1, Math.floor(pos / (PREVIEW_SECONDS / parts.length)));
  return parts[index];
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el && el.textContent !== text) el.textContent = text;
}

function updatePlayerUi() {
  const player = document.getElementById("player");
  if (!player) return;
  const item = itemById(state.mediaId) || catalog[0];
  const ratio = Math.min(1, state.position / PREVIEW_SECONDS);
  const pct = `${(ratio * 100).toFixed(2)}%`;
  const fill = document.getElementById("scrub-fill");
  const knob = document.getElementById("scrub-knob");
  const tip = document.getElementById("scrub-tip");
  if (fill) fill.style.width = pct;
  if (knob) knob.style.left = pct;
  if (tip) tip.style.left = pct;
  setText("scrub-tip", formatClock(state.position));
  setText("t-cur", formatClock(state.position));
  setText("t-left", item.kind === "live" ? "Live" : `-${formatClock(PREVIEW_SECONDS - state.position)}`);
  const scrub = document.getElementById("scrub");
  if (scrub) {
    scrub.setAttribute("aria-valuenow", String(Math.round(state.position)));
    scrub.setAttribute("aria-valuetext", `${formatClock(state.position)} of ${formatClock(PREVIEW_SECONDS)}`);
  }
  const toggle = document.getElementById("player-toggle");
  const ended = state.position >= PREVIEW_SECONDS - 0.2 && !state.playing;
  const mode = ended ? "replay" : state.playing ? "pause" : "play";
  if (toggle && toggle.dataset.mode !== mode) {
    toggle.dataset.mode = mode;
    toggle.innerHTML = icon(mode === "replay" ? "restart" : mode);
    toggle.setAttribute("aria-label", mode === "replay" ? "Replay" : mode === "pause" ? "Pause" : "Play");
  }
  player.classList.toggle("is-paused", !state.playing);
  player.classList.toggle("osd-on", osdVisible());
  if (state.prefs.captions) setText("captions", captionLine(item, state.position));
}

function startUpNext() {
  const item = itemById(state.mediaId);
  const next = item && nextItem(item);
  if (!next || !state.prefs.autoplayNext) {
    updatePlayerUi();
    return;
  }
  state.upNext = { id: next.id, deadline: Date.now() + UP_NEXT_MS };
  const art = artOf(next.colors, next.id);
  const box = document.getElementById("upnext");
  if (!box) return;
  box.innerHTML = `
    <p class="kicker">Up next</p>
    <div class="un-body">
      <span class="un-art ${art.cls}" style="${art.style}"></span>
      <div><h3 class="un-title">${esc(next.title)}</h3><p class="un-meta">${esc(captionFor(next))}</p></div>
    </div>
    <div class="un-bar"><span id="un-fill"></span></div>
    <p class="un-count" id="un-count"></p>
    <div class="actions">
      <button type="button" class="btn btn--primary" data-key="upnext-play" data-action="upnext-play">${icon("play")}<span>Play now</span></button>
      <button type="button" class="btn" data-key="upnext-cancel" data-action="upnext-cancel">Cancel</button>
    </div>`;
  box.hidden = false;
  focusEl(findKey("upnext-play"));
  updateUpNext();
  updatePlayerUi();
}

function updateUpNext() {
  if (!state.upNext) return;
  const left = Math.max(0, state.upNext.deadline - Date.now());
  const fill = document.getElementById("un-fill");
  if (fill) fill.style.width = `${(left / UP_NEXT_MS) * 100}%`;
  setText("un-count", `Starts in ${Math.ceil(left / 1000)} s`);
}

function cancelUpNext(refocus = true) {
  state.upNext = null;
  const box = document.getElementById("upnext");
  if (box) {
    box.hidden = true;
    box.innerHTML = "";
  }
  if (refocus) focusEl(findKey("player-toggle"));
  updatePlayerUi();
}

function playNext() {
  const current = itemById(state.mediaId);
  const target = (state.upNext && state.upNext.id) || (current && nextItem(current) ? nextItem(current).id : null);
  if (!target) return;
  saveProgress();
  state.mediaId = target;
  startPlayback(target, true);
  state.focusKey = "player-toggle";
  render();
}

function onEnded() {
  state.playing = false;
  saveProgress();
  startUpNext();
}

function tickPlayer() {
  if (state.screen === "media") {
    tickMedia();
    return;
  }
  if (state.screen !== "player") return;
  const now = Date.now();
  if (state.upNext) {
    if (now >= state.upNext.deadline) playNext();
    else updateUpNext();
    return;
  }
  if (!state.playing) {
    ui.lastTick = now;
    updatePlayerUi();
    return;
  }
  const delta = Math.min(1, Math.max(0, (now - ui.lastTick) / 1000));
  ui.lastTick = now;
  state.position = Math.min(PREVIEW_SECONDS, state.position + delta);
  if (state.position >= PREVIEW_SECONDS) {
    onEnded();
    return;
  }
  if (now - ui.lastSave > 2000) {
    ui.lastSave = now;
    saveProgress();
  }
  updatePlayerUi();
}

function playerCommand(cmd) {
  const item = itemById(state.mediaId);
  const live = item && item.kind === "live";
  if (cmd === "playpause") { togglePlay(); return true; }
  if (cmd === "play") { if (!state.playing) togglePlay(); return true; }
  if (cmd === "pause") { if (state.playing) togglePlay(); return true; }
  if (cmd === "ff" || cmd === "rw") { if (!live) seek(cmd === "ff" ? 10 : -10); showOsd(); return true; }
  if (state.upNext) return false;
  if (!osdVisible()) {
    if (cmd === "ok") { togglePlay(); return true; }
    if (cmd === "left" || cmd === "right") {
      if (!live) seek(cmd === "right" ? 10 : -10);
      showOsd();
      return true;
    }
    if (cmd === "up" || cmd === "down") { showOsd(); return true; }
    return false;
  }
  showOsd();
  if ((cmd === "left" || cmd === "right") && state.focusKey === "player-scrub" && !live) {
    seek(cmd === "right" ? 10 : -10);
    return true;
  }
  return false;
}

/* ---------- Search ---------- */

function typeChar(ch) {
  if (state.query.length >= 40) return;
  state.query += ch;
  updateSearch();
}

function updateSearch() {
  const text = document.getElementById("query-text");
  if (!text) return;
  text.textContent = state.query;
  const key = state.focusKey;
  const box = document.getElementById("search-results");
  if (box) box.innerHTML = searchResults();
  const el = findKey(key) || findKey("kb-a");
  if (el && document.activeElement !== el) focusEl(el, { noScroll: true });
}

function setMicUi() {
  const mic = document.querySelector('[data-key="kb-mic"]');
  if (mic) mic.classList.toggle("is-listening", ui.listening);
  const query = document.getElementById("query");
  if (query) query.classList.toggle("is-listening", ui.listening);
}

function startVoice() {
  if (!SpeechRec) return;
  if (ui.listening && ui.rec) {
    ui.rec.stop();
    return;
  }
  try {
    const rec = new SpeechRec();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      state.query = Array.from(event.results).map((r) => r[0].transcript).join("").toLowerCase().slice(0, 40);
      updateSearch();
    };
    rec.onerror = (event) => {
      toast(event.error === "not-allowed" ? "Microphone access is blocked" : "Voice search did not catch that", "mic");
    };
    rec.onend = () => {
      ui.listening = false;
      setMicUi();
    };
    rec.start();
    ui.rec = rec;
    ui.listening = true;
    setMicUi();
    toast("Listening…", "mic");
  } catch {
    toast("Voice search is not available in this browser", "mic");
  }
}

/* ---------- Sheet (options menu and confirms) ---------- */

function openSheet(sheet) {
  ui.sheetActions = sheet.actions;
  ui.sheetReturn = state.focusKey;
  state.overlay = { kicker: sheet.kicker || "", title: sheet.title, body: sheet.body || "", layout: sheet.layout || "sheet" };
  renderOverlay();
  focusEl(findKey("sheet-0"));
  if (state.screen === "player") updatePlayerUi();
}

function renderOverlay() {
  const box = document.getElementById("overlay");
  if (!box) return;
  if (!state.overlay) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  const o = state.overlay;
  box.hidden = false;
  box.dataset.layout = o.layout;
  if (o.layout === "source") {
    box.innerHTML = `
      <div class="sheet-scrim" data-action="sheet-close"></div>
      <div class="source-bar glass" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <div class="source-head">${icon("input")}<h2 id="sheet-title">${esc(o.title)}</h2><span class="source-hint">${esc(o.body)}</span></div>
        <div class="sources" data-zone="sources">
          ${ui.sheetActions.map((a, i) => `
            <button type="button" class="source-card${a.current ? " is-current" : ""}" data-key="sheet-${i}" data-action="sheet" data-index="${i}" aria-label="${esc(`${a.input}, ${a.label}${a.current ? ", current" : ""}`)}">
              <span class="source-input">${esc(a.input)}</span>
              <span class="source-ic">${icon(a.icon)}</span>
              <span class="source-name">${esc(a.label)}</span>
              <span class="source-desc">${esc(a.desc || "")}</span>
            </button>`).join("")}
        </div>
      </div>`;
    return;
  }
  box.innerHTML = `
    <div class="sheet-scrim" data-action="sheet-close"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      ${o.kicker ? `<p class="kicker">${esc(o.kicker)}</p>` : ""}
      <h2 id="sheet-title">${esc(o.title)}</h2>
      ${o.body ? `<p class="lede">${esc(o.body)}</p>` : ""}
      <div class="sheet-actions" data-zone="sheet">
        ${ui.sheetActions.map((a, i) => `<button type="button" class="sheet-btn${a.danger ? " is-danger" : ""}" data-key="sheet-${i}" data-action="sheet" data-index="${i}">${icon(a.icon)}<span>${esc(a.label)}</span></button>`).join("")}
      </div>
      <p class="sheet-hint">Back closes</p>
    </div>`;
}

function closeOverlay(restore = true) {
  state.overlay = null;
  renderOverlay();
  if (restore) {
    state.focusKey = ui.sheetReturn;
    const el = findKey(ui.sheetReturn);
    if (el) focusEl(el, { noScroll: true });
    else restoreFocus();
  }
  if (state.screen === "player") showOsd();
}

function runSheet(index) {
  const action = ui.sheetActions[index];
  closeOverlay(true);
  if (action) action.run();
}

function openMenuFor(el) {
  if (!el || state.screen === "player") return false;
  if (el.dataset.ftype) return openFileMenu(el);
  const id = el.dataset.item;
  const item = id && itemById(id);
  if (!item) return false;
  const resumable = isResumable(id);
  const inList = state.list.has(id);
  const actions = [
    { label: resumable ? `Resume · ${remainingText(item)}` : item.kind === "live" ? "Watch live" : "Play", icon: "play", run: () => openPlayer(id) }
  ];
  if (resumable) actions.push({ label: "Play from start", icon: "restart", run: () => openPlayer(id, { fromStart: true }) });
  if (state.screen !== "detail" || state.mediaId !== id) actions.push({ label: "Details", icon: "info", run: () => openDetail(id) });
  actions.push({ label: inList ? "Remove from My List" : "Add to My List", icon: inList ? "close" : "plus", run: () => toggleList(id) });
  if (resumable) actions.push({ label: "Remove from Continue watching", icon: "close", run: () => removeFromContinue(id) });
  openSheet({ kicker: `${kindLabel(item.kind)} · ${item.genre}`, title: item.title, actions });
  return true;
}

/* ---------- My PC: folders and files ---------- */

function openDir(path) {
  if (!path) return;
  const dir = /^[A-Za-z]:$/.test(path) ? `${path}\\` : path;
  delete ui.lists[dir];
  pushScreen(() => {
    state.screen = "files";
    state.path = dir;
    state.focusKey = null;
  });
}

function entryFromEl(el) {
  const set = fileSets[el.dataset.section] || [];
  const path = el.dataset.path;
  const entry = set.find((e) => e.path === path) || { path, name: baseName(path), type: el.dataset.ftype, size: 0 };
  return { set, entry };
}

function openFileFrom(el, opts = {}) {
  const { set, entry } = entryFromEl(el);
  openFile(entry, set, opts);
}

function openFile(entry, set, opts = {}) {
  if (!entry || !["video", "audio", "image"].includes(entry.type)) {
    toast("Smart TV plays videos, music, and photos", "file");
    return;
  }
  const list = (set && set.length ? set : [entry]).filter((e) => e.type === entry.type);
  const index = Math.max(0, list.findIndex((e) => e.path === entry.path));
  pushScreen(() => {
    state.screen = "media";
    state.media = { list, index, fromStart: !!opts.fromStart, slideshow: false };
    state.focusKey = "media-toggle";
  });
}

function parentDir(path) {
  const dir = path.replace(/[\\/][^\\/]*$/, "");
  return /^[A-Za-z]:$/.test(dir) ? `${dir}\\` : dir;
}

function openFileMenu(el) {
  const { set, entry } = entryFromEl(el);
  const prog = state.mediaProgress[entry.path];
  const resumable = prog && prog.d && prog.t > 5 && prog.t < prog.d - 10;
  const actions = [];
  if (entry.type === "image") {
    actions.push({ label: "View", icon: "image", run: () => openFile(entry, set) });
    actions.push({ label: "Set as wallpaper", icon: "image", run: () => setWallpaper(`file:${entry.path}`) });
  } else {
    actions.push({ label: resumable ? `Resume at ${formatClock(prog.t)}` : "Play", icon: "play", run: () => openFile(entry, set) });
    if (resumable) {
      actions.push({ label: "Play from start", icon: "restart", run: () => openFile(entry, set, { fromStart: true }) });
      actions.push({
        label: "Remove from Continue on this PC",
        icon: "close",
        run: () => {
          delete state.mediaProgress[entry.path];
          save();
          toast(`Removed ${stripExt(entry.name)}`, "close");
          render(false);
        }
      });
    }
  }
  const folder = parentDir(entry.path);
  if (state.screen !== "files" || state.path !== folder) {
    actions.push({ label: `Open folder · ${folderOf(entry.path) || folder}`, icon: "folder", run: () => openDir(folder) });
  }
  const kind = entry.type === "audio" ? "Music" : entry.type === "image" ? "Photo" : "Video";
  openSheet({ kicker: [kind, formatBytes(entry.size)].filter(Boolean).join(" · "), title: stripExt(entry.name), actions });
  return true;
}

/* ---------- Media player for files ---------- */

function mediaEl() {
  return document.getElementById("mv");
}

function wireMedia() {
  const entry = currentEntry();
  if (!entry) return;
  clearTimeout(ui.slideTimer);
  state.osdUntil = Date.now() + OSD_HIDE_MS;
  if (entry.type === "image") {
    state.playing = true;
    if (state.media.slideshow) ui.slideTimer = setTimeout(() => mediaStep(1), 5000);
    updateMediaUi();
    return;
  }
  const el = mediaEl();
  if (!el) return;
  applyAppVolume();
  state.playing = true;
  el.addEventListener("loadedmetadata", () => {
    const prog = state.mediaProgress[entry.path];
    if (!state.media.fromStart && prog && prog.t > 5 && prog.t < el.duration - 10) {
      el.currentTime = prog.t;
      toast(`Resumed at ${formatClock(prog.t)}`, "play");
    }
    state.media.fromStart = false;
    updateMediaUi();
  });
  el.addEventListener("play", () => { state.playing = true; updateMediaUi(); });
  el.addEventListener("pause", () => { state.playing = false; saveMediaProgress(); updateMediaUi(); });
  el.addEventListener("ended", onMediaEnded);
  el.addEventListener("error", () => showMediaError(entry));
  const started = el.play();
  if (started && started.catch) started.catch(() => { state.playing = false; updateMediaUi(); });
  updateMediaUi();
}

function showMediaError(entry) {
  const box = document.getElementById("media-error");
  state.playing = false;
  if (box) {
    box.innerHTML = `
      <span class="empty-mark">${icon(entry.type === "audio" ? "music" : "film")}</span>
      <h2>This ${esc(extOf(entry.name))} file won't play here</h2>
      <p class="lede">The browser can't decode it. MP4 (H.264), WebM, MP3, M4A, FLAC, and WAV play best.</p>`;
    box.hidden = false;
  }
  updateMediaUi();
}

function saveMediaProgress() {
  const entry = currentEntry();
  const el = mediaEl();
  if (!entry || !el || entry.type === "image") return;
  const d = el.duration;
  if (!Number.isFinite(d) || d < 30) return;
  const t = el.currentTime;
  if (t > d - 10) delete state.mediaProgress[entry.path];
  else if (t > 5) state.mediaProgress[entry.path] = { t, d, at: Date.now(), name: entry.name, type: entry.type, size: entry.size };
  const keys = Object.keys(state.mediaProgress);
  if (keys.length > 60) {
    keys.sort((a, b) => state.mediaProgress[a].at - state.mediaProgress[b].at)
      .slice(0, keys.length - 60)
      .forEach((k) => delete state.mediaProgress[k]);
  }
  save();
}

function leaveMedia() {
  saveMediaProgress();
  const el = mediaEl();
  if (el) el.pause();
  clearTimeout(ui.slideTimer);
  state.playing = false;
}

function updateMediaUi() {
  const player = document.getElementById("player");
  const entry = currentEntry();
  if (!player || state.screen !== "media" || !entry) return;
  player.classList.toggle("osd-on", osdVisible());
  player.classList.toggle("is-paused", !state.playing);
  const toggle = document.getElementById("player-toggle");
  const setToggle = (mode, label) => {
    if (toggle && toggle.dataset.mode !== mode) {
      toggle.dataset.mode = mode;
      toggle.innerHTML = icon(mode === "replay" ? "restart" : mode);
      toggle.setAttribute("aria-label", label);
    }
  };
  if (entry.type === "image") {
    setToggle(state.media.slideshow ? "pause" : "play", state.media.slideshow ? "Stop slideshow" : "Start slideshow");
    return;
  }
  const el = mediaEl();
  if (!el) return;
  const d = Number.isFinite(el.duration) ? el.duration : 0;
  const t = el.currentTime || 0;
  const pct = d ? `${((t / d) * 100).toFixed(2)}%` : "0%";
  const fill = document.getElementById("scrub-fill");
  const knob = document.getElementById("scrub-knob");
  const tip = document.getElementById("scrub-tip");
  if (fill) fill.style.width = pct;
  if (knob) knob.style.left = pct;
  if (tip) tip.style.left = pct;
  setText("scrub-tip", formatClock(t));
  setText("t-cur", formatClock(t));
  setText("t-left", d ? `-${formatClock(d - t)}` : "--:--");
  const scrub = document.getElementById("scrub");
  if (scrub) {
    scrub.setAttribute("aria-valuemax", String(Math.round(d)));
    scrub.setAttribute("aria-valuenow", String(Math.round(t)));
    scrub.setAttribute("aria-valuetext", `${formatClock(t)} of ${formatClock(d)}`);
  }
  if (el.ended) setToggle("replay", "Replay");
  else if (el.paused) setToggle("play", "Play");
  else setToggle("pause", "Pause");
}

function tickMedia() {
  const now = Date.now();
  if (state.playing && now - ui.mediaSaveAt > 5000) {
    ui.mediaSaveAt = now;
    saveMediaProgress();
  }
  updateMediaUi();
}

function mediaToggle() {
  const entry = currentEntry();
  if (!entry) return;
  if (entry.type === "image") {
    state.media.slideshow = !state.media.slideshow;
    clearTimeout(ui.slideTimer);
    if (state.media.slideshow) ui.slideTimer = setTimeout(() => mediaStep(1), 5000);
    toast(state.media.slideshow ? "Slideshow on · a new photo every 5 seconds" : "Slideshow off", "image");
    showOsd();
    return;
  }
  const el = mediaEl();
  if (!el) return;
  if (el.ended) el.currentTime = 0;
  if (el.paused) el.play().catch(() => {});
  else el.pause();
  showOsd();
}

function mediaSeek(delta) {
  const el = mediaEl();
  if (!el || !Number.isFinite(el.duration)) return;
  el.currentTime = Math.min(el.duration, Math.max(0, el.currentTime + delta));
  showOsd();
}

function mediaStep(dir) {
  const m = state.media;
  if (!m || m.list.length < 2) return;
  saveMediaProgress();
  state.media = { ...m, index: mod(m.index + dir, m.list.length), fromStart: false };
  render(false);
}

function onMediaEnded() {
  state.playing = false;
  saveMediaProgress();
  const m = state.media;
  if (state.prefs.autoplayNext && m && m.index < m.list.length - 1) {
    toast(`Next: ${stripExt(m.list[m.index + 1].name)}`, "next");
    setTimeout(() => {
      if (state.screen === "media" && state.media === m) mediaStep(1);
    }, 1500);
  } else {
    showOsd();
  }
}

function mediaCommand(cmd) {
  const entry = currentEntry();
  if (!entry) return false;
  const image = entry.type === "image";
  if (cmd === "playpause" || cmd === "play" || cmd === "pause") {
    mediaToggle();
    return true;
  }
  if (cmd === "ff" || cmd === "rw") {
    if (image) mediaStep(cmd === "ff" ? 1 : -1);
    else mediaSeek(cmd === "ff" ? 10 : -10);
    return true;
  }
  if (!osdVisible()) {
    if (cmd === "ok") { mediaToggle(); return true; }
    if (cmd === "left" || cmd === "right") {
      if (image) mediaStep(cmd === "right" ? 1 : -1);
      else mediaSeek(cmd === "right" ? 10 : -10);
      return true;
    }
    if (cmd === "up" || cmd === "down") { showOsd(); return true; }
    return false;
  }
  showOsd();
  if ((cmd === "left" || cmd === "right") && state.focusKey === "player-scrub") {
    mediaSeek(cmd === "right" ? 10 : -10);
    return true;
  }
  return false;
}

/* ---------- Wallpaper ---------- */

function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("smarttv-wallpaper", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const req = db.transaction("files").objectStore("files").get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  const db = await idb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    tx.objectStore("files").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let wallObjectUrl = "";

async function wallpaperUrl() {
  const wp = state.prefs.wallpaper || "desktop";
  if (wp === "art") return "";
  if (wp === "custom") {
    try {
      const blob = await idbGet("wallpaper");
      if (!blob) return "";
      if (wallObjectUrl) URL.revokeObjectURL(wallObjectUrl);
      wallObjectUrl = URL.createObjectURL(blob);
      return wallObjectUrl;
    } catch {
      return "";
    }
  }
  if (wp.startsWith("file:")) return server.ok ? fileUrl(wp.slice(5)) : "";
  return server.ok && server.wallpaper ? withKey(`/api/wallpaper?t=${Date.now()}`) : "";
}

async function applyWallpaper() {
  const url = await wallpaperUrl();
  const wall = document.getElementById("bd-wall");
  if (!wall) return;
  const clear = () => {
    ui.wallUrl = "";
    wall.style.backgroundImage = "";
    document.body.classList.remove("has-wall");
  };
  if (!url) {
    clear();
    return;
  }
  const img = new Image();
  img.onload = () => {
    ui.wallUrl = url;
    wall.style.backgroundImage = `url("${url}")`;
    document.body.classList.add("has-wall");
    if (state.screen === "settings" && state.settingsTab === "wallpaper") refreshPane();
  };
  img.onerror = clear;
  img.src = url;
}

function setWallpaper(value) {
  state.prefs.wallpaper = value;
  save();
  applyWallpaper();
  const names = { desktop: "Desktop wallpaper on", custom: "Your picture is the wallpaper", art: "Wallpaper off · artwork follows focus" };
  toast(names[value] || "Photo set as wallpaper", "image");
  if (state.screen === "settings") refreshPane();
}

function chooseWallpaper(id) {
  if (id === "custom") {
    pickWallpaperFile();
    return;
  }
  if (id === "file") return;
  if (id === "desktop" && !server.wallpaper) {
    toast("Start the companion (py server.py) to use your desktop wallpaper", "pc");
    return;
  }
  setWallpaper(id);
}

function pickWallpaperFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      await idbPut("wallpaper", file);
      setWallpaper("custom");
    } catch {
      toast("This browser could not keep the picture", "close");
    }
  });
  input.click();
}

/* ---------- Volume ---------- */

function applyAppVolume() {
  const el = mediaEl();
  if (!el) return;
  el.volume = server.volume ? 1 : Math.max(0, Math.min(1, state.prefs.appVolume));
  el.muted = !server.volume && ui.volume.muted;
}

function showVolume(label) {
  const box = document.getElementById("volume");
  if (!box) return;
  const v = ui.volume;
  const pct = Math.round(v.level * 100);
  const ic = !v.known ? "volume" : v.muted || pct === 0 ? "mute" : pct < 50 ? "volumeLow" : "volume";
  const level = v.known && !v.muted ? pct : 0;
  box.innerHTML = `
    <span class="vol-num">${v.known ? (v.muted ? "Mute" : pct) : ""}</span>
    <span class="vol-track${v.known ? "" : " is-unknown"}"><span class="vol-fill" style="height:${level}%"></span></span>
    <span class="vol-ic">${icon(ic)}</span>
    <span class="vol-label">${esc(label)}</span>`;
  box.setAttribute("aria-label", v.known ? `${label} ${v.muted ? "muted" : `${pct} percent`}` : label);
  box.hidden = false;
  requestAnimationFrame(() => box.classList.add("is-on"));
  clearTimeout(ui.volTimer);
  ui.volTimer = setTimeout(() => {
    box.classList.remove("is-on");
    setTimeout(() => { if (!box.classList.contains("is-on")) box.hidden = true; }, 400);
  }, 2200);
}

async function refreshVolume(show) {
  if (!server.volume) return;
  try {
    const v = await api("/api/volume");
    const before = ui.volume;
    const changed = before.known && (Math.abs(v.level - before.level) > 0.004 || v.muted !== before.muted);
    ui.volume = { level: v.level, muted: v.muted, known: true };
    if (show || changed) showVolume("PC volume");
  } catch {
    /* the companion went away */
  }
}

async function changeVolume(cmd) {
  if (server.volume) {
    if (ui.volBusy) return;
    ui.volBusy = true;
    try {
      const body = cmd === "mute" ? { mute: !ui.volume.muted } : { delta: cmd === "volup" ? 0.02 : -0.02 };
      const v = await api("/api/volume", body);
      ui.volume = { level: v.level, muted: v.muted, known: true };
      showVolume("PC volume");
    } catch (err) {
      toast(err.message, "volume");
    } finally {
      ui.volBusy = false;
    }
    return;
  }
  if (cmd === "mute") ui.volume.muted = !ui.volume.muted;
  else {
    state.prefs.appVolume = Math.max(0, Math.min(1, state.prefs.appVolume + (cmd === "volup" ? 0.05 : -0.05)));
    ui.volume.muted = false;
  }
  ui.volume.level = state.prefs.appVolume;
  ui.volume.known = true;
  save();
  applyAppVolume();
  showVolume("TV volume");
}

// The keyboard's own volume keys: Windows changes the volume itself, so read it back and show it.
function hardwareVolume(cmd) {
  if (server.volume) {
    setTimeout(() => refreshVolume(true), 140);
    return;
  }
  const was = ui.volume.known;
  ui.volume.known = false;
  showVolume(cmd === "hwmute" ? "System volume · mute" : cmd === "hwvolup" ? "System volume up" : "System volume down");
  ui.volume.known = was;
}

/* ---------- Apps, sources, and the signal screen ---------- */

function showSignal(input, name, sub, app) {
  const box = document.getElementById("signal");
  if (!box) return;
  const face = app
    ? `<span class="sig-app" style="--a:${app.colors[0]};--b:${app.colors[1]}">${app.iconSrc ? `<img src="${esc(app.iconSrc)}" alt="" />` : `<span class="app-word app-word--${app.word || "plain"}">${esc(app.name)}</span>`}</span>`
    : "";
  box.innerHTML = `
    <div class="sig-noise"></div>
    <div class="sig-label"><span class="sig-input">${esc(input)}</span><span class="sig-name">${esc(name)}</span></div>
    <div class="sig-center">${face}<span class="sig-sub" id="sig-sub">${esc(sub)}</span><span class="sig-note" id="sig-note"></span></div>`;
  box.classList.toggle("is-app", !!app);
  clearTimeout(ui.signalTimer);
  box.hidden = false;
  requestAnimationFrame(() => box.classList.add("is-on"));
}

function setSignalText(sub, note) {
  setText("sig-sub", sub);
  setText("sig-note", note || "");
}

function hideSignal(delay) {
  const box = document.getElementById("signal");
  if (!box) return;
  clearTimeout(ui.signalTimer);
  ui.signalTimer = setTimeout(() => {
    box.classList.remove("is-on");
    setTimeout(() => { if (!box.classList.contains("is-on")) box.hidden = true; }, 600);
  }, delay);
}

function launchApp(app) {
  if (!server.canLaunch && !app.url) {
    toast(`Open ${app.name} from the PC running Smart TV`, "pc");
    return;
  }
  ui.wasFullscreen = !!document.fullscreenElement;
  showSignal("App", app.name, `Opening ${app.name}…`, app);
  setTimeout(async () => {
    try {
      if (server.canLaunch) {
        if (app.chromeId) await api("/api/launch", { id: app.chromeId });
        else await api("/api/open-url", { url: app.url });
        ui.away = true;
        setSignalText(`${app.name} is open`, app.chromeId ? "Close its window to come back here" : "Alt+F4 closes it and brings you back");
        hideSignal(2600);
      } else {
        const win = window.open(app.url, "_blank");
        if (win) {
          win.opener = null;
          ui.away = true;
        } else {
          toast("Allow pop-ups for this page so apps can open", "close");
        }
        hideSignal(300);
      }
    } catch (err) {
      toast(err.message, "close");
      hideSignal(0);
    }
  }, 650);
}

function openSourceMenu() {
  if (state.overlay) closeOverlay(false);
  openSheet({
    layout: "source",
    title: "Source",
    body: "Left and right choose · OK switches · Back closes",
    actions: [
      { input: "HDMI 1", label: "Smart TV", icon: "tv", desc: "You're here", current: true, run: () => switchSource("tv") },
      { input: "HDMI 2", label: "Browser", icon: "globe", desc: server.canLaunch ? "A new Chrome window" : "Leaves full screen and opens a tab", run: () => switchSource("browser") },
      { input: "HDMI 3", label: "Desktop", icon: "desktop", desc: server.canLaunch ? "The Windows desktop" : "Needs the companion", run: () => switchSource("desktop") }
    ]
  });
  focusEl(findKey("sheet-1"));
}

function switchSource(target) {
  const names = { tv: ["HDMI 1", "Smart TV"], browser: ["HDMI 2", "Browser"], desktop: ["HDMI 3", "Desktop"] };
  const [input, name] = names[target];
  if (target === "tv") {
    showSignal(input, name, "Connected");
    hideSignal(900);
    return;
  }
  if (target === "desktop" && !server.canLaunch) {
    toast("Start the companion (py server.py) to switch to the desktop", "desktop");
    return;
  }
  ui.wasFullscreen = !!document.fullscreenElement;
  showSignal(input, name, "Switching source…");
  setTimeout(async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    try {
      if (server.canLaunch) await api("/api/source", { target });
      else {
        const win = window.open("https://www.google.com/", "_blank");
        if (win) win.opener = null;
      }
      ui.away = true;
      setSignalText(`Now showing ${name}`, "Come back to this window any time. Smart TV is on HDMI 1");
      hideSignal(2400);
    } catch (err) {
      toast(err.message, "close");
      hideSignal(0);
    }
  }, 900);
}

function onReturn() {
  if (!ui.away || document.hidden) return;
  ui.away = false;
  showSignal("HDMI 1", "Smart TV", "Connected");
  hideSignal(1100);
  if (state.screen === "media" || state.screen === "player") showOsd();
  if (ui.wasFullscreen && !document.fullscreenElement) {
    ui.refullscreen = true;
    setTimeout(() => toast("Press OK to go back to full screen", "tv"), 900);
  }
  refreshVolume(false);
}

/* ---------- Companion connection ---------- */

async function refreshApps(force) {
  if (!server.ok) return;
  try {
    const data = await api(`/api/apps${force ? "?refresh=1" : ""}`);
    ui.chromeApps = Array.isArray(data.apps) ? data.apps : [];
    if (force) {
      toast(`Found ${ui.chromeApps.length} Chrome shortcut${ui.chromeApps.length === 1 ? "" : "s"}`, "refresh");
      render(false);
    }
  } catch (err) {
    if (force) toast(err.message, "close");
  }
}

async function loadLibrary() {
  try {
    ui.library = await api("/api/library");
  } catch {
    ui.library = null;
  }
}

async function connectCompanion() {
  if (!location.protocol.startsWith("http")) return;
  try {
    const status = await api("/api/status");
    server.ok = !!status.ok;
    server.canLaunch = !!status.canLaunch;
    server.volume = !!status.volume;
    server.wallpaper = !!status.wallpaper;
  } catch {
    return;
  }
  await Promise.allSettled([refreshApps(false), loadLibrary(), refreshVolume(false)]);
  applyWallpaper();
  if (["home", "apps", "settings", "files"].includes(state.screen)) render(false);
}

/* ---------- Toasts, sound, ambient ---------- */

function toast(text, ic) {
  const box = document.getElementById("toasts");
  if (!box) return;
  while (box.children.length > 2) box.firstElementChild.remove();
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${ic ? icon(ic) : ""}<span>${esc(text)}</span>`;
  box.append(el);
  setTimeout(() => el.classList.add("out"), 2600);
  setTimeout(() => el.remove(), 3100);
}

function sound(type) {
  if (!state.prefs.sounds) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    ui.audio = ui.audio || new Ctx();
    const ctx = ui.audio;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = { move: 1180, select: 740, back: 520, edge: 240 }[type] || 800;
    const t = ctx.currentTime;
    osc.type = type === "edge" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (type === "select") osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.06);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(type === "move" ? 0.03 : 0.06, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (type === "move" ? 0.05 : 0.11));
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  } catch {
    /* audio is optional */
  }
}

function ambientVisible() {
  const box = document.getElementById("ambient");
  return !!box && !box.hidden && box.classList.contains("is-on");
}

function markActivity() {
  clearTimeout(ui.idleTimer);
  if (!state.prefs.ambient) return;
  ui.idleTimer = setTimeout(() => {
    if (((state.screen === "player" || state.screen === "media") && state.playing) || state.overlay) {
      markActivity();
      return;
    }
    showAmbient();
  }, IDLE_AMBIENT_MS);
}

function paintAmbient(fade) {
  const item = catalog[mod(ui.ambientIdx, catalog.length)];
  const art = artOf(item.colors, `${item.id}-amb`);
  const layer = document.getElementById("amb-art");
  if (!layer) return;
  const apply = () => {
    layer.className = `amb-art grain ${art.cls}`;
    layer.style.cssText = art.style;
    setText("amb-title", `${item.title} · ${item.genre}`);
  };
  if (fade && !motionReduced()) {
    layer.classList.add("fading");
    setTimeout(apply, 1200);
  } else {
    apply();
  }
}

function showAmbient() {
  if (!state.prefs.ambient || state.overlay || ambientVisible()) return;
  const box = document.getElementById("ambient");
  if (!box) return;
  box.hidden = false;
  ui.ambientIdx = Math.floor(Math.random() * catalog.length);
  paintAmbient(false);
  tickClock();
  requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add("is-on")));
  clearInterval(ui.ambientTimer);
  ui.ambientTimer = setInterval(() => {
    ui.ambientIdx += 1;
    paintAmbient(true);
  }, 14000);
}

function hideAmbient() {
  const box = document.getElementById("ambient");
  if (!box) return;
  box.classList.remove("is-on");
  clearInterval(ui.ambientTimer);
  setTimeout(() => {
    if (!box.classList.contains("is-on")) box.hidden = true;
  }, 800);
  markActivity();
}

function tickClock() {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const clock = document.getElementById("clock");
  if (clock && clock.textContent !== time) {
    clock.textContent = time;
    clock.dateTime = now.toISOString();
  }
  if (ambientVisible() || !document.getElementById("ambient").hidden) {
    setText("amb-clock", time);
    setText("amb-date", now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }));
  }
}

/* ---------- Input ---------- */

const KEY_COMMANDS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "ok",
  NumpadEnter: "ok",
  " ": "ok",
  Escape: "back",
  Backspace: "back",
  BrowserBack: "back",
  GoBack: "back",
  XF86Back: "back",
  ContextMenu: "menu",
  MediaPlayPause: "playpause",
  MediaPlay: "play",
  MediaPause: "pause",
  MediaStop: "pause",
  MediaFastForward: "ff",
  MediaRewind: "rw",
  MediaTrackNext: "ff",
  MediaTrackPrevious: "rw",
  BrowserHome: "home",
  GoHome: "home",
  AudioVolumeUp: "hwvolup",
  AudioVolumeDown: "hwvoldown",
  AudioVolumeMute: "hwmute",
  VolumeUp: "hwvolup",
  VolumeDown: "hwvoldown",
  VolumeMute: "hwmute",
  TVInput: "source",
  "+": "volup",
  "=": "volup",
  "-": "voldown"
};

// LG webOS and Samsung Tizen remotes report these key codes.
const KEYCODE_COMMANDS = {
  461: "back", 10009: "back", 415: "play", 19: "pause", 413: "pause", 417: "ff", 412: "rw", 10252: "playpause",
  447: "volup", 448: "voldown", 449: "mute", 10072: "source",
  175: "hwvolup", 174: "hwvoldown", 173: "hwmute"
};

function commandFor(event) {
  return KEY_COMMANDS[event.key] || KEYCODE_COMMANDS[event.keyCode] || null;
}

function dispatch(cmd, target) {
  ui.lastInput = Date.now();
  markActivity();
  if (/^(hw)?vol|mute$/.test(cmd)) {
    if (cmd.startsWith("hw")) hardwareVolume(cmd);
    else changeVolume(cmd);
    return;
  }
  if (ambientVisible()) {
    hideAmbient();
    return;
  }
  if (state.screen === "player" && !state.overlay && playerCommand(cmd)) return;
  if (state.screen === "media" && !state.overlay && mediaCommand(cmd)) return;
  switch (cmd) {
    case "volup":
    case "voldown":
    case "mute":
      changeVolume(cmd);
      break;
    case "hwvolup":
    case "hwvoldown":
    case "hwmute":
      hardwareVolume(cmd);
      break;
    case "source":
      if (state.overlay && state.overlay.layout === "source") closeOverlay();
      else openSourceMenu();
      break;
    case "up":
    case "down":
    case "left":
    case "right":
      move(cmd);
      break;
    case "ok":
      activate(target || currentEl());
      break;
    case "back":
      back();
      break;
    case "home":
      goHome();
      break;
    case "menu": {
      const el = currentEl();
      if (!openMenuFor(el)) bump(el, "down");
      break;
    }
    case "play":
    case "playpause": {
      const el = currentEl();
      if (el && el.dataset.item) openPlayer(el.dataset.item);
      break;
    }
    default:
      break;
  }
}

function pressStart() {
  if ((state.screen === "player" || state.screen === "media") && !state.overlay && !osdVisible()) {
    dispatch("ok");
    return;
  }
  const el = currentEl();
  if (!el) {
    dispatch("down");
    return;
  }
  const press = { el, consumed: false, timer: 0 };
  press.timer = setTimeout(() => {
    if (ui.press === press && openMenuFor(el)) {
      press.consumed = true;
      el.classList.remove("is-pressed");
    }
  }, LONG_PRESS_MS);
  ui.press = press;
  el.classList.add("is-pressed");
}

function pressEnd() {
  const press = ui.press;
  if (!press) return;
  ui.press = null;
  clearTimeout(press.timer);
  press.el.classList.remove("is-pressed");
  if (!press.consumed) dispatch("ok", press.el.isConnected ? press.el : null);
}

function cancelPress() {
  if (!ui.press) return;
  clearTimeout(ui.press.timer);
  ui.press.el.classList.remove("is-pressed");
  ui.press = null;
}

function handleSearchTyping(event) {
  if (event.key === "Backspace") {
    event.preventDefault();
    if (state.query) {
      state.query = state.query.slice(0, -1);
      updateSearch();
    } else {
      back();
    }
    return true;
  }
  if (event.key.length === 1 && /[\p{L}\p{N} '&-]/u.test(event.key)) {
    event.preventDefault();
    typeChar(event.key.toLowerCase());
    return true;
  }
  return false;
}

function hotkey(event) {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === "f") toggleFull();
  else if (key === "m") dispatch("menu");
  else if (key === "i") dispatch("source");
  else if (key === "0") dispatch("mute");
  else if (key === "/") { event.preventDefault(); openNav("search"); }
  else if (state.screen === "player" && key === "k") dispatch("playpause");
  else if (state.screen === "player" && key === "j") dispatch("rw");
  else if (state.screen === "player" && key === "l") dispatch("ff");
}

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (ui.refullscreen && !document.fullscreenElement && !event.key.startsWith("Audio")) {
    ui.refullscreen = false;
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
    if (commandFor(event) === "ok") {
      event.preventDefault();
      return;
    }
  }
  ui.inputMode = "key";
  ui.lastInput = Date.now();
  markActivity();
  if (ambientVisible()) {
    event.preventDefault();
    if (!event.repeat) hideAmbient();
    return;
  }
  if (state.screen === "search" && !state.overlay && handleSearchTyping(event)) return;
  const cmd = commandFor(event);
  if (!cmd) {
    hotkey(event);
    return;
  }
  if (cmd.startsWith("hw")) {
    // Let Windows change the volume as usual; just show it.
    if (!event.repeat || server.volume) dispatch(cmd);
    return;
  }
  event.preventDefault();
  if (cmd === "ok") {
    if (!event.repeat) pressStart();
    return;
  }
  if (cmd === "back" && event.repeat) return;
  dispatch(cmd);
}

function onKeyUp(event) {
  if (commandFor(event) === "ok") {
    event.preventDefault();
    pressEnd();
  }
}

function toggleFull() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
    return;
  }
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
}

function onClick(event) {
  const el = event.target.closest ? event.target.closest("[data-action]") : null;
  if (!el || el.closest("#remote")) return;
  if (!el.closest("#app") && !el.closest("#overlay")) return;
  ui.lastInput = Date.now();
  if (el.dataset.key && document.activeElement !== el) focusEl(el, { noScroll: true });
  activate(el);
}

function tilt(el, event) {
  if (motionReduced()) return;
  document.querySelectorAll(".is-tilted").forEach((node) => {
    if (!el || !el.contains(node)) {
      node.classList.remove("is-tilted");
      node.style.removeProperty("--rx");
      node.style.removeProperty("--ry");
    }
  });
  if (!el) return;
  const art = el.querySelector(".tile-art, .app-art");
  if (!art || document.activeElement !== el) return;
  const r = art.getBoundingClientRect();
  const x = (event.clientX - r.left) / r.width - 0.5;
  const y = (event.clientY - r.top) / r.height - 0.5;
  art.classList.add("is-tilted");
  art.style.setProperty("--rx", `${(-y * 9).toFixed(2)}deg`);
  art.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
}

function onPointerMove(event) {
  markActivity();
  if (ambientVisible()) {
    hideAmbient();
    return;
  }
  if (event.pointerType && event.pointerType !== "mouse") return;
  if (Math.abs(event.clientX - ui.pointer.x) + Math.abs(event.clientY - ui.pointer.y) < 3) return;
  ui.pointer = { x: event.clientX, y: event.clientY };
  ui.inputMode = "pointer";
  if (state.screen === "player") showOsd();
  const el = event.target.closest ? event.target.closest("[data-key]") : null;
  const root = focusRoot();
  if (el && root && root.contains(el) && el.dataset.key !== state.focusKey) {
    ui.lastInput = Date.now();
    focusEl(el, { noScroll: true });
  }
  tilt(el, event);
}

function onContextMenu(event) {
  const el = event.target.closest ? event.target.closest("[data-item]") : null;
  if (!el || !el.dataset.key) return;
  event.preventDefault();
  focusEl(el, { noScroll: true });
  openMenuFor(el);
}

function pollPads() {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  if (!pads.length) {
    ui.gpRaf = 0;
    return;
  }
  const pad = pads[0];
  const btn = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
  const ax = (i) => pad.axes[i] || 0;
  const now = performance.now();
  const inputs = {
    up: btn(12) || ax(1) < -0.6,
    down: btn(13) || ax(1) > 0.6,
    left: btn(14) || ax(0) < -0.6,
    right: btn(15) || ax(0) > 0.6,
    ok: btn(0),
    back: btn(1),
    menu: btn(3),
    playpause: btn(2),
    voldown: btn(4),
    volup: btn(5),
    home: btn(9) || btn(16)
  };
  for (const [cmd, down] of Object.entries(inputs)) {
    const s = ui.gp[cmd] || (ui.gp[cmd] = { down: false, next: 0 });
    const repeats = cmd === "up" || cmd === "down" || cmd === "left" || cmd === "right";
    if (down && !s.down) {
      s.down = true;
      s.next = now + 380;
      ui.inputMode = "key";
      dispatch(cmd);
    } else if (down && repeats && now >= s.next) {
      s.next = now + 95;
      dispatch(cmd);
    } else if (!down) {
      s.down = false;
    }
  }
  ui.gpRaf = requestAnimationFrame(pollPads);
}

function renderRemote() {
  const box = document.getElementById("remote");
  if (!box) return;
  const open = !!state.prefs.remoteOpen;
  const b = (cmd, label, inner, cls = "") => `<button type="button" tabindex="-1" class="${cls}" data-cmd="${cmd}" aria-label="${label}">${inner}</button>`;
  box.classList.toggle("is-open", open);
  box.innerHTML = `
    <div class="remote-body glass" role="group" aria-label="On-screen remote"${open ? "" : " hidden"}>
      <div class="dpad">
        ${b("up", "Up", icon("chevU"), "dp dp-up")}
        ${b("left", "Left", icon("chevL"), "dp dp-left")}
        ${b("ok", "OK", "OK", "dp dp-ok")}
        ${b("right", "Right", icon("chevR"), "dp dp-right")}
        ${b("down", "Down", icon("chevD"), "dp dp-down")}
      </div>
      <div class="remote-row">
        ${b("back", "Back", icon("chevL"))}
        ${b("home", "Home", icon("home"))}
        ${b("menu", "Options", icon("dots"))}
        ${b("playpause", "Play or pause", icon("playpause"))}
      </div>
      <div class="remote-row">
        ${b("voldown", "Volume down", icon("volDown"))}
        ${b("mute", "Mute", icon("mute"))}
        ${b("volup", "Volume up", icon("volUp"))}
        ${b("source", "Source", icon("input"))}
      </div>
    </div>
    <button type="button" tabindex="-1" class="remote-fab glass" data-cmd="toggle-remote" aria-expanded="${open}" aria-label="${open ? "Hide" : "Show"} on-screen remote">${icon(open ? "close" : "remote")}</button>`;
}

function onRemoteClick(event) {
  const btn = event.target.closest ? event.target.closest("[data-cmd]") : null;
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  ui.inputMode = "key";
  if (cmd === "toggle-remote") {
    state.prefs.remoteOpen = !state.prefs.remoteOpen;
    save();
    renderRemote();
    return;
  }
  dispatch(cmd);
}

/* ---------- Boot ---------- */

function init() {
  load();
  applyPrefs();
  document.addEventListener("click", onClick);
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerdown", () => { markActivity(); if (ambientVisible()) hideAmbient(); }, { passive: true });
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.screen === "player" && state.playing) {
      state.playing = false;
      saveProgress();
      updatePlayerUi();
    }
  });
  document.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) >= Math.abs(event.deltaX)) ui.pointerScroll = true;
  }, { passive: true, capture: true });
  document.addEventListener("touchmove", () => { ui.pointerScroll = true; }, { passive: true, capture: true });
  document.addEventListener("scroll", (event) => {
    const target = event.target;
    if (!target || target.id !== "screen") {
      if (target && target.classList && target.classList.contains("scroller")) ui.pointerScroll = false;
      return;
    }
    document.body.classList.toggle("scrolled", target.scrollTop > 24);
    if (!ui.pointerScroll) return;
    ui.pointerScroll = false;
    revealTopbar();
  }, true);
  window.addEventListener("blur", cancelPress);
  window.addEventListener("focus", onReturn);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) onReturn(); });
  ui.volume = { level: state.prefs.appVolume, muted: false, known: false };
  setInterval(() => {
    if (server.volume && document.fullscreenElement && !document.hidden) refreshVolume(false);
  }, 900);
  window.addEventListener("popstate", onPopState);
  window.addEventListener("gamepadconnected", () => {
    if (!ui.gpRaf) ui.gpRaf = requestAnimationFrame(pollPads);
    toast("Gamepad connected", "check");
  });
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", applyPrefs);

  const remote = document.getElementById("remote");
  remote.addEventListener("mousedown", (event) => event.preventDefault());
  remote.addEventListener("click", onRemoteClick);
  renderRemote();

  document.getElementById("ambient").innerHTML = `
    <div class="amb-art grain" id="amb-art"></div>
    <div class="amb-scrim"></div>
    <div class="amb-info"><time id="amb-clock" class="amb-clock"></time><p id="amb-date" class="amb-date"></p><p id="amb-title" class="amb-title"></p></div>
    <p class="amb-hint">Press any key to return</p>`;

  try {
    history.replaceState({ tv: 0 }, "");
  } catch {
    /* ignore */
  }

  setInterval(tickClock, 1000);
  setInterval(tickHero, 1000);
  setInterval(tickPlayer, 250);
  markActivity();
  render();
  applyWallpaper();
  connectCompanion();

  if (!state.prefs.seenTips) {
    setTimeout(() => toast("Tip: hold OK, or press M, for options on any title", "info"), 1600);
    state.prefs.seenTips = true;
    save();
  }
}

init();
