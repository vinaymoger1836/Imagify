import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTheme, setTheme } from '../utils/theme.js'
import { signOut, getUserEmail, getUserId } from '../utils/auth.js'

const SunIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

const MoonIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const MonitorIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
)

const THEMES = [
  { key: 'system', label: 'System', Icon: MonitorIcon },
  { key: 'light',  label: 'Light',  Icon: SunIcon },
  { key: 'dark',   label: 'Dark',   Icon: MoonIcon },
]

export default function Header({ searchQuery, onSearchChange, onUploadClick }) {
  const navigate = useNavigate()
  const [theme, setThemeState] = useState(getTheme)
  const [open, setOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const themeRef = useRef()
  const userRef = useRef()

  useEffect(() => {
    getUserEmail().then(email => setUserEmail(email || ''))
    getUserId().then(id => setCurrentUserId(id))
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (themeRef.current && !themeRef.current.contains(e.target)) setOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(key) {
    setTheme(key)
    setThemeState(key)
    setOpen(false)
  }

  function handleSignOut() {
    signOut()
    navigate('/auth', { replace: true })
  }

  function handleProfile() {
    setUserOpen(false)
    if (currentUserId) navigate(`/user/${currentUserId}`)
  }

  const current = THEMES.find(t => t.key === theme)
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : '?'

  return (
    <header className="header">
      <span className="header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Imagify</span>

      {onSearchChange && (
        <div className="search-bar">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
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
      )}

      <div className="theme-toggle" ref={themeRef}>
        <button className="btn-icon" onClick={() => setOpen(o => !o)} title="Change theme">
          <current.Icon />
        </button>
        {open && (
          <div className="theme-dropdown">
            {THEMES.map(({ key, label, Icon }) => (
              <button
                key={key}
                className={`theme-option ${theme === key ? 'active' : ''}`}
                onClick={() => handleSelect(key)}
              >
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="user-menu" ref={userRef}>
        <button className="user-avatar" onClick={() => setUserOpen(o => !o)} title={userEmail}>
          {initials}
        </button>
        {userOpen && (
          <div className="user-dropdown">
            <div className="user-email-display">{userEmail}</div>
            <button className="user-dropdown-btn" onClick={handleProfile}>My Profile</button>
            <button className="user-signout-btn" onClick={handleSignOut}>Sign out</button>
          </div>
        )}
      </div>

      {onUploadClick && (
        <button className="btn-upload" onClick={onUploadClick}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Upload
        </button>
      )}
    </header>
  )
}
