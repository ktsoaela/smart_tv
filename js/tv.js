// Smart TV launcher. Arrow keys match the on-screen remote.

const PREVIEW_SECONDS = 60;
const STORAGE_KEY = "smarttv.v13";

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
  { id: "cinema", name: "Cinema", mode: "kind", kind: "movie", blurb: "Films on this launcher.", colors: ["#3a1d14", "#e07a45"] },
  { id: "series", name: "Series", mode: "kind", kind: "show", blurb: "Series and shorter episodes.", colors: ["#142033", "#7eb6ff"] },
  { id: "livedesk", name: "Live Desk", mode: "kind", kind: "live", blurb: "The channels on the live row.", colors: ["#2a1216", "#ff6b6b"] },
  { id: "spotlight", name: "Spotlight", mode: "all", blurb: "Every title on this TV.", colors: ["#241a33", "#d2b4ff"] },
  { id: "shelf", name: "Your List", mode: "list", blurb: "Titles you saved on this TV.", colors: ["#14261c", "#8fd0a8"] },
  { id: "weather", name: "Weather", mode: "panel", panelTitle: "21°", blurb: "Clear over the demo city. This panel is a sample, not a live forecast.", colors: ["#163042", "#9ad7ff"] }
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

const navItems = [
  ["home", "Home"],
  ["apps", "Apps"],
  ["list", "Your list"],
  ["search", "Search"],
  ["settings", "Settings"]
];

const state = {
  screen: "home",
  focusKey: null,
  stack: [],
  appId: null,
  mediaId: null,
  query: "",
  helpId: "streamer",
  progress: {},
  list: new Set(),
  position: 0,
  playing: false
};

let lastProgressSave = 0;

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function kindLabel(kind) {
  if (kind === "movie") return "Movie";
  if (kind === "show") return "Series";
  return "Live";
}

function itemById(id) {
  return catalog.find((item) => item.id === id);
}

function appById(id) {
  return apps.find((app) => app.id === id);
}

function metaLine(item) {
  const runtime = item.kind === "live" ? "On now" : `${item.minutes} min`;
  return `${kindLabel(item.kind)} · ${item.genre} · ${item.year} · ${runtime}`;
}

function moreLabel(kind) {
  if (kind === "movie") return "More movies";
  if (kind === "show") return "More series";
  return "More live";
}

function columnCount() {
  const width = window.innerWidth;
  if (width < 720) return 2;
  if (width < 1100) return 3;
  if (width < 1500) return 4;
  return 6;
}

function featuredItem() {
  return catalog.find((item) => {
    const progress = state.progress[item.id] || 0;
    return progress > 0.02 && progress < 0.98;
  }) || catalog[0];
}

function load() {
  const sample = { progress: { "night-market": 0.42, "copper-line": 0.18 }, list: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    state.progress = saved && saved.progress ? saved.progress : sample.progress;
    state.list = new Set(saved && Array.isArray(saved.list) ? saved.list : sample.list);
  } catch {
    state.progress = sample.progress;
    state.list = new Set();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      progress: state.progress,
      list: [...state.list]
    }));
  } catch {
    /* keep going if the browser blocks storage */
  }
}

function saveProgress() {
  if (!state.mediaId) return;
  state.progress[state.mediaId] = Math.min(1, state.position / PREVIEW_SECONDS);
  save();
}

function leavePlayer() {
  if (state.screen !== "player") return;
  state.playing = false;
  saveProgress();
}

function snapshot() {
  return {
    screen: state.screen,
    focusKey: state.focusKey,
    appId: state.appId,
    mediaId: state.mediaId,
    query: state.query
  };
}

