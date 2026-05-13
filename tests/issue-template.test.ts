import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';

describe('T4.3 KPI-3 survey template (OQ-11-3)', () => {
  async function loadYaml(): Promise<string> {
    return readFile('.github/ISSUE_TEMPLATE/kpi3-survey.yml', 'utf8');
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
    // Korean characters must be present
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
