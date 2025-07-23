// ...existing code...

export interface FetchClientOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  signal?: AbortSignal;
}

export async function fetchClient<T = any>(
  url: string,
  options: FetchClientOptions = {}
): Promise<T> {
  const { method = 'GET', headers = {}, body, credentials, signal } = options;
  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials,
    signal
  };
  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }
  const response = await fetch(url, fetchOptions);
  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = undefined;
  }
  if (!response.ok) {
    if (data?.errorCode === 'NOT_YET_ONBOARDED') {
      window.location.assign('/onboarding');
      // Optionally, return a rejected promise to halt further processing
      return Promise.reject(new Error('Redirecting to onboarding'));
    }
    throw new Error(data?.message || response.statusText);
  }
  return data;
}
