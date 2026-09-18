import { useMemo } from "react";
import { ChevronRight, Locate, MapPin, Navigation, Store, Wallet } from "lucide-react";

import { buildDirectionsUrl, listLocations } from "../../services/locations/locationService.js";

const SHORTCUTS = [
  { id: "agent", label: "Agent", icon: MapPin },
  { id: "shop", label: "Shop", icon: Store },
  { id: "money", label: "Money point", icon: Wallet },
];

/**
 * A compact doorway into Find, not a second map. The shortcuts deep link into
 * the Find screen with a category selected; the nearest-location row only
 * appears once the customer has shared a location or picked an area.
 */
export default function AroundYouPreview({ coordinates, isLocating, onOpenCategory, onRequestLocation }) {
  const nearest = useMemo(
    () => (coordinates ? listLocations({ category: "all", origin: coordinates, limit: 1 })[0] || null : null),
    [coordinates]
  );

  return (
    <div className="omasta-around">
      <div className="omasta-around-shortcuts">
        {SHORTCUTS.map((shortcut) => {
          const Icon = shortcut.icon;

          return (
            <button type="button" key={shortcut.id} onClick={() => onOpenCategory(shortcut.id)}>
              <span className="omasta-around-icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              {shortcut.label}
            </button>
          );
        })}
      </div>

      {nearest ? (
        <div className="omasta-around-nearest">
          <span className="omasta-around-nearest-icon" aria-hidden="true">
            <Navigation size={16} />
          </span>
          <div className="omasta-around-nearest-copy">
            <small>Nearest Orange location · sample directory</small>
            <strong>{nearest.name}</strong>
            <span>{nearest.distanceLabel}</span>
          </div>
          <a
            className="omasta-around-directions"
            href={buildDirectionsUrl(nearest)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Directions
            <ChevronRight size={15} />
          </a>
        </div>
      ) : (
        <button type="button" className="omasta-around-locate" onClick={onRequestLocation} disabled={isLocating}>
          <Locate size={16} aria-hidden="true" />
          <span>{isLocating ? "Finding your location..." : "Show the nearest Orange location"}</span>
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
