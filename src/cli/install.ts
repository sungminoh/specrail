// T2.11 Plugin install bootstrap (F6.2, AC-R6-2, TC-13)
// `/plan-pipeline init` 시뮬: docs/spec 자동 생성 + Phase 1 안내

import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export interface BootstrapResult {
  created: boolean;
  specDir: string;
  cacheDir: string;
  phase1Trigger: string;
  message: string;
}

const PHASE_1_PLACEHOLDER = `---
phase: 1
status: Empty
mode: HOLD_SCOPE
---

<!-- Phase 1 PRD: 다음 단계에서 plugin이 forcing questions 6개를 진행합니다. -->
<!-- /plan-pipeline phase 1 명령으로 시작 -->

# PRD (작성 전)

이 파일은 plugin이 자동 생성한 placeholder입니다. \`/plan-pipeline phase 1\` 명령으로 forcing questions 진행 시 채워집니다.
`;

export async function bootstrap(projectRoot: string): Promise<BootstrapResult> {
  const specDir = join(projectRoot, 'docs', 'spec');
  const cacheDir = join(projectRoot, '.plan-pipeline-cache');

  let alreadyInitialized = false;
  try {
    const entries = await readdir(specDir);
    alreadyInitialized = entries.some((e) => /^\d{2}.*\.md$/.test(e));
  } catch {
    // missing — proceed
  }

  if (alreadyInitialized) {
    return {
      created: false,
      specDir,
      cacheDir,
      phase1Trigger: '/plan-pipeline phase 1',
      message: 'docs/spec already initialized. Use /plan-pipeline status to see progress.',
    };
  }

  await mkdir(specDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });

  await writeFile(join(specDir, '01-prd.md'), PHASE_1_PLACEHOLDER);

  await writeFile(
    join(cacheDir, 'state.json'),
    JSON.stringify({ initialized: new Date().toISOString(), currentPhase: 0 }, null, 2),
  );

  return {
    created: true,
    specDir,
    cacheDir,
    phase1Trigger: '/plan-pipeline phase 1',
    message: [
      '✓ docs/spec/ created with Phase 1 placeholder',
      '✓ .plan-pipeline-cache/ initialized (gitignore 권장)',
      '',
      'Next: /plan-pipeline phase 1 — 6 forcing questions 시작',
      'Tip: 기존 git repo면 /plan-pipeline hook install 로 pre-commit hook 활성화',
    ].join('\n'),
  };
}
