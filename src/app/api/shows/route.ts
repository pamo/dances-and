import { NextRequest, NextResponse } from "next/server";

import { writeClient } from "@/sanity/lib/writeClient";

/**
 * Add a show from anywhere (Apple Shortcut, curl, webhook, …).
 *
 * Auth: send header `x-shows-secret: <SHOWS_API_SECRET>`.
 *
 * Body (JSON): who/where/when is required, the rest is optional.
 *   {
 *     "artist": "Chinese American Bear",   // required
 *     "venue":  "The Independent",         // required
 *     "date":   "2026-07-19",              // required, YYYY-MM-DD
 *     "price":  29.05,
 *     "solo":   false,
 *     "companions": true,                   // went with other people
 *     "openers":    ["Some Opener"],
 *     "tags":       ["indie"],
 *     "festival":   "Noise Pop",
 *     "notes":      "Encore was unreal.",
 *     "city":  "San Francisco",             // used only if the venue is new
 *     "state": "CA"
 *   }
 *
 * Artists, venues, openers, and festival are resolved by name (case-insensitive)
 * and created if they don't exist. The show is created and published live.
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Ref = { _type: "reference"; _ref: string };

/** Find a document of `type` by name (case-insensitive), or create it. */
async function resolveOrCreate(
  type: "artist" | "venue" | "festival",
  name: string,
  extraFields: Record<string, unknown> = {},
): Promise<Ref> {
  const trimmed = name.trim();
  const existing = await writeClient.fetch<string | null>(
    `*[_type == $type && lower(name) == lower($name)][0]._id`,
    { type, name: trimmed },
  );
  if (existing) return { _type: "reference", _ref: existing };

  const slug = slugify(trimmed);
  const created = await writeClient.createIfNotExists({
    _id: `${type}-${slug}`,
    _type: type,
    name: trimmed,
    slug: { _type: "slug", current: slug },
    ...extraFields,
  });
  return { _type: "reference", _ref: created._id };
}

/**
 * Parse JSON that may be wrapped in markdown code fences or surrounded by
 * prose (common with on-device / Private Cloud Compute model output).
 * Returns null if no valid JSON object can be recovered.
 */
function parseLooseJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  let t = text.trim();
  // Strip a leading/trailing ```json … ``` (or plain ```) fence.
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  // If there's surrounding prose, slice to the outermost { … }.
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) t = t.slice(start, end + 1);
  try {
    const parsed = JSON.parse(t);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-shows-secret") !== process.env.SHOWS_API_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // On-device / PCC models often wrap JSON in ```json fences or add a
  // sentence, so parse leniently rather than requiring strict JSON.
  const raw = await req.text();
  const body = parseLooseJson(raw);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid JSON body", received: raw.slice(0, 300) },
      { status: 400 },
    );
  }

  const artist = typeof body.artist === "string" ? body.artist.trim() : "";
  const venue = typeof body.venue === "string" ? body.venue.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";

  if (!artist || !venue || !date) {
    return NextResponse.json(
      { error: "artist, venue, and date are required" },
      { status: 400 },
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return NextResponse.json(
      { error: "date must be a valid YYYY-MM-DD string" },
      { status: 400 },
    );
  }

  try {
    // Resolve references (create the artist/venue/festival/openers as needed).
    const [artistRef, venueRef] = await Promise.all([
      resolveOrCreate("artist", artist),
      resolveOrCreate("venue", venue, {
        ...(typeof body.city === "string" ? { city: body.city.trim() } : {}),
        ...(typeof body.state === "string" ? { state: body.state.trim() } : {}),
      }),
    ]);

    const openerNames = asStringArray(body.openers);
    const openerRefs = await Promise.all(
      openerNames.map((n) => resolveOrCreate("artist", n)),
    );

    const festivalRef =
      typeof body.festival === "string" && body.festival.trim()
        ? await resolveOrCreate("festival", body.festival)
        : undefined;

    // Build and publish the show.
    const title = `${artist} at ${venue}`;
    const show: { _type: "show"; [key: string]: unknown } = {
      _type: "show",
      date,
      artist: artistRef,
      venue: venueRef,
      title,
      slug: { _type: "slug", current: slugify(`${date}-${artist}`) },
    };

    if (typeof body.price === "number") show.price = body.price;
    if (typeof body.solo === "boolean") show.solo = body.solo;
    if (typeof body.companions === "boolean") show.companions = body.companions;
    if (typeof body.notes === "string" && body.notes.trim())
      show.notes = body.notes.trim();
    if (festivalRef) show.festival = festivalRef;
    if (openerRefs.length)
      show.openers = openerRefs.map((r, i) => ({ ...r, _key: `opener-${i}` }));

    const tags = asStringArray(body.tags);
    if (tags.length) show.tags = tags;

    const created = await writeClient.create(show);

    return NextResponse.json({
      ok: true,
      id: created._id,
      title,
      date,
      slug: (show.slug as { current: string }).current,
    });
  } catch (err) {
    console.error("Failed to add show:", err);
    return NextResponse.json(
      { error: "Failed to add show", detail: String(err) },
      { status: 500 },
    );
  }
}
