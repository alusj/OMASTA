/**
 * Local intent router.
 *
 * A small, dependency-free understanding layer so the obvious requests work
 * with no model call, no network and no cost. It scores keyword patterns,
 * picks the best intent and builds a structured reply (text + cards + actions).
 *
 * A real model provider can replace or sit in front of this: it only has to
 * return the same `createReply` shape. Nothing in the UI depends on this file.
 */

import {
  findBundleSync,
  findProductSync,
  listProductsSync,
  recommendBundles,
  listBundlesSync,
} from "../catalog/catalogService.js";
import { findOfferSync } from "../offers/offerService.js";
import { getCategoryLabel, listLocations } from "../locations/locationService.js";
import { findSupportTopic, getFlow, getFlowStep, listSupportTopics } from "../support/supportService.js";
import {
  ActionType,
  AssistantIntent,
  createAction,
  createActionButton,
  createReply,
} from "./assistantTypes.js";
import {
  bundleCard,
  infoCard,
  locationCard,
  locationPermissionActions,
  mapActions,
  productCard,
  supportCard,
} from "./replyBuilders.js";

const DEMO_NOTE = "These are sample records for development, not live Orange data.";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function has(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

const TROUBLE_WORDS = [
  /\bnot working\b/,
  /\bnot work\b/,
  /\bproblem\b/,
  /\bissue\b/,
  /\bbroken\b/,
  /\bdamaged\b/,
  /\bblocked\b/,
  /\bfail/,
  /\bcan t\b/,
  /\bcannot\b/,
  /\bno service\b/,
  /\bnot detected\b/,
  /\blost\b/,
  /\bstolen\b/,
  /\bhelp\b/,
  /\bfix\b/,
];

const NEARBY_PATTERNS = [/\bnear\b/, /\bnearby\b/, /\bnearest\b/, /\bclosest\b/, /\baround me\b/, /\bclose to me\b/];

/**
 * Intent definitions. `weight` lets a specific phrase outrank a generic word,
 * so "orange money agent" resolves to the money intent rather than agents.
 */
const INTENTS = [
  {
    id: "greeting",
    patterns: [
      { re: /^(hi|hello|hey|yo)\b/, weight: 3 },
      { re: /^good (morning|afternoon|evening)\b/, weight: 3 },
      { re: /^(thanks|thank you)\b/, weight: 3 },
    ],
  },
  {
    id: "capabilities",
    patterns: [
      { re: /what can you do/, weight: 4 },
      { re: /how (can|do) you help/, weight: 4 },
      { re: /who are you/, weight: 4 },
    ],
  },
  {
    id: "find_money",
    patterns: [
      { re: /orange money/, weight: 4 },
      { re: /\bmomo\b/, weight: 3 },
      { re: /cash ?in/, weight: 3 },
      { re: /cash ?out/, weight: 3 },
      { re: /\bwithdraw/, weight: 3 },
      { re: /\bdeposit/, weight: 2 },
      { re: /send money/, weight: 3 },
      { re: /\btransfer/, weight: 2 },
    ],
  },
  {
    id: "find_agent",
    patterns: [
      { re: /\bagents?\b/, weight: 3 },
      { re: /\bdealer/, weight: 2 },
      { re: /\breseller/, weight: 2 },
      { re: /\bvendor/, weight: 2 },
    ],
  },
  {
    id: "find_shop",
    patterns: [
      { re: /\bshops?\b/, weight: 3 },
      { re: /\bstores?\b/, weight: 3 },
      { re: /\boutlet/, weight: 2 },
      { re: /\bbranch/, weight: 2 },
    ],
  },
  {
    id: "find_support_centre",
    patterns: [
      { re: /service (centre|center)/, weight: 4 },
      { re: /support (centre|center)/, weight: 4 },
      { re: /\brepair/, weight: 2 },
    ],
  },
  {
    id: "directions",
    patterns: [
      { re: /\bdirections?\b/, weight: 3 },
      { re: /how (do|can) i get to/, weight: 3 },
      { re: /take me to/, weight: 3 },
    ],
  },
  {
    id: "sim",
    patterns: [
      { re: /\bsims?\b/, weight: 3 },
      { re: /\besim\b/, weight: 3 },
      { re: /\bpuk\b/, weight: 3 },
      { re: /sim card/, weight: 4 },
      { re: /\bregistration\b/, weight: 2 },
    ],
  },
  {
    id: "network",
    patterns: [
      { re: /\bnetwork\b/, weight: 3 },
      { re: /\bsignal\b/, weight: 3 },
      { re: /no service/, weight: 3 },
      { re: /\bouta?ge\b/, weight: 3 },
      { re: /\bslow\b/, weight: 2 },
      { re: /not connecting/, weight: 3 },
      { re: /keeps dropping/, weight: 3 },
    ],
  },
  {
    id: "router",
    patterns: [
      { re: /\brouters?\b/, weight: 4 },
      { re: /\bmifi\b/, weight: 4 },
      { re: /\bwi ?fi\b/, weight: 2 },
      { re: /\bhotspot\b/, weight: 3 },
      { re: /home internet/, weight: 4 },
      { re: /\bbroadband\b/, weight: 3 },
      { re: /\b4g\b/, weight: 1 },
      { re: /\b5g\b/, weight: 1 },
    ],
  },
  {
    id: "phones",
    patterns: [
      { re: /\bphones?\b/, weight: 3 },
      { re: /\bsmartphone/, weight: 4 },
      { re: /\bhandset/, weight: 3 },
      { re: /\bdevices?\b/, weight: 2 },
    ],
  },
  {
    id: "bundles",
    patterns: [
      { re: /\bbundles?\b/, weight: 4 },
      { re: /\bplans?\b/, weight: 3 },
      { re: /\bpackages?\b/, weight: 2 },
      { re: /\btariff/, weight: 3 },
      { re: /\bcompare\b/, weight: 2 },
    ],
  },
  {
    id: "data",
    patterns: [
      { re: /\bdata\b/, weight: 3 },
      { re: /\binternet\b/, weight: 3 },
      { re: /\bbrowsing\b/, weight: 2 },
      { re: /\bmb\b/, weight: 2 },
      { re: /\bgb\b/, weight: 2 },
      { re: /\bonline\b/, weight: 1 },
    ],
  },
  {
    id: "airtime",
    patterns: [
      { re: /\bairtime\b/, weight: 4 },
      { re: /top ?up/, weight: 4 },
      { re: /\brecharge\b/, weight: 3 },
      { re: /\bcredit\b/, weight: 2 },
    ],
  },
  {
    id: "account",
    patterns: [
      { re: /\baccounts?\b/, weight: 3 },
      { re: /\bbalance\b/, weight: 4 },
      { re: /my number/, weight: 4 },
      { re: /\bprofile\b/, weight: 2 },
      { re: /\bbill(ing)?\b/, weight: 3 },
      { re: /\bsubscription\b/, weight: 2 },
    ],
  },
  {
    id: "offers",
    patterns: [
      { re: /\boffers?\b/, weight: 3 },
      { re: /\bpromo/, weight: 3 },
      { re: /\bdeals?\b/, weight: 3 },
      { re: /\bdiscount/, weight: 3 },
      { re: /\breward/, weight: 3 },
      { re: /\bloyalty\b/, weight: 3 },
    ],
  },
  {
    id: "support",
    patterns: [
      { re: /\bsupport\b/, weight: 2 },
      { re: /\bhelp\b/, weight: 1 },
      { re: /customer (care|service)/, weight: 4 },
      { re: /\bcomplain/, weight: 3 },
      { re: /report a problem/, weight: 4 },
      { re: /\bcall\b/, weight: 2 },
    ],
  },
];

export function scoreIntents(text) {
  const normalized = normalize(text);

  return INTENTS.map((intent) => ({
    id: intent.id,
    score: intent.patterns.reduce((total, { re, weight }) => (re.test(normalized) ? total + weight : total), 0),
  }))
    .filter((intent) => intent.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function matchIntent(text) {
  const [best] = scoreIntents(text);
  return best || { id: "fallback", score: 0 };
}

/* ------------------------------------------------------------------ */
/* Reply handlers                                                      */
/* ------------------------------------------------------------------ */

const DEFAULT_SUGGESTIONS = [
  "Find an Orange agent near me",
  "Show me internet bundles",
  "I have a SIM problem",
  "Find an Orange shop",
];

function findPlacesReply(categoryId, context, { headline } = {}) {
  const label = getCategoryLabel(categoryId);
  const origin = context.coordinates;

  if (!origin) {
    return createReply({
      intent: `find_${categoryId}`,
      text:
        headline ||
        `I can help you find ${label}. To show the closest ones I need a location, or you can pick an area yourself.`,
      actions: locationPermissionActions(categoryId),
      suggestions: ["Show all locations", "Find an Orange shop"],
    });
  }

  const nearest = listLocations({ category: categoryId, origin, limit: 3 });

  if (!nearest.length) {
    return createReply({
      intent: `find_${categoryId}`,
      text: `I could not find any ${label} in the sample directory. The full Orange directory is not connected yet.`,
      actions: mapActions("all"),
    });
  }

  return createReply({
    intent: `find_${categoryId}`,
    text: `Here are the nearest ${label} I have. ${DEMO_NOTE}`,
    cards: nearest.map(locationCard),
    actions: mapActions(categoryId),
    suggestions: ["Show Orange Money points", "Find a support centre"],
  });
}

function productsReply({ categoryId, intentId, text }) {
  const products = listProductsSync({ categoryId }).slice(0, 3);

  return createReply({
    intent: intentId,
    text,
    cards: products.map(productCard),
    actions: [
      createActionButton({
        label: "Browse the shop",
        variant: "primary",
        action: createAction(ActionType.NAVIGATE, { target: "/shop", params: { category: categoryId } }),
      }),
    ],
    suggestions: ["Help me choose a data plan", "Show me 4G routers"],
  });
}

function bundlesReply({ need = "medium", intentId = "bundles", text }) {
  const bundles = recommendBundles(need, 3);

  return createReply({
    intent: intentId,
    text,
    cards: bundles.map(bundleCard),
    actions: [
      createActionButton({
        label: "Compare all bundles",
        variant: "primary",
        action: createAction(ActionType.NAVIGATE, { target: "/shop", params: { tab: "bundles" } }),
      }),
    ],
    suggestions: ["Show me 4G routers", "Find an Orange agent near me"],
  });
}

function troubleshootingReply(topicId) {
  const topic = findSupportTopic(topicId);
  const flow = getFlow(topicId);

  if (!topic) {
    return supportMenuReply();
  }

  if (!flow) {
    return createReply({
      intent: `support_${topicId}`,
      text: `Here is what usually helps with ${topic.title.toLowerCase()}.`,
      cards: [supportCard(topic)],
    });
  }

  const step = flow.steps[0];

  return createReply({
    intent: `support_${topicId}`,
    text: `Let me help with that. ${step.question}`,
    actions: step.replies.map((reply) =>
      createActionButton({
        label: reply.label,
        action: createAction(ActionType.SEND_PROMPT, { prompt: reply.value }),
      })
    ),
    flow: { id: flow.id, step: 0 },
  });
}

function continueFlowReply(flowState, text) {
  const flow = getFlow(flowState.id);

  if (!flow) {
    return null;
  }

  const nextIndex = flowState.step + 1;
  const step = getFlowStep(flow.id, nextIndex);
  const resolved = /\b(works now|working now|better now|it works|fixed|resolved)\b/.test(normalize(text));

  if (resolved) {
    return createReply({
      intent: `support_${flow.id}_resolved`,
      text: "Good, that sounds sorted. If it comes back, I can pick this up again or pass you to Orange support.",
      suggestions: DEFAULT_SUGGESTIONS,
    });
  }

  if (step) {
    return createReply({
      intent: `support_${flow.id}`,
      text: step.question,
      actions: step.replies.map((reply) =>
        createActionButton({
          label: reply.label,
          action: createAction(ActionType.SEND_PROMPT, { prompt: reply.value }),
        })
      ),
      flow: { id: flow.id, step: nextIndex },
    });
  }

  const topic = findSupportTopic(flow.id);

  return createReply({
    intent: `support_${flow.id}_escalate`,
    text:
      topic?.escalation ||
      "That is as far as I can take it from here. Orange support can check the line itself.",
    cards: topic ? [supportCard(topic)] : [],
    actions: [
      createActionButton({
        label: "Call customer care",
        variant: "primary",
        action: createAction(ActionType.CALL_SUPPORT, { topic: flow.id }),
      }),
      createActionButton({
        label: "Find a support centre",
        action: createAction(ActionType.OPEN_MAP, { category: "support" }),
      }),
    ],
  });
}

function supportMenuReply() {
  const topics = listSupportTopics().slice(0, 3);

  return createReply({
    intent: "support",
    text: "I can help with a few things directly, or put you through to Orange support. What is it about?",
    cards: topics.map((topic) => supportCard(topic, { includeCall: false })),
    actions: [
      createActionButton({
        label: "Call customer care",
        variant: "primary",
        action: createAction(ActionType.CALL_SUPPORT, {}),
      }),
      createActionButton({
        label: "Open support",
        action: createAction(ActionType.NAVIGATE, { target: "/support" }),
      }),
    ],
    suggestions: ["I have a SIM problem", "My network is slow"],
  });
}

function fallbackReply(context) {
  return createReply({
    intent: "fallback",
    text:
      "I did not quite catch that. I can find Orange locations, walk you through bundles and devices, or help with a SIM or network problem.",
    suggestions: context.screen === "find" ? ["Find an Orange shop", "Show Orange Money points"] : DEFAULT_SUGGESTIONS,
  });
}

function simHelpReply() {
  return createReply({
    intent: "sim_support",
    text: "What do you need help with on your SIM?",
    actions: [
      createActionButton({
        label: "My SIM is not working",
        variant: "primary",
        action: createAction(ActionType.SEND_PROMPT, { prompt: "My SIM is not working" }),
      }),
      createActionButton({
        label: "Replace or register a SIM",
        action: createAction(ActionType.OPEN_MAP, { category: "shop" }),
      }),
      createActionButton({
        label: "Get an eSIM",
        action: createAction(ActionType.OPEN_PRODUCT, { productId: "esim-profile" }),
      }),
      createActionButton({
        label: "Call customer care",
        action: createAction(ActionType.CALL_SUPPORT, { topic: "sim" }),
      }),
    ],
    suggestions: ["I forgot my PUK code", "Find an Orange shop"],
  });
}

function offerReply(offerId) {
  const offer = findOfferSync(offerId);

  if (!offer) {
    return null;
  }

  const bundle = offer.bundleId ? findBundleSync(offer.bundleId) : null;
  const facts = [offer.value, offer.validity, offer.price].filter(Boolean).join(" · ");

  return createReply({
    intent: "offer_info",
    text: `${offer.title}: ${facts}. ${offer.description} This is a sample offer for design review, not a live Orange promotion, and nothing is bought until you confirm on the bundle itself.`,
    cards: bundle ? [bundleCard(bundle)] : [],
    actions: [
      createActionButton({
        label: offer.cta || "See details",
        variant: "primary",
        action: offer.action,
      }),
      createActionButton({
        label: "Compare all bundles",
        action: createAction(ActionType.NAVIGATE, { target: "/shop", params: { tab: "bundles" } }),
      }),
    ],
    suggestions: ["Help me choose a data plan", "Show me internet bundles"],
  });
}

/**
 * Structured intents from app entry points skip keyword matching entirely,
 * so a tap on "Buy data" always lands on bundles whatever the label says.
 */
function routeByIntent(context) {
  switch (context.intent) {
    case AssistantIntent.BUY_DATA:
      return bundlesReply({
        need: "medium",
        intentId: "buy_data",
        text: "Here are data bundles from the sample catalogue. Open one to see the details; nothing is bought until you confirm.",
      });

    case AssistantIntent.FIND_AGENT:
      return findPlacesReply("agent", context);

    case AssistantIntent.SIM_SUPPORT:
      return simHelpReply();

    case AssistantIntent.OFFER_INFO:
      return offerReply(context.focus?.offerId);

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * Turns a customer message plus app context into a structured reply.
 *
 * @param {string} text        raw customer message
 * @param {object} context     { screen, coordinates, flow, focus }
 */
export function routeMessage(text, context = {}) {
  const normalized = normalize(text);
  const best = matchIntent(text);
  const nearby = has(normalized, NEARBY_PATTERNS);
  const trouble = has(normalized, TROUBLE_WORDS);

  const structured = context.intent ? routeByIntent(context) : null;
  if (structured) {
    return structured;
  }

  // A live troubleshooting flow continues unless the customer clearly changed subject.
  if (context.flow && best.score < 4) {
    const continued = continueFlowReply(context.flow, text);
    if (continued) {
      return continued;
    }
  }

  switch (best.id) {
    case "greeting":
      return createReply({
        intent: "greeting",
        text: "Hello. I can help you find Orange locations, choose a bundle or device, or sort out a SIM or network problem.",
        suggestions: DEFAULT_SUGGESTIONS,
      });

    case "capabilities":
      return createReply({
        intent: "capabilities",
        text:
          "I am OMASTA AI, the assistant inside this app. I can point you to Orange agents, shops, Orange Money points and support centres, explain the bundles and devices in the catalogue, and run through basic SIM or network troubleshooting. I cannot see your account, balance or live network status in this build.",
        actions: [
          createActionButton({
            label: "Find Orange near me",
            variant: "primary",
            action: createAction(ActionType.REQUEST_LOCATION, { category: "all" }),
          }),
        ],
        suggestions: DEFAULT_SUGGESTIONS,
      });

    case "find_money":
      if (/send money|transfer/.test(normalized) && !nearby) {
        return createReply({
          intent: "send_money",
          text:
            "Transfers are not wired up in this build, so I cannot move money. An Orange Money point can do it today, and I can show you the nearest ones.",
          actions: locationPermissionActions("money"),
        });
      }
      return findPlacesReply("money", context);

    case "find_agent":
      return findPlacesReply("agent", context);

    case "find_shop":
      return findPlacesReply("shop", context);

    case "find_support_centre":
      return findPlacesReply("support", context);

    case "directions":
      return findPlacesReply("all", context, {
        headline: "I can give you directions to any Orange location. Which area should I search from?",
      });

    case "sim": {
      if (trouble || /\bpuk\b|no service|not detected/.test(normalized)) {
        return troubleshootingReply("sim");
      }

      const simProducts = listProductsSync({ categoryId: "sim" });

      return createReply({
        intent: "sim_products",
        text: "Here is what the catalogue has for SIM and eSIM. Registration is done at a shop or agent with a valid ID.",
        cards: simProducts.map(productCard),
        actions: [
          createActionButton({
            label: "Find a shop to register",
            variant: "primary",
            action: createAction(ActionType.OPEN_MAP, { category: "shop" }),
          }),
        ],
        suggestions: ["I have a SIM problem", "Find an Orange shop"],
      });
    }

    case "network":
      if (trouble || /\bslow\b|no service|outa?ge|dropping/.test(normalized)) {
        return troubleshootingReply("network");
      }
      return createReply({
        intent: "network_info",
        text:
          "I cannot read live network status in this build, that needs an Orange status feed. If something is wrong on your line, I can run through the usual checks.",
        actions: [
          createActionButton({
            label: "Start troubleshooting",
            variant: "primary",
            action: createAction(ActionType.SEND_PROMPT, { prompt: "My network is not working" }),
          }),
          createActionButton({
            label: "Report a problem",
            action: createAction(ActionType.OPEN_SUPPORT, { topic: "network" }),
          }),
        ],
      });

    case "router":
      return productsReply({
        categoryId: "internet",
        intentId: "router",
        text: "These are the routers and MiFi devices in the catalogue.",
      });

    case "phones":
      return productsReply({
        categoryId: "phones",
        intentId: "phones",
        text: "Here are the phones in the catalogue.",
      });

    case "bundles":
      return bundlesReply({
        intentId: "bundles",
        text: "Here are bundles from the sample catalogue. Tell me roughly how much you use and I can narrow it down.",
      });

    case "data": {
      // "I need internet" is ambiguous: ask the useful question first.
      const forHome = /\bhome\b|\bhouse\b|\boffice\b|\bfamily\b/.test(normalized);
      const forPhone = /\bphone\b|\bmobile\b/.test(normalized);

      if (forHome) {
        return productsReply({
          categoryId: "internet",
          intentId: "data_home",
          text: "For a home or office, a router shared over Wi-Fi is usually the better fit.",
        });
      }

      if (forPhone || /\bbuy\b/.test(normalized)) {
        return bundlesReply({
          intentId: "data_phone",
          text: "Here are data bundles from the sample catalogue.",
        });
      }

      return createReply({
        intent: "data_clarify",
        text: "Happy to help you get online. Is it for a phone, or for a home or office?",
        actions: [
          createActionButton({
            label: "For my phone",
            variant: "primary",
            action: createAction(ActionType.SEND_PROMPT, { prompt: "data bundles for my phone" }),
          }),
          createActionButton({
            label: "For home or office",
            action: createAction(ActionType.SEND_PROMPT, { prompt: "home internet router" }),
          }),
        ],
        suggestions: ["Show me internet bundles", "Show me 4G routers"],
      });
    }

    case "airtime":
      return createReply({
        intent: "airtime",
        text:
          "Airtime top-up is not connected in this build, so I cannot buy credit for you. An agent or an Orange Money point can top up a number today.",
        actions: [
          createActionButton({
            label: "Find a top-up point",
            variant: "primary",
            action: createAction(ActionType.OPEN_MAP, { category: "agent" }),
          }),
          createActionButton({
            label: "Open support",
            action: createAction(ActionType.NAVIGATE, { target: "/support" }),
          }),
        ],
      });

    case "account":
      return createReply({
        intent: "account",
        text:
          "I cannot see your balance, usage or account details here. Those need a signed-in Orange account API, which is not connected yet. Orange support or a shop can confirm anything on your line.",
        cards: [
          infoCard({
            title: "What I can do instead",
            description:
              "Open your account screen, point you to a shop for line changes, or connect you to customer care.",
            actions: [
              createActionButton({
                label: "Open account",
                variant: "primary",
                action: createAction(ActionType.NAVIGATE, { target: "/account" }),
              }),
              createActionButton({
                label: "Call customer care",
                action: createAction(ActionType.CALL_SUPPORT, {}),
              }),
            ],
          }),
        ],
      });

    case "offers":
      return createReply({
        intent: "offers",
        text:
          "The offers in this build are samples used for design, not live Orange promotions. Here is what a personalised offer would look like.",
        cards: listBundlesSync({ typeId: "data" }).slice(0, 2).map(bundleCard),
        actions: [
          createActionButton({
            label: "See offers",
            variant: "primary",
            action: createAction(ActionType.NAVIGATE, { target: "/orange", params: { section: "offers" } }),
          }),
        ],
      });

    case "support":
      if (/\bcall\b/.test(normalized)) {
        return createReply({
          intent: "call_support",
          text: "I can connect you to Orange customer care.",
          actions: [
            createActionButton({
              label: "Call customer care",
              variant: "primary",
              action: createAction(ActionType.CALL_SUPPORT, {}),
            }),
            createActionButton({
              label: "Find a support centre",
              action: createAction(ActionType.OPEN_MAP, { category: "support" }),
            }),
          ],
        });
      }
      return supportMenuReply();

    default:
      break;
  }

  if (nearby) {
    return findPlacesReply("all", context);
  }

  if (context.focus?.productId) {
    const product = findProductSync(context.focus.productId);

    if (product) {
      return createReply({
        intent: "product_context",
        text: `I can tell you more about the ${product.name}. ${product.description}`,
        cards: [productCard(product)],
        suggestions: ["Show me internet bundles", "Find an Orange shop"],
      });
    }
  }

  return fallbackReply(context);
}
