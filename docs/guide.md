# Guide

**Smart TV** is a browser launcher with a remote, shelves, a list, and a one-minute preview. A television gets Google TV from a streaming device or from a set that already includes it.

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
| Arrow keys | Move focus |
| Enter or Space | Press the focused control |
| Esc | Go back |
| Backspace | Go back. In search, it deletes text first |
| F | Fullscreen |
| On-screen pad | Up, down, left, right, OK, Back, and Home |

## Screens

| Screen | What you get |
| --- | --- |
| Home | Featured title, Continue watching, Apps, and shelves |
| Apps | Cinema, Series, Live Desk, Spotlight, Your List, Weather |
| Your list | Titles you saved |
| Search | Titles, genres, and app names |
| Settings | Google TV Streamer, a set that already has Google TV, and this launcher |
| Details | Play, add to your list, or go back |
| Preview | A 60-second color preview with a timer |

Weather is a sample panel. The preview is a timer on a title card. Saved titles and preview progress stay in this browser. **Reset demo data** on Settings restores the sample Continue watching row and clears Your list.

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
