/**
 * DEMO BUNDLES.
 *
 * Placeholder plans used to design the flows. Real tariffs must come from an
 * Orange pricing API before anything here is presented as fact.
 */

export const BUNDLE_TYPES = [
  { id: "all", label: "All" },
  { id: "data", label: "Data" },
  { id: "voice", label: "Voice" },
  { id: "combo", label: "Combo" },
];

export const BUNDLES = [
  {
    id: "data-1gb-daily",
    typeId: "data",
    name: "1 GB",
    validity: "24 hours",
    price: "SLE 15",
    priceValue: 15,
    description: "A light daily bundle for messaging and browsing.",
    perks: ["Valid for 24 hours", "Renews on request"],
    bestFor: "light",
    isDemo: true,
  },
  {
    id: "data-5gb-weekly",
    typeId: "data",
    name: "5 GB",
    validity: "7 days",
    price: "SLE 45",
    priceValue: 45,
    description: "A weekly allowance for social, study and light streaming.",
    perks: ["Valid for 7 days", "Works on any device"],
    bestFor: "medium",
    isDemo: true,
  },
  {
    id: "data-25gb-monthly",
    typeId: "data",
    name: "25 GB",
    validity: "30 days",
    price: "SLE 190",
    priceValue: 190,
    description: "A month of data for a phone or a MiFi device.",
    perks: ["Valid for 30 days", "Works with MiFi and routers"],
    bestFor: "heavy",
    isDemo: true,
  },
  {
    id: "data-50gb-home",
    typeId: "data",
    name: "50 GB Home",
    validity: "30 days",
    price: "SLE 340",
    priceValue: 340,
    description: "Built for a home router shared by the household.",
    perks: ["Valid for 30 days", "Designed for routers"],
    bestFor: "home",
    isDemo: true,
  },
  {
    id: "voice-200-weekly",
    typeId: "voice",
    name: "200 minutes",
    validity: "7 days",
    price: "SLE 55",
    priceValue: 55,
    description: "On-network minutes for a week of calls.",
    perks: ["Valid for 7 days", "On-network calls"],
    bestFor: "voice",
    isDemo: true,
  },
  {
    id: "combo-family",
    typeId: "combo",
    name: "10 GB + 100 min",
    validity: "30 days",
    price: "SLE 210",
    priceValue: 210,
    description: "Data and minutes together in one monthly plan.",
    perks: ["Valid for 30 days", "Data and voice combined"],
    bestFor: "medium",
    isDemo: true,
  },
];
