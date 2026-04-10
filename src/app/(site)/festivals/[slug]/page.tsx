import { cachedFetch } from "@/sanity/client";
import { ShowGrid } from "@/lib/components";
import { SHOW_LIST_PROJECTION, type ShowListItem } from "@/lib/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type FestivalDetail = {
  _id: string;
  name: string;
  website: string | null;
};

const FESTIVAL_QUERY = `{
  "festival": *[_type == "festival" && slug.current == $slug][0] { _id, name, website },
  "shows": *[_type == "show" && festival._ref == *[_type == "festival" && slug.current == $slug][0]._id] | order(date desc) ${SHOW_LIST_PROJECTION}
}`;

async function getData(slug: string) {
  return cachedFetch<{ festival: FestivalDetail | null; shows: ShowListItem[] }>(
    FESTIVAL_QUERY,
    { slug }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { festival } = await getData(slug);
  if (!festival) return { title: "Festival not found" };
  return { title: festival.name };
}

export default async function FestivalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { festival, shows } = await getData(slug);

  if (!festival) notFound();

  const uniqueDays = new Set(shows.map((s) => s.date)).size;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/festivals"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        &larr; All festivals
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{festival.name}</h1>
        <p className="mt-2 text-zinc-500">
          {uniqueDays} day{uniqueDays !== 1 && "s"} &middot; {shows.length} set{shows.length !== 1 && "s"}
        </p>
        {festival.website && (
          <a
            href={festival.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-primary hover:underline"
          >
            Website &rarr;
          </a>
        )}
      </header>

      <ShowGrid shows={shows} />
    </main>
  );
}
