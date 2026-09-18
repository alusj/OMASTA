/**
 * Shared vocabulary for the assistant layer.
 *
 * Providers return replies built from these shapes, the UI renders them, and
 * the dispatcher executes the actions. Keeping the contract here means a real
 * model provider can be swapped in without touching any component.
 */

export const ActionType = {
  NAVIGATE: "navigate",
  OPEN_PRODUCT: "open_product",
  OPEN_BUNDLE: "open_bundle",
  OPEN_SUPPORT: "open_support",
  OPEN_MAP: "open_map",
  OPEN_LOCATION: "open_location",
  OPEN_PLACEHOLDER: "open_placeholder",
  OPEN_SEARCH: "open_search",
  REQUEST_LOCATION: "request_location",
  CHOOSE_LOCATION: "choose_location",
  SET_AREA: "set_area",
  DISMISS_CONFIRMATION: "dismiss_confirmation",
  CALL_SUPPORT: "call_support",
  DIRECTIONS: "directions",
  SEND_PROMPT: "send_prompt",
  DISMISS: "dismiss",
};

/**
 * Structured intents an entry point can attach to a prompt (Home suggestions,
 * "Ask OMASTA about this offer"). The visible prompt text still goes into the
 * conversation; the intent travels in the request context so every provider,
 * local or remote, routes it deterministically instead of re-parsing text.
 */
export const AssistantIntent = {
  BUY_DATA: "BUY_DATA",
  FIND_AGENT: "FIND_AGENT",
  SIM_SUPPORT: "SIM_SUPPORT",
  OFFER_INFO: "OFFER_INFO",
};

export const CardType = {
  PRODUCT: "product",
  BUNDLE: "bundle",
  LOCATION: "location",
  SUPPORT: "support",
  INFO: "info",
};

export const MessageRole = {
  USER: "user",
  ASSISTANT: "assistant",
};

export const MessageStatus = {
  SENT: "sent",
  PENDING: "pending",
  ERROR: "error",
};

/**
 * Actions that change money, activate a paid service or alter an account must
 * never run straight from a tap on an assistant suggestion. The dispatcher
 * refuses them unless `confirmed` is set, and the UI asks first.
 */
export const CONFIRMATION_REQUIRED_ACTIONS = new Set([]);

export function requiresConfirmation(action) {
  return Boolean(action?.requiresConfirmation) || CONFIRMATION_REQUIRED_ACTIONS.has(action?.type);
}

let messageCounter = 0;

function nextId(prefix) {
  messageCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${messageCounter}`;
}

export function createAction(type, payload = {}) {
  return { type, ...payload };
}

export function createActionButton({ label, action, variant = "secondary" }) {
  return { id: nextId("action"), label, action, variant };
}

export function createCard(type, payload) {
  return { id: nextId("card"), type, ...payload };
}

export function createMessage({
  role,
  text = "",
  cards = [],
  actions = [],
  suggestions = [],
  status = MessageStatus.SENT,
  meta = null,
}) {
  return {
    id: nextId("msg"),
    role,
    text,
    cards,
    actions,
    suggestions,
    status,
    meta,
    createdAt: Date.now(),
  };
}

/**
 * The shape every provider must return.
 * `flow` carries short multi-turn state (troubleshooting steps) back to the
 * next call so the provider stays stateless.
 */
export function createReply({ text, cards = [], actions = [], suggestions = [], flow = null, intent = null }) {
  return { text, cards, actions, suggestions, flow, intent };
}
