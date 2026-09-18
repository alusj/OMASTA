import { List, Map as MapIcon } from "lucide-react";

/** Map | List switch at the top of Find. */
export default function FindViewToggle({ view, onChange, floating = false }) {
  return (
    <div
      className={`omasta-view-toggle omasta-find-view-toggle ${floating ? "is-floating" : ""}`}
      role="group"
      aria-label="Switch between map and list"
    >
      <button
        type="button"
        className={view === "map" ? "is-active" : ""}
        aria-pressed={view === "map"}
        onClick={() => onChange("map")}
      >
        <MapIcon size={15} />
        Map
      </button>
      <button
        type="button"
        className={view === "list" ? "is-active" : ""}
        aria-pressed={view === "list"}
        onClick={() => onChange("list")}
      >
        <List size={15} />
        List
      </button>
    </div>
  );
}
