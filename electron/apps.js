"use strict";

// Streaming apps inside the TV: each app is a web view laid over the TV page in the same
// full-screen window. Opening one feels like switching input; recent apps stay loaded in
// the background (like a TV keeping apps in memory), so going back to them is instant.
//
// Remote inside an app:
//   Back (Esc, or the mouse's back button)  goes back in the app; on the app's first page it returns Home
//   Hold Back (about 0.7 s)                 returns Home from anywhere
//   Volume keys                             show the TV's volume panel
//
// Apps share one saved session, so a sign-in made inside the TV (Google, Netflix, ...) is
// remembered the next time Smart TV starts. Settings -> TV mode -> Sign out of all apps clears it.

const { WebContentsView, session, ipcMain } = require("electron");
const path = require("path");

const PARTITION = "persist:tv-apps";
const MAX_LOADED = 4;
const HOLD_MS = 650;
const PAGE_META_JS = `(() => {
  const read = (sel) => {
    const el = document.querySelector(sel);
    return el ? (el.getAttribute("content") || "") : "";
  };
  const clean = (value) => String(value || "").replace(/\\s+/g, " ").trim();
  const abs = (src) => {
    try { return src ? new URL(src, location.href).href : ""; } catch (e) { return ""; }
  };
  const title = clean(read('meta[property="og:title"]') || read('meta[name="og:title"]') || document.title);
  let image = read('meta[property="og:image"]') || read('meta[name="twitter:image"]') || read('meta[property="twitter:image"]');
  if (!image) {
    const video = document.querySelector("video[poster]");
    if (video) image = video.getAttribute("poster") || "";
  }
  if (!image) {
    const img = document.querySelector('img[alt*="poster" i], img[class*="poster" i], img[class*="backdrop" i]');
    if (img) image = img.currentSrc || img.src || "";
  }
  const description = clean(read('meta[property="og:description"]') || read('meta[name="description"]')).slice(0, 180);
  return { url: location.href, title: title.slice(0, 140), image: abs(image), description };
})()`;
// Sites with a real 10-foot interface on the web, and the device identity that unlocks it.
// YouTube serves its TV app (big rows, remote keys, sign-in by code at yt.be/activate) at
// /tv, but only to TV-like browsers. Most other sites have no TV interface on
// the web, so they keep their normal site and get remote navigation instead.
const LEANBACK_UA = "Mozilla/5.0 (PS4; Leanback Shell) Gecko/20100101 Firefox/65.0 LeanbackShell/01.00.01.75 Sony PS4/ (PS4, , no, CH)";
const TV_LAYOUTS = [
  { name: "YouTube on TV", test: (u) => /^(www\.|m\.)?youtube\.com$/i.test(u.hostname), url: "https://www.youtube.com/tv", ua: LEANBACK_UA }
];

function tvLayoutFor(url) {
  try {
    const u = new URL(url);
    return TV_LAYOUTS.find((t) => t.test(u)) || null;
  } catch {
    return null;
  }
}

// For sites without a TV interface: the arrow keys move a visible focus between links and
// buttons (Chromium spatial navigation, switched on in main.js), and OK clicks.
const REMOTE_CSS = `
  ::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
  :focus-visible { outline: 4px solid #fff !important; outline-offset: 3px !important; box-shadow: 0 0 0 7px rgba(0, 0, 0, 0.55) !important; border-radius: 6px; }
`;
const TV_CSS = "::-webkit-scrollbar { width: 0 !important; height: 0 !important; }";

const POPUP_HOSTS = /(^|\.)(accounts\.google\.com|google\.com|facebook\.com|appleid\.apple\.com|apple\.com|microsoftonline\.com|live\.com|login\.|auth\.|sso\.|id\.)/i;

