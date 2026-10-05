/**
 * Centralized SWR Fetcher Client
 * Handles HTTP requests with consistent caching and error handling for SWR hooks
 */

/**
 * SWR Fetcher function with intelligent caching
 * Uses browser cache for GET requests
 */
/** Error thrown by the shared fetch helpers; carries the HTTP status and parsed response body */
export class ApiClientError extends Error {
  status: number;
  info: unknown;

  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.info = info;
  }
}

export const swrFetcher = async (url: string) => {
  try {
    const response = await fetch(url, {
      // Use browser cache - only revalidate if cache is stale (default behavior)
      cache: 'default',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Try to parse response body first
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `API error: ${response.status}`;
      console.error(`❌ API error ${response.status} for URL: ${url}`, errorMessage);

      throw new ApiClientError(errorMessage, response.status, data);
    }

    console.log(`✓ Fetched from ${response.headers.get('x-from-cache') ? 'cache' : 'server'}: ${url}`);
    return data;
  } catch (error) {
    // Network or HTTP errors - throw so SWR error handler can trigger
    console.error('SWR Fetch Error:', error);
    throw error;
  }
};
