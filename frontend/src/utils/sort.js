const STORAGE_KEY = 'imagify-sort'

export const SORT_OPTIONS = [
  { key: 'newest',     label: 'Newest' },
  { key: 'liked',      label: 'Most Liked' },
  { key: 'downloaded', label: 'Most Downloaded' },
]

export function getSort() {
  const saved = localStorage.getItem(STORAGE_KEY)
  return SORT_OPTIONS.some(o => o.key === saved) ? saved : 'newest'
}

export function setSort(sort) {
  localStorage.setItem(STORAGE_KEY, sort)
}

export function sortImages(images, sort) {
  const byNewest = (a, b) => new Date(b.processedAt) - new Date(a.processedAt)
  const arr = [...images]
  if (sort === 'liked') {
    arr.sort((a, b) => (b.reactions?.likes || 0) - (a.reactions?.likes || 0) || byNewest(a, b))
  } else if (sort === 'downloaded') {
    arr.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0) || byNewest(a, b))
  } else {
    arr.sort(byNewest)
  }
  return arr
}
