import { LayoutGrid, LifeBuoy, MapPin, Plus, Store, Wallet } from "lucide-react";

const ICONS = {
  all: LayoutGrid,
  agent: MapPin,
  shop: Store,
  support: LifeBuoy,
  money: Wallet,
};

/**
 * Floating category buttons over the full-screen map, plus "Add".
 * Tapping a category filters the map and flies to the nearest match. On narrow
 * screens the categories scroll while "Add" stays pinned and visible.
 */
export default function MapCategoryBar({ categories, value, onSelect, onAdd, busyId = null }) {
  return (
    <div className="omasta-map-categories" role="toolbar" aria-label="Find Orange locations">
      <div className="omasta-map-chip-scroll">
        {categories.map((category) => {
          const Icon = ICONS[category.id] || MapPin;
          const active = value === category.id;

          return (
            <button
              type="button"
              key={category.id}
              className={`omasta-map-chip ${active ? "is-active" : ""} ${busyId === category.id ? "is-busy" : ""}`}
              aria-pressed={active}
              onClick={() => onSelect(category.id)}
            >
              <Icon size={15} aria-hidden="true" />
              {category.label}
            </button>
          );
        })}
      </div>

      <button type="button" className="omasta-map-chip omasta-map-chip--add" onClick={onAdd}>
        <Plus size={16} aria-hidden="true" />
        Add
      </button>
    </div>
  );
}
