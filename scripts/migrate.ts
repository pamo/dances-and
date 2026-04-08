/**
 * Migration script: Markdown posts → Sanity NDJSON
 *
 * Usage:
 *   npx tsx scripts/migrate.ts
 *
 * Outputs:
 *   scripts/output/sanity-import.ndjson  — ready for `sanity dataset import`
 *
 * Requires LASTFM_API_KEY in .env.local (or environment).
 */

import { config as loadEnv } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import matter from "gray-matter";

loadEnv({ path: path.resolve(__dirname, "../.env.local") });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const POSTS_DIR = path.resolve(__dirname, "../../posts");
const OUTPUT_DIR = path.resolve(__dirname, "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "sanity-import.ndjson");

const LASTFM_API_KEY =
  process.env.LASTFM_API_KEY ?? "";
const LASTFM_DELAY_MS = 250; // rate-limit politeness

// Manual genre overrides for artists Last.fm can't match (special chars, etc.)
const GENRE_OVERRIDES: Record<string, string[]> = {
  "Florence + the Machine": ["indie pop", "rock", "alternative", "british"],
  "RÜFÜS DU SOL": ["electronic", "house", "indie dance", "alternative dance"],
  "Fred Again...": ["electronic", "house", "uk garage", "dance"],
  "Ladies of LCD Soundsystem": ["electronic", "dance", "dj set"],
  "Vito Roccoforte (of The Rapture)": ["electronic", "dance punk", "dj set"],
  "We Are Lo&t": ["electronic", "trance", "progressive house"],
  "Nick Murphy / Chet Faker": ["downtempo", "electronic", "soul", "lo-fi"],
  "Kiefer Shackelford": ["jazz", "hip-hop", "beats", "instrumental"],
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Frontmatter {
  date: string;
  artist: string;
  artists?: string[];
  venue: string;
  city: string;
  state: string;
  country: string;
  price: string;
  solo: string;
  festival?: string;
  genre?: string;
  tags?: string[];
  openers?: string[];
  title: string;
  slug: string;
  cover?: string;
  category?: string;
  created?: string;
}

interface SanityDoc {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeId(type: string, name: string): string {
  return `${type}-${slugify(name)}`;
}

function parsePrice(raw: string): number | null {
  if (!raw || raw === "unknown") return null;
  const cleaned = raw.replace(/[$,]/g, "").trim();
  if (cleaned === "free" || cleaned === "0" || cleaned === "0.00") return 0;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return Math.round(num * 100);
}

function parseSolo(raw: string | undefined): boolean {
  if (!raw) return false;
  const lower = raw.toLowerCase().trim();
  return lower === "yes" || lower === "y";
}

// ---------------------------------------------------------------------------
// Last.fm genre fetching
// ---------------------------------------------------------------------------

const genreCache = new Map<string, string[]>();

async function fetchGenresFromLastFm(artistName: string): Promise<string[]> {
  // Check manual overrides first
  if (GENRE_OVERRIDES[artistName]) return GENRE_OVERRIDES[artistName];

  if (!LASTFM_API_KEY) return [];

  const cached = genreCache.get(artistName.toLowerCase());
  if (cached) return cached;

  try {
    const url = new URL("https://ws.audioscrobbler.com/2.0/");
    url.searchParams.set("method", "artist.getTopTags");
    url.searchParams.set("artist", artistName);
    url.searchParams.set("api_key", LASTFM_API_KEY);
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.warn(`  Last.fm ${res.status} for "${artistName}"`);
      return [];
    }

    const data = await res.json();
    const tags: { name: string; count: number }[] =
      data?.toptags?.tag ?? [];

    // Take top 5 tags with count > 10, normalize to lowercase
    const genres = tags
      .filter((t) => t.count > 10)
      .slice(0, 5)
      .map((t) => t.name.toLowerCase());

    genreCache.set(artistName.toLowerCase(), genres);

    await new Promise((r) => setTimeout(r, LASTFM_DELAY_MS));
    return genres;
  } catch (err) {
    console.warn(`  Last.fm error for "${artistName}":`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Scanning posts in", POSTS_DIR);

  const postDirs = fs
    .readdirSync(POSTS_DIR)
    .filter((d) =>
      fs.statSync(path.join(POSTS_DIR, d)).isDirectory()
    );

  console.log(`Found ${postDirs.length} posts\n`);

  // Collect unique entities
  const artistMap = new Map<string, SanityDoc>();
  const venueMap = new Map<string, SanityDoc>();
  const festivalMap = new Map<string, SanityDoc>();
  const shows: SanityDoc[] = [];

  // First pass: collect all unique artists (including openers)
  const allArtistNames = new Set<string>();

  for (const dir of postDirs) {
    const mdPath = path.join(POSTS_DIR, dir, "index.md");
    if (!fs.existsSync(mdPath)) continue;

    const raw = fs.readFileSync(mdPath, "utf-8");
    const { data } = matter(raw) as { data: Frontmatter };

    // Main artist
    const mainArtist = data.artist?.trim();
    if (mainArtist) allArtistNames.add(mainArtist);

    // Artists array (sometimes has the main + extras)
    if (data.artists) {
      data.artists.forEach((a) => {
        const name = a?.trim();
        if (name) allArtistNames.add(name);
      });
    }

    // Openers
    if (data.openers) {
      data.openers.forEach((o) => {
        const name = o?.trim();
        if (name) allArtistNames.add(name);
      });
    }
  }

  console.log(`Found ${allArtistNames.size} unique artists. Fetching genres from Last.fm...\n`);

  // Fetch genres for all artists
  const artistGenres = new Map<string, string[]>();
  let i = 0;
  for (const name of allArtistNames) {
    i++;
    process.stdout.write(`  [${i}/${allArtistNames.size}] ${name}...`);
    const genres = await fetchGenresFromLastFm(name);
    artistGenres.set(name, genres);
    console.log(genres.length > 0 ? ` ${genres.join(", ")}` : " (no genres)");
  }

  console.log("\nBuilding Sanity documents...\n");

  // Second pass: build documents
  for (const dir of postDirs) {
    const mdPath = path.join(POSTS_DIR, dir, "index.md");
    if (!fs.existsSync(mdPath)) continue;

    const raw = fs.readFileSync(mdPath, "utf-8");
    const { data } = matter(raw) as { data: Frontmatter };

    const artistName = data.artist?.trim();
    if (!artistName) {
      console.warn(`  Skipping ${dir}: no artist`);
      continue;
    }

    // Artist doc
    const artistId = makeId("artist", artistName);
    if (!artistMap.has(artistId)) {
      artistMap.set(artistId, {
        _id: artistId,
        _type: "artist",
        name: artistName,
        slug: { _type: "slug", current: slugify(artistName) },
        genres: artistGenres.get(artistName) ?? [],
      });
    }

    // Opener artist docs
    const openerRefs: { _type: string; _ref: string; _key: string }[] = [];
    if (data.openers) {
      for (const opener of data.openers) {
        const name = opener?.trim();
        if (!name) continue;
        const openerId = makeId("artist", name);
        if (!artistMap.has(openerId)) {
          artistMap.set(openerId, {
            _id: openerId,
            _type: "artist",
            name,
            slug: { _type: "slug", current: slugify(name) },
            genres: artistGenres.get(name) ?? [],
          });
        }
        openerRefs.push({
          _type: "reference",
          _ref: openerId,
          _key: slugify(name),
        });
      }
    }

    // Venue doc
    const venueName = data.venue?.trim();
    const venueId = makeId("venue", venueName);
    if (!venueMap.has(venueId)) {
      venueMap.set(venueId, {
        _id: venueId,
        _type: "venue",
        name: venueName,
        slug: { _type: "slug", current: slugify(venueName) },
        city: data.city?.trim() ?? "",
        state: data.state?.trim() ?? "",
        country: data.country?.trim() ?? "",
      });
    }

    // Festival doc
    let festivalRef: { _type: string; _ref: string } | undefined;
    const festivalName = data.festival?.trim();
    if (festivalName) {
      const festivalId = makeId("festival", festivalName);
      if (!festivalMap.has(festivalId)) {
        festivalMap.set(festivalId, {
          _id: festivalId,
          _type: "festival",
          name: festivalName,
          slug: { _type: "slug", current: slugify(festivalName) },
        });
      }
      festivalRef = { _type: "reference", _ref: festivalId };
    }

    // Show doc
    const showSlug = data.slug?.trim() || slugify(data.title || dir);
    const showId = makeId("show", showSlug);

    const showDoc: SanityDoc = {
      _id: showId,
      _type: "show",
      title: data.title?.trim() ?? `${artistName} at ${venueName}`,
      slug: { _type: "slug", current: showSlug },
      date: data.date,
      artist: { _type: "reference", _ref: artistId },
      venue: { _type: "reference", _ref: venueId },
      priceCents: parsePrice(data.price),
      solo: parseSolo(data.solo),
      tags: (data.tags ?? []).filter((t) => t && t.length > 0),
    };

    if (festivalRef) {
      showDoc.festival = festivalRef;
    }

    if (openerRefs.length > 0) {
      showDoc.openers = openerRefs;
    }

    shows.push(showDoc);
  }

  // Write NDJSON
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allDocs: SanityDoc[] = [
    ...artistMap.values(),
    ...venueMap.values(),
    ...festivalMap.values(),
    ...shows,
  ];

  const ndjson = allDocs.map((doc) => JSON.stringify(doc)).join("\n");
  fs.writeFileSync(OUTPUT_FILE, ndjson, "utf-8");

  console.log(`Written ${allDocs.length} documents to ${OUTPUT_FILE}`);
  console.log(`  Artists:   ${artistMap.size}`);
  console.log(`  Venues:    ${venueMap.size}`);
  console.log(`  Festivals: ${festivalMap.size}`);
  console.log(`  Shows:     ${shows.length}`);
  console.log(
    `\nTo import: npx sanity dataset import ${OUTPUT_FILE} production`
  );
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
