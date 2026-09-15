import { useEffect, useRef, useState } from "react";
import { GeolocateControl, Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(mapLibreWorkerUrl);

const FREETOWN_CENTER = [-13.2317, 8.484];
const MAP_STYLE_URL = "https://api.maptiler.com/maps/streets-v4/style.json";

function getMarkerLabel(location) {
  if (location.category === "money") {
    return "Money point";
  }

  if (location.category === "shop") {
    return "Orange shop";
  }

  return "Agent";
}

export default function OrangeMap({ locations, locateRequest = 0, onLocationClick, onMapError }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const geolocateControlRef = useRef(null);
  const mapHasLoadedRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  useEffect(() => {
    if (!apiKey || mapRef.current || !mapContainerRef.current) {
      return undefined;
    }

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: `${MAP_STYLE_URL}?key=${encodeURIComponent(apiKey)}`,
      center: FREETOWN_CENTER,
      zoom: 12.1,
      minZoom: 9,
      maxZoom: 18,
      attributionControl: true,
    });

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    const geolocateControl = new GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: false,
      showUserLocation: true,
      showAccuracyCircle: true,
    });
    map.addControl(geolocateControl, "bottom-right");
    geolocateControlRef.current = geolocateControl;
    map.on("load", () => {
      mapHasLoadedRef.current = true;
      setMapReady(true);
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
      map.remove();
      mapRef.current = null;
      geolocateControlRef.current = null;
      mapHasLoadedRef.current = false;
      setMapReady(false);
    };
  }, [apiKey, onMapError]);

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
      markerElement.className = `orange-live-marker orange-live-marker--${location.category}`;
      markerElement.setAttribute("aria-label", `Select ${location.type}: ${location.name}`);
      markerElement.title = location.name;
      markerElement.innerHTML = `<span class="orange-live-marker-pin">O</span><small>${getMarkerLabel(location)}</small>`;
      markerElement.addEventListener("click", () => onLocationClick(location));

      const marker = new Marker({ element: markerElement, anchor: "bottom" })
        .setLngLat(location.coordinates)
        .addTo(map);

      markersRef.current.set(location.id, marker);
    });

    return undefined;
  }, [locations, mapReady, onLocationClick]);

  useEffect(() => {
    if (mapReady && locateRequest > 0) {
      geolocateControlRef.current?.trigger();
    }
  }, [locateRequest, mapReady]);

  return <div className="orange-map-live" ref={mapContainerRef} aria-label="Live MapTiler map of Orange locations" />;
}
