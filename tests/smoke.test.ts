import { describe, it, expect } from 'vitest';
import pkg from '../package.json' with { type: 'json' };

describe('smoke', () => {
  it('package.json has semver version', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('package name is specrail', () => {
    expect(pkg.name).toBe('specrail');
  });

  it('requires Node 20+', () => {
    expect(pkg.engines.node).toBe('>=20');
  });
});
