"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { logger } from "@/lib/logger";

interface OptimisticUpdateOptions<T> {
  onMutate: (current: T[], optimistic: T) => T[];
  onError: (error: unknown, optimistic: T, previous: T[]) => void;
  onSettled?: () => void;
}

export function useOptimisticUpdate<T extends { id: string }>(
  initialData: T[] = [],
  options: OptimisticUpdateOptions<T>
) {
  const [data, setData] = useState<T[]>(initialData);
  const [isPending, setIsPending] = useState(false);
  const previousDataRef = useRef<T[]>(initialData);
  const dataRef = useRef<T[]>(initialData);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const mutate = useCallback(
    async (optimistic: T, action: () => Promise<T | null>) => {
      previousDataRef.current = dataRef.current;

      setData((current) => options.onMutate(current, optimistic));
      setIsPending(true);

      try {
        const result = await action();
        if (result) {
          setData((current) =>
            current.map((item) => (item.id === result.id ? result : item))
          );
        }
      } catch (error) {
        logger.error("Optimistic update failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        setData(previousDataRef.current);
        options.onError(error, optimistic, previousDataRef.current);
      } finally {
        setIsPending(false);
        options.onSettled?.();
      }
    },
    [options]
  );

  const add = useCallback(
    async (item: T, action: () => Promise<T | null>) => {
      return mutate(item, async () => {
        const result = await action();
        return result ?? item;
      });
    },
    [mutate]
  );

  const update = useCallback(
    async (item: T, action: () => Promise<T | null>) => {
      return mutate(item, action);
    },
    [mutate]
  );

  const remove = useCallback(
    async (id: string, action: () => Promise<void>) => {
      const previous = dataRef.current;
      setIsPending(true);

      setData((current) => current.filter((item) => item.id !== id));

      try {
        await action();
      } catch (error) {
        logger.error("Remove failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        setData(previous);
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  const setDataDirectly = useCallback((newData: T[] | ((prev: T[]) => T[])) => {
    setData(newData);
  }, []);

  return {
    data,
    isPending,
    add,
    update,
    remove,
    setData: setDataDirectly,
  };
}
