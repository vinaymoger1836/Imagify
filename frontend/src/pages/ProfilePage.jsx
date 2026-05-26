import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header.jsx'
import ImageGrid from '../components/ImageGrid.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import UploadModal from '../components/UploadModal.jsx'
import ProgressModal from '../components/ProgressModal.jsx'
import ImageDetailModal from '../components/ImageDetailModal.jsx'
import { fetchUserProfile, followUser, unfollowUser, fetchFollowers, getPresignedUrl, fetchLabels } from '../services/api.js'
import { getUserId, getUserEmail, changePassword } from '../utils/auth.js'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 20

function ProfileSkeleton() {
  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="profile-avatar-lg skeleton" style={{ borderRadius: '50%' }} />
        <div className="skeleton" style={{ height: 18, width: 200, borderRadius: 8, marginTop: 14 }} />
        <div className="profile-stats" style={{ marginTop: 20 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="profile-stat">
              <div className="skeleton" style={{ height: 26, width: 40, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 12, width: 60, borderRadius: 4, marginTop: 4 }} />
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
  const [activeTab, setActiveTab] = useState('posts')

  // Followers tab
  const [followers, setFollowers] = useState([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followersFetched, setFollowersFetched] = useState(false)

  // Settings tab
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // Upload (own profile)
  const [showUpload, setShowUpload] = useState(false)
  const [progressStatus, setProgressStatus] = useState(null)

  // Detail modal
  const [selectedImage, setSelectedImage] = useState(null)

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
    setFollowersFetched(false)
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

  function handleDeleteFromGrid(imageId) {
    setProfile(p => ({
      ...p,
      images: p.images.filter(img => img.imageId !== imageId),
      postCount: p.postCount - 1,
    }))
    setSelectedImage(null)
  }

  async function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab === 'followers' && !followersFetched) {
      setFollowersLoading(true)
      try {
        const data = await fetchFollowers(userId)
        setFollowers(data.followers || [])
        setFollowersFetched(true)
      } catch {
        setFollowers([])
      } finally {
        setFollowersLoading(false)
      }
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (newPw !== confirmPw) { setPwError('New passwords do not match'); return }
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters'); return }
    setPwLoading(true)
    try {
      await changePassword(oldPw, newPw)
      setPwSuccess(true)
      setOldPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      setPwError(err.message || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  async function handleUpload(file, postName) {
    setShowUpload(false)
    setProgressStatus('uploading')
    try {
      const { uploadUrl, imageId } = await getPresignedUrl(postName, file.type)
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setProgressStatus('processing')
      await pollForLabels(imageId)
      setProgressStatus(null)
      const data = await fetchUserProfile(userId)
      setProfile(data)
    } catch {
      setProgressStatus('error')
    }
  }

  async function pollForLabels(imageId) {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      try {
        const labels = await fetchLabels(imageId)
        if (labels.length > 0) return labels
      } catch { /* keep polling */ }
    }
    throw new Error('Timeout')
  }

  if (loading) return <ProfileSkeleton />

  if (error) {
    return (
      <>
        <Header />
        <div className="empty-state" style={{ marginTop: 100 }}>
          <p>{error}</p>
        </div>
      </>
    )
  }

  const isOwn = currentUserId === userId
  const initials = isOwn
    ? (currentUserEmail ? currentUserEmail.slice(0, 2).toUpperCase() : '?')
    : userId ? userId.slice(0, 2).toUpperCase() : '?'
  const displayName = isOwn ? currentUserEmail : `@${userId?.slice(0, 16)}`

  return (
    <>
      <Header />
      <div className="profile-page">

        {/* Hero */}
        <div className="profile-hero">
          <button className="profile-back" onClick={() => navigate(-1)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back
          </button>

          {isOwn && (
            <button className="profile-upload-btn" onClick={() => setShowUpload(true)}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Upload
            </button>
          )}

          <div className="profile-avatar-lg">{initials}</div>
          <div className="profile-name">{displayName}</div>

          <div className="profile-stats">
            <div className="profile-stat" onClick={() => handleTabChange('posts')} style={{ cursor: 'pointer' }}>
              <span className="stat-value">{profile.postCount}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="profile-stat" onClick={() => handleTabChange('followers')} style={{ cursor: 'pointer' }}>
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

        {/* Tabs */}
        <div className="profile-tabs">
          {['posts', 'followers', ...(isOwn ? ['settings'] : [])].map(tab => (
            <button
              key={tab}
              className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Posts tab */}
        {activeTab === 'posts' && (
          <ImageGrid
            images={profile.images}
            loading={false}
            onOpen={setSelectedImage}
            onUploadClick={isOwn ? () => setShowUpload(true) : undefined}
            showEngagement={isOwn}
          />
        )}

        {/* Followers tab */}
        {activeTab === 'followers' && (
          followersLoading ? (
            <div className="image-grid" style={{ padding: 24 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="follower-card">
                  <div className="follower-avatar skeleton" />
                  <div className="skeleton" style={{ height: 12, width: 80, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : followers.length === 0 ? (
            <div className="empty-state" style={{ paddingTop: 60 }}>
              <p>No followers yet.</p>
            </div>
          ) : (
            <div className="followers-grid">
              {followers.map(f => (
                <div key={f.userId} className="follower-card" onClick={() => navigate(`/user/${f.userId}`)}>
                  <div className="follower-avatar">{f.userId.slice(0, 2).toUpperCase()}</div>
                  <span className="follower-id">@{f.userId.slice(0, 12)}</span>
                </div>
              ))}
            </div>
          )
        )}

        {/* Settings tab (own only) */}
        {activeTab === 'settings' && isOwn && (
          <div className="settings-pane">
            <div className="settings-section">
              <h3>Change Password</h3>
              <form className="auth-form" onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current password</label>
                  <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} required placeholder="Enter current password" />
                </div>
                <div className="form-group">
                  <label>New password</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="At least 8 characters" />
                </div>
                <div className="form-group">
                  <label>Confirm new password</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Repeat new password" />
                </div>
                {pwError && <div className="auth-error">{pwError}</div>}
                {pwSuccess && <div className="settings-success">Password updated successfully.</div>}
                <button className="btn-primary auth-submit" type="submit" disabled={pwLoading}>
                  {pwLoading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}
      {progressStatus && (
        <ProgressModal status={progressStatus} onClose={() => setProgressStatus(null)} />
      )}
      {selectedImage && (
        <ImageDetailModal
          initialImage={selectedImage}
          currentUserId={currentUserId}
          allImages={profile.images}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDeleteFromGrid}
        />
      )}
    </>
  )
}
