const PALETTE = [
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#e0e7ff', text: '#3730a3' },
  { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#f3e8ff', text: '#6b21a8' },
  { bg: '#fee2e2', text: '#991b1b' },
]

export function getLabelColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
