// Shared GROQ queries and types

export type ShowListItem = {
  _id: string;
  title: string;
  date: string;
  slug: { current: string };
  artist: { name: string; genres: string[] | null } | null;
  venue: { name: string; city: string; state: string } | null;
  festival: { name: string } | null;
  price: number | null;
  solo: boolean;
};

export const SHOW_LIST_PROJECTION = `{
  _id,
  "title": coalesce(title, artist->name + " at " + venue->name),
  date,
  slug,
  price,
  solo,
  artist->{name, genres},
  venue->{name, city, state},
  festival->{name}
}`;

export const ALL_SHOWS_QUERY = `*[_type == "show"] | order(date desc) ${SHOW_LIST_PROJECTION}`;
