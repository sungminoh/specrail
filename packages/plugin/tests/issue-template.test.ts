import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { fromRoot } from './_helpers/repo-root.js';

describe('T4.3 KPI-3 survey template (OQ-11-3)', () => {
  async function loadYaml(): Promise<string> {
    // Post-monorepo: file may live at .github/kpi3-survey.yml (legacy flat layout) or
    // .github/ISSUE_TEMPLATE/kpi3-survey.yml (GitHub-standard layout).
    // Try both.
    const candidates = [
      fromRoot('.github/ISSUE_TEMPLATE/kpi3-survey.yml'),
      fromRoot('.github/kpi3-survey.yml'),
    ];
    for (const p of candidates) {
      try {
        return await readFile(p, 'utf8');
      } catch {
        // try next
      }
    }
    throw new Error(`kpi3-survey.yml not found in any of: ${candidates.join(', ')}`);
  }

  it('template file exists', async () => {
    const yaml = await loadYaml();
    expect(yaml.length).toBeGreaterThan(0);
  });

  it('has a name field', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('name:');
  });

  it('contains required labels: kpi-3 and survey', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('kpi-3');
    expect(yaml).toContain('survey');
  });

  it('defines form-style body fields (duration, ai assist, pain points)', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('duration_hours');
    expect(yaml).toContain('ai_assist_level');
    expect(yaml).toContain('pain_points');
  });

  it('contains Korean-language prompts (NFR-I18N-1)', async () => {
    const yaml = await loadYaml();
    expect(yaml).toMatch(/[가-힣]/);
  });

  it('mentions anonymity for privacy (NFR-PRIV)', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('익명');
  });

  it('references R7 (single-domain entity guidance)', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('R7');
  });

  it('includes telemetry consent checkbox', async () => {
    const yaml = await loadYaml();
    expect(yaml).toContain('telemetry_consent');
  });
});
