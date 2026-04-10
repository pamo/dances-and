import { Fragment } from "react";
import { cachedFetch } from "@/sanity/client";
import Link from "next/link";
import { ALL_SHOWS_QUERY, type ShowListItem } from "@/lib/queries";
import { YearSummary } from "@/lib/components";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function countVenueVisits(shows: ShowListItem[]) {
  const visited = new Set<string>();
  const map = new Map<string, number>();
  for (const s of shows) {
    const venue = s.venue?.name;
    if (!venue) continue;
    if (s.festival) {
      const key = `${s.date}|${venue}`;
      if (visited.has(key)) continue;
      visited.add(key);
    }
    map.set(venue, (map.get(venue) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

function getYear(date: string) {
  return date.slice(0, 4);
}

function getMonth(date: string) {
  return date.slice(0, 7);
}

const MONTH_LABELS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];

// ---------------------------------------------------------------------------
// Heatmap — compact grid with month labels
// ---------------------------------------------------------------------------

function Heatmap({ shows }: { shows: ShowListItem[] }) {
  const monthlyCounts = new Map<string, number>();
  for (const s of shows) {
    const m = getMonth(s.date);
    monthlyCounts.set(m, (monthlyCounts.get(m) ?? 0) + 1);
  }

  const sorted = shows.map((s) => s.date).sort();
  if (sorted.length === 0) return null;

  const startYear = parseInt(sorted[0].slice(0, 4));
  const endYear = new Date().getFullYear();
  const maxCount = Math.max(...monthlyCounts.values(), 1);

  function intensity(count: number): string {
    if (count === 0) return "bg-muted";
    const ratio = count / maxCount;
    if (ratio <= 0.25) return "bg-primary/20";
    if (ratio <= 0.5) return "bg-primary/40";
    if (ratio <= 0.75) return "bg-primary/70";
    return "bg-primary";
  }

  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `auto repeat(12, 1fr)` }}>
        {/* Month headers */}
        <div />
        {MONTH_LABELS.map((label, i) => (
          <div
            key={i}
            className="text-[10px] text-muted-foreground text-center w-4"
          >
            {label}
          </div>
        ))}

        {/* Year rows */}
        {years.map((year) => (
          <Fragment key={year}>
            <Link
              href={`/year/${year}`}
              className="text-[10px] text-muted-foreground pr-1.5 text-right leading-4 hover:text-foreground"
            >
              {year}
            </Link>
            {Array.from({ length: 12 }, (_, i) => {
              const key = `${year}-${String(i + 1).padStart(2, "0")}`;
              const count = monthlyCounts.get(key) ?? 0;
              return (
                <div
                  key={key}
                  className={`w-4 h-4 rounded-sm ${intensity(count)}`}
                  title={`${key}: ${count} show${count !== 1 ? "s" : ""}`}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function Home() {
  const shows = await cachedFetch<ShowListItem[]>(ALL_SHOWS_QUERY);

  const today = new Date().toISOString().split("T")[0];
  const past = shows.filter((s) => s.date < today);
  const upcoming = shows.filter((s) => s.date >= today).reverse();

  const totalShows = past.length;
  // Exclude festival shows from price stats — one ticket covers many acts
  const nonFestivalPast = past.filter((s) => !s.festival);
  const totalSpent = nonFestivalPast.reduce((sum, s) => sum + (s.price ?? 0), 0);
  const paidShows = nonFestivalPast.filter((s) => s.price !== null && s.price > 0);
  const avgPrice =
    paidShows.length > 0
      ? paidShows.reduce((s, sh) => s + sh.price!, 0) / paidShows.length
      : 0;
  const knownCostShows = nonFestivalPast.filter((s) => s.price !== null).length;
  const soloShows = past.filter((s) => s.solo).length;
  const topArtists = countBy(past, (s) => s.artist?.name).slice(0, 10);
  const topVenues = countVenueVisits(past).slice(0, 10);
  const showsByYear = countBy(past, (s) => getYear(s.date)).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const genreCounts = new Map<string, number>();
  for (const s of past) {
    const g = s.artist?.genres?.[0];
    if (g) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1);
  }
  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));

  const sortedDates = past.map((s) => s.date).sort();
  let longestGapDays = 0;
  let longestGapBetween = ["", ""];
  let busiestMonth = { month: "", count: 0 };

  const monthCounts = new Map<string, number>();
  for (const d of sortedDates) {
    const m = getMonth(d);
    monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1);
  }
  for (const [m, c] of monthCounts) {
    if (c > busiestMonth.count) busiestMonth = { month: m, count: c };
  }
  for (let i = 1; i < sortedDates.length; i++) {
    const a = new Date(sortedDates[i - 1] + "T00:00:00");
    const b = new Date(sortedDates[i] + "T00:00:00");
    const gap = (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
    if (gap > longestGapDays) {
      longestGapDays = gap;
      longestGapBetween = [sortedDates[i - 1], sortedDates[i]];
    }
  }

  const priceByYear = new Map<string, { total: number; count: number }>();
  for (const s of paidShows) {
    const y = getYear(s.date);
    const entry = priceByYear.get(y) ?? { total: 0, count: 0 };
    entry.total += s.price!;
    entry.count += 1;
    priceByYear.set(y, entry);
  }
  const avgPriceByYear = [...priceByYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, { total, count }]) => ({ year, avg: total / count }));

  const genreByYear = new Map<string, Map<string, number>>();
  for (const s of past) {
    const y = getYear(s.date);
    const g = s.artist?.genres?.[0];
    if (!g) continue;
    if (!genreByYear.has(y)) genreByYear.set(y, new Map());
    const ym = genreByYear.get(y)!;
    ym.set(g, (ym.get(g) ?? 0) + 1);
  }
  const genreJourney = [...genreByYear.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, genres]) => {
      const sorted = [...genres.entries()].sort((a, b) => b[1] - a[1]);
      return { year, topGenre: sorted[0]?.[0] ?? "—" };
    });

  const years = [...new Set(past.map((s) => getYear(s.date)))].sort().reverse();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          dances & likes coffee
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          a personal concert tracker
        </p>
        <nav className="mt-3 flex gap-3 text-sm">
          <Link href="/shows" className="text-primary hover:underline">
            Shows
          </Link>
          <Link href="/artists" className="text-primary hover:underline">
            Artists
          </Link>
          <Link href="/venues" className="text-primary hover:underline">
            Venues
          </Link>
          <Link href="/festivals" className="text-primary hover:underline">
            Festivals
          </Link>
        </nav>
      </header>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold">
            {upcoming.length} Upcoming
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((s) => (
              <Link
                key={s._id}
                href={`/shows/${s.slug?.current}`}
                className="group flex items-baseline justify-between rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <div>
                  <span className="font-medium group-hover:text-primary">
                    {s.artist?.name}
                  </span>
                  <span className="ml-1.5 text-muted-foreground">
                    @ {s.festival ? s.festival.name : s.venue?.name}
                  </span>
                </div>
                <time className="ml-3 shrink-0 text-xs text-muted-foreground">
                  {new Date(s.date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Year so far */}
      <YearSummary
        shows={past.filter(
          (s) => getYear(s.date) === new Date().getFullYear().toString()
        )}
        label={`${new Date().getFullYear()} so far`}
        linkHref={`/year/${new Date().getFullYear()}`}
        linkLabel="Full review"
      />

      {/* All Time heading */}
      <h2 className="text-lg font-semibold text-muted-foreground">All Time</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {[
          { label: "Shows", value: totalShows },
          {
            label: "Spent",
            value: `$${totalSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
            sub: `${knownCostShows} known cost`,
          },
          {
            label: "Solo",
            value: soloShows,
            sub: `${((soloShows / totalShows) * 100).toFixed(0)}%`,
          },
          {
            label: "Artists",
            value: new Set(past.map((s) => s.artist?.name).filter(Boolean))
              .size,
          },
          {
            label: "Venues",
            value: new Set(past.map((s) => s.venue?.name).filter(Boolean))
              .size,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-0.5 text-xl font-bold">{stat.value}</p>
              {"sub" in stat && stat.sub && (
                <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Year in review — inline links */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-muted-foreground">Year in review:</span>
        {years.map((y) => (
          <Link
            key={y}
            href={`/year/${y}`}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {y}
          </Link>
        ))}
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Busiest Month
              </p>
              <p className="text-lg font-bold">{busiestMonth.count} shows</p>
              <p className="text-xs text-muted-foreground">
                {busiestMonth.month &&
                  new Date(
                    busiestMonth.month + "-01T00:00:00"
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Longest Gap
              </p>
              <p className="text-lg font-bold">
                {Math.round(longestGapDays)} days
              </p>
              <p className="text-xs text-muted-foreground">
                {longestGapBetween[0]} to {longestGapBetween[1]}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                First Show
              </p>
              <p className="text-lg font-bold">
                {sortedDates[0]
                  ? new Date(
                      sortedDates[0] + "T00:00:00"
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {past[past.length - 1]?.artist?.name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline + Shows per Year + Avg Price — three columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Heatmap shows={past} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link href="/shows" className="hover:underline">
                Shows per Year
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {showsByYear.map(({ name, count }) => {
              const max = Math.max(...showsByYear.map((y) => y.count));
              return (
                <Link
                  key={name}
                  href={`/year/${name}`}
                  className="group flex items-center gap-2 text-sm"
                >
                  <span className="w-8 text-right text-muted-foreground">
                    {name}
                  </span>
                  <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full rounded bg-primary group-hover:bg-primary/80 transition-colors"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right font-medium">{count}</span>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Avg Ticket Price</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {avgPriceByYear.map(({ year, avg }) => {
              const max = Math.max(...avgPriceByYear.map((y) => y.avg));
              return (
                <div key={year} className="flex items-center gap-2 text-sm">
                  <span className="w-8 text-right text-muted-foreground">
                    {year}
                  </span>
                  <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full rounded bg-chart-2"
                      style={{ width: `${(avg / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 text-right font-medium">
                    ${avg.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Two-column: Top Artists + Top Venues */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link href="/artists" className="hover:underline">
                Most Seen Artists
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5">
              {topArtists.map(({ name, count }, i) => (
                <li
                  key={name}
                  className="flex items-baseline justify-between text-sm"
                >
                  <span>
                    <span className="mr-1.5 text-muted-foreground">
                      {i + 1}.
                    </span>
                    <Link
                      href={`/artists/${slugify(name)}`}
                      className="hover:text-primary"
                    >
                      {name}
                    </Link>
                  </span>
                  <span className="text-muted-foreground">{count}x</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              <Link href="/venues" className="hover:underline">
                Most Visited Venues
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1.5">
              {topVenues.map(({ name, count }, i) => (
                <li
                  key={name}
                  className="flex items-baseline justify-between text-sm"
                >
                  <span>
                    <span className="mr-1.5 text-muted-foreground">
                      {i + 1}.
                    </span>
                    <Link
                      href={`/venues/${slugify(name)}`}
                      className="hover:text-primary"
                    >
                      {name}
                    </Link>
                  </span>
                  <span className="text-muted-foreground">{count}x</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Genre breakdown + Genre journey */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Genres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {topGenres.map(({ name, count }) => (
                <Badge key={name} variant="secondary" className="font-normal">
                  {name}{" "}
                  <span className="ml-1 text-muted-foreground">{count}</span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Genre Journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {genreJourney.map(({ year, topGenre }) => (
              <div key={year} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right text-muted-foreground">
                  {year}
                </span>
                <Badge variant="outline" className="font-normal">
                  {topGenre}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>


    </main>
  );
}
