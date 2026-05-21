import { useState, useEffect, useMemo } from 'react'
import Header from '../components/Header.jsx'
import FeedTabs from '../components/FeedTabs.jsx'
import LabelFilter from '../components/LabelFilter.jsx'
import ImageGrid from '../components/ImageGrid.jsx'
import UploadModal from '../components/UploadModal.jsx'
import ProgressModal from '../components/ProgressModal.jsx'
import { fetchImages, getPresignedUrl, fetchLabels } from '../services/api.js'
import { getUserId } from '../utils/auth.js'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 20

export default function Home() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLabel, setActiveLabel] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [progressStatus, setProgressStatus] = useState(null)
  const [feed, setFeed] = useState('global')
  const [currentUserId, setCurrentUserId] = useState(null)

  useEffect(() => {
    getUserId().then(setCurrentUserId)
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchImages(feed)
      .then(setImages)
      .catch(err => console.error('Failed to load images', err))
      .finally(() => setLoading(false))
  }, [feed])

  async function loadImages() {
    try {
      const data = await fetchImages(feed)
      setImages(data)
    } catch (err) {
      console.error('Failed to load images', err)
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
      loadImages()
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
      } catch {
        // transient error — keep polling
      }
    }
    throw new Error('Timeout')
  }

  const allLabels = useMemo(() => {
    const set = new Set()
    images.forEach(img => img.labels.forEach(l => set.add(l.name)))
    return [...set].sort()
  }, [images])

  const filtered = useMemo(() => {
    return images.filter(img => {
      const matchesLabel = !activeLabel || img.labels.some(l => l.name === activeLabel)
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q
        || img.filename.toLowerCase().includes(q)
        || img.labels.some(l => l.name.toLowerCase().includes(q))
      return matchesLabel && matchesSearch
    })
  }, [images, activeLabel, searchQuery])

  return (
    <>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setShowUpload(true)}
      />
      <FeedTabs feed={feed} onChange={setFeed} />
      <LabelFilter
        labels={allLabels}
        activeLabel={activeLabel}
        onSelect={setActiveLabel}
      />
      <ImageGrid images={filtered} loading={loading} currentUserId={currentUserId} />
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
        />
      )}
      {progressStatus && (
        <ProgressModal
          status={progressStatus}
          onClose={() => setProgressStatus(null)}
        />
      )}
    </>
  )
}
