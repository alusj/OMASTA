/** Loading placeholders used while service calls resolve. */
export function Skeleton({ width = "100%", height = 14, radius = 8, className = "" }) {
  return (
    <span
      className={`omasta-skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="omasta-skeleton-card" aria-hidden="true">
      <Skeleton height={110} radius={16} />
      <Skeleton width="60%" height={12} />
      <Skeleton width="85%" height={10} />
      <Skeleton width="40%" height={12} />
    </div>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="omasta-skeleton-list" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
