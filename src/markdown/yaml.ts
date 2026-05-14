// Minimal YAML parser for frontmatter
// 단순한 frontmatter 형식만 지원: key: value, key: [v1, v2], nested 1-level
// Phase 13 dependency 줄이기 위해 자체 구현 (js-yaml 의존성 회피)
//
// Security (D1 fix — 4차 reviewer security):
//   - Object.create(null) → prototype pollution 차단
//   - __proto__·constructor·prototype key reject

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function parse(yaml: string): Record<string, unknown> {
  // D1: null prototype object — Object.prototype 오염 차단
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  const lines = yaml.split(/\r?\n/);
  let currentArray: string[] | null = null;
  let currentArrayKey: string | null = null;

  // R3 H-Round3-1: defensive copy — seal completed array so external mutation
  // cannot affect result and subsequent pushes cannot affect callers.
  const finalizeArray = (): void => {
    if (currentArrayKey !== null && currentArray !== null) {
      result[currentArrayKey] = currentArray.slice();
    }
    currentArray = null;
    currentArrayKey = null;
  };

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
      // Finalize any in-progress array before processing next key
      finalizeArray();

      const [, key, val] = kvMatch;
      // D1: reject dangerous keys (prototype pollution defense)
      if (DANGEROUS_KEYS.has(key)) continue;
      const trimmed = val.trim();

      if (trimmed === '') {
        // Array follows — accumulate items; result[key] replaced with slice in finalizeArray
        currentArray = [];
        currentArrayKey = key;
        result[key] = currentArray; // placeholder; replaced with defensive copy on finalize
      } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        // Inline array — use quote-aware splitter to handle ["a, b", c] correctly
        result[key] = splitInlineArray(trimmed.slice(1, -1)).filter((s) => s.length > 0);
      } else {
        const stripped = stripQuotes(trimmed);
        result[key] = coerce(stripped);
      }
    }
  }

  // Finalize trailing array (last key in document)
  finalizeArray();

  return result;
}

/**
 * Split an inline YAML array content (the part between `[` and `]`) by commas,
 * respecting quoted strings and nested brackets.
 * e.g. `"a, b", c` → ['a, b', 'c']
 */
function splitInlineArray(s: string): string[] {
  const result: string[] = [];
  let buf = '';
  let inQuote: '"' | "'" | null = null;
  let depth = 0; // bracket depth for nested [[..]]
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuote) {
      buf += c;
      if (c === inQuote && s[i - 1] !== '\\') inQuote = null;
    } else if (c === '"' || c === "'") {
      buf += c;
      inQuote = c as '"' | "'";
    } else if (c === '[') {
      depth++;
      buf += c;
    } else if (c === ']') {
      depth--;
      buf += c;
    } else if (c === ',' && depth === 0) {
      result.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) result.push(buf.trim());
  return result.map((item) => {
    // Strip surrounding quotes from each item
    if (
      (item.startsWith('"') && item.endsWith('"')) ||
      (item.startsWith("'") && item.endsWith("'"))
    ) {
      return item.slice(1, -1);
    }
    return item;
  });
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
