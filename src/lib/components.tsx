import Link from "next/link";
import type { ShowListItem } from "./queries";

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

export function formatPrice(dollars: number | null): string {
  if (dollars === null) return "—";
  return `$${dollars.toFixed(2)}`;
}
