/**
 * Address lookups through MapTiler Geocoding (same key as the map tiles).
 *
 * Used by "Add location": captured coordinates become a readable address, and
 * a typed address can be turned into coordinates when the customer skips
 * "Locate me" / "Drop a pin". Every function resolves to `null` rather than
 * throwing, so the form keeps working without it.
 */

import { MAPTILER_KEY } from "../../config/env.js";

const GEOCODING_URL = "https://api.maptiler.com/geocoding";
const SIERRA_LEONE = "sl";

export function formatCoordinates([lng, lat]) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/** [lng, lat] -> "Street, Area, Freetown, Sierra Leone" */
export async function reverseGeocode(coordinates) {
  if (!MAPTILER_KEY || !coordinates) {
    return null;
  }

  try {
    const [lng, lat] = coordinates;
    const response = await fetch(
      `${GEOCODING_URL}/${lng},${lat}.json?key=${encodeURIComponent(MAPTILER_KEY)}&limit=1&language=en`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.features?.[0]?.place_name || null;
  } catch {
    return null;
  }
}

/** "Lumley Beach Road" -> { coordinates, label }, searching Sierra Leone only. */
export async function forwardGeocode(query, { near = null } = {}) {
  const text = String(query || "").trim();

  if (!MAPTILER_KEY || text.length < 3) {
    return null;
  }

  try {
    const params = new URLSearchParams({ key: MAPTILER_KEY, limit: "1", country: SIERRA_LEONE, language: "en" });

    if (near) {
      params.set("proximity", `${near[0]},${near[1]}`);
    }

    const response = await fetch(`${GEOCODING_URL}/${encodeURIComponent(text)}.json?${params.toString()}`);

    if (!response.ok) {
      return null;
    }

    const feature = (await response.json())?.features?.[0];

    if (!feature?.center) {
      return null;
    }

    return { coordinates: feature.center, label: feature.place_name || text };
  } catch {
    return null;
  }
}
