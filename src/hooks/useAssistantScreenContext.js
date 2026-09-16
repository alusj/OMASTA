import { useEffect } from "react";

import { useAssistant } from "../context/AssistantProvider.jsx";

/**
 * Lets a screen tell OMASTA AI what the customer is looking at.
 *
 * The screen passes a plain object; it never imports assistant internals, and
 * the assistant never imports the screen. Example:
 *
 *   useAssistantScreenContext({ screen: "product", focus: { productId } });
 *
 * @param {object} context      { screen, focus, assistantGreeting }
 * @param {Array}  dependencies values that should refresh the context
 */
export function useAssistantScreenContext(context, dependencies = []) {
  const { setScreenContext } = useAssistant();

  useEffect(() => {
    setScreenContext(context);
    // The context object is rebuilt each render, so dependencies are explicit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setScreenContext, ...dependencies]);
}
