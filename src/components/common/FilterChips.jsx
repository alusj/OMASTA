/** Horizontally scrollable filter chips, shared by Find and Shop. */
export default function FilterChips({ options, value, onChange, label }) {
  return (
    <div className="omasta-chips" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.id}
          className={value === option.id ? "is-active" : ""}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
