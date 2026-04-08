import { client } from "@/sanity/client";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Artists" };

type ArtistWithCount = {
  _id: string;
  name: string;
  slug: { current: string };
  genres: string[] | null;
  showCount: number;
};

export default async function ArtistsPage() {
  const artists = await client.fetch<ArtistWithCount[]>(
    `*[_type == "artist"] {
      _id,
      name,
      slug,
      genres,
      "showCount": count(*[_type == "show" && references(^._id)])
    } | order(showCount desc, name asc)`
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        {artists.length} Artists
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <Link
            key={artist._id}
            href={`/artists/${artist.slug.current}`}
            className="group flex items-baseline justify-between rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            <div>
              <span className="font-medium group-hover:text-primary">
                {artist.name}
              </span>
              {artist.genres && artist.genres.length > 0 && (
                <span className="ml-2 text-xs text-zinc-400">
                  {artist.genres[0]}
                </span>
              )}
            </div>
            <span className="text-sm text-zinc-400">
              {artist.showCount} show{artist.showCount !== 1 && "s"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
