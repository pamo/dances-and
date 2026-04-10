import { defineField, defineType } from "sanity";

export const show = defineType({
  name: "show",
  title: "Show",
  type: "document",
  fields: [
    defineField({
      name: "date",
      title: "Date",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "artist",
      title: "Artist",
      type: "reference",
      to: [{ type: "artist" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "venue",
      title: "Venue",
      type: "reference",
      to: [{ type: "venue" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "festival",
      title: "Festival",
      type: "reference",
      to: [{ type: "festival" }],
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Auto-generated on publish. Set manually to override.",
      hidden: true,
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Auto-generated on publish. No need to set manually.",
      hidden: true,
    }),
    defineField({
      name: "price",
      title: "Price ($)",
      type: "number",
      description: "Ticket price in dollars. Leave empty if unknown.",
    }),
    defineField({
      name: "solo",
      title: "Solo",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "openers",
      title: "Openers",
      type: "array",
      of: [{ type: "reference", to: [{ type: "artist" }] }],
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "companions",
      title: "Companions",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
      description: "Who you went with",
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      validation: (rule) => rule.min(1).max(5),
      description: "1-5 star rating",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
      description: "Memories, highlights, or thoughts about the show",
    }),
    defineField({
      name: "cover",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
  orderings: [
    {
      title: "Date (newest)",
      name: "dateDesc",
      by: [{ field: "date", direction: "desc" }],
    },
    {
      title: "Date (oldest)",
      name: "dateAsc",
      by: [{ field: "date", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      artist: "artist.name",
      date: "date",
      venue: "venue.name",
    },
    prepare({ title, artist, date, venue }) {
      const generated = [artist, venue].filter(Boolean).join(" at ");
      return {
        title: title || generated || "Untitled Show",
        subtitle: date ?? "",
      };
    },
  },
});
