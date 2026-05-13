import { describe, it, expect } from 'vitest';
import { loadConfigFromEnv } from '../src/telemetry/plausible-adapter.js';

describe('US-8.3 loadConfigFromEnv', () => {
  it('all 3 env vars present → returns full config', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_DOMAIN: 'plan-pipeline-v4.example',
      PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event',
      PLAUSIBLE_API_TOKEN: 'tok-abc123',
    });
    expect(result).not.toBeNull();
    expect(result!.domain).toBe('plan-pipeline-v4.example');
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

  it('missing PLAUSIBLE_API_TOKEN → returns null', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_DOMAIN: 'plan-pipeline-v4.example',
      PLAUSIBLE_ENDPOINT: 'https://plausible.io/api/event',
    });
    expect(result).toBeNull();
  });

  it('all 3 missing → returns null', () => {
    const result = loadConfigFromEnv({});
    expect(result).toBeNull();
  });

  it('explicit env override — returns config independent of process.env', () => {
    const result = loadConfigFromEnv({
      PLAUSIBLE_DOMAIN: 'x',
      PLAUSIBLE_ENDPOINT: 'y',
      PLAUSIBLE_API_TOKEN: 'z',
    });
    expect(result).toEqual({ domain: 'x', endpoint: 'y', token: 'z' });
  });
});
