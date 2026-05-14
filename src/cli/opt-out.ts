import { loadConsent, revokeConsent, ConsentStatus } from '../telemetry/consent.js';

export interface OptOutResult {
  status: ConsentStatus.OptedOut;
  revokedAt: string;
  message: string;
}

export async function optOut(configDir: string): Promise<OptOutResult> {
  const current = await loadConsent(configDir);

  // Idempotent: already opted out — return existing state without mutation
  if (current.status === ConsentStatus.OptedOut && current.revokedAt !== undefined) {
    return {
      status: ConsentStatus.OptedOut,
      revokedAt: current.revokedAt,
      message: buildMessage(current.revokedAt),
    };
  }

  const revoked = await revokeConsent(configDir);
  const revokedAt = revoked.revokedAt;
  if (!revokedAt) {
    throw new Error('revokeConsent failed to set revokedAt');
  }

  return {
    status: ConsentStatus.OptedOut,
    revokedAt,
    message: buildMessage(revokedAt),
  };
}

function buildMessage(revokedAt: string): string {
  return [
    `✓ Telemetry opt-out 적용됨 (revokedAt: ${revokedAt}).`,
    `향후 모든 event 전송 중단.`,
    ``,
    `기존 데이터 삭제 요청 (선택):`,
    `mailto: privacy@specrail.dev`,
    `subject: "telemetry data deletion"`,
    ``,
    `재opt-in: /specrail init 시 재질문, 또는 ~/.specrail/consent.json 직접 편집.`,
  ].join('\n');
}
