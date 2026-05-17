/**
 * R7 Domain Entity Inline Detector (T3.2, AC-R7-2, TC-16)
 *
 * Detects concrete brand names, vendors, and single-domain entities
 * inline in meta-prompt text. Code fences and URLs are excluded.
 */

export interface DomainMatch {
  pattern: string;
  trigger: string;
  category: 'brand' | 'vendor' | 'domain-entity';
  suggestion: string;
}

interface Entry {
  pattern: string;
  category: 'brand' | 'vendor' | 'domain-entity';
  suggestion: string;
}

const BRAND_ENTRIES: Entry[] = [
  // Payment processors
  { pattern: 'Stripe', category: 'brand', suggestion: 'domain-agnostic expression: external payment service' },
  { pattern: 'PayPal', category: 'brand', suggestion: 'domain-agnostic expression: external payment service' },
  { pattern: 'Square', category: 'brand', suggestion: 'domain-agnostic expression: external payment service' },
  { pattern: 'Adyen', category: 'brand', suggestion: 'domain-agnostic expression: external payment service' },
  // Databases
  { pattern: 'PostgreSQL', category: 'vendor', suggestion: 'domain-agnostic expression: relational database / data store' },
  { pattern: 'MySQL', category: 'vendor', suggestion: 'domain-agnostic expression: relational database / data store' },
  { pattern: 'MongoDB', category: 'vendor', suggestion: 'domain-agnostic expression: document store / NoSQL database' },
  { pattern: 'Redis', category: 'vendor', suggestion: 'domain-agnostic expression: cache / key-value store' },
  // Collaboration / productivity
  { pattern: 'Slack', category: 'brand', suggestion: 'domain-agnostic expression: messaging tool / collaboration platform' },
  { pattern: 'Discord', category: 'brand', suggestion: 'domain-agnostic expression: messaging tool / community platform' },
  { pattern: 'Notion', category: 'brand', suggestion: 'domain-agnostic expression: knowledge management tool' },
  { pattern: 'Linear', category: 'brand', suggestion: 'domain-agnostic expression: issue tracker / project management tool' },
  { pattern: 'Asana', category: 'brand', suggestion: 'domain-agnostic expression: project management tool' },
  { pattern: 'Jira', category: 'brand', suggestion: 'domain-agnostic expression: issue tracker / project management tool' },
  // Travel / marketplace platforms
  { pattern: 'Booking\\.com', category: 'brand', suggestion: 'domain-agnostic expression: booking platform / marketplace' },
  { pattern: 'Airbnb', category: 'brand', suggestion: 'domain-agnostic expression: short-term rental platform / marketplace' },
  { pattern: 'Uber', category: 'brand', suggestion: 'domain-agnostic expression: ride-sharing platform / on-demand service' },
  { pattern: 'Lyft', category: 'brand', suggestion: 'domain-agnostic expression: ride-sharing platform / on-demand service' },
  { pattern: 'DoorDash', category: 'brand', suggestion: 'domain-agnostic expression: delivery platform / on-demand service' },
  // Cloud / infra
  { pattern: 'AWS', category: 'vendor', suggestion: 'domain-agnostic expression: cloud provider / infrastructure service' },
  { pattern: 'GCP', category: 'vendor', suggestion: 'domain-agnostic expression: cloud provider / infrastructure service' },
  { pattern: 'Azure', category: 'vendor', suggestion: 'domain-agnostic expression: cloud provider / infrastructure service' },
  { pattern: 'Cloudflare', category: 'vendor', suggestion: 'domain-agnostic expression: CDN / edge network service' },
  { pattern: 'Vercel', category: 'vendor', suggestion: 'domain-agnostic expression: deployment / hosting platform' },
  { pattern: 'Netlify', category: 'vendor', suggestion: 'domain-agnostic expression: deployment / hosting platform' },
  // Big tech
  { pattern: 'Tesla', category: 'brand', suggestion: 'domain-agnostic expression: the external service / platform' },
  { pattern: 'Apple', category: 'brand', suggestion: 'domain-agnostic expression: the external service / platform' },
  { pattern: 'Google', category: 'brand', suggestion: 'domain-agnostic expression: the external service / platform' },
  { pattern: 'Microsoft', category: 'brand', suggestion: 'domain-agnostic expression: the external service / platform' },
];

