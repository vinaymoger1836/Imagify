import { getLabelColor } from '../utils/labelColors.js'

const MAX_VISIBLE = 3

export default function ImageCard({ image }) {
  const { filename, imageUrl, labels, processedAt } = image
  const visible = labels.slice(0, MAX_VISIBLE)
  const overflow = labels.length - MAX_VISIBLE

  const date = new Date(processedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="image-card">
      <img src={imageUrl} alt={filename} loading="lazy" />
      <div className="card-body">
        <div className="card-filename">{filename}</div>
        <div className="card-date">{date}</div>
        <div className="card-labels">
          {visible.map(label => {
            const color = getLabelColor(label.name)
            return (
              <span
                key={label.name}
                className="label-chip"
                style={{ background: color.bg, color: color.text }}
              >
                {label.name} {label.confidence.toFixed(0)}%
              </span>
            )
          })}
          {overflow > 0 && <span className="label-overflow">+{overflow}</span>}
        </div>
      </div>
    </div>
  )
}
