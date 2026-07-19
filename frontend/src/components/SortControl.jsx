import { SORT_OPTIONS } from '../utils/sort.js'

export default function SortControl({ sort, onChange }) {
  return (
    <div className="sort-control">
      {SORT_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          className={`sort-btn ${sort === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
