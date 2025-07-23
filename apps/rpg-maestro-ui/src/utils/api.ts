interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export async function authenticatedFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Important for Cloudflare Access cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If unauthorized, let the Cloudflare Access middleware handle the redirect
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/cdn-cgi/access/login';
      return { status: response.status };
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: data.message || 'An error occurred',
        status: response.status,
      };
    }
    return { data, status: response.status };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}
