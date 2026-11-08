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

---

**Smart TV** puts a 10-foot home screen in a browser: immersive rows, apps, search, a list, and a one-minute preview. Arrow keys, a gamepad, a TV remote, or the pad in the corner move the focus.

A television gets Google TV from a Google TV Streamer on HDMI, or from a set that already includes Google TV. This repository is the launcher you can open and try.

---

## Why Smart TV

- **Feels like a current TV home screen.** Artwork fills the screen and follows focus, the featured title rotates, and rows keep their place.
- **Moves like a remote expects.** Focus goes to the nearest item in each direction, each row remembers where you were, and the edge of a row bounces. Hold OK for options.
- **Takes any input.** Keyboard, the on-screen pad, a gamepad, LG and Samsung TV remotes, a mouse, touch, and the browser Back button.
- **Searches from the couch.** An on-screen keyboard, genre shortcuts, live results, and voice where the browser supports it.
- **Plays a preview properly.** Controls hide on their own, skip 10 seconds, captions, and an Up next countdown.
- **Respects the room.** Same layout at 1080p and 4K, reduce-motion and larger-text settings, high-contrast focus, and an ambient screen when idle.
- **Plays your own media.** My PC browses this computer's folders with the remote and plays videos, music, and photos, with resume, Next/Previous, and a slideshow.
- **Opens your streaming apps.** Netflix, SABC Plus, DStv, Spotify, and YouTube Music, plus every shortcut you made in Chrome, with its own icon.
- **Feels like a TV.** A volume panel when the volume changes in full screen, your desktop wallpaper behind Home, and a Source button that switches to the browser or the desktop like changing HDMI input.
- **Is yours to arrange.** Add websites and PC programs as apps; move, rename, hide, or remove any app; keep titles, links, and files in My List in your own order.
- **Sets itself up like a new TV.** First-run setup picks a Minimal or Busy Home, your apps, the weather for this computer's location, and a wallpaper.
- **Keeps your list,** progress, and settings in this browser.

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
| `server.py` | Companion: files and streaming, Chrome shortcuts, wallpaper, system volume, sources |
| `css/tv.css` | 10-foot layout, glass materials, focus motion |
| `css/media.css` | Media player, My PC, wallpaper, volume panel, source bar |
| `css/home.css` | Home styles, setup, app and list editing, on-screen keyboard, weather |
| `js/tv.js` | Screens, spatial focus, input, media player, apps, sources |
| `docs/guide.md` | Keys, network URL, Google TV hardware |
| `assets/logo.svg` | Mark |

---

## Documentation map

| Doc | Purpose |
| --- | --- |
| [docs/guide.md](docs/guide.md) | Run it, drive it, and put Google TV on a television |

---

## License

MIT. Copyright 2026 Khotso Tsoaela.
