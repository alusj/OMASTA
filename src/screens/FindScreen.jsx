import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowDownUp, Locate, MapPinned, Plus, Sparkles } from "lucide-react";

import OrangeMap from "../components/OrangeHome/OrangeMap.jsx";
import FallbackMap from "../components/find/FallbackMap.jsx";
import LocationCard from "../components/find/LocationCard.jsx";
import LocationDetailSheet from "../components/find/LocationDetailSheet.jsx";
import FindViewToggle from "../components/find/FindViewToggle.jsx";
import MapCategoryBar from "../components/find/MapCategoryBar.jsx";
import RouteCard from "../components/find/RouteCard.jsx";
import PinDropOverlay from "../components/find/PinDropOverlay.jsx";
import AddLocationSheet from "../components/find/AddLocationSheet.jsx";
import MySubmissionsList from "../components/find/MySubmissionsList.jsx";
import FilterChips from "../components/common/FilterChips.jsx";
import { DemoNote } from "../components/common/DemoBadge.jsx";
import { hasMapTilerKey } from "../config/env.js";
import {
  DEFAULT_MAP_CENTER,
  GEO_STATUS,
  LOCATION_CATEGORIES,
  getCategoryLabel,
  listLocations,
  normalizeCategory,
} from "../services/locations/locationService.js";
import { getRoute } from "../services/locations/routingService.js";
import { formatCoordinates, reverseGeocode } from "../services/locations/geocodingService.js";
import {
  EMPTY_SUBMISSION_DRAFT,
  listApprovedCommunityLocations,
  listMySubmissions,
  removeMySubmission,
} from "../services/locations/submissionService.js";
import { buildCallHref } from "../services/support/supportService.js";
import { useAppUi } from "../context/AppUiProvider.jsx";
import { useAssistant } from "../context/AssistantProvider.jsx";
import { useLocationContext } from "../context/LocationProvider.jsx";
import { useAssistantScreenContext } from "../hooks/useAssistantScreenContext.js";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { useServiceResource } from "../hooks/useServiceResource.js";

const NO_LOCATIONS = [];

const SORT_OPTIONS = [
  { id: "nearest", label: "Nearest first" },
  { id: "name", label: "Name (A to Z)" },
  { id: "open", label: "Open now first" },
  { id: "type", label: "Type" },
];

/** `?preview=lng,lat&previewName=...` shows a temporary marker (admin review). */
function parsePreview(value, name) {
  if (!value) {
    return null;
  }

  const [lng, lat] = value.split(",").map(Number);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return { coordinates: [lng, lat], label: name || "Submission" };
}

function sortLocations(locations, sort) {
  const list = [...locations];

  switch (sort) {
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "open":
      return list.sort((a, b) => Number(b.openState?.state === "open") - Number(a.openState?.state === "open"));
    case "type":
      return list.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
    default:
      // listLocations already returns nearest first when a reference point is known.
      return list;
  }
}

/**
 * Find Orange.
 *
 * Map view: a full-screen map with floating category buttons. Choosing one
 * flies to the nearest match and draws a route from the customer. List view:
 * the same places as cards, sortable, each opening its route on the map.
 * "Add" lets customers suggest places, which appear only after admin approval.
 * State lives in the URL (view, category, location) so Home, search and the
 * assistant can deep link into any of it.
 */
