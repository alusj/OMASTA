import { ArrowRight, Sparkles } from "lucide-react";

import { OFFERS } from "../../data/offers.js";
import DemoBadge from "../common/DemoBadge.jsx";

/**
 * Offers for you.
 *
 * Personalisation is not connected, so these are illustrative and labelled as
 * such. Each card can hand the offer to OMASTA AI for an explanation.
 */
export default function OffersSection({ onAction, onAskAssistant }) {
  return (
    <div className="omasta-offer-row">
      {OFFERS.map((offer) => (
        <article className={`omasta-offer-card omasta-offer-card--${offer.kind}`} key={offer.id}>
          <div className="omasta-offer-head">
            <span className="omasta-offer-value">{offer.value}</span>
            {offer.isDemo ? <DemoBadge label="Sample offer" /> : null}
          </div>
          <h3>{offer.title}</h3>
          <p>{offer.description}</p>
          {offer.price ? <strong className="omasta-offer-price">{offer.price}</strong> : null}
          <div className="omasta-offer-actions">
            <button type="button" className="orange-button orange-button--solid" onClick={() => onAction(offer.action)}>
              {offer.cta}
              <ArrowRight size={15} />
            </button>
            <button type="button" className="omasta-ask-ai-button" onClick={() => onAskAssistant(offer)}>
              <Sparkles size={14} />
              Ask AI about this offer
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
