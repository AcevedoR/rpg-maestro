import { displayError } from '../error-utils';
import { HealthCheckResult } from '@nestjs/terminus/dist/health-check/health-check-result.interface';

const rpgmaestroapiurl = import.meta.env.VITE_RPG_MAESTRO_API_URL; // TODO centralize

export interface RPGMaestroHealthStatus {
  status: string;
}

export const getHealth = async (): Promise<RPGMaestroHealthStatus> => {
  try {
    const response = await fetch(rpgmaestroapiurl + `/health`, {
      credentials: 'include',
    });
    if (response.ok) {
      const apiRes = (await response.json()) as HealthCheckResult;
      return {status: apiRes.status}
    } else {
      console.error(response.status, response.statusText);
      throw new Error('fetch failed for error: ' + response);
    }
  } catch (error) {
    console.error(error);
    displayError(`Fetch /health error: ${error}`);
    return { status: 'error-reaching-server' };
  }
};
