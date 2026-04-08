import { client } from "@/sanity/client";
import { ALL_SHOWS_QUERY, type ShowListItem } from "@/lib/queries";
import { ShowGrid } from "@/lib/components";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "All Shows" };

export default async function ShowsPage() {
  const shows = await client.fetch<ShowListItem[]>(ALL_SHOWS_QUERY);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = shows.filter((s) => s.date >= today).reverse();
  const past = shows.filter((s) => s.date < today);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">All Shows</h1>

      {upcoming.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">
            {upcoming.length} Upcoming
          </h2>
          <ShowGrid shows={upcoming} />
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">{past.length} Past</h2>
        <ShowGrid shows={past} />
      </section>
    </main>
  );
}
