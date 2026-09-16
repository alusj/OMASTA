/**
 * Assistant service.
 *
 * The only thing the UI imports. It picks a provider, falls back to the local
 * one when a remote provider is not configured or fails, and guarantees the
 * caller always receives a well-formed reply.
 */

import { ASSISTANT_PROVIDER } from "../../config/env.js";
import { createReply } from "./assistantTypes.js";
import { localProvider } from "./providers/localProvider.js";
import { remoteProvider } from "./providers/remoteProvider.js";

const PROVIDERS = {
  local: localProvider,
  remote: remoteProvider,
};

export function resolveProvider(preferred = ASSISTANT_PROVIDER) {
  const provider = PROVIDERS[preferred];

  if (provider && provider.isConfigured()) {
    return provider;
  }

  return localProvider;
}

export function createAssistantService({ provider = resolveProvider() } = {}) {
  return {
    providerId: provider.id,

    /**
     * @param {object} params
     * @param {string} params.text     customer message
     * @param {object} params.context  screen context, coordinates, active flow
     * @param {Array}  params.history  prior messages, newest last
     */
    async send({ text, context = {}, history = [] }) {
      try {
        const reply = await provider.send({ text, context, history });

        if (!reply || typeof reply.text !== "string") {
          throw new Error("Assistant returned an unexpected reply.");
        }

        return reply;
      } catch (error) {
        if (provider.id !== "local") {
          // A hosted model being unavailable should never dead-end the customer.
          const fallback = await localProvider.send({ text, context, history });
          return { ...fallback, degraded: true };
        }

        throw error;
      }
    },
  };
}

export const assistantService = createAssistantService();

export function errorReply(message) {
  return createReply({
    intent: "error",
    text: message || "Something went wrong on my side. Try again, or reach Orange support directly.",
  });
}
