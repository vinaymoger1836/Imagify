export default function Header({ searchQuery, onSearchChange, onUploadClick }) {
  return (
    <header className="header">
      <span className="header-logo">Imagify</span>
      <div className="search-bar">
        <svg width="15" height="15" fill="none" stroke="#868e96" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search labels..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <button className="btn-upload" onClick={onUploadClick}>
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Upload
      </button>
    </header>
  )
}
