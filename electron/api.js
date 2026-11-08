"use strict";

// The same /api/* endpoints as server.py, answered inside Electron's main process.
// The front end calls fetch("/api/...") exactly as it does in the browser version.

const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");
const { Readable } = require("stream");

const IS_WINDOWS = process.platform === "win32";
const VIDEO = new Set([".mp4", ".m4v", ".webm", ".mkv", ".mov", ".ogv", ".avi", ".wmv", ".ts", ".m2ts"]);
const AUDIO = new Set([".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg", ".oga", ".opus", ".wma"]);
const IMAGE = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".avif"]);
const MIME = {
  ".mp4": "video/mp4", ".m4v": "video/mp4", ".webm": "video/webm", ".mkv": "video/x-matroska", ".mov": "video/quicktime",
  ".ogv": "video/ogg", ".avi": "video/x-msvideo", ".wmv": "video/x-ms-wmv", ".ts": "video/mp2t", ".m2ts": "video/mp2t",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".aac": "audio/aac", ".wav": "audio/wav", ".flac": "audio/flac",
  ".ogg": "audio/ogg", ".oga": "audio/ogg", ".opus": "audio/ogg", ".wma": "audio/x-ms-wma",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
  ".bmp": "image/bmp", ".avif": "image/avif", ".ico": "image/x-icon", ".svg": "image/svg+xml",
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json"
};
const HIDDEN_NAMES = new Set(["desktop.ini", "thumbs.db", "system volume information", "$recycle.bin", "ntuser.dat"]);
const SKIP_PROGRAM = ["uninstall", "readme", "read me", "help", "documentation", "website", "license", "release notes", "manual"];
const LIST_LIMIT = 1500;

function kindOf(name) {
  const ext = path.extname(name).toLowerCase();
  if (VIDEO.has(ext)) return "video";
  if (AUDIO.has(ext)) return "audio";
  if (IMAGE.has(ext)) return "image";
  return "other";
}

function mimeOf(file) {
  return MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
}

function hiddenName(name) {
  return name.startsWith(".") || name.startsWith("$") || HIDDEN_NAMES.has(name.toLowerCase()) || /^ntuser\./i.test(name);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function fail(status, message) {
  return json({ error: message }, status);
}

function powershell(script, timeout = 30000) {
  return new Promise((resolve) => {
    if (!IS_WINDOWS) {
      resolve("");
      return;
    }
    const encoded = Buffer.from(`[Console]::OutputEncoding=[Text.Encoding]::UTF8;${script}`, "utf16le").toString("base64");
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded],
      { windowsHide: true, timeout, maxBuffer: 32 * 1024 * 1024, encoding: "utf8" },
      (err, stdout) => resolve(err && !stdout ? "" : String(stdout || "").trim()));
  });
}

function psQuote(text) {
  return `'${String(text).replace(/'/g, "''")}'`;
}

function parseRows(raw) {
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw);
    return Array.isArray(rows) ? rows : [rows];
  } catch {
    return [];
  }
}