export default function FindScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showNotice } = useAppUi();
  const { openAssistant, pendingLocationDetail, clearPendingLocationDetail } = useAssistant();
  const {
    coordinates,
    status,
    label: originLabel,
    areas,
    isLocating,
    requestLocation,
    setManualArea,
  } = useLocationContext();

  const category = normalizeCategory(searchParams.get("category"));
  const view = searchParams.get("view") === "list" ? "list" : "map";
  const requestedLocationId = searchParams.get("location");
  const wantsRoute = searchParams.get("route") === "1";
  const previewParam = searchParams.get("preview");
  const previewName = searchParams.get("previewName");
  const isNarrow = useMediaQuery("(max-width: 719px)");

  useAssistantScreenContext({ screen: "find", focus: { category } }, [category]);

  const community = useServiceResource(listApprovedCommunityLocations);
  const extra = community.data || NO_LOCATIONS;

  const locations = useMemo(
    () => listLocations({ category, origin: coordinates, extra }),
    [category, coordinates, extra]
  );
  const allLocations = useMemo(() => listLocations({ origin: coordinates, extra }), [coordinates, extra]);

  const [selectedId, setSelectedId] = useState(requestedLocationId);
  const [selectionNonce, setSelectionNonce] = useState(0);
  const selectedIdRef = useRef(requestedLocationId);
  const selected = useMemo(
    () => allLocations.find((location) => location.id === selectedId) || null,
    [allLocations, selectedId]
  );

  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [camera, setCamera] = useState(null);
  const [detailLocation, setDetailLocation] = useState(null);
  const [liveMapFailed, setLiveMapFailed] = useState(false);
  const [busyCategory, setBusyCategory] = useState(null);
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const [sort, setSort] = useState("nearest");

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_SUBMISSION_DRAFT);
  const [locatingDraft, setLocatingDraft] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [locateError, setLocateError] = useState("");
  const [pinMode, setPinMode] = useState(false);
  const [pinCenter, setPinCenter] = useState(null);
  const [mapApiVersion, setMapApiVersion] = useState(0);
  const mapApiRef = useRef(null);
  const pinFrameRef = useRef(0);
  const bottomPanelRef = useRef(null);

  const approvedIdsKey = extra.map((location) => location.id).join(",");
  const [mySubmissions, setMySubmissions] = useState(() => listMySubmissions());

  useEffect(() => {
    setMySubmissions(listMySubmissions(new Set(approvedIdsKey ? approvedIdsKey.split(",") : [])));
  }, [approvedIdsKey]);

  const showLiveMap = hasMapTilerKey && !liveMapFailed;
  const locationBlocked = status === GEO_STATUS.DENIED || status === GEO_STATUS.UNAVAILABLE;
  const originKey = coordinates ? coordinates.join(",") : "";

  /**
   * URL updates build on the live URL, not this render's params, so two updates
   * in one tap (category, then the selected location) never overwrite each other.
   */
  const updateParams = useCallback(
    (changes) => {
      const next = new URLSearchParams(window.location.search);

      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });

      setSearchParams(next, { replace: true });
    },
    [setSearchParams]
  );

  const setView = (nextView) => {
    setAreaPickerOpen(false);
    updateParams({ view: nextView === "list" ? "list" : null });
  };

  /* ---------------- Selection, route and camera ---------------- */

  const selectLocation = useCallback(
    (location) => {
      selectedIdRef.current = location.id;
      setSelectedId(location.id);
      setSelectionNonce((current) => current + 1);
      updateParams({ location: location.id, route: null, view: null });
    },
    [updateParams]
  );

  const clearSelection = () => {
    selectedIdRef.current = null;
    setSelectedId(null);
    setRoute(null);
    updateParams({ location: null, route: null });
  };

  /** Selecting from the list or a "Route" button means the customer wants a route. */
  const routeTo = async (location) => {
    setDetailLocation(null);
    selectLocation(location);

    if (!coordinates && !locationBlocked) {
      const result = await requestLocation();

      if (!result.coordinates) {
        showNotice(result.message);
      }
    }
  };

  // Deep links (?location=...&route=1) from Home, search or the assistant.
  useEffect(() => {
    if (!requestedLocationId || requestedLocationId === selectedIdRef.current) {
      return;
    }

    selectedIdRef.current = requestedLocationId;
    setSelectedId(requestedLocationId);
    setSelectionNonce((current) => current + 1);

    if (wantsRoute && !coordinates && !locationBlocked) {
      requestLocation();
    }
    // Only a new requested id should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedLocationId]);

  // The assistant's "Details" action.
  useEffect(() => {
    if (!pendingLocationDetail) {
      return;
    }

    const match = allLocations.find((location) => location.id === pendingLocationDetail.id);

    if (match) {
      if (selectedIdRef.current !== match.id) {
        selectLocation(match);
      }
      setDetailLocation(match);
    }

    clearPendingLocationDetail();
  }, [allLocations, clearPendingLocationDetail, pendingLocationDetail, selectLocation]);

  // Route + camera whenever the selection or the customer's position changes.
  useEffect(() => {
    if (!selected) {
      setRoute(null);
      setRouteLoading(false);
      return undefined;
    }

    const destination = selected.coordinates;

    if (!coordinates) {
      setRoute(null);
      setRouteLoading(false);
      setCamera({ key: `fly-${selected.id}-${selectionNonce}`, type: "fly", center: destination, zoom: 15.5 });
      return undefined;
    }

    const controller = new AbortController();
    setRoute(null);
    setRouteLoading(true);

    getRoute(coordinates, destination, { signal: controller.signal })
      .then((result) => {
        setRoute(result);
        setCamera({
          key: `fit-${selected.id}-${selectionNonce}-${originKey}`,
          type: "fit",
          points: result.coordinates.length > 1 ? result.coordinates : [coordinates, destination],
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      });

    return () => controller.abort();
    // `selected` and `coordinates` are represented by their id / key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, originKey, selectionNonce]);

  // Admin preview of a pending submission.
  const previewMarker = useMemo(() => parsePreview(previewParam, previewName), [previewParam, previewName]);

  useEffect(() => {
    if (previewMarker) {
      setCamera({ key: `preview-${previewParam}`, type: "fly", center: previewMarker.coordinates, zoom: 16 });
    }
  }, [previewMarker, previewParam]);

  /** Floating category buttons: filter, then fly to the nearest match with a route. */
  const handleCategory = async (nextCategory) => {
    updateParams({ category: nextCategory === "all" ? null : nextCategory });
    setAreaPickerOpen(false);

    let origin = coordinates;

    if (!origin && !locationBlocked) {
      setBusyCategory(nextCategory);
      const result = await requestLocation();
      setBusyCategory(null);
      origin = result.coordinates || null;

      if (!origin) {
        showNotice(`${result.message} Showing the closest to the map centre.`);
      }
    }

    const reference = origin || mapApiRef.current?.getCenter() || DEFAULT_MAP_CENTER;
    const [nearest] = listLocations({ category: nextCategory, origin: reference, extra, limit: 1 });

    if (!nearest) {
      showNotice(`No ${getCategoryLabel(nextCategory)} are listed yet.`);
      clearSelection();
      return;
    }

    selectLocation(nearest);
  };

  const handleUseLocation = async () => {
    const result = await requestLocation();

    if (!result.coordinates) {
      showNotice(result.message);
      setAreaPickerOpen(true);
    }
  };

  const handleCall = (location) => {
    if (!location.phone) {
      showNotice("No phone number is listed for this location.");
      return;
    }

    window.location.href = buildCallHref(location.phone);
  };

  const handleMapError = useCallback(() => setLiveMapFailed(true), []);

  const handleMapReady = useCallback((api) => {
    mapApiRef.current = api;
    setMapApiVersion((current) => current + 1);
  }, []);

  /* ---------------- Add location ---------------- */

  const resolveAddress = async (point) => {
    setResolvingAddress(true);
    const address = await reverseGeocode(point);
    setResolvingAddress(false);
    setDraft((current) => ({ ...current, address: address || `Pinned point near ${formatCoordinates(point)}` }));
  };

  const handleDraftLocateMe = async () => {
    setLocateError("");
    setLocatingDraft(true);
    const result = await requestLocation();
    setLocatingDraft(false);

    if (!result.coordinates) {
      setLocateError(`${result.message} Use Drop a pin instead.`);
      return;
    }

    setDraft((current) => ({
      ...current,
      coordinates: result.coordinates,
      locationSource: "device",
      accuracy: result.accuracy ?? null,
    }));
    resolveAddress(result.coordinates);
  };

  const startDropPin = () => {
    setLocateError("");
    setAddOpen(false);
    setPinMode(true);
    setPinCenter(null);
    setDetailLocation(null);
    updateParams({ view: null });
  };

  // Entering pin mode (or the map remounting from list view): start the pin
  // on the captured point, the customer, or wherever the map already is.
  useEffect(() => {
    const api = mapApiRef.current;

    if (!pinMode || !api) {
      return;
    }

    const start = draft.coordinates || coordinates;

    if (start) {
      api.flyTo(start, 17);
    }

    setPinCenter(api.getCenter());
    // Runs when pin mode starts or a new map is ready, not on every draft edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinMode, mapApiVersion]);

  const handlePinMove = useCallback((center) => {
    cancelAnimationFrame(pinFrameRef.current);
    pinFrameRef.current = requestAnimationFrame(() => setPinCenter(center));
  }, []);

  const confirmPin = () => {
    const point = mapApiRef.current?.getCenter() || pinCenter;

    if (!point) {
      return;
    }

    setPinMode(false);
    setDraft((current) => ({ ...current, coordinates: point, locationSource: "pin", accuracy: null }));
    setAddOpen(true);
    resolveAddress(point);
  };

  const cancelPin = () => {
    setPinMode(false);
    setAddOpen(true);
  };

  const closeAdd = useCallback((submitted) => {
    setAddOpen(false);

    if (submitted) {
      setDraft(EMPTY_SUBMISSION_DRAFT);
      setLocateError("");
    }
  }, []);

  const patchDraft = useCallback((patch) => setDraft((current) => ({ ...current, ...patch })), []);

  const refreshMySubmissions = useCallback(() => {
    setMySubmissions(listMySubmissions(new Set(approvedIdsKey ? approvedIdsKey.split(",") : [])));
  }, [approvedIdsKey]);

  /* ---------------- Map chrome ---------------- */

  // The map fills the screen: stop the page behind it from scrolling.
  useEffect(() => {
    if (view !== "map") {
      return undefined;
    }

    document.body.classList.add("omasta-map-mode");
    return () => document.body.classList.remove("omasta-map-mode");
  }, [view]);

  // On phones the route card / pin panel spans the width, so lift the floating
  // OMASTA AI button above it instead of letting the two overlap.
  const bottomPanelKey = view === "map" ? (pinMode ? "pin" : selected?.id || "") : "";

  useEffect(() => {
    const root = document.documentElement;
    const element = bottomPanelRef.current;

    if (!bottomPanelKey || !isNarrow || !element) {
      root.style.removeProperty("--omasta-fab-lift");
      return undefined;
    }

    const update = () => root.style.setProperty("--omasta-fab-lift", `${element.offsetHeight + 12}px`);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--omasta-fab-lift");
    };
  }, [bottomPanelKey, isNarrow]);

  const mapPadding = useMemo(
    () =>
      isNarrow
        ? { top: 190, bottom: selected ? 330 : 140, left: 40, right: 64 }
        : { top: 180, bottom: 140, left: selected ? 440 : 80, right: 90 },
    [isNarrow, selected]
  );

  const sortedLocations = useMemo(() => sortLocations(locations, sort), [locations, sort]);

  const areaPicker = areaPickerOpen ? (
    <div className="omasta-area-picker omasta-find-areas">
      <p className="orange-result-label">Search around</p>
      <div className="omasta-chips">
        {areas.map((area) => (
          <button
            type="button"
            key={area.id}
            onClick={() => {
              setManualArea(area.id);
              setAreaPickerOpen(false);
              showNotice(`Showing distances from ${area.label}.`, "success");
            }}
          >
            {area.label}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const sheets = (
    <>
      <LocationDetailSheet
        location={detailLocation}
        open={Boolean(detailLocation)}
        onClose={() => setDetailLocation(null)}
        onDirections={routeTo}
        onCall={handleCall}
        onAskAssistant={(location) => {
          setDetailLocation(null);
          openAssistant({ prompt: `Tell me about ${location.name}` });
        }}
      />

      <AddLocationSheet
        open={addOpen}
        draft={draft}
        onDraftChange={patchDraft}
        onClose={closeAdd}
        onLocateMe={handleDraftLocateMe}
        onDropPin={startDropPin}
        locating={locatingDraft}
        resolvingAddress={resolvingAddress}
        locateError={locateError}
        canDropPin={showLiveMap}
        near={coordinates}
        onSubmitted={refreshMySubmissions}
      />
    </>
  );

  /* ---------------- Map view ---------------- */

  if (view === "map") {
    return (
      <section className="omasta-find omasta-find--map" aria-labelledby="find-title">
        <h1 id="find-title" className="omasta-visually-hidden">
          Find Orange
        </h1>

        <div className={`omasta-find-stage ${pinMode ? "is-pinning" : ""}`}>
          {showLiveMap ? (
            <OrangeMap
              className="orange-map-live--fullscreen"
              locations={locations}
              userCoordinates={coordinates}
              selectedLocationId={selected?.id || null}
              route={route}
              camera={camera}
              padding={mapPadding}
              previewMarker={previewMarker}
              onLocationClick={selectLocation}
              onMapError={handleMapError}
              onReady={handleMapReady}
              onCenterChange={pinMode ? handlePinMove : undefined}
            />
          ) : (
            <div className="omasta-find-fallback">
              <FallbackMap locations={locations} onSelect={selectLocation} />
              <p className="omasta-map-note">
                {hasMapTilerKey
                  ? "The live map could not load, so this is the illustrated view."
                  : "Set VITE_MAPTILER_KEY to load the live map."}
              </p>
            </div>
          )}

          {!pinMode ? (
            <div className="omasta-find-overlay-top">
              <FindViewToggle view={view} onChange={setView} floating />
              <MapCategoryBar
                categories={LOCATION_CATEGORIES}
                value={category}
                busyId={busyCategory}
                onSelect={handleCategory}
                onAdd={() => setAddOpen(true)}
              />
              {areaPicker}
              {!selected ? <p className="omasta-map-sample-note">Sample locations · not verified Orange sites</p> : null}
            </div>
          ) : null}

          {pinMode ? (
            <PinDropOverlay ref={bottomPanelRef} center={pinCenter} onCancel={cancelPin} onConfirm={confirmPin} />
          ) : selected ? (
            <RouteCard
              ref={bottomPanelRef}
              location={selected}
              route={route}
              routeLoading={routeLoading}
              hasOrigin={Boolean(coordinates)}
              isLocating={isLocating}
              onUseLocation={handleUseLocation}
              onClose={clearSelection}
              onDetails={() => setDetailLocation(selected)}
              onCall={() => handleCall(selected)}
              onAsk={() => openAssistant({ prompt: `Tell me about ${selected.name}` })}
            />
          ) : null}
        </div>

        {sheets}
      </section>
    );
  }

  /* ---------------- List view ---------------- */

  return (
    <section className="orange-page-section omasta-find omasta-find--list" aria-labelledby="find-title">
      <div className="omasta-find-list-head">
        <div className="orange-page-intro">
          <p className="orange-eyebrow">Around you</p>
          <h1 id="find-title">Find Orange</h1>
        </div>
        <FindViewToggle view={view} onChange={setView} />
      </div>

      <div className="omasta-find-list-toolbar">
        <button type="button" className="orange-button orange-button--solid" onClick={() => setAddOpen(true)}>
          <Plus size={16} />
          Add location
        </button>
        <label className="omasta-sort">
          <ArrowDownUp size={15} aria-hidden="true" />
          <span className="omasta-visually-hidden">Sort locations</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="omasta-find-origin">
        <MapPinned size={16} aria-hidden="true" />
        <span>{coordinates
            ? `Distances from ${originLabel === "Your current location" ? "your current location" : originLabel}`
            : "Share your location to see the nearest first"}</span>
        <button type="button" onClick={handleUseLocation} disabled={isLocating}>
          <Locate size={14} />
          {isLocating ? "Locating..." : "Use my location"}
        </button>
        <button type="button" onClick={() => setAreaPickerOpen((open) => !open)}>
          Choose area
        </button>
      </div>

      {areaPicker}

      <FilterChips
        options={LOCATION_CATEGORIES}
        value={category}
        onChange={(value) => updateParams({ category: value === "all" ? null : value })}
        label="Filter Orange locations"
      />

      <MySubmissionsList
        items={mySubmissions}
        onRemove={(id) => {
          removeMySubmission(id);
          refreshMySubmissions();
        }}
      />

      <div className="omasta-location-list">
        {sortedLocations.length ? (
          sortedLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onSelect={routeTo}
              onDirections={routeTo}
              onDetails={setDetailLocation}
              onCall={handleCall}
            />
          ))
        ) : (
          <div className="orange-search-empty">
            <MapPinned size={21} />
            <p>Nothing listed in this category yet</p>
            <span>Know one? Use Add location to suggest it.</span>
          </div>
        )}
      </div>

      <DemoNote>
        Locations marked Demo are sample records for development, not verified Orange sites. Community locations were
        suggested by customers and approved by an Orange admin.
      </DemoNote>

      <button
        type="button"
        className="omasta-ask-ai-button omasta-ask-ai-button--block"
        onClick={() => openAssistant()}
      >
        <Sparkles size={15} />
        Ask OMASTA AI to find a location
      </button>

      {sheets}
    </section>
  );
}
