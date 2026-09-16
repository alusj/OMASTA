import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * One dialog primitive for the whole app.
 *
 * On phones it behaves as a bottom sheet, on larger screens as a centred
 * dialog. Handles Escape, backdrop dismissal, background scroll locking and
 * moves focus into the panel when it opens.
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  size = "default",
  labelledById,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const titleId = labelledById || "omasta-sheet-title";

  return (
    <div className="orange-modal-backdrop omasta-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={panelRef}
        tabIndex={-1}
        className={`omasta-sheet omasta-sheet--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="orange-sheet-handle" aria-hidden="true" />
        <div className="orange-modal-heading">
          <div>
            {eyebrow ? <p className="orange-eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="orange-modal-close" onClick={onClose} aria-label={`Close ${title}`}>
            <X size={19} />
          </button>
        </div>
        {description ? <p className="orange-sheet-description">{description}</p> : null}
        <div className="omasta-sheet-body">{children}</div>
        {footer ? <div className="omasta-sheet-footer">{footer}</div> : null}
      </section>
    </div>
  );
}
