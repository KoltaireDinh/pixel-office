// Electron shell: one always-on-top frameless window showing the pixel house, plus a tray icon.
import { app, BrowserWindow, Tray, Menu, nativeImage, dialog, screen } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';
import { createRegistry } from './houses.js';
import { DEFAULT_PORT } from '../shared/protocol.js';

const W = 128, H = 224;
const staticDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'renderer');
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
  const scale = prefs.scale === 3 ? 3 : 2;
  const opts = { width: W * scale, height: H * scale, frame: false, transparent: true, alwaysOnTop: true, resizable: false,
    hasShadow: false, backgroundColor: '#00000000', title: 'Pixel Office', skipTaskbar: false, show: false };
  if (Number.isFinite(prefs.x) && Number.isFinite(prefs.y) && onScreen(prefs.x, prefs.y)) Object.assign(opts, { x: prefs.x, y: prefs.y });
  win = new BrowserWindow(opts);
  win.setAlwaysOnTop(true, 'floating');
  win.loadURL(`http://127.0.0.1:${port}/?scale=${scale}`);
  win.once('ready-to-show', () => win.showInactive());
  let moveTimer = null;
  win.on('move', () => {
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => { if (!win) return; const [x, y] = win.getPosition(); prefs = { ...prefs, x, y }; savePrefs(prefs); }, 300);
  });
  win.on('closed', () => { win = null; });
}

function setScale(scale) {
  prefs = { ...prefs, scale }; savePrefs(prefs);
  if (!win) return createWindow();
  win.setResizable(true); win.setSize(W * scale, H * scale); win.setResizable(false);
  win.loadURL(`http://127.0.0.1:${port}/?scale=${scale}`);
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
    tray = new Tray(trayIcon());
    tray.setToolTip('Pixel Office');
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Hiện / Ẩn', click: () => (win && win.isVisible() ? win.hide() : showWindow()) },
      { label: 'Phóng ×2', click: () => setScale(2) },
      { label: 'Phóng ×3', click: () => setScale(3) },
      { type: 'separator' },
      { label: 'Thoát', click: () => app.exit(0) },
    ]));
    tray.on('click', showWindow);
    createWindow();
  });
}
