import { cachedFetch } from "@/sanity/client";
import { SHOW_LIST_PROJECTION, type ShowListItem } from "@/lib/queries";
import { ShowGrid, YearSummary } from "@/lib/components";
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

export default async function YearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const shows = await cachedFetch<ShowListItem[]>(
    `*[_type == "show" && date >= $start && date <= $end] | order(date asc) ${SHOW_LIST_PROJECTION}`,
    { start: startDate, end: endDate }
  );

  const prevYear = String(parseInt(year) - 1);
  const nextYear = String(parseInt(year) + 1);
  const thisYear = new Date().getFullYear();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
        &larr; Home
      </Link>

      <YearSummary shows={shows} label={`${year} in Review`} />

      {shows.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">All Shows</h2>
          <ShowGrid shows={shows} />
        </section>
      )}

      <nav className="flex justify-between border-t pt-6">
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
