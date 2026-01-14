/**
 * Enterprise-Grade Demo Data for Nimbus CMS Suite
 * 
 * This data represents a realistic multi-state cannabis retail operation
 * with 8 stores across 4 states, 50+ products, real order volume, and
 * comprehensive analytics suitable for buyer demonstrations.
 */

// ============================================================================
// PRODUCTS - Enterprise catalog with realistic SKUs and pricing
// ============================================================================
export const DEMO_PRODUCTS = [
  // Flower Category - Premium Strains
  {
    __id: "prod-flower-001",
    name: "Nimbus OG Kush",
    slug: "nimbus-og-kush",
    price: 45,
    type: "Flower",
    brand: "Nimbus Premium",
    category: "Flower",
    isRecalled: false,
    thc: "24.5%",
    cbd: "0.8%",
    effects: ["Relaxed", "Happy", "Euphoric"],
    description: "Our flagship indica-dominant hybrid. Rich terpene profile with notes of pine and citrus.",
    image: { url: "/assets/products/nimbus-og.jpg", alt: "Nimbus OG Kush Premium Flower" },
    stock: 156,
    purchasesLast30d: 342,
  },
  {
    __id: "prod-flower-002",
    name: "Blue Dream Sativa",
    slug: "blue-dream-sativa",
    price: 42,
    type: "Flower",
    brand: "Nimbus Premium",
    category: "Flower",
    isRecalled: false,
    thc: "21.2%",
    cbd: "0.5%",
    effects: ["Creative", "Uplifted", "Focused"],
    description: "Award-winning sativa known for balanced effects. Perfect for daytime use.",
    image: { url: "/assets/products/blue-dream.jpg", alt: "Blue Dream Sativa" },
    stock: 203,
    purchasesLast30d: 287,
  },
  {
    __id: "prod-flower-003",
    name: "Wedding Cake Indica",
    slug: "wedding-cake",
    price: 48,
    type: "Flower",
    brand: "Aurora Collection",
    category: "Flower",
    isRecalled: false,
    thc: "26.1%",
    cbd: "0.3%",
    effects: ["Relaxed", "Sleepy", "Hungry"],
    description: "Dense, frosty buds with sweet vanilla undertones. Top-shelf quality.",
    image: { url: "/assets/products/wedding-cake.jpg", alt: "Wedding Cake Premium" },
    stock: 89,
    purchasesLast30d: 198,
  },
  {
    __id: "prod-flower-004",
    name: "Gorilla Glue #4",
    slug: "gorilla-glue-4",
    price: 44,
    type: "Flower",
    brand: "Nimbus Premium",
    category: "Flower",
    isRecalled: false,
    thc: "25.8%",
    cbd: "0.6%",
    effects: ["Relaxed", "Euphoric", "Happy"],
    description: "Legendary strain with heavy resin production. Earthy pine aroma.",
    image: { url: "/assets/products/gg4.jpg", alt: "Gorilla Glue #4" },
    stock: 127,
    purchasesLast30d: 256,
  },
  // Edibles Category
  {
    __id: "prod-edible-001",
    name: "Midnight Mints 10-Pack",
    slug: "midnight-mints",
    price: 25,
    type: "Edible",
    brand: "Nimbus Edibles",
    category: "Edibles",
    isRecalled: false,
    thc: "100mg total",
    cbd: "0mg",
    effects: ["Relaxed", "Sleepy"],
    description: "Precision-dosed peppermint mints. 10mg THC each. Lab-tested for consistency.",
    image: { url: "/assets/products/midnight-mints.jpg", alt: "Midnight Mints Edibles" },
    stock: 312,
    purchasesLast30d: 445,
  },
  {
    __id: "prod-edible-002",
    name: "Sunrise Citrus Gummies",
    slug: "sunrise-gummies",
    price: 28,
    type: "Edible",
    brand: "Nimbus Edibles",
    category: "Edibles",
    isRecalled: false,
    thc: "100mg total",
    cbd: "50mg total",
    effects: ["Uplifted", "Energetic", "Creative"],
    description: "1:2 THC:CBD ratio for balanced effects. Natural citrus flavors.",
    image: { url: "/assets/products/sunrise-gummies.jpg", alt: "Sunrise Citrus Gummies" },
    stock: 267,
    purchasesLast30d: 389,
  },
  {
    __id: "prod-edible-003",
    name: "Chocolate Bliss Bar",
    slug: "chocolate-bliss",
    price: 32,
    type: "Edible",
    brand: "Aurora Collection",
    category: "Edibles",
    isRecalled: false,
    thc: "100mg total",
    cbd: "0mg",
    effects: ["Happy", "Relaxed"],
    description: "Belgian dark chocolate infused with premium distillate. 10 servings.",
    image: { url: "/assets/products/chocolate-bar.jpg", alt: "Chocolate Bliss Bar" },
    stock: 178,
    purchasesLast30d: 234,
  },
  // Vapes Category
  {
    __id: "prod-vape-001",
    name: "Limonene Live Resin Cart",
    slug: "limonene-live-resin",
    price: 55,
    type: "Vape",
    brand: "Nimbus Extracts",
    category: "Vapes",
    isRecalled: false,
    thc: "82%",
    cbd: "0%",
    effects: ["Uplifted", "Energetic"],
    description: "Single-source live resin with preserved terpenes. Citrus explosion.",
    image: { url: "/assets/products/limonene-cart.jpg", alt: "Limonene Live Resin Cartridge" },
    stock: 145,
    purchasesLast30d: 312,
  },
  {
    __id: "prod-vape-002",
    name: "OG Kush Distillate Pod",
    slug: "og-kush-pod",
    price: 48,
    type: "Vape",
    brand: "Nimbus Extracts",
    category: "Vapes",
    isRecalled: false,
    thc: "88%",
    cbd: "0%",
    effects: ["Relaxed", "Happy"],
    description: "High-potency distillate with botanical terpenes. Universal 510 thread.",
    image: { url: "/assets/products/og-pod.jpg", alt: "OG Kush Distillate Pod" },
    stock: 234,
    purchasesLast30d: 456,
  },
  // Concentrates
  {
    __id: "prod-concentrate-001",
    name: "Diamond Sauce - Runtz",
    slug: "diamond-sauce-runtz",
    price: 65,
    type: "Concentrate",
    brand: "Aurora Collection",
    category: "Concentrates",
    isRecalled: false,
    thc: "78%",
    cbd: "0%",
    effects: ["Euphoric", "Creative"],
    description: "THCA diamonds in terpene-rich sauce. Premium dabbing experience.",
    image: { url: "/assets/products/diamond-sauce.jpg", alt: "Diamond Sauce Concentrate" },
    stock: 67,
    purchasesLast30d: 123,
  },
  // Topicals & Wellness
  {
    __id: "prod-topical-001",
    name: "Relief CBD Balm 500mg",
    slug: "relief-cbd-balm",
    price: 45,
    type: "Topical",
    brand: "Nimbus Wellness",
    category: "Wellness",
    isRecalled: false,
    thc: "0%",
    cbd: "500mg",
    effects: ["Pain Relief", "Relaxation"],
    description: "Fast-absorbing CBD balm with menthol and arnica. For muscle recovery.",
    image: { url: "/assets/products/cbd-balm.jpg", alt: "Relief CBD Balm" },
    stock: 189,
    purchasesLast30d: 167,
  },
  {
    __id: "prod-topical-002",
    name: "Sleep Tincture 1000mg",
    slug: "sleep-tincture",
    price: 68,
    type: "Tincture",
    brand: "Nimbus Wellness",
    category: "Wellness",
    isRecalled: false,
    thc: "500mg",
    cbd: "500mg",
    effects: ["Sleepy", "Relaxed"],
    description: "1:1 ratio sublingual oil with CBN for sleep support. 30ml bottle.",
    image: { url: "/assets/products/sleep-tincture.jpg", alt: "Sleep Tincture" },
    stock: 156,
    purchasesLast30d: 198,
  },
  // Pre-rolls
  {
    __id: "prod-preroll-001",
    name: "Sunrise Pre-Roll 5-Pack",
    slug: "sunrise-preroll-5pk",
    price: 35,
    type: "Pre-Roll",
    brand: "Nimbus Premium",
    category: "Pre-rolls",
    isRecalled: false,
    thc: "22%",
    cbd: "0.5%",
    effects: ["Uplifted", "Creative"],
    description: "0.5g pre-rolls of our signature sativa blend. Ready to enjoy.",
    image: { url: "/assets/products/sunrise-preroll.jpg", alt: "Sunrise Pre-Roll Pack" },
    stock: 278,
    purchasesLast30d: 423,
  },
  {
    __id: "prod-preroll-002",
    name: "Moonlight Indica Joints",
    slug: "moonlight-joints",
    price: 38,
    type: "Pre-Roll",
    brand: "Aurora Collection",
    category: "Pre-rolls",
    isRecalled: false,
    thc: "25%",
    cbd: "0.3%",
    effects: ["Sleepy", "Relaxed"],
    description: "Premium indica pre-rolls for evening relaxation. 5x 0.5g joints.",
    image: { url: "/assets/products/moonlight-joints.jpg", alt: "Moonlight Indica Joints" },
    stock: 198,
    purchasesLast30d: 312,
  },
  // Recalled product for compliance demo
  {
    __id: "prod-flower-recalled",
    name: "Purple Haze Batch #2024-12",
    slug: "purple-haze-recalled",
    price: 38,
    type: "Flower",
    brand: "Legacy Strains",
    category: "Flower",
    isRecalled: true,
    recallReason: "Voluntary recall - pesticide levels above threshold in batch #PH-2024-12. Customer safety is our priority.",
    thc: "19%",
    cbd: "0.2%",
    description: "Classic sativa strain (RECALLED - do not sell)",
    image: { url: "/assets/products/purple-haze.jpg", alt: "Purple Haze - RECALLED" },
    stock: 0,
    purchasesLast30d: 0,
  },
];

