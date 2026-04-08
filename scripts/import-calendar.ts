/**
 * Calendar import script: Parse Google Calendar .ics export and find concert events.
 *
 * Usage:
 *   npx tsx scripts/import-calendar.ts /path/to/calendar.ics
 *
 * Outputs:
 *   scripts/output/calendar-candidates.json — review and edit before importing
 *   After review: npx tsx scripts/import-calendar.ts --import
 */

import { config as loadEnv } from "dotenv";
import * as fs from "fs";
import * as path from "path";

loadEnv({ path: path.resolve(__dirname, "../.env.local") });

// ---------------------------------------------------------------------------
// Known concert venues (lowercase)
// ---------------------------------------------------------------------------

const KNOWN_VENUES: Record<string, { name: string; city: string; state: string; country: string }> = {
  "fillmore": { name: "The Fillmore", city: "San Francisco", state: "CA", country: "USA" },
  "warfield": { name: "The Warfield", city: "San Francisco", state: "CA", country: "USA" },
  "fox theater": { name: "Fox Theater", city: "Oakland", state: "CA", country: "USA" },
  "bill graham": { name: "Bill Graham Civic Auditorium", city: "San Francisco", state: "CA", country: "USA" },
  "great american music hall": { name: "Great American Music Hall", city: "San Francisco", state: "CA", country: "USA" },
  "the independent": { name: "The Independent", city: "San Francisco", state: "CA", country: "USA" },
  "bottom of the hill": { name: "Bottom of the Hill", city: "San Francisco", state: "CA", country: "USA" },
  "slim's": { name: "Slim's", city: "San Francisco", state: "CA", country: "USA" },
  "bimbo's": { name: "Bimbo's 365 Club", city: "San Francisco", state: "CA", country: "USA" },
  "mezzanine": { name: "Mezzanine", city: "San Francisco", state: "CA", country: "USA" },
  "public works": { name: "Public Works", city: "San Francisco", state: "CA", country: "USA" },
  "august hall": { name: "August Hall", city: "San Francisco", state: "CA", country: "USA" },
  "the midway": { name: "The Midway", city: "San Francisco", state: "CA", country: "USA" },
  "halcyon": { name: "Halcyon", city: "San Francisco", state: "CA", country: "USA" },
  "monarch": { name: "Monarch", city: "San Francisco", state: "CA", country: "USA" },
  "audio sf": { name: "Audio SF", city: "San Francisco", state: "CA", country: "USA" },
  "audio": { name: "Audio SF", city: "San Francisco", state: "CA", country: "USA" },
  "the chapel": { name: "The Chapel", city: "San Francisco", state: "CA", country: "USA" },
  "cafe du nord": { name: "Cafe Du Nord", city: "San Francisco", state: "CA", country: "USA" },
  "the regency": { name: "The Regency Ballroom", city: "San Francisco", state: "CA", country: "USA" },
  "swedish american hall": { name: "Swedish American Hall", city: "San Francisco", state: "CA", country: "USA" },
  "gray area": { name: "Gray Area", city: "San Francisco", state: "CA", country: "USA" },
  "dna lounge": { name: "DNA Lounge", city: "San Francisco", state: "CA", country: "USA" },
  "temple": { name: "Temple", city: "San Francisco", state: "CA", country: "USA" },
  "the grand": { name: "The Grand", city: "San Francisco", state: "CA", country: "USA" },
  "craneway pavilion": { name: "Craneway Pavilion", city: "Richmond", state: "CA", country: "USA" },
  "new parish": { name: "New Parish", city: "Oakland", state: "CA", country: "USA" },
  "starline social club": { name: "Starline Social Club", city: "Oakland", state: "CA", country: "USA" },
  "greek theatre": { name: "Greek Theatre", city: "Berkeley", state: "CA", country: "USA" },
  "frost amphitheater": { name: "Frost Amphitheater", city: "Stanford", state: "CA", country: "USA" },
  "mountain winery": { name: "Mountain Winery", city: "Saratoga", state: "CA", country: "USA" },
  "chase center": { name: "Chase Center", city: "San Francisco", state: "CA", country: "USA" },
  "stern grove": { name: "Stern Grove", city: "San Francisco", state: "CA", country: "USA" },
  "rickshaw stop": { name: "Rickshaw Stop", city: "San Francisco", state: "CA", country: "USA" },
  "1015 folsom": { name: "1015 Folsom", city: "San Francisco", state: "CA", country: "USA" },
  "the great northern": { name: "The Great Northern", city: "San Francisco", state: "CA", country: "USA" },
};

