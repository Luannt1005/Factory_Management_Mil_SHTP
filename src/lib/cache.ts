/**
 * Optimized In-Memory Server-Side Cache
 * Used to reduce database reads for frequently accessed data
 * 
 * FEATURES:
 * - Configurable TTL per cache entry
 * - Automatic stale data cleanup
 * - Memory-efficient storage
 * - Prefix-based invalidation
 */

type CacheEntry<T> = {
    data: T;
    timestamp: number;
    ttl: number;
};

// Main cache store
const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 15 minutes (increased for better performance)
const DEFAULT_TTL = 15 * 60 * 1000;

// Max cache entries to prevent memory overflow
const MAX_CACHE_ENTRIES = 100;

/**
 * Get data from cache or fetch fresh
 */
export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = DEFAULT_TTL
): Promise<T> {
    const now = Date.now();
    const entry = cache.get(key);

    // Cache hit - return cached data
    if (entry && (now - entry.timestamp < entry.ttl)) {
        console.log(`[Cache] ✅ HIT: ${key}`);
        return entry.data as T;
    }

    // Cache miss - fetch fresh data
    console.log(`[Cache] 📡 MISS: ${key}`);

    try {
        const freshData = await fetcher();

        // Clean up old entries if cache is getting too large
        if (cache.size >= MAX_CACHE_ENTRIES) {
            cleanupOldEntries();
        }

        cache.set(key, {
            data: freshData,
            timestamp: now,
            ttl
        });

        return freshData;
    } catch (error) {
        // If fetch fails and we have stale data, return it
        if (entry) {
            console.log(`[Cache] ⚠️ Fetch failed, returning stale data for: ${key}`);
            return entry.data as T;
        }
        throw error;
    }
}

/**
 * Invalidate a specific cache key
 */
export function invalidateCache(key: string) {
    const existed = cache.delete(key);
    if (existed) {
        console.log(`[Cache] 🗑️ Invalidated: ${key}`);
    }
}

/**
 * Invalidate all cache entries with a given prefix
 */
export function invalidateCachePrefix(prefix: string) {
    let count = 0;
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
            count++;
        }
    }
    if (count > 0) {
        console.log(`[Cache] 🗑️ Invalidated ${count} keys with prefix: ${prefix}`);
    }
}

/**
 * Clean up old/expired entries
 */
function cleanupOldEntries() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp >= entry.ttl) {
            cache.delete(key);
            cleaned++;
        }
    }

    // If still too many, remove oldest entries
    if (cache.size >= MAX_CACHE_ENTRIES) {
        const entries = Array.from(cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = entries.slice(0, Math.floor(MAX_CACHE_ENTRIES / 4));
        toRemove.forEach(([key]) => cache.delete(key));
        cleaned += toRemove.length;
    }

    if (cleaned > 0) {
        console.log(`[Cache] 🧹 Cleaned ${cleaned} old entries`);
    }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
    const now = Date.now();
    let validCount = 0;
    let staleCount = 0;

    for (const entry of cache.values()) {
        if (now - entry.timestamp < entry.ttl) {
            validCount++;
        } else {
            staleCount++;
        }
    }

    return {
        total: cache.size,
        valid: validCount,
        stale: staleCount
    };
}

/**
 * Clear all cache (use sparingly)
 */
export function clearAllCache() {
    const size = cache.size;
    cache.clear();
    console.log(`[Cache] 🗑️ Cleared all ${size} entries`);
}

// ============================================
// PAGINATION HELPERS
// ============================================

export function getPaginatedCacheKey(prefix: string, page: number, limit: number): string {
    return `${prefix}_page_${page}_limit_${limit}`;
}

export function getCachedPagesCount(prefix: string): number {
    let count = 0;
    for (const key of cache.keys()) {
        if (key.startsWith(prefix + '_page_')) count++;
    }
    return count;
}

export function isPageCached(prefix: string, page: number, limit: number): boolean {
    const key = getPaginatedCacheKey(prefix, page, limit);
    const entry = cache.get(key);
    if (!entry) return false;
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
}
