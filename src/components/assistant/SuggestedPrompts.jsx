/** Tappable prompt chips shown under a message or above the composer. */
export default function SuggestedPrompts({ prompts, onSelect, label = "Suggested questions" }) {
  if (!prompts?.length) {
    return null;
  }

  return (
    <div className="omasta-suggestions" role="group" aria-label={label}>
      {prompts.map((prompt) => (
        <button type="button" key={prompt} onClick={() => onSelect(prompt)}>
          {prompt}
        </button>
      ))}
    </div>
  );
}
