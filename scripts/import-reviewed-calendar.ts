/**
 * Import reviewed calendar candidates into Sanity NDJSON.
 *
 * Usage:
 *   npx tsx scripts/import-reviewed-calendar.ts
 *
 * Reads:  scripts/output/calendar-candidates.json (reviewed, include=true)
 * Outputs: scripts/output/calendar-import.ndjson
 */

import { config as loadEnv } from "dotenv";
import * as fs from "fs";
import * as path from "path";

loadEnv({ path: path.resolve(__dirname, "../.env.local") });

const LASTFM_API_KEY = process.env.LASTFM_API_KEY ?? "";
const LASTFM_DELAY_MS = 250;
const OUTPUT_FILE = path.resolve(__dirname, "output/calendar-import.ndjson");

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

/** Strip venue/location remnants and noise from an artist name */
function cleanArtistName(name: string): string {
  return name
    // "ARTIST at VENUE" or "ARTIST @ VENUE"
    .replace(/\s+(?:at|@)\s+.*$/i, "")
    // "(user confirmed...)" or "(2 tix)" etc.
    .replace(/\s*\([^)]*$/, "")  // unclosed paren
    .replace(/\s*\([^)]*\)\s*$/g, "")
    // Trailing punctuation
    .replace(/[\s!]+$/, "")
    // "ARTIST live at Popscene!" etc.
    .replace(/\s+live\b.*$/i, "")
    .trim();
}

// Artist names that contain "&" and should NOT be split
const COMPOUND_ARTISTS = new Set([
  "matt & kim",
  "toro y moi",
  "peter bjorn and john",
  "death from above 1979",
  "florence + the machine",
  "mumford & sons",
  "simon & garfunkel",
]);

