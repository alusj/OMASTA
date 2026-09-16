/** Three-dot typing state shown while a reply is being produced. */
export default function TypingIndicator() {
  return (
    <div className="omasta-typing" role="status" aria-label="OMASTA AI is typing">
      <span />
      <span />
      <span />
    </div>
  );
}
