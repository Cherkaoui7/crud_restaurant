export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  const pages = [];
  const start = Math.max(1, meta.current_page - 1);
  const end = Math.min(meta.last_page, meta.current_page + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return (
    <div className="pagination-panel">
      <p className="pagination-panel__summary">
        Showing {meta.from ?? 0} - {meta.to ?? 0} of {meta.total} products
      </p>

      <div className="btn-group pagination-panel__controls">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
        >
          Precedent
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`btn ${page === meta.current_page ? 'btn-dark' : 'btn-outline-secondary'}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.last_page}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
