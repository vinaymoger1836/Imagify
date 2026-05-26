import { useState } from 'react'
import { getLabelColor } from '../utils/labelColors.js'

const MAX_LABELS = 3

export default function ImageCard({ image, onOpen, showEngagement = false }) {
  const { filename, imageUrl, labels, reactions, downloadCount } = image
  const [imgLoaded, setImgLoaded] = useState(false)

  const visible = labels.slice(0, MAX_LABELS)
  const overflow = labels.length - MAX_LABELS

  return (
    <div className="image-card" onClick={() => onOpen?.(image)}>
      <div className="card-image-wrap">
        <img
          src={imageUrl}
          alt={filename}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{
            filter: imgLoaded ? 'none' : 'blur(12px)',
            transform: imgLoaded ? '' : 'scale(1.05)',
            transition: 'filter 0.4s ease, transform 0.4s ease',
          }}
        />
      </div>

      <div className="card-footer">
        {showEngagement ? (
          <div className="card-engagement-row">
            <span className="engagement-stat">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              {reactions?.likes || 0}
            </span>
            <span className="engagement-stat">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
              {reactions?.dislikes || 0}
            </span>
            <span className="engagement-stat">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {downloadCount || 0}
            </span>
          </div>
        ) : (
          <>
            <div className="card-labels">
              {visible.map(label => {
                const color = getLabelColor(label.name)
                return (
                  <span key={label.name} className="label-chip" style={{ background: color.bg, color: color.text }}>
                    {label.name}
                  </span>
                )
              })}
              {overflow > 0 && <span className="label-overflow">+{overflow}</span>}
            </div>
            <div className="card-reactions-mini">
              <span className="reaction-mini">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg>
                {reactions?.likes || 0}
              </span>
              <span className="reaction-mini">
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/></svg>
                {reactions?.dislikes || 0}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
