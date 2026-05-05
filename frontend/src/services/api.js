const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function getPresignedUrl(filename, contentType) {
  const params = new URLSearchParams({ filename, contentType })
  const res = await fetch(`${API_BASE}/images/upload-url?${params}`)
  if (!res.ok) throw new Error('Failed to get upload URL')
  return res.json()
}

export async function fetchLabels(imageId) {
  const res = await fetch(`${API_BASE}/images/${imageId}/labels`)
  if (!res.ok) throw new Error('Failed to fetch labels')
  const data = await res.json()
  return data.labels || []
}

export async function fetchImages() {
  const res = await fetch(`${API_BASE}/images`)
  if (!res.ok) throw new Error('Failed to fetch images')
  return res.json()
}
