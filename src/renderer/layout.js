// Fit the 400x300 scene into the window at the largest whole number of *device* pixels per scene pixel,
// so pixels stay crisp under Windows display scaling. Returns CSS-pixel size and offsets.
export const SCENE_W = 400, SCENE_H = 300;

export function fitScene(cssW, cssH, dpr = 1) {
  const scale = Math.max(1, Math.floor(Math.min((cssW * dpr) / SCENE_W, (cssH * dpr) / SCENE_H)));
  const devW = SCENE_W * scale, devH = SCENE_H * scale;
  const left = Math.max(0, Math.floor((cssW * dpr - devW) / 2)) / dpr;
  const top = Math.max(0, Math.floor((cssH * dpr - devH) / 2)) / dpr;
  return { scale, cssW: devW / dpr, cssH: devH / dpr, left, top };
}
