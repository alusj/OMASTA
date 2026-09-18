import { Skeleton } from "../common/Skeleton.jsx";

/**
 * Horizontal swipe rail for compact Home cards: native scroll with momentum
 * and snap on touch, a single row on wider screens.
 */
export default function HomeRail({ label, loading = false, skeletonCount = 3, children }) {
  if (loading) {
    return (
      <div className="omasta-rail" role="status" aria-label={`Loading ${label}`}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div className="omasta-rail-item omasta-rail-skeleton" key={index} aria-hidden="true">
            <Skeleton height={96} radius={14} />
            <Skeleton width="70%" height={12} />
            <Skeleton width="45%" height={12} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="omasta-rail" aria-label={label}>
      {children}
    </ul>
  );
}

export function HomeRailItem({ children }) {
  return <li className="omasta-rail-item">{children}</li>;
}
