import ImageCard from './ImageCard.jsx'
import SkeletonCard from './SkeletonCard.jsx'

const SKELETON_COUNT = 8

export default function ImageGrid({ images, loading, onOpen, onUploadClick, showEngagement = false }) {
  if (loading) {
    return (
      <div className="image-grid">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="image-grid">
        <div className="empty-state">
          <div className="empty-state-icon">🖼️</div>
          <p>No images yet.</p>
          {onUploadClick && (
            <button className="btn-primary" style={{ marginTop: 16 }} onClick={onUploadClick}>
              Upload your first image
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="image-grid">
      {images.map(image => (
        <ImageCard
          key={image.imageId}
          image={image}
          onOpen={onOpen}
          showEngagement={showEngagement}
        />
      ))}
    </div>
  )
}
