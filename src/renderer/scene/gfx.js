// Pixel buffer for a scene: background pixels, a sprite layer with soft outlines, emissive mask.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const cache = {};

export function rgb(h) {
  if (cache[h]) return cache[h];
  const n = parseInt(h.slice(1), 16);
  return (cache[h] = [n >> 16, (n >> 8) & 255, n & 255]);
}

export function dk(h, k) {
  return '#' + rgb(h).map((v) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')).join('');
}

export const bay = (x, y) => BAYER[(x & 3) + ((y & 3) << 2)] / 16;

export function createGfx(ctx, W, H) {
  const img = ctx.createImageData(W, H), buf = img.data;
  const emis = new Uint8Array(W * H);
  const lay = new Array(W * H), layE = new Uint8Array(W * H);

  function px(x, y, h, e) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = y * W + x, c = rgb(h);
    buf[i * 4] = c[0]; buf[i * 4 + 1] = c[1]; buf[i * 4 + 2] = c[2]; buf[i * 4 + 3] = 255;
    emis[i] = e ? 1 : 0;
  }
  function rect(x, y, w, h, c, e) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c, e); }
  // Sprite layer: everything that gets an outline (characters, furniture, props).
  function sp(x, y, w, h, c, e) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const X = Math.round(x) + i, Y = Math.round(y) + j;
      if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
      lay[Y * W + X] = c; layE[Y * W + X] = e ? 1 : 0;
    }
  }
  function clearLayer() { lay.fill(undefined); layE.fill(0); }
  // Outline = darker shade of the neighbouring sprite pixel, then composite the layer onto the background.
  function flushLayer() {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (lay[i]) continue;
      const n = (x > 0 && lay[i - 1]) || (x < W - 1 && lay[i + 1]) || (y > 0 && lay[i - W]) || (y < H - 1 && lay[i + W]);
      if (n) px(x, y, dk(n, 0.42));
    }
    for (let i = 0; i < W * H; i++) if (lay[i]) px(i % W, (i / W) | 0, lay[i], layE[i]);
  }
  function present() { ctx.putImageData(img, 0, 0); }
  // Snapshot / restore the background so static scenery is drawn once.
  function snapshot() { return { buf: new Uint8ClampedArray(buf), emis: new Uint8Array(emis) }; }
  function restore(s) { buf.set(s.buf); emis.set(s.emis); }

  return { W, H, buf, emis, px, rect, sp, clearLayer, flushLayer, present, snapshot, restore };
}
