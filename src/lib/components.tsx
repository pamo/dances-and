import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ShowListItem } from "./queries";

// ---------------------------------------------------------------------------
// Show grid
// ---------------------------------------------------------------------------

export function ShowGrid({ shows }: { shows: ShowListItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {shows.map((show) => (
        <Link
          key={show._id}
          href={`/shows/${show.slug?.current}`}
          className="group rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
        >
          <p className="font-semibold group-hover:text-primary">
            {show.artist?.name ?? show.title}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            @{" "}
            {show.festival
              ? show.festival.name
              : show.venue?.name ?? "Unknown venue"}
          </p>
          <time className="mt-2 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            {new Date(show.date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </time>
        </Link>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Price formatting
// ---------------------------------------------------------------------------

export function formatPrice(dollars: number | null): string {
  if (dollars === null) return "—";
  return `$${dollars.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ranked list (top artists, venues, genres)
// ---------------------------------------------------------------------------

export function RankedList({
  title,
  items,
  slugPrefix,
}: {
  title: string;
  items: { name: string; count: number }[];
  slugPrefix?: string;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <ol className="space-y-1">
        {items.map(({ name, count }) => (
          <li key={name} className="flex justify-between text-sm">
            {slugPrefix ? (
              <Link
                href={`/${slugPrefix}/${slugify(name)}`}
                className="font-medium hover:text-primary"
              >
                {name}
              </Link>
            ) : (
              <span className="font-medium">{name}</span>
            )}
            <span className="text-muted-foreground">{count}x</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Year summary — reusable between homepage YTD and year-in-review page
// ---------------------------------------------------------------------------

export function YearSummary({
  shows,
  label,
  linkHref,
  linkLabel,
}: {
  shows: ShowListItem[];
  label: string;
  linkHref?: string;
  linkLabel?: string;
}) {
  if (shows.length === 0) return null;

  const nonFestival = shows.filter((s) => !s.festival);
  const totalSpent = nonFestival.reduce((s, sh) => s + (sh.price ?? 0), 0);
  const knownCost = nonFestival.filter((s) => s.price !== null).length;
  const soloCount = shows.filter((s) => s.solo).length;
  const uniqueArtists = new Set(
    shows.map((s) => s.artist?.name).filter(Boolean)
  ).size;
  const uniqueVenues = new Set(
    shows.map((s) => s.venue?.name).filter(Boolean)
  ).size;

  const topArtists = countByHelper(shows, (s) => s.artist?.name).slice(0, 5);
  const topVenues = countByHelper(shows, (s) => s.venue?.name).slice(0, 5);
  const topGenres = countByHelper(shows, (s) => s.artist?.genres?.[0]).slice(
    0,
    5
  );

  // Busiest month
  const byMonth = new Map<string, number>();
  for (const s of shows) {
    const m = s.date.slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
  }
  const busiestEntry = [...byMonth.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-base">{label}</CardTitle>
          {linkHref && (
            <Link
              href={linkHref}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              {linkLabel ?? "View details"} &rarr;
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stat row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Shows" value={shows.length} />
          <StatCard
            label="Spent"
            value={`$${totalSpent.toFixed(0)}`}
            sub={`${knownCost} known cost`}
          />
          <StatCard
            label="Solo"
            value={soloCount}
            sub={`${((soloCount / shows.length) * 100).toFixed(0)}%`}
          />
          <StatCard
            label="Busiest Month"
            value={
              busiestEntry
                ? new Date(
                    busiestEntry[0] + "-01T00:00:00"
                  ).toLocaleDateString("en-US", { month: "short" })
                : "—"
            }
            sub={busiestEntry ? `${busiestEntry[1]} shows` : ""}
          />
        </div>

        {/* Top lists */}
        <div className="grid gap-6 sm:grid-cols-3">
          <RankedList
            title="Top Artists"
            items={topArtists}
            slugPrefix="artists"
          />
          <RankedList
            title="Top Venues"
            items={topVenues}
            slugPrefix="venues"
          />
          <RankedList title="Top Genres" items={topGenres} />
        </div>
      </CardContent>
    </Card>
  );
}

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

function countByHelper<T>(
  items: T[],
  key: (item: T) => string | undefined
) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}
