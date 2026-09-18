/**
 * Route between two [lng, lat] points for the in-app route line.
 *
 * Asks an OSRM-compatible server (ROUTING_URL) for a road route. If that is
 * unreachable or slow, it falls back to a straight line so Find never
 * dead-ends; `kind` tells the UI which one it got so it can say so honestly.
 */

import { ROUTING_URL } from "../../config/env.js";
import { distanceKm } from "./locationService.js";

const ROUTE_TIMEOUT_MS = 7000;

export const RouteKind = {
  ROAD: "road",
  STRAIGHT: "straight",
};

function straightRoute(from, to) {
  return {
    kind: RouteKind.STRAIGHT,
    coordinates: [from, to],
    distanceMeters: Math.round(distanceKm(from, to) * 1000),
    durationSeconds: null,
  };
}

/**
 * @param {[number, number]} from  [lng, lat]
 * @param {[number, number]} to    [lng, lat]
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getRoute(from, to, { signal } = {}) {
  if (!from || !to) {
    return null;
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener("abort", abortFromCaller);

  try {
    const path = `${from[0]},${from[1]};${to[0]},${to[1]}`;
    const response = await fetch(
      `${ROUTING_URL}/route/v1/driving/${path}?overview=full&geometries=geojson&alternatives=false&steps=false`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error(`Routing failed with status ${response.status}`);
    }

    const data = await response.json();
    const route = data?.routes?.[0];

    if (data?.code !== "Ok" || !route?.geometry?.coordinates?.length) {
      throw new Error("No road route found.");
    }

    return {
      kind: RouteKind.ROAD,
      coordinates: route.geometry.coordinates,
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
    };
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    return straightRoute(from, to);
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

export function formatRouteDistance(meters) {
  if (typeof meters !== "number") {
    return "";
  }

  return meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

export function formatRouteDuration(seconds) {
  if (typeof seconds !== "number") {
    return "";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));

  if (minutes < 60) {
    return `${minutes} min`;
  }

  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
