export function StatusBadge({ active }) {
  return (
    <span className={`status-badge ${active ? 'status-badge--active' : 'status-badge--inactive'}`}>
      <span className="status-badge__dot" />
      <span>{active ? 'Active' : 'Inactive'}</span>
    </span>
  );
}
