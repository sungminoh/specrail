import { describe, it, expect } from 'vitest';
import { loadConfigFromEnv, createPlausibleSender } from '../src/telemetry/plausible-adapter.js';

describe('US-8.3 loadConfigFromEnv', () => {
  it('domain + endpoint + token present → returns full config with token', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_DOMAIN: 'specrail-v4.example',
      PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event',
      PLAUSIBLE_API_TOKEN: 'tok-abc123',
    });
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('specrail-v4.example');
    expect(result!.endpoint).toBe('https://plausible.io/api/event');
    expect(result!.token).toBe('tok-abc123');
  });

  it('missing PLAUSIBLE_DOMAIN → returns null', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event',
      PLAUSIBLE_API_TOKEN: 'tok-abc123',
    });
    expect(result).toBeNull();
  });

  it('missing PLAUSIBLE_ENDPOINT → returns null', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_DOMAIN: 'specrail-v4.example',
      PLAUSIBLE_API_TOKEN: 'tok-abc123',
    });
    expect(result).toBeNull();
  });

  it('all missing → returns null', () => {
    const result = loadConfigFromEnv({});
    expect(result).toBeNull();
  });

  it('token missing but domain + endpoint present → returns config WITHOUT token', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_DOMAIN: 'specrail-v4.example',
      PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event',
    });
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('specrail-v4.example');
    expect(result!.endpoint).toBe('https://plausible.io/api/event');
    expect(result!.token).toBeUndefined();
  });

  it('token present → returns config WITH token', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_DOMAIN: 'x',
      PLAUSIBLE_ENDPOINT: 'y',
      PLAUSIBLE_API_TOKEN: 'z',
    });
    expect(result).toEqual({ domain: 'x', endpoint: 'y', token: 'z' });
  });
});

describe('R2-M1: createPlausibleSender token format validation', () => {
  it('rejects token with control chars (R2-M1)', () => {
    expect(() => createPlausibleSender({
      domain: 'x',
      endpoint: 'https://x',
      token: 'tok\r\nInjected: header',
    })).toThrow(/Invalid PLAUSIBLE_API_TOKEN/);
  });

  it('accepts well-formed token (R2-M1)', () => {
    expect(() => createPlausibleSender({
      domain: 'x',
      endpoint: 'https://x',
      token: 'tok-123_abc.xyz+/=',
    })).not.toThrow();
  });
});
