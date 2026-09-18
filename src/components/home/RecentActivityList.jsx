import { ArrowDownLeft, ArrowUpRight, PhoneCall, RotateCw, Smartphone, Wifi } from "lucide-react";

import { Skeleton } from "../common/Skeleton.jsx";
import { formatMoney, formatRelativeDay } from "../../utils/format.js";

const KIND_ICONS = {
  data: Wifi,
  voice: PhoneCall,
  airtime: Smartphone,
  "money-out": ArrowUpRight,
  "money-in": ArrowDownLeft,
};

/**
 * Presentational activity list. Receives items from the account service (demo
 * today, an Orange transactions API later) plus loading and error state.
 */
export default function RecentActivityList({ items, loading = false, error = null, onRetry, skeletonCount = 3 }) {
  if (loading) {
    return (
      <ul className="omasta-activity" role="status" aria-label="Loading recent activity">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <li className="omasta-activity-row" key={index} aria-hidden="true">
            <Skeleton width={38} height={38} radius={12} />
            <span className="omasta-activity-copy">
              <Skeleton width="60%" height={12} />
              <Skeleton width="30%" height={10} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="omasta-activity-state">
        <p>Recent activity could not be loaded.</p>
        <button type="button" className="orange-text-button" onClick={onRetry}>
          <RotateCw size={14} />
          Try again
        </button>
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="omasta-activity-state">
        <p>No recent activity yet.</p>
      </div>
    );
  }

  return (
    <ul className="omasta-activity">
      {items.map((item) => {
        const Icon = KIND_ICONS[item.kind] || ArrowUpRight;
        const incoming = item.direction === "in";

        return (
          <li className="omasta-activity-row" key={item.id}>
            <span className={`omasta-activity-icon ${incoming ? "is-in" : ""}`} aria-hidden="true">
              <Icon size={17} />
            </span>
            <span className="omasta-activity-copy">
              <strong>{item.title}</strong>
              <small>
                {formatRelativeDay(item.occurredAt)}
                {item.detail ? ` · ${item.detail}` : ""}
              </small>
            </span>
            <span className={`omasta-activity-amount ${incoming ? "is-in" : ""}`}>
              <span className="omasta-visually-hidden">{incoming ? "Received" : "Spent"} </span>
              {incoming ? "+" : "−"}
              {formatMoney(item.amount, item.currency)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
