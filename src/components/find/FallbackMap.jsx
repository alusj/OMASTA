import { LifeBuoy, MapPin, Store, Wallet } from "lucide-react";

const CATEGORY_ICON = {
  agent: MapPin,
  shop: Store,
  money: Wallet,
  support: LifeBuoy,
};

const CATEGORY_LABEL = {
  agent: "Agent",
  shop: "Orange shop",
  money: "Money point",
  support: "Support",
};

/**
 * Illustrated stand-in for the live map.
 *
 * Kept from the original build so Find still works when no MapTiler key is
 * configured or the tile request fails. It is decorative, not geographic.
 */
export default function FallbackMap({ locations, onSelect }) {
  return (
    <div className="orange-map" role="img" aria-label="Illustrated placeholder map of Orange locations">
      <span className="orange-map-water orange-map-water--one" />
      <span className="orange-map-water orange-map-water--two" />
      <span className="orange-map-road orange-map-road--one" />
      <span className="orange-map-road orange-map-road--two" />
      <span className="orange-map-road orange-map-road--three" />
      <span className="orange-map-label orange-map-label--freetown">Freetown</span>
      <span className="orange-map-label orange-map-label--water">Atlantic Ocean</span>

      {locations.map((location) => {
        const Icon = CATEGORY_ICON[location.category] || MapPin;

        return (
          <button
            type="button"
            className={`orange-map-marker orange-map-marker--${location.category}`}
            key={location.id}
            style={{ left: `${location.mapPosition.x}%`, top: `${location.mapPosition.y}%` }}
            onClick={() => onSelect(location)}
            aria-label={`Select ${location.type}: ${location.name}`}
          >
            <span>
              <Icon size={16} />
            </span>
            <small>{CATEGORY_LABEL[location.category] || "Orange"}</small>
          </button>
        );
      })}

      <span className="orange-map-user-location" aria-hidden="true">
        <span />
      </span>
    </div>
  );
}
