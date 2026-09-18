/**
 * Explanatory flows for capabilities that need an Orange API not connected yet
 * (airtime top-up, bill payment, roaming...). Services and assistant actions
 * open these with `open_placeholder` instead of dead buttons. The Home and
 * /services entries themselves live in `orangeServices.js`.
 *
 * These sheets are honest about the state of the feature rather than
 * pretending the action succeeded.
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
  "orange-money": {
    title: "Orange Money",
    summary: "Payments and history are not connected yet.",
    body: "Send and Request on the Home balance card run as safe demo flows: nothing is moved or charged. Real transfers, payments, withdrawals and history need the Orange Money API and a verified customer session. An Orange Money point can handle them today.",
    primary: { label: "Find Orange Money", action: { type: "open_map", category: "money" } },
    secondary: { label: "Ask OMASTA AI", action: { type: "send_prompt", prompt: "How do Orange Money transfers work?" } },
  },
  roaming: {
    title: "Roaming",
    summary: "Roaming is not connected yet.",
    body: "Activating roaming and roaming bundles needs the Orange line management API. Until then, an Orange shop or customer care can set it up before you travel.",
    primary: { label: "Find an Orange shop", action: { type: "open_map", category: "shop" } },
    secondary: { label: "Ask OMASTA AI", action: { type: "send_prompt", prompt: "How do I use my line abroad?" } },
  },
  more: {
    title: "More services",
    summary: "What is coming next.",
    body: "Roaming, device instalments, loyalty rewards and self-service account changes all need Orange APIs. The screens are ready to receive them once the integrations exist.",
    primary: { label: "Open support", action: { type: "navigate", target: "/support" } },
    secondary: { label: "Ask OMASTA AI", action: { type: "send_prompt", prompt: "What can OMASTA help me with?" } },
  },
};
