const CDN_BASE = import.meta.env.VITE_CDN_URL

export function getThumbUrl(userId, imageId) {
  if (!CDN_BASE || !userId || !imageId) return null
  return `${CDN_BASE}/derivatives/${userId}/${imageId}/thumb.webp`
}

export function getMediumUrl(userId, imageId) {
  if (!CDN_BASE || !userId || !imageId) return null
  return `${CDN_BASE}/derivatives/${userId}/${imageId}/medium.webp`
}
