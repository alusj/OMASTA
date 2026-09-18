import { forwardRef } from "react";
import { Check, MapPin, X } from "lucide-react";

import { formatCoordinates } from "../../services/locations/geocodingService.js";

/**
 * "Drop a pin" mode: a fixed pin in the middle of the map; the customer moves
 * the map underneath it, then confirms. The point under the pin tip is what
 * gets captured.
 */
const PinDropOverlay = forwardRef(function PinDropOverlay({ center, onCancel, onConfirm }, ref) {
  return (
    <>
      <div className="omasta-pin-target" aria-hidden="true">
        <MapPin size={40} strokeWidth={2.2} />
        <span className="omasta-pin-shadow" />
      </div>

      <div className="omasta-pin-hint" role="status">
        Move the map so the pin sits exactly on the place
      </div>

      <div className="omasta-pin-panel" ref={ref}>
        <p>
          <span>Pinned location</span>
          <strong>{center ? formatCoordinates(center) : "Move the map to place the pin"}</strong>
        </p>
        <div className="omasta-pin-actions">
          <button type="button" className="orange-button orange-button--outline" onClick={onCancel}>
            <X size={15} />
            Cancel
          </button>
          <button type="button" className="orange-button orange-button--solid" onClick={onConfirm} disabled={!center}>
            <Check size={15} />
            Use this location
          </button>
        </div>
      </div>
    </>
  );
});

export default PinDropOverlay;
