import { describe, it, expect } from 'vitest';
import { detectDomainEntities, type DomainMatch } from '../src/lint/r7-domain.js';

describe('T3.2 R7 domain entity lint (AC-R7-2, TC-16)', () => {
  // 1. Brand name detection
  it('detects Stripe brand', () => {
    const m = detectDomainEntities('use Stripe for payment');
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].category).toBe('brand');
  });

  it('detects PostgreSQL vendor', () => {
    const m = detectDomainEntities('connect to PostgreSQL database');
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].trigger).toBe('PostgreSQL');
  });

  it('detects multiple brands in one text', () => {
    const m = detectDomainEntities('integrate Slack and Notion for team collaboration');
    expect(m.length).toBeGreaterThanOrEqual(2);
  });

  it('detects e-commerce domain entities (English)', () => {
    const m = detectDomainEntities('the user adds items to cart and proceeds to checkout');
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].category).toBe('domain-entity');
  });

  it('detects e-commerce domain entities (Korean)', () => {
    const m = detectDomainEntities('사용자가 장바구니에 상품을 담고 결제를 진행한다');
    expect(m.length).toBeGreaterThan(0);
  });

  it('detects booking domain entities', () => {
    const m = detectDomainEntities('manage room reservations and check-in times');
    expect(m.length).toBeGreaterThan(0);
  });

  it('detects game domain entities', () => {
    const m = detectDomainEntities('player picks up loot and stores it in inventory');
    expect(m.length).toBeGreaterThan(0);
  });

  it('detects healthcare domain entities', () => {
    const m = detectDomainEntities('doctor writes a prescription in the patient chart');
    expect(m.length).toBeGreaterThan(0);
  });

  // 2. Domain-agnostic text passes (no triggers)
  it('passes domain-agnostic payment phrasing', () => {
    const m = detectDomainEntities('use the payment provider for transactions');
    expect(m.length).toBe(0);
  });

  it('passes domain-agnostic database phrasing', () => {
    const m = detectDomainEntities('connect to the database');
    expect(m.length).toBe(0);
  });

  it('passes generic user resource phrasing', () => {
    const m = detectDomainEntities('the user manages their resources and settings');
    expect(m.length).toBe(0);
  });

  // 3. Code fences are ignored
  it('ignores brand inside code fence', () => {
    const text = '```\nconst client = new Stripe(apiKey);\n```';
    const m = detectDomainEntities(text);
    expect(m.length).toBe(0);
  });

  it('ignores domain entity inside code fence', () => {
    const text = 'Here is an example:\n```typescript\nconst cart = new Cart();\n```';
    const m = detectDomainEntities(text);
    expect(m.length).toBe(0);
  });

  // 4. URLs are ignored
  it('ignores brand appearing inside a URL', () => {
    const m = detectDomainEntities('see https://example.com/stripe-integration for details');
    expect(m.length).toBe(0);
  });

  it('ignores brand appearing as a URL host', () => {
    const m = detectDomainEntities('visit https://stripe.com/docs');
    expect(m.length).toBe(0);
  });

  // 5. Case-insensitive detection
  it('detects PostgreSQL case-insensitively (lowercase)', () => {
    const m = detectDomainEntities('using postgresql as the backend store');
    expect(m.length).toBeGreaterThan(0);
    expect(m[0].trigger.toLowerCase()).toBe('postgresql');
  });

  it('detects Stripe case-insensitively (uppercase)', () => {
    const m = detectDomainEntities('STRIPE handles the billing');
    expect(m.length).toBeGreaterThan(0);
  });

  // 6. Match shape
  it('returns DomainMatch with required fields', () => {
    const m = detectDomainEntities('use Stripe for payment');
    const match: DomainMatch = m[0];
    expect(typeof match.pattern).toBe('string');
    expect(typeof match.trigger).toBe('string');
    expect(['brand', 'vendor', 'domain-entity']).toContain(match.category);
    expect(typeof match.suggestion).toBe('string');
    expect(match.suggestion.length).toBeGreaterThan(0);
  });
});

describe('R5 MEDIUM#4: detectDomainEntities dedupe option', () => {
  it('dedupe option groups by pattern+category (R5 MEDIUM)', () => {
    // "Stripe" appears three times in the text
    const text = 'Stripe is great. Stripe handles payments. Stripe integrates easily.';
    const all = detectDomainEntities(text);
    const deduped = detectDomainEntities(text, { dedupe: true });
    expect(all.length).toBe(3);
    expect(deduped.length).toBe(1);
    expect(deduped[0].pattern).toBe('Stripe');
  });

  it('dedupe false (default) returns all occurrences', () => {
    const text = 'Stripe ... Stripe ... Stripe';
    const all = detectDomainEntities(text);
    expect(all.length).toBe(3);
  });
});
