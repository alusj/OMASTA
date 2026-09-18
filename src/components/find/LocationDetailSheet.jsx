import { Clock3, MapPin, Navigation, Phone, Route, Sparkles } from "lucide-react";

import BottomSheet from "../common/BottomSheet.jsx";
import { DemoNote } from "../common/DemoBadge.jsx";

/** Full detail for one location, opened from the map, the list or the assistant. */
export default function LocationDetailSheet({ location, open, onClose, onDirections, onCall, onAskAssistant }) {
  if (!location) {
    return null;
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      eyebrow={location.type}
      title={location.name}
      labelledById="location-detail-title"
    >
      <div className="omasta-location-detail">
        <p className="omasta-location-detail-row">
          <MapPin size={16} />
          <span>{location.address}</span>
        </p>

        {location.openState ? (
          <p className="omasta-location-detail-row">
            <Clock3 size={16} />
            <span>
              {location.openState.label}
              {location.openState.days ? ` · ${location.openState.days}` : ""}
            </span>
          </p>
        ) : null}

        {location.distanceLabel ? (
          <p className="omasta-location-detail-row">
            <Navigation size={16} />
            <span>{location.distanceLabel} from your reference point</span>
          </p>
        ) : null}

        {location.services?.length ? (
          <div className="omasta-location-detail-services">
            <h3>Services</h3>
            <ul>
              {location.services.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {location.isCommunity ? (
          <DemoNote>Added by a customer and approved by an Orange admin. Hours and services are not listed yet.</DemoNote>
        ) : null}

        {location.isDemo ? (
          <DemoNote>
            This is a sample record used during development. Details, hours and availability are not verified Orange
            information.
          </DemoNote>
        ) : null}

        <div className="omasta-location-detail-actions">
          <button type="button" className="orange-button orange-button--solid" onClick={() => onDirections(location)}>
            <Route size={15} />
            Show route
          </button>
          <button
            type="button"
            className="orange-button orange-button--outline"
            onClick={() => onCall(location)}
            disabled={!location.phone}
          >
            <Phone size={15} />
            Call
          </button>
          <button type="button" className="omasta-ask-ai-button" onClick={() => onAskAssistant(location)}>
            <Sparkles size={15} />
            Ask OMASTA AI
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
