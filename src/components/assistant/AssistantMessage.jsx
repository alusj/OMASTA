import { MessageRole, MessageStatus } from "../../services/assistant/assistantTypes.js";
import AssistantCard from "./cards/AssistantCard.jsx";
import CardActions from "./cards/CardActions.jsx";
import SuggestedPrompts from "./SuggestedPrompts.jsx";

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** One conversation turn: text, any rich cards, action buttons and suggestions. */
export default function AssistantMessage({ message, onAction, onSuggestion, showTimestamp }) {
  const isUser = message.role === MessageRole.USER;
  const isError = message.status === MessageStatus.ERROR;

  return (
    <div className={`omasta-message omasta-message--${isUser ? "user" : "assistant"} ${isError ? "is-error" : ""}`}>
      <div className="omasta-bubble">
        {message.text ? <p>{message.text}</p> : null}
        {showTimestamp ? <time dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time> : null}
      </div>

      {message.cards?.length ? (
        <div className="omasta-message-cards">
          {message.cards.map((card) => (
            <AssistantCard key={card.id} card={card} onAction={onAction} />
          ))}
        </div>
      ) : null}

      {message.actions?.length ? <CardActions actions={message.actions} onAction={onAction} /> : null}

      {message.suggestions?.length ? (
        <SuggestedPrompts prompts={message.suggestions} onSelect={onSuggestion} />
      ) : null}
    </div>
  );
}