class AppViews {
  constructor({ win, audio, onEvent }) {
    this.win = win;
    this.audio = audio;
    this.onEvent = onEvent;
    this.entries = new Map(); // id -> { id, name, url, view, lastUsed, loaded, fullscreen }
    this.active = null;
    this.hud = null;
    this.hudTimer = 0;
    this.backDown = 0;
    this.backTimer = 0;
    this.backHandled = false;
    this.leaving = null;
    this.ses = session.fromPartition(PARTITION);
    this.onHudChoose = (_event, index) => this.chooseLeave(Number(index));
    ipcMain.on("hud-choose", this.onHudChoose);
    this.prepareSession();
    win.on("resize", () => this.layout());
    win.on("app-command", (_e, cmd) => {
      if (this.active && cmd === "browser-backward") this.back(this.active);
    });
  }

  prepareSession() {
    // Look like regular Chrome: some services refuse anything that says "Electron".
    const ua = this.ses.getUserAgent().replace(/\s(?:Electron|Smart[ -]?TV)\/\S+/gi, "");
    this.ses.setUserAgent(ua);
    // Google's sign-in page blocks embedded Chromium; it accepts a Firefox user agent.
    const firefox = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0";
    this.ses.webRequest.onBeforeSendHeaders({ urls: ["https://accounts.google.com/*"] }, (details, callback) => {
      details.requestHeaders["User-Agent"] = firefox;
      callback({ requestHeaders: details.requestHeaders });
    });
    const allowed = new Set(["fullscreen", "mediaKeySystem", "clipboard-sanitized-write", "pointerLock", "speaker-selection"]);
    this.ses.setPermissionRequestHandler((_wc, permission, callback) => callback(allowed.has(permission)));
    this.ses.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));
  }

  running() {
    return [...this.entries.keys()];
  }

  bounds() {
    const [width, height] = this.win.getContentSize();
    return { x: 0, y: 0, width, height };
  }

  layout() {
    if (this.active) this.active.view.setBounds(this.bounds());
    this.layoutHud();
  }

  create(id, name, url, opts = {}) {
    const layout = opts.layout === "desktop" ? null : tvLayoutFor(url);
    const view = new WebContentsView({
      webPreferences: {
        partition: PARTITION,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        autoplayPolicy: "no-user-gesture-required",
        spellcheck: false
      }
    });
    view.setBackgroundColor("#000000");
    const entry = {
      id, name, url, view, lastUsed: Date.now(), loaded: false, fullscreen: false,
      tvUi: !!layout, layout: opts.layout === "desktop" ? "desktop" : "auto", zoom: Number(opts.zoom) || 1
    };
    const wc = view.webContents;
    if (layout) wc.setUserAgent(layout.ua);
    wc.on("dom-ready", () => {
      wc.setZoomFactor(entry.tvUi ? 1 : entry.zoom);
      wc.insertCSS(entry.tvUi ? TV_CSS : REMOTE_CSS).catch(() => {});
      // TV apps "exit" by closing their window. Treat that as going Home and keep the
      // app loaded, so it opens instantly next time.
      if (entry.tvUi) {
        wc.executeJavaScript("window.close = () => console.info('__smarttv_exit__');", false).catch(() => {});
      }
    });
    wc.on("console-message", (details, _level, legacyMessage) => {
      const message = details && details.message !== undefined ? details.message : legacyMessage;
      if (message === "__smarttv_exit__" && this.active === entry) this.home("app-home");
    });
    // A page can close itself (YouTube on TV's "Exit" does): tidy up and go Home.
    wc.on("destroyed", () => {
      if (this.entries.get(id) !== entry) return;
      this.entries.delete(id);
      if (this.active === entry) {
        this.active = null;
        this.leaving = null;
        this.hideHud();
        this.win.webContents.focus();
        this.onEvent({ type: "returned", reason: "app-closed" });
      }
      this.onEvent({ type: "running", ids: this.running() });
    });
    entry.ready = new Promise((resolve) => {
      wc.once("dom-ready", resolve);
      wc.once("did-fail-load", resolve);
      setTimeout(resolve, 4000);
    }).then(() => { entry.loaded = true; });

    wc.on("enter-html-full-screen", () => { entry.fullscreen = true; });
    wc.on("leave-html-full-screen", () => { entry.fullscreen = false; });
    wc.on("render-process-gone", () => this.close(id));

    // Sign-in windows keep their link to the app (OAuth needs it); other links stay in the app.
    wc.setWindowOpenHandler(({ url: target }) => {
      let host = "";
      try {
        host = new URL(target).hostname;
      } catch {
        return { action: "deny" };
      }
      if (POPUP_HOSTS.test(host)) {
        return {
          action: "allow",
          overrideBrowserWindowOptions: {
            parent: this.win,
            width: 960,
            height: 760,
            autoHideMenuBar: true,
            backgroundColor: "#ffffff",
            webPreferences: { partition: PARTITION, contextIsolation: true, sandbox: true }
          }
        };
      }
      if (/^https?:/i.test(target)) wc.loadURL(target);
      return { action: "deny" };
    });

    wc.on("before-input-event", (event, input) => this.onKey(entry, event, input));
    wc.on("did-finish-load", () => this.notePage(entry));
    wc.on("did-navigate-in-page", () => this.notePage(entry));
    wc.on("page-title-updated", () => this.notePage(entry));
    wc.loadURL(layout ? layout.url : url);
    this.entries.set(id, entry);
    this.trim();
    this.onEvent({ type: "running", ids: this.running() });
    return entry;
  }

  notePage(entry) {
    clearTimeout(entry.metaTimer);
    entry.metaTimer = setTimeout(() => this.readPage(entry), 900);
  }

  async readPage(entry) {
    const wc = entry.view && entry.view.webContents;
    if (!wc || wc.isDestroyed() || this.entries.get(entry.id) !== entry) return;
    let page;
    try {
      page = await wc.executeJavaScript(PAGE_META_JS, true);
    } catch {
      return;
    }
    if (!keepPage(entry, page)) return;
    const stamp = `${page.url}|${page.title}|${page.image || ""}`;
    if (entry.lastMeta === stamp) return;
    entry.lastMeta = stamp;
    let host = "";
    try { host = new URL(page.url).hostname.replace(/^www\./, ""); } catch { return; }
    this.onEvent({
      type: "page-history",
      item: {
        url: page.url,
        title: page.title,
        image: /^https?:\/\//i.test(page.image || "") ? page.image : "",
        description: page.description || "",
        host,
        appName: entry.name || ""
      }
    });
  }

  // Load an app in the background (muted, not shown) so opening it later is instant.
  preload(id, name, url, opts = {}) {
    if (this.entries.has(id) || this.entries.size >= MAX_LOADED) return { ok: true, loaded: this.entries.has(id) };
    const entry = this.create(id, name, url, opts);
    entry.lastUsed = 0;
    entry.view.webContents.setAudioMuted(true);
    entry.view.webContents.setBackgroundThrottling(true);
    return { ok: true, loaded: false };
  }

  // Keep a handful of apps loaded; close the one used longest ago.
  trim() {
    if (this.entries.size <= MAX_LOADED) return;
    const oldest = [...this.entries.values()]
      .filter((e) => e !== this.active)
      .sort((a, b) => a.lastUsed - b.lastUsed)[0];
    if (oldest) this.close(oldest.id);
  }

  async open(id, name, url, opts = {}) {
    let entry = this.entries.get(id);
    const started = Date.now();
    // Switching between the TV layout and the normal site needs a fresh view.
    if (entry && (opts.layout === "desktop" ? "desktop" : "auto") !== entry.layout) {
      this.close(id);
      entry = null;
    }
    if (entry && opts.zoom && Number(opts.zoom) !== entry.zoom) {
      entry.zoom = Number(opts.zoom);
      if (!entry.tvUi) entry.view.webContents.setZoomFactor(entry.zoom);
    }
    if (!entry) entry = this.create(id, name, url, opts);
    else if (!entry.tvUi && url && entry.url !== url && !entry.view.webContents.getURL().startsWith(new URL(url).origin)) {
      entry.url = url;
      entry.view.webContents.loadURL(url);
    }
    entry.lastUsed = Date.now();
    // Give the "changing source" animation a moment, and a new app a moment to paint.
    if (!entry.loaded) await Promise.race([entry.ready, new Promise((r) => setTimeout(r, 3500))]);
    const wait = Math.max(0, (entry.loaded ? 200 : 550) - (Date.now() - started));
    if (wait) await new Promise((r) => setTimeout(r, wait));
    this.show(entry);
    return { ok: true, inside: true, warm: entry.loaded, tvUi: entry.tvUi };
  }

  show(entry) {
    if (this.active && this.active !== entry) this.detach(this.active, false);
    this.active = entry;
    const wc = entry.view.webContents;
    wc.setAudioMuted(false);
    wc.setBackgroundThrottling(false);
    this.win.contentView.addChildView(entry.view);
    entry.view.setBounds(this.bounds());
    wc.focus();
    this.onEvent({ type: "app-shown", id: entry.id });
    if (!entry.hinted) {
      entry.hinted = true;
      const text = entry.tvUi ? "TV layout · Hold Back to leave" : "Arrows move · OK selects · Hold Back to leave";
      this.showHud({ kind: "hint", title: entry.name, text }, 3200);
    }
  }

  detach(entry, pause = true) {
    const wc = entry.view.webContents;
    if (pause) {
      wc.executeJavaScript("document.querySelectorAll('video,audio').forEach((m) => { try { m.pause(); } catch (e) {} });", true).catch(() => {});
      if (entry.fullscreen) wc.executeJavaScript("document.fullscreenElement && document.exitFullscreen()", true).catch(() => {});
    }
    wc.setAudioMuted(true);
    wc.setBackgroundThrottling(true);
    try {
      this.win.contentView.removeChildView(entry.view);
    } catch {
      /* already removed */
    }
  }

  home(reason = "app-home") {
    if (!this.active) return false;
    this.leaving = null;
    this.detach(this.active, true);
    this.active = null;
    this.hideHud();
    this.win.webContents.focus();
    this.onEvent({ type: "returned", reason, inside: true });
    return true;
  }

  close(id) {
    const entry = this.entries.get(id);
    if (!entry) return { ok: true };
    if (this.active === entry) this.home("app-closed");
    this.entries.delete(id);
    try {
      entry.view.webContents.close();
    } catch {
      /* already gone */
    }
    this.onEvent({ type: "running", ids: this.running() });
    return { ok: true };
  }

  async clearData() {
    for (const id of [...this.entries.keys()]) this.close(id);
    await this.ses.clearStorageData();
    await this.ses.clearCache();
    return { ok: true };
  }

  back(entry) {
    const wc = entry.view.webContents;
    if (entry.fullscreen) {
      wc.executeJavaScript("document.fullscreenElement && document.exitFullscreen()", true).catch(() => {});
      return;
    }
    const history = wc.navigationHistory;
    if (history && history.canGoBack()) history.goBack();
    else this.askLeave(entry);
  }

  askLeave(entry) {
    if (!entry || this.leaving) return;
    clearTimeout(this.backTimer);
    this.backHandled = true;
    this.leaving = { entry, selected: 1 };
    this.paintLeave();
  }

  paintLeave() {
    if (!this.leaving) return;
    const name = this.leaving.entry.name || "this app";
    this.showHud({
      kind: "leave",
      title: `Leave ${name}?`,
      text: "Go back to the TV home, or stay in this app.",
      choices: ["Stay", "Go to Home"],
      selected: this.leaving.selected
    }, 0);
  }

  chooseLeave(index) {
    if (!this.leaving) return;
    const entry = this.leaving.entry;
    const goHome = index === 1;
    this.leaving = null;
    this.hideHud();
    if (goHome) this.home("app-home");
    else if (entry && entry.view && !entry.view.webContents.isDestroyed()) entry.view.webContents.focus();
  }

  cancelLeave() {
    this.chooseLeave(0);
  }

  onLeaveKey(key) {
    if (!this.leaving) return;
    if (key === "ArrowLeft" || key === "ArrowUp") this.leaving.selected = 0;
    else if (key === "ArrowRight" || key === "ArrowDown") this.leaving.selected = 1;
    else if (key === "Enter" || key === "NumpadEnter" || key === " ") {
      this.chooseLeave(this.leaving.selected);
      return;
    } else if (key === "Escape" || key === "BrowserBack" || key === "GoBack") {
      this.cancelLeave();
      return;
    } else return;
    this.paintLeave();
  }

  onKey(entry, event, input) {
    const key = input.key;
    if (input.type === "keyDown" && input.control && input.shift && String(key).toLowerCase() === "q") {
      event.preventDefault();
      this.onEvent({ type: "quit" });
      return;
    }
    if (this.leaving) {
      if (key === "AudioVolumeUp" || key === "AudioVolumeDown" || key === "AudioVolumeMute") return;
      event.preventDefault();
      if (input.type === "keyDown" && !input.isAutoRepeat) this.onLeaveKey(key);
      return;
    }
    if (key === "AudioVolumeUp" || key === "AudioVolumeDown" || key === "AudioVolumeMute") {
      if (input.type === "keyDown") setTimeout(() => this.showVolume(), 150);
      return;
    }
    if (key === "BrowserHome" || key === "GoHome") {
      event.preventDefault();
      if (input.type === "keyDown") this.askLeave(entry);
      return;
    }
    if (key !== "Escape" && key !== "BrowserBack" && key !== "GoBack") return;
    if (entry.tvUi) {
      // TV interfaces handle Back themselves (YouTube on TV goes back a screen, and offers
      // to exit on its home). Let one press through; a hold still asks to leave.
      if (input.type === "keyDown") {
        if (input.isAutoRepeat) {
          event.preventDefault();
          return;
        }
        this.backHandled = false;
        clearTimeout(this.backTimer);
        this.backTimer = setTimeout(() => {
          this.backHandled = true;
          this.askLeave(entry);
        }, HOLD_MS);
      } else if (input.type === "keyUp") {
        clearTimeout(this.backTimer);
      }
      return;
    }
    // Back is the TV's: a press goes back, a hold goes Home. The page never sees it.
    event.preventDefault();
    if (input.type === "keyDown") {
      if (input.isAutoRepeat) return;
      this.backDown = Date.now();
      this.backHandled = false;
      clearTimeout(this.backTimer);
      this.backTimer = setTimeout(() => {
        this.backHandled = true;
        this.askLeave(entry);
      }, HOLD_MS);
    } else if (input.type === "keyUp") {
      clearTimeout(this.backTimer);
      if (!this.backHandled && this.active === entry) this.back(entry);
      this.backHandled = true;
    }
  }

  testState() {
    if (!this.active) return null;
    const wc = this.active.view.webContents;
    return { id: this.active.id, url: wc.getURL(), ua: wc.getUserAgent(), zoom: wc.getZoomFactor(), tvUi: this.active.tvUi };
  }

  // Automated tests only: press a key in the open app as if from a keyboard.
  async testKey(keyCode, holdMs = 60) {
    if (!this.active) return { ok: false };
    const wc = this.active.view.webContents;
    wc.sendInputEvent({ type: "keyDown", keyCode });
    await new Promise((r) => setTimeout(r, holdMs));
    wc.sendInputEvent({ type: "keyUp", keyCode });
    if (wc.isDestroyed()) return { ok: false };
    wc.sendInputEvent({ type: "keyDown", keyCode });
    await new Promise((r) => setTimeout(r, holdMs));
    if (!wc.isDestroyed()) wc.sendInputEvent({ type: "keyUp", keyCode });
    return { ok: true };
  }

  async showVolume() {
    if (this.leaving) return;
    try {
      const v = await this.audio.get();
      this.showHud({ kind: "volume", level: v.level, muted: v.muted }, 2000);
    } catch {
      /* no system volume */
    }
  }

  /* ---------- A small on-screen panel above the app (hints, volume) ---------- */

  ensureHud() {
    if (this.hud) return this.hud;
    this.hud = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, "hud-preload.js"),
        contextIsolation: true,
        sandbox: true
      }
    });
    this.hud.setBackgroundColor("#00000000");
    this.hud.webContents.loadURL("app://tv/hud.html");
    return this.hud;
  }

  layoutHud() {
    if (!this.hudMsg || !this.hud) return;
    const { width, height } = this.bounds();
    const scale = Math.max(0.6, Math.min(2.2, width / 1920));
    if (this.hudMsg.kind === "leave") {
      const w = Math.min(width - 80, Math.round(860 * scale));
      const h = Math.round(300 * scale);
      this.hud.setBounds({ x: Math.round((width - w) / 2), y: Math.round((height - h) / 2), width: w, height: h });
    } else if (this.hudMsg.kind === "volume") {
      const w = Math.round(110 * scale);
      const h = Math.round(380 * scale);
      this.hud.setBounds({ x: width - w - Math.round(36 * scale), y: Math.round((height - h) / 2), width: w, height: h });
    } else {
      const w = Math.min(width - 40, Math.round(760 * scale));
      const h = Math.round(110 * scale);
      this.hud.setBounds({ x: Math.round((width - w) / 2), y: height - h - Math.round(48 * scale), width: w, height: h });
    }
  }

  async showHud(msg, ms) {
    if (!this.active) return;
    const hud = this.ensureHud();
    this.hudMsg = msg;
    this.layoutHud();
    this.win.contentView.addChildView(hud); // re-adding moves it to the top
    const send = () => hud.webContents.executeJavaScript(`window.show(${JSON.stringify(msg)})`, true).catch(() => {});
    if (hud.webContents.isLoading()) hud.webContents.once("did-finish-load", send);
    else send();
    clearTimeout(this.hudTimer);
    if (ms > 0) this.hudTimer = setTimeout(() => this.hideHud(), ms);
    if (this.active) this.active.view.webContents.focus();
  }

  hideHud() {
    clearTimeout(this.hudTimer);
    this.hudMsg = null;
    if (!this.hud) return;
    try {
      this.win.contentView.removeChildView(this.hud);
    } catch {
      /* not shown */
    }
  }
}

function keepPage(entry, page) {
  if (!page || typeof page.url !== "string" || !/^https?:\/\//i.test(page.url)) return false;
  let parsed;
  try {
    parsed = new URL(page.url);
  } catch {
    return false;
  }
  if (POPUP_HOSTS.test(parsed.hostname)) return false;
  const title = String(page.title || "").trim();
  if (title.length < 2 || title.toLowerCase() === parsed.hostname.toLowerCase()) return false;
  const pathName = parsed.pathname.replace(/\/+$/, "") || "/";
  const generic = pathName === "/" || /^\/(home|browse|index|login|signup|sign-in|signin)$/i.test(pathName);
  const specific = parsed.search.length > 1 || parsed.hash.length > 2;
  const here = `${parsed.origin}${pathName === "/" ? "" : pathName}`.replace(/\/+$/, "");
  const start = String(entry.url || "").split(/[?#]/)[0].replace(/\/+$/, "");
  if (generic && !specific && here === start) return false;
  if (generic && !specific && !page.image) return false;
  return true;
}

module.exports = { AppViews, PARTITION, keepPage, hudFile: path.join(__dirname, "hud.html") };
