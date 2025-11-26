export const FALLBACK_LEGAL = [
  {title: 'Terms of Service', body: 'Placeholder terms of service.'},
  {title: 'Privacy Policy', body: 'Placeholder privacy policy.'},
]

export const FALLBACK_FAQ = [{question: 'Placeholder question?', answer: 'Placeholder answer.'}]

export const FALLBACK_ARTICLES: Array<{title: string; slug: string; excerpt: string}> = []

export const FALLBACK_FILTERS = {
  categories: [] as Array<{title: string; slug: string}>,
  effects: [] as string[],
}

export const FALLBACK_PRODUCTS = [
  {
    _id: 'sample-product',
    name: 'Sample Product',
    slug: 'sample-product',
    price: 0,
    effects: [] as string[],
    availability: 'unavailable',
    productType: {title: 'Sample Type'},
    image: null,
  },
]
