import { CreateBetaSignupRequest, CreateLandingVisitRequest } from '@rpg-maestro/rpg-maestro-api-contract';
import { rpgMaestroApiUrl } from '../utils/api-config';

export function getLandingSource(): string | undefined {
  const source = new URLSearchParams(window.location.search).get('src');
  return source ? source.slice(0, 100) : undefined;
}

export function getLandingReferrer(): string | undefined {
  return document.referrer ? document.referrer.slice(0, 2048) : undefined;
}

export async function submitBetaSignup(request: CreateBetaSignupRequest): Promise<void> {
  const response = await fetch(`${rpgMaestroApiUrl}/beta-signups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`beta signup failed with status ${response.status}`);
  }
}

export function sendLandingVisitBeacon(request: CreateLandingVisitRequest): void {
  try {
    fetch(`${rpgMaestroApiUrl}/landing-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // the beacon must never break the page
  }
}
