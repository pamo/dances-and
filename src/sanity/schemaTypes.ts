import { type SchemaTypeDefinition } from "sanity";
import { artist } from "./schemas/artist";
import { festival } from "./schemas/festival";
import { show } from "./schemas/show";
import { venue } from "./schemas/venue";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [artist, venue, festival, show],
};
