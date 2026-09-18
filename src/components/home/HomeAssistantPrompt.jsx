import { Mic, Sparkles } from "lucide-react";

import { AssistantIntent } from "../../services/assistant/assistantTypes.js";

/**
 * Suggestions carry a structured intent as well as the visible prompt, so the
 * assistant routes them deterministically whichever provider is active.
 */
const SUGGESTIONS = [
  { id: "buy-data", label: "Buy data", prompt: "I want to buy data", intent: AssistantIntent.BUY_DATA },
  { id: "find-agent", label: "Find agent", prompt: "Find an Orange agent near me", intent: AssistantIntent.FIND_AGENT },
  { id: "sim-help", label: "SIM help", prompt: "I need help with my SIM", intent: AssistantIntent.SIM_SUPPORT },
];

/**
 * Inline OMASTA AI entry point on Home.
 *
 * Not a second chatbot: every control here opens the same assistant panel and
 * conversation as the floating button, through `openAssistant`.
 */
export default function HomeAssistantPrompt({ onOpen, onVoice }) {
  return (
    <section className="omasta-home-ai" aria-labelledby="home-ai-title">
      <div className="omasta-home-ai-head">
        <span className="omasta-home-ai-icon" aria-hidden="true">
          <Sparkles size={17} />
        </span>
        <div>
          <p className="omasta-home-ai-kicker">OMASTA AI</p>
          <h2 id="home-ai-title">How can I help you?</h2>
        </div>
      </div>

      <div className="omasta-home-ai-field">
        <button type="button" className="omasta-home-ai-input" onClick={() => onOpen({ focusInput: true })}>
          Ask OMASTA anything...
        </button>
        <button type="button" className="omasta-home-ai-mic" onClick={onVoice} aria-label="Voice input, not available yet">
          <Mic size={18} />
        </button>
      </div>

      <div className="omasta-home-ai-suggestions" aria-label="Suggested actions">
        {SUGGESTIONS.map((suggestion) => (
          <button
            type="button"
            key={suggestion.id}
            onClick={() => onOpen({ prompt: suggestion.prompt, intent: suggestion.intent })}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  );
}
