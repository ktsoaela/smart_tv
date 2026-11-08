"use strict";

// Start addresses of the web apps installed in Chrome or Edge (Install page as app, or
// Create shortcut). Chrome keeps them in each profile's "Sync Data/LevelDB" database under
// keys "web_apps-dt-<app id>". Most of that database is in Snappy-compressed table files,
// so a plain text search only finds a few apps; this reads the files properly.
//
// Read-only: files are opened for reading and nothing in the browser profile is changed.

const fs = require("fs");
const path = require("path");

const KEY = "web_apps-dt-";

/* ---------- Snappy (the block compression LevelDB uses) ---------- */

function snappy(src) {
  let pos = 0;
  let len = 0;
  for (let shift = 0; ; shift += 7) {
    const b = src[pos++];
    len |= (b & 0x7f) << shift;
    if (b < 0x80) break;
  }
  const out = Buffer.alloc(len);
  let o = 0;
  while (pos < src.length) {
    const tag = src[pos++];
    const kind = tag & 3;
    if (kind === 0) {
      let n = tag >> 2;
      if (n >= 60) {
        const bytes = n - 59;
        n = 0;
        for (let i = 0; i < bytes; i++) n |= src[pos++] << (8 * i);
      }
      n += 1;
      src.copy(out, o, pos, pos + n);
      pos += n;
      o += n;
      continue;
    }
    let n;
    let off;
    if (kind === 1) {
      n = 4 + ((tag >> 2) & 7);
      off = ((tag >> 5) << 8) | src[pos++];
    } else if (kind === 2) {
      n = (tag >> 2) + 1;
      off = src.readUInt16LE(pos);
      pos += 2;
    } else {
      n = (tag >> 2) + 1;
      off = src.readUInt32LE(pos);
      pos += 4;
    }
    if (!off || off > o) throw new Error("bad snappy offset");
    for (let i = 0; i < n; i++, o++) out[o] = out[o - off];
  }
  return out;
}

/* ---------- LevelDB table (.ldb) and log (.log) files ---------- */

function varint(buf, pos) {
  let value = 0;
  let shift = 0;
  for (;;) {
    const b = buf[pos++];
    value += (b & 0x7f) * 2 ** shift;
    if (b < 0x80) return [value, pos];
    shift += 7;
  }
}

function readBlock(file, offset, size) {
  const raw = file.subarray(offset, offset + size);
  const type = file[offset + size];
  return type === 1 ? snappy(raw) : raw;
}

function blockEntries(block, each) {
  const restarts = block.readUInt32LE(block.length - 4);
  const end = block.length - 4 - restarts * 4;
  let pos = 0;
  let key = Buffer.alloc(0);
  while (pos < end) {
    let shared;
    let unshared;
    let vlen;
    [shared, pos] = varint(block, pos);
    [unshared, pos] = varint(block, pos);
    [vlen, pos] = varint(block, pos);
    key = Buffer.concat([key.subarray(0, shared), block.subarray(pos, pos + unshared)]);
    pos += unshared;
    each(key, block.subarray(pos, pos + vlen));
    pos += vlen;
  }
}

function readTable(file, put) {
  if (file.length < 48) return;
  const footer = file.length - 48;
  let pos = footer;
  [, pos] = varint(file, pos); // metaindex offset
  [, pos] = varint(file, pos); // metaindex size
  let indexOff;
  let indexSize;
  [indexOff, pos] = varint(file, pos);
  [indexSize, pos] = varint(file, pos);
  const index = readBlock(file, indexOff, indexSize);
  blockEntries(index, (_key, handle) => {
    const [off, p] = varint(handle, 0);
    const [size] = varint(handle, p);
    let data;
    try {
      data = readBlock(file, off, size);
    } catch {
      return;
    }
    blockEntries(data, (ikey, value) => {
      if (ikey.length < 8) return;
      const user = ikey.subarray(0, ikey.length - 8).toString("latin1");
      if (!user.startsWith(KEY)) return;
      const tail = ikey.readBigUInt64LE(ikey.length - 8);
      put(user, Number(tail >> 8n), Number(tail & 0xffn) === 1 ? Buffer.from(value) : null);
    });
  });
}

