import { ArrowRight } from "lucide-react";

/** Shared section header: eyebrow, title and an optional trailing action. */
export default function SectionHeading({ eyebrow, title, action, onAction, id }) {
  return (
    <div className="orange-section-heading">
      <div>
        {eyebrow ? <p className="orange-eyebrow">{eyebrow}</p> : null}
        <h2 id={id}>{title}</h2>
      </div>
      {action ? (
        <button type="button" className="orange-text-button" onClick={onAction}>
          {action}
          <ArrowRight size={15} />
        </button>
      ) : null}
    </div>
  );
}
