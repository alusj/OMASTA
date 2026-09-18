/**
 * Orange Money flows (SIMULATED).
 *
 * No Orange Money API is connected, so nothing in this module can move money.
 * `submitMoneyFlow` only returns a simulated result, clearly marked as such,
 * and refuses to run at all without an explicit confirmation flag.
 *
 * The intended production flow, which the UI already follows step by step:
 *
 *   recipient -> amount -> review -> explicit confirmation
 *   -> Orange-authorised PIN / OTP (collected by Orange, never by this app)
 *   -> API transaction -> verified result from Orange
 *
 * When the real API exists, replace the body of `submitMoneyFlow`, return
 * `status: MoneyResultStatus.COMPLETED` only on a verified Orange response,
 * and keep the confirmation guard.
 */

export const MoneyFlowKind = {
  SEND: "send",
  REQUEST: "request",
};

export const MoneyResultStatus = {
  SIMULATED: "simulated",
  COMPLETED: "completed",
  FAILED: "failed",
};

const SIMULATED_LATENCY_MS = 900;

/** Sierra Leone numbers: 8 digits after the +232 country code or the leading 0. */
export function normalizeRecipient(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (digits.startsWith("232") && digits.length === 11) {
    return digits.slice(3);
  }

  if (digits.startsWith("0") && digits.length === 9) {
    return digits.slice(1);
  }

  return digits;
}

export function validateRecipient(value) {
  const local = normalizeRecipient(value);

  if (!local) {
    return "Enter the recipient's Orange number.";
  }

  if (local.length !== 8) {
    return "Enter an 8-digit Sierra Leone number, for example 076 123 456.";
  }

  return "";
}

export function formatRecipient(value) {
  const local = normalizeRecipient(value);

  if (local.length !== 8) {
    return value;
  }

  return `+232 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
}

export function validateAmount(value, { max = null } = {}) {
  const amount = Number(String(value || "").replace(/,/g, ""));

  if (!value || Number.isNaN(amount)) {
    return "Enter an amount.";
  }

  if (amount <= 0) {
    return "The amount must be more than zero.";
  }

  if (max !== null && amount > max) {
    return "That is more than the available demo balance.";
  }

  return "";
}

export function parseAmount(value) {
  return Number(String(value || "").replace(/,/g, ""));
}

/**
 * @param {object} params
 * @param {"send"|"request"} params.kind
 * @param {string} params.recipient
 * @param {number} params.amount
 * @param {string} params.currency
 * @param {boolean} params.confirmed  must be true: set only by an explicit tap on the review step
 */
export async function submitMoneyFlow({ kind, recipient, amount, currency, confirmed }) {
  if (!confirmed) {
    throw new Error("Money flows require explicit confirmation.");
  }

  await new Promise((done) => setTimeout(done, SIMULATED_LATENCY_MS));

  return {
    status: MoneyResultStatus.SIMULATED,
    isSimulated: true,
    kind,
    recipient: formatRecipient(recipient),
    amount,
    currency,
    reference: `DEMO-${Date.now().toString(36).toUpperCase()}`,
  };
}
