export function ConfirmDialog({
  confirmLabel = 'Confirmer',
  isOpen,
  isPending = false,
  message,
  onCancel,
  onConfirm,
  title,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h3 id="confirm-dialog-title">{title}</h3>
        <p>{message}</p>
        <div className="dialog-card__actions">
          <button type="button" className="btn btn-light rounded-pill" onClick={onCancel} disabled={isPending}>
            Annuler
          </button>
          <button type="button" className="btn btn-danger rounded-pill" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
