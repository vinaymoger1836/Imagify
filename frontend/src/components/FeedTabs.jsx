export default function FeedTabs({ feed, onChange }) {
  return (
    <div className="feed-tabs">
      {[
        { key: 'global',    label: 'All' },
        { key: 'following', label: 'Following' },
        { key: 'mine',      label: 'My Posts' },
      ].map(({ key, label }) => (
        <button
          key={key}
          className={`feed-tab ${feed === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
