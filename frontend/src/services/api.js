import { getToken } from '../utils/auth.js'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function authHeaders() {
  const token = await getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchImages(feed = 'global') {
  const query = feed !== 'global' ? `?feed=${feed}` : ''
  const res = await fetch(`${API_BASE}/images${query}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch images')
  return res.json()
}

export async function getPresignedUrl(filename, contentType, fileHash) {
  const params = new URLSearchParams({ filename, contentType })
  if (fileHash) params.set('fileHash', fileHash)
  const res = await fetch(`${API_BASE}/images/upload-url?${params}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to get upload URL')
  return res.json()
}

export async function fetchLabels(imageId) {
  const res = await fetch(`${API_BASE}/images/${imageId}/labels`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch labels')
  const data = await res.json()
  return data.labels || []
}

export async function fetchReactions(imageId) {
  const res = await fetch(`${API_BASE}/images/${imageId}/reactions`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch reactions')
  return res.json()
}

export async function setReaction(imageId, type) {
  const res = await fetch(`${API_BASE}/images/${imageId}/reactions`, {
    method: 'PUT',
    headers: { ...await authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })
  if (!res.ok) throw new Error('Failed to set reaction')
  return res.json()
}

export async function removeReaction(imageId) {
  const res = await fetch(`${API_BASE}/images/${imageId}/reactions`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to remove reaction')
  return res.json()
}

export async function fetchFollowStatus(followeeId) {
  const res = await fetch(`${API_BASE}/follows/${followeeId}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch follow status')
  return res.json()
}

export async function followUser(followeeId) {
  const res = await fetch(`${API_BASE}/follows/${followeeId}`, {
    method: 'PUT',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to follow')
  return res.json()
}

export async function unfollowUser(followeeId) {
  const res = await fetch(`${API_BASE}/follows/${followeeId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to unfollow')
  return res.json()
}

export async function fetchFollowers(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}/followers`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch followers')
  return res.json()
}

export async function recordDownload(imageId) {
  await fetch(`${API_BASE}/images/${imageId}/download`, {
    method: 'POST',
    headers: await authHeaders(),
  }).catch(() => {})
}

export async function fetchUserProfile(userId) {
  const res = await fetch(`${API_BASE}/users/${userId}`, {
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

export async function deleteImage(imageId) {
  const res = await fetch(`${API_BASE}/images/${imageId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete image')
  return res.json()
}

export async function downloadImage(imageUrl, filename) {
  const res = await fetch(imageUrl)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
