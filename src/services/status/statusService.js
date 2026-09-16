/**
 * Service status.
 *
 * There is no live Orange status feed connected. This returns placeholder
 * records flagged `isDemo`, together with a disclaimer the UI must display.
 *
 * To go live: replace `getServiceStatus` with a fetch against the Orange status
 * endpoint and return `isDemo: false` records in the same shape.
 */

import { SERVICE_STATUS, STATUS_DISCLAIMER } from "../../data/serviceStatus.js";

export function getServiceStatus() {
  return {
    services: SERVICE_STATUS,
    disclaimer: STATUS_DISCLAIMER,
    isLive: false,
    checkedAt: null,
  };
}