function readLog(file, put) {
  const BLOCK = 32768;
  const records = [];
  let parts = [];
  for (let blockStart = 0; blockStart < file.length; blockStart += BLOCK) {
    let pos = blockStart;
    const blockEnd = Math.min(blockStart + BLOCK, file.length);
    while (pos + 7 <= blockEnd) {
      const len = file.readUInt16LE(pos + 4);
      const type = file[pos + 6];
      if (!type) break;
      const body = file.subarray(pos + 7, pos + 7 + len);
      pos += 7 + len;
      if (type === 1) records.push(body);
      else if (type === 2) parts = [body];
      else if (type === 3) parts.push(body);
      else if (type === 4) {
        parts.push(body);
        records.push(Buffer.concat(parts));
        parts = [];
      }
    }
  }
  for (const rec of records) {
    if (rec.length < 12) continue;
    let seq = Number(rec.readBigUInt64LE(0));
    const count = rec.readUInt32LE(8);
    let pos = 12;
    try {
      for (let i = 0; i < count && pos < rec.length; i++, seq++) {
        const tag = rec[pos++];
        let klen;
        [klen, pos] = varint(rec, pos);
        const key = rec.subarray(pos, pos + klen).toString("latin1");
        pos += klen;
        let value = null;
        if (tag === 1) {
          let vlen;
          [vlen, pos] = varint(rec, pos);
          value = Buffer.from(rec.subarray(pos, pos + vlen));
          pos += vlen;
        }
        if (key.startsWith(KEY)) put(key, seq, value);
      }
    } catch {
      /* a torn record at the end of the log */
    }
  }
}

/* ---------- The web app record ---------- */

// WebApp { sync_data (1): WebAppSpecifics { start_url (1): string, ... }, ... }
function protoField1(buf) {
  if (!buf || buf[0] !== 0x0a) return null;
  const [len, pos] = varint(buf, 1);
  return buf.subarray(pos, pos + len);
}

function startUrl(value) {
  const inner = protoField1(protoField1(value));
  const candidates = [];
  if (inner) candidates.push(inner.toString("utf8"));
  const m = /https?:\/\/[\x21-\x7e]+?(?=[^\x21-\x7e]|$)/.exec(value.toString("latin1"));
  if (m) candidates.push(m[0]);
  for (const text of candidates) {
    try {
      const u = new URL(text);
      if (/^https?:$/.test(u.protocol)) return u.href;
    } catch {
      /* try the next one */
    }
  }
  return "";
}

function profileApps(profileDir) {
  const dir = path.join(profileDir, "Sync Data", "LevelDB");
  let files;
  try {
    files = fs.readdirSync(dir).filter((f) => /\.(ldb|log)$/i.test(f));
  } catch {
    return new Map();
  }
  const latest = new Map(); // key -> { seq, value }
  const put = (key, seq, value) => {
    const prev = latest.get(key);
    if (!prev || seq >= prev.seq) latest.set(key, { seq, value });
  };
  for (const name of files) {
    let buf;
    try {
      buf = fs.readFileSync(path.join(dir, name));
    } catch {
      continue;
    }
    try {
      if (/\.ldb$/i.test(name)) readTable(buf, put);
      else readLog(buf, put);
    } catch {
      /* skip a file we can't parse */
    }
  }
  const urls = new Map();
  for (const [key, { value }] of latest) {
    if (!value) continue; // uninstalled
    const id = key.slice(KEY.length, KEY.length + 32);
    const url = startUrl(value);
    if (/^[a-p]{32}$/.test(id) && url) urls.set(id, url);
  }
  return urls;
}

// Map of "<profile directory>" -> Map(app id -> start address), for Chrome and Edge.
function installedWebApps() {
  const local = process.env.LOCALAPPDATA || "";
  const roots = [
    path.join(local, "Google", "Chrome", "User Data"),
    path.join(local, "Microsoft", "Edge", "User Data")
  ];
  const all = new Map();
  for (const root of roots) {
    let names = [];
    try {
      names = fs.readdirSync(root).filter((n) => n === "Default" || /^Profile \d+$/.test(n));
    } catch {
      continue;
    }
    for (const name of names) {
      const apps = profileApps(path.join(root, name));
      if (!apps.size) continue;
      const key = `${root}|${name}`;
      all.set(key, apps);
    }
  }
  return all;
}

// Start address for one app id, preferring the profile its shortcut names.
function lookup(all, id, { profile = "Default", edge = false } = {}) {
  const local = process.env.LOCALAPPDATA || "";
  const root = path.join(local, edge ? "Microsoft" : "Google", edge ? "Edge" : "Chrome", "User Data");
  const own = all.get(`${root}|${profile}`);
  if (own && own.has(id)) return own.get(id);
  for (const apps of all.values()) if (apps.has(id)) return apps.get(id);
  return "";
}

module.exports = { installedWebApps, lookup, snappy };
