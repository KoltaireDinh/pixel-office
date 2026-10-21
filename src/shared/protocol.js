// Shared vocabulary between the hook, the local server and the renderer.

export const ROLES = ['manager', 'researcher', 'prompt', 'coder', 'styler'];
export const CHILD_ROLES = ROLES.slice(1);

export const CHAR_NAMES = { manager: 'Sếp Bơ', researcher: 'Na', prompt: 'Mây', coder: 'Tí', styler: 'Hồng' };

export const EVENT_KINDS = ['squad_start', 'manager_join', 'session_start', 'prompt', 'tool', 'send', 'wait', 'stop', 'fail', 'session_end'];

export const DEFAULT_PORT = 47821;
export const HEAD_MAX = 60;

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit']);
const SHELL_TOOLS = new Set(['Bash', 'PowerShell']);
const READ_TOOLS = new Set(['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch']);
const AGENT_TOOLS = new Set(['Agent', 'Task']);

export function toolCategory(toolName, toolInput) {
  if (EDIT_TOOLS.has(toolName)) return 'edit';
  if (SHELL_TOOLS.has(toolName)) return /render|ffmpeg/i.test(toolInput?.command ?? '') ? 'render' : 'bash';
  if (READ_TOOLS.has(toolName)) return 'read';
  if (typeof toolName === 'string' && toolName.startsWith('mcp__claude-in-chrome__')) return 'browse';
  if (AGENT_TOOLS.has(toolName)) return 'agent';
  return 'other';
}

// Only the first line, and only when it is a TASK order or a status report: never free text.
export function extractHead(message) {
  if (typeof message !== 'string') return null;
  const first = message.split(/\r?\n/, 1)[0].trim();
  if (!/^(TASK\s+\S|\[(DONE|BLOCKED|FAIL)\])/.test(first)) return null;
  return first.slice(0, HEAD_MAX);
}

export function roleFromSessionName(name, managerName) {
  if (typeof name !== 'string') return null;
  if (managerName && name === managerName) return 'manager';
  const m = /^reels-(researcher|prompt|coder|styler)$/.exec(name);
  return m ? m[1] : null;
}
