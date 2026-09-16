import { Info } from "lucide-react";

/**
 * Marks anything that comes from the local demo data set.
 *
 * Used deliberately and often: nothing in this build is verified Orange data,
 * and the interface must never imply otherwise.
 */
export default function DemoBadge({ label = "Demo data", title }) {
  return (
    <span
      className="omasta-demo-badge"
      title={title || "Sample data for development. Not verified Orange information."}
    >
      <Info size={12} />
      {label}
    </span>
  );
}

export function DemoNote({ children }) {
  return (
    <p className="omasta-demo-note">
      <Info size={14} />
      <span>{children}</span>
    </p>
  );
}
