import { cachedFetch } from "@/sanity/client";
import { ShowGrid } from "@/lib/components";
import { SHOW_LIST_PROJECTION, type ShowListItem } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type ArtistDetail = {
  _id: string;
  name: string;
  genres: string[] | null;
  lastfmUrl: string | null;
};

const ARTIST_QUERY = `{
  "artist": *[_type == "artist" && slug.current == $slug][0] { _id, name, genres, lastfmUrl },
  "shows": *[_type == "show" && references(*[_type == "artist" && slug.current == $slug][0]._id)] | order(date desc) ${SHOW_LIST_PROJECTION}
}`;

async function getData(slug: string) {
  return cachedFetch<{ artist: ArtistDetail | null; shows: ShowListItem[] }>(
    ARTIST_QUERY,
    { slug }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { artist } = await getData(slug);
  if (!artist) return { title: "Artist not found" };
  return { title: artist.name };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { artist, shows } = await getData(slug);

  if (!artist) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/artists"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        &larr; All artists
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{artist.name}</h1>
        {artist.genres && artist.genres.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {artist.genres.map((g) => (
              <span
                key={g}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs"
              >
                {g}
              </span>
            ))}
          </div>
        )}
        {artist.lastfmUrl && (
          <a
            href={artist.lastfmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Last.fm &rarr;
          </a>
        )}
      </header>

      <h2 className="mb-4 text-xl font-semibold">
        {shows.length} Show{shows.length !== 1 && "s"}
      </h2>
      <ShowGrid shows={shows} />
    </main>
  );
}
