/**
 * DEMO LOCATIONS.
 *
 * These are sample points placed around the Freetown area for development.
 * They are NOT verified Orange sites: names, addresses, opening hours and
 * phone numbers are invented. Every record carries `isDemo: true` so the UI
 * can label it, and nothing in the app may present these as factual.
 *
 * Replace with a verified Orange location/agent directory feed. Keep the same
 * record shape and the rest of the app continues to work unchanged.
 */

export const LOCATION_CATEGORIES = [
  { id: "all", label: "All", plural: "locations" },
  { id: "agent", label: "Agents", plural: "agents" },
  { id: "shop", label: "Shops", plural: "shops" },
  { id: "support", label: "Offices", plural: "Orange offices" },
  { id: "money", label: "Money", plural: "Orange Money points" },
];

/** Accepts plural/loose category names coming from assistant actions or URLs. */
export const CATEGORY_ALIASES = {
  all: "all",
  agent: "agent",
  agents: "agent",
  shop: "shop",
  shops: "shop",
  store: "shop",
  stores: "shop",
  money: "money",
  "money-point": "money",
  "orange-money": "money",
  "orange money": "money",
  cash: "money",
  "cash-in": "money",
  "cash-out": "money",
  support: "support",
  "service-centre": "support",
  "service-center": "support",
  care: "support",
  office: "support",
  offices: "support",
};

/** Areas offered when a customer declines or cannot share device location. */
export const MANUAL_AREAS = [
  { id: "central", label: "Central Freetown", coordinates: [-13.2317, 8.484] },
  { id: "lumley", label: "Lumley", coordinates: [-13.2761, 8.4402] },
  { id: "wilkinson", label: "Wilkinson Road", coordinates: [-13.2585, 8.4762] },
  { id: "kissy", label: "Kissy", coordinates: [-13.1861, 8.4761] },
  { id: "waterloo", label: "Waterloo", coordinates: [-13.0722, 8.3386] },
];

export const LOCATIONS = [
  {
    id: "demo-shop-central",
    name: "Sample Orange Shop, Central",
    type: "Orange shop",
    category: "shop",
    address: "Central business district, Freetown",
    coordinates: [-13.2316, 8.4863],
    phone: "",
    openingHours: { days: "Mon to Sat", opensAt: "08:30", closesAt: "18:00" },
    services: ["SIM registration", "Device sales", "Bill payment", "Account support"],
    mapPosition: { x: 34, y: 42 },
    isDemo: true,
  },
  {
    id: "demo-money-wilkinson",
    name: "Sample Orange Money Point, Wilkinson",
    type: "Orange Money point",
    category: "money",
    address: "Wilkinson Road area, Freetown",
    coordinates: [-13.2585, 8.4762],
    phone: "",
    openingHours: { days: "Mon to Sun", opensAt: "08:00", closesAt: "20:00" },
    services: ["Cash in", "Cash out", "Transfers", "Bill payment"],
    mapPosition: { x: 63, y: 33 },
    isDemo: true,
  },
  {
    id: "demo-agent-kissy",
    name: "Sample Orange Agent, Kissy",
    type: "Authorised agent",
    category: "agent",
    address: "Kissy Road area, Freetown",
    coordinates: [-13.1861, 8.4761],
    phone: "",
    openingHours: { days: "Mon to Sat", opensAt: "09:00", closesAt: "18:00" },
    services: ["Airtime", "Data bundles", "Cash in", "Cash out"],
    mapPosition: { x: 71, y: 68 },
    isDemo: true,
  },
  {
    id: "demo-agent-lumley",
    name: "Sample Orange Agent, Lumley",
    type: "Authorised agent",
    category: "agent",
    address: "Lumley area, Freetown",
    coordinates: [-13.2761, 8.4402],
    phone: "",
    openingHours: { days: "Mon to Sun", opensAt: "08:00", closesAt: "21:00" },
    services: ["Airtime", "Data bundles", "SIM replacement"],
    mapPosition: { x: 22, y: 74 },
    isDemo: true,
  },
  {
    id: "demo-shop-aberdeen",
    name: "Sample Orange Shop, Aberdeen",
    type: "Orange shop",
    category: "shop",
    address: "Aberdeen area, Freetown",
    coordinates: [-13.2846, 8.4855],
    phone: "",
    openingHours: { days: "Mon to Sat", opensAt: "09:00", closesAt: "19:00" },
    services: ["Device sales", "eSIM activation", "Account support"],
    mapPosition: { x: 14, y: 36 },
    isDemo: true,
  },
  {
    id: "demo-support-congo-cross",
    name: "Sample Orange Office, Congo Cross",
    type: "Orange office",
    category: "support",
    address: "Congo Cross area, Freetown",
    coordinates: [-13.2662, 8.4724],
    phone: "",
    openingHours: { days: "Mon to Fri", opensAt: "08:30", closesAt: "17:00" },
    services: ["Device repair", "SIM support", "Billing queries", "Complaints"],
    mapPosition: { x: 46, y: 24 },
    isDemo: true,
  },
  {
    id: "demo-money-ferry",
    name: "Sample Orange Money Point, Ferry Junction",
    type: "Orange Money point",
    category: "money",
    address: "Ferry junction area, Freetown",
    coordinates: [-13.2203, 8.4941],
    phone: "",
    openingHours: { days: "Mon to Sun", opensAt: "07:30", closesAt: "20:30" },
    services: ["Cash in", "Cash out", "Merchant payment"],
    mapPosition: { x: 55, y: 57 },
    isDemo: true,
  },
  {
    id: "demo-agent-hill-station",
    name: "Sample Orange Agent, Hill Station",
    type: "Authorised agent",
    category: "agent",
    address: "Hill Station area, Freetown",
    coordinates: [-13.2469, 8.4553],
    phone: "",
    openingHours: { days: "Mon to Sat", opensAt: "09:00", closesAt: "17:30" },
    services: ["Airtime", "Data bundles", "Cash in"],
    mapPosition: { x: 40, y: 66 },
    isDemo: true,
  },
  {
    id: "demo-support-waterloo",
    name: "Sample Orange Office, Waterloo",
    type: "Orange office",
    category: "support",
    address: "Waterloo, Western Area Rural",
    coordinates: [-13.0722, 8.3386],
    phone: "",
    openingHours: { days: "Mon to Sat", opensAt: "09:00", closesAt: "17:00" },
    services: ["SIM support", "Account support", "Complaints"],
    mapPosition: { x: 86, y: 88 },
    isDemo: true,
  },
];
