/**
 * Remote assistant provider (not connected).
 *
 * This is the seam for a real model. It posts to a backend endpoint that YOU
 * own, and that backend holds the model API key. A model key must never be put
 * in a `VITE_` variable: anything with that prefix is compiled into the browser
 * bundle and is public.
 *
 * Expected contract, so the UI needs no changes when it is switched on:
 *
 *   POST {VITE_ASSISTANT_API_URL}
 *   body: { text, context, history }
 *   200 : { text, cards?, actions?, suggestions?, flow?, intent? }
 *
 * The response must use the shapes in `assistantTypes.js`. The server is also
 * the right place to enforce that the model may not invent balances, prices,
 * network status or Orange locations.
 */

import { ASSISTANT_API_URL } from "../../../config/env.js";
import { createReply } from "../assistantTypes.js";

export const remoteProvider = {
  id: "remote",
  label: "Hosted model",
  isConfigured: () => Boolean(ASSISTANT_API_URL),

  async send({ text, context, history }) {
    if (!ASSISTANT_API_URL) {
      throw new Error("Assistant API URL is not configured.");
    }

    const response = await fetch(ASSISTANT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context, history }),
    });

    if (!response.ok) {
      throw new Error(`Assistant request failed with status ${response.status}`);
    }

    const payload = await response.json();

    return createReply({
      text: payload.text || "",
      cards: payload.cards || [],
      actions: payload.actions || [],
      suggestions: payload.suggestions || [],
      flow: payload.flow || null,
      intent: payload.intent || null,
    });
  },
};
