// Electron shell: one always-on-top, frameless, resizable 4:3 window showing the pixel house, plus a tray icon.
import { app, BrowserWindow, Tray, Menu, nativeImage, dialog, screen } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';
import { createRegistry } from './houses.js';
import { DEFAULT_PORT } from '../shared/protocol.js';
import { runtimeDir, settingsFile, hookCommand, syncRuntime, ensureHooks, uninstallHooks } from './install.js';

const W = 400, H = 300, DEFAULT_W = 800, DEFAULT_H = 600;
const here = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(here, '..', 'renderer');
const appRoot = path.resolve(here, '..', '..');
const port = Number(process.env.PIXEL_OFFICE_PORT) || DEFAULT_PORT;
let win = null, tray = null;

const prefsFile = () => path.join(app.getPath('userData'), 'window.json');
function loadPrefs() { try { return JSON.parse(fs.readFileSync(prefsFile(), 'utf8')); } catch { return {}; } }
function savePrefs(p) { try { fs.mkdirSync(path.dirname(prefsFile()), { recursive: true }); fs.writeFileSync(prefsFile(), JSON.stringify(p)); } catch { /* ignore */ } }
let prefs = {};

// Tiny pixel house drawn in code so the app ships without image assets.
function trayIcon() {
  const S = 16, buf = Buffer.alloc(S * S * 4);
  const put = (x, y, [r, g, b]) => { const i = (y * S + x) * 4; buf[i] = b; buf[i + 1] = g; buf[i + 2] = r; buf[i + 3] = 255; };
  for (let y = 1; y < 8; y++) for (let x = 8 - y; x < 8 + y; x++) put(x, y, [162, 74, 74]);
  for (let y = 8; y < 15; y++) for (let x = 3; x < 13; x++) put(x, y, [48, 40, 92]);
  for (let y = 9; y < 12; y++) for (let x = 5; x < 8; x++) put(x, y, [255, 216, 74]);
  for (let y = 11; y < 15; y++) for (let x = 9; x < 11; x++) put(x, y, [122, 74, 50]);
  return nativeImage.createFromBitmap(buf, { width: S, height: S });
}

function onScreen(x, y) {
  return screen.getAllDisplays().some(({ workArea: a }) => x >= a.x && y >= a.y && x < a.x + a.width - 40 && y < a.y + a.height - 40);
}

function createWindow() {
  const width = Number.isFinite(prefs.width) ? Math.max(W, prefs.width) : DEFAULT_W;
  const height = Number.isFinite(prefs.height) ? Math.max(H, prefs.height) : DEFAULT_H;
  // Not transparent: Windows only lets you drag-resize the edges of an opaque frameless window.
  const opts = { width, height, minWidth: W, minHeight: H, frame: false, transparent: false, alwaysOnTop: true, resizable: true,
    backgroundColor: '#0a0818', title: 'Pixel Office', skipTaskbar: false, show: false };
  if (Number.isFinite(prefs.x) && Number.isFinite(prefs.y) && onScreen(prefs.x, prefs.y)) Object.assign(opts, { x: prefs.x, y: prefs.y });
  win = new BrowserWindow(opts);
  win.setAspectRatio(W / H);
  win.setAlwaysOnTop(true, 'floating');
  win.loadURL(`http://127.0.0.1:${port}/`);
  win.once('ready-to-show', () => win.showInactive());
  let saveTimer = null;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { if (!win) return; const b = win.getBounds(); prefs = { ...prefs, x: b.x, y: b.y, width: b.width, height: b.height }; savePrefs(prefs); }, 300);
  };
  win.on('move', save);
  win.on('resize', save);
  win.on('closed', () => { win = null; });
}

function resetSize() {
  if (!win) return createWindow();
  win.setSize(DEFAULT_W, DEFAULT_H);
}

// Installed build: keep the hook scripts outside the bundle and Claude Code's settings pointing at them.
function installHooks() {
  try {
    syncRuntime(appRoot, runtimeDir(), process.execPath);
    if (ensureHooks(settingsFile(), hookCommand(runtimeDir())) === 'error') {
      dialog.showErrorBox('Pixel Office', `Không đọc được ${settingsFile()} nên chưa thêm hook. Sửa lỗi JSON trong file đó rồi mở lại app.`);
    }
  } catch (err) {
    dialog.showErrorBox('Pixel Office', `Không cài được hook: ${err.message}`);
  }
}

function showWindow() { if (!win) createWindow(); else { win.showInactive(); win.moveTop(); } }

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.on('window-all-closed', () => { /* keep running in the tray */ });
  app.whenReady().then(async () => {
    prefs = loadPrefs();
    try {
      await startServer({ port, staticDir, registry: createRegistry() });
    } catch (err) {
      dialog.showErrorBox('Pixel Office', `Không mở được cổng ${port} (${err.code ?? err.message}). Có thể một chương trình khác đang dùng cổng này.`);
      app.quit();
      return;
    }
    if (app.isPackaged) installHooks();
    tray = new Tray(trayIcon());
    tray.setToolTip('Pixel Office');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Hiện / Ẩn', click: () => (win && win.isVisible() ? win.hide() : showWindow()) },
      { label: 'Về 800×600', click: resetSize },
      ...(app.isPackaged ? [
        { label: 'Chạy cùng Windows', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin,
          click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
        { label: 'Gỡ hook Claude Code & thoát', click: () => { uninstallHooks(settingsFile()); app.exit(0); } },
      ] : []),
      { type: 'separator' },
      { label: 'Thoát', click: () => app.exit(0) },
    ]));
    tray.on('click', showWindow);
    createWindow();
  });
}
