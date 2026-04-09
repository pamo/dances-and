import { client } from "@/sanity/client";
import { ShowGrid } from "@/lib/components";
import { SHOW_LIST_PROJECTION, type ShowListItem } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type VenueDetail = {
  _id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  website: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const venue = await client.fetch<VenueDetail | null>(
    `*[_type == "venue" && slug.current == $slug][0] { _id, name, city, state, country, website }`,
    { slug }
  );
  if (!venue) return { title: "Venue not found" };
  return { title: venue.name };
}

export default async function VenuePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const venue = await client.fetch<VenueDetail | null>(
    `*[_type == "venue" && slug.current == $slug][0] { _id, name, city, state, country, website }`,
    { slug }
  );

  if (!venue) notFound();

  const shows = await client.fetch<ShowListItem[]>(
    `*[_type == "show" && venue._ref == $id] | order(date desc) ${SHOW_LIST_PROJECTION}`,
    { id: venue._id }
  );

  // Count visits, deduplicating festival shows on the same date
  const visitDates = new Set<string>();
  let visits = 0;
  for (const s of shows) {
    if (s.festival) {
      const key = s.date;
      if (visitDates.has(key)) continue;
      visitDates.add(key);
    }
    visits++;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/venues"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        &larr; All venues
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{venue.name}</h1>
        <p className="mt-1 text-zinc-500">
          {[venue.city, venue.state, venue.country].filter(Boolean).join(", ")}
        </p>
        {venue.website && (
          <a
            href={venue.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-primary hover:underline"
          >
            Website &rarr;
          </a>
        )}
      </header>

      <h2 className="mb-4 text-xl font-semibold">
        {visits} Visit{visits !== 1 && "s"} &middot; {shows.length} Set{shows.length !== 1 && "s"}
      </h2>
      <ShowGrid shows={shows} />
    </main>
  );
}
