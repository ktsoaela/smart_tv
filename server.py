"""Smart TV companion server.

Serves the launcher and gives it what a web page cannot reach on its own:
files on this PC (with streaming for the media player), Chrome-created app
shortcuts, the desktop wallpaper, Windows system volume, and the
"change source" actions (browser and desktop).

Standard library only.  Run from this folder:

    py server.py            # http://localhost:8787, this PC only
    py server.py --lan      # also reachable from a TV on your network (needs the printed key)

By default it listens on 127.0.0.1, so nothing else on the network can reach it.
"""

from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import mimetypes
import os
import secrets
import shutil
import socket
import string
import subprocess
import sys
import tempfile
import threading
import time
import webbrowser
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
IS_WINDOWS = os.name == "nt"

VIDEO_EXT = {".mp4", ".m4v", ".webm", ".mkv", ".mov", ".ogv", ".avi", ".wmv", ".ts", ".m2ts"}
AUDIO_EXT = {".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg", ".oga", ".opus", ".wma"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".avif"}
EXTRA_TYPES = {
    ".mkv": "video/x-matroska",
    ".m4v": "video/mp4",
    ".mov": "video/quicktime",
    ".ogv": "video/ogg",
    ".ts": "video/mp2t",
    ".m2ts": "video/mp2t",
    ".m4a": "audio/mp4",
    ".flac": "audio/flac",
    ".opus": "audio/ogg",
    ".oga": "audio/ogg",
    ".avif": "image/avif",
    ".webp": "image/webp",
}
LIST_LIMIT = 1500
CHUNK = 256 * 1024

CONFIG = {"lan": False, "key": "", "port": 8787}


# ---------------------------------------------------------------- helpers

def kind_of(name: str) -> str:
    ext = os.path.splitext(name)[1].lower()
    if ext in VIDEO_EXT:
        return "video"
    if ext in AUDIO_EXT:
        return "audio"
    if ext in IMAGE_EXT:
        return "image"
    return "other"


