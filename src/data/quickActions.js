/**
 * Quick actions shown on Home.
 *
 * Every entry resolves to a real destination inside the app. Where a capability
 * needs an Orange API that does not exist yet (airtime top-up, money transfer,
 * bill payment), the action opens an explanatory sheet describing what the flow
 * will do and offers the assistant instead. No dead buttons.
 */

export const QUICK_ACTIONS = [
  {
    id: "buy-data",
    label: "Buy data",
    detail: "Browse bundles",
    icon: "wifi",
    action: { type: "navigate", target: "/shop", params: { tab: "bundles" } },
  },
  {
    id: "buy-airtime",
    label: "Buy airtime",
    detail: "Top up a number",
    icon: "smartphone",
    action: {
      type: "open_placeholder",
      placeholderId: "airtime",
    },
  },
  {
    id: "send-money",
    label: "Send money",
    detail: "Orange Money",
    icon: "send",
    action: { type: "open_placeholder", placeholderId: "send-money" },
  },
  {
    id: "pay-bills",
    label: "Pay bills",
    detail: "Utilities and more",
    icon: "receipt",
    action: { type: "open_placeholder", placeholderId: "pay-bills" },
  },
  {
    id: "bundles",
    label: "Bundles",
    detail: "Compare plans",
    icon: "layers",
    action: { type: "navigate", target: "/shop", params: { tab: "bundles" } },
  },
  {
    id: "my-number",
    label: "My number",
    detail: "Line details",
    icon: "hash",
    action: { type: "navigate", target: "/account" },
  },
  {
    id: "support",
    label: "Support",
    detail: "Get help",
    icon: "headphones",
    action: { type: "navigate", target: "/support" },
  },
  {
    id: "more",
    label: "More",
    detail: "Everything else",
    icon: "grid",
    action: { type: "open_placeholder", placeholderId: "more" },
  },
];

/**
 * Copy for capabilities that are not built yet. These sheets are honest about
 * the state of the feature rather than pretending the action succeeded.
 */
export const PLACEHOLDER_FLOWS = {
  airtime: {
    title: "Airtime top-up",
    summary: "Top-up is not connected yet.",
    body: "Buying airtime needs the Orange top-up and payment APIs. Until those are connected, an Orange shop, an authorised agent or an Orange Money point can top up a number.",
    primary: { label: "Find a top-up point", action: { type: "open_map", category: "agent" } },
    secondary: { label: "Ask OMASTA AI", action: { type: "send_prompt", prompt: "Where can I buy airtime?" } },
  },
  "send-money": {
    title: "Send money",
    summary: "Transfers are not connected yet.",
    body: "Money transfers require the Orange Money API and a verified customer session. Nothing in this build can move funds. An Orange Money point can handle transfers today.",
    primary: { label: "Find Orange Money", action: { type: "open_map", category: "money" } },
    secondary: { label: "Ask OMASTA AI", action: { type: "send_prompt", prompt: "How do Orange Money transfers work?" } },
  },
  "pay-bills": {
    title: "Pay bills",
    summary: "Bill payment is not connected yet.",
    body: "Bill payment needs the Orange Money payments API plus each biller integration. Until then, payments can be made at an Orange Money point or an authorised agent.",
    primary: { label: "Find a payment point", action: { type: "open_map", category: "money" } },
    secondary: { label: "Ask OMASTA AI", action: { type: "send_prompt", prompt: "Where can I pay a bill?" } },
  },
  more: {
    title: "More services",
    summary: "What is coming next.",
    body: "Roaming, device instalments, loyalty rewards and self-service account changes all need Orange APIs. The screens are ready to receive them once the integrations exist.",
    primary: { label: "Open support", action: { type: "navigate", target: "/support" } },
    secondary: { label: "Ask OMASTA AI", action: { type: "send_prompt", prompt: "What can OMASTA help me with?" } },
  },
};
