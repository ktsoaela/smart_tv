# Smart TV for Windows (Electron)

The `electron` branch turns Smart TV into a Windows app that takes over the PC like an Android TV box: full screen, no taskbar, remote-first, and optionally started with Windows. It's the same front end as the browser version (`index.html`, `css/`, `js/`). Electron's main process answers its `/api/*` calls, so there's no `server.py` to run.

## Run it

**Requirements:** Windows 10 or 11, Node.js 20 or newer, and Google Chrome (Microsoft Edge works as a fallback).

```bash
npm install
npm start          # full-screen TV mode
npm run dev        # in a normal window, F12 opens DevTools
```

If `npm install` finishes but `npm start` says Electron isn't installed, run `node node_modules/electron/install.js` once.

| Goal | Command |
| --- | --- |
| Full-screen TV | `npm start` |
| Windowed, for development | `npm run dev` |
| Installer (`dist/Smart TV Setup 13.0.0.exe`) | `npm run dist` |
| Single portable `.exe` | `npm run dist:portable` |

## Leaving the TV

| How | What happens |
| --- | --- |
| Settings → TV mode → **Exit to Windows** | Asks, then closes Smart TV |
| Alt+F4 | Asks first: *Exit to Windows?* |
| Ctrl+Shift+Q | Closes Smart TV right away, for when the remote is lost |
| Source (`I`) → Desktop or Browser | Smart TV minimises. Select it on the taskbar to come back to full screen |

## Settings → TV mode

| Setting | Default | Effect |
| --- | --- | --- |
| Full-screen TV mode | On | Kiosk window over the taskbar and desktop |
| Start with Windows | Off | Opens Smart TV when you sign in, using Windows' own startup list (no Startup-folder shortcut needed) |
| Streaming apps open in | Inside the TV | See below |

## How streaming apps open

### Inside the TV (default)

Apps open in the same full-screen window, as web views laid over Home, like switching the TV's input. There's no separate browser and no window flash.

