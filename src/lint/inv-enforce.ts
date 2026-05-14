// INV-5·7 runtime enforce (3차 verifier 발견: spec gap)
//
// INV-5 (AC R-tier만 GIVEN/WHEN/THEN 형식): R-tier spec body의 AC가
//   "GIVEN ... WHEN ... THEN ..." 패턴인지 lint. F·S tier에 AC X.
//
// INV-7 (ADR alternatives ≥ 2 + 거절 이유): ADR 산출물에 alternatives
//   섹션이 최소 2개 + 거절 이유 명시.

export interface InvViolation {
  inv: 'INV-5' | 'INV-7';
  location: string; // file path + line number
  reason: string;
}

const AC_LINE = /AC-R(\d+)-(\d+)\s*:/;
const GIVEN_WHEN_THEN = /GIVEN[^.]+WHEN[^.]+THEN/i;

/**
 * INV-5 check: AC들이 GIVEN/WHEN/THEN 형식인가.
 * Only R-tier (R{n}) AC 매칭. F·S tier 무관.
 */
export function checkInv5(text: string, filePath = ''): InvViolation[] {
  const lines = text.split('\n');
  const violations: InvViolation[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const acMatch = line.match(AC_LINE);
    if (!acMatch) continue;

    // Look ahead: AC body는 같은 라인 또는 다음 1-3줄
    const acContext = lines.slice(idx, idx + 4).join(' ');

    if (!GIVEN_WHEN_THEN.test(acContext)) {
      violations.push({
        inv: 'INV-5',
        location: `${filePath}:${idx + 1}`,
        reason: `AC-R${acMatch[1]}-${acMatch[2]} missing GIVEN/WHEN/THEN format`,
      });
    }
  }

  return violations;
}

const ADR_DEF = /^#{1,3}\s+ADR-(\d+):/;
const ALT_SECTION = /^#{2,4}\s+(?:Alternatives|alternatives|alternative)/i;
const ALT_ITEM = /(?:^#{2,5}\s+|^\s*[-*]\s+|^\s*\d+[.)]\s+|^\*\*)\s*(?:옵션|option|alternative|alt)\s+[A-Z0-9](?:\b|[.:_-])/i;

/**
 * INV-7 check: ADR alternatives 섹션이 최소 2개 옵션 + 각 옵션의 rejection reason.
 */
export function checkInv7(text: string, filePath = ''): InvViolation[] {
  const violations: InvViolation[] = [];
  const lines = text.split('\n');

  let inAdr = false;
  let currentAdr = '';
  let currentAdrLine = 0;
  let altCount = 0;
  let hasRejectionReason = false;

  const flushAdr = () => {
    if (!inAdr) return;
    if (altCount < 2) {
      violations.push({
        inv: 'INV-7',
        location: `${filePath}:${currentAdrLine}`,
        reason: `${currentAdr} has only ${altCount} alternatives (need ≥ 2)`,
      });
    }
    if (altCount >= 2 && !hasRejectionReason) {
      violations.push({
        inv: 'INV-7',
        location: `${filePath}:${currentAdrLine}`,
        reason: `${currentAdr} alternatives missing rejection reasons`,
      });
    }
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    const adrMatch = line.match(ADR_DEF);
    if (adrMatch) {
      flushAdr();
      inAdr = true;
      currentAdr = `ADR-${adrMatch[1]}`;
      currentAdrLine = idx + 1;
      altCount = 0;
      hasRejectionReason = false;
      continue;
    }

    if (!inAdr) continue;

    if (ALT_SECTION.test(line)) continue;
    if (ALT_ITEM.test(line)) {
      altCount++;
    }
    if (/거절\s*이유|Rejection\s*reason|Reason.*reject|거절됨/i.test(line)) {
      hasRejectionReason = true;
    }
  }

  flushAdr();
  return violations;
}

/**
 * 모든 INV check 실행.
 */
export function checkAllInvariants(text: string, filePath = ''): InvViolation[] {
  return [...checkInv5(text, filePath), ...checkInv7(text, filePath)];
}

/**
 * INV-7 check against a real file on disk.
 */
export async function checkInv7File(filePath: string): Promise<InvViolation[]> {
  const { readFile } = await import('node:fs/promises');
  const text = await readFile(filePath, 'utf8');
  return checkInv7(text, filePath);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: inv-enforce <ADR-file.md>');
    process.exit(2);
  }
  checkInv7File(filePath).then((violations) => {
    if (violations.length === 0) {
      console.log(`✓ INV-7 PASS for ${filePath}`);
      process.exit(0);
    }
    for (const v of violations) {
      console.error(`${v.location} — ${v.reason}`);
    }
    process.exit(1);
  });
}
