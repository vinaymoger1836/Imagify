import { useState, useRef } from 'react'
import { getPresignedUrl, fetchLabels } from '../services/api.js'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_ATTEMPTS = 10

export default function UploadModal({ onClose, onUploadComplete }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type.startsWith('image/')) setFile(dropped)
  }

  async function handleUpload() {
    if (!file) return
    setStatus('uploading')
    try {
      const { uploadUrl, imageId } = await getPresignedUrl(file.name, file.type)
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      setStatus('processing')
      await pollForLabels(imageId)
      onUploadComplete()
      onClose()
    } catch {
      setStatus('error')
    }
  }

  async function pollForLabels(imageId) {
    for (let i = 0; i < POLL_MAX_ATTEMPTS; i++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      const labels = await fetchLabels(imageId)
      if (labels.length > 0) return labels
    }
    throw new Error('Timeout')
  }

  const statusMessages = {
    uploading: 'Uploading to S3...',
    processing: 'Analyzing with Rekognition...',
    error: 'Something went wrong. Please try again.',
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Upload Image</h2>
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current.click()}
        >
          <svg width="32" height="32" fill="none" stroke="#adb5bd" strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {file
            ? <p className="file-selected">{file.name}</p>
            : <p>Drop an image here or click to browse</p>
          }
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => { setFile(e.target.files[0]); setStatus('idle') }}
          />
        </div>

        <p className="modal-status">{statusMessages[status] || ''}</p>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!file || status === 'uploading' || status === 'processing'}
          >
            {status === 'uploading' || status === 'processing' ? 'Processing...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
