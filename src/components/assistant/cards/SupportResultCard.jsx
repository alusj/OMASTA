import { LifeBuoy } from "lucide-react";

import CardActions from "./CardActions.jsx";

/** Support topic result, with the first few self-help steps inline. */
export default function SupportResultCard({ card, onAction }) {
  return (
    <article className="omasta-result-card omasta-result-card--support">
      <div className="omasta-result-body">
        <div className="omasta-result-location-head">
          <span className="omasta-result-pin omasta-result-pin--support">
            <LifeBuoy size={15} />
          </span>
          <div>
            <h4>{card.title}</h4>
            {card.description ? <p className="omasta-result-copy">{card.description}</p> : null}
          </div>
        </div>

        {card.steps?.length ? (
          <ol className="omasta-result-steps">
            {card.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        ) : null}

        <CardActions actions={card.actions} onAction={onAction} />
      </div>
    </article>
  );
}
