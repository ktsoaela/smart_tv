"use strict";

// The only bridge between the TV page and Electron. The page gets two things:
// events from the TV shell (returned from an app, close requested) and a way to quit.
// Everything else goes through fetch("/api/...") like the browser version.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tvHost", {
  electron: true,
  onEvent(callback) {
    if (typeof callback !== "function") return;
    ipcRenderer.on("tv-event", (_event, payload) => callback(payload));
  },
  quit() {
    ipcRenderer.send("tv-quit");
  }
});
