import { cachedFetch } from "@/sanity/client";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Festivals" };

type FestivalWithShows = {
  _id: string;
  name: string;
  slug: { current: string };
  shows: { date: string }[];
};

export default async function FestivalsPage() {
  const festivals = await cachedFetch<FestivalWithShows[]>(
    `*[_type == "festival"] {
      _id,
      name,
      slug,
      "shows": *[_type == "show" && festival._ref == ^._id] { date }
    } | order(name asc)`
  );

  const festivalsWithCounts = festivals
    .map((f) => ({
      ...f,
      days: new Set(f.shows.map((s) => s.date)).size,
      sets: f.shows.length,
    }))
    .sort((a, b) => b.days - a.days);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        {festivals.length} Festivals
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {festivalsWithCounts.map((fest) => (
          <Link
            key={fest._id}
            href={`/festivals/${fest.slug.current}`}
            className="group flex items-baseline justify-between rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            <span className="font-medium group-hover:text-primary">
              {fest.name}
            </span>
            <span className="text-sm text-zinc-400">
              {fest.days} day{fest.days !== 1 && "s"} &middot; {fest.sets} set{fest.sets !== 1 && "s"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
