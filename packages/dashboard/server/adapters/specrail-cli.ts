// Runs the local plugin (packages/plugin) CLI's `specrail check --json-ish`
// as a subprocess. In M5 we use a lightweight invocation since the plugin's
// existing `check` command outputs human-readable text; we parse status lines.
import { execa } from 'execa';
import { resolve } from 'node:path';

export interface PluginSelfFinding {
  ruleId: string;
  severity: 'error' | 'warn' | 'info';
  message: string;
  phase?: number;
}

const STATUS_LINE_RE = /^([✓✗⚠])\s+([a-z][\w-]*):\s*(.+)$/;

export async function runPluginSelfCheck(projectRoot: string): Promise<PluginSelfFinding[]> {
  const pluginCli = resolve(projectRoot, '../plugin/src/bin/specrail.ts');
  // First try sibling plugin (monorepo dev mode). Fallback: assume PATH `specrail`.
  const tryCommands: Array<[string, string[]]> = [
    ['pnpm', ['exec', 'tsx', pluginCli, 'check']],
    ['specrail', ['check']],
  ];
  let stdout = '';
  for (const [cmd, args] of tryCommands) {
    try {
      const r = await execa(cmd, args, { cwd: projectRoot, reject: false, timeout: 30_000 });
      stdout = r.stdout;
      if (stdout) break;
    } catch {
      // try next
    }
  }
  if (!stdout) return [];
  return parseStatusLines(stdout);
}

function parseStatusLines(text: string): PluginSelfFinding[] {
  const out: PluginSelfFinding[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(STATUS_LINE_RE);
    if (!m) continue;
    const icon = m[1];
    if (icon === '✓') continue;
    out.push({
      ruleId: m[2] ?? 'plugin-rule',
      severity: icon === '✗' ? 'error' : 'warn',
      message: m[3] ?? '',
    });
  }
  return out;
}
