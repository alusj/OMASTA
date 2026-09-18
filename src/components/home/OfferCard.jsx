import { Package, PhoneCall, Sparkles, Wifi } from "lucide-react";

const KIND_ICONS = {
  data: Wifi,
  voice: PhoneCall,
  device: Package,
};

/**
 * Compact offer tile. Tapping it opens the offer (bundle, product or list);
 * the sparkle hands the offer's id to OMASTA AI as context.
 */
export default function OfferCard({ offer, onOpen, onAsk }) {
  const Icon = KIND_ICONS[offer.kind] || Wifi;

  return (
    <article className={`omasta-mini-offer omasta-mini-offer--${offer.kind}`}>
      <button type="button" className="omasta-mini-offer-main" onClick={() => onOpen(offer)}>
        <span className="omasta-mini-offer-icon" aria-hidden="true">
          <Icon size={15} />
        </span>
        <span className="omasta-mini-offer-title">{offer.title}</span>
        <strong className="omasta-mini-offer-value">{offer.value}</strong>
        <span className="omasta-mini-offer-meta">{offer.validity}</span>
        {offer.price ? <span className="omasta-mini-offer-price">{offer.price}</span> : null}
      </button>
      <button
        type="button"
        className="omasta-mini-offer-ask"
        onClick={() => onAsk(offer)}
        aria-label={`Ask OMASTA about the ${offer.title} offer`}
        title="Ask OMASTA about this offer"
      >
        <Sparkles size={15} />
      </button>
    </article>
  );
}
