import "server-only";

import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

/**
 * Write-capable Sanity client for server-side mutations (API routes only).
 *
 * Uses SANITY_API_TOKEN and never the CDN. `client.create(...)` writes a
 * published document directly (an _id without a `drafts.` prefix), so there
 * is no separate publish step. Keep this out of client components — the
 * `server-only` import will error if it's ever bundled for the browser.
 */
export const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});
