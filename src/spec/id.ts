// Phase 4 SpecId domain type — R{n} | F{n}.{m} | S{n}.{m}.{k}
// ADR-5: sequential counter, human-readable
// INV-1: Spec ID는 Project 내 unique

export enum SpecTier {
  Requirement = 'R',
  Feature = 'F',
  Specification = 'S',
}

export interface SpecId {
  readonly tier: SpecTier;
  readonly parts: readonly number[];
}

const EXPECTED_LEN: Record<SpecTier, number> = {
  [SpecTier.Requirement]: 1,
  [SpecTier.Feature]: 2,
  [SpecTier.Specification]: 3,
};

export function parseSpecId(s: string): SpecId {
  const m = s.match(/^([RFS])((?:\d+)(?:\.\d+)*)$/);
  if (!m) throw new Error(`INV-1: invalid SpecId format "${s}"`);
  const tier = m[1] as SpecTier;
  const parts = m[2].split('.').map((n) => {
    const v = Number(n);
    if (!Number.isInteger(v) || v < 1) {
      throw new Error(`INV-1: SpecId parts must be positive integers, got "${n}"`);
    }
    return v;
  });
  const expected = EXPECTED_LEN[tier];
  if (parts.length !== expected) {
    throw new Error(
      `INV-1: ${tier} requires ${expected} parts, got ${parts.length} ("${s}")`,
    );
  }
  return { tier, parts };
}

export function formatSpecId(id: SpecId): string {
  return `${id.tier}${id.parts.join('.')}`;
}

export function isSpecId(s: string): boolean {
  try {
    parseSpecId(s);
    return true;
  } catch {
    return false;
  }
}
