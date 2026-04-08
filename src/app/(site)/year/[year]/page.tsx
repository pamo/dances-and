import { client } from "@/sanity/client";
import { SHOW_LIST_PROJECTION, type ShowListItem } from "@/lib/queries";
import { ShowGrid } from "@/lib/components";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  return { title: `${year} in Review` };
}

function countBy<T>(items: T[], key: (item: T) => string | undefined) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

export default async function YearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const shows = await client.fetch<ShowListItem[]>(
    `*[_type == "show" && date >= $start && date <= $end] | order(date asc) ${SHOW_LIST_PROJECTION}`,
    { start: startDate, end: endDate }
  );

  if (shows.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
          &larr; Home
        </Link>
        <h1 className="mt-6 text-3xl font-bold">{year}</h1>
        <p className="mt-4 text-zinc-500">No shows this year.</p>
      </main>
    );
  }

  const nonFestival = shows.filter((s) => !s.festival);
  const totalSpent = nonFestival.reduce((s, sh) => s + (sh.price ?? 0), 0);
  const soloCount = shows.filter((s) => s.solo).length;
  const knownCostCount = nonFestival.filter((s) => s.price !== null).length;
  const uniqueArtists = new Set(shows.map((s) => s.artist?.name).filter(Boolean));
  const uniqueVenues = new Set(shows.map((s) => s.venue?.name).filter(Boolean));

  const topArtists = countBy(shows, (s) => s.artist?.name).slice(0, 5);
  const topVenues = countBy(shows, (s) => s.venue?.name).slice(0, 5);
  const topGenres = countBy(shows, (s) => s.artist?.genres?.[0]).slice(0, 5);

  // Monthly breakdown
  const byMonth = new Map<string, ShowListItem[]>();
  for (const s of shows) {
    const m = s.date.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(s);
  }

  const busiestMonth = [...byMonth.entries()].sort(
    (a, b) => b[1].length - a[1].length
  )[0];

  // Previous/next year
  const prevYear = String(parseInt(year) - 1);
  const nextYear = String(parseInt(year) + 1);
  const thisYear = new Date().getFullYear();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
        &larr; Home
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{year} in Review</h1>
        <p className="mt-2 text-lg text-zinc-500">
          {shows.length} show{shows.length !== 1 && "s"} across{" "}
          {uniqueVenues.size} venue{uniqueVenues.size !== 1 && "s"}
        </p>
      </header>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Shows
          </p>
          <p className="mt-1 text-2xl font-bold">{shows.length}</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Spent
          </p>
          <p className="mt-1 text-2xl font-bold">
            ${totalSpent.toFixed(0)}
          </p>
          <p className="text-xs text-zinc-400">{knownCostCount} known cost</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Solo
          </p>
          <p className="mt-1 text-2xl font-bold">{soloCount}</p>
          <p className="text-xs text-zinc-400">
            {shows.length > 0
              ? `${((soloCount / shows.length) * 100).toFixed(0)}%`
              : ""}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Busiest Month
          </p>
          <p className="mt-1 text-2xl font-bold">
            {busiestMonth
              ? new Date(busiestMonth[0] + "-01T00:00:00").toLocaleDateString(
                  "en-US",
                  { month: "short" }
                )
              : "—"}
          </p>
          <p className="text-xs text-zinc-400">
            {busiestMonth ? `${busiestMonth[1].length} shows` : ""}
          </p>
        </div>
      </div>

      <div className="mb-10 grid gap-8 lg:grid-cols-3">
        {/* Top artists */}
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
            Top Artists
          </h3>
          <ol className="space-y-1">
            {topArtists.map(({ name, count }) => (
              <li key={name} className="flex justify-between text-sm">
                <span className="font-medium">{name}</span>
                <span className="text-zinc-400">{count}x</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Top venues */}
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
            Top Venues
          </h3>
          <ol className="space-y-1">
            {topVenues.map(({ name, count }) => (
              <li key={name} className="flex justify-between text-sm">
                <span className="font-medium">{name}</span>
                <span className="text-zinc-400">{count}x</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Top genres */}
        <div>
          <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
            Top Genres
          </h3>
          <ol className="space-y-1">
            {topGenres.map(({ name, count }) => (
              <li key={name} className="flex justify-between text-sm">
                <span className="font-medium">{name}</span>
                <span className="text-zinc-400">{count}x</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* All shows */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">All Shows</h2>
        <ShowGrid shows={shows} />
      </section>

      {/* Nav */}
      <nav className="mt-8 flex justify-between border-t border-zinc-200 pt-6">
        {parseInt(year) > 2008 ? (
          <Link
            href={`/year/${prevYear}`}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            &larr; {prevYear}
          </Link>
        ) : (
          <span />
        )}
        {parseInt(year) < thisYear ? (
          <Link
            href={`/year/${nextYear}`}
            className="text-sm text-zinc-500 hover:text-zinc-900"
          >
            {nextYear} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
