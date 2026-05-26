import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLabelColor } from '../utils/labelColors.js'
import {
  setReaction, removeReaction,
  fetchFollowStatus, followUser, unfollowUser,
  deleteImage, downloadImage,
} from '../services/api.js'

const MAX_VISIBLE = 3

const ThumbUpIcon = ({ filled }) => (
  <svg width="14" height="14" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
)

const ThumbDownIcon = ({ filled }) => (
  <svg width="14" height="14" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
    <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

export default function ImageCard({ image, currentUserId, onDelete }) {
  const navigate = useNavigate()
  const { imageId, userId, filename, imageUrl, labels, processedAt } = image
  const [imgLoaded, setImgLoaded] = useState(false)
  const [reactions, setReactions] = useState(
    image.reactions ?? { likes: 0, dislikes: 0, userReaction: null }
  )
  const [following, setFollowing] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isOwn = userId && userId === currentUserId
  const visible = labels.slice(0, MAX_VISIBLE)
  const overflow = labels.length - MAX_VISIBLE

  const date = new Date(processedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  useEffect(() => {
    if (!isOwn && userId) {
      fetchFollowStatus(userId).then(d => setFollowing(d.following)).catch(() => {})
    }
  }, [imageId, userId, isOwn])

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
    try {
      await downloadImage(imageUrl, filename)
    } catch (err) {
      console.error('Download failed', err)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await deleteImage(imageId)
      onDelete?.(imageId)
    } catch (err) {
      console.error('Delete failed', err)
      setDeleting(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="image-card">
      <img
        src={imageUrl}
        alt={filename}
        loading="lazy"
        onLoad={() => setImgLoaded(true)}
        style={{ filter: imgLoaded ? 'none' : 'blur(12px)', transform: imgLoaded ? '' : 'scale(1.05)', transition: 'filter 0.4s ease, transform 0.4s ease' }}
      />
      <div className="card-body">
        <div className="card-header-row">
          <div className="card-filename">{filename}</div>
          {!isOwn && userId && (
            <button
              className={`btn-follow ${following ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={following === null}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <div className="card-meta">
          <span className="card-date">{date}</span>
          {userId && (
            <button className="card-uploader-link" onClick={() => navigate(`/user/${userId}`)}>
              {isOwn ? 'You' : `@${userId.slice(0, 8)}`}
            </button>
          )}
        </div>
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
      </div>

      {deleting ? (
        <div className="card-actions card-delete-confirm">
          <span className="delete-confirm-text">Delete this image?</span>
          <button className="btn-delete-cancel" onClick={() => setDeleting(false)} disabled={deleteLoading}>Cancel</button>
          <button className="btn-delete-confirm" onClick={handleDelete} disabled={deleteLoading}>
            {deleteLoading ? '…' : 'Delete'}
          </button>
        </div>
      ) : (
        <div className="card-actions">
          <button
            className={`reaction-btn ${reactions.userReaction === 'like' ? 'active like' : ''}`}
            onClick={() => handleReaction('like')}
          >
            <ThumbUpIcon filled={reactions.userReaction === 'like'} />
            <span>{reactions.likes}</span>
          </button>
          <button
            className={`reaction-btn ${reactions.userReaction === 'dislike' ? 'active dislike' : ''}`}
            onClick={() => handleReaction('dislike')}
          >
            <ThumbDownIcon filled={reactions.userReaction === 'dislike'} />
            <span>{reactions.dislikes}</span>
          </button>
          <div style={{ flex: 1 }} />
          <button className="reaction-btn" onClick={handleDownload} title="Download">
            <DownloadIcon />
          </button>
          {isOwn && (
            <button className="reaction-btn trash-btn" onClick={() => setDeleting(true)} title="Delete">
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