def mime_of(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    return EXTRA_TYPES.get(ext) or mimetypes.guess_type(path)[0] or "application/octet-stream"


def is_hidden(entry: os.DirEntry) -> bool:
    if entry.name.startswith((".", "$")) or entry.name in {"desktop.ini", "Thumbs.db", "System Volume Information"}:
        return True
    if IS_WINDOWS:
        try:
            attrs = entry.stat(follow_symlinks=False).st_file_attributes  # type: ignore[attr-defined]
            return bool(attrs & 0x2 or attrs & 0x4)  # hidden or system
        except OSError:
            return True
    return False


def home() -> Path:
    return Path.home()


def first_existing(*candidates: Path) -> Path | None:
    for c in candidates:
        if c and c.is_dir():
            return c
    return None


def known_folders() -> list[dict]:
    h = home()
    one = Path(os.environ.get("OneDrive", "")) if os.environ.get("OneDrive") else None
    places = [
        ("Home", "home", h),
        ("Desktop", "desktop", first_existing(one / "Desktop" if one else None, h / "Desktop")),
        ("Downloads", "download", first_existing(h / "Downloads")),
        ("Videos", "film", first_existing(one / "Videos" if one else None, h / "Videos")),
        ("Music", "music", first_existing(one / "Music" if one else None, h / "Music")),
        ("Pictures", "image", first_existing(one / "Pictures" if one else None, h / "Pictures")),
        ("Documents", "file", first_existing(one / "Documents" if one else None, h / "Documents")),
    ]
    return [{"name": n, "icon": i, "path": str(p)} for n, i, p in places if p]


def drives() -> list[dict]:
    out = []
    if IS_WINDOWS:
        for letter in string.ascii_uppercase:
            root = f"{letter}:\\"
            if os.path.exists(root):
                try:
                    usage = shutil.disk_usage(root)
                    out.append({"name": f"Drive {letter}:", "path": root, "total": usage.total, "free": usage.free})
                except OSError:
                    out.append({"name": f"Drive {letter}:", "path": root})
    else:
        out.append({"name": "Root", "path": "/"})
    return out


def list_dir(path: str) -> dict:
    p = Path(path)
    if not p.is_absolute():
        raise ValueError("Path must be absolute")
    entries = []
    other = 0
    truncated = False
    with os.scandir(p) as it:
        for entry in it:
            if is_hidden(entry):
                continue
            try:
                is_dir = entry.is_dir()
                st = entry.stat()
            except OSError:
                continue
            kind = "dir" if is_dir else kind_of(entry.name)
            if kind == "other":
                other += 1
                continue
            if len(entries) >= LIST_LIMIT:
                truncated = True
                break
            entries.append({
                "name": entry.name,
                "path": entry.path,
                "type": kind,
                "size": 0 if is_dir else st.st_size,
                "mtime": int(st.st_mtime),
            })
    entries.sort(key=lambda e: (e["type"] != "dir", e["name"].casefold()))
    parent = str(p.parent) if p.parent != p else None
    return {"path": str(p), "name": p.name or str(p), "parent": parent, "entries": entries,
            "otherCount": other, "truncated": truncated}


_library_cache: dict = {"at": 0.0, "data": None}


def library() -> dict:
    if _library_cache["data"] is not None and time.time() - _library_cache["at"] < 60:
        return _library_cache["data"]
    roots = [Path(p["path"]) for p in known_folders() if p["name"] in {"Videos", "Music", "Downloads", "Desktop"}]
    found = {"video": [], "audio": []}
    budget = 6000
    for root in roots:
        stack = [(root, 0)]
        while stack and budget > 0:
            folder, depth = stack.pop()
            try:
                with os.scandir(folder) as it:
                    for entry in it:
                        budget -= 1
                        if budget <= 0 or is_hidden(entry):
                            continue
                        try:
                            if entry.is_dir():
                                if depth < 2:
                                    stack.append((Path(entry.path), depth + 1))
                                continue
                            kind = kind_of(entry.name)
                            if kind in found:
                                st = entry.stat()
                                found[kind].append({"name": entry.name, "path": entry.path, "type": kind,
                                                    "size": st.st_size, "mtime": int(st.st_mtime)})
                        except OSError:
                            continue
            except OSError:
                continue
    data = {}
    for kind, items in found.items():
        seen, unique = set(), []
        for item in sorted(items, key=lambda e: -e["mtime"]):
            if item["path"] not in seen:
                seen.add(item["path"])
                unique.append(item)
        data["videos" if kind == "video" else "music"] = unique[:24]
    _library_cache.update(at=time.time(), data=data)
    return data


# ---------------------------------------------------------------- Chrome shortcuts

_apps_cache: dict = {"at": 0.0, "data": []}


def shortcut_dirs() -> list[str]:
    h = home()
    appdata = Path(os.environ.get("APPDATA", h / "AppData" / "Roaming"))
    one = os.environ.get("OneDrive")
    dirs = [
        appdata / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Chrome Apps",
        appdata / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Edge Apps",
        h / "Desktop",
        Path(os.environ.get("PUBLIC", "C:\\Users\\Public")) / "Desktop",
    ]
    if one:
        dirs.append(Path(one) / "Desktop")
    return [str(d) for d in dirs if d.is_dir()]


def chrome_apps(force: bool = False) -> list[dict]:
    """Shortcuts made by Chrome or Edge ("Create shortcut" / "Install app") carry --app-id."""
    if not IS_WINDOWS:
        return []
    if not force and time.time() - _apps_cache["at"] < 120:
        return _apps_cache["data"]
    dirs = shortcut_dirs()
    if not dirs:
        return []
    quoted = ",".join("'" + d.replace("'", "''") + "'" for d in dirs)
    script = (
        "[Console]::OutputEncoding=[Text.Encoding]::UTF8;"
        "$sh=New-Object -ComObject WScript.Shell;"
        f"Get-ChildItem -Path {quoted} -Filter *.lnk -Recurse -Depth 2 -ErrorAction SilentlyContinue | ForEach-Object {{"
        "$l=$sh.CreateShortcut($_.FullName);"
        "[pscustomobject]@{path=$_.FullName;name=$_.BaseName;args=$l.Arguments;icon=$l.IconLocation;target=$l.TargetPath}"
        "} | ConvertTo-Json -Compress"
    )
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
                             capture_output=True, timeout=20, creationflags=0x08000000)
        raw = out.stdout.decode("utf-8", "replace").strip()
        rows = json.loads(raw) if raw else []
        if isinstance(rows, dict):
            rows = [rows]
    except (OSError, ValueError, subprocess.SubprocessError):
        rows = []
    apps: dict[str, dict] = {}
    for row in rows:
        args = row.get("args") or ""
        if "--app-id=" not in args:
            continue
        app_id = args.split("--app-id=", 1)[1].split()[0].strip('"')
        if app_id in apps:
            continue
        icon = (row.get("icon") or "").rsplit(",", 1)[0]
        browser = "Edge" if "msedge" in (row.get("target") or "").lower() else "Chrome"
        apps[app_id] = {"id": app_id, "name": row.get("name") or app_id, "lnk": row.get("path"),
                        "icon": icon if icon and os.path.isfile(icon) else "", "browser": browser}
    data = sorted(apps.values(), key=lambda a: a["name"].casefold())
    _apps_cache.update(at=time.time(), data=data)
    return data