// Words that strongly suggest NOT a concert
const EXCLUDE_PATTERNS = [
  /\b(doctor|dentist|pt with|health visit|blood test|dxa|chiropract)/i,
  /\b(bike|cycling|ride|bicycle|velodrome|criterium|sprint)/i,
  /\b(yoga|climbing|lift|crossfit|gym|workout|run\b|5k|marathon)/i,
  /\b(conference|workshop|meetup|hackathon|talk|panel|keynote|webinar|summit)/i,
  /\b(flight|airport|dfw|sfo|lax|jfk|airbnb|hotel|check.?in|check.?out)/i,
  /\b(dinner|lunch|brunch|breakfast|coffee with|tea with|happy hour|potluck)/i,
  /\b(birthday|baby shower|wedding|anniversary party|housewarming)/i,
  /\b(buy ticket|pick up|scout ticket|wristband)/i,
  /\b(book club|movie|film|screening|reading)/i,
  /\b(volunteer|board meeting|committee)/i,
  /\b(tour de fat|bike to|critical mass)/i,
  /\b(zoom\.us|meet\.google)/i,
];

// ---------------------------------------------------------------------------
// ICS Parser
// ---------------------------------------------------------------------------

interface CalEvent {
  summary: string;
  location: string;
  description: string;
  date: string;
}

function parseIcs(raw: string): CalEvent[] {
  return raw.split("BEGIN:VEVENT").slice(1).map((block) => {
    const lines = block.split("\n");
    const obj: Record<string, string> = {};
    let currentKey = "";
    for (const line of lines) {
      if (line.startsWith(" ") || line.startsWith("\t")) {
        if (currentKey) obj[currentKey] += line.slice(1);
        continue;
      }
      const match = line.match(/^([A-Z\-;=]+?):(.*)/);
      if (match) {
        const key = match[1].split(";")[0];
        currentKey = key;
        obj[key] = (obj[key] ? obj[key] + " | " : "") + match[2].trim();
      }
    }

    const dateRaw = obj.DTSTART || "";
    const dateMatch = dateRaw.match(/(\d{4})(\d{2})(\d{2})/);
    const date = dateMatch
      ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
      : "";

    return {
      summary: (obj.SUMMARY || "").replace(/\\n/g, " ").replace(/\\/g, ""),
      location: (obj.LOCATION || "").replace(/\\n/g, ", ").replace(/\\/g, ""),
      description: (obj.DESCRIPTION || "").replace(/\\n/g, " ").replace(/\\/g, ""),
      date,
    };
  });
}

// ---------------------------------------------------------------------------
// Concert detection
// ---------------------------------------------------------------------------

interface Candidate {
  date: string;
  artist: string;
  venue: string;
  city: string;
  state: string;
  country: string;
  confidence: "high" | "medium" | "low";
  calendarSummary: string;
  calendarLocation: string;
  include: boolean;
}

function detectVenue(
  location: string
): { name: string; city: string; state: string; country: string } | null {
  const lower = location.toLowerCase();
  for (const [key, venue] of Object.entries(KNOWN_VENUES)) {
    if (lower.includes(key)) return venue;
  }
  return null;
}

function isLikelyConcert(event: CalEvent): boolean {
  const allText = `${event.summary} ${event.location} ${event.description}`;
  // Exclude obvious non-concerts
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(allText)) return false;
  }
  return true;
}

function extractArtist(summary: string): string {
  // Strip common prefixes/suffixes
  let artist = summary
    .replace(/\s*\(?\d+ tix\)?/gi, "")
    .replace(/\s*\(\d+ tickets?\)/gi, "")
    .replace(/\s*at\s+.+$/i, "")
    .replace(/\s*@\s+.+$/i, "")
    .replace(/\s*-\s*(Live|DJ Set|Tour|World Tour|US Tour).*$/i, "")
    .replace(/\s*\((Live|DJ Set|DJ|A\/V Set|2 tix)\)/gi, "")
    .replace(/\s*\|\s*.+$/, "")
    .trim();

  return artist;
}

