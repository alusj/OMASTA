import { forwardRef } from "react";
import { Car, Info, LifeBuoy, Loader2, Locate, MapPin, Phone, Sparkles, Store, Users, Wallet, X } from "lucide-react";

import DemoBadge from "../common/DemoBadge.jsx";
import { RouteKind, formatRouteDistance, formatRouteDuration } from "../../services/locations/routingService.js";

const CATEGORY_ICON = {
  agent: MapPin,
  shop: Store,
  money: Wallet,
  support: LifeBuoy,
};

/**
 * The floating card for the selected location on the full-screen map:
 * what it is, the route summary, and the next actions.
 */
const RouteCard = forwardRef(function RouteCard(
  { location, route, routeLoading, hasOrigin, isLocating, onUseLocation, onClose, onDetails, onCall, onAsk },
  ref
) {
  const Icon = CATEGORY_ICON[location.category] || MapPin;

  const renderRoute = () => {
    if (!hasOrigin) {
      return (
        <button type="button" className="omasta-route-locate" onClick={onUseLocation} disabled={isLocating}>
          {isLocating ? <Loader2 size={15} className="omasta-spin" /> : <Locate size={15} />}
          {isLocating ? "Finding your location..." : "Use my location to see the route"}
        </button>
      );
    }

    if (routeLoading || !route) {
      return (
        <p className="omasta-route-summary is-loading">
          <Loader2 size={15} className="omasta-spin" />
          Finding the best route...
        </p>
      );
    }

    if (route.kind === RouteKind.STRAIGHT) {
      return (
        <p className="omasta-route-summary is-straight">
          <Info size={15} />
          <span>
            <strong>{formatRouteDistance(route.distanceMeters)}</strong> in a straight line. Road route unavailable right
            now.
          </span>
        </p>
      );
    }

    return (
      <p className="omasta-route-summary">
        <Car size={16} />
        <span>
          <strong>{formatRouteDuration(route.durationSeconds)}</strong> by road · {formatRouteDistance(route.distanceMeters)}
        </span>
      </p>
    );
  };

  return (
    <section className="omasta-route-card" ref={ref} aria-label={`Selected location: ${location.name}`}>
      <div className="omasta-route-card-head">
        <span className={`omasta-location-icon omasta-location-icon--${location.category}`} aria-hidden="true">
          <Icon size={18} />
        </span>
        <div className="omasta-route-card-title">
          <p>
            {location.type}
            {location.openState && location.openState.state !== "unknown" ? ` · ${location.openState.label}` : ""}
          </p>
          <h2>{location.name}</h2>
        </div>
        <button type="button" className="omasta-route-close" onClick={onClose} aria-label="Clear route">
          <X size={18} />
        </button>
      </div>

      <p className="omasta-route-address">{location.address}</p>

      {renderRoute()}

      <div className="omasta-route-actions">
        <button type="button" className="orange-button orange-button--solid" onClick={onDetails}>
          Details
        </button>
        <button
          type="button"
          className="orange-button orange-button--outline"
          onClick={onCall}
          disabled={!location.phone}
          title={location.phone ? `Call ${location.name}` : "No number listed for this location"}
        >
          <Phone size={15} />
          Call
        </button>
        <button type="button" className="omasta-ask-ai-button" onClick={onAsk}>
          <Sparkles size={14} />
          Ask
        </button>
        {location.isDemo ? <DemoBadge label="Sample" /> : null}
        {location.isCommunity ? (
          <span className="omasta-community-badge">
            <Users size={12} />
            Community
          </span>
        ) : null}
      </div>
    </section>
  );
});

export default RouteCard;
