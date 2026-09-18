/**
 * Location service.
 *
 * Wraps the demo location directory plus the browser geolocation API. All
 * distances are computed locally from coordinates, so they are only as accurate
 * as the demo coordinates behind them.
 */

import { CATEGORY_ALIASES, LOCATIONS, LOCATION_CATEGORIES, MANUAL_AREAS } from "../../data/locations.js";

export { LOCATION_CATEGORIES, MANUAL_AREAS };

export function normalizeCategory(value) {
  if (!value) {
    return "all";
  }

  const key = String(value).toLowerCase().trim();
  return CATEGORY_ALIASES[key] || "all";
}

export function getCategoryLabel(categoryId) {
  const category = LOCATION_CATEGORIES.find((item) => item.id === normalizeCategory(categoryId));
  return category ? category.plural : "locations";
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two [lng, lat] pairs, in kilometres. */
export function distanceKm(from, to) {
  if (!from || !to) {
    return null;
  }

  const [lng1, lat1] = from;
  const [lng2, lat2] = to;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function formatDistance(km) {
  if (km === null || km === undefined || Number.isNaN(km)) {
    return null;
  }

  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }

  return `${km.toFixed(1)} km`;
}

function minutesFromClock(clock) {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Open/closed derived from the demo opening hours only. It is a schedule
 * comparison, not a live status from Orange.
 */
export function getOpenState(location, now = new Date()) {
  if (!location.openingHours) {
    return { state: "unknown", label: "Hours not listed" };
  }

  const { opensAt, closesAt, days } = location.openingHours;
  const current = now.getHours() * 60 + now.getMinutes();
  const isOpen = current >= minutesFromClock(opensAt) && current < minutesFromClock(closesAt);

  return {
    state: isOpen ? "open" : "closed",
    label: isOpen ? `Open now, closes ${closesAt}` : `Closed, opens ${opensAt}`,
    days,
  };
}

/**
 * Returns locations for a category, decorated with distance when a reference
 * point is known, sorted nearest first.
 *
 * `extra` adds records from other sources (approved community submissions)
 * in the same shape, so every caller treats them identically.
 */
export function listLocations({ category = "all", origin = null, limit = null, extra = [] } = {}) {
  const normalized = normalizeCategory(category);

  const decorated = [...LOCATIONS, ...extra].filter((location) => normalized === "all" || location.category === normalized).map(
    (location) => {
      const km = origin ? distanceKm(origin, location.coordinates) : null;

      return {
        ...location,
        distanceKm: km,
        distanceLabel: formatDistance(km),
        openState: getOpenState(location),
      };
    }
  );

  decorated.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) {
      return 0;
    }
    if (a.distanceKm === null) {
      return 1;
    }
    if (b.distanceKm === null) {
      return -1;
    }
    return a.distanceKm - b.distanceKm;
  });

  return limit ? decorated.slice(0, limit) : decorated;
}

export function findLocation(locationId) {
  return LOCATIONS.find((location) => location.id === locationId) || null;
}

export function searchLocations(query) {
  const term = query.trim().toLowerCase();

  if (!term) {
    return [];
  }

  return LOCATIONS.filter((location) =>
    `${location.name} ${location.type} ${location.address} ${location.services.join(" ")}`
      .toLowerCase()
      .includes(term)
  );
}

export const GEO_STATUS = {
  IDLE: "idle",
  PROMPTING: "prompting",
  GRANTED: "granted",
  DENIED: "denied",
  UNAVAILABLE: "unavailable",
  ERROR: "error",
};

/**
 * Requests the device position. Resolves with a result object rather than
 * throwing, so callers can render a helpful explanation for every outcome.
 */
export function requestDeviceLocation({ timeout = 10000 } = {}) {
  return new Promise((done) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      done({ status: GEO_STATUS.UNAVAILABLE, coordinates: null, message: "This device cannot share a location." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        done({
          status: GEO_STATUS.GRANTED,
          coordinates: [position.coords.longitude, position.coords.latitude],
          accuracy: position.coords.accuracy,
          message: "",
        });
      },
      (error) => {
        const denied = error.code === error.PERMISSION_DENIED;

        done({
          status: denied ? GEO_STATUS.DENIED : GEO_STATUS.ERROR,
          coordinates: null,
          message: denied
            ? "Location access is off. You can still choose an area manually."
            : "Your location could not be read just now. You can choose an area manually.",
        });
      },
      { enableHighAccuracy: true, timeout, maximumAge: 60000 }
    );
  });
}

/**
 * In-app directions: opens Find on the map with this location selected and a
 * route drawn from the customer. No hand-off to an external maps app.
 */
export function buildRoutePath(location) {
  const params = new URLSearchParams({ view: "map", location: location.id, route: "1" });
  return `/find?${params.toString()}`;
}

/** Where the map opens, and the reference point when no location is known. */
export const DEFAULT_MAP_CENTER = [-13.2317, 8.484];
