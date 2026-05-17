import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export enum ConsentStatus {
  NotAsked = 'NotAsked',
  OptedIn = 'OptedIn',
  OptedOut = 'OptedOut',
}

export interface Consent {
  status: ConsentStatus;
  consentedAt?: string;
  revokedAt?: string;
}

const CONSENT_FILE = 'consent.json';

export async function loadConsent(configDir: string): Promise<Consent> {
  const filePath = join(configDir, CONSENT_FILE);
  try {
    const raw = await readFile(filePath, 'utf8');
    return JSON.parse(raw) as Consent;
  } catch {
    return { status: ConsentStatus.NotAsked };
  }
}

export async function recordConsent(configDir: string, input: 'yes' | 'no'): Promise<Consent> {
  const filePath = join(configDir, CONSENT_FILE);
  const consent: Consent =
    input === 'yes'
      ? { status: ConsentStatus.OptedIn, consentedAt: new Date().toISOString() }
      : { status: ConsentStatus.OptedOut };
  await writeFile(filePath, JSON.stringify(consent, null, 2), 'utf8');
  return consent;
}

export async function revokeConsent(configDir: string): Promise<Consent> {
  const filePath = join(configDir, CONSENT_FILE);
  const consent: Consent = { status: ConsentStatus.OptedOut, revokedAt: new Date().toISOString() };
  await writeFile(filePath, JSON.stringify(consent, null, 2), 'utf8');
  return consent;
}
