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
      // For server errors, log but don't crash - return error structure
      console.error(`❌ API error ${response.status} for URL: ${url}`, data?.error || '');

      // Return error object that SWR can handle gracefully
      return {
        success: false,
        error: data?.error || `API error: ${response.status}`,
        status: response.status
      };
    }

    console.log(`✓ Fetched from ${response.headers.get('x-from-cache') ? 'cache' : 'server'}: ${url}`);
    return data;
  } catch (error) {
    // Network errors - these should throw so SWR can retry
    console.error('SWR Fetch Error:', error);
    throw error;
  }
};
