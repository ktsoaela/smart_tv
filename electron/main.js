"use strict";

// Smart TV for Windows: a full-screen TV home that takes over the PC like an Android TV box.
//
// - The UI is the same front end as the browser version (index.html, css/, js/),
//   served from the private app://tv scheme. Its /api/* calls are answered here (api.js).
// - Streaming apps open inside the TV window by default (apps.js): web views laid over the
//   TV page. A site opens in your Chrome window, fitted over the TV. If Chrome cannot
//   be fitted, the page opens in an in-memory session that is dropped when Smart TV
//   closes. Protected video needs the Widevine build of Electron from castLabs; see docs/electron.md.
// - Optional: open apps in Chrome instead, either a separate kiosk "TV" profile that the
//   remote's Back closes, or your everyday Chrome profile.

const electron = require("electron");
const { app, BrowserWindow, protocol, session, globalShortcut, ipcMain, shell } = electron;
const fs = require("fs");
const path = require("path");
const { spawn, execFile } = require("child_process");
const { createApi, mimeOf, powershell } = require("./api");
const { Audio } = require("./audio");
const { AppViews, hudFile } = require("./apps");
const { ChromeFrame } = require("./chrome-frame");

const ROOT = path.resolve(__dirname, "..");
const APP_ICON = path.join(ROOT, "assets", "icon.ico");
const STATIC_DIRS = new Set(["css", "js", "assets"]);
const WINDOWED = process.argv.includes("--windowed") || process.env.SMARTTV_WINDOWED === "1";
const HIDDEN = process.env.SMARTTV_HIDDEN === "1";
const DEFAULTS = { kiosk: true, startWithWindows: false, launchMode: "inside" };

// Remote navigation on ordinary websites: the arrow keys move focus between links and
// buttons. The TV page handles its own arrows (and cancels the default), so it's unaffected.
app.commandLine.appendSwitch("enable-spatial-navigation");
// Sites treat a browser that says Electron, or that exposes navigator.webdriver, as a bot.
app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled");
if (process.platform === "win32") app.setAppUserModelId("com.ktsoaela.smarttv");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
]);

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let win = null;
let quitting = false;
let tracked = null; // the TV-profile Chrome we launched, if it's running
let settings = { ...DEFAULTS };
let audio = null;
let appViews = null;
let drm = "unavailable";

/* ---------- Settings ---------- */

function settingsFile() {
  return path.join(app.getPath("userData"), "tv-settings.json");
}

function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsFile(), "utf8")) };
  } catch {
    settings = { ...DEFAULTS };
  }
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch {
    /* settings are best effort */
  }
}

function loginItemOptions() {
  return { path: process.execPath, args: app.isPackaged ? [] : [app.getAppPath()] };
}

function getSettings() {
  let startWithWindows = settings.startWithWindows;
  try {
    startWithWindows = app.getLoginItemSettings(loginItemOptions()).openAtLogin;
  } catch {
    /* not supported on this platform */
  }
  return {
    ...settings,
    startWithWindows,
    windowed: WINDOWED,
    packaged: app.isPackaged,
    browser: browserPath() ? path.basename(browserPath(), ".exe") : "",
    tvProfile: tvProfileDir(),
    drm,
    running: appViews ? appViews.running() : []
  };
}

async function setSettings(next) {
  if (typeof next.kiosk === "boolean") {
    settings.kiosk = next.kiosk;
    if (win && !WINDOWED) applyKiosk();
  }
  if (typeof next.startWithWindows === "boolean") {
    settings.startWithWindows = next.startWithWindows;
    try {
      app.setLoginItemSettings({ ...loginItemOptions(), openAtLogin: next.startWithWindows });
    } catch {
      /* not supported on this platform */
    }
  }
  if (["inside", "tv", "chrome"].includes(next.launchMode)) settings.launchMode = next.launchMode;
  saveSettings();
  return getSettings();
}

/* ---------- Browser ---------- */

let cachedBrowser;

function browserPath() {
  if (cachedBrowser !== undefined) return cachedBrowser;
  const candidates = [
    path.join(process.env.ProgramFiles || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env.ProgramFiles || "C:\\Program Files", "Microsoft", "Edge", "Application", "msedge.exe")
  ];
  cachedBrowser = candidates.find((p) => p && fs.existsSync(p)) || null;
  return cachedBrowser;
}

function tvProfileDir() {
  return path.join(app.getPath("userData"), "chrome-tv-profile");
}

let frame;
let leavingTv = false;

