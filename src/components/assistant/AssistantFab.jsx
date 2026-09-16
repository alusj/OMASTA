import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { useAssistant } from "../../context/AssistantProvider.jsx";

/**
 * The persistent OMASTA AI button.
 *
 * Sits above the bottom navigation on phones and clear of it on wider screens.
 * It animates once on first appearance and pulses only until the customer has
 * opened it, so it never becomes ambient noise.
 */
export default function AssistantFab() {
  const { isOpen, openAssistant, messages } = useAssistant();
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setHasEntered(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  if (isOpen) {
    return null;
  }

  const shouldHint = messages.length === 0;

  return (
    <button
      type="button"
      className={`omasta-fab ${hasEntered ? "is-entered" : ""} ${shouldHint ? "is-hinting" : ""}`}
      onClick={() => openAssistant()}
      aria-label="Ask OMASTA"
    >
      <span className="omasta-fab-glow" aria-hidden="true" />
      <Sparkles size={22} />
      <span className="omasta-fab-label">Ask OMASTA</span>
    </button>
  );
}