_programs_cache: dict = {"at": 0.0, "data": []}
SKIP_PROGRAM = ("uninstall", "readme", "read me", "help", "documentation", "website", "license", "release notes", "manual")


def programs(force: bool = False) -> list[dict]:
    """Programs from the Start menu (yours and all users'), for "Add app → Program on this PC"."""
    if not IS_WINDOWS:
        return []
    if not force and _programs_cache["data"] and time.time() - _programs_cache["at"] < 300:
        return _programs_cache["data"]
    roots = [
        Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
        Path(os.environ.get("ProgramData", "C:\\ProgramData")) / "Microsoft" / "Windows" / "Start Menu" / "Programs",
    ]
    quoted = ",".join("'" + str(r).replace("'", "''") + "'" for r in roots if r.is_dir())
    if not quoted:
        return []
    script = (
        "[Console]::OutputEncoding=[Text.Encoding]::UTF8;"
        "$sh=New-Object -ComObject WScript.Shell;"
        f"Get-ChildItem -Path {quoted} -Filter *.lnk -Recurse -ErrorAction SilentlyContinue | ForEach-Object {{"
        "$l=$sh.CreateShortcut($_.FullName);"
        "[pscustomobject]@{path=$_.FullName;name=$_.BaseName;args=$l.Arguments;target=$l.TargetPath}"
        "} | ConvertTo-Json -Compress"
    )
    try:
        out = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
                             capture_output=True, timeout=30, creationflags=0x08000000)
        raw = out.stdout.decode("utf-8", "replace").strip()
        rows = json.loads(raw) if raw else []
        if isinstance(rows, dict):
            rows = [rows]
    except (OSError, ValueError, subprocess.SubprocessError):
        rows = []
    found: dict[str, dict] = {}
    for row in rows:
        name = (row.get("name") or "").strip()
        target = row.get("target") or ""
        if not name or "--app-id=" in (row.get("args") or ""):
            continue
        if any(word in name.lower() for word in SKIP_PROGRAM):
            continue
        if target and not target.lower().endswith(".exe"):
            continue
        key = name.casefold()
        if key in found:
            continue
        pid = hashlib.sha1(row["path"].encode("utf-8")).hexdigest()[:12]
        found[key] = {"id": pid, "name": name, "lnk": row["path"], "target": target}
    data = sorted(found.values(), key=lambda p: p["name"].casefold())
    _programs_cache.update(at=time.time(), data=data)
    return data