function formatClock(totalSeconds) {
  const whole = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(whole / 60)).padStart(2, "0");
  const seconds = String(whole % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function navCurrent(id) {
  if (id === "apps" && state.screen === "app") return true;
  if (id === "home" && (state.screen === "home" || state.screen === "detail")) return true;
  return state.screen === id;
}

function screenTitle() {
  const names = {
    home: "Home",
    apps: "Apps",
    list: "Your list",
    search: "Search",
    settings: "Settings",
    app: "App"
  };
  return names[state.screen] || "Home";
}

function navHtml() {
  const buttons = navItems.map(([id, label], col) => `
    <button type="button" class="nav-btn" data-key="nav-${id}" data-row="0" data-col="${col}" data-action="nav" data-id="${id}" data-label="${label}" aria-current="${navCurrent(id) ? "page" : "false"}">${label}</button>
  `).join("");
  return `<nav class="nav" aria-label="Sections">${buttons}</nav>`;
}

function topbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <img src="assets/logo.svg" width="36" height="36" alt="" />
        <span>Smart TV</span>
      </div>
      ${navHtml()}
      <p class="hints">Arrows move · Enter opens · Esc back · F fullscreen</p>
      <div class="top-end">
        <p id="focus-label" class="focus-label" aria-live="polite"></p>
        <time id="clock"></time>
        <span class="avatar" title="Guest">G</span>
      </div>
    </header>`;
}

function remoteHtml() {
  const pad = (label, glyph, action, extra = "") => `
    <button type="button" tabindex="-1" data-action="${action}" aria-label="${label}" ${extra}>${glyph}</button>`;
  return `
    <aside class="remote" aria-label="On-screen remote">
      <p class="remote-title">Remote</p>
      <div class="pad-grid">
        <span></span>
        ${pad("Up", "↑", "move", 'data-dr="-1" data-dc="0"')}
        <span></span>
        ${pad("Left", "←", "move", 'data-dr="0" data-dc="-1"')}
        ${pad("OK", "OK", "remote-ok")}
        ${pad("Right", "→", "move", 'data-dr="0" data-dc="1"')}
        <span></span>
        ${pad("Down", "↓", "move", 'data-dr="1" data-dc="0"')}
        <span></span>
      </div>
      <div class="remote-row">
        ${pad("Back", "Back", "remote-back")}
        ${pad("Home", "Home", "remote-home")}
      </div>
      <p class="remote-hint">OK opens · Back returns</p>
    </aside>`;
}

function shell(html, chrome) {
  return `
    <div class="shell">
      ${chrome ? topbar() : ""}
      <main class="screen">${html}</main>
      ${remoteHtml()}
    </div>`;
}

function mediaButton(item, row, col, section, preferred = false) {
  const progress = state.progress[item.id] || 0;
  const showBar = progress > 0.02 && progress < 0.98;
  const runtime = item.kind === "live" ? "On now" : `${item.minutes} min`;
  return `
    <button type="button" class="card" data-key="${section}-${item.id}" data-row="${row}" data-col="${col}" data-action="detail" data-id="${item.id}" data-label="${esc(item.title)}" data-a="${item.colors[0]}" data-b="${item.colors[1]}" style="--a:${item.colors[0]};--b:${item.colors[1]}" ${preferred ? 'data-preferred="1"' : ""}>
      <span class="poster">
        <span class="tag${item.kind === "live" ? " live" : ""}">${esc(kindLabel(item.kind))}</span>
        <span class="poster-title">${esc(item.title)}</span>
      </span>
      <span class="card-meta">${esc(item.genre)} · ${runtime}</span>
      ${showBar ? `<span class="bar"><span style="width:${Math.round(progress * 100)}%"></span></span>` : ""}
    </button>`;
}

function appButton(app, row, col, section, preferred = false) {
  return `
    <button type="button" class="app" data-key="${section}-${app.id}" data-row="${row}" data-col="${col}" data-action="app" data-id="${app.id}" data-label="${esc(app.name)}" data-a="${app.colors[0]}" data-b="${app.colors[1]}" ${preferred ? 'data-preferred="1"' : ""}>
      <span class="app-mark" style="--a:${app.colors[0]};--b:${app.colors[1]}">${esc(app.name.slice(0, 1))}</span>
      <span class="app-name">${esc(app.name)}</span>
    </button>`;
}

function homeRows() {
  const watching = catalog.filter((item) => {
    const progress = state.progress[item.id] || 0;
    return progress > 0.02 && progress < 0.98;
  });
  return [
    { id: "cont", title: "Continue watching", kind: "media", items: watching },
    { id: "apps", title: "Apps", kind: "app", items: apps },
    { id: "picks", title: "Top picks", kind: "media", items: catalog.slice(0, 8) },
    { id: "movies", title: "Movies", kind: "media", items: catalog.filter((item) => item.kind === "movie") },
    { id: "series", title: "Series", kind: "media", items: catalog.filter((item) => item.kind === "show") },
    { id: "live", title: "Live", kind: "media", items: catalog.filter((item) => item.kind === "live") }
  ].filter((section) => section.items.length);
}

function renderHome() {
  const feature = featuredItem();
  let row = 2;
  const rows = homeRows().map((section) => {
    const currentRow = row;
    row += 1;
    const buttons = section.items.map((item, col) => (
      section.kind === "app"
        ? appButton(item, currentRow, col, section.id)
        : mediaButton(item, currentRow, col, section.id)
    )).join("");
    return `<section class="row"><h2>${esc(section.title)}</h2><div class="scroller">${buttons}</div></section>`;
  }).join("");

  return `
    <section class="hero" style="--a:${feature.colors[0]};--b:${feature.colors[1]}">
      <p class="kicker">Featured</p>
      <h1>${esc(feature.title)}</h1>
      <p class="sub">${esc(metaLine(feature))}</p>
      <p class="blurb">${esc(feature.blurb)}</p>
      <div class="hero-actions">
        <button type="button" class="primary" data-key="hero-play" data-row="1" data-col="0" data-action="play" data-id="${feature.id}" data-label="Play ${esc(feature.title)}" data-a="${feature.colors[0]}" data-b="${feature.colors[1]}" data-preferred="1">Play</button>
        <button type="button" class="ghost" data-key="hero-info" data-row="1" data-col="1" data-action="detail" data-id="${feature.id}" data-label="Details for ${esc(feature.title)}" data-a="${feature.colors[0]}" data-b="${feature.colors[1]}">Details</button>
      </div>
    </section>
    ${rows}`;
}

function renderApps() {
  const cols = columnCount();
  const buttons = apps.map((app, index) => appButton(
    app,
    1 + Math.floor(index / cols),
    index % cols,
    "grid",
    index === 0
  )).join("");
  return `
    <div class="page">
      <h1>Apps</h1>
      <p class="lede">Open a shelf. Weather is a sample panel.</p>
      <div class="grid" style="--cols:${cols}">${buttons}</div>
    </div>`;
}

function renderList() {
  const items = catalog.filter((item) => state.list.has(item.id));
  if (!items.length) {
    return `
      <div class="page">
        <h1>Your list</h1>
        <p class="lede">Your list is empty. Open a title and choose Add to list.</p>
        <button type="button" class="primary" data-key="list-empty" data-row="1" data-col="0" data-action="nav" data-id="home" data-label="Browse home" data-preferred="1">Browse home</button>
      </div>`;
  }
  const cols = columnCount();
  const buttons = items.map((item, index) => mediaButton(
    item,
    1 + Math.floor(index / cols),
    index % cols,
    "list",
    index === 0
  )).join("");
  return `
    <div class="page">
      <h1>Your list</h1>
      <div class="grid" style="--cols:${cols}">${buttons}</div>
    </div>`;
}

function searchResultsMarkup() {
  const query = state.query.trim().toLowerCase();
  const media = catalog.filter((item) => {
    if (!query) return true;
    return `${item.title} ${item.genre} ${kindLabel(item.kind)}`.toLowerCase().includes(query);
  });
  const appHits = query
    ? apps.filter((app) => `${app.name} ${app.blurb}`.toLowerCase().includes(query))
    : [];
  const cols = columnCount();
  const cells = [
    ...appHits.map((app) => ({ type: "app", value: app })),
    ...media.map((item) => ({ type: "media", value: item }))
  ];
  const buttons = cells.map((cell, index) => {
    const row = 2 + Math.floor(index / cols);
    const col = index % cols;
    return cell.type === "app"
      ? appButton(cell.value, row, col, "find")
      : mediaButton(cell.value, row, col, "find");
  }).join("");
  const empty = query && !cells.length
    ? `<p class="lede">Nothing matches “${esc(state.query.trim())}”.</p>`
    : "";
  return `${empty}<div class="grid" style="--cols:${cols}">${buttons}</div>`;
}

function renderSearch() {
  return `
    <div class="page">
      <h1>Search</h1>
      <input id="search-input" type="search" placeholder="Titles and apps" autocomplete="off" value="${esc(state.query)}" data-key="search-input" data-row="1" data-col="0" data-action="type" data-label="Search" data-preferred="1" />
      <div id="search-results">${searchResultsMarkup()}</div>
    </div>`;
}

function renderSettings() {
  const cards = paths.map((path) => {
    const selected = state.helpId === path.id;
    return `
      <button type="button" class="path${selected ? " is-on" : ""}" data-key="path-${path.id}" data-row="${paths.indexOf(path) + 1}" data-col="0" data-action="help" data-id="${path.id}" data-label="${esc(path.title)}" aria-pressed="${selected ? "true" : "false"}" ${selected ? 'data-preferred="1"' : ""}>
        <span class="path-title">${esc(path.title)}</span>
        ${selected ? `<span class="path-body">${esc(path.body)}</span>` : ""}
      </button>`;
  }).join("");
  return `
    <div class="page settings">
      <h1>How this TV gets smart</h1>
      <p class="lede">Pick a path. The open card has the steps.</p>
      ${cards}
      <button type="button" class="path" data-key="reset-demo" data-row="${paths.length + 1}" data-col="0" data-action="reset" data-label="Reset demo data">
        <span class="path-title">Reset demo data</span>
        <span class="path-body">Restores the sample Continue watching row and clears Your list.</span>
      </button>
    </div>`;
}

function renderDetail() {
  const item = itemById(state.mediaId) || catalog[0];
  const related = catalog.filter((other) => other.kind === item.kind && other.id !== item.id).slice(0, 8);
  const relatedHtml = related.length
    ? `<section class="row"><h2>${esc(moreLabel(item.kind))}</h2><div class="scroller">${related.map((other, col) => mediaButton(other, 2, col, "related")).join("")}</div></section>`
    : "";
  return `
    <article class="detail" style="--a:${item.colors[0]};--b:${item.colors[1]}">
      <div class="detail-poster" style="--a:${item.colors[0]};--b:${item.colors[1]}">
        <span class="poster-title">${esc(item.title)}</span>
      </div>
      <div>
        <p class="kicker">${esc(kindLabel(item.kind))}</p>
        <h1>${esc(item.title)}</h1>
        <p class="sub">${esc(metaLine(item))}</p>
        <p class="blurb">${esc(item.blurb)}</p>
        <div class="hero-actions">
          <button type="button" class="primary" data-key="detail-play" data-row="1" data-col="0" data-action="play" data-id="${item.id}" data-label="Play ${esc(item.title)}" data-a="${item.colors[0]}" data-b="${item.colors[1]}" data-preferred="1">Play</button>
          <button type="button" class="ghost" data-key="detail-list" data-row="1" data-col="1" data-action="toggle-list" data-id="${item.id}" data-label="${state.list.has(item.id) ? "In your list" : "Add to list"}">${state.list.has(item.id) ? "In your list" : "Add to list"}</button>
          <button type="button" class="ghost" data-key="detail-back" data-row="1" data-col="2" data-action="back" data-label="Back">Back</button>
        </div>
      </div>
    </article>
    ${relatedHtml}`;
}

function renderApp() {
  const app = appById(state.appId) || apps[0];
  if (app.mode === "panel") {
    return `
      <section class="panel" style="--a:${app.colors[0]};--b:${app.colors[1]}">
        <p class="kicker">Demo panel</p>
        <h1>${esc(app.panelTitle || app.name)}</h1>
        <p class="lede">${esc(app.blurb)}</p>
        <button type="button" class="ghost" data-key="panel-back" data-row="1" data-col="0" data-action="back" data-label="Back" data-preferred="1">Back</button>
      </section>`;
  }
  const items = app.mode === "all" ? catalog : catalog.filter((item) => item.kind === app.kind);
  const cols = columnCount();
  const buttons = items.map((item, index) => mediaButton(
    item,
    1 + Math.floor(index / cols),
    index % cols,
    `app-${app.id}`,
    index === 0
  )).join("");
  return `
    <div class="page">
      <p class="kicker">App</p>
      <h1>${esc(app.name)}</h1>
      <p class="lede">${esc(app.blurb)}</p>
      <div class="grid" style="--cols:${cols}">${buttons}</div>
    </div>`;
}

function renderPlayer() {
  const item = itemById(state.mediaId) || catalog[0];
  return `
    <section class="player" style="--a:${item.colors[0]};--b:${item.colors[1]}">
      <div class="preview" style="--a:${item.colors[0]};--b:${item.colors[1]}">
        <p class="kicker">Preview</p>
        <h1>${esc(item.title)}</h1>
        <p class="blurb">${esc(item.blurb)} This is a ${PREVIEW_SECONDS}-second preview, not a broadcast.</p>
      </div>
      <div class="timeline" aria-hidden="true"><span id="playhead"></span></div>
      <p id="timecode" class="timecode">00:00 / 01:00</p>
      <div class="controls">
        <button type="button" data-key="player-back10" data-row="0" data-col="0" data-action="seek" data-delta="-10" data-label="Back 10 seconds">-10s</button>
        <button type="button" id="player-toggle" data-key="player-toggle" data-row="0" data-col="1" data-action="toggle-play" data-label="Play or pause" data-preferred="1">Pause</button>
        <button type="button" data-key="player-fwd10" data-row="0" data-col="2" data-action="seek" data-delta="10" data-label="Forward 10 seconds">+10s</button>
        <button type="button" data-key="player-exit" data-row="0" data-col="3" data-action="back" data-label="Exit preview">Exit</button>
      </div>
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

function glowColors() {
  if (state.screen === "detail" || state.screen === "player") {
    const item = itemById(state.mediaId);
    if (item) return item.colors;
  }
  if (state.screen === "app") {
    const app = appById(state.appId);
    if (app) return app.colors;
  }
  return featuredItem().colors;
}

function render() {
  const colors = glowColors();
  document.documentElement.style.setProperty("--glow-a", colors[0]);
  document.documentElement.style.setProperty("--glow-b", colors[1]);
  document.body.dataset.screen = state.screen;
  document.getElementById("app").innerHTML = shell(renderBody(), state.screen !== "player");
  const current = itemById(state.mediaId);
  document.title = current && (state.screen === "detail" || state.screen === "player")
    ? `Smart TV · ${current.title}`
    : `Smart TV · ${screenTitle()}`;
  bindSearch();
  restoreFocus();
}

function bindSearch() {
  const input = document.getElementById("search-input");
  if (!input) return;
  input.addEventListener("input", () => {
    state.query = input.value;
    const box = document.getElementById("search-results");
    if (box) box.innerHTML = searchResultsMarkup();
  });
}

function restoreFocus() {
  const wanted = state.focusKey
    ? document.querySelector(`[data-key="${CSS.escape(state.focusKey)}"]`)
    : null;
  const el = wanted || document.querySelector("[data-preferred='1']") || document.querySelector("[data-key]");
  if (el) focusEl(el);
  if (state.screen === "player") updatePlayerUi();
  tickClock();
}

function focusEl(el) {
  state.focusKey = el.dataset.key;
  el.focus({ preventScroll: true });
}

function applyGlow(el) {
  if (!el || !el.dataset.a) return;
  document.documentElement.style.setProperty("--glow-a", el.dataset.a);
  document.documentElement.style.setProperty("--glow-b", el.dataset.b || el.dataset.a);
}

function onFocusIn(event) {
  const el = event.target.closest ? event.target.closest("[data-key]") : null;
  if (!el) return;
  state.focusKey = el.dataset.key;
  applyGlow(el);
  const label = document.getElementById("focus-label");
  if (label) label.textContent = el.dataset.label || "";
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function itemsMatch(row, col) {
  return [...document.querySelectorAll("[data-key]")].find((el) => (
    Number(el.dataset.row) === row && Number(el.dataset.col) === col
  ));
}

function move(rowDelta, colDelta) {
  const all = [...document.querySelectorAll("[data-key]")];
  if (!all.length) return;
  const current = all.find((el) => el.dataset.key === state.focusKey) || all[0];
  const row = Number(current.dataset.row);
  const col = Number(current.dataset.col);
  if (colDelta !== 0) {
    const next = itemsMatch(row, col + colDelta);
    if (next) focusEl(next);
    return;
  }
  if (rowDelta === 0) return;
  const rows = [...new Set(all.map((el) => Number(el.dataset.row)))].sort((a, b) => a - b);
  const candidates = rows.filter((value) => (rowDelta > 0 ? value > row : value < row));
  const target = rowDelta > 0 ? candidates[0] : candidates[candidates.length - 1];
  if (target == null) return;
  const pool = all.filter((el) => Number(el.dataset.row) === target);
  const next = pool.reduce((best, el) => (
    Math.abs(Number(el.dataset.col) - col) < Math.abs(Number(best.dataset.col) - col) ? el : best
  ));
  focusEl(next);
}

function openNav(id) {
  if (state.screen === id) return;
  leavePlayer();
  state.stack = [];
  state.screen = id;
  state.focusKey = null;
  state.appId = null;
  render();
}

function openDetail(id) {
  if (!itemById(id)) return;
  state.stack.push(snapshot());
  state.screen = "detail";
  state.mediaId = id;
  state.focusKey = "detail-play";
  render();
}

function openPlayer(id) {
  if (!itemById(id)) return;
  state.stack.push(snapshot());
  state.screen = "player";
  state.mediaId = id;
  const start = (state.progress[id] || 0) * PREVIEW_SECONDS;
  state.position = start > PREVIEW_SECONDS - 1 ? 0 : start;
  state.playing = true;
  state.focusKey = "player-toggle";
  render();
}

function openApp(id) {
  const app = appById(id);
  if (!app) return;
  state.stack.push(snapshot());
  state.focusKey = null;
  state.appId = id;
  if (app.mode === "list") {
    state.screen = "list";
  } else {
    state.screen = "app";
  }
  render();
}

function goBack() {
  leavePlayer();
  const previous = state.stack.pop();
  if (!previous) {
    if (state.screen !== "home") {
      state.screen = "home";
      state.focusKey = null;
      state.appId = null;
      render();
    }
    return;
  }
  state.screen = previous.screen;
  state.focusKey = previous.focusKey;
  state.appId = previous.appId;
  state.mediaId = previous.mediaId;
  state.query = previous.query;
  render();
}

function toggleList(id) {
  if (state.list.has(id)) state.list.delete(id);
  else state.list.add(id);
  save();
  state.focusKey = "detail-list";
  render();
}

function showHelp(id) {
  state.helpId = id;
  state.focusKey = `path-${id}`;
  render();
}

function resetDemo() {
  state.progress = { "night-market": 0.42, "copper-line": 0.18 };
  state.list = new Set();
  save();
  state.focusKey = "reset-demo";
  render();
}

function seek(delta) {
  state.position = Math.min(PREVIEW_SECONDS, Math.max(0, state.position + delta));
  updatePlayerUi();
  saveProgress();
}

function togglePlay() {
  if (state.position >= PREVIEW_SECONDS - 0.2) {
    state.position = 0;
    state.playing = true;
  } else {
    state.playing = !state.playing;
  }
  updatePlayerUi();
  saveProgress();
}

function updatePlayerUi() {
  const head = document.getElementById("playhead");
  const code = document.getElementById("timecode");
  const toggle = document.getElementById("player-toggle");
  const ratio = state.position / PREVIEW_SECONDS;
  if (head) head.style.width = `${Math.min(100, ratio * 100)}%`;
  if (code) code.textContent = `${formatClock(state.position)} / ${formatClock(PREVIEW_SECONDS)}`;
  if (!toggle) return;
  if (state.position >= PREVIEW_SECONDS - 0.2 && !state.playing) toggle.textContent = "Replay";
  else toggle.textContent = state.playing ? "Pause" : "Play";
}

function activate(el) {
  const action = el.dataset.action;
  const id = el.dataset.id || "";
  if (action === "move") {
    move(Number(el.dataset.dr), Number(el.dataset.dc));
    return;
  }
  if (action === "remote-ok") {
    const current = document.querySelector(`[data-key="${CSS.escape(state.focusKey || "")}"]`);
    if (current && current.dataset.action !== "type") activate(current);
    return;
  }
  if (action === "remote-back" || action === "back") {
    goBack();
    return;
  }
  if (action === "remote-home") {
    openNav("home");
    return;
  }
  if (action === "nav") {
    openNav(id);
    return;
  }
  if (action === "detail") {
    openDetail(id);
    return;
  }
  if (action === "play") {
    openPlayer(id);
    return;
  }
  if (action === "app") {
    openApp(id);
    return;
  }
  if (action === "toggle-list") {
    toggleList(id);
    return;
  }
  if (action === "toggle-play") {
    togglePlay();
    return;
  }
  if (action === "seek") {
    seek(Number(el.dataset.delta));
    return;
  }
  if (action === "help") {
    showHelp(id);
    return;
  }
  if (action === "reset") resetDemo();
}

function onClick(event) {
  const button = event.target.closest ? event.target.closest("[data-action]") : null;
  if (!button) return;
  activate(button);
}

function onKey(event) {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const typing = event.target && event.target.id === "search-input";
  if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && typing) return;
  if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    const step = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    }[event.key];
    move(step[0], step[1]);
    return;
  }
  if (event.key === "Enter" && typing) {
    event.preventDefault();
    move(1, 0);
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    goBack();
    return;
  }
  if (event.key === "Backspace" && typing && event.target.value === "") {
    event.preventDefault();
    goBack();
    return;
  }
  if (event.key === "Backspace" && !typing) {
    event.preventDefault();
    goBack();
    return;
  }
  if ((event.key === "f" || event.key === "F") && !typing && !event.repeat) toggleFull();
}

function toggleFull() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
    return;
  }
  document.documentElement.requestFullscreen().catch(() => {});
}

function tickClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function tickPlayer() {
  if (state.screen !== "player" || !state.playing) return;
  state.position = Math.min(PREVIEW_SECONDS, state.position + 0.25);
  if (state.position >= PREVIEW_SECONDS) state.playing = false;
  const now = Date.now();
  if (now - lastProgressSave > 2000) {
    lastProgressSave = now;
    saveProgress();
  }
  updatePlayerUi();
}

let resizeTimer = 0;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (["apps", "search", "list", "app"].includes(state.screen)) render();
  }, 160);
}

function init() {
  load();
  const root = document.getElementById("app");
  root.addEventListener("click", onClick);
  root.addEventListener("focusin", onFocusIn);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  setInterval(tickClock, 1000);
  setInterval(tickPlayer, 250);
  render();
}

init();
