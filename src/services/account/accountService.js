/**
 * Account service: balances and recent activity.
 *
 * The single place the UI reads Orange Money, airtime and data balances and
 * the activity feed from. Today it returns the local DEMO snapshot; wiring a
 * real Orange balance/transactions API means changing these function bodies
 * only. Every function is async and every result carries `isDemo` so the UI
 * can label demo figures and never present them as the customer's own.
 *
 * Deliberately no fake endpoint here: there is no Orange API to call yet.
 */

import { DEMO_ACCOUNT_SUMMARY, DEMO_ACTIVITY } from "../../data/account.js";

const SIMULATED_LATENCY_MS = 260;

function resolve(value) {
  return new Promise((done) => {
    setTimeout(() => done(value), SIMULATED_LATENCY_MS);
  });
}

/**
 * @returns {Promise<{
 *   currency: string,
 *   orangeMoneyBalance: number,
 *   airtimeBalance: number,
 *   dataBalance: { amount: number, unit: string },
 *   isDemo: boolean,
 * }>}
 */
export async function getAccountSummary() {
  return resolve({ ...DEMO_ACCOUNT_SUMMARY, dataBalance: { ...DEMO_ACCOUNT_SUMMARY.dataBalance } });
}

/** Newest first. */
export async function listRecentActivity({ limit = null } = {}) {
  const sorted = [...DEMO_ACTIVITY].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  return resolve(limit ? sorted.slice(0, limit) : sorted);
}
