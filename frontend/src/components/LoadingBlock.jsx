export function LoadingBlock({ label = 'Chargement...' }) {
  return (
    <div className="content-loader">
      <div className="spinner-border text-dark" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
