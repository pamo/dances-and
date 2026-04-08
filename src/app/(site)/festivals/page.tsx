import { client } from "@/sanity/client";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Festivals" };

type FestivalWithCount = {
  _id: string;
  name: string;
  slug: { current: string };
  showCount: number;
};

export default async function FestivalsPage() {
  const festivals = await client.fetch<FestivalWithCount[]>(
    `*[_type == "festival"] {
      _id,
      name,
      slug,
      "showCount": count(*[_type == "show" && festival._ref == ^._id])
    } | order(showCount desc, name asc)`
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">
        {festivals.length} Festivals
      </h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {festivals.map((fest) => (
          <Link
            key={fest._id}
            href={`/festivals/${fest.slug.current}`}
            className="group flex items-baseline justify-between rounded-lg border border-zinc-200 px-4 py-3 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
          >
            <span className="font-medium group-hover:text-primary">
              {fest.name}
            </span>
            <span className="text-sm text-zinc-400">
              {fest.showCount} show{fest.showCount !== 1 && "s"}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
