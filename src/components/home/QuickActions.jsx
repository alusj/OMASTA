import { Grid3x3, Hash, Headphones, Layers, Receipt, Send, Smartphone, Wifi } from "lucide-react";

import { QUICK_ACTIONS } from "../../data/quickActions.js";

const ICONS = {
  wifi: Wifi,
  smartphone: Smartphone,
  send: Send,
  receipt: Receipt,
  layers: Layers,
  hash: Hash,
  headphones: Headphones,
  grid: Grid3x3,
};

/** The eight primary shortcuts. Every tile resolves to a real destination. */
export default function QuickActions({ onAction }) {
  return (
    <div className="omasta-quick-grid">
      {QUICK_ACTIONS.map((item) => {
        const Icon = ICONS[item.icon] || Grid3x3;

        return (
          <button type="button" className="omasta-quick-tile" key={item.id} onClick={() => onAction(item.action)}>
            <span className="omasta-quick-icon">
              <Icon size={20} />
            </span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </button>
        );
      })}
    </div>
  );
}
