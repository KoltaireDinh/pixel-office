import { toolCategory, extractHead, roleFromSessionName } from '../src/shared/protocol.js';

const WAIT_NOTIFICATIONS = new Set(['permission_prompt', 'idle_prompt', 'agent_needs_input', 'elicitation_dialog']);
const SIMPLE = { SessionStart: 'session_start', UserPromptSubmit: 'prompt', Stop: 'stop', StopFailure: 'fail',
  PostToolUseFailure: 'fail', SessionEnd: 'session_end', PermissionRequest: 'wait' };

// Reduce a raw Claude Code hook payload to a small event, or null when it is irrelevant.
export function condense(input, { squad, role, managerName, now }) {
  if (!input || typeof input !== 'object' || !squad || !role) return null;
  const base = { squad, role, kind: null, cat: null, to: null, head: null, session: input.session_id ?? null, ts: now };
  const ev = input.hook_event_name;
  if (SIMPLE[ev]) return { ...base, kind: SIMPLE[ev] };
  if (ev === 'Notification') return WAIT_NOTIFICATIONS.has(input.notification_type) ? { ...base, kind: 'wait' } : null;
  if (ev !== 'PreToolUse') return null;
  if (input.tool_name === 'SendMessage') {
    const ti = input.tool_input ?? {};
    return { ...base, kind: 'send', to: roleFromSessionName(ti.to, managerName), head: extractHead(ti.message) };
  }
  return { ...base, kind: 'tool', cat: toolCategory(input.tool_name, input.tool_input) };
}
