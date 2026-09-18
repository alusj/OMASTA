import { useEffect, useRef, useState } from "react";
import { Mic, SendHorizontal } from "lucide-react";

/**
 * Composer for the assistant.
 *
 * The microphone is a deliberate placeholder: it is wired to an explanatory
 * callback rather than a fake recorder, and the layout already has room for a
 * real speech-to-text control when one is added.
 *
 * `autoFocus` is set when the customer opened the assistant by tapping an
 * "Ask OMASTA anything" field elsewhere, so they can type straight away.
 */
export default function AssistantInput({ onSend, onVoice, disabled, autoFocus = false }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [autoFocus]);

  const submit = (event) => {
    event.preventDefault();
    const text = value.trim();

    if (!text || disabled) {
      return;
    }

    onSend(text);
    setValue("");
  };

  return (
    <form className="omasta-composer" onSubmit={submit}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask OMASTA anything..."
        aria-label="Ask OMASTA anything"
        enterKeyHint="send"
        autoComplete="off"
      />
      <button type="button" className="omasta-composer-mic" onClick={onVoice} aria-label="Voice input, not available yet">
        <Mic size={18} />
      </button>
      <button type="submit" className="omasta-composer-send" disabled={disabled || !value.trim()} aria-label="Send message">
        <SendHorizontal size={18} />
      </button>
    </form>
  );
}
