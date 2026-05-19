export default function SkeletonCard() {
  return (
    <div className="image-card skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="card-body">
        <div className="skeleton skeleton-line" style={{ width: '70%', marginBottom: 6 }} />
        <div className="skeleton skeleton-line" style={{ width: '40%', marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <div className="skeleton skeleton-chip" />
          <div className="skeleton skeleton-chip" style={{ width: 64 }} />
          <div className="skeleton skeleton-chip" style={{ width: 52 }} />
        </div>
      </div>
    </div>
  )
}
