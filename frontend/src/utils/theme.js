const STORAGE_KEY = 'imagify-theme'

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'system'
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
}

export function applyTheme(theme) {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

export function initTheme() {
  applyTheme(getTheme())
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'system') applyTheme('system')
  })
}
