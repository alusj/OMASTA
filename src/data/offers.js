/**
 * DEMO OFFERS.
 *
 * Illustrative promotions only. Nothing here reflects a real Orange campaign,
 * price or eligibility rule. Wire to a real offers/personalisation API before
 * presenting any of this to customers.
 */

export const OFFERS = [
  {
    id: "offer-weekend-data",
    kind: "data",
    title: "Weekend data boost",
    description: "An example of a weekend data promotion, priced for light users.",
    value: "5 GB",
    price: "SLE 45",
    cta: "See the bundle",
    action: { type: "open_bundle", bundleId: "data-5gb-weekly" },
    isDemo: true,
  },
  {
    id: "offer-router-pack",
    kind: "device",
    title: "Router starter pack",
    description: "A sample device promotion pairing a home router with a month of data.",
    value: "Router + 50 GB",
    price: "SLE 1,590",
    cta: "View product",
    action: { type: "open_product", productId: "router-bundle-pack" },
    isDemo: true,
  },
  {
    id: "offer-money-transfer",
    kind: "money",
    title: "Orange Money transfers",
    description: "Find a nearby point for cash in, cash out and transfers.",
    value: "Cash in / out",
    price: "",
    cta: "Find a point",
    action: { type: "open_map", category: "money" },
    isDemo: true,
  },
  {
    id: "offer-loyalty",
    kind: "loyalty",
    title: "Loyalty rewards",
    description: "A placeholder for a rewards programme, pending a real loyalty API.",
    value: "Rewards",
    price: "",
    cta: "How it works",
    action: { type: "send_prompt", prompt: "Explain the loyalty rewards offer" },
    isDemo: true,
  },
];