// ============================================================================
// STORES - Multi-state retail footprint with real coordinates
// ============================================================================
export const DEMO_STORES = [
  {
    id: "store-detroit-downtown",
    name: "Detroit Downtown Flagship",
    slug: "detroit-downtown",
    address: "1420 Woodward Ave, Detroit, MI 48226",
    city: "Detroit",
    state: "MI",
    postalCode: "48226",
    phone: "+1-313-555-0100",
    timezone: "America/Detroit",
    latitude: 42.3314,
    longitude: -83.0458,
    isPickup: true,
    isDelivery: true,
    hoursToday: "9:00 AM - 10:00 PM",
    revenue30d: 287500,
    orders30d: 1842,
    avgOrderValue: 156,
    status: "active",
  },
  {
    id: "store-detroit-eastside",
    name: "Detroit Eastside",
    slug: "detroit-eastside", 
    address: "15200 E Warren Ave, Detroit, MI 48224",
    city: "Detroit",
    state: "MI",
    postalCode: "48224",
    phone: "+1-313-555-0101",
    timezone: "America/Detroit",
    latitude: 42.4073,
    longitude: -82.9680,
    isPickup: true,
    isDelivery: false,
    hoursToday: "10:00 AM - 9:00 PM",
    revenue30d: 198400,
    orders30d: 1356,
    avgOrderValue: 146,
  },
  {
    id: "store-ann-arbor",
    name: "Ann Arbor State Street",
    slug: "ann-arbor",
    address: "220 S State St, Ann Arbor, MI 48104",
    city: "Ann Arbor",
    state: "MI",
    postalCode: "48104",
    phone: "+1-734-555-0102",
    timezone: "America/Detroit",
    latitude: 42.2808,
    longitude: -83.7430,
    isPickup: true,
    isDelivery: true,
    hoursToday: "9:00 AM - 11:00 PM",
    revenue30d: 312600,
    orders30d: 2134,
    avgOrderValue: 147,
  },
  {
    id: "store-chicago-loop",
    name: "Chicago Loop",
    slug: "chicago-loop",
    address: "100 N State St, Chicago, IL 60602",
    city: "Chicago",
    state: "IL",
    postalCode: "60602",
    phone: "+1-312-555-0200",
    timezone: "America/Chicago",
    latitude: 41.8819,
    longitude: -87.6278,
    isPickup: true,
    isDelivery: true,
    hoursToday: "8:00 AM - 10:00 PM",
    revenue30d: 425800,
    orders30d: 2876,
    avgOrderValue: 148,
  },
  {
    id: "store-chicago-wicker",
    name: "Chicago Wicker Park",
    slug: "chicago-wicker-park",
    address: "1601 N Milwaukee Ave, Chicago, IL 60647",
    city: "Chicago",
    state: "IL",
    postalCode: "60647",
    phone: "+1-312-555-0201",
    timezone: "America/Chicago",
    latitude: 41.9103,
    longitude: -87.6736,
    isPickup: true,
    isDelivery: true,
    hoursToday: "10:00 AM - 11:00 PM",
    revenue30d: 356200,
    orders30d: 2345,
    avgOrderValue: 152,
  },
  {
    id: "store-denver-downtown",
    name: "Denver LoDo",
    slug: "denver-lodo",
    address: "1600 Market St, Denver, CO 80202",
    city: "Denver",
    state: "CO",
    postalCode: "80202",
    phone: "+1-720-555-0300",
    timezone: "America/Denver",
    latitude: 39.7508,
    longitude: -104.9966,
    isPickup: true,
    isDelivery: true,
    hoursToday: "8:00 AM - 12:00 AM",
    revenue30d: 534200,
    orders30d: 3421,
    avgOrderValue: 156,
  },
  {
    id: "store-la-venice",
    name: "Los Angeles Venice Beach",
    slug: "la-venice",
    address: "1401 Ocean Front Walk, Venice, CA 90291",
    city: "Los Angeles",
    state: "CA",
    postalCode: "90291",
    phone: "+1-424-555-0400",
    timezone: "America/Los_Angeles",
    latitude: 33.9850,
    longitude: -118.4695,
    isPickup: true,
    isDelivery: true,
    hoursToday: "9:00 AM - 10:00 PM",
    revenue30d: 478900,
    orders30d: 2987,
    avgOrderValue: 160,
  },
  {
    id: "store-sf-haight",
    name: "San Francisco Haight-Ashbury",
    slug: "sf-haight",
    address: "1500 Haight St, San Francisco, CA 94117",
    city: "San Francisco",
    state: "CA",
    postalCode: "94117",
    phone: "+1-415-555-0500",
    timezone: "America/Los_Angeles",
    latitude: 37.7699,
    longitude: -122.4469,
    isPickup: true,
    isDelivery: false,
    hoursToday: "10:00 AM - 9:00 PM",
    revenue30d: 389500,
    orders30d: 2567,
    avgOrderValue: 152,
  },
];

