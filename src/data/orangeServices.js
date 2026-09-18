/**
 * The Orange services directory.
 *
 * Home shows only `HOME_SERVICE_IDS`; the full list lives on /services. Every
 * entry resolves through the shared action dispatcher, so a service that needs
 * an Orange API that is not connected yet opens an explanatory sheet (see
 * PLACEHOLDER_FLOWS) rather than pretending to work.
 */

export const SERVICE_GROUPS = [
  { id: "everyday", label: "Data and airtime" },
  { id: "money", label: "Orange Money" },
  { id: "line", label: "Your line" },
  { id: "help", label: "Help" },
];

export const ORANGE_SERVICES = [
  {
    id: "data",
    label: "Data",
    title: "Buy data",
    detail: "Data bundles for your phone",
    icon: "wifi",
    group: "everyday",
    action: { type: "navigate", target: "/shop", params: { tab: "bundles", type: "data" } },
  },
  {
    id: "airtime",
    label: "Airtime",
    title: "Buy airtime",
    detail: "Top up any Orange number",
    icon: "smartphone",
    group: "everyday",
    action: { type: "open_placeholder", placeholderId: "airtime" },
  },
  {
    id: "money",
    label: "Money",
    title: "Orange Money",
    detail: "Send, request and pay",
    icon: "wallet",
    group: "money",
    action: { type: "open_placeholder", placeholderId: "orange-money" },
  },
  {
    id: "support",
    label: "Support",
    title: "Support",
    detail: "Help with your line or device",
    icon: "headphones",
    group: "help",
    action: { type: "navigate", target: "/support" },
  },
  {
    id: "bundles",
    label: "Bundles",
    title: "Bundles",
    detail: "Compare data, voice and combo plans",
    icon: "layers",
    group: "everyday",
    action: { type: "navigate", target: "/shop", params: { tab: "bundles" } },
  },
  {
    id: "promotions",
    label: "Promotions",
    title: "Promotions",
    detail: "Current bundle offers",
    icon: "tag",
    group: "everyday",
    action: { type: "navigate", target: "/shop", params: { tab: "bundles" } },
  },
  {
    id: "internet",
    label: "Internet",
    title: "Home internet",
    detail: "Routers and pocket MiFi",
    icon: "router",
    group: "everyday",
    action: { type: "navigate", target: "/shop", params: { category: "internet" } },
  },
  {
    id: "pay-bills",
    label: "Pay bills",
    title: "Pay bills",
    detail: "Utilities and more",
    icon: "receipt",
    group: "money",
    action: { type: "open_placeholder", placeholderId: "pay-bills" },
  },
  {
    id: "money-points",
    label: "Money points",
    title: "Orange Money points",
    detail: "Cash in and cash out nearby",
    icon: "map-pin",
    group: "money",
    action: { type: "open_map", category: "money" },
  },
  {
    id: "my-number",
    label: "My number",
    title: "My number",
    detail: "Line details",
    icon: "hash",
    group: "line",
    action: { type: "navigate", target: "/account" },
  },
  {
    id: "sim-services",
    label: "SIM services",
    title: "SIM services",
    detail: "Replacement, PUK and registration",
    icon: "card",
    group: "line",
    action: { type: "navigate", target: "/support", params: { topic: "sim" } },
  },
  {
    id: "esim",
    label: "eSIM",
    title: "eSIM",
    detail: "A digital SIM for compatible devices",
    icon: "qr",
    group: "line",
    action: { type: "open_product", productId: "esim-profile" },
  },
  {
    id: "roaming",
    label: "Roaming",
    title: "Roaming",
    detail: "Use your line abroad",
    icon: "globe",
    group: "line",
    action: { type: "open_placeholder", placeholderId: "roaming" },
  },
  {
    id: "customer-care",
    label: "Customer care",
    title: "Customer care",
    detail: "Call or visit Orange",
    icon: "phone",
    group: "help",
    action: { type: "call_support" },
  },
  {
    id: "find",
    label: "Find Orange",
    title: "Find Orange",
    detail: "Agents, shops and support centres",
    icon: "map-pin",
    group: "help",
    action: { type: "open_map", category: "all" },
  },
];

/** The four services Home shows, in order. */
export const HOME_SERVICE_IDS = ["data", "airtime", "money", "support"];

export function getHomeServices() {
  return HOME_SERVICE_IDS.map((id) => ORANGE_SERVICES.find((service) => service.id === id)).filter(Boolean);
}

export function getServicesByGroup() {
  return SERVICE_GROUPS.map((group) => ({
    ...group,
    services: ORANGE_SERVICES.filter((service) => service.group === group.id),
  })).filter((group) => group.services.length);
}
