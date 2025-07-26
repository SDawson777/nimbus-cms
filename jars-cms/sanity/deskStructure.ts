import {StructureResolver} from 'sanity/desk'

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem().title('Articles').schemaType('article').child(S.documentTypeList('article')),
      S.listItem().title('Categories').schemaType('category').child(S.documentTypeList('category')),
      S.listItem().title('Quizzes').schemaType('quiz').child(S.documentTypeList('quiz')),
      S.divider(),
      S.listItem()
        .title('Admin')
        .child(
          S.list()
            .title('Admin')
            .items([
              S.listItem()
                .title('Products')
                .schemaType('product')
                .child(S.documentTypeList('product')),
              S.listItem()
                .title('Product Types')
                .schemaType('productType')
                .child(S.documentTypeList('productType')),
              S.listItem()
                .title('Banners')
                .schemaType('banner')
                .child(S.documentTypeList('banner')),
              S.listItem().title('Drops').schemaType('drop').child(S.documentTypeList('drop')),
              S.listItem().title('Stores').schemaType('store').child(S.documentTypeList('store')),
            ]),
        ),
    ])
