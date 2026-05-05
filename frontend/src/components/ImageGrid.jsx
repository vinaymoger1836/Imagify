import ImageCard from './ImageCard.jsx'

export default function ImageGrid({ images }) {
  if (images.length === 0) {
    return (
      <div className="image-grid">
        <div className="empty-state">
          <div className="empty-state-icon">🖼️</div>
          <p>No images yet. Upload one to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="image-grid">
      {images.map(image => (
        <ImageCard key={image.imageId} image={image} />
      ))}
    </div>
  )
}
