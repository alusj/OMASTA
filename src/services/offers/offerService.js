/**
 * Offers service.
 *
 * Reads the local DEMO offers today. A real Orange offers/personalisation API
 * can replace these bodies without touching the Home rail or the assistant,
 * which both go through this module.
 */

import { OFFERS } from "../../data/offers.js";

const SIMULATED_LATENCY_MS = 200;

export async function listOffers({ limit = null } = {}) {
  const offers = limit ? OFFERS.slice(0, limit) : OFFERS;

  return new Promise((done) => {
    setTimeout(() => done(offers), SIMULATED_LATENCY_MS);
  });
}

/** Synchronous lookup so the assistant can answer about an offer immediately. */
export function findOfferSync(offerId) {
  return OFFERS.find((offer) => offer.id === offerId) || null;
}
