import { ArrowUpRight, Clock3, MapPin, Navigation, Phone, Store, Wallet, LifeBuoy } from "lucide-react";

import DemoBadge from "../common/DemoBadge.jsx";

const CATEGORY_ICON = {
  agent: MapPin,
  shop: Store,
  money: Wallet,
  support: LifeBuoy,
};

/** A single Orange location, used in the Find list and in search results. */
export default function LocationCard({ location, onDirections, onDetails, onCall, compact = false }) {
  const Icon = CATEGORY_ICON[location.category] || MapPin;
  const { openState } = location;

  return (
    <article className={`omasta-location-card ${compact ? "is-compact" : ""}`}>
      <div className="omasta-location-card-head">
        <span className={`omasta-location-icon omasta-location-icon--${location.category}`}>
          <Icon size={19} />
        </span>
        <div className="omasta-location-card-title">
          <p>{location.type}</p>
          <h3>{location.name}</h3>
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
          <Navigation size={15} />
          Directions
        </button>
        <button
          type="button"
          className="orange-button orange-button--outline"
          onClick={() => onCall?.(location)}
          disabled={!location.phone}
          title={location.phone ? `Call ${location.name}` : "No number listed for this sample record"}
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
