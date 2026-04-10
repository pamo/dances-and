import { cachedFetch } from "@/sanity/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Artist = {
  name: string;
  slug: { current: string };
  genres: string[] | null;
  lastfmUrl: string | null;
};

type Venue = {
  name: string;
  slug: { current: string };
  city: string;
  state: string;
  country: string;
};

type Festival = {
  name: string;
  slug: { current: string };
};

type Show = {
  _id: string;
  title: string;
  date: string;
  slug: { current: string };
  artist: Artist | null;
  venue: Venue | null;
  festival: Festival | null;
  price: number | null;
  solo: boolean;
  openers: Artist[] | null;
  tags: string[] | null;
  companions: string[] | null;
  rating: number | null;
  notes: string | null;
};

type NavShow = {
  slug: { current: string };
  artist: { name: string } | null;
  date: string;
};

const SHOW_WITH_NAV_QUERY = `{
  "show": *[_type == "show" && slug.current == $slug][0] {
    _id,
    "title": coalesce(title, artist->name + " at " + venue->name),
    date,
    slug,
    price,
    solo,
    tags,
    companions,
    rating,
    notes,
    artist->{name, slug, genres, lastfmUrl},
    venue->{name, slug, city, state, country},
    festival->{name, slug},
    openers[]->{name, slug}
  },
  "prev": *[_type == "show" && date < *[_type == "show" && slug.current == $slug][0].date] | order(date desc)[0] { slug, artist->{name} },
  "next": *[_type == "show" && date > *[_type == "show" && slug.current == $slug][0].date] | order(date asc)[0] { slug, artist->{name} }
}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { show } = await cachedFetch<{ show: Show | null }>(SHOW_WITH_NAV_QUERY, { slug });
  if (!show) return { title: "Show not found" };

  return {
    title: show.artist?.name ?? show.title,
    description: `${show.artist?.name} at ${show.festival?.name ?? show.venue?.name} — ${new Date(show.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
  };
}

function formatPrice(dollars: number | null): string {
  if (dollars === null) return "—";
  return `$${dollars.toFixed(2)}`;
}

export default async function ShowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { show, prev, next } = await cachedFetch<{
    show: Show | null;
    prev: NavShow | null;
    next: NavShow | null;
  }>(SHOW_WITH_NAV_QUERY, { slug });

  if (!show) notFound();

  const date = new Date(show.date + "T00:00:00");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/shows"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        &larr; All shows
      </Link>

      <header className="mt-6 mb-8">
        <time className="text-sm font-medium uppercase tracking-wide text-zinc-400">
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          {show.artist ? (
            <Link
              href={`/artists/${show.artist.slug.current}`}
              className="hover:text-primary"
            >
              {show.artist.name}
            </Link>
          ) : (
            show.title
          )}
        </h1>
        <p className="mt-2 text-lg text-zinc-500">
          @{" "}
          {show.festival ? (
            <Link
              href={`/festivals/${show.festival.slug.current}`}
              className="hover:text-zinc-900"
            >
              {show.festival.name}
            </Link>
          ) : null}
          {show.festival && show.venue ? " — " : ""}
          {show.venue ? (
            <Link
              href={`/venues/${show.venue.slug.current}`}
              className="hover:text-zinc-900"
            >
              {show.venue.name}
            </Link>
          ) : null}
        </p>
        {show.venue && (
          <p className="text-sm text-zinc-400">
            {[show.venue.city, show.venue.state, show.venue.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 border-y border-zinc-200 py-6 mb-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Price
          </p>
          <p className="mt-1 text-lg font-semibold">
            {formatPrice(show.price)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Solo
          </p>
          <p className="mt-1 text-lg font-semibold">
            {show.solo ? "Yes" : "No"}
          </p>
        </div>
        {show.rating && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Rating
            </p>
            <p className="mt-1 text-lg font-semibold">
              {"★".repeat(show.rating)}
              {"☆".repeat(5 - show.rating)}
            </p>
          </div>
        )}
        {show.artist?.genres && show.artist.genres.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              Genre
            </p>
            <p className="mt-1 text-sm">{show.artist.genres[0]}</p>
          </div>
        )}
      </div>

      {show.openers && show.openers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400 mb-2">
            Openers
          </h2>
          <div className="flex flex-wrap gap-2">
            {show.openers.map((opener) => (
              <Link
                key={opener.slug.current}
                href={`/artists/${opener.slug.current}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm hover:bg-zinc-200"
              >
                {opener.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {show.companions && show.companions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400 mb-2">
            With
          </h2>
          <p className="text-sm">{show.companions.join(", ")}</p>
        </section>
      )}

      {show.tags && show.tags.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400 mb-2">
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {show.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {show.notes && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-400 mb-2">
            Notes
          </h2>
          <p className="text-zinc-700 whitespace-pre-wrap">{show.notes}</p>
        </section>
      )}

      {show.artist?.lastfmUrl && (
        <section className="mb-8">
          <a
            href={show.artist.lastfmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {show.artist.name} on Last.fm &rarr;
          </a>
        </section>
      )}

      <nav className="flex justify-between border-t border-zinc-200 pt-6">
        {prev ? (
          <Link
            href={`/shows/${prev.slug.current}`}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            &larr; {prev.artist?.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/shows/${next.slug.current}`}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            {next.artist?.name} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
