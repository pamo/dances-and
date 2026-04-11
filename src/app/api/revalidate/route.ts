import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Sanity webhook endpoint to revalidate cached data.
 *
 * Set up a webhook in Sanity (sanity.io/manage → API → Webhooks):
 *   URL: https://dances-and.likescoffee.com/api/revalidate
 *   Secret: <same as SANITY_REVALIDATE_SECRET env var>
 *   Trigger on: Create, Update, Delete
 *   Filter: _type in ["show", "artist", "venue", "festival"]
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-sanity-webhook-secret");

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("sanity", "default");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
