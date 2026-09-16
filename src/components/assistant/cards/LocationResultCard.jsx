import { Clock3, MapPin } from "lucide-react";

import DemoBadge from "../../common/DemoBadge.jsx";
import CardActions from "./CardActions.jsx";

/** Location result rendered inside a conversation. */
export default function LocationResultCard({ card, onAction }) {
  return (
    <article className="omasta-result-card omasta-result-card--location">
      <div className="omasta-result-body">
        <div className="omasta-result-location-head">
          <span className="omasta-result-pin">
            <MapPin size={15} />
          </span>
          <div>
            <p className="omasta-result-subtitle">{card.subtitle}</p>
            <h4>{card.title}</h4>
          </div>
          {card.isDemo ? <DemoBadge /> : null}
        </div>

        <div className="omasta-result-meta">
          {card.distanceLabel ? <span>{card.distanceLabel}</span> : null}
          {card.openState ? (
            <span className={`omasta-location-state omasta-location-state--${card.openState.state}`}>
              <Clock3 size={12} />
              {card.openState.label}
            </span>
          ) : null}
        </div>

        {card.description ? <p className="omasta-result-copy">{card.description}</p> : null}
        <CardActions actions={card.actions} onAction={onAction} />
      </div>
    </article>
  );
}
