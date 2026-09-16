import { useEffect, useRef } from "react";
import { Eraser, Sparkles, X } from "lucide-react";

import { useAssistant } from "../../context/AssistantProvider.jsx";
import { useAppUi } from "../../context/AppUiProvider.jsx";
import { useIsDesktop } from "../../hooks/useMediaQuery.js";
import AssistantInput from "./AssistantInput.jsx";
import AssistantMessage from "./AssistantMessage.jsx";
import TypingIndicator from "./TypingIndicator.jsx";

/**
 * The OMASTA AI conversation surface.
 *
 * Desktop: a floating panel anchored bottom-right.
 * Mobile:  a near full-height bottom sheet.
 */
export default function AssistantPanel() {
  const {
    isOpen,
    messages,
    isThinking,
    closeAssistant,
    clearConversation,
    send,
    runAction,
  } = useAssistant();
  const { showNotice } = useAppUi();
  const isDesktop = useIsDesktop();
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const node = scrollRef.current;

    if (node) {
      node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
    }
  }, [isOpen, messages, isThinking]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeAssistant();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    // Only the mobile sheet covers the page, so only it locks the background.
    const previousOverflow = document.body.style.overflow;
    if (!isDesktop) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeAssistant, isDesktop, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {!isDesktop ? <div className="omasta-assistant-scrim" role="presentation" onMouseDown={closeAssistant} /> : null}

      <section
        className={`omasta-assistant ${isDesktop ? "omasta-assistant--panel" : "omasta-assistant--sheet"}`}
        role="dialog"
        aria-modal={!isDesktop}
        aria-labelledby="omasta-assistant-title"
      >
        <header className="omasta-assistant-header">
          <span className="omasta-assistant-avatar" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <div className="omasta-assistant-identity">
            <strong id="omasta-assistant-title">OMASTA AI</strong>
            <span>
              Orange Assistant
              <i className="omasta-assistant-online" aria-hidden="true" />
              Online
            </span>
          </div>
          <div className="omasta-assistant-header-actions">
            <button type="button" onClick={clearConversation} aria-label="Clear conversation">
              <Eraser size={17} />
            </button>
            <button type="button" onClick={closeAssistant} aria-label="Close OMASTA AI">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="omasta-assistant-scroll" ref={scrollRef}>
          {messages.map((message, index) => (
            <AssistantMessage
              key={message.id}
              message={message}
              onAction={runAction}
              onSuggestion={send}
              showTimestamp={index > 0 && message.role === "user"}
            />
          ))}

          {isThinking ? <TypingIndicator /> : null}
        </div>

        <footer className="omasta-assistant-footer">
          <AssistantInput
            onSend={send}
            disabled={isThinking}
            onVoice={() => showNotice("Voice input is not available yet. Type your question for now.")}
          />
          <p className="omasta-assistant-disclaimer">
            OMASTA AI works from sample data in this build and cannot see your account, balance or live network status.
          </p>
        </footer>
      </section>
    </>
  );
}
