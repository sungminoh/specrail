import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = resolve(__dirname, '../schemas');

describe('Per-phase schema differentiation (R5 HIGH#1)', () => {
  it('phase schemas are NOT byte-identical (post-fix)', async () => {
    const phaseFiles = ['phase-01.json', 'phase-02.json', 'phase-12.json', 'phase-13.json'];
    const contents = await Promise.all(
      phaseFiles.map((f) => readFile(join(SCHEMA_DIR, f), 'utf8')),
    );
    // Each phase should have unique structure beyond just $id and phase.const
    const properties = contents.map((c) => Object.keys(JSON.parse(c).properties).sort().join(','));
    const uniqueProps = new Set(properties);
    expect(uniqueProps.size).toBeGreaterThan(1); // at least some phases differ
  });

  it('phase-12 schema includes "decisions" field for ADR', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-12.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.decisions).toBeDefined();
  });

  it('phase-13 schema includes "tasks" field for impl plan', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-13.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.tasks).toBeDefined();
  });

  it('all schemas still validate basic envelope (regression)', async () => {
    const files = await readdir(SCHEMA_DIR);
    const phaseFiles = files.filter((f) => /^phase-\d+\.json$/.test(f));
    for (const f of phaseFiles) {
      const raw = await readFile(join(SCHEMA_DIR, f), 'utf8');
      const schema = JSON.parse(raw);
      expect(schema.properties.phase).toBeDefined();
      expect(schema.properties.phase.const).toBeGreaterThan(0);
      expect(schema.properties.status).toBeDefined();
    }
  });

  it('phase-01 schema includes PRD-specific fields (kpi, personas, risks)', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-01.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.kpi).toBeDefined();
    expect(schema.properties.personas).toBeDefined();
    expect(schema.properties.risks).toBeDefined();
  });

  it('phase-02 schema includes "personas" and "journeys" fields', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-02.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.personas).toBeDefined();
    expect(schema.properties.journeys).toBeDefined();
  });

  it('phase-03 schema includes "features" and "requirements" fields', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-03.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.features).toBeDefined();
    expect(schema.properties.requirements).toBeDefined();
  });

  it('phase-04 schema includes "entities", "relationships", and "invariants" fields', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-04.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.entities).toBeDefined();
    expect(schema.properties.relationships).toBeDefined();
    expect(schema.properties.invariants).toBeDefined();
  });

  it('phase-05 schema includes "flows" field', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-05.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.flows).toBeDefined();
  });

  it('phase-06 schema includes "screens" field', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-06.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.screens).toBeDefined();
  });

  it('phase-07 schema includes "wireframes" field', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-07.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.wireframes).toBeDefined();
  });

  it('phase-08 schema includes "components" and "decisions" fields', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-08.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.components).toBeDefined();
    expect(schema.properties.decisions).toBeDefined();
  });

  it('phase-09 schema includes "requirements" field for NFRs', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-09.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.requirements).toBeDefined();
  });

  it('phase-10 schema includes "testCases" and "coverage" fields', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-10.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.testCases).toBeDefined();
    expect(schema.properties.coverage).toBeDefined();
  });

  it('phase-11 schema includes "runbooks" and "monitoring" fields', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-11.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.runbooks).toBeDefined();
    expect(schema.properties.monitoring).toBeDefined();
  });

  it('phase-12 schema includes "risks" field alongside "decisions"', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-12.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.risks).toBeDefined();
  });

  it('phase-13 schema includes "acceptanceCriteria" and "milestones" fields', async () => {
    const raw = await readFile(join(SCHEMA_DIR, 'phase-13.json'), 'utf8');
    const schema = JSON.parse(raw);
    expect(schema.properties.acceptanceCriteria).toBeDefined();
    expect(schema.properties.milestones).toBeDefined();
  });

  it('no phase-specific fields are "required" — conservative declaration only', async () => {
    const files = await readdir(SCHEMA_DIR);
    const phaseFiles = files.filter((f) => /^phase-\d+\.json$/.test(f));
    const envelopeFields = new Set(['phase', 'status']);
    for (const f of phaseFiles) {
      const raw = await readFile(join(SCHEMA_DIR, f), 'utf8');
      const schema = JSON.parse(raw);
      const required: string[] = schema.required ?? [];
      const phaseSpecificRequired = required.filter((r) => !envelopeFields.has(r));
      expect(
        phaseSpecificRequired,
        `${f} must not require phase-specific fields (got: ${phaseSpecificRequired.join(', ')})`,
      ).toHaveLength(0);
    }
  });

  it('all phase-specific property declarations include a description', async () => {
    const files = await readdir(SCHEMA_DIR);
    const phaseFiles = files.filter((f) => /^phase-\d+\.json$/.test(f));
    const envelopeFields = new Set(['phase', 'status', 'mode', 'refs', 'approvedAt']);
    for (const f of phaseFiles) {
      const raw = await readFile(join(SCHEMA_DIR, f), 'utf8');
      const schema = JSON.parse(raw);
      const props = schema.properties ?? {};
      for (const [key, def] of Object.entries(props) as [string, Record<string, unknown>][]) {
        if (envelopeFields.has(key)) continue;
        expect(
          def.description,
          `${f} property "${key}" must have a description`,
        ).toBeTruthy();
      }
    }
  });
});
