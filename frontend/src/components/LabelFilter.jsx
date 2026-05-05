import { getLabelColor } from '../utils/labelColors.js'

export default function LabelFilter({ labels, activeLabel, onSelect }) {
  return (
    <div className="label-filter">
      <span
        className={`chip ${!activeLabel ? 'active' : ''}`}
        style={{ background: '#f1f3f5', color: '#1a1a2e' }}
        onClick={() => onSelect(null)}
      >
        All
      </span>
      {labels.map(label => {
        const color = getLabelColor(label)
        return (
          <span
            key={label}
            className={`chip ${activeLabel === label ? 'active' : ''}`}
            style={{ background: color.bg, color: color.text }}
            onClick={() => onSelect(activeLabel === label ? null : label)}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}
