# Guide

**Smart TV** is a browser launcher with a remote, an immersive home screen, search, a list, and a one-minute preview. A television gets Google TV from a streaming device or from a set that already includes it.

## Run it

**Requirements:** a current browser. Python 3 is only for a network address.

Open `index.html` on this computer.

Serve the folder when a TV on the same network should open it:

```bash
py -m http.server 8787
```

On this computer that address is `http://localhost:8787`. On the TV, use this computer's IPv4 address from `ipconfig`, then open `http://<IPv4 Address>:8787`. Press `F` for fullscreen.

| Goal | Command |
| --- | --- |
| Open on this computer | Double-click `index.html` |
| Serve the folder | `py -m http.server 8787` → `http://localhost:8787` |
| Find the address a TV can open | `ipconfig` |

## Keys

| Key | Action |
| --- | --- |
| Arrow keys | Move focus. Focus goes to the nearest item in that direction, and each row remembers where you were |
| Enter | Select. Hold it for options (play from start, My List, remove from Continue watching) |
| Esc or Backspace | Go back. On Home, Back returns to the top |
| M | Options for the focused title |
| / | Search |
| F | Fullscreen |
| K, J, L | In the player: play or pause, back 10 s, forward 10 s |
| On-screen remote | The round button in the corner opens a pad with arrows, OK, Back, Home, Options, and Play/Pause |
| Gamepad | D-pad or left stick moves, A selects, B goes back, Y opens options, X plays or pauses |
| TV remote | Back and the media keys work in LG webOS and Samsung Tizen browsers |
| Mouse | Pointing focuses a tile and tilts it. Right-click opens options |

The browser Back button and the Android back gesture also go back one screen.

## Screens

| Screen | What you get |
| --- | --- |
| Home | A featured title that rotates every few seconds (left and right switch it), then Continue watching, Top 10, apps, Live now, a "Because you watched" row, Movies, Series, and From My List. The artwork behind the screen follows the focused tile, and a panel at the top describes it |
| Apps | Cinema, Series, Live Desk, Spotlight, My List, Weather |
| My List | Titles you saved |
| Search | An on-screen keyboard, genre shortcuts, and live results. A physical keyboard types too. The microphone key uses the browser's speech recognition where it exists |
| Settings | Display and motion, sound, playback, remote and keys, Get Google TV, and reset |
| Details | Resume, play from start, My List, episodes for series, and More like this |
| Preview | A 60-second preview. The controls hide after 4 seconds; any key brings them back. Left and right skip 10 seconds. Captions and Up next are optional |
| Ambient | After two minutes idle, slow artwork and the time. Any key returns |

Weather is a sample panel. The preview is a timer on generated artwork. Saved titles, preview progress, and settings stay in this browser. **Reset demo data** under Settings → About & reset restores the sample Continue watching row and clears My List.

### Settings

| Setting | Default | Effect |
| --- | --- | --- |
| Reduce motion | Off | Turns off zoom, parallax, and slide transitions. The system setting also applies |
| Larger text | Off | Raises type and tiles by about 12 percent |
| Ambient mode | On | Artwork and the time after two minutes idle |
| Navigation sounds | Off | A soft tick on move and a tone on select |
| Autoplay next | On | An 8-second countdown to the next title when a preview ends |
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