function findCandidates(events: CalEvent[]): Candidate[] {
  const candidates: Candidate[] = [];

  for (const event of events) {
    if (!event.date) continue;
    if (!isLikelyConcert(event)) continue;

    const venue = detectVenue(event.location);
    if (!venue) continue; // Only include events at known concert venues

    const artist = extractArtist(event.summary);
    if (!artist || artist.length < 2) continue;

    // Skip if it looks like a non-music event at a venue
    const lowerSummary = event.summary.toLowerCase();
    if (
      lowerSummary.includes("party") && !lowerSummary.includes("after party") ||
      lowerSummary.includes("meetup") ||
      lowerSummary.includes("expo") ||
      lowerSummary.includes("opening") ||
      lowerSummary.includes("reddit") ||
      lowerSummary.includes("nerd nite") ||
      lowerSummary.includes("odd salon") ||
      lowerSummary.includes("nightlife") ||
      lowerSummary.includes("one medical") ||
      lowerSummary.includes("forwardjs") ||
      lowerSummary.includes("spec:")
    ) continue;

    const confidence = "medium";

    candidates.push({
      date: event.date,
      artist,
      venue: venue.name,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      confidence,
      calendarSummary: event.summary,
      calendarLocation: event.location,
      include: true,
    });
  }

  // Deduplicate by date + artist (keep first)
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = `${c.date}|${c.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Load existing shows to avoid duplicates
// ---------------------------------------------------------------------------

function loadExistingShows(): Set<string> {
  const ndjsonPath = path.resolve(__dirname, "output/sanity-import.ndjson");
  if (!fs.existsSync(ndjsonPath)) return new Set();

  const lines = fs.readFileSync(ndjsonPath, "utf-8").split("\n").filter(Boolean);
  const keys = new Set<string>();
  for (const line of lines) {
    const doc = JSON.parse(line);
    if (doc._type === "show" && doc.date) {
      // Use date as a rough dedup key (could be smarter)
      keys.add(doc.date);
    }
  }
  return keys;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const icsPath = process.argv[2];
  if (!icsPath) {
    console.error("Usage: npx tsx scripts/import-calendar.ts /path/to/calendar.ics");
    process.exit(1);
  }

  console.log("Parsing calendar...");
  const raw = fs.readFileSync(icsPath, "utf-8");
  const events = parseIcs(raw);
  console.log(`Total events: ${events.length}`);

  const candidates = findCandidates(events);
  console.log(`Concert candidates: ${candidates.length}`);

  // Filter: skip pre-2022 events that are already imported, keep pre-2022 only if new
  const existing = loadExistingShows();
  const newCandidates = candidates.filter((c) => {
    const isDuplicate = existing.has(c.date);
    const isPre2022 = c.date < "2022-01-01";
    // Pre-2022: only include if it's a date we DON'T already have
    if (isPre2022 && isDuplicate) return false;
    // Post-2022: skip exact date duplicates too
    if (!isPre2022 && isDuplicate) return false;
    return true;
  });
  const alreadyImported = candidates.length - newCandidates.length;

  console.log(`Already imported: ${alreadyImported}`);
  console.log(`New candidates: ${newCandidates.length}`);

  // Sort by date
  newCandidates.sort((a, b) => a.date.localeCompare(b.date));

  // Write for review
  const outPath = path.resolve(__dirname, "output/calendar-candidates.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(newCandidates, null, 2), "utf-8");

  console.log(`\nWritten to ${outPath}`);
  console.log("\nReview the file, set \"include\": false for non-concerts, then run:");
  console.log("  npx tsx scripts/import-reviewed-calendar.ts");
  console.log("\nPreview:");
  for (const c of newCandidates) {
    console.log(
      `  ${c.date} | ${c.artist.padEnd(40)} | ${c.venue}`
    );
  }
}

main();
