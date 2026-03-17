import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, CirclePlus, ImagePlus, Trash2, X } from 'lucide-react';

function buildInitialState(product) {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    categoryId: product?.category_id ? String(product.category_id) : '',
    price: product?.price ? String(product.price) : '',
    stockQuantity: String(product?.stock_quantity ?? 0),
    isActive: product?.is_active ?? true,
    imageFile: null,
    existingImageUrl: product?.image_url ?? '',
    removeImage: false,
    allergenIds: product?.allergens?.map((allergen) => String(allergen.id)) ?? [],
    modifiers:
      product?.modifiers?.map((modifier) => ({
        name: modifier.name,
        priceAdjustment: String(modifier.price_adjustment ?? 0),
      })) ?? [],
  };
}

function formatFileSize(size) {
  if (!size) {
    return '';
  }

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getStockPreview(quantityValue) {
  const quantity = Math.max(0, Number.parseInt(quantityValue || '0', 10) || 0);
  const unitLabel = `${quantity} unit${quantity === 1 ? '' : 's'}`;

  if (quantity <= 0) {
    return {
      tone: 'out',
      label: 'Out of stock',
      detail: 'This item will stay unavailable until inventory is replenished.',
    };
  }

  if (quantity <= 5) {
    return {
      tone: 'low',
      label: 'Low stock',
      detail: `${unitLabel} left before this menu item needs attention.`,
    };
  }

  return {
    tone: 'in',
    label: 'In stock',
    detail: `${unitLabel} ready for service.`,
  };
}

export function ProductFormModal({
  allergens = [],
  categories,
  isOpen,
  isSaving = false,
  mode = 'create',
  onClose,
  onSubmit,
  product,
  validationErrors = {},
}) {
  const [form, setForm] = useState(() => buildInitialState(product));
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const inputId = useId();
  const stockPreview = getStockPreview(form.stockQuantity);

  const previewUrl = useMemo(() => {
    if (!form.imageFile) {
      return form.removeImage ? '' : form.existingImageUrl;
    }

    return URL.createObjectURL(form.imageFile);
  }, [form.imageFile, form.existingImageUrl, form.removeImage]);

  useEffect(() => {
    if (!form.imageFile) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [form.imageFile, previewUrl]);

  if (!isOpen) {
    return null;
  }

  function getFieldError(field) {
    return validationErrors[field]?.[0] ?? '';
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleAllergen(allergenId) {
    const nextId = String(allergenId);

    setForm((current) => ({
      ...current,
      allergenIds: current.allergenIds.includes(nextId)
        ? current.allergenIds.filter((id) => id !== nextId)
        : [...current.allergenIds, nextId],
    }));
  }

  function updateModifier(index, field, value) {
    setForm((current) => ({
      ...current,
      modifiers: current.modifiers.map((modifier, modifierIndex) =>
        modifierIndex === index ? { ...modifier, [field]: value } : modifier,
      ),
    }));
  }

  function addModifier() {
    setForm((current) => ({
      ...current,
      modifiers: [...current.modifiers, { name: '', priceAdjustment: '0' }],
    }));
  }

  function removeModifier(index) {
    setForm((current) => ({
      ...current,
      modifiers: current.modifiers.filter((_, modifierIndex) => modifierIndex !== index),
    }));
  }

  function applyImage(nextFile) {
    if (!nextFile || !nextFile.type.startsWith('image/')) {
      return;
    }

    setForm((current) => ({
      ...current,
      imageFile: nextFile,
      removeImage: false,
    }));
  }

  function handleImageChange(event) {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      return;
    }

    applyImage(nextFile);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    const nextFile = event.dataTransfer.files?.[0] ?? null;

    if (!nextFile) {
      return;
    }

    applyImage(nextFile);
  }

  function clearImage() {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setForm((current) => ({
      ...current,
      imageFile: null,
      removeImage: Boolean(current.existingImageUrl),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = new FormData();
    payload.append('name', form.name);
    payload.append('description', form.description);
    payload.append('category_id', form.categoryId);
    payload.append('price', form.price);
    payload.append('stock_quantity', form.stockQuantity);
    payload.append('is_active', String(form.isActive));

    if (form.removeImage) {
      payload.append('remove_image', '1');
    }

    if (form.imageFile) {
      payload.append('image', form.imageFile);
    }

    form.allergenIds.forEach((allergenId) => {
      payload.append('allergens[]', allergenId);
    });

    form.modifiers
      .filter((modifier) => modifier.name.trim() !== '')
      .forEach((modifier, index) => {
        payload.append(`modifiers[${index}][name]`, modifier.name);
        payload.append(`modifiers[${index}][price_adjustment]`, modifier.priceAdjustment || '0');
      });

    onSubmit(payload);
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <div className="dialog-card dialog-card--wide dialog-card--product" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
        <button type="button" className="btn-close dialog-card__close" aria-label="Close" onClick={onClose} />

        <div className="dialog-card__header">
          <div className="dialog-card__titleblock">
            <p className="section-tag">Product</p>
            <h3 id="product-form-title">{mode === 'create' ? 'Add product' : 'Edit product'}</h3>
            <p>
              {mode === 'create'
                ? 'Create a new menu item with pricing, category, allergens, sizes, and an optional image.'
                : 'Update content, pricing, media, allergens, modifiers, and visibility for this product.'}
            </p>
          </div>
        </div>

        {mode === 'edit' && product?.name ? (
          <div className="dialog-mode-banner">
            <span>Editing</span>
            <strong>{product.name}</strong>
          </div>
        ) : null}

        <form className="stack-form" onSubmit={handleSubmit}>
          <div className="modal-grid">
            <div className="modal-field modal-field--wide">
              <label className="field-label" htmlFor={`${inputId}-name`}>
                Product name <span className="field-label__required">*</span>
              </label>
              <input
                id={`${inputId}-name`}
                type="text"
                className={`form-control ${getFieldError('name') ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Burger Signature"
              />
              {getFieldError('name') ? <div className="invalid-feedback d-block">{getFieldError('name')}</div> : null}
            </div>

            <div className="modal-field">
              <label className="field-label" htmlFor={`${inputId}-category`}>
                Category <span className="field-label__required">*</span>
              </label>
              <div className="field-shell field-shell--select">
                <select
                  id={`${inputId}-category`}
                  className={`form-select ${getFieldError('category_id') ? 'is-invalid' : ''}`}
                  value={form.categoryId}
                  onChange={(event) => updateForm('categoryId', event.target.value)}
                >
                  <option value="">Choose a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
              {getFieldError('category_id') ? (
                <div className="invalid-feedback d-block">{getFieldError('category_id')}</div>
              ) : null}
            </div>

            <div className="modal-field">
              <label className="field-label" htmlFor={`${inputId}-price`}>
                Base price <span className="field-label__required">*</span>
              </label>
              <div className="field-shell field-shell--price">
                <input
                  id={`${inputId}-price`}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-control ${getFieldError('price') ? 'is-invalid' : ''}`}
                  value={form.price}
                  onChange={(event) => updateForm('price', event.target.value)}
                  placeholder="14.90"
                />
                <span className="field-shell__suffix">EUR</span>
              </div>
              {getFieldError('price') ? <div className="invalid-feedback d-block">{getFieldError('price')}</div> : null}
            </div>

            <div className="modal-field">
              <label className="field-label" htmlFor={`${inputId}-stock`}>
                Stock quantity <span className="field-label__required">*</span>
              </label>
              <input
                id={`${inputId}-stock`}
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                className={`form-control ${getFieldError('stock_quantity') ? 'is-invalid' : ''}`}
                value={form.stockQuantity}
                onChange={(event) => updateForm('stockQuantity', event.target.value)}
                placeholder="18"
              />
              {getFieldError('stock_quantity') ? (
                <div className="invalid-feedback d-block">{getFieldError('stock_quantity')}</div>
              ) : (
                <p className={`field-help field-help--${stockPreview.tone}`}>
                  <strong>{stockPreview.label}</strong>
                  <span>{stockPreview.detail}</span>
                </p>
              )}
            </div>

            <div className="modal-field modal-field--wide">
              <label className="field-label" htmlFor={`${inputId}-description`}>
                Description
              </label>
              <textarea
                id={`${inputId}-description`}
                rows="4"
                className={`form-control form-control--textarea ${getFieldError('description') ? 'is-invalid' : ''}`}
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                placeholder="Describe the dish, ingredients, or serving notes."
              />
              {getFieldError('description') ? (
                <div className="invalid-feedback d-block">{getFieldError('description')}</div>
              ) : null}
            </div>

            <div className="modal-field modal-field--wide">
              <div className="field-label">Allergens</div>
              <div className="selector-grid">
                {allergens.map((allergen) => {
                  const isSelected = form.allergenIds.includes(String(allergen.id));
                  const shortCode = allergen.icon.slice(0, 2).toUpperCase();

                  return (
                    <button
                      key={allergen.id}
                      type="button"
                      className={`selector-chip ${isSelected ? 'selector-chip--active' : ''}`}
                      onClick={() => toggleAllergen(allergen.id)}
                    >
                      <span className="selector-chip__icon">{shortCode}</span>
                      <span className="selector-chip__label">{allergen.name}</span>
                    </button>
                  );
                })}
              </div>
              {getFieldError('allergens') ? <div className="invalid-feedback d-block">{getFieldError('allergens')}</div> : null}
            </div>

            <div className="modal-field modal-field--wide">
              <div className="modifier-header">
                <div>
                  <label className="field-label">Modifiers and sizes</label>
                  <p className="modifier-header__copy">Add optional upsizes, extras, or menu variants with price deltas.</p>
                </div>
                <button type="button" className="btn btn-light rounded-pill" onClick={addModifier}>
                  <CirclePlus size={14} />
                  <span>Add modifier</span>
                </button>
              </div>

              {form.modifiers.length ? (
                <div className="modifier-list">
                  {form.modifiers.map((modifier, index) => (
                    <div key={`modifier-${index}`} className="modifier-row">
                      <div className="modifier-row__field">
                        <input
                          type="text"
                          className={`form-control ${getFieldError(`modifiers.${index}.name`) ? 'is-invalid' : ''}`}
                          value={modifier.name}
                          onChange={(event) => updateModifier(index, 'name', event.target.value)}
                          placeholder="Large, Extra cheese, Family size..."
                        />
                        {getFieldError(`modifiers.${index}.name`) ? (
                          <div className="invalid-feedback d-block">{getFieldError(`modifiers.${index}.name`)}</div>
                        ) : null}
                      </div>

                      <div className="modifier-row__price">
                        <div className="field-shell field-shell--price">
                          <input
                            type="number"
                            step="0.01"
                            className={`form-control ${getFieldError(`modifiers.${index}.price_adjustment`) ? 'is-invalid' : ''}`}
                            value={modifier.priceAdjustment}
                            onChange={(event) => updateModifier(index, 'priceAdjustment', event.target.value)}
                            placeholder="0.00"
                          />
                          <span className="field-shell__suffix">EUR</span>
                        </div>
                        {getFieldError(`modifiers.${index}.price_adjustment`) ? (
                          <div className="invalid-feedback d-block">{getFieldError(`modifiers.${index}.price_adjustment`)}</div>
                        ) : null}
                      </div>

                      <button type="button" className="btn btn-outline-danger rounded-pill modifier-row__remove" onClick={() => removeModifier(index)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="modifier-empty">No modifiers yet. Add sizes or extras if this product needs flexible pricing.</div>
              )}

              {getFieldError('modifiers') ? <div className="invalid-feedback d-block">{getFieldError('modifiers')}</div> : null}
            </div>
          </div>

          <div className="modal-field">
            <div className="field-label">Image</div>

            <div
              className={`upload-dropzone ${dragging ? 'upload-dropzone--dragging' : ''} ${previewUrl ? 'upload-dropzone--filled' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragging(false);
              }}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="upload-dropzone__input"
                onChange={handleImageChange}
              />

              {previewUrl ? (
                <div className="upload-dropzone__preview">
                  <div className="upload-dropzone__thumb">
                    <img src={previewUrl} alt={form.name || 'Product preview'} />
                  </div>
                  <div className="upload-dropzone__meta">
                    <span>{form.imageFile ? 'New upload' : 'Current image'}</span>
                    <strong>{form.imageFile ? form.imageFile.name : `${product?.name ?? 'Product'} image`}</strong>
                    <small>
                      {form.imageFile
                        ? `${formatFileSize(form.imageFile.size)} - click or drop another file to replace it.`
                        : 'Click or drag a new image here to replace the current one.'}
                    </small>
                  </div>
                </div>
              ) : (
                <div className="upload-dropzone__empty">
                  <span className="upload-dropzone__icon">
                    <ImagePlus size={26} />
                  </span>
                  <strong>Drag an image here or click to upload</strong>
                  <small>PNG or JPG files work best for menu previews.</small>
                </div>
              )}
            </div>

            <div className="upload-dropzone__actions">
              <button type="button" className="btn btn-light rounded-pill" onClick={() => fileInputRef.current?.click()}>
                {previewUrl ? 'Replace image' : 'Choose image'}
              </button>
              {previewUrl || form.existingImageUrl ? (
                <button type="button" className="btn btn-outline-danger rounded-pill" onClick={clearImage}>
                  <X size={14} />
                  <span>Remove image</span>
                </button>
              ) : null}
            </div>

            {form.removeImage ? (
              <p className="upload-dropzone__notice">The current image will be removed when you save changes.</p>
            ) : null}

            {getFieldError('image') ? <div className="invalid-feedback d-block">{getFieldError('image')}</div> : null}
          </div>

          <label className={`status-toggle ${form.isActive ? 'status-toggle--on' : ''}`}>
            <input
              type="checkbox"
              className="status-toggle__input"
              checked={form.isActive}
              onChange={(event) => updateForm('isActive', event.target.checked)}
            />
            <span className="status-toggle__track">
              <span className="status-toggle__thumb" />
            </span>
            <span className="status-toggle__body">
              <strong>{form.isActive ? 'Active' : 'Inactive'}</strong>
              <small>
                {form.isActive ? 'Visible in the live catalog and available to staff.' : 'Hidden from the live catalog.'}
              </small>
            </span>
          </label>

          <div className="dialog-card__actions dialog-card__actions--split">
            <button type="button" className="btn btn-outline-dark rounded-pill" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark rounded-pill" disabled={isSaving}>
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create product' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
