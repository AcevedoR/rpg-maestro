// ...existing code...

import { displayError } from '../error-utils';
import { clearUserFromSessionStorage } from '../cache/session-storage.service';

let getAccessTokenSilentlyFunction: (() => Promise<string>) | undefined;

export function initAuthRequirements(getAccessTokenSilentlyFunctionParam: () => Promise<string>) {
  getAccessTokenSilentlyFunction = getAccessTokenSilentlyFunctionParam;
}

export async function authenticatedFetch<T = unknown>(url: string, options: FetchClientOptions = {}): Promise<T> {
  const { method = 'GET', headers = {}, body, credentials, signal } = options;
  if (getAccessTokenSilentlyFunction) {
    headers.Authorization = `Bearer ${await getAccessTokenSilentlyFunction()}`;
  } else {
    return Promise.reject(
      new Error('Unhandled error, getAccessTokenSilentlyFunction not available yet ' + getAccessTokenSilentlyFunction),
    );
  }
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials,
    signal,
  };
  if (body !== undefined) {
    fetchOptions.body = body as BodyInit;
  }
  const response = await fetch(url, fetchOptions);
  let data;
  try {
    data = await response.json();
  } catch {
    data = undefined;
  }
  if (!response.ok) {
    if (data?.errorCode === 'NOT_YET_ONBOARDED') {
      window.location.assign('/onboarding/setup-session');
      // Optionally, return a rejected promise to halt further processing
      return Promise.reject(new Error('Redirecting to onboarding'));
    }
    if (response.status === 403) {
      window.location.assign('/maestro/infos');
      return Promise.reject(new Error('Forbidden. Redirecting to account infos'));
    } else if (response.status === 401) {
      clearUserFromSessionStorage();
      window.location.assign('/login');
      return Promise.reject(new Error('Unauthenticated. Redirecting to login'));
    }
    displayError(
      `fetch error: ${method} ${url}, response status: ${response.status}, message: ${JSON.stringify(data)}`,
    );
    throw new Error(data?.message || response.statusText);
  }
  return data;
}

export interface FetchClientOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}