function isDir(p) {
  try {
    return !!p && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function firstDir(...candidates) {
  return candidates.find(isDir) || null;
}

function knownFolders() {
  const home = os.homedir();
  const one = process.env.OneDrive || "";
  const places = [
    ["Home", "home", home],
    ["Desktop", "desktop", firstDir(one && path.join(one, "Desktop"), path.join(home, "Desktop"))],
    ["Downloads", "download", firstDir(path.join(home, "Downloads"))],
    ["Videos", "film", firstDir(one && path.join(one, "Videos"), path.join(home, "Videos"))],
    ["Music", "music", firstDir(one && path.join(one, "Music"), path.join(home, "Music"))],
    ["Pictures", "image", firstDir(one && path.join(one, "Pictures"), path.join(home, "Pictures"))],
    ["Documents", "file", firstDir(one && path.join(one, "Documents"), path.join(home, "Documents"))]
  ];
  return places.filter(([, , p]) => p).map(([name, icon, p]) => ({ name, icon, path: p }));
}

async function drives() {
  if (!IS_WINDOWS) return [{ name: "Root", path: "/" }];
  const out = [];
  for (const letter of "CDEFGHIJKLMNOPQRSTUVWXYZ") {
    const root = `${letter}:\\`;
    if (!fs.existsSync(root)) continue;
    try {
      const s = await fsp.statfs(root);
      out.push({ name: `Drive ${letter}:`, path: root, total: s.blocks * s.bsize, free: s.bavail * s.bsize });
    } catch {
      out.push({ name: `Drive ${letter}:`, path: root });
    }
  }
  return out;
}

async function listDir(dir) {
  if (!dir || !path.isAbsolute(dir)) throw Object.assign(new Error("Path must be absolute"), { status: 400 });
  const dirents = await fsp.readdir(dir, { withFileTypes: true });
  const entries = [];
  let other = 0;
  let truncated = false;
  for (const d of dirents) {
    if (hiddenName(d.name)) continue;
    const full = path.join(dir, d.name);
    let st;
    try {
      st = await fsp.stat(full);
    } catch {
      continue;
    }
    const type = st.isDirectory() ? "dir" : kindOf(d.name);
    if (type === "other") {
      other += 1;
      continue;
    }
    if (entries.length >= LIST_LIMIT) {
      truncated = true;
      break;
    }
    entries.push({ name: d.name, path: full, type, size: type === "dir" ? 0 : st.size, mtime: Math.floor(st.mtimeMs / 1000) });
  }
  entries.sort((a, b) => (a.type !== "dir") - (b.type !== "dir") || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  const parent = path.dirname(dir);
  return { path: dir, name: path.basename(dir) || dir, parent: parent !== dir ? parent : null, entries, otherCount: other, truncated };
}

let libraryCache = { at: 0, data: null };

async function library() {
  if (libraryCache.data && Date.now() - libraryCache.at < 60000) return libraryCache.data;
  const roots = knownFolders().filter((p) => ["Videos", "Music", "Downloads", "Desktop"].includes(p.name)).map((p) => p.path);
  const found = { video: [], audio: [] };
  let budget = 6000;
  for (const root of roots) {
    const stack = [[root, 0]];
    while (stack.length && budget > 0) {
      const [folder, depth] = stack.pop();
      let dirents;
      try {
        dirents = await fsp.readdir(folder, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const d of dirents) {
        budget -= 1;
        if (budget <= 0 || hiddenName(d.name)) continue;
        const full = path.join(folder, d.name);
        if (d.isDirectory()) {
          if (depth < 2) stack.push([full, depth + 1]);
          continue;
        }
        const kind = kindOf(d.name);
        if (!found[kind]) continue;
        try {
          const st = await fsp.stat(full);
          found[kind].push({ name: d.name, path: full, type: kind, size: st.size, mtime: Math.floor(st.mtimeMs / 1000) });
        } catch {
          /* skip unreadable files */
        }
      }
    }
  }
  const pick = (items) => {
    const seen = new Set();
    return items.sort((a, b) => b.mtime - a.mtime).filter((e) => !seen.has(e.path) && seen.add(e.path)).slice(0, 24);
  };
  const data = { videos: pick(found.video), music: pick(found.audio) };
  libraryCache = { at: Date.now(), data };
  return data;
}

/* ---------- Chrome shortcuts and Start-menu programs ---------- */

function shortcutScript(dirs, recurse) {
  return `$sh=New-Object -ComObject WScript.Shell;`
    + `Get-ChildItem -Path ${dirs.map(psQuote).join(",")} -Filter *.lnk -Recurse ${recurse} -ErrorAction SilentlyContinue | ForEach-Object {`
    + `$l=$sh.CreateShortcut($_.FullName);`
    + `[pscustomobject]@{path=$_.FullName;name=$_.BaseName;args=$l.Arguments;icon=$l.IconLocation;target=$l.TargetPath}`
    + `} | ConvertTo-Json -Compress`;
}

let appsCache = { at: 0, data: [] };

function knownAppUrl() {
  return "";
}

// Chrome keeps each installed web app's start address in its sync database
// (keys "web_apps-dt-<app id>"). Read it so Chrome-made apps can open inside the TV.
function chromeAppUrls() {
  const urls = new Map();
  const dir = path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "User Data", "Default", "Sync Data", "LevelDB");
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => /\.(ldb|log)$/i.test(f));
  } catch {
    return urls;
  }
  const key = "web_apps-dt-";
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(path.join(dir, file)).toString("latin1");
    } catch {
      continue;
    }
    let i = text.indexOf(key);
    while (i >= 0) {
      const id = text.slice(i + key.length, i + key.length + 32);
      const m = /https?:\/\/[\x21-\x7e]+?(?=[^\x21-\x7e]|$)/.exec(text.slice(i + key.length + 32, i + key.length + 320));
      if (/^[a-p]{32}$/.test(id) && m) {
        try {
          urls.set(id, new URL(m[0]).href);
        } catch {
          /* not a clean address */
        }
      }
      i = text.indexOf(key, i + key.length);
    }
  }
  return urls;
}

