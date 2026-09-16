/* eslint-disable react-refresh/only-export-components -- the provider and its hook are one API; splitting them would fragment the context. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { assistantService } from "../services/assistant/assistantService.js";
import {
  ActionType,
  MessageRole,
  MessageStatus,
  createAction,
  createActionButton,
  createMessage,
} from "../services/assistant/assistantTypes.js";
import { createActionDispatcher, DispatchStatus } from "../services/assistant/actionDispatcher.js";
import { getCategoryLabel, listLocations } from "../services/locations/locationService.js";
import { locationCard, mapActions } from "../services/assistant/replyBuilders.js";
import { buildCallHref, getSupportPhone } from "../services/support/supportService.js";
import { useAppUi } from "./AppUiProvider.jsx";
import { useLocationContext } from "./LocationProvider.jsx";

/**
 * OMASTA AI conversation state plus the wiring that lets it drive the app.
 *
 * Screens register a context object (see `useAssistantScreenContext`) so the
 * assistant knows what the customer is looking at without any screen importing
 * assistant internals.
 */

const AssistantContext = createContext(null);

export const DEFAULT_SUGGESTIONS = [
  "Find an Orange agent near me",
  "Show me internet bundles",
  "I have a SIM problem",
  "Find an Orange shop",
  "Show me 4G routers",
  "Help me choose a data plan",
];

const GREETINGS = {
  default: {
    text: "Hi! I'm OMASTA AI. How can I help you today?",
    suggestions: DEFAULT_SUGGESTIONS.slice(0, 4),
  },
  product: {
    text: "Need help with this product? I can explain what it does or point you to a shop.",
    suggestions: ["What is this product for?", "Show me similar products", "Find an Orange shop"],
  },
  find: {
    text: "What Orange location are you looking for?",
    suggestions: ["Find an Orange agent near me", "Show Orange Money points", "Find an Orange shop"],
  },
  bundles: {
    text: "I can help you compare available bundles.",
    suggestions: ["Help me choose a data plan", "Show me internet bundles", "I need home internet"],
  },
  shop: {
    text: "I can help you find the right device or plan.",
    suggestions: ["Show me 4G routers", "Show me phones", "Help me choose a data plan"],
  },
  support: {
    text: "Tell me what is going wrong and I will take it from there.",
    suggestions: ["I have a SIM problem", "My network is slow", "Call customer care"],
  },
  account: {
    text: "I can help with account questions, though I cannot see your line details in this build.",
    suggestions: ["What can you do?", "Find an Orange shop", "Call customer care"],
  },
};

function greetingFor(screenContext) {
  const key = screenContext?.assistantGreeting || screenContext?.screen || "default";
  return GREETINGS[key] || GREETINGS.default;
}

