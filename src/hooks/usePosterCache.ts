import { useState, useEffect } from 'react';

interface CacheEntry {
  url: string;
  timestamp: number;
}

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export const usePosterCache = () => {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());

  useEffect(() => {
    // Load cache from localStorage on mount
    try {
      const savedCache = localStorage.getItem('posterCache');
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache);
        setCache(new Map(Object.entries(parsedCache)));
      }
    } catch (error) {
      console.error('Error loading poster cache:', error);
    }
  }, []);

  const saveCache = (newCache: Map<string, CacheEntry>) => {
    try {
      const cacheObject = Object.fromEntries(newCache);
      localStorage.setItem('posterCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving poster cache:', error);
    }
  };

  const getCachedPoster = (key: string): string | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > CACHE_DURATION) {
      cache.delete(key);
      saveCache(cache);
      return null;
    }

    return entry.url;
  };

  const cachePoster = (key: string, url: string) => {
    const newCache = new Map(cache);
    newCache.set(key, { url, timestamp: Date.now() });
    setCache(newCache);
    saveCache(newCache);
  };

  const clearCache = () => {
    setCache(new Map());
    localStorage.removeItem('posterCache');
  };

  return {
    getCachedPoster,
    cachePoster,
    clearCache
  };
};