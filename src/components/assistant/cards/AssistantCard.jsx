import { CardType } from "../../../services/assistant/assistantTypes.js";
import BundleResultCard from "./BundleResultCard.jsx";
import CardActions from "./CardActions.jsx";
import LocationResultCard from "./LocationResultCard.jsx";
import ProductResultCard from "./ProductResultCard.jsx";
import SupportResultCard from "./SupportResultCard.jsx";

/** Renders whichever rich card the assistant returned. */
export default function AssistantCard({ card, onAction }) {
  switch (card.type) {
    case CardType.PRODUCT:
      return <ProductResultCard card={card} onAction={onAction} />;
    case CardType.BUNDLE:
      return <BundleResultCard card={card} onAction={onAction} />;
    case CardType.LOCATION:
      return <LocationResultCard card={card} onAction={onAction} />;
    case CardType.SUPPORT:
      return <SupportResultCard card={card} onAction={onAction} />;
    case CardType.INFO:
      return (
        <article className="omasta-result-card omasta-result-card--info">
          <div className="omasta-result-body">
            <h4>{card.title}</h4>
            {card.description ? <p className="omasta-result-copy">{card.description}</p> : null}
            <CardActions actions={card.actions} onAction={onAction} />
          </div>
        </article>
      );
    default:
      return null;
  }
}
