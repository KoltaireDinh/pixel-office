// Renderer entry. ?debug=all cycles every character through every action (for visual checks).
import { createScene, ORDER } from './scene/draw.js';

const params = new URLSearchParams(location.search);
const scale = Number(params.get('scale')) === 3 ? 3 : 2;
document.documentElement.style.setProperty('--s', scale);

const scene = createScene(document.getElementById('scene'));
const DEBUG_ACTIONS = ['work', 'type_fast', 'read', 'browse', 'render', 'phone', 'confused', 'rest', 'sleep', 'alert', 'walk', 'enter', 'leave', 'absent'];
const DEBUG_TARGET = { manager: 'coder', prompt: 'manager', researcher: 'styler', coder: 'manager', styler: 'prompt' };

function debugChars(now) {
  const chars = {};
  const slot = Math.floor(now / 3000);
  ORDER.forEach((role, i) => {
    const action = DEBUG_ACTIONS[(slot + i * 3) % DEBUG_ACTIONS.length];
    const data = action === 'walk' ? { to: DEBUG_TARGET[role], head: i % 2 ? '[BLOCKED] x' : 'TASK C1', ms: 3000 } : null;
    chars[role] = { action, since: slot * 3000, data };
  });
  return chars;
}

let last = -1;
function frame(ms) {
  const f = Math.floor(ms / 1000 * 6);
  if (f !== last) {
    last = f;
    if (params.get('debug') === 'all') scene.render(debugChars(ms), f, ms);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
