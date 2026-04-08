import { client } from "@/sanity/client";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fest = await client.fetch<FestivalDetail | null>(
    `*[_type == "festival" && slug.current == $slug][0] { _id, name, website }`,
    { slug }
  );
  if (!fest) return { title: "Festival not found" };
  return { title: fest.name };
}

export default async function FestivalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const fest = await client.fetch<FestivalDetail | null>(
    `*[_type == "festival" && slug.current == $slug][0] { _id, name, website }`,
    { slug }
  );

  if (!fest) notFound();

  const shows = await client.fetch<ShowListItem[]>(
    `*[_type == "show" && festival._ref == $id] | order(date desc) ${SHOW_LIST_PROJECTION}`,
    { id: fest._id }
  );

  // Calculate total spent at this festival
  const totalPrice = shows.reduce(
    (sum, s) => sum + (s.price ?? 0),
    0
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/festivals"
        className="text-sm text-zinc-500 hover:text-zinc-900"
      >
        &larr; All festivals
      </Link>

      <header className="mt-6 mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{fest.name}</h1>
        <p className="mt-2 text-zinc-500">
          {shows.length} show{shows.length !== 1 && "s"} &middot; $
          ${totalPrice.toFixed(0)} spent
        </p>
        {fest.website && (
          <a
            href={fest.website}
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