export function AssistantProvider({ children }) {
  const navigate = useNavigate();
  const { showNotice, openSearch, openSupportSheet, openPlaceholder } = useAppUi();
  const { coordinates, requestLocation, setManualArea, areas } = useLocationContext();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [screenContext, setScreenContext] = useState({ screen: "home" });
  const [pendingLocationDetail, setPendingLocationDetail] = useState(null);

  const flowRef = useRef(null);
  const lastPromptRef = useRef("");
  const coordinatesRef = useRef(coordinates);
  const screenContextRef = useRef(screenContext);

  useEffect(() => {
    coordinatesRef.current = coordinates;
  }, [coordinates]);

  useEffect(() => {
    screenContextRef.current = screenContext;
  }, [screenContext]);

  const pushMessage = useCallback((message) => {
    setMessages((current) => [...current, message]);
  }, []);

  /** Seeds the context-aware welcome message the first time the panel opens. */
  const ensureGreeting = useCallback((contextOverride) => {
    setMessages((current) => {
      if (current.length) {
        return current;
      }

      const greeting = greetingFor(contextOverride || screenContextRef.current);

      return [
        createMessage({
          role: MessageRole.ASSISTANT,
          text: greeting.text,
          suggestions: greeting.suggestions,
        }),
      ];
    });
  }, []);

  const buildContext = useCallback(
    () => ({
      screen: screenContextRef.current?.screen || "home",
      focus: screenContextRef.current?.focus || null,
      coordinates: coordinatesRef.current,
      flow: flowRef.current,
    }),
    []
  );

  const appendReply = useCallback(
    (reply) => {
      flowRef.current = reply.flow || null;

      pushMessage(
        createMessage({
          role: MessageRole.ASSISTANT,
          text: reply.text,
          cards: reply.cards,
          actions: reply.actions,
          suggestions: reply.suggestions,
          meta: reply.degraded ? { degraded: true } : null,
        })
      );
    },
    [pushMessage]
  );

  const send = useCallback(
    async (rawText) => {
      const text = String(rawText || "").trim();

      if (!text || isThinking) {
        return;
      }

      lastPromptRef.current = text;
      pushMessage(createMessage({ role: MessageRole.USER, text }));
      setIsThinking(true);

      try {
        const reply = await assistantService.send({
          text,
          context: buildContext(),
          history: messages.slice(-8).map(({ role, text: body }) => ({ role, text: body })),
        });

        appendReply(reply);
      } catch {
        pushMessage(
          createMessage({
            role: MessageRole.ASSISTANT,
            status: MessageStatus.ERROR,
            text: "I could not answer that just now. Try again, or reach Orange support directly.",
            actions: [
              createActionButton({
                label: "Try again",
                variant: "primary",
                action: createAction(ActionType.SEND_PROMPT, { prompt: lastPromptRef.current }),
              }),
              createActionButton({
                label: "Call customer care",
                action: createAction(ActionType.CALL_SUPPORT, {}),
              }),
            ],
          })
        );
      } finally {
        setIsThinking(false);
      }
    },
    [appendReply, buildContext, isThinking, messages, pushMessage]
  );

  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  /** Shows nearby results for a category once a reference point is known. */
  const presentNearby = useCallback(
    (category, origin) => {
      const label = getCategoryLabel(category);
      const nearest = listLocations({ category, origin, limit: 3 });

      if (!nearest.length) {
        appendReply({
          text: `I do not have any ${label} in the sample directory yet.`,
          cards: [],
          actions: mapActions("all"),
          suggestions: [],
          flow: null,
        });
        return;
      }

      appendReply({
        text: `Here are the nearest available ${label}. These are sample records for development, not live Orange data.`,
        cards: nearest.map(locationCard),
        actions: mapActions(category),
        suggestions: [],
        flow: null,
      });
    },
    [appendReply]
  );

  const offerManualAreas = useCallback(
    (category, leadIn) => {
      appendReply({
        text: leadIn,
        cards: [],
        actions: areas.map((area) =>
          createActionButton({
            label: area.label,
            action: createAction(ActionType.SET_AREA, { areaId: area.id, category }),
          })
        ),
        suggestions: [],
        flow: null,
      });
    },
    [appendReply, areas]
  );

  const handleRequestLocation = useCallback(
    async ({ category = "all" } = {}) => {
      const normalized = category || "all";

      if (coordinatesRef.current) {
        presentNearby(normalized, coordinatesRef.current);
        return;
      }

      appendReply({
        text: "Checking your location now.",
        cards: [],
        actions: [],
        suggestions: [],
        flow: null,
      });

      const result = await requestLocation();

      if (result.coordinates) {
        coordinatesRef.current = result.coordinates;
        presentNearby(normalized, result.coordinates);
        return;
      }

      offerManualAreas(
        normalized,
        `${result.message} Which area should I search around?`
      );
    },
    [appendReply, offerManualAreas, presentNearby, requestLocation]
  );

  const handleSetArea = useCallback(
    ({ areaId, category = "all" } = {}) => {
      const area = setManualArea(areaId);

      if (!area) {
        return;
      }

      coordinatesRef.current = area.coordinates;
      presentNearby(category, area.coordinates);
    },
    [presentNearby, setManualArea]
  );

  const handleCallSupport = useCallback(
    ({ topic } = {}) => {
      const phone = getSupportPhone();

      if (!phone) {
        openSupportSheet(topic || null);
        showNotice("Customer care number is not configured yet. Support options are open.");
        return;
      }

      window.location.href = buildCallHref(phone);
    },
    [openSupportSheet, showNotice]
  );

  const executeAssistantAction = useMemo(
    () =>
      createActionDispatcher({
        navigate,
        requestLocation: handleRequestLocation,
        setArea: handleSetArea,
        openLocationPicker: ({ category }) =>
          offerManualAreas(category || "all", "No problem. Which area should I search around?"),
        openLocationDetail: (location) => setPendingLocationDetail(location),
        callSupport: handleCallSupport,
        openSearch,
        openPlaceholder,
        // Works whether the panel is already open (a tap inside the chat) or
        // not (an "Ask AI about this" button somewhere in the app).
        sendPrompt: (prompt) => {
          setIsOpen(true);
          ensureGreeting();
          window.setTimeout(() => sendRef.current(prompt), 80);
        },
        closeAssistant: ({ soft } = {}) => {
          // On a phone the panel covers the screen it just navigated to, so it
          // steps aside. On desktop it sits beside the content and can stay.
          if (!soft || window.innerWidth < 900) {
            setIsOpen(false);
          }
        },
        notify: showNotice,
      }),
    [
      ensureGreeting,
      handleCallSupport,
      handleRequestLocation,
      handleSetArea,
      navigate,
      offerManualAreas,
      openPlaceholder,
      openSearch,
      showNotice,
    ]
  );

  /**
   * Every action tap goes through here so money-touching actions get an
   * explicit confirmation step instead of running silently.
   */
  const runAction = useCallback(
    (action) => {
      const result = executeAssistantAction(action);

      if (result.status === DispatchStatus.NEEDS_CONFIRMATION) {
        appendReply({
          text: "Just to confirm before I continue: this step would start a paid action on your line. Nothing happens until you confirm.",
          cards: [],
          actions: [
            createActionButton({
              label: "Yes, continue",
              variant: "primary",
              action: { ...action, confirmed: true },
            }),
            createActionButton({
              label: "Cancel",
              action: createAction(ActionType.DISMISS_CONFIRMATION, {}),
            }),
          ],
          suggestions: [],
          flow: null,
        });
        return result;
      }

      if (action.type === ActionType.DISMISS_CONFIRMATION) {
        appendReply({
          text: "Cancelled, nothing was started.",
          cards: [],
          actions: [],
          suggestions: [],
          flow: null,
        });
      }

      return result;
    },
    [appendReply, executeAssistantAction]
  );

  const openAssistant = useCallback(
    (options = {}) => {
      setIsOpen(true);
      ensureGreeting(options.context);

      if (options.prompt) {
        window.setTimeout(() => sendRef.current(options.prompt), 120);
      }
    },
    [ensureGreeting]
  );

  const closeAssistant = useCallback(() => setIsOpen(false), []);

  const clearConversation = useCallback(() => {
    flowRef.current = null;
    const greeting = greetingFor(screenContextRef.current);

    setMessages([
      createMessage({
        role: MessageRole.ASSISTANT,
        text: greeting.text,
        suggestions: greeting.suggestions,
      }),
    ]);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      messages,
      isThinking,
      screenContext,
      suggestions: greetingFor(screenContext).suggestions,
      pendingLocationDetail,
      clearPendingLocationDetail: () => setPendingLocationDetail(null),
      openAssistant,
      closeAssistant,
      clearConversation,
      send,
      runAction,
      setScreenContext,
      providerId: assistantService.providerId,
    }),
    [
      clearConversation,
      closeAssistant,
      isOpen,
      isThinking,
      messages,
      openAssistant,
      pendingLocationDetail,
      runAction,
      screenContext,
      send,
    ]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const context = useContext(AssistantContext);

  if (!context) {
    throw new Error("useAssistant must be used inside AssistantProvider");
  }

  return context;
}
