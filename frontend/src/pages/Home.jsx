import { useState, useEffect, useMemo } from 'react'
import Header from '../components/Header.jsx'
import LabelFilter from '../components/LabelFilter.jsx'
import ImageGrid from '../components/ImageGrid.jsx'
import UploadModal from '../components/UploadModal.jsx'
import { fetchImages } from '../services/api.js'

export default function Home() {
  const [images, setImages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLabel, setActiveLabel] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  async function loadImages() {
    try {
      const data = await fetchImages()
      setImages(data)
    } catch (err) {
      console.error('Failed to load images', err)
    }
  }

  useEffect(() => { loadImages() }, [])

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
      <LabelFilter
        labels={allLabels}
        activeLabel={activeLabel}
        onSelect={setActiveLabel}
      />
      <ImageGrid images={filtered} />
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadComplete={loadImages}
        />
      )}
    </>
  )
}
