/**
 * Central action dispatcher.
 *
 * Everything the assistant can make the app do goes through here, which keeps
 * the assistant UI free of navigation knowledge and gives one place to audit
 * what an AI-suggested action is allowed to trigger.
 *
 * Safety rule: any action that would spend money, activate a paid service or
 * change an account is refused unless it carries `confirmed: true`. The caller
 * turns that refusal into an explicit confirmation step in the conversation.
 */

import { ActionType, requiresConfirmation } from "./assistantTypes.js";
import { buildDirectionsUrl, findLocation } from "../locations/locationService.js";

export const DispatchStatus = {
  DONE: "done",
  NEEDS_CONFIRMATION: "needs_confirmation",
  UNSUPPORTED: "unsupported",
  FAILED: "failed",
};

function toQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

/**
 * @param {object} handlers  app capabilities supplied by the provider tree
 * @returns {(action: object) => object} executeAssistantAction
 */
export function createActionDispatcher(handlers) {
  const {
    navigate,
    requestLocation,
    setArea,
    openLocationPicker,
    openLocationDetail,
    callSupport,
    openSearch,
    openPlaceholder,
    sendPrompt,
    closeAssistant,
    notify,
  } = handlers;

  return function executeAssistantAction(action) {
    if (!action || !action.type) {
      return { status: DispatchStatus.UNSUPPORTED };
    }

    if (requiresConfirmation(action) && !action.confirmed) {
      return { status: DispatchStatus.NEEDS_CONFIRMATION, action };
    }

    switch (action.type) {
      case ActionType.NAVIGATE: {
        navigate(`${action.target}${toQueryString(action.params)}`);
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.OPEN_PRODUCT: {
        navigate(`/shop/${action.productId}${toQueryString({ intent: action.intent })}`);
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.OPEN_BUNDLE: {
        navigate(`/shop${toQueryString({ tab: "bundles", bundle: action.bundleId, intent: action.intent })}`);
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.OPEN_SUPPORT: {
        navigate(`/support${toQueryString({ topic: action.topic })}`);
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.OPEN_MAP: {
        navigate(`/find${toQueryString({ category: action.category || "all", view: "map" })}`);
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.OPEN_LOCATION: {
        const location = findLocation(action.locationId);

        if (!location) {
          return { status: DispatchStatus.FAILED };
        }

        openLocationDetail?.(location);
        navigate(`/find${toQueryString({ category: location.category, location: location.id })}`);
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.DIRECTIONS: {
        const location = findLocation(action.locationId);

        if (!location) {
          return { status: DispatchStatus.FAILED };
        }

        window.open(buildDirectionsUrl(location), "_blank", "noopener,noreferrer");
        return { status: DispatchStatus.DONE };
      }

      case ActionType.REQUEST_LOCATION: {
        requestLocation?.({ category: action.category });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.CHOOSE_LOCATION: {
        openLocationPicker?.({ category: action.category });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.SET_AREA: {
        setArea?.({ areaId: action.areaId, category: action.category });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.DISMISS_CONFIRMATION: {
        // The confirmation message itself is handled by the caller.
        return { status: DispatchStatus.DONE };
      }

      case ActionType.CALL_SUPPORT: {
        callSupport?.({ topic: action.topic });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.OPEN_SEARCH: {
        openSearch?.(action.query || "");
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.OPEN_PLACEHOLDER: {
        openPlaceholder?.(action.placeholderId);
        closeAssistant?.({ soft: true });
        return { status: DispatchStatus.DONE };
      }

      case ActionType.SEND_PROMPT: {
        sendPrompt?.(action.prompt);
        return { status: DispatchStatus.DONE };
      }

      case ActionType.DISMISS: {
        closeAssistant?.({ soft: false });
        return { status: DispatchStatus.DONE };
      }

      default: {
        notify?.("That action is not available yet.");
        return { status: DispatchStatus.UNSUPPORTED };
      }
    }
  };
}
