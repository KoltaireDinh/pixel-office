import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeHooks, removeHooks, HOOK_EVENTS, TOOL_EVENTS } from '../scripts/setup.js';

const CMD = 'node "E:/aff/pixel-office/hook/hook.js"';
const existing = () => ({
  permissions: { defaultMode: 'auto' },
  hooks: {
    PreToolUse: [
      { hooks: [{ type: 'command', command: '"C:\\Users\\PC\\AppData\\Local\\AgentPet\\agentpet.exe" hook --agent claude' }] },
      { matcher: '*', hooks: [{ type: 'command', command: 'C:/Users/PC/.orca/agent-hooks/claude-hook.cmd || echo {}', timeout: 10 }] },
    ],
    Stop: [{ hooks: [{ type: 'command', command: 'C:/Users/PC/.orca/agent-hooks/claude-hook.cmd || echo {}', timeout: 10 }] }],
  },
  theme: 'dark-daltonized',
});

test('mergeHooks keeps existing AgentPet/Orca entries untouched', () => {
  const before = existing();
  const after = mergeHooks(existing(), CMD);
  assert.deepEqual(after.hooks.PreToolUse.slice(0, 2), before.hooks.PreToolUse);
  assert.deepEqual(after.hooks.Stop.slice(0, 1), before.hooks.Stop);
  assert.deepEqual(after.permissions, before.permissions);
  assert.equal(after.theme, 'dark-daltonized');
});

test('mergeHooks adds one async entry for all 10 events', () => {
  const after = mergeHooks(existing(), CMD);
  assert.equal(HOOK_EVENTS.length, 10);
  for (const ev of HOOK_EVENTS) {
    const mine = after.hooks[ev].filter((g) => g.hooks.some((h) => h.command === CMD));
    assert.equal(mine.length, 1, ev);
    assert.deepEqual(mine[0].hooks, [{ type: 'command', command: CMD, async: true, timeout: 5 }]);
    assert.equal(mine[0].matcher, TOOL_EVENTS.includes(ev) ? '*' : undefined, ev);
  }
});

test('mergeHooks is idempotent', () => {
  const a = mergeHooks(existing(), CMD);
  assert.deepEqual(mergeHooks(structuredClone(a), CMD), a);
});

test('mergeHooks works on settings without hooks', () => {
  const after = mergeHooks({}, CMD);
  assert.equal(Object.keys(after.hooks).length, 10);
});

test('removeHooks removes only pixel-office entries', () => {
  const before = existing();
  const after = removeHooks(mergeHooks(existing(), CMD));
  assert.deepEqual(after.hooks, before.hooks);
});
