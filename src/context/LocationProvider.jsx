/* eslint-disable react-refresh/only-export-components -- the provider and its hook are one API; splitting them would fragment the context. */
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { GEO_STATUS, requestDeviceLocation } from "../services/locations/locationService.js";
import { MANUAL_AREAS } from "../data/locations.js";

/**
 * Holds the customer's reference point for distance sorting.
 *
 * Device location is optional by design: when it is denied or unavailable the
 * customer can pick an area instead, and every distance-aware surface keeps
 * working from that manual point.
 */

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [coordinates, setCoordinates] = useState(null);
  const [status, setStatus] = useState(GEO_STATUS.IDLE);
  const [source, setSource] = useState(null);
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState("");

  const requestLocation = useCallback(async () => {
    setStatus(GEO_STATUS.PROMPTING);
    setMessage("");

    const result = await requestDeviceLocation();

    setStatus(result.status);
    setMessage(result.message);

    if (result.coordinates) {
      setCoordinates(result.coordinates);
      setSource("device");
      setLabel("Your current location");
    }

    return result;
  }, []);

  const setManualArea = useCallback((areaId) => {
    const area = MANUAL_AREAS.find((item) => item.id === areaId);

    if (!area) {
      return null;
    }

    setCoordinates(area.coordinates);
    setSource("manual");
    setLabel(area.label);
    setMessage("");
    setStatus(GEO_STATUS.GRANTED);

    return area;
  }, []);

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setSource(null);
    setLabel("");
    setStatus(GEO_STATUS.IDLE);
    setMessage("");
  }, []);

  const value = useMemo(
    () => ({
      coordinates,
      status,
      source,
      label,
      message,
      areas: MANUAL_AREAS,
      hasLocation: Boolean(coordinates),
      isLocating: status === GEO_STATUS.PROMPTING,
      requestLocation,
      setManualArea,
      clearLocation,
    }),
    [clearLocation, coordinates, label, message, requestLocation, setManualArea, source, status]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationContext() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error("useLocationContext must be used inside LocationProvider");
  }

  return context;
}
