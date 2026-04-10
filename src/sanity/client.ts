import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
});

/**
 * Cached fetch wrapper. Caches Sanity queries with a tag so they
 * can be revalidated on-demand via the /api/revalidate webhook.
 *
 * In dev: no caching (fresh data on every request).
 * In prod: cached indefinitely, revalidated when Sanity content changes.
 */
export async function cachedFetch<T>(
  query: string,
  params?: Record<string, unknown>,
  tags: string[] = ["sanity"],
): Promise<T> {
  return client.fetch<T>(query, params, {
    next: {
      tags,
      revalidate: process.env.NODE_ENV === "production" ? 3600 : 0,
    },
  });
}
