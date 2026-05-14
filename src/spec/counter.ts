// F1.3 ID auto-generation — ADR-5 sequential counter
// Storage: .plan-pipeline-cache/id-counter.json (gitignore)
// Rebuild possible: max(used) + 1 (graceful)
// INV-1: Project 내 unique 보장

import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { SpecTier, formatSpecId, type SpecId } from './id.js';

interface CounterState {
  // tier "R" → { "1": 5 } means R5 last issued (key = phaseId)
  // tier "F" → { "1": 3, "2": 1 } means F1.3, F2.1 last issued (key = parent R index)
  // tier "S" → { "1.1": 2 } means S1.1.2 last issued (key = parent F = "{R}.{F}")
  R: Record<string, number>;
  F: Record<string, number>;
  S: Record<string, number>;
}

const EMPTY_STATE: CounterState = { R: {}, F: {}, S: {} };

export class IdCounter {
  // H9 fix (3차 reviewer code-reviewer): in-process mutex for concurrent next() calls.
  // INV-1 (unique IDs) guarantee — two concurrent await counter.next()이 같은 ID 발급하지 않게.
  private mutex: Promise<unknown> = Promise.resolve();

  private constructor(
    private state: CounterState,
    private readonly path: string,
  ) {}

  static async load(projectRoot: string): Promise<IdCounter> {
    const path = join(projectRoot, '.plan-pipeline-cache', 'id-counter.json');
    let raw: string | null;
    try {
      raw = await readFile(path, 'utf8');
    } catch {
      // File missing — fresh project, OK
      return new IdCounter(structuredClone(EMPTY_STATE), path);
    }
    // File exists but may be corrupt
    try {
      const parsed = JSON.parse(raw) as Partial<CounterState>;
      return new IdCounter(
        {
          R: parsed.R ?? {},
          F: parsed.F ?? {},
          S: parsed.S ?? {},
        },
        path,
      );
    } catch (e) {
      // R3 M-Round3-7: corrupt cache — backup + throw with clear message
      const backupPath = path + '.corrupt-' + Date.now();
      try {
        await rename(path, backupPath);
      } catch { /* best-effort */ }
      throw new Error(
        `id-counter.json corrupted: ${String(e)}. ` +
        `Backed up to ${backupPath}. ` +
        `Either restore from backup or delete the file to start fresh (will reset all IDs to 1).`,
      );
    }
  }

  async next(tier: SpecTier, phaseId: number, parents: number[] = []): Promise<string> {
    // H9: serialize via mutex chain
    const result = this.mutex.then(() => this.nextInternal(tier, phaseId, parents));
    this.mutex = result.catch(() => undefined);
    return result;
  }

  private async nextInternal(tier: SpecTier, phaseId: number, parents: number[]): Promise<string> {
    const key = this.makeKey(tier, phaseId, parents);
    const map = this.state[tier];
    const last = map[key] ?? 0;
    const nextN = last + 1;
    map[key] = nextN;
    await this.save();

    const finalParts =
      tier === SpecTier.Requirement
        ? [nextN]
        : tier === SpecTier.Feature
          ? [parents[0]!, nextN]
          : [parents[0]!, parents[1]!, nextN];

    const id: SpecId = { tier, parts: finalParts };
    return formatSpecId(id);
  }

  async save(): Promise<void> {
    // R2 M1: atomic write — temp + rename. Cross-process race + SIGKILL-safe.
    await mkdir(dirname(this.path), { recursive: true });
    const tmp = this.path + '.tmp';
    await writeFile(tmp, JSON.stringify(this.state, null, 2));
    await rename(tmp, this.path);
  }

  private makeKey(tier: SpecTier, phaseId: number, parents: number[]): string {
    if (tier === SpecTier.Requirement) return String(phaseId);
    if (tier === SpecTier.Feature) {
      if (parents.length < 1) {
        throw new Error('F tier requires parent R index');
      }
      return String(parents[0]);
    }
    if (parents.length < 2) {
      throw new Error('S tier requires parent R and F indices');
    }
    return `${parents[0]}.${parents[1]}`;
  }
}
