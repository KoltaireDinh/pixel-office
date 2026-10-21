import test from 'node:test';
import assert from 'node:assert/strict';
import { toolCategory, extractHead, roleFromSessionName, CHAR_NAMES, ROLES } from '../src/shared/protocol.js';

test('roles and character names', () => {
  assert.deepEqual(ROLES, ['manager', 'researcher', 'prompt', 'coder', 'styler']);
  assert.deepEqual(CHAR_NAMES, { manager: 'Sếp Bơ', researcher: 'Na', prompt: 'Mây', coder: 'Tí', styler: 'Hồng' });
});

test('toolCategory', () => {
  assert.equal(toolCategory('Edit', {}), 'edit');
  assert.equal(toolCategory('Write', {}), 'edit');
  assert.equal(toolCategory('Bash', { command: 'node render.mjs out' }), 'render');
  assert.equal(toolCategory('PowerShell', { command: 'ffmpeg -i a.mp4' }), 'render');
  assert.equal(toolCategory('Bash', { command: 'ls' }), 'bash');
  assert.equal(toolCategory('Grep', {}), 'read');
  assert.equal(toolCategory('WebSearch', {}), 'read');
  assert.equal(toolCategory('mcp__claude-in-chrome__navigate', {}), 'browse');
  assert.equal(toolCategory('Agent', {}), 'agent');
  assert.equal(toolCategory('Task', {}), 'agent');
  assert.equal(toolCategory('Weird', undefined), 'other');
});

test('extractHead', () => {
  assert.equal(extractHead('TASK C1: dựng video abc\nchi tiết...'), 'TASK C1: dựng video abc');
  assert.equal(extractHead('[BLOCKED] coder TASK C1 — thiếu file'), '[BLOCKED] coder TASK C1 — thiếu file');
  assert.equal(extractHead('xin chào, nội dung riêng tư'), null);
  assert.equal(extractHead('TASK ' + 'x'.repeat(100)).length, 60);
  assert.equal(extractHead(undefined), null);
});

test('roleFromSessionName', () => {
  assert.equal(roleFromSessionName('reels-coder', 'mgr-1'), 'coder');
  assert.equal(roleFromSessionName('mgr-1', 'mgr-1'), 'manager');
  assert.equal(roleFromSessionName('someone', 'mgr-1'), null);
});
