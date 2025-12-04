export const demoArticles = [
  {
    id: "article-1",
    _id: "article-1",
    title: "Welcome to Nimbus",
    slug: "welcome-to-nimbus",
    excerpt:
      "How the control plane keeps tenants, stores, and experiences in sync.",
    body: "<p>Nimbus ships with a unified control plane. Use the admin dashboard to manage tenants, stores, theming, and behavior without code.</p>",
    cover: { src: "/nimbus-icon.svg", alt: "Nimbus" },
    tags: ["intro"],
    author: "Nimbus Team",
    publishedAt: new Date().toISOString(),
    status: "published",
    channels: [],
  },
  {
    id: "article-2",
    _id: "article-2",
    title: "Creating your first store",
    slug: "creating-your-first-store",
    excerpt: "Add a location, connect POS, and publish inventory in minutes.",
    body: "<p>Use the Stores module to add address, hours, and integrations. Toggle live when you're ready.</p>",
    cover: { src: "/nimbus-icon.svg", alt: "Nimbus" },
    tags: ["stores"],
    author: "Nimbus Ops",
    publishedAt: new Date().toISOString(),
    status: "published",
    channels: ["mobile"],
  },
];

export const demoFaqGroups = [
  {
    _id: "faq-group-1",
    title: "Getting started",
    slug: "getting-started",
    items: [
      {
        question: "How do I add a tenant?",
        answer:
          "Open the Tenants module, click Create tenant, and fill in slug + dataset mapping.",
        channels: [],
      },
      {
        question: "Can I preview themes?",
        answer:
          "Yes. Save a theme in Admin and the preview endpoints will render the palette instantly.",
        channels: ["web"],
      },
    ],
  },
];

export const demoDeals = [
  {
    title: "Launch week savings",
    slug: "launch-week",
    badge: "New",
    ctaText: "Shop",
    ctaLink: "/shop",
    image: { src: "/nimbus-icon.svg", alt: "Nimbus" },
    priority: 10,
    startAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    stores: [],
  },
];

export const demoFilters = {
  categories: [
    { name: "Flower", slug: "flower", iconRef: "🌿", weight: 1 },
    { name: "Vape", slug: "vape", iconRef: "💨", weight: 2 },
  ],
  filters: [
    {
      name: "Feel",
      slug: "feel",
      type: "multi",
      options: [
        { label: "Relaxed", value: "relaxed", active: true },
        { label: "Focused", value: "focused", active: true },
      ],
    },
  ],
};

export const demoCopy: Record<string, { key: string; text: string }[]> = {
  onboarding: [
    { key: "title", text: "Welcome to Nimbus" },
    {
      key: "subtitle",
      text: "Configure tenants, stores, and experiences from one console.",
    },
  ],
  emptyStates: [
    {
      key: "no-data",
      text: "Nothing here yet. Create your first record to get started.",
    },
  ],
  awards: [{ key: "tiers", text: "Earn points with every purchase." }],
  accessibility: [
    { key: "aria-hint", text: "Accessible defaults are enabled." },
  ],
  dataTransparency: [
    {
      key: "tracking",
      text: "We collect anonymized analytics to improve performance. Manage preferences in Settings.",
    },
  ],
};
