import { cachedFetch } from "@/sanity/client";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Venues" };

type VenueWithShows = {
  _id: string;
  name: string;
  slug: { current: string };
  city: string;
  state: string;
  shows: { date: string; festival: { _ref: string } | null }[];
};

/** Count visits, deduplicating festival shows on the same date */
function visitCount(shows: { date: string; festival: { _ref: string } | null }[]): number {
  const seen = new Set<string>();
  let count = 0;
  for (const s of shows) {
    if (s.festival) {
      const key = s.date;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    count++;
  }
  return count;
}

export default async function VenuesPage() {
  const venues = await cachedFetch<VenueWithShows[]>(
    `*[_type == "venue"] {
      _id,
      name,
      slug,
      city,
      state,
      "shows": *[_type == "show" && venue._ref == ^._id] { date, festival }
    } | order(name asc)`
  );

  const venuesWithCounts = venues
    .map((v) => ({ ...v, visits: visitCount(v.shows) }))
    .sort((a, b) => b.visits - a.visits);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        {venues.length} Venues
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {venuesWithCounts.map((venue) => (
          <Link
            key={venue._id}
            href={`/venues/${venue.slug.current}`}
            className="group flex items-baseline justify-between rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            <div>
              <span className="font-medium group-hover:text-primary">
                {venue.name}
              </span>
              <span className="ml-2 text-xs text-zinc-400">
                {[venue.city, venue.state].filter(Boolean).join(", ")}
              </span>
            </div>
            <span className="text-sm text-zinc-400">
              {venue.visits} visit{venue.visits !== 1 && "s"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
