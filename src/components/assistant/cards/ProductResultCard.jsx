import DemoBadge from "../../common/DemoBadge.jsx";
import ProductArt from "../../products/ProductArt.jsx";
import CardActions from "./CardActions.jsx";

/** Product result rendered inside a conversation. */
export default function ProductResultCard({ card, onAction }) {
  return (
    <article className="omasta-result-card omasta-result-card--product">
      <div className="omasta-result-art">
        <ProductArt art={card.art} size="small" />
      </div>
      <div className="omasta-result-body">
        <p className="omasta-result-subtitle">{card.subtitle}</p>
        <h4>{card.title}</h4>
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
