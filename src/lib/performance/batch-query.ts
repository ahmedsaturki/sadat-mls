import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

interface BatchQuery {
  table: string;
  select: string;
  filters?: Record<string, unknown>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

interface BatchResult<T> {
  data: T[] | null;
  error: string | null;
}

export async function executeBatchQueries(
  queries: BatchQuery[]
): Promise<BatchResult<unknown>[]> {
  const supabase = await createClient();

  const results = await Promise.allSettled(
    queries.map(async (query) => {
      let queryBuilder = supabase.from(query.table).select(query.select);

      if (query.filters) {
        for (const [key, value] of Object.entries(query.filters)) {
          if (value !== undefined && value !== null && value !== "") {
            queryBuilder = queryBuilder.eq(key, value);
          }
        }
      }

      if (query.order) {
        queryBuilder = queryBuilder.order(query.order.column, {
          ascending: query.order.ascending ?? false,
        });
      }

      if (query.limit) {
        queryBuilder = queryBuilder.limit(query.limit);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return data;
    })
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return { data: result.value, error: null };
    } else {
      const errorMessage =
        result.reason instanceof Error ? result.reason.message : "Unknown error";
      logger.error(`Batch query ${queries[index].table} failed`, { error: errorMessage });
      return { data: null, error: errorMessage };
    }
  });
}

export async function executeParallelQueries<T>(
  queryFns: Array<() => Promise<T>>
): Promise<(T | null)[]> {
  const results = await Promise.allSettled(queryFns.map((fn) => fn()));

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      const errorMessage =
        result.reason instanceof Error ? result.reason.message : "Unknown error";
      logger.error(`Parallel query ${index} failed`, { error: errorMessage });
      return null;
    }
  });
}
