"use strict";

// Windows system volume through Core Audio, via one long-lived PowerShell process.
// No native Node modules: PowerShell compiles a tiny C# interop class once, then answers
// one JSON line per request on stdin/stdout.

const { spawn } = require("child_process");

const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int RegisterControlChangeNotify(IntPtr p);
  int UnregisterControlChangeNotify(IntPtr p);
  int GetChannelCount(out int c);
  int SetMasterVolumeLevel(float level, Guid ctx);
  int SetMasterVolumeLevelScalar(float level, Guid ctx);
  int GetMasterVolumeLevel(out float level);
  int GetMasterVolumeLevelScalar(out float level);
  int SetChannelVolumeLevel(uint ch, float level, Guid ctx);
  int SetChannelVolumeLevelScalar(uint ch, float level, Guid ctx);
  int GetChannelVolumeLevel(uint ch, out float level);
  int GetChannelVolumeLevelScalar(uint ch, out float level);
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool mute, Guid ctx);
  int GetMute([MarshalAs(UnmanagedType.Bool)] out bool mute);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object endpoint);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumeratorCom { }

public static class SmartTvAudio {
  static IAudioEndpointVolume Endpoint() {
    var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorCom());
    IMMDevice device;
    Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out device));
    Guid iid = typeof(IAudioEndpointVolume).GUID;
    object o;
    Marshal.ThrowExceptionForHR(device.Activate(ref iid, 23, IntPtr.Zero, out o));
    return (IAudioEndpointVolume)o;
  }
  public static float GetLevel() { float v; Marshal.ThrowExceptionForHR(Endpoint().GetMasterVolumeLevelScalar(out v)); return v; }
  public static void SetLevel(float v) { Marshal.ThrowExceptionForHR(Endpoint().SetMasterVolumeLevelScalar(Math.Max(0f, Math.Min(1f, v)), Guid.Empty)); }
  public static bool GetMute() { bool m; Marshal.ThrowExceptionForHR(Endpoint().GetMute(out m)); return m; }
  public static void SetMute(bool m) { Marshal.ThrowExceptionForHR(Endpoint().SetMute(m, Guid.Empty)); }
}
'@
[Console]::Out.WriteLine('{"ready":true}')
[Console]::Out.Flush()
while ($true) {
  $line = [Console]::In.ReadLine()
  if ($line -eq $null) { break }
  $req = $null
  try {
    $req = $line | ConvertFrom-Json
    if ($req.level -ne $null) { [SmartTvAudio]::SetLevel([single]$req.level) }
    if ($req.mute -ne $null) { [SmartTvAudio]::SetMute([bool]$req.mute) }
    $out = @{ id = $req.id; level = [math]::Round([SmartTvAudio]::GetLevel(), 3); muted = [SmartTvAudio]::GetMute() } | ConvertTo-Json -Compress
  } catch {
    $out = @{ id = $(if ($req) { $req.id } else { 0 }); error = $_.Exception.Message } | ConvertTo-Json -Compress
  }
  [Console]::Out.WriteLine($out)
  [Console]::Out.Flush()
}
`;

class Audio {
  constructor() {
    this.ok = false;
    this.proc = null;
    this.pending = new Map();
    this.nextId = 1;
    this.buffer = "";
    this.ready = process.platform === "win32" ? this.start() : Promise.resolve(false);
  }

  start() {
    return new Promise((resolve) => {
      const encoded = Buffer.from(SCRIPT, "utf16le").toString("base64");
      const proc = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encoded], {
        windowsHide: true,
        stdio: ["pipe", "pipe", "ignore"]
      });
      this.proc = proc;
      const timer = setTimeout(() => resolve(false), 20000);
      proc.stdout.setEncoding("utf8");
      proc.stdout.on("data", (chunk) => {
        this.buffer += chunk;
        let nl;
        while ((nl = this.buffer.indexOf("\n")) >= 0) {
          const line = this.buffer.slice(0, nl).trim();
          this.buffer = this.buffer.slice(nl + 1);
          if (!line) continue;
          let msg;
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }
          if (msg.ready) {
            clearTimeout(timer);
            this.ok = true;
            resolve(true);
            continue;
          }
          const waiter = this.pending.get(msg.id);
          if (waiter) {
            this.pending.delete(msg.id);
            if (msg.error) waiter.reject(new Error(msg.error));
            else waiter.resolve({ level: msg.level, muted: !!msg.muted });
          }
        }
      });
      proc.on("exit", () => {
        this.ok = false;
        clearTimeout(timer);
        resolve(false);
        for (const waiter of this.pending.values()) waiter.reject(new Error("System volume stopped"));
        this.pending.clear();
      });
      proc.on("error", () => resolve(false));
    });
  }

  request(body) {
    if (!this.ok || !this.proc) return Promise.reject(new Error("System volume is not available"));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(`${JSON.stringify({ id, ...body })}\n`);
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error("System volume did not answer"));
      }, 5000);
    });
  }

  get() {
    return this.request({});
  }

  async set({ level, delta, mute } = {}) {
    let target = level;
    let unmute = mute;
    if (delta != null) {
      const now = await this.get();
      target = now.level + delta;
      if (delta > 0 && unmute == null) unmute = false;
    }
    const body = {};
    if (target != null) body.level = Math.max(0, Math.min(1, target));
    if (unmute != null) body.mute = !!unmute;
    return this.request(body);
  }

  stop() {
    if (this.proc) this.proc.kill();
  }
}

module.exports = { Audio };
