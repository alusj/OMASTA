/**
 * DEMO ACCOUNT SNAPSHOT.
 *
 * There is no Orange Money, balance or usage API connected to this build, so
 * these figures are invented for design review only. They are NOT the
 * customer's real balance or transactions, every record carries
 * `isDemo: true`, and the UI labels them as demo wherever they appear.
 *
 * Read these through `services/account/accountService.js`, never directly from
 * a component, so the service can be pointed at a real Orange API later.
 */

export const DEMO_ACCOUNT_SUMMARY = {
  currency: "SLE",
  orangeMoneyBalance: 2450,
  airtimeBalance: 34.5,
  dataBalance: { amount: 2.8, unit: "GB" },
  isDemo: true,
};

function daysAgo(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

/**
 * `direction` is from the customer's point of view: "out" spends money,
 * "in" receives it. Amounts are positive; the sign comes from the direction.
 */
export const DEMO_ACTIVITY = [
  {
    id: "demo-activity-data-5gb",
    kind: "data",
    title: "5 GB data bundle",
    detail: "Valid 7 days",
    amount: 45,
    currency: "SLE",
    direction: "out",
    occurredAt: daysAgo(0, 9),
    isDemo: true,
  },
  {
    id: "demo-activity-om-transfer",
    kind: "money-out",
    title: "Orange Money transfer",
    detail: "To +232 76 ••• 214",
    amount: 150,
    currency: "SLE",
    direction: "out",
    occurredAt: daysAgo(1, 18),
    isDemo: true,
  },
  {
    id: "demo-activity-airtime",
    kind: "airtime",
    title: "Airtime recharge",
    detail: "Own number",
    amount: 20,
    currency: "SLE",
    direction: "out",
    occurredAt: daysAgo(3, 12),
    isDemo: true,
  },
  {
    id: "demo-activity-om-received",
    kind: "money-in",
    title: "Money received",
    detail: "From +232 77 ••• 530",
    amount: 200,
    currency: "SLE",
    direction: "in",
    occurredAt: daysAgo(4, 16),
    isDemo: true,
  },
  {
    id: "demo-activity-voice",
    kind: "voice",
    title: "200 minutes voice bundle",
    detail: "Valid 7 days",
    amount: 55,
    currency: "SLE",
    direction: "out",
    occurredAt: daysAgo(8, 11),
    isDemo: true,
  },
];
