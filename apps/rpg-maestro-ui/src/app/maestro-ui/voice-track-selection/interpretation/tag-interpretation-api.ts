import { InterpretTranscriptTagsRequest, InterpretTranscriptTagsResponse } from '@rpg-maestro/rpg-maestro-api-contract';
import { getAccessToken } from '../../../utils/authenticated-fetch';
import { rpgMaestroApiUrl } from '../../../utils/api-config';

/**
 * Calls the backend interpreter.
 *
 * Deliberately not built on `authenticatedFetch`: a failure here is recoverable — the caller
 * falls back to the local keyword matcher — so it must not raise a toast of its own, and the
 * error has to reach the caller instead of a redirect.
 */
export async function interpretTranscriptTags(
  request: InterpretTranscriptTagsRequest,
  signal?: AbortSignal
): Promise<InterpretTranscriptTagsResponse> {
  const response = await fetch(`${rpgMaestroApiUrl}/maestro/voice/interpret-tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${await getAccessToken()}`,
    },
    body: JSON.stringify(request),
    credentials: 'include',
    signal,
  });
  if (!response.ok) {
    throw new Error(`interpret-tags failed with status ${response.status}`);
  }
  return (await response.json()) as InterpretTranscriptTagsResponse;
}
