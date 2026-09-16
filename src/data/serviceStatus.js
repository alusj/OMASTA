/**
 * PLACEHOLDER SERVICE STATUS.
 *
 * There is no live Orange status feed connected. Every entry is marked
 * `isDemo: true` and the UI labels the whole section as sample data. Do not
 * remove that labelling until `statusService` is pointed at a real API.
 */

export const SERVICE_STATUS = [
  {
    id: "mobile-network",
    label: "Mobile network",
    state: "operational",
    detail: "Sample status, not a live reading.",
    isDemo: true,
  },
  {
    id: "mobile-data",
    label: "Mobile data",
    state: "operational",
    detail: "Sample status, not a live reading.",
    isDemo: true,
  },
  {
    id: "orange-money",
    label: "Orange Money",
    state: "operational",
    detail: "Sample status, not a live reading.",
    isDemo: true,
  },
  {
    id: "customer-services",
    label: "Customer services",
    state: "operational",
    detail: "Sample status, not a live reading.",
    isDemo: true,
  },
];

export const STATUS_DISCLAIMER =
  "Sample status only. Live service status needs an Orange status API before it can be trusted.";