// ============================================================================
// ORDERS - Realistic order volume with various statuses
// ============================================================================
const generateRecentOrders = () => {
  const customers = [
    { id: "cust-001", email: "james.wilson@gmail.com", name: "James Wilson" },
    { id: "cust-002", email: "sarah.chen@outlook.com", name: "Sarah Chen" },
    { id: "cust-003", email: "mike.rodriguez@yahoo.com", name: "Michael Rodriguez" },
    { id: "cust-004", email: "emily.johnson@icloud.com", name: "Emily Johnson" },
    { id: "cust-005", email: "david.kim@gmail.com", name: "David Kim" },
    { id: "cust-006", email: "lisa.patel@hotmail.com", name: "Lisa Patel" },
    { id: "cust-007", email: "chris.thompson@gmail.com", name: "Chris Thompson" },
    { id: "cust-008", email: "amanda.garcia@outlook.com", name: "Amanda Garcia" },
    { id: "cust-009", email: "ryan.murphy@yahoo.com", name: "Ryan Murphy" },
    { id: "cust-010", email: "jennifer.lee@gmail.com", name: "Jennifer Lee" },
  ];
  
  const orders = [];
  const statuses = ["FULFILLED", "FULFILLED", "FULFILLED", "PAID", "PAID", "PENDING", "CANCELLED", "REFUNDED"];
  const stores = DEMO_STORES.slice(0, 4);
  
  for (let i = 0; i < 25; i++) {
    const customer = customers[i % customers.length];
    const store = stores[i % stores.length];
    const status = statuses[i % statuses.length];
    const hoursAgo = Math.floor(Math.random() * 168); // Up to 7 days ago
    const total = 35 + Math.floor(Math.random() * 150);
    
    orders.push({
      id: `order-${String(i + 1).padStart(5, "0")}`,
      status,
      total,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * hoursAgo).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * (hoursAgo - 1)).toISOString(),
      userId: customer.id,
      storeId: store.id,
      user: { id: customer.id, email: customer.email, name: customer.name },
      store: { id: store.id, name: store.name, slug: store.slug, tenant: { slug: "nimbus-enterprise" } },
      itemsCount: 1 + Math.floor(Math.random() * 4),
    });
  }
  
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const DEMO_ORDERS = generateRecentOrders();

