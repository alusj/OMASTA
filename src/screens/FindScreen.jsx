import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { List, Locate, Map as MapIcon, MapPinned, Sparkles, TriangleAlert } from "lucide-react";

import OrangeMap from "../components/OrangeHome/OrangeMap.jsx";
import FallbackMap from "../components/find/FallbackMap.jsx";
import LocationCard from "../components/find/LocationCard.jsx";
import LocationDetailSheet from "../components/find/LocationDetailSheet.jsx";
import FilterChips from "../components/common/FilterChips.jsx";
import { DemoNote } from "../components/common/DemoBadge.jsx";
import { hasMapTilerKey } from "../config/env.js";
import {
  GEO_STATUS,
  LOCATION_CATEGORIES,
  buildDirectionsUrl,
  listLocations,
  normalizeCategory,
} from "../services/locations/locationService.js";
import { buildCallHref } from "../services/support/supportService.js";
import { useAppUi } from "../context/AppUiProvider.jsx";
import { useAssistant } from "../context/AssistantProvider.jsx";
import { useLocationContext } from "../context/LocationProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";

/**
 * Find Orange: map and list views over the location directory, driven by URL
 * parameters so the assistant can deep link straight into a filtered view.
 */
export default function FindScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotice } = useAppUi();
  const { openAssistant, pendingLocationDetail, clearPendingLocationDetail } = useAssistant();
  const {
    coordinates,
    status,
    label: originLabel,
    message: locationMessage,
    areas,
    isLocating,
    requestLocation,
    setManualArea,
  } = useLocationContext();

  const category = normalizeCategory(searchParams.get("category"));
  const view = searchParams.get("view") === "list" ? "list" : "map";
  const requestedLocationId = searchParams.get("location");

  const [liveMapFailed, setLiveMapFailed] = useState(false);
  const [locateRequest, setLocateRequest] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);

  useAssistantScreenContext({ screen: "find", focus: { category } }, [category]);

  const locations = useMemo(
    () => listLocations({ category, origin: coordinates }),
    [category, coordinates]
  );

  const updateParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Deep link from search or the assistant: open that location's detail.
  useEffect(() => {
    if (!requestedLocationId) {
      return;
    }

    const match = locations.find((location) => location.id === requestedLocationId);

    if (match) {
      setSelectedLocation(match);
    }
  }, [locations, requestedLocationId]);

  useEffect(() => {
    if (pendingLocationDetail) {
      const match = locations.find((location) => location.id === pendingLocationDetail.id);
      setSelectedLocation(match || null);
      clearPendingLocationDetail();
    }
  }, [clearPendingLocationDetail, locations, pendingLocationDetail]);

  const handleMapError = useCallback(() => setLiveMapFailed(true), []);

  const handleUseLocation = async () => {
    const result = await requestLocation();

    if (result.coordinates) {
      if (hasMapTilerKey && !liveMapFailed) {
        setLocateRequest((current) => current + 1);
      }

      showNotice("Showing the nearest locations from where you are.", "success");
      return;
    }

    // Denied or unavailable: never a dead end, offer the manual route instead.
    setAreaPickerOpen(true);
  };

  const handleDirections = (location) => {
    window.open(buildDirectionsUrl(location), "_blank", "noopener,noreferrer");
  };

  const handleCall = (location) => {
    if (!location.phone) {
      showNotice("No phone number is listed for this sample record.");
      return;
    }

    window.location.href = buildCallHref(location.phone);
  };

  const showLiveMap = hasMapTilerKey && !liveMapFailed;
  const locationDenied = status === GEO_STATUS.DENIED || status === GEO_STATUS.UNAVAILABLE || status === GEO_STATUS.ERROR;

  return (
    <section className="orange-page-section" aria-labelledby="find-title">
      <div className="orange-page-intro">
        <p className="orange-eyebrow">Around you</p>
        <h1 id="find-title">Find Orange</h1>
        <p>Agents, shops, Orange Money points and support centres.</p>
      </div>

      <div className="omasta-find-toolbar">
        <div className="orange-location-status">
          <MapPinned size={18} />
          <span>{coordinates ? originLabel : "Freetown area"}</span>
        </div>

        <div className="omasta-find-toolbar-actions">
          <button type="button" className="omasta-toolbar-button" onClick={handleUseLocation} disabled={isLocating}>
            <Locate size={15} />
            {isLocating ? "Locating..." : "Use my location"}
          </button>
          <button type="button" className="omasta-toolbar-button" onClick={() => setAreaPickerOpen((open) => !open)}>
            Choose area
          </button>
        </div>
      </div>

      {locationDenied && locationMessage ? (
        <div className="omasta-location-warning" role="status">
          <TriangleAlert size={17} />
          <div>
            <strong>Location is not available</strong>
            <p>{locationMessage} Everything below still works, distances just need a reference point.</p>
          </div>
        </div>
      ) : null}

      {areaPickerOpen ? (
        <div className="omasta-area-picker">
          <p className="orange-result-label">Search around</p>
          <div className="omasta-chips">
            {areas.map((area) => (
              <button
                type="button"
                key={area.id}
                onClick={() => {
                  setManualArea(area.id);
                  setAreaPickerOpen(false);
                  showNotice(`Showing locations around ${area.label}.`, "success");
                }}
              >
                {area.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="omasta-find-controls">
        <FilterChips
          options={LOCATION_CATEGORIES}
          value={category}
          onChange={(value) => updateParams({ category: value === "all" ? null : value })}
          label="Filter Orange locations"
        />

        <div className="omasta-view-toggle" role="group" aria-label="Switch between map and list">
          <button
            type="button"
            className={view === "map" ? "is-active" : ""}
            aria-pressed={view === "map"}
            onClick={() => updateParams({ view: "map" })}
          >
            <MapIcon size={15} />
            Map
          </button>
          <button
            type="button"
            className={view === "list" ? "is-active" : ""}
            aria-pressed={view === "list"}
            onClick={() => updateParams({ view: "list" })}
          >
            <List size={15} />
            List
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className="orange-find-map-shell">
          {showLiveMap ? (
            <OrangeMap
              locations={locations}
              locateRequest={locateRequest}
              userCoordinates={coordinates}
              focusCoordinates={selectedLocation?.coordinates || null}
              onLocationClick={setSelectedLocation}
              onMapError={handleMapError}
            />
          ) : (
            <>
              <FallbackMap locations={locations} onSelect={setSelectedLocation} />
              <p className="omasta-map-note">
                {hasMapTilerKey
                  ? "The live map could not load, so this is the illustrated view. The list below is unaffected."
                  : "Set VITE_MAPTILER_KEY to load the live map. This illustrated view keeps Find usable meanwhile."}
              </p>
            </>
          )}

          <div className="orange-map-legend">
            <span>
              <i className="orange-map-legend-dot orange-map-legend-dot--shop" /> Shop
            </span>
            <span>
              <i className="orange-map-legend-dot orange-map-legend-dot--money" /> Orange Money
            </span>
            <span>
              <i className="orange-map-legend-dot orange-map-legend-dot--agent" /> Agent
            </span>
            <span>
              <i className="orange-map-legend-dot orange-map-legend-dot--support" /> Support
            </span>
          </div>
        </div>
      ) : null}

      <div className="omasta-location-list">
        {locations.length ? (
          locations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onDirections={handleDirections}
              onDetails={setSelectedLocation}
              onCall={handleCall}
            />
          ))
        ) : (
          <div className="orange-search-empty">
            <MapPinned size={21} />
            <p>Nothing listed in this category yet</p>
            <span>The sample directory does not cover it. Try another filter.</span>
          </div>
        )}
      </div>

      <DemoNote>
        These are sample locations used for development, not verified Orange sites. A real agent and shop directory is
        needed before any of this can be trusted.
      </DemoNote>

      <button
        type="button"
        className="omasta-ask-ai-button omasta-ask-ai-button--block"
        onClick={() => openAssistant()}
      >
        <Sparkles size={15} />
        Ask OMASTA AI to find a location
      </button>

      <LocationDetailSheet
        location={selectedLocation}
        open={Boolean(selectedLocation)}
        onClose={() => {
          setSelectedLocation(null);
          updateParams({ location: null });
        }}
        onDirections={handleDirections}
        onCall={handleCall}
        onAskAssistant={(location) => {
          setSelectedLocation(null);
          openAssistant({ prompt: `Tell me about ${location.name}` });
        }}
      />
    </section>
  );
}
