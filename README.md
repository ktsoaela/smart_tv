<div align="center">
  <img src="assets/logo.svg" alt="Smart TV" width="128" style="background:#1a1a1a;padding:16px;border-radius:12px" />

  <h1>Smart TV</h1>

  <p><strong>A TV launcher you run in a browser and drive with a remote.</strong></p>

  <p>
    <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-375348?style=flat-square" /></a>
    <a href="docs/guide.md"><img alt="Docs" src="https://img.shields.io/badge/docs-guide-547f72?style=flat-square" /></a>
    <img alt="Stack" src="https://img.shields.io/badge/stack-HTML_CSS_JS-436659?style=flat-square" />
  </p>
</div>

**Author:** [Khotso Tsoaela](https://github.com/ktsoaela) (`@ktsoaela`)

The public page is [ktsoaela.github.io/smart_tv](https://ktsoaela.github.io/smart_tv/).

---

**Smart TV** puts a 10-foot home screen in a browser: immersive rows, apps, search, a list, and a one-minute preview. Arrow keys, a gamepad, a TV remote, or the pad in the corner move the focus.

A television gets Google TV from a Google TV Streamer on HDMI, or from a set that already includes Google TV. This repository is the launcher you can open and try.

---

## Why Smart TV

- **Feels like a current TV home screen.** Artwork fills the screen and follows focus, the featured title rotates, and rows keep their place. Scrolling back to the top brings the navigation bar with it.
- **Moves like a remote expects.** Focus goes to the nearest item in each direction, each row remembers where you were, and the edge of a row bounces. Hold OK for options.
- **Takes any input.** Keyboard, the on-screen pad, a gamepad, LG and Samsung TV remotes, a mouse, touch, and the browser Back button.
- **Searches from the couch.** An on-screen keyboard, genre shortcuts, live results, and voice where the browser supports it.
- **Plays a preview properly.** Controls hide on their own, skip 10 seconds, captions, and an Up next countdown.
- **Respects the room.** Same layout at 1080p and 4K, reduce-motion and larger-text settings, high-contrast focus, and an ambient screen when idle.
- **Plays your own media.** My PC browses this computer's folders with the remote and plays videos, music, and photos, with resume, Next/Previous, and a slideshow.
- **Opens sites you choose.** Add a web address or a PC program. Shortcuts you already made in Chrome show up with their own icons. Smart TV does not ship tiles for other companies' services.
- **Keeps apps in the window.** On Windows, a site opens inside Smart TV. Up to four stay loaded. An open app shows an Open mark. Home pauses playback.
- **Asks before you leave.** Back goes back inside the app. Hold Back, or the Home key, asks whether to stay or go Home. Home then zooms and fades in. Switching HDMI, the browser, or the desktop still uses the source line.
- **Has profiles.** The circle by the clock opens a profile. Each profile keeps its own My List and sample Continue watching. Add, rename, switch, or remove one.
- **Shows what you opened, until you quit.** A page with a title, and a picture when the site provides one, sits at the front of Continue watching. Close the app and that row is dropped.
- **Feels like a TV.** A volume panel when the volume changes, your desktop wallpaper behind Home, and a Source button for the browser or the desktop.
- **Is yours to arrange.** Move, rename, hide, or remove any app. Keep titles, links, and files in My List in your own order.
- **Sets itself up like a new TV.** First-run setup picks a Minimal or Busy Home, your apps, the weather, and a wallpaper. The weather lookup is not written down.
- **Remembers your sign-ins.** Sign in to Google or a streaming service once inside the Windows app and it stays signed in. Settings → TV mode → Sign out of all apps clears them. The public page stores nothing. My List and the launcher's own settings stay in this browser.

---

## What it does

| Piece | What you get |
| --- | --- |
| Home | Featured title, Continue watching, your apps, Top 10, live, movies, series, and My List. Minimal Home is a shorter set of rows. |
| Profiles | A letter by the clock. Switch people. Each one has a separate My List. |
| Opened pages | Title and picture for a page you opened this session. OK opens it again. Hold OK to remove it. |
| Apps | Sites and programs you add, plus Chrome shortcuts already on this PC. Hold OK to move, rename, or remove. |
| Inside the TV | The Windows app draws the site in the same window. Back, hold Back, and a zoom fade back to Home. |
| Source | HDMI 1 is Smart TV, HDMI 2 is a browser, HDMI 3 is the desktop. Those changes use the source screen. |
| My PC | Folders, video, music, photos, resume, and a slideshow. |
| Search | On-screen keyboard, genres, and voice where the browser allows it. |
| Weather | Forecast for this computer while the app is open. The place is not saved. |
| Settings | Home style, motion, wallpaper, sound, playback, the remote, and TV mode. |

---

## Windows app (Electron)

On the `electron` branch, Smart TV is also a Windows app that takes over the PC like an Android TV box: full screen, optional start with Windows, and streaming in a Chrome kiosk window that the remote's Back closes.

```bash
npm install
npm start
```

See [docs/electron.md](docs/electron.md).

---

## Quick start

**Requirements:** a current browser and Python 3 (standard library only).

```bash
py server.py
```

That starts the companion on `http://localhost:8787` and opens it. The companion is what lets the launcher see this PC: My PC files, your Chrome shortcuts, the desktop wallpaper, system volume, and source switching. It only listens on this computer unless you pass `--lan`.

| Goal | Command |
| --- | --- |
| Full launcher on this PC | `py server.py` → `http://localhost:8787` |
| Also reach it from a TV on your network | `py server.py --lan`, then open the printed address with its key |
| Demo only, no PC features | Double-click `index.html` |

---

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Launcher page |
| `electron/` | Windows app: kiosk window, API, volume, Chrome launching |
| `package.json` | Electron scripts and installer settings |
| `server.py` | Companion: files and streaming, Chrome shortcuts, wallpaper, system volume, sources |
| `css/tv.css` | 10-foot layout, glass materials, focus motion |
| `css/media.css` | Media player, My PC, wallpaper, volume panel, source bar |
| `css/home.css` | Home styles, setup, app and list editing, on-screen keyboard, weather |
| `js/tv.js` | Screens, spatial focus, input, media player, apps, sources |
| `docs/guide.md` | Keys, network URL, Google TV hardware |
| `assets/logo.svg` | Mark |
| `assets/icon.ico` | Window, taskbar, and installer icon |

---

## Documentation map

| Doc | Purpose |
| --- | --- |
| [docs/electron.md](docs/electron.md) | The Windows app: running it, TV mode, streaming, remotes |
| [docs/index.html](docs/index.html) | The public page |
| [docs/guide.md](docs/guide.md) | Run it, drive it, and put Google TV on a television |

---

## License

MIT. Copyright 2026 Khotso Tsoaela.