async function chromeApps(force = false) {
  if (!IS_WINDOWS) return [];
  if (!force && Date.now() - appsCache.at < 120000) return appsCache.data;
  const home = os.homedir();
  const appdata = process.env.APPDATA || path.join(home, "AppData", "Roaming");
  const dirs = [
    path.join(appdata, "Microsoft", "Windows", "Start Menu", "Programs", "Chrome Apps"),
    path.join(appdata, "Microsoft", "Windows", "Start Menu", "Programs", "Edge Apps"),
    path.join(home, "Desktop"),
    path.join(process.env.PUBLIC || "C:\\Users\\Public", "Desktop"),
    process.env.OneDrive ? path.join(process.env.OneDrive, "Desktop") : ""
  ].filter(isDir);
  if (!dirs.length) return [];
  const rows = parseRows(await powershell(shortcutScript(dirs, "-Depth 2")));
  const startUrls = chromeAppUrls();
  const apps = new Map();
  for (const row of rows) {
    const args = row.args || "";
    if (!args.includes("--app-id=")) continue;
    const id = args.split("--app-id=")[1].split(/\s/)[0].replace(/"/g, "");
    if (apps.has(id)) continue;
    const icon = String(row.icon || "").replace(/,-?\d+$/, "");
    apps.set(id, {
      id,
      name: row.name || id,
      lnk: row.path,
      icon: icon && fs.existsSync(icon) ? icon : "",
      browser: /msedge/i.test(row.target || "") ? "Edge" : "Chrome",
      url: startUrls.get(id) || knownAppUrl(row.name || "")
    });
  }
  const data = [...apps.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  appsCache = { at: Date.now(), data };
  return data;
}

function appIconPath(app) {
  if (!app.icon) return null;
  const resources = path.join(path.dirname(path.dirname(app.icon)), "Manifest Resources", app.id, "Icons");
  try {
    const pngs = fs.readdirSync(resources).filter((f) => f.endsWith(".png")).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    if (pngs.length) return path.join(resources, pngs[pngs.length - 1]);
  } catch {
    /* fall back to the .ico */
  }
  return app.icon;
}

let programsCache = { at: 0, data: [] };

async function programs(force = false) {
  if (!IS_WINDOWS) return [];
  if (!force && programsCache.data.length && Date.now() - programsCache.at < 300000) return programsCache.data;
  const dirs = [
    path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Start Menu", "Programs"),
    path.join(process.env.ProgramData || "C:\\ProgramData", "Microsoft", "Windows", "Start Menu", "Programs")
  ].filter(isDir);
  const rows = parseRows(await powershell(shortcutScript(dirs, ""), 60000));
  const found = new Map();
  for (const row of rows) {
    const name = String(row.name || "").trim();
    const target = row.target || "";
    if (!name || String(row.args || "").includes("--app-id=")) continue;
    if (SKIP_PROGRAM.some((w) => name.toLowerCase().includes(w))) continue;
    if (target && !/\.exe$/i.test(target)) continue;
    const key = name.toLowerCase();
    if (found.has(key)) continue;
    const id = crypto.createHash("sha1").update(row.path).digest("hex").slice(0, 12);
    found.set(key, { id, name, lnk: row.path, target });
  }
  const data = [...found.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  programsCache = { at: Date.now(), data };
  return data;
}

async function programIcon(program, cacheDir) {
  if (!program.target || !fs.existsSync(program.target)) return null;
  await fsp.mkdir(cacheDir, { recursive: true });
  const out = path.join(cacheDir, `${program.id}.png`);
  if (fs.existsSync(out)) return out;
  await powershell(`Add-Type -AssemblyName System.Drawing;`
    + `$i=[System.Drawing.Icon]::ExtractAssociatedIcon(${psQuote(program.target)});`
    + `if($i){$i.ToBitmap().Save(${psQuote(out)},[System.Drawing.Imaging.ImageFormat]::Png)}`, 15000);
  return fs.existsSync(out) ? out : null;
}

/* ---------- Wallpaper ---------- */

function wallpaperPath() {
  return new Promise((resolve) => {
    if (!IS_WINDOWS) {
      resolve(null);
      return;
    }
    execFile("reg", ["query", "HKCU\\Control Panel\\Desktop", "/v", "WallPaper"], { windowsHide: true }, (err, stdout) => {
      const m = !err && /WallPaper\s+REG_\w+\s+(.+)/i.exec(String(stdout));
      const value = m ? m[1].trim() : "";
      if (value && fs.existsSync(value)) {
        resolve(value);
        return;
      }
      const transcoded = path.join(process.env.APPDATA || "", "Microsoft", "Windows", "Themes", "TranscodedWallpaper");
      resolve(fs.existsSync(transcoded) ? transcoded : null);
    });
  });
}

function sniffImage(file) {
  const head = Buffer.alloc(12);
  const fd = fs.openSync(file, "r");
  fs.readSync(fd, head, 0, 12, 0);
  fs.closeSync(fd);
  if (head[0] === 0x89 && head.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (head.toString("ascii", 0, 4) === "RIFF" && head.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (head.toString("ascii", 0, 2) === "BM") return "image/bmp";
  return "image/jpeg";
}

/* ---------- Files with byte ranges (for seeking in the player) ---------- */

async function sendFile(file, request, type, cache = "private, max-age=3600") {
  let st;
  try {
    st = await fsp.stat(file);
  } catch {
    return fail(404, "File not found");
  }
  if (!st.isFile()) return fail(404, "File not found");
  const size = st.size;
  let start = 0;
  let end = size - 1;
  let status = 200;
  const range = request.headers.get("range");
  if (range && /^bytes=/.test(range) && size) {
    const [first, last] = range.slice(6).split(",")[0].trim().split("-");
    if (first) {
      start = parseInt(first, 10);
      end = last ? Math.min(parseInt(last, 10), size - 1) : size - 1;
    } else {
      start = Math.max(0, size - parseInt(last, 10));
    }
    if (!(start <= end) || Number.isNaN(start)) {
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    }
    status = 206;
  }
  const headers = {
    "content-type": type || mimeOf(file),
    "accept-ranges": "bytes",
    "content-length": String(size ? end - start + 1 : 0),
    "cache-control": cache,
    "x-content-type-options": "nosniff"
  };
  if (status === 206) headers["content-range"] = `bytes ${start}-${end}/${size}`;
  if (request.method === "HEAD" || !size) return new Response(null, { status, headers });
  const stream = fs.createReadStream(file, { start, end });
  return new Response(Readable.toWeb(stream), { status, headers });
}

/* ---------- Router ---------- */

function createApi(host) {
  const iconCache = path.join(host.userData, "icons");

  async function body(request) {
    try {
      const data = await request.json();
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  }

  const routes = {
    "GET /api/status": async () => json({
      ok: true,
      platform: process.platform,
      electron: true,
      lan: false,
      local: true,
      canLaunch: IS_WINDOWS,
      volume: await host.audio.ready,
      wallpaper: !!(await wallpaperPath()),
      chrome: !!host.browserPath(),
      drm: host.drm(),
      appsInside: host.getSettings().launchMode === "inside"
    }),
    "GET /api/places": async () => json({ places: knownFolders(), drives: await drives() }),
    "GET /api/list": async (_r, q) => json(await listDir(q.get("path") || "")),
    "GET /api/library": async () => json(await library()),
    "GET /api/file": async (r, q) => {
      const file = q.get("path") || "";
      if (!path.isAbsolute(file)) return fail(404, "File not found");
      return sendFile(file, r);
    },
    "GET /api/apps": async (_r, q) => {
      const list = await chromeApps(q.get("refresh") === "1");
      return json({ apps: list.map((a) => ({ id: a.id, name: a.name, browser: a.browser, hasIcon: !!a.icon, url: a.url })) });
    },
    "GET /api/icon": async (r, q) => {
      const app = (await chromeApps()).find((a) => a.id === q.get("id"));
      const file = app && appIconPath(app);
      if (!file) return fail(404, "No icon");
      return sendFile(file, r, file.endsWith(".png") ? "image/png" : "image/x-icon", "private, max-age=86400");
    },
    "GET /api/programs": async (_r, q) => json({ programs: (await programs(q.get("refresh") === "1")).map((p) => ({ id: p.id, name: p.name })) }),
    "GET /api/program-icon": async (r, q) => {
      const program = (await programs()).find((p) => p.id === q.get("id"));
      const file = program && (await programIcon(program, iconCache));
      if (!file) return fail(404, "No icon");
      return sendFile(file, r, "image/png", "private, max-age=86400");
    },
    "GET /api/wallpaper": async (r) => {
      const file = await wallpaperPath();
      if (!file) return fail(404, "No desktop wallpaper found");
      return sendFile(file, r, sniffImage(file), "no-cache");
    },
    "GET /api/volume": async () => {
      if (!(await host.audio.ready)) return fail(501, "System volume is not available");
      return json(await host.audio.get());
    },
    "POST /api/volume": async (r) => {
      if (!(await host.audio.ready)) return fail(501, "System volume is not available");
      const b = await body(r);
      return json(await host.audio.set({
        level: b.level != null ? Number(b.level) : undefined,
        delta: b.delta != null ? Number(b.delta) : undefined,
        mute: b.mute != null ? !!b.mute : undefined
      }));
    },
    "POST /api/launch": async (r) => {
      const { id } = await body(r);
      const app = (await chromeApps()).find((a) => a.id === id);
      if (!app || !app.lnk) return fail(404, "That Chrome shortcut is gone");
      return json(await host.openShortcut(app.lnk));
    },
    "POST /api/launch-program": async (r) => {
      const { id } = await body(r);
      const program = (await programs()).find((p) => p.id === id);
      if (!program) return fail(404, "That program is no longer in the Start menu");
      return json(await host.openShortcut(program.lnk));
    },
    "POST /api/close-app": async (r) => {
      const { id } = await body(r);
      return json(host.closeApp(String(id || "")));
    },
    "POST /api/clear-app-data": async () => json(await host.clearAppData()),
    "POST /api/preload-app": async (r) => {
      const { id, name, url, zoom, layout } = await body(r);
      let parsed;
      try {
        parsed = new URL(String(url || ""));
      } catch {
        return fail(400, "Only web addresses can be loaded");
      }
      if (!/^https?:$/.test(parsed.protocol)) return fail(400, "Only web addresses can be loaded");
      return json(host.preloadApp(String(id || parsed.origin), String(name || parsed.hostname), parsed.href, {
        zoom: Number(zoom) || undefined,
        layout: layout === "desktop" ? "desktop" : "auto"
      }));
    },
    "POST /api/open-url": async (r) => {
      const { url, id, name, mode, zoom, layout } = await body(r);
      let parsed;
      try {
        parsed = new URL(String(url || ""));
      } catch {
        return fail(400, "Only web addresses can be opened");
      }
      if (!/^https?:$/.test(parsed.protocol)) return fail(400, "Only web addresses can be opened");
      return json(await host.openStreaming(parsed.href, {
        id: String(id || parsed.origin),
        name: String(name || parsed.hostname),
        mode,
        zoom: Number(zoom) || undefined,
        layout: layout === "desktop" ? "desktop" : "auto"
      }));
    },
    "POST /api/source": async (r) => {
      const { target } = await body(r);
      if (target !== "browser" && target !== "desktop") return fail(400, "Unknown source");
      await host.switchSource(target);
      return json({ ok: true });
    },
    "GET /api/host": async () => json(host.getSettings()),
    "POST /api/host": async (r) => json(await host.setSettings(await body(r))),
    "POST /api/quit": async () => {
      setTimeout(() => host.quit(), 150);
      return json({ ok: true });
    }
  };

  if (host.testState) routes["GET /api/test-state"] = async () => json(host.testState());
  if (host.testKey) {
    routes["POST /api/test-key"] = async (r) => {
      const { key, hold } = await body(r);
      return json(await host.testKey(String(key || "Escape"), Number(hold) || 60));
    };
  }

  return async function handle(request) {
    const url = new URL(request.url);
    const route = routes[`${request.method === "HEAD" ? "GET" : request.method} ${url.pathname}`];
    if (!route) return fail(404, "No such endpoint");
    try {
      return await route(request, url.searchParams);
    } catch (err) {
      if (err && (err.code === "EACCES" || err.code === "EPERM")) return fail(403, "Windows does not allow access to that folder");
      if (err && err.code === "ENOENT") return fail(404, "That folder or file is gone");
      return fail(err && err.status ? err.status : 500, (err && err.message) || "Something went wrong");
    }
  };
}

module.exports = { createApi, mimeOf, powershell };
