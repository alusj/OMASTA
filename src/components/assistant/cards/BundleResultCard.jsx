import DemoBadge from "../../common/DemoBadge.jsx";
import CardActions from "./CardActions.jsx";

/** Bundle result rendered inside a conversation. */
export default function BundleResultCard({ card, onAction }) {
  return (
    <article className="omasta-result-card omasta-result-card--bundle">
      <div className="omasta-result-bundle-value">
        <strong>{card.title}</strong>
        <span>{card.subtitle}</span>
      </div>
      <div className="omasta-result-body">
        {card.description ? <p className="omasta-result-copy">{card.description}</p> : null}
        <div className="omasta-result-price">
          <strong>{card.price}</strong>
          {card.isDemo ? <DemoBadge label="Demo price" /> : null}
        </div>
        <CardActions actions={card.actions} onAction={onAction} />
      </div>
    </article>
  );
}
