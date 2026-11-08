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
- **Keeps your list,** progress, and settings in this browser.

---

## Quick start

**Requirements:** a current browser. Python 3 is only needed to serve the folder.

```bash
py -m http.server 8787
```

| Goal | Command |
| --- | --- |
| Open on this computer | Double-click `index.html` |
| Serve the folder | `py -m http.server 8787` → `http://localhost:8787` |

---

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Launcher page |
| `css/tv.css` | 10-foot layout, glass materials, focus motion |
| `js/tv.js` | Screens, spatial focus, input, list, preview |
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