function holdKiosk() {
  if (!win || win.isDestroyed() || WINDOWED || leavingTv || holdKiosk.busy) return;
  holdKiosk.busy = true;
  const apply = () => {
    if (!win || win.isDestroyed() || WINDOWED || leavingTv) return;
    if (settings.kiosk) {
      if (!win.isKiosk()) win.setKiosk(true);
      if (!win.isFullScreen()) win.setFullScreen(true);
    } else if (!win.isFullScreen()) {
      win.setFullScreen(true);
    }
  };
  apply();
  setTimeout(apply, 80);
  setTimeout(apply, 280);
  setTimeout(apply, 700);
  setTimeout(() => { holdKiosk.busy = false; }, 800);
}

function registerBackKey() {
  // Only while a Chrome window we opened is in front: Esc (the remote's Back) returns to Home.
  if (!globalShortcut.isRegistered("Escape")) globalShortcut.register("Escape", onBackKey);
}

function unregisterBackKey() {
  if (globalShortcut.isRegistered("Escape")) globalShortcut.unregister("Escape");
}

function closeTracked() {
  if (!tracked) return;
  const pid = tracked.pid;
  // Close only the process tree we started (the TV profile), never every chrome.exe.
  execFile("taskkill", ["/PID", String(pid), "/T", "/F"], { windowsHide: true }, () => {});
}

function onBackKey() {
  if (frame && frame.isOpen()) {
    unregisterBackKey();
    frame.close().finally(() => bringBack("app-home", true));
    return;
  }
  closeTracked();
}

function bringBack(reason, inside = false) {
  leavingTv = false;
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  holdKiosk();
  win.webContents.send("tv-event", { type: "returned", reason, inside: !!inside });
}

async function openStreaming(url, meta = {}) {
  const mode = ["inside", "tv", "chrome"].includes(meta.mode) ? meta.mode : settings.launchMode;
  if (mode === "inside") {
    if (frame) {
      const docked = await frame.open(url);
      if (docked) {
        registerBackKey();
        holdKiosk();
        return { ok: true, inside: true, chrome: true };
      }
    }
    if (appViews) {
      return appViews.open(meta.id || new URL(url).origin, meta.name || new URL(url).hostname, url, { zoom: meta.zoom, layout: meta.layout });
    }
  }
  const browser = browserPath();
  if (!browser) {
    await shell.openExternal(url);
    return { ok: true, tracked: false };
  }
  if (mode === "chrome") {
    // Your everyday Chrome profile: already signed in, but it belongs to the running Chrome,
    // so this app can't close it. Alt+F4 closes it and brings you back.
    spawn(browser, [`--app=${url}`, "--start-fullscreen"], { detached: true, stdio: "ignore" }).unref();
    return { ok: true, tracked: false };
  }
  closeTracked();
  const startedAt = Date.now();
  const child = spawn(browser, [
    `--user-data-dir=${tvProfileDir()}`,
    "--kiosk",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-session-crashed-bubble",
    "--hide-crash-restore-bubble",
    "--autoplay-policy=no-user-gesture-required",
    url
  ], { stdio: "ignore" });
  tracked = child;
  registerBackKey();
  child.on("exit", () => {
    if (tracked !== child) return;
    tracked = null;
    unregisterBackKey();
    // A very quick exit means an older TV window took the request; that one isn't ours to track.
    if (Date.now() - startedAt > 2500) bringBack("app-closed");
  });
  child.on("error", () => {
    if (tracked === child) tracked = null;
    unregisterBackKey();
  });
  return { ok: true, tracked: true };
}

async function openShortcut(lnk) {
  const error = await shell.openPath(lnk);
  if (error) throw new Error(error);
  return { ok: true, tracked: false };
}

async function switchSource(target) {
  if (!win) return;
  leavingTv = true;
  win.setKiosk(false);
  win.setFullScreen(false);
  if (target === "browser") {
    const browser = browserPath();
    if (browser) spawn(browser, ["--new-window"], { detached: true, stdio: "ignore" }).unref();
    else await shell.openExternal("https://www.google.com/");
    win.minimize();
  } else {
    win.minimize();
    await powershell("(New-Object -ComObject Shell.Application).MinimizeAll()", 8000);
  }
}

function applyKiosk() {
  if (!win || WINDOWED) return;
  win.setKiosk(!!settings.kiosk);
  if (!settings.kiosk) win.setFullScreen(true);
}

function quit() {
  quitting = true;
  if (frame) frame.close();
  closeTracked();
  app.quit();
}

/* ---------- Window ---------- */