const DOMAIN_ENTITY_ENTRIES: Entry[] = [
  // E-commerce (English)
  { pattern: 'cart', category: 'domain-entity', suggestion: 'domain-agnostic expression: user resource / collection' },
  { pattern: 'checkout', category: 'domain-entity', suggestion: 'domain-agnostic expression: completion step / finalization' },
  { pattern: 'refund', category: 'domain-entity', suggestion: 'domain-agnostic expression: reversal / credit action' },
  { pattern: 'shipping', category: 'domain-entity', suggestion: 'domain-agnostic expression: delivery / fulfillment' },
  // E-commerce (Korean)
  { pattern: '장바구니', category: 'domain-entity', suggestion: '도메인 무관 표현: 사용자 자원 / 컬렉션' },
  { pattern: '결제', category: 'domain-entity', suggestion: '도메인 무관 표현: 완료 단계 / 트랜잭션' },
  { pattern: '환불', category: 'domain-entity', suggestion: '도메인 무관 표현: 취소 / 크레딧 처리' },
  { pattern: '배송지', category: 'domain-entity', suggestion: '도메인 무관 표현: 수신 위치 / 대상지' },
  // Booking (English)
  { pattern: 'reservation', category: 'domain-entity', suggestion: 'domain-agnostic expression: booking / scheduled entry' },
  { pattern: 'check-in', category: 'domain-entity', suggestion: 'domain-agnostic expression: arrival / session start' },
  { pattern: 'check-out', category: 'domain-entity', suggestion: 'domain-agnostic expression: departure / session end' },
  { pattern: 'cancellation policy', category: 'domain-entity', suggestion: 'domain-agnostic expression: termination policy / exit terms' },
  // Booking (Korean)
  { pattern: '객실', category: 'domain-entity', suggestion: '도메인 무관 표현: 자원 단위 / 공간' },
  { pattern: '체크인', category: 'domain-entity', suggestion: '도메인 무관 표현: 시작 이벤트 / 도착' },
  { pattern: '예약자', category: 'domain-entity', suggestion: '도메인 무관 표현: 사용자 / 요청자' },
  // Game (English)
  { pattern: 'inventory', category: 'domain-entity', suggestion: 'domain-agnostic expression: user resource store / item collection' },
  { pattern: 'guild', category: 'domain-entity', suggestion: 'domain-agnostic expression: group / organization unit' },
  { pattern: 'loot', category: 'domain-entity', suggestion: 'domain-agnostic expression: reward / acquired resource' },
  // Game (Korean)
  { pattern: '인벤토리', category: 'domain-entity', suggestion: '도메인 무관 표현: 자원 저장소' },
  { pattern: '길드', category: 'domain-entity', suggestion: '도메인 무관 표현: 그룹 / 조직 단위' },
  { pattern: '아이템', category: 'domain-entity', suggestion: '도메인 무관 표현: 자원 / 객체' },
  { pattern: '레벨', category: 'domain-entity', suggestion: '도메인 무관 표현: 단계 / 등급' },
  { pattern: '캐릭터', category: 'domain-entity', suggestion: '도메인 무관 표현: 사용자 표현 / 엔티티' },
  // Healthcare (English)
  { pattern: 'patient', category: 'domain-entity', suggestion: 'domain-agnostic expression: end user / service recipient' },
  { pattern: 'diagnosis', category: 'domain-entity', suggestion: 'domain-agnostic expression: assessment / evaluation result' },
  { pattern: 'prescription', category: 'domain-entity', suggestion: 'domain-agnostic expression: directive / instruction artifact' },
  { pattern: 'chart', category: 'domain-entity', suggestion: 'domain-agnostic expression: record / document' },
  // Healthcare (Korean)
  { pattern: '환자', category: 'domain-entity', suggestion: '도메인 무관 표현: 사용자 / 서비스 수신자' },
  { pattern: '진료', category: 'domain-entity', suggestion: '도메인 무관 표현: 서비스 제공 / 평가' },
  { pattern: '처방', category: 'domain-entity', suggestion: '도메인 무관 표현: 지시 / 결과 문서' },
];

/** Strip code-fenced blocks (``` ... ```) from text before matching. */
function stripCodeFences(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '');
}

/** Replace URL tokens so brand names inside them are not matched. */
function stripUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, '');
}

function buildWordBoundaryRegex(pattern: string): RegExp {
  // Multi-word / punctuation patterns: use as-is
  if (/[\s\-.]/.test(pattern)) {
    return new RegExp(pattern, 'gi');
  }
  // Non-ASCII patterns (e.g. Korean) don't work with \b; use plain match
  if (/[^ -]/.test(pattern)) {
    return new RegExp(pattern, 'gi');
  }
  return new RegExp(`\\b${pattern}\\b`, 'gi');
}

export interface DomainScanOptions {
  /**
   * When true, deduplicate matches by pattern+category so each distinct
   * pattern appears at most once in the result. Default false (all occurrences
   * returned) for backwards compatibility.
   */
  dedupe?: boolean;
}

/**
 * Detects concrete brand names, vendors, and single-domain entity terms in
 * the given text. Code fences and URLs are excluded from matching.
 *
 * @param text - Raw markdown or prose to analyse.
 * @param options - Optional scan options (e.g. dedupe).
 * @returns Array of DomainMatch objects for every detected occurrence.
 */
export function detectDomainEntities(text: string, options: DomainScanOptions = {}): DomainMatch[] {
  const cleaned = stripUrls(stripCodeFences(text));
  const results: DomainMatch[] = [];

  const allEntries: Entry[] = [...BRAND_ENTRIES, ...DOMAIN_ENTITY_ENTRIES];

  for (const entry of allEntries) {
    const re = buildWordBoundaryRegex(entry.pattern);
    let match: RegExpExecArray | null;
    while ((match = re.exec(cleaned)) !== null) {
      results.push({
        pattern: entry.pattern,
        trigger: match[0],
        category: entry.category,
        suggestion: entry.suggestion,
      });
    }
  }

  if (options.dedupe) {
    const seen = new Set<string>();
    return results.filter((f) => {
      const key = f.pattern + '|' + f.category;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return results;
}
