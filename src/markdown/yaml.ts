// Minimal YAML parser for frontmatter
// 단순한 v3 frontmatter 형식만 지원: key: value, key: [v1, v2], nested 1-level
// Phase 13 dependency 줄이기 위해 자체 구현 (js-yaml 의존성 회피)

export function parse(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split(/\r?\n/);
  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;

    // Array continuation: "  - item"
    const arrayMatch = line.match(/^\s+-\s+(.*)$/);
    if (arrayMatch && currentArray) {
      currentArray.push(stripQuotes(arrayMatch[1]));
      continue;
    }

    // Key: value
    const kvMatch = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      const [, key, val] = kvMatch;
      currentKey = key;
      const trimmed = val.trim();

      if (trimmed === '') {
        // Array follows
        currentArray = [];
        result[key] = currentArray;
      } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        // Inline array
        result[key] = trimmed
          .slice(1, -1)
          .split(',')
          .map((s) => stripQuotes(s.trim()))
          .filter((s) => s.length > 0);
        currentArray = null;
      } else {
        const stripped = stripQuotes(trimmed);
        result[key] = coerce(stripped);
        currentArray = null;
      }
    }
  }

  return result;
}

function stripQuotes(s: string): string {
  if (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return s.slice(1, -1);
    }
  }
  return s;
}

function coerce(s: string): unknown {
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~' || s === '') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  return s;
}