/** Split a calendar summary into headliner + openers */
function splitArtists(raw: string): { headliner: string; openers: string[] } {
  // Handle !!! (Chk Chk Chk) specially — the parens/punctuation confuse everything
  if (/^!!!\s*(\(Chk Chk Chk\))?/i.test(raw)) {
    return { headliner: "!!!", openers: [] };
  }

  // Clean up common suffixes/prefixes
  let cleaned = raw
    // Strip trailing tour/set info after dash
    .replace(/\s*[-–]\s*(Live|DJ Set|DJ sets?|A\/V Set|Tour|World Tour|US Tour|Fragments Live Tour|R\.Y\.C World Tour.*|"[^"]*"|Elka\b.*|2\s*tickets?).*$/i, "")
    // Strip parenthetical notes
    .replace(/\s*\((Live|DJ Set|DJ|A\/V Set|2 tix|dj set)\)/gi, "")
    // Strip "DJ set" / "DJ Set" at end (case insensitive)
    .replace(/\s+DJ\s+set$/i, "")
    // Strip ": SUBTITLE" but not if followed by "SF w/" (Club Called Rhonda pattern)
    .replace(/:\s+(?!SF\b).*$/i, "")
    .replace(/\s*\d+\s*tix\b/gi, "")
    .replace(/\s*\d+\s*tickets?\b/gi, "")
    // Special case: 1-800 Dinosaur prefix
    .replace(/^1-800 Dinosaur \(DJ sets by\s*/i, "")
    .replace(/\)$/, "")
    // Event wrapper prefixes
    .replace(/^Popscene Indie Disco[^.]*feat\.?\s*/i, "")
    .replace(/^A Club Called Rhonda:\s*SF\s*/i, "")
    .replace(/Outside Lands Night Show/i, "")
    .replace(/Portola After Party/i, "")
    .replace(/~[^~]*~/g, "")
    // "Nick Murphy fka Chet Faker with Beacon" → "Nick Murphy with Beacon"
    .replace(/\bfka\s+\S+(\s+\S+)?/i, "")
    .trim();

  // Replace word separators with "+" for splitting, but protect compound artist names
  // Check compound against the cleaned name AND after stripping "at VENUE"
  const nameOnly = cleaned.replace(/\s+(?:at|@)\s+.*$/i, "").trim();
  const isCompound = COMPOUND_ARTISTS.has(cleaned.toLowerCase()) || COMPOUND_ARTISTS.has(nameOnly.toLowerCase());

  if (!isCompound) {
    cleaned = cleaned
      .replace(/\bplus\b/gi, "+")
      .replace(/\bfeat\.?\b/gi, "+")
      .replace(/\bw\/\s*/gi, "+ ")
      .replace(/\bwith\b/gi, "+")
      // Split & but not for compound names — check each & occurrence
      .replace(/\s+&\s+/g, (match, offset) => {
        // Check if the text around this & forms a compound artist
        const before = cleaned.slice(0, offset).trim().split(/[+,]/).pop()?.trim() ?? "";
        const after = cleaned.slice(offset + match.length).trim().split(/[+,]/)[0]?.trim() ?? "";
        const combined = `${before} & ${after}`.toLowerCase();
        if (COMPOUND_ARTISTS.has(combined)) return match;
        return " + ";
      })
      // Split "and" but not in compound names
      .replace(/\band\b/gi, (match, offset) => {
        const before = cleaned.slice(0, offset).trim().split(/[+,]/).pop()?.trim() ?? "";
        const after = cleaned.slice(offset + match.length).trim().split(/[+,]/)[0]?.trim() ?? "";
        const combined = `${before} and ${after}`.toLowerCase();
        if (COMPOUND_ARTISTS.has(combined)) return match;
        return "+";
      });
  }

  // Split on + or ,
  const allParts = cleaned
    .split(/\s*[+,]\s*/)
    .map((s) => s.replace(/^-\s*/, "").trim()) // strip leading dashes
    .filter((s) => s.length > 1 && !/^special guests!?$/i.test(s));

  if (allParts.length === 0) return { headliner: raw.trim(), openers: [] };

  return {
    headliner: allParts[0],
    openers: allParts.slice(1),
  };
}

// ---------------------------------------------------------------------------
// Last.fm
// ---------------------------------------------------------------------------

const genreCache = new Map<string, string[]>();

async function fetchGenres(artistName: string): Promise<string[]> {
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
    if (!res.ok) return [];

    const data = await res.json();
    const tags: { name: string; count: number }[] = data?.toptags?.tag ?? [];
    const genres = tags
      .filter((t) => t.count > 10)
      .slice(0, 5)
      .map((t) => t.name.toLowerCase());

    genreCache.set(artistName.toLowerCase(), genres);
    await new Promise((r) => setTimeout(r, LASTFM_DELAY_MS));
    return genres;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Load existing docs to avoid ID collisions
// ---------------------------------------------------------------------------

function loadExistingIds(): Set<string> {
  const ndjsonPath = path.resolve(__dirname, "output/sanity-import.ndjson");
  if (!fs.existsSync(ndjsonPath)) return new Set();
  return new Set(
    fs.readFileSync(ndjsonPath, "utf-8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l)._id)
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

interface Candidate {
  date: string;
  artist: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  include: boolean;
  isFestival?: boolean;
  calendarSummary: string;
}

interface SanityDoc {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

async function main() {
  const candidatesPath = path.resolve(__dirname, "output/calendar-candidates.json");
  const candidates: Candidate[] = JSON.parse(fs.readFileSync(candidatesPath, "utf-8"));
  const included = candidates.filter((c) => c.include);

  console.log(`Processing ${included.length} candidates...\n`);

  const existingIds = loadExistingIds();
  const artistDocs = new Map<string, SanityDoc>();
  const venueDocs = new Map<string, SanityDoc>();
  const festivalDocs = new Map<string, SanityDoc>();
  const showDocs: SanityDoc[] = [];

  // Collect all unique artist names first for genre fetching
  const allArtistNames = new Set<string>();
  for (const c of included) {
    if (c.isFestival) continue;
    const { headliner, openers } = splitArtists(c.calendarSummary);
    allArtistNames.add(cleanArtistName(headliner));
    openers.forEach((o) => allArtistNames.add(cleanArtistName(o)));
  }

  console.log(`Fetching genres for ${allArtistNames.size} artists...\n`);
  const artistGenres = new Map<string, string[]>();
  let i = 0;
  for (const name of allArtistNames) {
    i++;
    process.stdout.write(`  [${i}/${allArtistNames.size}] ${name}...`);
    const genres = await fetchGenres(name);
    artistGenres.set(name, genres);
    console.log(genres.length > 0 ? ` ${genres.join(", ")}` : " (no genres)");
  }

  console.log("\nBuilding documents...\n");

  for (const c of included) {
    // Skip festivals as standalone — they need individual artist entries
    if (c.isFestival) {
      const festId = makeId("festival", c.artist);
      if (!festivalDocs.has(festId)) {
        festivalDocs.set(festId, {
          _id: festId,
          _type: "festival",
          name: c.artist,
          slug: { _type: "slug", current: slugify(c.artist) },
        });
      }
      // Also create venue
      if (c.venue) {
        const venueId = makeId("venue", c.venue);
        if (!venueDocs.has(venueId)) {
          venueDocs.set(venueId, {
            _id: venueId,
            _type: "venue",
            name: c.venue,
            slug: { _type: "slug", current: slugify(c.venue) },
            city: c.city,
            state: c.state,
            country: c.country,
          });
        }
      }
      continue;
    }

    const { headliner: rawHeadliner, openers: rawOpeners } = splitArtists(c.calendarSummary);
    const headliner = cleanArtistName(rawHeadliner);
    const openers = rawOpeners.map(cleanArtistName).filter((n) => n.length > 1);

    // Artist docs
    const artistId = makeId("artist", headliner);
    if (!artistDocs.has(artistId) && !existingIds.has(artistId)) {
      artistDocs.set(artistId, {
        _id: artistId,
        _type: "artist",
        name: headliner,
        slug: { _type: "slug", current: slugify(headliner) },
        genres: artistGenres.get(headliner) ?? [],
      });
    }

    const openerRefs: { _type: string; _ref: string; _key: string }[] = [];
    for (const opener of openers) {
      const openerId = makeId("artist", opener);
      if (!artistDocs.has(openerId) && !existingIds.has(openerId)) {
        artistDocs.set(openerId, {
          _id: openerId,
          _type: "artist",
          name: opener,
          slug: { _type: "slug", current: slugify(opener) },
          genres: artistGenres.get(opener) ?? [],
        });
      }
      openerRefs.push({
        _type: "reference",
        _ref: openerId,
        _key: slugify(opener),
      });
    }

    // Venue doc
    let venueId: string | undefined;
    if (c.venue) {
      venueId = makeId("venue", c.venue);
      if (!venueDocs.has(venueId) && !existingIds.has(venueId)) {
        venueDocs.set(venueId, {
          _id: venueId,
          _type: "venue",
          name: c.venue,
          slug: { _type: "slug", current: slugify(c.venue) },
          city: c.city,
          state: c.state,
          country: c.country,
        });
      }
    }

    // Show doc
    const showSlug = `${c.date}-${slugify(headliner)}`;
    const showId = makeId("show", showSlug);

    const showDoc: SanityDoc = {
      _id: showId,
      _type: "show",
      title: `${headliner} at ${c.venue || "Unknown"}`,
      slug: { _type: "slug", current: showSlug },
      date: c.date,
      artist: { _type: "reference", _ref: artistId },
      priceCents: null,
      solo: false,
      tags: [],
    };

    if (venueId) {
      showDoc.venue = { _type: "reference", _ref: venueId };
    }

    if (openerRefs.length > 0) {
      showDoc.openers = openerRefs;
    }

    showDocs.push(showDoc);
  }

  // Write NDJSON
  const allDocs: SanityDoc[] = [
    ...artistDocs.values(),
    ...venueDocs.values(),
    ...festivalDocs.values(),
    ...showDocs,
  ];

  const ndjson = allDocs.map((doc) => JSON.stringify(doc)).join("\n");
  fs.writeFileSync(OUTPUT_FILE, ndjson, "utf-8");

  console.log(`Written ${allDocs.length} documents to ${OUTPUT_FILE}`);
  console.log(`  New artists:   ${artistDocs.size}`);
  console.log(`  New venues:    ${venueDocs.size}`);
  console.log(`  New festivals: ${festivalDocs.size}`);
  console.log(`  New shows:     ${showDocs.length}`);
  console.log(
    `\nTo import: npx sanity dataset import ${OUTPUT_FILE} --dataset production --replace`
  );
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
