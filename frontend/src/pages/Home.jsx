import { useState, useEffect, useMemo, useRef } from 'react'
import Header from '../components/Header.jsx'
import FeedTabs from '../components/FeedTabs.jsx'
import SortControl from '../components/SortControl.jsx'
import LabelFilter from '../components/LabelFilter.jsx'
import ImageGrid from '../components/ImageGrid.jsx'
import UploadModal from '../components/UploadModal.jsx'
import ProgressModal from '../components/ProgressModal.jsx'
import ImageDetailModal from '../components/ImageDetailModal.jsx'
import { fetchImages, getPresignedUrl, fetchLabels } from '../services/api.js'
import { sha256 } from 'js-sha256'
import { getUserId } from '../utils/auth.js'
import { getSort, setSort as saveSort, sortImages } from '../utils/sort.js'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 20
const PAGE_SIZE = 24

export default function Home() {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLabel, setActiveLabel] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [progressStatus, setProgressStatus] = useState(null)
  const [feed, setFeed] = useState('global')
  const [sort, setSort] = useState(getSort)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)

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

  async function hashFile(file) {
    const buffer = await file.arrayBuffer()
    return sha256(buffer)
  }

  async function handleUpload(file, postName) {
    setShowUpload(false)
    setProgressStatus('uploading')
    try {
      const fileHash = await hashFile(file)
      const result = await getPresignedUrl(postName, file.type, fileHash)
      if (result.duplicate) {
        setProgressStatus('duplicate')
        loadImages()
        return
      }
      const { uploadUrl, imageId } = result
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
        // transient — keep polling
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

  const sorted = useMemo(() => sortImages(filtered, sort), [filtered, sort])

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef(null)

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [feed, activeLabel, searchQuery, sort])

  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount])
  const hasMore = visible.length < sorted.length

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) setVisibleCount(c => c + PAGE_SIZE)
      },
      { rootMargin: '600px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  function handleSortChange(key) {
    setSort(key)
    saveSort(key)
  }

  return (
    <>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onUploadClick={() => setShowUpload(true)}
      />
      <div className="toolbar">
        <FeedTabs feed={feed} onChange={setFeed} />
        <SortControl sort={sort} onChange={handleSortChange} />
      </div>
      <LabelFilter
        labels={allLabels}
        activeLabel={activeLabel}
        onSelect={setActiveLabel}
      />
      <ImageGrid
        images={visible}
        loading={loading}
        onOpen={setSelectedImage}
      />
      {!loading && hasMore && (
        <div ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" />
      )}
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
      {selectedImage && (
        <ImageDetailModal
          initialImage={selectedImage}
          currentUserId={currentUserId}
          allImages={images}
          onClose={() => setSelectedImage(null)}
          onDelete={imageId => {
            setImages(imgs => imgs.filter(img => img.imageId !== imageId))
            setSelectedImage(null)
          }}
        />
      )}
    </>
  )
}