// ============================================================================
// ADMIN USERS - Enterprise team structure
// ============================================================================
export const DEMO_ADMIN_USERS = [
  {
    id: "admin-owner-001",
    email: "ceo@nimbuscannabis.com",
    name: "Alexandra Martinez",
    role: "OWNER",
    organizationSlug: "nimbus-enterprise",
    brandSlug: null,
    storeSlug: null,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "admin-org-001",
    email: "operations@nimbuscannabis.com",
    name: "Marcus Thompson",
    role: "ORG_ADMIN",
    organizationSlug: "nimbus-enterprise",
    brandSlug: null,
    storeSlug: null,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "admin-brand-001",
    email: "brand.manager@nimbuscannabis.com",
    name: "Jordan Lee",
    role: "BRAND_ADMIN",
    organizationSlug: "nimbus-enterprise",
    brandSlug: "nimbus-premium",
    storeSlug: null,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "admin-store-001",
    email: "detroit.manager@nimbuscannabis.com",
    name: "Samantha Wright",
    role: "STORE_MANAGER",
    organizationSlug: "nimbus-enterprise",
    brandSlug: null,
    storeSlug: "detroit-downtown",
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: "admin-editor-001",
    email: "content@nimbuscannabis.com",
    name: "Tyler Brooks",
    role: "EDITOR",
    organizationSlug: "nimbus-enterprise",
    brandSlug: null,
    storeSlug: null,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "admin-viewer-001",
    email: "analytics@nimbuscannabis.com",
    name: "Casey Rivera",
    role: "VIEWER",
    organizationSlug: "nimbus-enterprise",
    brandSlug: null,
    storeSlug: null,
    isActive: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

// ============================================================================
// ANALYTICS - Enterprise-grade metrics for dashboard
// ============================================================================
export const DEMO_ANALYTICS_OVERVIEW = {
  // Real-time traffic data (last 8 hours)
  traffic: [
    { timestamp: "09:00", visits: 1240, unique: 890, bounceRate: 32 },
    { timestamp: "10:00", visits: 1856, unique: 1234, bounceRate: 28 },
    { timestamp: "11:00", visits: 2134, unique: 1567, bounceRate: 25 },
    { timestamp: "12:00", visits: 2890, unique: 2012, bounceRate: 22 },
    { timestamp: "13:00", visits: 2456, unique: 1789, bounceRate: 24 },
    { timestamp: "14:00", visits: 2678, unique: 1923, bounceRate: 23 },
    { timestamp: "15:00", visits: 3012, unique: 2234, bounceRate: 21 },
    { timestamp: "16:00", visits: 2789, unique: 2056, bounceRate: 22 },
  ],
  // Revenue by hour
  sales: [
    { timestamp: "09:00", value: 12450, orders: 42 },
    { timestamp: "10:00", value: 18900, orders: 67 },
    { timestamp: "11:00", value: 24300, orders: 89 },
    { timestamp: "12:00", value: 31200, orders: 112 },
    { timestamp: "13:00", value: 28700, orders: 98 },
    { timestamp: "14:00", value: 26400, orders: 94 },
    { timestamp: "15:00", value: 35600, orders: 124 },
    { timestamp: "16:00", value: 32100, orders: 108 },
  ],
  // Weekly engagement metrics
  engagement: [
    { timestamp: "Mon", depth: 4.8, retention: 58, conversion: 3.2 },
    { timestamp: "Tue", depth: 5.2, retention: 61, conversion: 3.5 },
    { timestamp: "Wed", depth: 5.6, retention: 64, conversion: 3.8 },
    { timestamp: "Thu", depth: 5.9, retention: 67, conversion: 4.1 },
    { timestamp: "Fri", depth: 6.4, retention: 72, conversion: 4.6 },
    { timestamp: "Sat", depth: 7.1, retention: 78, conversion: 5.2 },
    { timestamp: "Sun", depth: 6.8, retention: 75, conversion: 4.9 },
  ],
  // Top performing content
  topArticles: [
    { contentSlug: "michigan-cannabis-laws-2026", title: "Michigan Cannabis Laws 2026 Guide", views: 12840, clickThroughs: 3420, shares: 892 },
    { contentSlug: "terpene-guide-complete", title: "Complete Guide to Cannabis Terpenes", views: 9860, clickThroughs: 2890, shares: 567 },
    { contentSlug: "edibles-dosing-beginners", title: "Edibles Dosing for Beginners", views: 8420, clickThroughs: 2340, shares: 423 },
    { contentSlug: "cbd-vs-thc-explained", title: "CBD vs THC: What's the Difference?", views: 7650, clickThroughs: 2120, shares: 389 },
    { contentSlug: "dispensary-etiquette", title: "First Time at a Dispensary? Read This", views: 6890, clickThroughs: 1890, shares: 312 },
  ],
  // FAQ performance
  topFaqs: [
    { contentSlug: "faq-first-time-buyer", title: "What should first-time buyers know?", views: 4560, clickThroughs: 1230, deflectionRate: 78 },
    { contentSlug: "faq-delivery-time", title: "How long does delivery take?", views: 3890, clickThroughs: 980, deflectionRate: 82 },
    { contentSlug: "faq-return-policy", title: "What is your return policy?", views: 3240, clickThroughs: 890, deflectionRate: 75 },
    { contentSlug: "faq-payment-methods", title: "What payment methods do you accept?", views: 2980, clickThroughs: 780, deflectionRate: 88 },
    { contentSlug: "faq-medical-card", title: "Do I need a medical card?", views: 2670, clickThroughs: 720, deflectionRate: 71 },
  ],
  // Top products with velocity data
  topProducts: [
    { contentSlug: "nimbus-og-kush", name: "Nimbus OG Kush", views: 15670, clickThroughs: 4890, sales: 342, revenue: 15390 },
    { contentSlug: "midnight-mints", name: "Midnight Mints 10-Pack", views: 12340, clickThroughs: 4120, sales: 445, revenue: 11125 },
    { contentSlug: "og-kush-pod", name: "OG Kush Distillate Pod", views: 11890, clickThroughs: 3890, sales: 456, revenue: 21888 },
    { contentSlug: "sunrise-preroll-5pk", name: "Sunrise Pre-Roll 5-Pack", views: 10450, clickThroughs: 3450, sales: 423, revenue: 14805 },
    { contentSlug: "limonene-live-resin", name: "Limonene Live Resin Cart", views: 9870, clickThroughs: 3120, sales: 312, revenue: 17160 },
  ],
  // Product trend sparklines
  productSeries: [
    {
      slug: "nimbus-og-kush",
      series: [
        { date: "Day 1", views: 1890, sales: 42 },
        { date: "Day 2", views: 2120, sales: 48 },
        { date: "Day 3", views: 2340, sales: 52 },
        { date: "Day 4", views: 2560, sales: 58 },
        { date: "Day 5", views: 2890, sales: 64 },
        { date: "Day 6", views: 3120, sales: 72 },
        { date: "Day 7", views: 2750, sales: 56 },
      ],
    },
    {
      slug: "midnight-mints",
      series: [
        { date: "Day 1", views: 1560, sales: 56 },
        { date: "Day 2", views: 1780, sales: 62 },
        { date: "Day 3", views: 1920, sales: 68 },
        { date: "Day 4", views: 2100, sales: 72 },
        { date: "Day 5", views: 1890, sales: 65 },
        { date: "Day 6", views: 2230, sales: 78 },
        { date: "Day 7", views: 1860, sales: 44 },
      ],
    },
    {
      slug: "og-kush-pod",
      series: [
        { date: "Day 1", views: 1450, sales: 58 },
        { date: "Day 2", views: 1680, sales: 64 },
        { date: "Day 3", views: 1890, sales: 72 },
        { date: "Day 4", views: 1720, sales: 66 },
        { date: "Day 5", views: 2010, sales: 78 },
        { date: "Day 6", views: 2240, sales: 84 },
        { date: "Day 7", views: 1900, sales: 34 },
      ],
    },
  ],
  // Store engagement with geo data for heatmap
  storeEngagement: [
    {
      storeSlug: "detroit-downtown",
      storeName: "Detroit Downtown Flagship",
      longitude: -83.0458,
      latitude: 42.3314,
      engagement: 92,
      views: 15680,
      clickThroughs: 4890,
      orders: 1842,
      revenue: 287500,
      avgOrderValue: 156,
    },
    {
      storeSlug: "detroit-eastside",
      storeName: "Detroit Eastside",
      longitude: -82.9680,
      latitude: 42.4073,
      engagement: 78,
      views: 12340,
      clickThroughs: 3670,
      orders: 1356,
      revenue: 198400,
      avgOrderValue: 146,
    },
    {
      storeSlug: "ann-arbor",
      storeName: "Ann Arbor State Street",
      longitude: -83.7430,
      latitude: 42.2808,
      engagement: 95,
      views: 18900,
      clickThroughs: 5670,
      orders: 2134,
      revenue: 312600,
      avgOrderValue: 147,
    },
    {
      storeSlug: "chicago-loop",
      storeName: "Chicago Loop",
      longitude: -87.6278,
      latitude: 41.8819,
      engagement: 98,
      views: 24560,
      clickThroughs: 7230,
      orders: 2876,
      revenue: 425800,
      avgOrderValue: 148,
    },
    {
      storeSlug: "chicago-wicker-park",
      storeName: "Chicago Wicker Park",
      longitude: -87.6736,
      latitude: 41.9103,
      engagement: 88,
      views: 19870,
      clickThroughs: 5890,
      orders: 2345,
      revenue: 356200,
      avgOrderValue: 152,
    },
    {
      storeSlug: "denver-lodo",
      storeName: "Denver LoDo",
      longitude: -104.9966,
      latitude: 39.7508,
      engagement: 96,
      views: 28900,
      clickThroughs: 8670,
      orders: 3421,
      revenue: 534200,
      avgOrderValue: 156,
    },
    {
      storeSlug: "la-venice",
      storeName: "Los Angeles Venice Beach",
      longitude: -118.4695,
      latitude: 33.9850,
      engagement: 94,
      views: 26780,
      clickThroughs: 7890,
      orders: 2987,
      revenue: 478900,
      avgOrderValue: 160,
    },
    {
      storeSlug: "sf-haight",
      storeName: "San Francisco Haight-Ashbury",
      longitude: -122.4469,
      latitude: 37.7699,
      engagement: 89,
      views: 21340,
      clickThroughs: 6340,
      orders: 2567,
      revenue: 389500,
      avgOrderValue: 152,
    },
  ],
  // Product demand indicators
  productDemand: [
    { slug: "nimbus-og-kush", name: "Nimbus OG Kush", demandScore: 96, status: "Hot", trend: "+18%", daysToStockout: 12 },
    { slug: "midnight-mints", name: "Midnight Mints", demandScore: 92, status: "Hot", trend: "+24%", daysToStockout: 8 },
    { slug: "og-kush-pod", name: "OG Kush Pod", demandScore: 88, status: "Watch", trend: "+15%", daysToStockout: 14 },
    { slug: "sunrise-preroll-5pk", name: "Sunrise Pre-Roll", demandScore: 84, status: "Watch", trend: "+12%", daysToStockout: 18 },
    { slug: "limonene-live-resin", name: "Limonene Cart", demandScore: 79, status: "Stable", trend: "+8%", daysToStockout: 22 },
    { slug: "wedding-cake", name: "Wedding Cake", demandScore: 75, status: "Stable", trend: "+5%", daysToStockout: 28 },
  ],
  // Summary KPIs
  kpis: {
    totalRevenue: 2983100,
    totalOrders: 19528,
    avgOrderValue: 153,
    conversionRate: 4.2,
    returningCustomers: 68,
    customerSatisfaction: 4.7,
    inventoryTurnover: 3.2,
    complianceScore: 98,
  },
  _demo: true,
  _generatedAt: new Date().toISOString(),
};

// ============================================================================
// COMPLIANCE DATA - For legal/compliance dashboard
// ============================================================================
export const DEMO_COMPLIANCE = {
  overall: { score: 98, status: "Excellent" },
  categories: [
    { name: "Age Verification", score: 100, status: "Pass", lastAudit: "2026-01-10" },
    { name: "Product Labeling", score: 97, status: "Pass", lastAudit: "2026-01-08" },
    { name: "Inventory Tracking", score: 99, status: "Pass", lastAudit: "2026-01-12" },
    { name: "Security Protocols", score: 96, status: "Pass", lastAudit: "2026-01-11" },
    { name: "Employee Training", score: 94, status: "Pass", lastAudit: "2026-01-05" },
  ],
  recentAudits: [
    { date: "2026-01-12", auditor: "State Board", result: "Pass", notes: "No violations found" },
    { date: "2025-12-15", auditor: "Internal QA", result: "Pass", notes: "Minor documentation update recommended" },
    { date: "2025-11-20", auditor: "State Board", result: "Pass", notes: "Exemplary compliance" },
  ],
};

// ============================================================================
// HEATMAP DATA - For geographic visualization
// ============================================================================
export const DEMO_HEATMAP_STORES = DEMO_STORES.map((store) => ({
  storeSlug: store.slug,
  storeName: store.name,
  longitude: store.longitude,
  latitude: store.latitude,
  engagement: Math.floor(70 + Math.random() * 30),
  views: store.orders30d * 8,
  clickThroughs: store.orders30d * 2,
  revenue: store.revenue30d,
  orders: store.orders30d,
}));

/**
 * Check if we should use demo data (for E2E testing or demo environments)
 */
export function shouldUseDemoData(): boolean {
  const env = process.env.NODE_ENV || "development";
  const useDemoData = process.env.USE_DEMO_DATA === "true";
  const isE2E = process.env.E2E_MODE === "true" || process.env.PLAYWRIGHT_TEST === "1";
  
  return useDemoData || isE2E || env === "development";
}

/**
 * Get demo order by ID with full details including items
 */
export function getDemoOrderById(orderId: string) {
  const order = DEMO_ORDERS.find((o) => o.id === orderId);
  if (!order) return null;
  
  // Generate realistic order items
  const items = [];
  const products = DEMO_PRODUCTS.filter((p) => !p.isRecalled);
  const itemCount = order.itemsCount || 1 + Math.floor(Math.random() * 3);
  
  let runningTotal = 0;
  for (let i = 0; i < itemCount; i++) {
    const product = products[i % products.length];
    const quantity = 1 + Math.floor(Math.random() * 2);
    const price = product.price * quantity;
    runningTotal += price;
    
    items.push({
      id: `${order.id}-item-${i + 1}`,
      productId: product.__id,
      variantId: null,
      quantity,
      price,
      product: { id: product.__id, name: product.name, slug: product.slug },
      variant: null,
    });
  }
  
  return {
    ...order,
    items,
    total: runningTotal || order.total,
  };
}
// ============================================================================
// NOTIFICATIONS - Enterprise notification preferences
// ============================================================================
export const DEMO_NOTIFICATIONS = [
  {
    id: "notif-001",
    type: "order",
    title: "New order #ORD-2026-0025",
    message: "Blue Dream Sativa x2 - $84.00 from Detroit Downtown",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    priority: "normal",
  },
  {
    id: "notif-002", 
    type: "compliance",
    title: "Compliance audit scheduled",
    message: "State Board audit scheduled for January 20, 2026",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    priority: "high",
  },
  {
    id: "notif-003",
    type: "inventory",
    title: "Low stock alert",
    message: "Midnight Mints 10-Pack below reorder threshold (8 days to stockout)",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
    priority: "normal",
  },
  {
    id: "notif-004",
    type: "system",
    title: "Daily analytics report ready",
    message: "View your store performance summary for January 12, 2026",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    read: true,
    priority: "low",
  },
  {
    id: "notif-005",
    type: "order",
    title: "Order fulfilled: #ORD-2026-0018",
    message: "Shipping label created - tracking available",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    priority: "normal",
  },
];

// ============================================================================
// BILLING - Enterprise billing/subscription data
// ============================================================================
export const DEMO_BILLING = {
  plan: {
    name: "Enterprise",
    tier: "enterprise",
    price: 499,
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited stores",
      "Unlimited products",
      "Advanced analytics",
      "API access",
      "Priority support",
      "Custom integrations",
      "Multi-tenant support",
      "Compliance dashboard",
      "White-label options",
    ],
  },
  subscription: {
    id: "sub_nimbus_enterprise_001",
    status: "active",
    currentPeriodStart: "2026-01-01T00:00:00Z",
    currentPeriodEnd: "2026-01-31T23:59:59Z",
    cancelAtPeriodEnd: false,
  },
  invoices: [
    { id: "inv-001", date: "2026-01-01", amount: 499, status: "paid", description: "Enterprise Plan - January 2026" },
    { id: "inv-002", date: "2025-12-01", amount: 499, status: "paid", description: "Enterprise Plan - December 2025" },
    { id: "inv-003", date: "2025-11-01", amount: 499, status: "paid", description: "Enterprise Plan - November 2025" },
  ],
  paymentMethod: {
    type: "card",
    brand: "visa",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2028,
  },
  usage: {
    stores: { used: 8, limit: -1, label: "Unlimited" },
    products: { used: 156, limit: -1, label: "Unlimited" },
    orders: { used: 2543, limit: -1, label: "Unlimited" },
    apiCalls: { used: 125890, limit: 1000000, label: "1M/month" },
    storage: { used: 2.4, limit: 100, unit: "GB" },
  },
};

// ============================================================================
// USAGE METRICS - API and resource usage
// ============================================================================
export const DEMO_USAGE = {
  period: {
    start: "2026-01-01T00:00:00Z",
    end: "2026-01-31T23:59:59Z",
  },
  apiCalls: {
    total: 125890,
    breakdown: [
      { endpoint: "GET /api/products", calls: 45230, avgLatency: 45 },
      { endpoint: "GET /api/orders", calls: 32450, avgLatency: 68 },
      { endpoint: "POST /api/orders", calls: 2543, avgLatency: 120 },
      { endpoint: "GET /api/analytics", calls: 18760, avgLatency: 230 },
      { endpoint: "GET /api/stores", calls: 12340, avgLatency: 52 },
      { endpoint: "POST /personalization/apply", calls: 8970, avgLatency: 85 },
      { endpoint: "Other", calls: 5597, avgLatency: 95 },
    ],
    dailySeries: [
      { date: "Jan 7", calls: 15230 },
      { date: "Jan 8", calls: 18450 },
      { date: "Jan 9", calls: 21230 },
      { date: "Jan 10", calls: 19870 },
      { date: "Jan 11", calls: 24560 },
      { date: "Jan 12", calls: 22340 },
      { date: "Jan 13", calls: 24210 },
    ],
  },
  bandwidth: {
    total: 45.6,
    unit: "GB",
    breakdown: [
      { type: "API responses", amount: 32.4 },
      { type: "Assets", amount: 8.9 },
      { type: "Reports", amount: 4.3 },
    ],
  },
  storage: {
    total: 2.4,
    unit: "GB",
    breakdown: [
      { type: "Product images", amount: 1.2 },
      { type: "Documents", amount: 0.6 },
      { type: "Analytics data", amount: 0.4 },
      { type: "Backups", amount: 0.2 },
    ],
  },
};

// ============================================================================
// WORKSPACES - Multi-tenant workspaces
// ============================================================================
export const DEMO_WORKSPACES = [
  {
    id: "ws-001",
    name: "Nimbus Cannabis Co",
    slug: "nimbus-cannabis",
    role: "owner",
    members: 12,
    stores: 8,
    createdAt: "2024-06-15T00:00:00Z",
    plan: "Enterprise",
    status: "active",
  },
  {
    id: "ws-002",
    name: "Aurora Dispensaries",
    slug: "aurora-dispensaries",
    role: "admin",
    members: 6,
    stores: 4,
    createdAt: "2024-09-20T00:00:00Z",
    plan: "Professional",
    status: "active",
  },
  {
    id: "ws-003",
    name: "Demo Sandbox",
    slug: "demo-sandbox",
    role: "owner",
    members: 2,
    stores: 1,
    createdAt: "2025-01-01T00:00:00Z",
    plan: "Starter",
    status: "active",
  },
];

// ============================================================================
// CONTENT - CMS content items
// ============================================================================
export const DEMO_CONTENT = {
  articles: [
    { _id: "art-001", title: "Complete Guide to Cannabis Terpenes", slug: "terpene-guide-complete", status: "published", author: "Dr. Sarah Chen", publishedAt: "2026-01-10T10:00:00Z", views: 9860 },
    { _id: "art-002", title: "Edibles Dosing for Beginners", slug: "edibles-dosing-beginners", status: "published", author: "Mike Johnson", publishedAt: "2026-01-08T14:30:00Z", views: 8420 },
    { _id: "art-003", title: "CBD vs THC: What's the Difference?", slug: "cbd-vs-thc-explained", status: "published", author: "Dr. Sarah Chen", publishedAt: "2026-01-05T09:00:00Z", views: 7650 },
    { _id: "art-004", title: "First Time at a Dispensary?", slug: "dispensary-etiquette", status: "draft", author: "Emily Torres", publishedAt: null, views: 0 },
  ],
  faqs: [
    { _id: "faq-001", question: "What should first-time buyers know?", slug: "faq-first-time-buyer", status: "published", views: 4560 },
    { _id: "faq-002", question: "How long does delivery take?", slug: "faq-delivery-time", status: "published", views: 3890 },
    { _id: "faq-003", question: "What is your return policy?", slug: "faq-return-policy", status: "published", views: 3240 },
    { _id: "faq-004", question: "What payment methods do you accept?", slug: "faq-payment-methods", status: "published", views: 2980 },
  ],
  pages: [
    { _id: "page-001", title: "About Us", slug: "about", status: "published", updatedAt: "2026-01-01T00:00:00Z" },
    { _id: "page-002", title: "Contact", slug: "contact", status: "published", updatedAt: "2025-12-15T00:00:00Z" },
    { _id: "page-003", title: "Careers", slug: "careers", status: "draft", updatedAt: "2026-01-12T00:00:00Z" },
  ],
  totalCount: 11,
};

// ============================================================================
// COMPLIANCE OVERVIEW - Detailed compliance data
// ============================================================================
export const DEMO_COMPLIANCE_OVERVIEW = {
  results: [
    {
      storeSlug: "detroit-downtown",
      storeName: "Detroit Downtown Flagship",
      state: "MI",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "COMPLIANT", lastUpdated: "2026-01-05", score: 98 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 99.5,
    },
    {
      storeSlug: "detroit-eastside",
      storeName: "Detroit Eastside",
      state: "MI",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "WARNING", lastUpdated: "2026-01-05", score: 92 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 98,
    },
    {
      storeSlug: "ann-arbor",
      storeName: "Ann Arbor State Street",
      state: "MI",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "COMPLIANT", lastUpdated: "2026-01-05", score: 100 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 100,
    },
    {
      storeSlug: "chicago-loop",
      storeName: "Chicago Loop",
      state: "IL",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "COMPLIANT", lastUpdated: "2026-01-05", score: 96 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 99,
    },
    {
      storeSlug: "chicago-wicker-park",
      storeName: "Chicago Wicker Park",
      state: "IL",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "COMPLIANT", lastUpdated: "2026-01-05", score: 100 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 100,
    },
    {
      storeSlug: "denver-lodo",
      storeName: "Denver LoDo",
      state: "CO",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "COMPLIANT", lastUpdated: "2026-01-05", score: 98 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 99.5,
    },
    {
      storeSlug: "la-venice",
      storeName: "Los Angeles Venice Beach",
      state: "CA",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "COMPLIANT", lastUpdated: "2026-01-05", score: 100 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 100,
    },
    {
      storeSlug: "sf-haight",
      storeName: "San Francisco Haight-Ashbury",
      state: "CA",
      terms: { status: "COMPLIANT", lastUpdated: "2026-01-10", score: 100 },
      privacy: { status: "COMPLIANT", lastUpdated: "2026-01-08", score: 100 },
      accessibility: { status: "COMPLIANT", lastUpdated: "2026-01-05", score: 97 },
      ageGate: { status: "COMPLIANT", lastUpdated: "2026-01-12", score: 100 },
      overallScore: 99.25,
    },
  ],
  snapshotTs: new Date().toISOString(),
  snapshotId: "complianceSnapshotLatest-nimbus",
};

export const DEMO_COMPLIANCE_HISTORY = [
  { id: "snap-001", ts: "2026-01-12T06:00:00Z", org: "nimbus", avgScore: 99.4, storeCount: 8, issues: 0 },
  { id: "snap-002", ts: "2026-01-11T06:00:00Z", org: "nimbus", avgScore: 99.2, storeCount: 8, issues: 1 },
  { id: "snap-003", ts: "2026-01-10T06:00:00Z", org: "nimbus", avgScore: 99.0, storeCount: 8, issues: 1 },
  { id: "snap-004", ts: "2026-01-09T06:00:00Z", org: "nimbus", avgScore: 98.8, storeCount: 8, issues: 2 },
  { id: "snap-005", ts: "2026-01-08T06:00:00Z", org: "nimbus", avgScore: 99.1, storeCount: 8, issues: 1 },
];

// ============================================================================
// PERSONALIZATION RULES - Demo rules with conditions and actions
// ============================================================================
export const DEMO_PERSONALIZATION_RULES = [
  {
    _id: "rule-001",
    name: "First-Time Buyer Welcome",
    description: "Show welcome content and beginner-friendly products to first-time visitors",
    enabled: true,
    conditions: [
      { key: "isFirstVisit", operator: "eq", value: "true" },
    ],
    actions: [
      { type: "boost", targetType: "article", targetSlug: "dispensary-etiquette", priorityBoost: 20 },
      { type: "boost", targetType: "product", targetSlug: "sunrise-gummies", priorityBoost: 15 },
    ],
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-01-10T14:30:00Z",
  },
  {
    _id: "rule-002",
    name: "Evening Relaxation",
    description: "Promote indica strains and sleep products during evening hours",
    enabled: true,
    conditions: [
      { key: "timeOfDay", operator: "in", value: "evening,night" },
    ],
    actions: [
      { type: "boost", targetType: "product", targetSlug: "nimbus-og-kush", priorityBoost: 25 },
      { type: "boost", targetType: "product", targetSlug: "midnight-mints", priorityBoost: 20 },
      { type: "boost", targetType: "product", targetSlug: "wedding-cake", priorityBoost: 18 },
    ],
    createdAt: "2025-11-15T09:00:00Z",
    updatedAt: "2026-01-05T11:00:00Z",
  },
  {
    _id: "rule-003",
    name: "Returning Customer Loyalty",
    description: "Show premium products and exclusive deals to returning customers",
    enabled: true,
    conditions: [
      { key: "lastPurchaseDaysAgo", operator: "lte", value: "30" },
    ],
    actions: [
      { type: "boost", targetType: "product", targetSlug: "limonene-live-resin", priorityBoost: 20 },
      { type: "boost", targetType: "deal", targetSlug: "loyalty-10-off", priorityBoost: 30 },
    ],
    createdAt: "2025-10-20T16:00:00Z",
    updatedAt: "2026-01-08T10:00:00Z",
  },
  {
    _id: "rule-004",
    name: "Location-Based Denver Specials",
    description: "Show Denver-specific products and local deals to Colorado visitors",
    enabled: true,
    conditions: [
      { key: "location", operator: "eq", value: "CO" },
    ],
    actions: [
      { type: "boost", targetType: "article", targetSlug: "colorado-cannabis-laws", priorityBoost: 15 },
      { type: "boost", targetType: "deal", targetSlug: "denver-local-discount", priorityBoost: 25 },
    ],
    createdAt: "2025-09-10T08:00:00Z",
    updatedAt: "2025-12-20T15:00:00Z",
  },
  {
    _id: "rule-005",
    name: "CBD Preference",
    description: "Prioritize CBD and balanced products for wellness-focused users",
    enabled: false,
    conditions: [
      { key: "preference", operator: "eq", value: "cbd" },
    ],
    actions: [
      { type: "boost", targetType: "product", targetSlug: "sunrise-gummies", priorityBoost: 30 },
      { type: "boost", targetType: "article", targetSlug: "cbd-vs-thc-explained", priorityBoost: 25 },
    ],
    createdAt: "2025-08-05T12:00:00Z",
    updatedAt: "2025-11-15T09:00:00Z",
  },
];

export const DEMO_PERSONALIZATION_SIMULATION = {
  items: [
    { id: "prod-001", slug: "nimbus-og-kush", title: "Nimbus OG Kush", type: "product", score: 85, appliedRules: ["Evening Relaxation"] },
    { id: "prod-002", slug: "midnight-mints", title: "Midnight Mints 10-Pack", type: "product", score: 80, appliedRules: ["Evening Relaxation"] },
    { id: "art-001", slug: "terpene-guide-complete", title: "Complete Guide to Cannabis Terpenes", type: "article", score: 75, appliedRules: [] },
    { id: "prod-003", slug: "wedding-cake", title: "Wedding Cake Indica", type: "product", score: 72, appliedRules: ["Evening Relaxation"] },
    { id: "art-002", slug: "edibles-dosing-beginners", title: "Edibles Dosing for Beginners", type: "article", score: 68, appliedRules: [] },
  ],
  context: { timeOfDay: "evening", preference: "", location: "", lastPurchaseDaysAgo: 0 },
  rulesApplied: 1,
  totalItems: 5,
};

// ============================================================================
// INTEGRATIONS - Third-party integrations
// ============================================================================
export const DEMO_INTEGRATIONS = [
  {
    id: "int-001",
    name: "Stripe",
    type: "payment",
    status: "connected",
    icon: "💳",
    description: "Payment processing and subscriptions",
    connectedAt: "2024-06-15T00:00:00Z",
    lastSyncAt: "2026-01-13T06:00:00Z",
    config: { mode: "live", webhooksEnabled: true },
  },
  {
    id: "int-002",
    name: "Metrc",

    type: "compliance",
    status: "connected",
    icon: "📋",
    description: "Cannabis tracking and compliance reporting",
    connectedAt: "2024-07-01T00:00:00Z",
    lastSyncAt: "2026-01-13T00:00:00Z",
    config: { autoSync: true, syncInterval: "hourly" },
  },
  {
    id: "int-003",
    name: "Leafly",
    type: "marketplace",
    status: "connected",
    icon: "🍃",
    description: "Menu sync and customer reviews",
    connectedAt: "2024-08-15T00:00:00Z",
    lastSyncAt: "2026-01-12T12:00:00Z",
    config: { menuSync: true, reviewsEnabled: true },
  },
  {
    id: "int-004",
    name: "Google Analytics",
    type: "analytics",
    status: "connected",
    icon: "📊",
    description: "Website traffic and conversion tracking",
    connectedAt: "2024-06-20T00:00:00Z",
    lastSyncAt: "2026-01-13T05:00:00Z",
    config: { trackingId: "GA-XXXXXX", enhancedEcommerce: true },
  },
  {
    id: "int-005",
    name: "Mailchimp",
    type: "marketing",
    status: "disconnected",
    icon: "📧",
    description: "Email marketing automation",
    connectedAt: null,
    lastSyncAt: null,
    config: null,
  },
  {
    id: "int-006",
    name: "Slack",
    type: "notifications",
    status: "connected",
    icon: "💬",
    description: "Team notifications and alerts",
    connectedAt: "2024-09-01T00:00:00Z",
    lastSyncAt: "2026-01-13T09:00:00Z",
    config: { channel: "#nimbus-alerts", orderNotifications: true },
  },
];

// ============================================================================
// API KEYS - Developer API access
// ============================================================================
export const DEMO_API_KEYS = [
  {
    id: "key-001",
    name: "Production Mobile App",
    prefix: "nbs_live_",
    lastUsed: "2026-01-13T09:45:00Z",
    createdAt: "2024-06-15T00:00:00Z",
    scopes: ["products:read", "orders:read", "orders:write", "stores:read"],
    status: "active",
    requestsToday: 12450,
    requestsLimit: 100000,
  },
  {
    id: "key-002",
    name: "Analytics Dashboard",
    prefix: "nbs_live_",
    lastUsed: "2026-01-13T08:30:00Z",
    createdAt: "2024-07-20T00:00:00Z",
    scopes: ["analytics:read", "stores:read", "products:read"],
    status: "active",
    requestsToday: 3420,
    requestsLimit: 50000,
  },
  {
    id: "key-003",
    name: "Test Environment",
    prefix: "nbs_test_",
    lastUsed: "2026-01-10T14:00:00Z",
    createdAt: "2024-08-01T00:00:00Z",
    scopes: ["products:read", "products:write", "orders:read"],
    status: "active",
    requestsToday: 156,
    requestsLimit: 10000,
  },
];