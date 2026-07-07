"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { logger } from "@/lib/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const MAX_CACHE_SIZE = 50; // Prevent memory leaks

export function useCachedQuery<T>(key: string, queryFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cache = cacheRef.current;
    const cached = cache.get(key);

    if (cached && !forceRefresh && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    try {
      const result = await queryFnRef.current();

      // Enforce cache size limit
      if (cache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entry
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }

      cache.set(key, { data: result, timestamp: Date.now(), key });
      setData(result);
      return result;
    } catch (error) {
      logger.error("useCachedQuery fetch failed", {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}

export function useDebouncedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  delay = 300
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  const fetchData = useCallback((forceRefresh = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return new Promise<T | null>((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        const cache = cacheRef.current;
        const cached = cache.get(key);
        
        if (cached && !forceRefresh && Date.now() - cached.timestamp < CACHE_TTL) {
          setData(cached.data);
          resolve(cached.data);
          return;
        }

        setLoading(true);
        try {
          const result = await queryFnRef.current();
          
          // Enforce cache size limit
          if (cache.size >= MAX_CACHE_SIZE) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey) cache.delete(oldestKey);
          }
          
          cache.set(key, { data: result, timestamp: Date.now(), key });
          setData(result);
          resolve(result);
        } catch (error) {
          logger.error("Debounced query failed", { error: error instanceof Error ? error.message : String(error) });
          resolve(null);
        } finally {
          setLoading(false);
        }
      }, delay);
    });
  }, [key, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { data, loading, refetch: fetchData };
}
