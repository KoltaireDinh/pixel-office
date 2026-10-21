// Night lighting: banded, dithered brightness plus coloured tint from point lights. Emissive pixels stay as drawn.
import { bay } from './gfx.js';

export const AMBIENT = 0.5;

// dim: 1 = lamps on, 0 = lamps off (house closed).
export function applyLight(g, lights, dim = 1) {
  const { buf, emis, W, H } = g;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (emis[i]) continue;
    let I = AMBIENT * (0.7 + 0.3 * dim), tr = 0, tg = 0, tb = 0;
    for (const l of lights) {
      const dx = x - l.x, dy = y - l.y;
      if (dx > l.r || dx < -l.r || dy > l.r || dy < -l.r) continue;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < l.r) { const k = (1 - d / l.r) * l.s * dim; I += k; tr += l.c[0] * k; tg += l.c[1] * k; tb += l.c[2] * k; }
    }
    const q = Math.min(1.2, Math.floor(I * 5 + bay(x, y)) / 5);
    const j = i * 4;
    buf[j] = Math.min(255, buf[j] * q + tr * 0.16);
    buf[j + 1] = Math.min(255, buf[j + 1] * q + tg * 0.16);
    buf[j + 2] = Math.min(255, buf[j + 2] * q * 1.05 + tb * 0.16);
  }
}
