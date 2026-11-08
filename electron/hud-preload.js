"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("hudHost", {
  choose(index) {
    ipcRenderer.send("hud-choose", index);
  }
});
