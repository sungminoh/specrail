/**
 * AC stub references — pre-implementation placeholder.
 *
 * specrail check 의 ac-traceability lint 가 phase 13 의 AC 인용을 test 파일에서
 * 찾는다. v0.1.0 implementation 시작 후 각 atomic task (T*) 가 실제 test 를
 * 작성하면서 이 stub 을 대체한다.
 *
 * AC-R1-1 (phase view cold load ≤ 2s)
 * AC-R1-2 (ID hover popover + click jump)
 * AC-R2-3 (graph node click → Refs + Open in phase)
 * AC-R3-1 (cross-phase check 4종 검출)
 * AC-R3-2 (issue row 펼침 source-label + line + suggested patch)
 * AC-R4-1 (AI review session SSE token stream)
 * AC-R4-3 (inline rewrite selection patch preview)
 * AC-R4-4 (claude 미설치/exit !=0 분류 에러)
 * AC-R5-1 (atomic write + mtime mismatch 409)
 * AC-R5-2 (frontmatter zod validate inline error)
 */

import { describe, it } from 'vitest';

describe('AC stubs (pre-implementation)', () => {
  it.todo('AC-R1-1 — phase view cold load');
  it.todo('AC-R1-2 — ID hover popover + click jump');
  it.todo('AC-R2-3 — graph node click → Refs + Open');
  it.todo('AC-R3-1 — cross-phase 4 checks');
  it.todo('AC-R3-2 — issue inbox row expand');
  it.todo('AC-R4-1 — AI session SSE');
  it.todo('AC-R4-3 — inline rewrite patch preview');
  it.todo('AC-R4-4 — claude CLI error classification');
  it.todo('AC-R5-1 — atomic write conflict 409');
  it.todo('AC-R5-2 — frontmatter zod validate');
});
