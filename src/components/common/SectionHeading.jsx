import { ArrowRight } from "lucide-react";

/**
 * Shared section header: eyebrow, title and an optional trailing action.
 *
 * `variant="compact"` is the dashboard label style used on Home (a single
 * small uppercase title), and `badge` sits beside the title, e.g. a demo label.
 */
export default function SectionHeading({
  eyebrow,
  title,
  action,
  actionLabel,
  onAction,
  id,
  variant = "default",
  badge = null,
}) {
  return (
    <div className={`orange-section-heading ${variant === "compact" ? "orange-section-heading--compact" : ""}`}>
      <div className="orange-section-heading-copy">
        {eyebrow ? <p className="orange-eyebrow">{eyebrow}</p> : null}
        <h2 id={id}>{title}</h2>
        {badge}
      </div>
      {action ? (
        <button type="button" className="orange-text-button" onClick={onAction} aria-label={actionLabel}>
          {action}
          <ArrowRight size={15} />
        </button>
      ) : null}
    </div>
  );
}
