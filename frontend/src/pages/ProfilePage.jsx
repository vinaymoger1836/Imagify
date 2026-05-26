import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import ImageGrid from '../components/ImageGrid.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import { fetchUserProfile, followUser, unfollowUser } from '../services/api.js'
import { getUserId, getUserEmail } from '../utils/auth.js'

function ProfileSkeleton() {
  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar-lg skeleton" style={{ borderRadius: '50%' }} />
        <div className="skeleton" style={{ height: 20, width: 160, borderRadius: 8, marginTop: 12 }} />
        <div className="profile-stats">
          {[1, 2, 3].map(i => (
            <div key={i} className="profile-stat">
              <div className="skeleton" style={{ height: 24, width: 40, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: 56, borderRadius: 4, marginTop: 4 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="image-grid" style={{ padding: 24 }}>
        {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserEmail, setCurrentUserEmail] = useState('')
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    Promise.all([getUserId(), getUserEmail()]).then(([id, email]) => {
      setCurrentUserId(id)
      setCurrentUserEmail(email || '')
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetchUserProfile(userId)
      .then(data => {
        setProfile(data)
        setFollowing(data.isFollowing)
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [userId])

  async function handleFollow() {
    const prev = following
    setFollowing(f => !f)
    setFollowLoading(true)
    try {
      if (prev) await unfollowUser(userId)
      else await followUser(userId)
      setProfile(p => ({ ...p, followerCount: p.followerCount + (prev ? -1 : 1) }))
    } catch {
      setFollowing(prev)
    } finally {
      setFollowLoading(false)
    }
  }

  function handleDelete(imageId) {
    setProfile(p => ({
      ...p,
      images: p.images.filter(img => img.imageId !== imageId),
      postCount: p.postCount - 1,
    }))
  }

  const isOwn = currentUserId === userId
  const initials = isOwn
    ? (currentUserEmail ? currentUserEmail.slice(0, 2).toUpperCase() : '?')
    : userId ? userId.slice(0, 2).toUpperCase() : '?'
  const displayName = isOwn ? currentUserEmail : `@${userId?.slice(0, 12)}`

  if (loading) return <ProfileSkeleton />

  if (error) {
    return (
      <>
        <Header />
        <div className="profile-page">
          <div className="empty-state" style={{ marginTop: 80 }}>
            <div className="empty-state-icon">⚠️</div>
            <p>{error}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="profile-page">
        <div className="profile-hero">
          <button className="profile-back" onClick={() => navigate(-1)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>

          <div className="profile-avatar-lg">{initials}</div>
          <div className="profile-name">{displayName}</div>

          <div className="profile-stats">
            <div className="profile-stat">
              <span className="stat-value">{profile.postCount}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="profile-stat">
              <span className="stat-value">{profile.followerCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="profile-stat">
              <span className="stat-value">{profile.followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>

          {!isOwn && (
            <button
              className={`btn-follow-profile ${following ? 'following' : ''}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <ImageGrid
          images={profile.images}
          loading={false}
          currentUserId={currentUserId}
          onDelete={handleDelete}
        />
      </div>
    </>
  )
}
