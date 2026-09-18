import { ArrowUpRight, Clock3, LifeBuoy, MapPin, Phone, Route, Store, Users, Wallet } from "lucide-react";

import DemoBadge from "../common/DemoBadge.jsx";

const CATEGORY_ICON = {
  agent: MapPin,
  shop: Store,
  money: Wallet,
  support: LifeBuoy,
};

/**
 * A single Orange location, used in the Find list and in search results.
 *
 * With `onSelect`, the whole card (name and address) is one tap target that
 * opens the location on the map with its route; the action buttons stay
 * separately clickable above it.
 */
export default function LocationCard({ location, onDirections, onDetails, onCall, onSelect, compact = false }) {
  const Icon = CATEGORY_ICON[location.category] || MapPin;
  const { openState } = location;

  return (
    <article className={`omasta-location-card ${compact ? "is-compact" : ""} ${onSelect ? "is-selectable" : ""}`}>
      <div className="omasta-location-card-head">
        <span className={`omasta-location-icon omasta-location-icon--${location.category}`}>
          <Icon size={19} />
        </span>
        <div className="omasta-location-card-title">
          <p>{location.type}</p>
          <h3>
            {onSelect ? (
              <button
                type="button"
                className="omasta-location-select"
                onClick={() => onSelect(location)}
                aria-label={`Show ${location.name} on the map with a route`}
              >
                {location.name}
              </button>
            ) : (
              location.name
            )}
          </h3>
          <div className="omasta-location-meta">
            {location.distanceLabel ? <span className="omasta-location-distance">{location.distanceLabel}</span> : null}
            {openState ? (
              <span className={`omasta-location-state omasta-location-state--${openState.state}`}>
                <Clock3 size={13} />
                {openState.label}
              </span>
            ) : null}
          </div>
        </div>
        {location.isDemo ? <DemoBadge /> : null}
        {location.isCommunity ? (
          <span className="omasta-community-badge" title="Added by a customer, approved by an Orange admin">
            <Users size={12} />
            Community
          </span>
        ) : null}
      </div>

      <p className="omasta-location-address">{location.address}</p>

      {location.services?.length && !compact ? (
        <ul className="omasta-location-services">
          {location.services.slice(0, 4).map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      ) : null}

      <div className="omasta-location-actions">
        <button
          type="button"
          className="orange-button orange-button--solid"
          onClick={() => onDirections?.(location)}
        >
          <Route size={15} />
          Route
        </button>
        <button
          type="button"
          className="orange-button orange-button--outline"
          onClick={() => onCall?.(location)}
          disabled={!location.phone}
          title={location.phone ? `Call ${location.name}` : "No number listed for this location"}
        >
          <Phone size={15} />
          Call
        </button>
        <button type="button" className="omasta-location-details" onClick={() => onDetails?.(location)}>
          View details
          <ArrowUpRight size={15} />
        </button>
      </div>
    </article>
  );
}
