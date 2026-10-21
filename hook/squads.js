// Squad files: one JSON per reels-squad launch, written by launch.ps1, claimed by the manager's hook.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function squadsDir() {
  if (process.env.PIXEL_OFFICE_SQUADS_DIR) return process.env.PIXEL_OFFICE_SQUADS_DIR;
  const base = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  return path.join(base, 'PixelOffice', 'squads');
}

export function writeSquad(dir, squad) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${squad.squad}.json`), JSON.stringify(squad));
}

export function readSquads(dir) {
  let names;
  try { names = fs.readdirSync(dir); } catch { return []; }
  const out = [];
  for (const n of names) {
    if (!n.endsWith('.json')) continue;
    try { out.push(JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8').replace(/^﻿/, ''))); } catch { /* skip broken file */ }
  }
  return out.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function findSquad(dir, id) {
  return readSquads(dir).find((s) => s.squad === id) ?? null;
}

export function findByManagerSession(dir, sessionId) {
  return readSquads(dir).find((s) => s.managerSession === sessionId) ?? null;
}

// Give the newest unclaimed squad (created, or re-opened by launch.ps1 -Only, within maxAgeMs) to this manager session.
export function claimNewest(dir, sessionId, now, maxAgeMs = 120000) {
  const s = readSquads(dir).find((q) => !q.managerSession && now - (q.claimableAt ?? q.createdAt ?? 0) <= maxAgeMs);
  if (!s) return null;
  s.managerSession = sessionId;
  writeSquad(dir, s);
  return s;
}
