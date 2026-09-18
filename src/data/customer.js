/**
 * DEMO PROFILE.
 *
 * A stand-in for the signed-in customer. There is no authentication in this
 * build, so nothing here is a real account. The masked number is deliberately
 * incomplete. Demo balances live in `data/account.js`, are read through the
 * account service and are always labelled as demo in the UI.
 */

export const DEMO_CUSTOMER = {
  firstName: "Alus",
  initials: "AJ",
  maskedNumber: "+232 76 ... ...",
  planLabel: "Prepaid line",
  market: "Orange Sierra Leone",
  isDemo: true,
};

export function greetingForHour(date = new Date()) {
  const hour = date.getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}
