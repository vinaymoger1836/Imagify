export default function ProgressModal({ status, onClose }) {
  const steps = [
    { key: 'uploading', label: 'Uploading to S3' },
    { key: 'processing', label: 'Analysing with Rekognition' },
  ]
  const currentStep = steps.findIndex(s => s.key === status)

  return (
    <div className="modal-overlay">
      <div className="progress-modal">
        {status === 'error' ? (
          <>
            <div className="progress-error-icon">✕</div>
            <p className="progress-title">Upload failed</p>
            <p className="progress-subtitle">Something went wrong. Please try again.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
          </>
        ) : status === 'duplicate' ? (
          <>
            <div className="progress-error-icon" style={{ color: 'var(--accent)' }}>✓</div>
            <p className="progress-title">Already in your gallery</p>
            <p className="progress-subtitle">This exact image was uploaded before.</p>
            <button className="btn-primary" style={{ marginTop: 20 }} onClick={onClose}>Got it</button>
          </>
        ) : (
          <>
            <div className="progress-spinner" />
            <p className="progress-title">
              {status === 'uploading' ? 'Uploading...' : 'Analysing...'}
            </p>
            <div className="progress-steps">
              {steps.map((step, i) => (
                <div key={step.key} className={`progress-step ${i <= currentStep ? 'active' : ''}`}>
                  <div className="progress-step-dot" />
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
