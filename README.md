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

**Smart TV** puts a 10-foot home screen in a browser: shelves, apps, search, a list, and a one-minute preview. Arrow keys and the pad in the corner move the focus.

A television gets Google TV from a Google TV Streamer on HDMI, or from a set that already includes Google TV. This repository is the launcher you can open and try.

---

## Why Smart TV

- **Shows a home screen** with a featured title and shelves you can move through.
- **Takes a remote** from the keyboard or from the pad on the page.
- **Keeps your list** and preview position in this browser.
- **Lists the hardware path** for a Google TV Streamer and for sets that ship with Google TV.

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
| `css/tv.css` | TV layout and focus ring |
| `js/tv.js` | Screens, remote, list, preview |
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
