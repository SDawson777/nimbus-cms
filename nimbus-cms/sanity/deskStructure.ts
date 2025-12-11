import { StructureResolver } from "sanity/desk";
import { client } from "./sanityClient";

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      // Legal section
      S.listItem()
        .title("Legal")
        .child(
          S.list()
            .title("Legal")
            .items([
              S.listItem()
                .title("By Type")
                .child(
                  S.list()
                    .title("Types")
                    .items([
                      S.listItem()
                        .title("Terms")
                        .child(
                          S.documentList()
                            .title("Terms")
                            .schemaType("legalDoc")
                            .filter("type == $type")
                            .params({ type: "terms" }),
                        ),
                      S.listItem()
                        .title("Privacy")
                        .child(
                          S.documentList()
                            .title("Privacy")
                            .schemaType("legalDoc")
                            .filter("type == $type")
                            .params({ type: "privacy" }),
                        ),
                      S.listItem()
                        .title("Accessibility")
                        .child(
                          S.documentList()
                            .title("Accessibility")
                            .schemaType("legalDoc")
                            .filter("type == $type")
                            .params({ type: "accessibility" }),
                        ),
                      S.listItem()
                        .title("Age Gate")
                        .child(
                          S.documentList()
                            .title("Age Gate")
                            .schemaType("legalDoc")
                            .filter("type == $type")
                            .params({ type: "ageGate" }),
                        ),
                    ]),
                ),
              S.listItem()
                .title("By State")
                .child(async () => {
                  // Fetch distinct state codes from Sanity and build list items dynamically
                  const codes: string[] = await client.fetch(
                    `*[_type=="legalDoc" && defined(stateCode)].stateCode`,
                  );
                  const uniq = Array.from(
                    new Set((codes || []).filter(Boolean)),
                  );
                  return S.list()
                    .title("States")
                    .items([
                      S.listItem()
                        .title("Global")
                        .child(
                          S.documentList()
                            .title("Global Legal")
                            .schemaType("legalDoc")
                            .filter("!defined(stateCode) || stateCode == null"),
                        ),
                      ...uniq.map((s) =>
                        S.listItem()
                          .title(String(s))
                          .child(
                            S.documentList()
                              .title(String(s))
                              .schemaType("legalDoc")
                              .filter("stateCode == $state")
                              .params({ state: s }),
                          ),
                      ),
                    ]);
                }),
            ]),
        ),

      // Other content
      S.listItem()
        .title("Organizations")
        .schemaType("organization")
        .child(S.documentTypeList("organization")),
      S.listItem()
        .title("Brands")
        .schemaType("brand")
        .child(S.documentTypeList("brand")),
      S.listItem()
        .title("Articles")
        .schemaType("article")
        .child(S.documentTypeList("article")),
      S.listItem()
        .title("Categories")
        .schemaType("category")
        .child(S.documentTypeList("category")),
      S.listItem()
        .title("Quizzes")
        .schemaType("quiz")
        .child(S.documentTypeList("quiz")),
      S.divider(),
      S.listItem()
        .title("Admin")
        .child(
          S.list()
            .title("Admin")
            .items([
              S.listItem()
                .title("Products")
                .schemaType("product")
                .child(S.documentTypeList("product")),
              S.listItem()
                .title("Product Types")
                .schemaType("productType")
                .child(S.documentTypeList("productType")),
              S.listItem()
                .title("Banners")
                .schemaType("banner")
                .child(S.documentTypeList("banner")),
              S.listItem()
                .title("Drops")
                .schemaType("drop")
                .child(S.documentTypeList("drop")),
              S.listItem()
                .title("Stores")
                .schemaType("store")
                .child(S.documentTypeList("store")),
              S.listItem()
                .title("Inventory")
                .schemaType("variantInventory")
                .child(S.documentTypeList("variantInventory")),
            ]),
        ),
    ]);
