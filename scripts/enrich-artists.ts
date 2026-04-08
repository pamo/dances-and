/**
 * Enriches artist documents with Last.fm URLs and genres.
 *
 * - Fills in lastfmUrl for artists missing it
 * - Fills in genres for artists with empty/missing genres
 * - Safe to run repeatedly — skips artists that already have both
 *
 * Usage:
 *   npx tsx scripts/enrich-artists.ts
 */

import { config as loadEnv } from "dotenv";
import * as path from "path";

loadEnv({ path: path.resolve(__dirname, "../.env.local") });

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

const LASTFM_API_KEY = process.env.LASTFM_API_KEY ?? "";
const DELAY_MS = 250;

async function fetchLastfmInfo(artistName: string): Promise<{
  url: string | null;
  genres: string[];
}> {
  if (!LASTFM_API_KEY) return { url: null, genres: [] };

  try {
    // Fetch artist info (URL)
    const infoParams = new URLSearchParams({
      method: "artist.getInfo",
      artist: artistName,
      api_key: LASTFM_API_KEY,
      format: "json",
    });
    const infoRes = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${infoParams.toString()}`
    );
    const infoData = infoRes.ok ? await infoRes.json() : null;
    const url = infoData?.artist?.url || null;

    // Fetch top tags (genres)
    const tagsParams = new URLSearchParams({
      method: "artist.getTopTags",
      artist: artistName,
      api_key: LASTFM_API_KEY,
      format: "json",
    });
    const tagsRes = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${tagsParams.toString()}`
    );
    const tagsData = tagsRes.ok ? await tagsRes.json() : null;
    const tags: { name: string; count: number }[] =
      tagsData?.toptags?.tag ?? [];
    const genres = tags
      .filter((t) => t.count > 10)
      .slice(0, 5)
      .map((t) => t.name.toLowerCase());

    await new Promise((r) => setTimeout(r, DELAY_MS));
    return { url, genres };
  } catch {
    return { url: null, genres: [] };
  }
}

async function main() {
  const artists = await client.fetch<
    {
      _id: string;
      name: string;
      lastfmUrl: string | null;
      genres: string[] | null;
    }[]
  >(
    `*[_type == "artist"] | order(name asc) { _id, name, lastfmUrl, genres }`
  );

  console.log(`Found ${artists.length} artists\n`);

  let urlUpdated = 0;
  let genreUpdated = 0;
  let skipped = 0;

  for (let i = 0; i < artists.length; i++) {
    const artist = artists[i];
    const needsUrl = !artist.lastfmUrl;
    const needsGenres =
      !artist.genres || artist.genres.length === 0;

    process.stdout.write(
      `  [${i + 1}/${artists.length}] ${artist.name}...`
    );

    if (!needsUrl && !needsGenres) {
      console.log(" complete, skipping");
      skipped++;
      continue;
    }

    const { url, genres } = await fetchLastfmInfo(artist.name);

    const patch: Record<string, unknown> = {};
    if (needsUrl && url) patch.lastfmUrl = url;
    if (needsGenres && genres.length > 0) patch.genres = genres;

    if (Object.keys(patch).length > 0) {
      await client.patch(artist._id).set(patch).commit();
      if (patch.lastfmUrl) urlUpdated++;
      if (patch.genres) genreUpdated++;
      const parts: string[] = [];
      if (patch.lastfmUrl) parts.push(`url`);
      if (patch.genres)
        parts.push(`genres: ${(patch.genres as string[]).join(", ")}`);
      console.log(` → ${parts.join(" + ")}`);
    } else {
      console.log(
        needsUrl || needsGenres ? " (not found on Last.fm)" : " skipped"
      );
    }
  }

  console.log(`\nDone.`);
  console.log(`  URLs added:    ${urlUpdated}`);
  console.log(`  Genres added:  ${genreUpdated}`);
  console.log(`  Already complete: ${skipped}`);
}

main().catch((err) => {
  console.error("Enrichment failed:", err);
  process.exit(1);
});
