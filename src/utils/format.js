/** Display formatting shared by balances, activity and money flows. */

const moneyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount, currency = "SLE") {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "";
  }

  return `${currency} ${moneyFormatter.format(amount)}`;
}

export function formatDataAmount(balance) {
  if (!balance || typeof balance.amount !== "number") {
    return "";
  }

  return `${balance.amount} ${balance.unit || "GB"}`;
}

/** "Today", "Yesterday", a weekday within the last week, otherwise "12 Sep". */
export function formatRelativeDay(isoDate, now = new Date()) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const startOf = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86400000);

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days > 1 && days < 7) {
    return date.toLocaleDateString("en-GB", { weekday: "long" });
  }

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