async function serveStatic(request) {
  const url = new URL(request.url);
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/" || rel === "") rel = "/index.html";
  if (rel === "/hud.html") {
    return new Response(await fs.promises.readFile(hudFile), { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const file = path.normalize(path.join(ROOT, rel));
  const top = path.relative(ROOT, file).split(path.sep)[0];
  const allowed = file === path.join(ROOT, "index.html") || STATIC_DIRS.has(top);
  if (!allowed || !file.startsWith(ROOT + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.promises.readFile(file);
    return new Response(data, { headers: { "content-type": mimeOf(file), "cache-control": "no-cache" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    show: false,
    backgroundColor: "#07080b",
    title: "Smart TV",
    icon: APP_ICON,
    autoHideMenuBar: true,
    kiosk: !WINDOWED && settings.kiosk,
    fullscreen: !WINDOWED && !settings.kiosk,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      autoplayPolicy: "no-user-gesture-required",
      spellcheck: false
    }
  });
  win.setMenu(null);
  win.loadURL("app://tv/index.html");
  win.once("ready-to-show", () => {
    if (!HIDDEN) {
      win.show();
      return;
    }
    // Automated tests: paint the window off-screen without taking focus.
    win.setPosition(-4000, -4000);
    win.showInactive();
  });

  // Alt+F4 and the window's close button ask first, on the TV screen.
  win.on("close", (event) => {
    if (quitting) return;
    event.preventDefault();
    if (appViews) appViews.home("app-home");
    win.webContents.send("tv-event", { type: "close-requested" });
  });

  // Coming back from the desktop or the browser: back to full screen.
  win.on("restore", () => {
    leavingTv = false;
    holdKiosk();
    win.webContents.send("tv-event", { type: "returned", reason: "restored" });
  });
  win.on("leave-full-screen", () => holdKiosk());

  // Links never navigate the TV window; web addresses open in Chrome instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) openStreaming(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("app://tv/")) event.preventDefault();
  });

  appViews = new AppViews({
    win,
    audio,
    onEvent: (event) => {
      if (event.type === "quit") quit();
      else if (!win.isDestroyed()) win.webContents.send("tv-event", event);
    }
  });
  frame = new ChromeFrame(win, () => {
    unregisterBackKey();
    bringBack("app-closed", true);
  });
  frame.onDisturb = () => holdKiosk();

  win.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    const key = String(input.key || "").toLowerCase();
    // Ctrl+Shift+Q: leave the TV right away (for when the remote is lost).
    if (input.control && input.shift && key === "q") {
      event.preventDefault();
      quit();
    }
    if (!app.isPackaged && key === "f12") {
      event.preventDefault();
      win.webContents.toggleDevTools();
    }
  });
}

/* ---------- Boot ---------- */

app.on("second-instance", () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});

async function prepareWidevine() {
  // Only the castLabs build of Electron has "components" (the Widevine CDM).
  if (!electron.components) {
    drm = "unavailable";
    return;
  }
  try {
    await Promise.race([electron.components.whenReady(), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000))]);
    drm = "ready";
  } catch {
    drm = "failed";
  }
}

app.whenReady().then(async () => {
  loadSettings();
  await prepareWidevine();
  audio = new Audio();

  const allowed = new Set(["geolocation", "fullscreen", "media", "clipboard-sanitized-write"]);
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(allowed.has(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed.has(permission));

  const handleApi = createApi({
    userData: app.getPath("userData"),
    audio,
    browserPath,
    openStreaming,
    openShortcut,
    switchSource,
    closeApp: (id) => (appViews ? appViews.close(id) : { ok: true }),
    preloadApp: (id, name, url, opts) => (appViews && settings.launchMode === "inside" ? appViews.preload(id, name, url, opts) : { ok: false }),
    testState: HIDDEN ? () => (appViews ? appViews.testState() : null) : null,
    clearAppData: () => (appViews ? appViews.clearData() : { ok: true }),
    drm: () => drm,
    testKey: HIDDEN ? (key, hold) => (appViews ? appViews.testKey(key, hold) : { ok: false }) : null,
    getSettings,
    setSettings,
    quit
  });

  protocol.handle("app", (request) => {
    const url = new URL(request.url);
    if (url.host !== "tv") return new Response("Not found", { status: 404 });
    if (url.pathname.startsWith("/api/")) return handleApi(request);
    return serveStatic(request);
  });

  ipcMain.on("tv-quit", () => quit());

  createWindow();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  if (audio) audio.stop();
});

app.on("window-all-closed", () => {
  app.quit();
});
