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

const apps = [
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
  { id: "list", label: "My List", icon: "bookmark" },
  { id: "settings", label: "Settings", icon: "sliders", iconOnly: true }
];

const SETTINGS_TABS = [
  { id: "display", label: "Display & motion" },
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
  seenTips: false
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
  gp: {}
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
  cloud: '<path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.6 4.5 4.5 0 0 0 7 18.5z"/>'
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

function appById(id) {
  return apps.find((app) => app.id === id);
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
  const whole = Math.max(0, Math.round(totalSeconds));
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
  state.list = new Set(saved && Array.isArray(saved.list) ? saved.list.filter(itemById) : []);
  state.prefs = { ...DEFAULT_PREFS, ...(saved && saved.prefs ? saved.prefs : {}) };
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      progress: state.progress,
      watchedAt: state.watchedAt,
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
      <div class="top-end"><time id="clock" class="clock"></time><span class="avatar" aria-hidden="true">G</span></div>
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
  return `
    <button type="button" class="app-tile" data-key="${section}-${app.id}" data-action="app" data-id="${app.id}" data-app="${app.id}"${preferred ? ' data-preferred="1"' : ""} aria-label="${esc(app.name)}">
      <span class="app-art" style="--a:${app.colors[0]};--b:${app.colors[1]}">${icon(app.icon)}<span class="sheen"></span></span>
      <span class="tile-cap">${esc(app.name)}</span>
    </button>`;
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
  rows.push({ id: "top", title: "Top 10 today", items: TOP_TEN_IDS.map(itemById).filter(Boolean), variant: "tall", ranked: true });
  rows.push({ id: "apps", title: "Your apps", apps: true });
  rows.push({ id: "live", title: "Live now", items: byKind("live"), variant: "wide" });
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
    if (row.apps) return rowHtml(row.id, row.title, apps.map((app) => appTile(app, `r-${row.id}`)).join(""), "apps");
    return mediaRow(row);
  }).join("");
  return `
    <section class="hero" data-zone="hero" data-top>${heroInner()}</section>
    <div class="rows">${rows}</div>`;
}

function pageHead(title, lede, extra = "") {
  return `<header class="page-head">${extra}<div><h1>${esc(title)}</h1>${lede ? `<p class="lede">${lede}</p>` : ""}</div></header>`;
}

function renderApps() {
  return `
    <div class="page">
      ${pageHead("Apps", "Everything on this TV. Weather is a sample panel.")}
      <div class="grid grid--apps" data-zone="grid">${apps.map((app, i) => appTile(app, "grid", i === 0)).join("")}</div>
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
  const appHits = apps.filter((app) => `${app.name} ${app.blurb}`.toLowerCase().includes(q));
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
      return paneHead("About & reset", "Smart TV 13 · a browser launcher with a remote.")
        + `<button type="button" class="path path--danger" data-key="reset-demo" data-action="reset">
            <span class="path-title">Reset demo data</span>
            <span class="path-body">Brings back the sample Continue watching row and clears My List. Your settings stay.</span>
          </button>`;
  }
}

function renderSettings() {
  const tabs = SETTINGS_TABS.map((tab) => `
    <button type="button" class="side-item${tab.id === state.settingsTab ? " is-on" : ""}" data-key="set-${tab.id}" data-action="settings-tab" data-id="${tab.id}">
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

function renderBody() {
  const screens = {
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
  const names = { home: "Home", apps: "Apps", list: "My List", search: "Search", settings: "Settings" };
  return names[state.screen] || "Home";
}

function render(animate = true) {
  const root = document.getElementById("app");
  const chrome = state.screen !== "player" && state.stack.length === 0;
  const prev = currentEl();
  if (prev) {
    const zone = prev.closest("[data-zone]");
    ui.hint = zone ? { zone: zone.dataset.zone, index: [...zone.querySelectorAll("[data-key]")].indexOf(prev) } : null;
  }
  document.body.dataset.screen = state.screen;
  document.body.classList.toggle("no-chrome", !chrome);
  document.body.classList.remove("in-rows", "scrolled");
  const backPill = !chrome && state.screen !== "player"
    ? `<button type="button" class="back-pill glass" data-action="back" tabindex="-1" aria-label="Back">${icon("chevL")}<span>Back</span></button>`
    : "";
  const enter = animate && !motionReduced() ? " enter" : "";
  root.innerHTML = `${chrome ? topbar() : backPill}<main id="screen" class="screen screen--${state.screen}${enter}">${renderBody()}</main>`;
  document.title = `Smart TV · ${screenTitle()}`;
  screenBackdrop();
  restoreFocus();
  tickClock();
  if (state.screen === "player") updatePlayerUi();
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
  if (state.screen !== "detail" && state.screen !== "player") {
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
  el = el || all.find((e) => e.dataset.preferred) || all[0];
  ui.hint = null;
  ui.instantScroll = true;
  if (el) focusEl(el);
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
  if (el.dataset.action === "nav" && el.closest(".topbar") && ui.inputMode === "key") scheduleTab(el);
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
    settingsTab: state.settingsTab
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
  pushScreen(() => {
    state.appId = id;
    state.focusKey = null;
    state.screen = app.mode === "list" ? "list" : "app";
  });
}

function leavePlayer() {
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
  updatePlayerUi();
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
  state.overlay = { kicker: sheet.kicker || "", title: sheet.title, body: sheet.body || "" };
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
    if ((state.screen === "player" && state.playing) || state.overlay) {
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
  GoHome: "home"
};

// LG webOS and Samsung Tizen remotes report these key codes.
const KEYCODE_COMMANDS = { 461: "back", 10009: "back", 415: "play", 19: "pause", 413: "pause", 417: "ff", 412: "rw", 10252: "playpause" };

function commandFor(event) {
  return KEY_COMMANDS[event.key] || KEYCODE_COMMANDS[event.keyCode] || null;
}

function dispatch(cmd, target) {
  ui.lastInput = Date.now();
  markActivity();
  if (ambientVisible()) {
    hideAmbient();
    return;
  }
  if (state.screen === "player" && !state.overlay && playerCommand(cmd)) return;
  switch (cmd) {
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
  if (state.screen === "player" && !state.overlay && !osdVisible()) {
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
  else if (key === "/") { event.preventDefault(); openNav("search"); }
  else if (state.screen === "player" && key === "k") dispatch("playpause");
  else if (state.screen === "player" && key === "j") dispatch("rw");
  else if (state.screen === "player" && key === "l") dispatch("ff");
}

function onKeyDown(event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
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
  document.addEventListener("scroll", (event) => {
    if (event.target && event.target.id === "screen") {
      document.body.classList.toggle("scrolled", event.target.scrollTop > 24);
    }
  }, true);
  window.addEventListener("blur", cancelPress);
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

  if (!state.prefs.seenTips) {
    setTimeout(() => toast("Tip: hold OK, or press M, for options on any title", "info"), 1600);
    state.prefs.seenTips = true;
    save();
  }
}

init();
