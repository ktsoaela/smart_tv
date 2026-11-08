# Guide

**Smart TV** is a browser launcher with a remote, an immersive home screen, search, a list, and a one-minute preview. A television gets Google TV from a streaming device or from a set that already includes it.

## Run it

**Requirements:** a current browser and Python 3.

```bash
py server.py
```

It opens `http://localhost:8787`. Press `F` for full screen.

| Goal | Command |
| --- | --- |
| Full launcher on this PC | `py server.py` |
| Another port | `py server.py --port 9000` |
| Don't open a browser | `py server.py --no-open` |
| Reach it from a TV on your network | `py server.py --lan`, then open the printed `http://<IPv4>:8787/?key=…` on the TV |
| Demo only | Double-click `index.html` (no My PC, Chrome shortcuts, wallpaper, or system volume) |

### What the companion does, and doesn't

- It listens on `127.0.0.1` only, so nothing else on the network can reach it. `--lan` opens it to your network, and every request from another device needs the printed key. Anyone with that key can browse this PC's files, so stop the server when you're done.
- It answers only to `localhost` (or this PC's IP with `--lan`), and it refuses POST requests from other websites.
- Opening apps, switching sources, and showing the desktop only work from this PC, never from a TV on the network.
- File responses are sent as data with a sandbox policy, so a file can't run script in the launcher.

## Keys

| Key | Action |
| --- | --- |
| Arrow keys | Move focus. Focus goes to the nearest item in that direction, and each row remembers where you were |
| Enter | Select. Hold it for options (play from start, My List, remove from Continue watching) |
| Esc or Backspace | Go back. On Home, Back returns to the top |
| M | Options for the focused title, file, or photo |
| I | Source: Smart TV (HDMI 1), Browser (HDMI 2), Desktop (HDMI 3) |
| + / − / 0 | Volume up, down, mute. With the companion this is the Windows volume |
| Volume keys | Windows changes the volume as usual and the volume panel shows the new level |
| / | Search |
| F | Fullscreen |
| K, J, L | In the player: play or pause, back 10 s, forward 10 s |
| On-screen remote | The round button in the corner opens a pad with arrows, OK, Back, Home, Options, and Play/Pause |
| Gamepad | D-pad or left stick moves, A selects, B goes back, Y opens options, X plays or pauses, LB and RB change volume |
| TV remote | Back, volume, Source, and the media keys work in LG webOS and Samsung Tizen browsers |
| Mouse | Pointing focuses a tile and tilts it. Right-click opens options |

The browser Back button and the Android back gesture also go back one screen.

## Screens

| Screen | What you get |
| --- | --- |
| Home | A featured title that rotates every few seconds (left and right switch it), then Continue watching, Top 10, apps, Live now, a "Because you watched" row, Movies, Series, and From My List. The artwork behind the screen follows the focused tile, and a panel at the top describes it |
| Apps | Streaming (Netflix, SABC Plus, DStv, Spotify, YouTube Music), From Chrome (every shortcut you made in Chrome), and On this TV |
| My PC | Places (Home, Desktop, Downloads, Videos, Music, Pictures, Documents) and drives. Folders show videos, music, and photos; other files are counted but hidden |
| Media player | Video and music with resume, ±10 s, Next/Previous in the folder, and autoplay next. Photos with left/right browsing, a 5-second slideshow, and Set as wallpaper |
| My List | Titles you saved |
| Search | An on-screen keyboard, genre shortcuts, and live results. A physical keyboard types too. The microphone key uses the browser's speech recognition where it exists |
| Settings | Display and motion, wallpaper, sound, playback, remote and keys, Get Google TV, and about (companion status, refresh Chrome shortcuts, reset) |
| Details | Resume, play from start, My List, episodes for series, and More like this |
| Preview | A 60-second preview. The controls hide after 4 seconds; any key brings them back. Left and right skip 10 seconds. Captions and Up next are optional |
| Ambient | After two minutes idle, slow artwork and the time. Any key returns |

Weather is a sample panel. The preview is a timer on generated artwork. Saved titles, preview progress, and settings stay in this browser. **Reset demo data** under Settings → About & reset restores the sample Continue watching row and clears My List.

### Apps and Chrome shortcuts

Streaming tiles open the service in Chrome, in its own full-screen app window. Alt+F4 closes it and brings you back. If you already made a Chrome shortcut with the same name (Netflix, for example), the tile opens your shortcut instead, so you stay signed in.

To add any site: in Chrome, open it, then ⋮ → **Cast, save, and share** → **Create shortcut** (tick *Open as window*) or **Install page as app**. Then in Smart TV choose Settings → About & reset → **Look for new Chrome shortcuts**. Chrome and Edge shortcuts on the desktop and in the Start menu both count.

### Source

Press `I`, the Source button at the top right, or Source on the on-screen remote. The source bar lists HDMI 1 Smart TV, HDMI 2 Browser (a new Chrome window), and HDMI 3 Desktop (shows the Windows desktop). Switching shows a TV-style signal screen. When you come back to the Smart TV window, it shows HDMI 1 again, and OK returns to full screen.

### Wallpaper

Settings → Wallpaper: your **desktop wallpaper** (the default), **an image you choose**, a **photo from My PC** (hold OK on a photo → Set as wallpaper), or **title artwork** that follows focus.

### Settings

| Setting | Default | Effect |
| --- | --- | --- |
| Reduce motion | Off | Turns off zoom, parallax, and slide transitions. The system setting also applies |
| Larger text | Off | Raises type and tiles by about 12 percent |
| Ambient mode | On | Artwork and the time after two minutes idle |
| Wallpaper | Desktop | What's behind Home, Apps, My PC, and Settings |
| Navigation sounds | Off | A soft tick on move and a tone on select |
| Autoplay next | On | Next title after a preview, and the next file in the folder in My PC |
| Captions | Off | Sample captions in the player |
| On-screen remote | Closed | Keeps the remote pad open |

## Google TV on a television

Google's own setup notes: [Set up Google TV Streamer (4K) and Voice Remote](https://support.google.com/chromecast/answer/15157762?hl=en).

| Path | What you use |
| --- | --- |
| Google TV Streamer | HDMI port, power, Wi-Fi or Ethernet, a Google account, and the voice remote. An HDMI cable is separate. Google recommends an Ultra High Speed HDMI 2.1 cable. |
| Chromecast with Google TV | The same HDMI setup if you already own one. |
| Built-in Google TV | A set that ships with it. Some Sony, TCL, Hisense, and Philips models do. Sign in with the remote from the box. |

Android TV is the platform. Google TV is the home screen on current devices.

Streamer setup, short form:

1. Plug the streamer into an HDMI port.
2. Switch the TV to that input.
3. Plug in the power supply from the box.
4. If the screen says to pair the remote, hold Back and Home until the remote light pulses.
5. Choose language and region, join the network, and sign in with a Google account.

You can do those steps in the Google Home app or with the remote on the TV.
