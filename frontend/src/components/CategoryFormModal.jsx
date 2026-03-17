import { useId, useState } from 'react';

function buildInitialState(category) {
  return {
    name: category?.name ?? '',
  };
}

export function CategoryFormModal({
  category,
  isOpen,
  isSaving = false,
  mode = 'create',
  onClose,
  onSubmit,
  validationErrors = {},
}) {
  const [form, setForm] = useState(() => buildInitialState(category));
  const inputId = useId();

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      name: form.name,
    });
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="category-form-title">
        <button type="button" className="btn-close dialog-card__close" aria-label="Close" onClick={onClose} />

        <div className="dialog-card__header">
          <div className="dialog-card__titleblock">
            <p className="section-tag">Category</p>
            <h3 id="category-form-title">{mode === 'create' ? 'Add category' : 'Edit category'}</h3>
            <p>Keep the menu structure clean and make categories easier to scan.</p>
          </div>
        </div>

        {mode === 'edit' && category?.name ? (
          <div className="dialog-mode-banner">
            <span>Editing</span>
            <strong>{category.name}</strong>
          </div>
        ) : null}

        <form className="stack-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="field-label" htmlFor={`${inputId}-category-name`}>
              Category name <span className="field-label__required">*</span>
            </label>
            <input
              id={`${inputId}-category-name`}
              type="text"
              className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
              value={form.name}
              onChange={(event) => setForm({ name: event.target.value })}
              placeholder="Main course"
            />
            {validationErrors.name ? <div className="invalid-feedback d-block">{validationErrors.name[0]}</div> : null}
          </div>

          <div className="dialog-card__actions dialog-card__actions--split">
            <button type="button" className="btn btn-outline-dark rounded-pill" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark rounded-pill" disabled={isSaving}>
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create category' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
