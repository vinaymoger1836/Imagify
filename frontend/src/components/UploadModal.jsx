import { useState, useRef } from 'react'

export default function UploadModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null)
  const [postName, setPostName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef()

  function handleFile(selected) {
    if (!selected?.type.startsWith('image/')) return
    setFile(selected)
    setPostName(selected.name.replace(/\.[^.]+$/, ''))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
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
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>

        {file && (
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Post name</label>
            <input
              type="text"
              value={postName}
              onChange={e => setPostName(e.target.value)}
              placeholder="Give your post a name"
              autoFocus
            />
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => file && postName.trim() && onUpload(file, postName.trim())}
            disabled={!file || !postName.trim()}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  )
}
