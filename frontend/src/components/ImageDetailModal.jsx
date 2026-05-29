import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLabelColor } from '../utils/labelColors.js'
import { getMediumUrl, getThumbUrl } from '../utils/cdn.js'
import {
  setReaction, removeReaction,
  fetchFollowStatus, followUser, unfollowUser,
  deleteImage, downloadImage, recordDownload,
} from '../services/api.js'

const ThumbUpIcon = ({ filled }) => (
  <svg width="15" height="15" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
)

const ThumbDownIcon = ({ filled }) => (
  <svg width="15" height="15" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

export default function ImageDetailModal({ initialImage, currentUserId, allImages, onClose, onDelete }) {
  const navigate = useNavigate()
  const [image, setImage] = useState(initialImage)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [reactions, setReactions] = useState(initialImage.reactions ?? { likes: 0, dislikes: 0, userReaction: null })
  const [following, setFollowing] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { imageId, userId, filename, imageUrl, labels, processedAt } = image
  const mediumUrl = getMediumUrl(userId, imageId)
  const isOwn = userId && userId === currentUserId

  const moreByOwner = (allImages || [])
    .filter(img => img.userId === userId && img.imageId !== imageId)
    .slice(0, 10)

  const date = new Date(processedAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })

  useEffect(() => {
    setImgLoaded(false)
    setReactions(image.reactions ?? { likes: 0, dislikes: 0, userReaction: null })
    setFollowing(null)
    setDeleting(false)
  }, [image.imageId])

  useEffect(() => {
    if (!isOwn && userId) {
      fetchFollowStatus(userId).then(d => setFollowing(d.following)).catch(() => {})
    }
  }, [imageId, userId, isOwn])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleReaction(type) {
    const prev = reactions
    if (reactions.userReaction === type) {
      setReactions(r => ({
        ...r,
        [type === 'like' ? 'likes' : 'dislikes']: r[type === 'like' ? 'likes' : 'dislikes'] - 1,
        userReaction: null,
      }))
      try { await removeReaction(imageId) } catch { setReactions(prev) }
    } else {
      const prevType = reactions.userReaction
      setReactions(r => ({
        likes:    type === 'like'    ? r.likes + 1    : prevType === 'like'    ? r.likes - 1    : r.likes,
        dislikes: type === 'dislike' ? r.dislikes + 1 : prevType === 'dislike' ? r.dislikes - 1 : r.dislikes,
        userReaction: type,
      }))
      try { await setReaction(imageId, type) } catch { setReactions(prev) }
    }
  }

  async function handleFollow() {
    const prev = following
    setFollowing(f => !f)
    try {
      if (prev) await unfollowUser(userId)
      else await followUser(userId)
    } catch {
      setFollowing(prev)
    }
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      await Promise.all([
        recordDownload(imageId),
        downloadImage(imageUrl, filename),
      ])
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await deleteImage(imageId)
      onDelete?.(imageId)
      onClose()
    } catch {
      setDeleteLoading(false)
      setDeleting(false)
    }
  }

  function switchTo(img) {
    setImage(img)
    setImgLoaded(false)
  }

  return (
    <div className="modal-overlay detail-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="detail-modal">
        <button className="detail-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <div className="detail-body">
          {/* Left: image */}
          <div className="detail-image-pane">
            <img
              key={imageId}
              src={mediumUrl || imageUrl}
              alt={filename}
              onLoad={e => {
                const from = e.currentTarget.src.includes('cloudfront.net') ? 'CDN' : 'S3'
                console.log(`[DetailModal] ${from} ✓ ${imageId}`)
                setImgLoaded(true)
              }}
              onError={mediumUrl ? e => {
                console.log(`[DetailModal] CDN miss → S3 fallback ${imageId}`)
                e.currentTarget.onerror = null
                e.currentTarget.src = imageUrl
              } : undefined}
              style={{
                filter: imgLoaded ? 'none' : 'blur(16px)',
                transform: imgLoaded ? 'scale(1)' : 'scale(1.04)',
                transition: 'filter 0.5s ease, transform 0.5s ease',
              }}
            />
          </div>

          {/* Right: info */}
          <div className="detail-info-pane">
            {/* Owner row */}
            <div className="detail-owner-row">
              <button
                className="detail-owner-avatar"
                onClick={() => { navigate(`/user/${userId}`); onClose() }}
                title="View profile"
              >
                {userId?.slice(0, 2).toUpperCase() || '?'}
              </button>
              <div className="detail-owner-meta">
                <span className="detail-owner-handle">
                  {isOwn ? 'You' : `@${userId?.slice(0, 12)}`}
                </span>
                <span className="detail-filename">{filename}</span>
              </div>
              {!isOwn && userId && (
                <button
                  className={`btn-follow ${following ? 'following' : ''}`}
                  onClick={handleFollow}
                  disabled={following === null}
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>

            <div className="detail-date">{date}</div>

            {/* All labels */}
            <div className="detail-labels">
              {labels.map(label => {
                const color = getLabelColor(label.name)
                return (
                  <span key={label.name} className="label-chip" style={{ background: color.bg, color: color.text }}>
                    {label.name}
                  </span>
                )
              })}
              {labels.length === 0 && <span className="detail-no-labels">No labels yet</span>}
            </div>

            {/* Actions */}
            <div className="detail-actions">
              <button
                className={`detail-action-btn ${reactions.userReaction === 'like' ? 'active like' : ''}`}
                onClick={() => handleReaction('like')}
              >
                <ThumbUpIcon filled={reactions.userReaction === 'like'} />
                <span>{reactions.likes}</span>
              </button>
              <button
                className={`detail-action-btn ${reactions.userReaction === 'dislike' ? 'active dislike' : ''}`}
                onClick={() => handleReaction('dislike')}
              >
                <ThumbDownIcon filled={reactions.userReaction === 'dislike'} />
                <span>{reactions.dislikes}</span>
              </button>
              <button
                className="detail-action-btn"
                onClick={handleDownload}
                disabled={downloading}
                title="Download"
              >
                <DownloadIcon />
              </button>
              {isOwn && !deleting && (
                <button className="detail-action-btn trash" onClick={() => setDeleting(true)} title="Delete">
                  <TrashIcon />
                </button>
              )}
            </div>

            {/* Delete confirm */}
            {isOwn && deleting && (
              <div className="detail-delete-confirm">
                <span>Delete this image permanently?</span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn-secondary" onClick={() => setDeleting(false)} disabled={deleteLoading}>Cancel</button>
                  <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleteLoading}>
                    {deleteLoading ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )}

            {/* More by owner */}
            {moreByOwner.length > 0 && (
              <div className="detail-more">
                <div className="detail-more-title">
                  More from {isOwn ? 'you' : `@${userId?.slice(0, 8)}`}
                </div>
                <div className="detail-more-scroll">
                  {moreByOwner.map(img => (
                    <div
                      key={img.imageId}
                      className={`detail-more-thumb ${img.imageId === imageId ? 'active' : ''}`}
                      onClick={() => switchTo(img)}
                    >
                      <img
                      src={getThumbUrl(img.userId, img.imageId) || img.imageUrl}
                      alt={img.filename}
                      loading="lazy"
                      onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = img.imageUrl }}
                    />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
