"use strict";

// Opens a site in the user's real Google Chrome, then parents that window inside the
// TV window so it is not a separate desktop window. Chrome keeps the cookies. Closing
// the window closes only the one we opened, not the rest of Chrome.

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class TvFrame {
  public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc lp, IntPtr l);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr h, out RECT r);
  [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")] public static extern IntPtr GetWindowLongPtr(IntPtr h, int n);
  [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW")] public static extern IntPtr SetWindowLongPtr(IntPtr h, int n, IntPtr v);
  [DllImport("user32.dll")] public static extern IntPtr SetParent(IntPtr child, IntPtr parent);
  [DllImport("user32.dll")] public static extern IntPtr GetParent(IntPtr child);
  [DllImport("user32.dll")] public static extern IntPtr SetFocus(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("user32.dll")] public static extern uint GetDpiForWindow(IntPtr hwnd);
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr hwnd, int attr, out RECT rect, int size);
  public struct RECT { public int Left, Top, Right, Bottom; }
  static string found = "";
  public static bool Collect(IntPtr h, IntPtr l) {
    var sb = new StringBuilder(256);
    GetClassName(h, sb, 256);
    if (!sb.ToString().StartsWith("Chrome_WidgetWin")) return true;
    RECT r;
    if (!GetWindowRect(h, out r)) return true;
    int area = Math.Max(0, r.Right - r.Left) * Math.Max(0, r.Bottom - r.Top);
    if (area < 20000) return true;
    if (found.Length > 0) found += ",";
    found += h.ToInt64().ToString() + ":" + area.ToString();
    return true;
  }
  [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr h, EnumProc lp, IntPtr l);
  static EnumProc keep;
  static int bestInset;
  static IntPtr measureRoot;
  public static bool MeasureChild(IntPtr h, IntPtr l) {
    var sb = new StringBuilder(256);
    GetClassName(h, sb, 256);
    if (sb.ToString().IndexOf("RenderWidgetHostHWND", StringComparison.Ordinal) < 0) return true;
    RECT wr, cr;
    if (!GetWindowRect(measureRoot, out wr) || !GetWindowRect(h, out cr)) return true;
    int top = cr.Top - wr.Top;
    if (top > bestInset && top < 180) bestInset = top;
    return true;
  }
  public static int ContentTop(IntPtr hwnd) {
    bestInset = 0;
    measureRoot = hwnd;
    keep = MeasureChild;
    EnumChildWindows(hwnd, keep, IntPtr.Zero);
    if (bestInset >= 8) return bestInset;
    RECT buttons;
    RECT wr;
    GetWindowRect(hwnd, out wr);
    if (DwmGetWindowAttribute(hwnd, 5, out buttons, Marshal.SizeOf(typeof(RECT))) == 0) {
      int local = buttons.Bottom;
      int fromWindow = buttons.Bottom - wr.Top;
      if (local >= 8 && local < 180) return local;
      if (fromWindow >= 8 && fromWindow < 180) return fromWindow;
    }
    uint dpi = GetDpiForWindow(hwnd);
    if (dpi < 96) dpi = 96;
    return (int)Math.Round(40.0 * dpi / 96.0);
  }
  public static string ChromeWindows() {
    found = "";
    keep = Collect;
    EnumWindows(keep, IntPtr.Zero);
    return found;
  }
  public static void Dock(long child, long owner, int x, int y, int w, int h, bool focus) {
    IntPtr hwnd = new IntPtr(child);
    IntPtr parent = new IntPtr(owner);
    ShowWindow(hwnd, 0);
    long style = GetWindowLongPtr(hwnd, -16).ToInt64();
    style &= ~0x80000000L;
    style &= ~0x00C00000L;
    style &= ~0x00800000L;
    style &= ~0x00040000L;
    style |= 0x40000000L;
    style |= 0x10000000L;
    SetWindowLongPtr(hwnd, -16, new IntPtr(style));
    long ex = GetWindowLongPtr(hwnd, -20).ToInt64();
    ex &= ~0x00000100L;
    ex &= ~0x00000200L;
    ex &= ~0x00020000L;
    SetWindowLongPtr(hwnd, -20, new IntPtr(ex));
    int bar = 0;
    if (parent != IntPtr.Zero) {
      SetParent(hwnd, parent);
      RECT cr;
      if (GetClientRect(parent, out cr) && cr.Right > 0 && cr.Bottom > 0) {
        w = cr.Right;
        h = cr.Bottom;
      }
      bar = ContentTop(hwnd);
      x = 0;
      y = -bar;
      h = h + bar;
    }
    SetWindowPos(hwnd, IntPtr.Zero, x, y, w, h, 0x0040 | 0x0020 | 0x0004);
    ShowWindow(hwnd, 5);
    if (focus) SetFocus(hwnd);
  }
  public static void Conceal(long child) {
    ShowWindow(new IntPtr(child), 0);
  }
  public static void CloseWin(long child) {
    PostMessage(new IntPtr(child), 0x0010, IntPtr.Zero, IntPtr.Zero);
  }
  public static bool Alive(long child) { return IsWindow(new IntPtr(child)); }
  public static bool Inside(long child, long owner) {
    if (!IsWindow(new IntPtr(child)) || owner == 0) return false;
    return GetParent(new IntPtr(child)) == new IntPtr(owner);
  }
}
'@
[Console]::Out.WriteLine('{"ready":true}')
[Console]::Out.Flush()
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  $req = $null
  try {
    $req = $line | ConvertFrom-Json
    if ($req.cmd -eq 'list') {
      $out = @{ id = $req.id; wins = [TvFrame]::ChromeWindows() } | ConvertTo-Json -Compress
    } elseif ($req.cmd -eq 'dock') {
      $focus = $true
      if ($req.PSObject.Properties.Name -contains 'focus' -and -not $req.focus) { $focus = $false }
      [TvFrame]::Dock([int64]$req.hwnd, [int64]$req.owner, [int]$req.x, [int]$req.y, [int]$req.w, [int]$req.h, $focus)
      $out = @{ id = $req.id; ok = $true } | ConvertTo-Json -Compress
    } elseif ($req.cmd -eq 'conceal') {
      [TvFrame]::Conceal([int64]$req.hwnd)
      $out = @{ id = $req.id; ok = $true } | ConvertTo-Json -Compress
    } elseif ($req.cmd -eq 'close') {
      [TvFrame]::CloseWin([int64]$req.hwnd)
      $out = @{ id = $req.id; ok = $true } | ConvertTo-Json -Compress
    } elseif ($req.cmd -eq 'alive') {
      $alive = [TvFrame]::Alive([int64]$req.hwnd)
      $inside = $false
      if ($alive) { $inside = [TvFrame]::Inside([int64]$req.hwnd, [int64]$req.owner) }
      $out = @{ id = $req.id; alive = $alive; inside = $inside } | ConvertTo-Json -Compress
    } else {
      $out = @{ id = $req.id; error = 'unknown' } | ConvertTo-Json -Compress
    }
  } catch {
    $id = 0
    if ($req) { $id = $req.id }
    $out = @{ id = $id; error = $_.Exception.Message } | ConvertTo-Json -Compress
  }
  [Console]::Out.WriteLine($out)
  [Console]::Out.Flush()
}
`;

function chromeExe() {
  const candidates = [
    path.join(process.env.ProgramFiles || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe"),
    path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe")
  ];
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

function lastProfile() {
  try {
    const file = path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "User Data", "Local State");
    const state = JSON.parse(fs.readFileSync(file, "utf8"));
    const name = state && state.profile && state.profile.last_used;
    return typeof name === "string" && name ? name : "Default";
  } catch {
    return "Default";
  }
}

function hwndOf(win) {
  try {
    const buf = win.getNativeWindowHandle();
    if (!buf || !buf.length) return "0";
    const n = buf.length >= 8 ? buf.readBigUInt64LE(0) : BigInt(buf.readUInt32LE(0));
    return n.toString();
  } catch {
    return "0";
  }
}

function parseWins(text) {
  const out = [];
  String(text || "").split(",").forEach((part) => {
    const [hwnd, area] = part.split(":");
    if (hwnd && /^\d+$/.test(hwnd)) out.push({ hwnd, area: Number(area) || 0 });
  });
  return out;
}

class ChromeFrame {
  constructor(win, onGone) {
    this.win = win;
    this.onGone = onGone;
    this.onDisturb = null;
    this.hwnd = null;
    this.hosted = [];
    this.outside = new Set();
    this.closing = false;
    this.ok = false;
    this.proc = null;
    this.pending = new Map();
    this.nextId = 1;
    this.buffer = "";
    this.ready = process.platform === "win32" ? this.start() : Promise.resolve(false);
    this.watchTimer = setInterval(() => this.watch(), 200);
    const place = () => this.place();
    win.on("resize", place);
    win.on("move", place);
  }

  start() {
    return new Promise((resolve) => {
      const encoded = Buffer.from(SCRIPT, "utf16le").toString("base64");
      const proc = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded], {
        windowsHide: true,
        stdio: ["pipe", "pipe", "pipe"]
      });
      this.proc = proc;
      const timer = setTimeout(() => resolve(false), 20000);
      proc.stdout.setEncoding("utf8");
      proc.stdout.on("data", (chunk) => {
        this.buffer += chunk;
        let nl;
        while ((nl = this.buffer.indexOf("\n")) >= 0) {
          const line = this.buffer.slice(0, nl).trim();
          this.buffer = this.buffer.slice(nl + 1);
          if (!line) continue;
          let msg;
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }
          if (msg.ready) {
            clearTimeout(timer);
            this.ok = true;
            resolve(true);
            continue;
          }
          const waiter = this.pending.get(msg.id);
          if (!waiter) continue;
          this.pending.delete(msg.id);
          if (msg.error) waiter.reject(new Error(msg.error));
          else waiter.resolve(msg);
        }
      });
      proc.stderr.setEncoding("utf8");
      proc.stderr.on("data", () => {});
      proc.on("exit", () => {
        this.ok = false;
        clearTimeout(timer);
        resolve(false);
        for (const waiter of this.pending.values()) waiter.reject(new Error("Chrome frame helper stopped"));
        this.pending.clear();
      });
      proc.on("error", () => resolve(false));
    });
  }

  request(body) {
    if (!this.ok || !this.proc) return Promise.reject(new Error("Chrome frame helper is not available"));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(`${JSON.stringify({ id, ...body })}\n`);
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error("Chrome frame helper did not answer"));
      }, 8000);
    });
  }

  isOpen() {
    return this.hosted.length > 0;
  }

  async conceal(hwnd) {
    try {
      await this.request({ cmd: "conceal", hwnd });
    } catch {
      /* already gone */
    }
  }

  async dock(hwnd, focus) {
    const b = this.win.isDestroyed() ? { x: 0, y: 0, width: 800, height: 600 } : this.win.getContentBounds();
    await this.request({
      cmd: "dock",
      hwnd,
      owner: hwndOf(this.win),
      x: b.x,
      y: b.y,
      w: b.width,
      h: b.height,
      focus: !!focus
    });
    if (!this.hosted.includes(hwnd)) this.hosted.push(hwnd);
    this.hwnd = hwnd;
    if (this.onDisturb) this.onDisturb();
  }

  async list() {
    const msg = await this.request({ cmd: "list" });
    return parseWins(msg.wins);
  }

  place() {
    if (!this.hwnd || !this.ok || this.win.isDestroyed()) return;
    this.dock(this.hwnd, false).catch(() => {});
  }

  async open(url) {
    await this.ready;
    const exe = chromeExe();
    if (!this.ok || !exe) return false;
    if (this.hwnd) await this.close();
    let before;
    try {
      before = new Set((await this.list()).map((item) => item.hwnd));
    } catch {
      return false;
    }
    this.outside = before;
    const child = spawn(exe, [
      `--app=${url}`,
      `--profile-directory=${lastProfile()}`,
      "--window-position=-2400,-2400"
    ], {
      detached: true,
      stdio: "ignore"
    });
    child.unref();
    for (let i = 0; i < 80; i++) {
      await new Promise((resolve) => setTimeout(resolve, 40));
      let wins = [];
      try {
        wins = await this.list();
      } catch {
        continue;
      }
      const fresh = wins.filter((item) => !before.has(item.hwnd)).sort((a, b) => b.area - a.area);
      if (!fresh.length) continue;
      await Promise.all(fresh.map((item) => this.conceal(item.hwnd)));
      try {
        await this.dock(fresh[0].hwnd, true);
      } catch {
        return false;
      }
      setTimeout(() => this.place(), 400);
      setTimeout(() => this.place(), 1000);
      return true;
    }
    return false;
  }

  async close() {
    if (!this.hosted.length) return;
    this.closing = true;
    const all = this.hosted.splice(0);
    this.hwnd = null;
    for (const hwnd of all.reverse()) {
      try {
        await this.request({ cmd: "close", hwnd });
      } catch {
        /* the window is already gone */
      }
    }
    this.closing = false;
    if (this.onDisturb) this.onDisturb();
  }

  async watch() {
    if (this.closing || !this.hosted.length) return;
    const top = this.hosted[this.hosted.length - 1];
    let alive = true;
    try {
      const msg = await this.request({ cmd: "alive", hwnd: top, owner: hwndOf(this.win) });
      alive = !!msg.alive;
    } catch {
      return;
    }
    if (this.closing) return;
    if (!alive) {
      this.hosted = this.hosted.filter((hwnd) => hwnd !== top);
      this.hwnd = this.hosted[this.hosted.length - 1] || null;
      if (!this.hwnd) {
        if (this.onGone) this.onGone();
        if (this.onDisturb) this.onDisturb();
        return;
      }
      this.place();
      if (this.onDisturb) this.onDisturb();
      return;
    }
    let wins = [];
    try {
      wins = await this.list();
    } catch {
      return;
    }
    const extras = wins
      .filter((item) => !this.outside.has(item.hwnd) && !this.hosted.includes(item.hwnd))
      .sort((a, b) => b.area - a.area);
    if (!extras.length) return;
    await Promise.all(extras.map((item) => this.conceal(item.hwnd)));
    try {
      await this.dock(extras[0].hwnd, true);
    } catch {
      /* it closed before it could be pulled in */
    }
  }

  stop() {
    clearInterval(this.watchTimer);
    if (this.proc) this.proc.kill();
  }
}

module.exports = { ChromeFrame, chromeExe };
