/**
 * Local assistant provider.
 *
 * Runs entirely in the browser using the intent router. No network call, no API
 * key, no cost. This is the default so the app is fully demonstrable offline.
 */

import { routeMessage } from "../intentRouter.js";

const MIN_THINKING_MS = 280;
const MAX_THINKING_MS = 620;

export const localProvider = {
  id: "local",
  label: "On-device intents",
  isConfigured: () => true,

  async send({ text, context }) {
    const delay = MIN_THINKING_MS + Math.random() * (MAX_THINKING_MS - MIN_THINKING_MS);
    await new Promise((done) => setTimeout(done, delay));

    return routeMessage(text, context);
  },
};