def program_icon(program: dict) -> str | None:
    """Extract the program's icon to a cached PNG (once per program)."""
    target = program.get("target") or ""
    if not target or not os.path.isfile(target):
        return None
    cache = Path(os.environ.get("LOCALAPPDATA", tempfile.gettempdir())) / "SmartTV" / "icons"
    cache.mkdir(parents=True, exist_ok=True)
    out = cache / f"{program['id']}.png"
    if out.is_file():
        return str(out)
    script = (
        "Add-Type -AssemblyName System.Drawing;"
        f"$i=[System.Drawing.Icon]::ExtractAssociatedIcon('{target.replace(chr(39), chr(39) * 2)}');"
        f"if($i){{$i.ToBitmap().Save('{str(out).replace(chr(39), chr(39) * 2)}',[System.Drawing.Imaging.ImageFormat]::Png)}}"
    )
    try:
        subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
                       capture_output=True, timeout=15, creationflags=0x08000000)
    except (OSError, subprocess.SubprocessError):
        return None
    return str(out) if out.is_file() else None


def app_icon_path(app: dict) -> str | None:
    """Prefer a large PNG from the web app's manifest resources, then the shortcut's .ico."""
    icon = app.get("icon") or ""
    if icon:
        crx_dir = Path(icon).parent
        resources = crx_dir.parent / "Manifest Resources" / app["id"] / "Icons"
        if resources.is_dir():
            pngs = sorted(resources.glob("*.png"), key=lambda p: int(p.stem) if p.stem.isdigit() else 0)
            if pngs:
                return str(pngs[-1])
        return icon
    return None


