import { useEffect, useRef, useState } from "react";
import {
  GeolocateControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

import { MAPTILER_KEY } from "../../config/env.js";

setWorkerUrl(mapLibreWorkerUrl);

const FREETOWN_CENTER = [-13.2317, 8.484];
const MAP_STYLE_URL = "https://api.maptiler.com/maps/streets-v4/style.json";

const ROUTE_SOURCE = "omasta-route";
const ROUTE_CASING_LAYER = "omasta-route-casing";
const ROUTE_LINE_LAYER = "omasta-route-line";
const ROUTE_DRAW_MS = 900;
const CAMERA_MS = 1800;

const MARKER_LABEL = {
  money: "Money point",
  shop: "Orange shop",
  support: "Office",
  agent: "Agent",
};

function getMarkerLabel(location) {
  return MARKER_LABEL[location.category] || "Orange";
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** The point under the visual centre of the map container (what a centred pin marks). */
function containerCenter(map) {
  const container = map.getContainer();
  const point = map.unproject([container.clientWidth / 2, container.clientHeight / 2]);
  return [point.lng, point.lat];
}

function emptyLine() {
  return { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } };
}

/** The first `fraction` (0..1) of a polyline, measured along its length. */
function partialLine(coordinates, cumulative, fraction) {
  const total = cumulative[cumulative.length - 1];

  if (fraction >= 1 || total === 0) {
    return coordinates;
  }

  const target = total * fraction;
  const result = [coordinates[0]];

  for (let index = 1; index < coordinates.length; index += 1) {
    if (cumulative[index] >= target) {
      const span = cumulative[index] - cumulative[index - 1] || 1;
      const t = (target - cumulative[index - 1]) / span;
      const [x0, y0] = coordinates[index - 1];
      const [x1, y1] = coordinates[index];
      result.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t]);
      break;
    }

    result.push(coordinates[index]);
  }

  return result;
}

function cumulativeLengths(coordinates) {
  const lengths = [0];

  for (let index = 1; index < coordinates.length; index += 1) {
    const [x0, y0] = coordinates[index - 1];
    const [x1, y1] = coordinates[index];
    lengths.push(lengths[index - 1] + Math.hypot(x1 - x0, y1 - y0));
  }

  return lengths;
}

/**
 * Live MapLibre map with MapTiler tiles.
 *
 * The API key is read from the environment only. When it is missing the caller
 * renders the illustrated fallback map instead, so Find keeps working.
 *
 * Beyond markers it can: highlight the selected location, draw an animated
 * route line (`route`), run camera flights (`camera`, re-run whenever its
 * `key` changes), show a temporary preview marker, and hand the caller a small
 * API (`onReady`) used by "Drop a pin" to read the map centre.
 */
