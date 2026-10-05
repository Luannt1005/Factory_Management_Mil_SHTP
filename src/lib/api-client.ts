/**
 * Centralized SWR Fetcher Client
 * Handles HTTP requests with consistent caching and error handling for SWR hooks
 */

/**
 * SWR Fetcher function with intelligent caching
 * Uses browser cache for GET requests
 */
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

      const error: any = new Error(errorMessage);
      error.info = data;
      error.status = response.status;
      throw error;
    }

    console.log(`✓ Fetched from ${response.headers.get('x-from-cache') ? 'cache' : 'server'}: ${url}`);
    return data;
  } catch (error) {
    // Network or HTTP errors - throw so SWR error handler can trigger
    console.error('SWR Fetch Error:', error);
    throw error;
  }
};
