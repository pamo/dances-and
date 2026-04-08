import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Shows")
        .schemaType("show")
        .child(S.documentTypeList("show").title("Shows")),
      S.listItem()
        .title("Artists")
        .schemaType("artist")
        .child(S.documentTypeList("artist").title("Artists")),
      S.listItem()
        .title("Venues")
        .schemaType("venue")
        .child(S.documentTypeList("venue").title("Venues")),
      S.listItem()
        .title("Festivals")
        .schemaType("festival")
        .child(S.documentTypeList("festival").title("Festivals")),
    ]);
