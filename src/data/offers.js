/**
 * DEMO OFFERS.
 *
 * Illustrative promotions only. Nothing here reflects a real Orange campaign,
 * price or eligibility rule. Read them through `services/offers/offerService.js`
 * so a real offers/personalisation API can replace this module later.
 *
 * `value` + `validity` + `price` are what the compact Home card shows;
 * `description` is what OMASTA AI uses when asked about the offer.
 */

export const OFFERS = [
  {
    id: "offer-data-5gb-week",
    kind: "data",
    title: "Weekly data",
    value: "5 GB",
    validity: "7 days",
    price: "SLE 45",
    description: "An example weekly data bundle for everyday browsing and messaging.",
    bundleId: "data-5gb-weekly",
    cta: "See the bundle",
    action: { type: "open_bundle", bundleId: "data-5gb-weekly" },
    isDemo: true,
  },
  {
    id: "offer-weekend-data",
    kind: "data",
    title: "Weekend bundle",
    value: "3 GB",
    validity: "Sat to Sun",
    price: "SLE 25",
    description: "An example of a weekend-only data promotion, priced for light users.",
    bundleId: null,
    cta: "Browse data bundles",
    action: { type: "navigate", target: "/shop", params: { tab: "bundles", type: "data" } },
    isDemo: true,
  },
  {
    id: "offer-voice-200",
    kind: "voice",
    title: "Voice bundle",
    value: "200 min",
    validity: "7 days",
    price: "SLE 55",
    description: "An example weekly voice bundle for calls to Orange numbers.",
    bundleId: "voice-200-weekly",
    cta: "See the bundle",
    action: { type: "open_bundle", bundleId: "voice-200-weekly" },
    isDemo: true,
  },
  {
    id: "offer-router-pack",
    kind: "device",
    title: "Router starter pack",
    value: "Router + 50 GB",
    validity: "30 days",
    price: "SLE 1,590",
    description: "A sample device promotion pairing a home router with a month of data.",
    bundleId: null,
    cta: "View product",
    action: { type: "open_product", productId: "router-bundle-pack" },
    isDemo: true,
  },
];
