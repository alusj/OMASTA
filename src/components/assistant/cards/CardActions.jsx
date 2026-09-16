/** Action buttons rendered under an assistant card or message. */
export default function CardActions({ actions, onAction, align = "start" }) {
  if (!actions?.length) {
    return null;
  }

  return (
    <div className={`omasta-card-actions omasta-card-actions--${align}`}>
      {actions.map((button) => (
        <button
          type="button"
          key={button.id}
          className={`omasta-card-action omasta-card-action--${button.variant || "secondary"}`}
          onClick={() => onAction(button.action)}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
