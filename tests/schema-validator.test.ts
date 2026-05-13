import { describe, it, expect } from 'vitest';
import { validateFrontmatter, getSchemaPath } from '../src/schema/validator.js';

const commonSchema = getSchemaPath('common-frontmatter.json');

describe('schema validator (ADR-2, F1.1, F2.4)', () => {
  it('passes valid frontmatter', async () => {
    const result = await validateFrontmatter(
      { phase: 1, status: 'Draft' },
      commonSchema,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing required field (status)', async () => {
    const result = await validateFrontmatter({ phase: 1 }, commonSchema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.params.missingProperty === 'status')).toBe(true);
  });

  it('rejects invalid status enum', async () => {
    const result = await validateFrontmatter(
      { phase: 1, status: 'InProgress' },
      commonSchema,
    );
    expect(result.valid).toBe(false);
  });

  it('rejects phase out of range', async () => {
    const result = await validateFrontmatter(
      { phase: 14, status: 'Draft' },
      commonSchema,
    );
    expect(result.valid).toBe(false);
  });

  it('accepts ref pattern (R1·F1.2·S1.2.3·ENT-Foo·INV-3·ADR-7)', async () => {
    const result = await validateFrontmatter(
      {
        phase: 4,
        status: 'Draft',
        refs: ['R1', 'F1.2', 'S1.2.3', 'ENT-Foo', 'INV-3', 'ADR-7'],
      },
      commonSchema,
    );
    expect(result.valid).toBe(true);
  });

  it('rejects bogus ref pattern', async () => {
    const result = await validateFrontmatter(
      { phase: 4, status: 'Draft', refs: ['X1', 'foo'] },
      commonSchema,
    );
    expect(result.valid).toBe(false);
  });
});