- **Fast:** the first two apps on Home load quietly (muted) when the TV starts, so they open in about half a second. Up to four apps stay loaded; switching back to one is instant. Going Home pauses whatever was playing.
- **Remote:** Back (Esc, or the mouse's back button) goes back inside the app. On the app's first page, Back asks whether to leave. **Hold Back**, or the Home key, asks from anywhere. Stay keeps the app open. Go to Home returns to the TV with a zoom and fade. Volume keys show the TV's volume panel over the app. Ctrl+Shift+Q still exits.
- **Signing in:** apps inside the TV share one saved session (under `%APPDATA%`), so you sign in once (Google, Netflix, and so on) and stay signed in after Smart TV restarts. A sign-in page can still open in a small window above the app. Settings → TV mode → **Sign out of all apps** clears the session immediately.
- **Your Chrome apps** open inside too, when Chrome already recorded a start address. Any it can't read open through their Chrome shortcut.
- **Continue watching:** while Smart TV is open, a page with a title (and a picture, when the site provides one) is shown at the front of **Continue watching**. OK opens that page again. Hold OK to remove it. A site's own front page is skipped. Closing Smart TV drops that row. Night Market and Copper Line stay as sample titles.
- **Options per app:** hold OK on an app → **Close app** (frees memory) or **Open in Chrome instead**.

**Why it can't reuse your Chrome sign-ins:** Chrome encrypts its cookies with Windows app-bound encryption, so no other program, Electron included, can read them, and Chrome locks the profile while it's open. A separate sign-in inside the TV is the only way to keep apps inside.

### TV layouts and remote navigation

**One site that publishes a 10-foot layout opens that layout.** It only serves that layout to TV-like devices, so Smart TV presents that one site as a TV device. Sign in from the code shown on the TV. Back works as it does on a television. When that site offers to exit, Smart TV returns Home and keeps the site loaded. Hold OK on its tile → **Use the normal website** to open the ordinary page instead.

**Other sites keep their normal page.** Pretending to be a television usually gets the desktop site, the mobile site, or an unsupported-device page. Those sites open as themselves, with:

- **Remote navigation:** the arrow keys move a white focus ring between links and buttons, and OK selects. This is Chromium's built-in spatial navigation. Where nothing can take focus, the arrows scroll.
- **Display size:** hold OK on the app's tile → **Display size** cycles 100%, 125%, 150%, 175%. Bigger reads better from the sofa.
- Hidden scrollbars, for a cleaner picture.

### Protected video

Some sites use Widevine DRM, and standard Electron doesn't include it. Ordinary pages play as they are. For protected video, switch to castLabs' Widevine build of Electron:

```bash
npm install --save-dev --save-exact "https://github.com/castlabs/electron-releases#v45.2.1+wvcus"
node node_modules/electron/install.js
```

Some of those sites also require the app to be signed for Widevine VMP. castLabs signs it for free:

```bash
py -m pip install --upgrade castlabs-evs
py -m castlabs_evs.account signup          # once; confirm the email they send
py -m castlabs_evs.vmp sign-pkg node_modules/electron/dist
```

Run the last command again after each `npm install`. For an installer, also add `"electronDownload": { "version": "45.2.1+wvcus", "mirror": "https://github.com/castlabs/electron-releases/releases/download/v" }` to `build` in `package.json`, and sign the packed app the same way before you build the installer. Settings → TV mode says *Protected video is ready* when it works.

Until then, open those apps in Chrome: hold OK on the app → **Open in Chrome instead**, or set Streaming apps open in → Chrome.

### In Chrome (optional)

**Chrome, TV profile.** Chrome starts in kiosk mode with its own profile in `%APPDATA%\Smart TV\chrome-tv-profile`. Smart TV owns that one process, so Back (Esc) closes it and returns Home. It's slower to open than inside the TV.

**Chrome, your profile.** Opens the app in your everyday Chrome with the accounts you're already signed in to. That window belongs to your running Chrome, so Alt+F4 closes it and Home comes back.

### Why not the obvious shortcuts

- **`--user-data-dir` pointing at your real Chrome profile** doesn't work while Chrome is open: the profile is locked, the request is handed to the running Chrome, and `--kiosk` is ignored.
- **`taskkill /im chrome.exe`** closes every Chrome window you have, not just the TV app. Smart TV closes only the process tree it started.
- **`nodeIntegration: true`** would let any page in the window run code on your PC. The window uses `contextIsolation`, a sandbox, and a two-function preload bridge.
- **A global Esc shortcut all the time** would steal Esc from every app. Inside the TV, Back is read from the app's own key events. For the Chrome TV profile, Esc is registered only while that window is open.
- **A TV user agent for every app** doesn't unlock a 10-foot layout (only one site publishes one on the web), and it can get protected-video sites to refuse playback. Only that site gets one.
- **`overflow: hidden` on every page** would stop ordinary sites from scrolling. Only the scrollbars are hidden.
- **The `<webview>` tag** is discouraged by Electron. Apps use `WebContentsView`, which is sandboxed and isolated from the TV page.

## Using the TV's own remote

The PC sees the remote as keyboard keys. Smart TV listens for arrows, Enter (OK), Esc and Backspace (Back), Home, the media keys, and volume keys.

- **HDMI-CEC:** most PC graphics cards can't read CEC, the channel the TV uses to send remote presses down HDMI. A Pulse-Eight USB-CEC adapter sits between the PC and the TV and turns those presses into keyboard keys. Then the TV's own remote works with no line of sight to the PC.
- **Infrared:** a FLIRC USB receiver learns any IR remote and maps each button to a key. Map Back to Esc, OK to Enter, and the arrows to the arrow keys.
- **Bluetooth remotes and air mice** pair with Windows as keyboards and work as they are.

## Files

| Path | Purpose |
| --- | --- |
| `electron/main.js` | Kiosk window, `app://tv` scheme, Widevine check, Chrome options, sources, TV mode settings |
| `electron/api.js` | The `/api/*` endpoints: files with byte ranges, Chrome shortcuts, programs and icons, wallpaper, volume, launching |
| `electron/audio.js` | Windows system volume through a long-lived PowerShell process (no native modules) |
| `electron/apps.js` | Apps inside the TV: views, in-memory session, Back and Home, preloading, the panel over apps |
| `electron/hud.html` | The small panel shown over apps (hints, volume) |
| `electron/preload.js` | The page's only bridge: TV events and quit |