def find_chrome() -> str | None:
    if IS_WINDOWS:
        try:
            import winreg
            for hive in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
                try:
                    with winreg.OpenKey(hive, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe") as k:
                        value = winreg.QueryValue(k, None)
                        if value and os.path.isfile(value):
                            return value
                except OSError:
                    continue
        except ImportError:
            pass
        for base in (os.environ.get("ProgramFiles", ""), os.environ.get("ProgramFiles(x86)", ""), os.environ.get("LOCALAPPDATA", "")):
            candidate = Path(base) / "Google" / "Chrome" / "Application" / "chrome.exe"
            if base and candidate.is_file():
                return str(candidate)
        return None
    return shutil.which("google-chrome") or shutil.which("chromium") or shutil.which("chrome")


# ---------------------------------------------------------------- wallpaper

def wallpaper_path() -> str | None:
    if not IS_WINDOWS:
        return None
    try:
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Control Panel\Desktop") as k:
            value, _ = winreg.QueryValueEx(k, "WallPaper")
            if value and os.path.isfile(value):
                return value
    except OSError:
        pass
    transcoded = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Themes" / "TranscodedWallpaper"
    return str(transcoded) if transcoded.is_file() else None


def sniff_image(path: str) -> str:
    with open(path, "rb") as f:
        head = f.read(16)
    if head.startswith(b"\x89PNG"):
        return "image/png"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    if head.startswith(b"BM"):
        return "image/bmp"
    return "image/jpeg"


# ---------------------------------------------------------------- system volume (Windows Core Audio)

class _GUID(ctypes.Structure):
    _fields_ = [("Data1", ctypes.c_ulong), ("Data2", ctypes.c_ushort), ("Data3", ctypes.c_ushort), ("Data4", ctypes.c_ubyte * 8)]


def _guid(text: str) -> _GUID:
    g = _GUID()
    ctypes.oledll.ole32.CLSIDFromString(ctypes.c_wchar_p(text), ctypes.byref(g))
    return g


_volume_lock = threading.Lock()


def _with_endpoint(fn):
    """Open the default playback device's IAudioEndpointVolume, run fn(method), release."""
    from ctypes import POINTER, WINFUNCTYPE, byref, c_void_p, HRESULT

    def method(ptr, index, *argtypes):
        vtable = ctypes.cast(ptr, POINTER(POINTER(c_void_p)))[0]
        proto = WINFUNCTYPE(HRESULT, c_void_p, *argtypes)(vtable[index])
        return lambda *args: proto(ptr, *args)

    def release(ptr):
        if ptr:
            vtable = ctypes.cast(ptr, POINTER(POINTER(c_void_p)))[0]
            WINFUNCTYPE(ctypes.c_ulong, c_void_p)(vtable[2])(ptr)

    ole32 = ctypes.windll.ole32
    with _volume_lock:
        hr = ole32.CoInitializeEx(None, 0)
        enum, dev, vol = c_void_p(), c_void_p(), c_void_p()
        try:
            clsid = _guid("{BCDE0395-E52F-467C-8E3D-C4579291692E}")
            iid_enum = _guid("{A95664D2-9614-4F35-A746-DE8DB63617E6}")
            iid_vol = _guid("{5CDF2C82-841E-4546-9722-0CF74078229A}")
            ctypes.oledll.ole32.CoCreateInstance(byref(clsid), None, 23, byref(iid_enum), byref(enum))
            method(enum, 4, ctypes.c_int, ctypes.c_int, POINTER(c_void_p))(0, 1, byref(dev))
            method(dev, 3, POINTER(_GUID), ctypes.c_ulong, c_void_p, POINTER(c_void_p))(byref(iid_vol), 23, None, byref(vol))
            return fn(lambda index, *argtypes: method(vol, index, *argtypes))
        finally:
            release(vol)
            release(dev)
            release(enum)
            if hr in (0, 1):
                ole32.CoUninitialize()


def get_volume() -> dict:
    from ctypes import POINTER, byref, c_float, c_int

    def read(m):
        level, muted = c_float(), c_int()
        m(9, POINTER(c_float))(byref(level))
        m(15, POINTER(c_int))(byref(muted))
        return {"level": round(level.value, 3), "muted": bool(muted.value)}

    return _with_endpoint(read)


def set_volume(level: float | None = None, delta: float | None = None, mute: bool | None = None) -> dict:
    from ctypes import POINTER, byref, c_float, c_int, c_void_p

    def write(m):
        current = c_float()
        m(9, POINTER(c_float))(byref(current))
        target = current.value
        if delta is not None:
            target = current.value + delta
        if level is not None:
            target = level
        target = max(0.0, min(1.0, target))
        m(7, c_float, c_void_p)(c_float(target), None)
        if mute is not None:
            m(14, c_int, c_void_p)(1 if mute else 0, None)
        elif delta is not None and delta > 0:
            m(14, c_int, c_void_p)(0, None)
        return None

    _with_endpoint(write)
    return get_volume()


VOLUME_OK = False
if IS_WINDOWS:
    try:
        get_volume()
        VOLUME_OK = True
    except Exception:  # no audio device, or COM unavailable
        VOLUME_OK = False


# ---------------------------------------------------------------- source switching

def show_desktop() -> None:
    """Win+D: minimise everything and show the desktop."""
    user32 = ctypes.windll.user32
    VK_LWIN, VK_D, KEYUP = 0x5B, 0x44, 0x0002
    user32.keybd_event(VK_LWIN, 0, 0, 0)
    user32.keybd_event(VK_D, 0, 0, 0)
    user32.keybd_event(VK_D, 0, KEYUP, 0)
    user32.keybd_event(VK_LWIN, 0, KEYUP, 0)


def open_browser_window() -> None:
    chrome = find_chrome()
    if chrome:
        subprocess.Popen([chrome, "--new-window"], close_fds=True)
    else:
        webbrowser.open("https://www.google.com/", new=1)


def open_web_app(url: str) -> None:
    chrome = find_chrome()
    if chrome:
        subprocess.Popen([chrome, f"--app={url}", "--start-fullscreen"], close_fds=True)
    else:
        webbrowser.open(url, new=1)


# ---------------------------------------------------------------- HTTP

class Handler(SimpleHTTPRequestHandler):
    server_version = "SmartTV/13"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):  # keep the console quiet apart from errors
        if args and str(args[1] if len(args) > 1 else "").startswith(("4", "5")):
            super().log_message(fmt, *args)

    # -- guards

    def is_loopback(self) -> bool:
        return self.client_address[0] in {"127.0.0.1", "::1", "::ffff:127.0.0.1"}

    def host_ok(self) -> bool:
        """Blocks DNS-rebinding: only answer to the names this server is actually reached by."""
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0].strip("[]").lower()
        if host in {"localhost", "127.0.0.1", "::1"}:
            return True
        return CONFIG["lan"] and host == local_ip()

    def authorised(self, query: dict) -> bool:
        if self.is_loopback():
            return True
        key = self.headers.get("X-TV-Key") or (query.get("key") or [""])[0]
        return bool(CONFIG["key"]) and secrets.compare_digest(key, CONFIG["key"])

    def origin_ok(self) -> bool:
        origin = self.headers.get("Origin")
        if not origin:
            return True
        return urlparse(origin).netloc == self.headers.get("Host")

    # -- responses

    def send_json(self, data, status=HTTPStatus.OK):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def fail(self, status, message):
        self.send_json({"error": message}, status)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def read_json(self) -> dict:
        length = int(self.headers.get("Content-Length") or 0)
        if length > 64 * 1024:
            raise ValueError("Body too large")
        raw = self.rfile.read(length) if length else b"{}"
        data = json.loads(raw or b"{}")
        return data if isinstance(data, dict) else {}

    def send_path(self, path: str, content_type: str | None = None, cache: str = "private, max-age=3600"):
        try:
            size = os.path.getsize(path)
            f = open(path, "rb")
        except OSError:
            return self.fail(HTTPStatus.NOT_FOUND, "File not found")
        with f:
            start, end = 0, size - 1
            rng = self.headers.get("Range")
            partial = False
            if rng and rng.startswith("bytes=") and size:
                spec = rng[6:].split(",")[0].strip()
                first, _, last = spec.partition("-")
                try:
                    if first:
                        start = int(first)
                        end = int(last) if last else size - 1
                    else:
                        start = max(0, size - int(last))
                    end = min(end, size - 1)
                    if start > end:
                        raise ValueError
                    partial = True
                except ValueError:
                    self.send_response(HTTPStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    self.send_header("Content-Range", f"bytes */{size}")
                    self.end_headers()
                    return None
            self.send_response(HTTPStatus.PARTIAL_CONTENT if partial else HTTPStatus.OK)
            self.send_header("Content-Type", content_type or mime_of(path))
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Length", str(end - start + 1 if size else 0))
            if partial:
                self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
            self.send_header("Cache-Control", cache)
            # Files are data, never pages: stop an HTML or SVG file from running script on this origin.
            self.send_header("Content-Security-Policy", "sandbox; default-src 'none'; img-src 'self'; media-src 'self'")
            self.end_headers()
            if self.command == "HEAD" or not size:
                return None
            f.seek(start)
            remaining = end - start + 1
            try:
                while remaining > 0:
                    chunk = f.read(min(CHUNK, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
                pass
        return None

    # -- routing

    def do_HEAD(self):
        self.route("GET")

    def do_GET(self):
        self.route("GET")

    def do_POST(self):
        self.route("POST")

    def route(self, method: str):
        if not self.host_ok():
            return self.fail(HTTPStatus.FORBIDDEN, "Unknown host")
        url = urlparse(self.path)
        if not url.path.startswith("/api/"):
            if method != "GET":
                return self.fail(HTTPStatus.METHOD_NOT_ALLOWED, "Use GET")
            return super().do_GET() if self.command == "GET" else super().do_HEAD()
        query = parse_qs(url.query)
        if not self.authorised(query):
            return self.fail(HTTPStatus.UNAUTHORIZED, "Missing key. Open the address printed by server.py.")
        if method == "POST" and not self.origin_ok():
            return self.fail(HTTPStatus.FORBIDDEN, "Cross-site request refused")
        try:
            handler = ROUTES.get((method, url.path))
            if not handler:
                return self.fail(HTTPStatus.NOT_FOUND, "No such endpoint")
            return handler(self, query)
        except PermissionError:
            return self.fail(HTTPStatus.FORBIDDEN, "Windows does not allow access to that folder")
        except FileNotFoundError:
            return self.fail(HTTPStatus.NOT_FOUND, "That folder or file is gone")
        except (ValueError, KeyError) as exc:
            return self.fail(HTTPStatus.BAD_REQUEST, str(exc) or "Bad request")
        except OSError as exc:
            return self.fail(HTTPStatus.INTERNAL_SERVER_ERROR, exc.strerror or str(exc))

    # -- endpoints

    def api_status(self, _q):
        local = self.is_loopback()
        self.send_json({
            "ok": True,
            "platform": sys.platform,
            "lan": CONFIG["lan"],
            "local": local,
            "canLaunch": local and IS_WINDOWS,
            "volume": VOLUME_OK,
            "wallpaper": bool(wallpaper_path()),
            "chrome": bool(find_chrome()),
        })

    def api_places(self, _q):
        self.send_json({"places": known_folders(), "drives": drives()})

    def api_list(self, q):
        path = (q.get("path") or [""])[0]
        self.send_json(list_dir(path))

    def api_library(self, _q):
        self.send_json(library())

    def api_file(self, q):
        path = (q.get("path") or [""])[0]
        if not path or not os.path.isabs(path) or not os.path.isfile(path):
            return self.fail(HTTPStatus.NOT_FOUND, "File not found")
        return self.send_path(path)

    def api_apps(self, q):
        force = (q.get("refresh") or ["0"])[0] == "1"
        apps = [{k: v for k, v in a.items() if k in {"id", "name", "browser"}} | {"hasIcon": bool(a.get("icon"))}
                for a in chrome_apps(force)]
        self.send_json({"apps": apps})

    def api_icon(self, q):
        app_id = (q.get("id") or [""])[0]
        app = next((a for a in chrome_apps() if a["id"] == app_id), None)
        path = app and app_icon_path(app)
        if not path:
            return self.fail(HTTPStatus.NOT_FOUND, "No icon")
        content_type = "image/png" if path.lower().endswith(".png") else "image/x-icon"
        return self.send_path(path, content_type, "private, max-age=86400")

    def api_programs(self, q):
        force = (q.get("refresh") or ["0"])[0] == "1"
        self.send_json({"programs": [{"id": p["id"], "name": p["name"]} for p in programs(force)]})

    def api_program_icon(self, q):
        pid = (q.get("id") or [""])[0]
        program = next((p for p in programs() if p["id"] == pid), None)
        path = program and program_icon(program)
        if not path:
            return self.fail(HTTPStatus.NOT_FOUND, "No icon")
        return self.send_path(path, "image/png", "private, max-age=86400")

    def api_launch_program(self, _q):
        if not self.local_only():
            return None
        pid = str(self.read_json().get("id") or "")
        program = next((p for p in programs() if p["id"] == pid), None)
        if not program:
            return self.fail(HTTPStatus.NOT_FOUND, "That program is no longer in the Start menu")
        os.startfile(program["lnk"])  # type: ignore[attr-defined]
        self.send_json({"ok": True})

    def api_wallpaper(self, _q):
        path = wallpaper_path()
        if not path:
            return self.fail(HTTPStatus.NOT_FOUND, "No desktop wallpaper found")
        return self.send_path(path, sniff_image(path), "no-cache")

    def api_volume_get(self, _q):
        if not VOLUME_OK:
            return self.fail(HTTPStatus.NOT_IMPLEMENTED, "System volume is not available")
        self.send_json(get_volume())

    def api_volume_set(self, _q):
        if not VOLUME_OK:
            return self.fail(HTTPStatus.NOT_IMPLEMENTED, "System volume is not available")
        body = self.read_json()
        level = body.get("level")
        delta = body.get("delta")
        mute = body.get("mute")
        self.send_json(set_volume(
            level=float(level) if level is not None else None,
            delta=float(delta) if delta is not None else None,
            mute=bool(mute) if mute is not None else None,
        ))

    def local_only(self) -> bool:
        if self.is_loopback() and IS_WINDOWS:
            return True
        self.fail(HTTPStatus.FORBIDDEN, "Only the PC running server.py can open apps and switch sources")
        return False

    def api_launch(self, _q):
        if not self.local_only():
            return None
        app_id = str(self.read_json().get("id") or "")
        app = next((a for a in chrome_apps() if a["id"] == app_id), None)
        if not app or not app.get("lnk"):
            return self.fail(HTTPStatus.NOT_FOUND, "That Chrome shortcut is gone")
        os.startfile(app["lnk"])  # type: ignore[attr-defined]
        self.send_json({"ok": True})

    def api_open_url(self, _q):
        if not self.local_only():
            return None
        url = str(self.read_json().get("url") or "")
        if urlparse(url).scheme not in {"http", "https"}:
            return self.fail(HTTPStatus.BAD_REQUEST, "Only web addresses can be opened")
        open_web_app(url)
        self.send_json({"ok": True})

    def api_source(self, _q):
        if not self.local_only():
            return None
        target = str(self.read_json().get("target") or "")
        if target == "desktop":
            show_desktop()
        elif target == "browser":
            open_browser_window()
        else:
            return self.fail(HTTPStatus.BAD_REQUEST, "Unknown source")
        self.send_json({"ok": True})


ROUTES = {
    ("GET", "/api/status"): Handler.api_status,
    ("GET", "/api/places"): Handler.api_places,
    ("GET", "/api/list"): Handler.api_list,
    ("GET", "/api/library"): Handler.api_library,
    ("GET", "/api/file"): Handler.api_file,
    ("GET", "/api/apps"): Handler.api_apps,
    ("GET", "/api/icon"): Handler.api_icon,
    ("GET", "/api/wallpaper"): Handler.api_wallpaper,
    ("GET", "/api/programs"): Handler.api_programs,
    ("GET", "/api/program-icon"): Handler.api_program_icon,
    ("POST", "/api/launch-program"): Handler.api_launch_program,
    ("GET", "/api/volume"): Handler.api_volume_get,
    ("POST", "/api/volume"): Handler.api_volume_set,
    ("POST", "/api/launch"): Handler.api_launch,
    ("POST", "/api/open-url"): Handler.api_open_url,
    ("POST", "/api/source"): Handler.api_source,
}


def local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"


def main():
    parser = argparse.ArgumentParser(description="Smart TV companion server")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--lan", action="store_true", help="also listen on the local network (requires the printed key)")
    parser.add_argument("--no-open", action="store_true", help="do not open a browser")
    args = parser.parse_args()

    CONFIG["port"] = args.port
    CONFIG["lan"] = args.lan
    CONFIG["key"] = secrets.token_urlsafe(12) if args.lan else ""
    mimetypes.add_type("text/javascript", ".js")

    bind = "0.0.0.0" if args.lan else "127.0.0.1"
    httpd = ThreadingHTTPServer((bind, args.port), Handler)
    httpd.daemon_threads = True
    url = f"http://localhost:{args.port}/"
    print(f"Smart TV is running at {url}")
    if args.lan:
        print(f"On a TV on this network, open: http://{local_ip()}:{args.port}/?key={CONFIG['key']}")
        print("Anyone with that address and key can browse this PC's files. Stop the server when you're done.")
    print("System volume:", "available" if VOLUME_OK else "not available", "| Chrome:", find_chrome() or "not found")
    print("Press Ctrl+C to stop.")
    if not args.no_open:
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
