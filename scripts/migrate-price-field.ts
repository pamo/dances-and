/**
 * Migrate priceCents → price (dollars) in Sanity.
 *
 * Usage: npx tsx scripts/migrate-price-field.ts
 */

import { config as loadEnv } from "dotenv";
import * as path from "path";

loadEnv({ path: path.resolve(__dirname, "../.env.local") });

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_TOKEN!,
  useCdn: false,
});

async function main() {
  const shows = await client.fetch<
    { _id: string; priceCents: number | null }[]
  >(`*[_type == "show" && defined(priceCents)] { _id, priceCents }`);

  console.log(`Found ${shows.length} shows with priceCents`);

  let tx = client.transaction();
  for (const show of shows) {
    const dollars =
      show.priceCents !== null ? show.priceCents / 100 : null;
    tx = tx.patch(show._id, (p) =>
      p.set({ price: dollars }).unset(["priceCents"])
    );
  }

  const result = await tx.commit();
  console.log(`Migrated ${shows.length} shows: priceCents → price (dollars)`);
  console.log(`Transaction ID: ${result.transactionId}`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
