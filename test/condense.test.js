import test from 'node:test';
import assert from 'node:assert/strict';
import { condense } from '../hook/condense.js';

const ctx = { squad: 'sq-1', role: 'coder', managerName: 'mgr-1', now: 5 };

test('tool event keeps only category', () => {
  assert.deepEqual(
    condense({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'Edit', tool_input: { file_path: 'secret.txt' } }, ctx),
    { squad: 'sq-1', role: 'coder', kind: 'tool', cat: 'edit', to: null, head: null, session: 's', ts: 5 });
});

test('SendMessage becomes send with recipient role and filtered head', () => {
  const send = condense({ hook_event_name: 'PreToolUse', session_id: 's', tool_name: 'SendMessage',
    tool_input: { to: 'mgr-1', message: '[DONE] coder TASK C1 — ok\nbody' } }, ctx);
  assert.equal(send.kind, 'send');
  assert.equal(send.to, 'manager');
  assert.equal(send.head, '[DONE] coder TASK C1 — ok');
  assert.ok(!JSON.stringify(send).includes('body'));
});

test('waiting notifications and permission requests become wait', () => {
  assert.equal(condense({ hook_event_name: 'Notification', notification_type: 'permission_prompt' }, ctx).kind, 'wait');
  assert.equal(condense({ hook_event_name: 'Notification', notification_type: 'auth_success' }, ctx), null);
  assert.equal(condense({ hook_event_name: 'PermissionRequest' }, ctx).kind, 'wait');
});

test('lifecycle events map to kinds', () => {
  for (const [e, k] of [['SessionStart', 'session_start'], ['UserPromptSubmit', 'prompt'], ['Stop', 'stop'],
    ['StopFailure', 'fail'], ['PostToolUseFailure', 'fail'], ['SessionEnd', 'session_end']])
    assert.equal(condense({ hook_event_name: e }, ctx).kind, k);
});

test('irrelevant or broken input is dropped', () => {
  assert.equal(condense({ hook_event_name: 'PostToolUse', tool_name: 'Edit' }, ctx), null);
  assert.equal(condense(null, ctx), null);
  assert.equal(condense({ hook_event_name: 'Nope' }, ctx), null);
  assert.equal(condense({ hook_event_name: 'Stop' }, { ...ctx, squad: null }), null);
});
