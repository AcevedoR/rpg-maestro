import {
  CreateLandingEventRequest,
  CreateLandingVisitRequest,
  CreateUpgradeInterestRequest,
  LandingEventType,
} from '@rpg-maestro/rpg-maestro-api-contract';
import { rpgMaestroApiUrl } from '../utils/api-config';
import { getLandingReferrer, getLandingSource } from './landing-attribution';

export async function submitUpgradeInterest(request: CreateUpgradeInterestRequest): Promise<void> {
  const response = await fetch(`${rpgMaestroApiUrl}/upgrade-interest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`upgrade-interest submission failed with status ${response.status}`);
  }
}

export function sendLandingEventBeacon(type: LandingEventType): void {
  sendBeacon(`${rpgMaestroApiUrl}/landing-events`, new CreateLandingEventRequest(type, getLandingSource(), getLandingReferrer()));
}

export function sendLandingVisitBeacon(request: CreateLandingVisitRequest): void {
  sendBeacon(`${rpgMaestroApiUrl}/landing-visits`, request);
}

function sendBeacon(url: string, body: object): void {
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // beacons must never break the page
  }
}