export default function OrangeMap({
  locations,
  locateRequest = 0,
  userCoordinates = null,
  focusCoordinates = null,
  selectedLocationId = null,
  route = null,
  camera = null,
  padding = null,
  previewMarker = null,
  className = "",
  onLocationClick,
  onMapError,
  onReady,
  onCenterChange,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const previewMarkerRef = useRef(null);
  const geolocateControlRef = useRef(null);
  const mapHasLoadedRef = useRef(false);
  const onLocationClickRef = useRef(onLocationClick);
  const onCenterChangeRef = useRef(onCenterChange);
  const [mapReady, setMapReady] = useState(false);
  const apiKey = MAPTILER_KEY;

  useEffect(() => {
    onLocationClickRef.current = onLocationClick;
    onCenterChangeRef.current = onCenterChange;
  }, [onCenterChange, onLocationClick]);

  useEffect(() => {
    if (!apiKey || mapRef.current || !mapContainerRef.current) {
      return undefined;
    }

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: `${MAP_STYLE_URL}?key=${encodeURIComponent(apiKey)}`,
      center: FREETOWN_CENTER,
      zoom: 12.1,
      minZoom: 6,
      maxZoom: 18,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const geolocateControl = new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
      showAccuracyCircle: true,
    });
    map.addControl(geolocateControl, "top-right");
    geolocateControlRef.current = geolocateControl;

    map.on("load", () => {
      map.addSource(ROUTE_SOURCE, { type: "geojson", data: emptyLine() });
      map.addLayer({
        id: ROUTE_CASING_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.95 },
      });
      map.addLayer({
        id: ROUTE_LINE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ff7900", "line-width": 5 },
      });

      mapHasLoadedRef.current = true;
      setMapReady(true);

      onReady?.({
        getCenter: () => containerCenter(map),
        flyTo: (center, zoom = 16) =>
          map.flyTo({
            center,
            zoom,
            padding: { top: 0, bottom: 0, left: 0, right: 0 },
            duration: prefersReducedMotion() ? 0 : 1200,
            essential: true,
          }),
      });
    });

    map.on("move", () => {
      onCenterChangeRef.current?.(containerCenter(map));
    });

    map.on("error", (event) => {
      if (event?.error && !mapHasLoadedRef.current) {
        onMapError?.(event.error);
      }
    });

    mapRef.current = map;
    const markerRegistry = markersRef.current;

    return () => {
      markerRegistry.forEach((marker) => marker.remove());
      markerRegistry.clear();
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      previewMarkerRef.current?.remove();
      previewMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
      geolocateControlRef.current = null;
      mapHasLoadedRef.current = false;
      setMapReady(false);
    };
    // onReady is read once, when the map first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, onMapError]);

  /** Location markers, added and removed as the filtered list changes. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return undefined;
    }

    const visibleLocationIds = new Set(locations.map((location) => location.id));

    markersRef.current.forEach((marker, locationId) => {
      if (!visibleLocationIds.has(locationId)) {
        marker.remove();
        markersRef.current.delete(locationId);
      }
    });

    locations.forEach((location) => {
      if (!location.coordinates || markersRef.current.has(location.id)) {
        return;
      }

      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = `orange-live-marker orange-live-marker--${location.category}${
        location.isCommunity ? " is-community" : ""
      }`;
      markerElement.setAttribute("aria-label", `Select ${location.type}: ${location.name}`);
      markerElement.title = location.name;
      markerElement.innerHTML = `<span class="orange-live-marker-pin">O</span><small>${getMarkerLabel(location)}</small>`;
      markerElement.addEventListener("click", (event) => {
        event.stopPropagation();
        onLocationClickRef.current?.(location);
      });

      const marker = new Marker({ element: markerElement, anchor: "bottom" })
        .setLngLat(location.coordinates)
        .addTo(map);

      markersRef.current.set(location.id, marker);
    });

    return undefined;
  }, [locations, mapReady]);

  /** Selected marker: raised, pulsing and above its neighbours. */
  useEffect(() => {
    markersRef.current.forEach((marker, locationId) => {
      const element = marker.getElement();
      const selected = locationId === selectedLocationId;
      element.classList.toggle("is-selected", selected);
      element.style.zIndex = selected ? "5" : "";
      element.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }, [locations, mapReady, selectedLocationId]);

  /** Shows the reference point, whether it came from the device or a manual pick. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return undefined;
    }

    if (!userCoordinates) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return undefined;
    }

    if (!userMarkerRef.current) {
      const element = document.createElement("span");
      element.className = "orange-live-user-marker";
      element.setAttribute("aria-hidden", "true");
      userMarkerRef.current = new Marker({ element }).setLngLat(userCoordinates).addTo(map);
    } else {
      userMarkerRef.current.setLngLat(userCoordinates);
    }

    return undefined;
  }, [mapReady, userCoordinates]);

  /** A temporary marker, e.g. an admin previewing a pending submission. */
  useEffect(() => {
    const map = mapRef.current;
    previewMarkerRef.current?.remove();
    previewMarkerRef.current = null;

    if (!map || !mapReady || !previewMarker?.coordinates) {
      return undefined;
    }

    const element = document.createElement("span");
    element.className = "orange-live-marker orange-live-marker--preview is-selected";
    element.innerHTML = `<span class="orange-live-marker-pin">O</span><small>${previewMarker.label || "Preview"}</small>`;
    previewMarkerRef.current = new Marker({ element, anchor: "bottom" }).setLngLat(previewMarker.coordinates).addTo(map);

    return undefined;
  }, [mapReady, previewMarker]);

  /** Route line, drawn progressively from start to destination. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) {
      return undefined;
    }

    const source = map.getSource(ROUTE_SOURCE);

    if (!source) {
      return undefined;
    }

    if (!route?.coordinates?.length) {
      source.setData(emptyLine());
      return undefined;
    }

    const straight = route.kind === "straight";
    map.setPaintProperty(ROUTE_LINE_LAYER, "line-dasharray", straight ? [1.4, 1.6] : undefined);
    map.setPaintProperty(ROUTE_LINE_LAYER, "line-opacity", straight ? 0.85 : 1);

    const coordinates = route.coordinates;

    if (prefersReducedMotion() || coordinates.length < 2) {
      source.setData({ ...emptyLine(), geometry: { type: "LineString", coordinates } });
      return undefined;
    }

    const cumulative = cumulativeLengths(coordinates);
    let frame = 0;
    const startedAt = performance.now();

    const draw = (now) => {
      const progress = Math.min((now - startedAt) / ROUTE_DRAW_MS, 1);
      const eased = 1 - (1 - progress) ** 3;
      source.setData({
        ...emptyLine(),
        geometry: { type: "LineString", coordinates: partialLine(coordinates, cumulative, eased) },
      });

      if (progress < 1) {
        frame = requestAnimationFrame(draw);
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [mapReady, route]);

  /** Camera flights. A new `camera.key` runs the move again. */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady || !camera) {
      return;
    }

    const duration = prefersReducedMotion() ? 0 : CAMERA_MS;
    const cameraPadding = padding || { top: 60, bottom: 60, left: 40, right: 40 };

    // Both kinds go through cameraForBounds so the overlay padding only shifts
    // this one flight; flyTo({ padding }) would leave it set on the map.
    const points = camera.type === "fit" && camera.points?.length > 1 ? camera.points : [camera.center || camera.points?.[0]];

    if (!points[0]) {
      return;
    }

    const bounds = points.reduce((box, point) => box.extend(point), new LngLatBounds(points[0], points[0]));
    const target = map.cameraForBounds(bounds, {
      padding: cameraPadding,
      maxZoom: camera.type === "fit" && points.length > 1 ? 16 : camera.zoom || 15.5,
    });

    if (target) {
      map.flyTo({ ...target, duration, curve: 1.42, essential: true });
    }
    // Only a new camera request should move the map, not padding changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera?.key, mapReady]);

  /** Legacy single-point focus, still used by callers that only pass coordinates. */
  useEffect(() => {
    const map = mapRef.current;

    if (map && mapReady && focusCoordinates) {
      map.flyTo({ center: focusCoordinates, zoom: 14, essential: true });
    }
  }, [focusCoordinates, mapReady]);

  useEffect(() => {
    if (mapReady && locateRequest > 0) {
      geolocateControlRef.current?.trigger();
    }
  }, [locateRequest, mapReady]);

  return (
    <div
      className={`orange-map-live ${className}`}
      ref={mapContainerRef}
      aria-label="Live map of Orange locations"
    />
  );
}
