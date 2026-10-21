// Night lighting: banded, dithered brightness plus coloured tint from point lights. Emissive pixels stay as drawn.
import { W, H, bay } from './gfx.js';

export const AMBIENT = 0.52;

// dim: 1 = lamps on, 0 = lamps off (house closed).
export function applyLight(g, lights, dim = 1) {
  const { buf, emis } = g;
  for (let y = 56; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (emis[i]) continue;
    let I = AMBIENT * (0.75 + 0.25 * dim), tr = 0, tg = 0, tb = 0;
    for (const l of lights) {
      const dx = x - l.x, dy = (y - l.y) * 1.15, d = Math.sqrt(dx * dx + dy * dy);
      if (d < l.r) { const k = (1 - d / l.r) * l.s * dim; I += k; tr += l.c[0] * k; tg += l.c[1] * k; tb += l.c[2] * k; }
    }
    const q = Math.min(1.25, Math.floor(I * 5 + bay(x, y)) / 5);
    const j = i * 4;
    buf[j] = Math.min(255, buf[j] * q + tr * 0.24);
    buf[j + 1] = Math.min(255, buf[j + 1] * q + tg * 0.24);
    buf[j + 2] = Math.min(255, buf[j + 2] * q * 1.04 + tb * 0.24);
  }
  // Roof: moonlight only.
  for (let y = 30; y < 56; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (emis[i]) continue;
    const j = i * 4; buf[j] *= 0.62; buf[j + 1] *= 0.6; buf[j + 2] *= 0.8;
  }
}
