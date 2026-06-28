"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export function useCachedQuery<T>(key: string, queryFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const fetchData = useCallback(async (forceRefresh = false) => {
    const cache = cacheRef.current;
    const cached = cache.get(key);
    
    if (cached && !forceRefresh && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    try {
      const result = await queryFn();
      cache.set(key, { data: result, timestamp: Date.now(), key });
      setData(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, [key, queryFn]);

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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const fetchData = useCallback((forceRefresh = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    return new Promise<T>((resolve) => {
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
          const result = await queryFn();
          cache.set(key, { data: result, timestamp: Date.now(), key });
          setData(result);
          resolve(result);
} catch {
           resolve(null as T);
         } finally {
          setLoading(false);
        }
      }, delay);
    });
  }, [key, queryFn, delay]);

  return { data, loading, refetch: fetchData };
}