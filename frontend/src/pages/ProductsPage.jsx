import { startTransition, useDeferredValue, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Download,
  CirclePlus,
  FilterX,
  FolderTree,
  Upload,
  PackageSearch,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  UtensilsCrossed,
  Wallet2,
} from 'lucide-react';
import { getAllergens } from '../api/allergens';
import { getCategories } from '../api/categories';
import {
  createProduct,
  deleteProduct,
  exportProductsCsv,
  getProducts,
  importProductsCsv,
  updateProduct,
} from '../api/products';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingBlock } from '../components/LoadingBlock';
import { Pagination } from '../components/Pagination';
import { ProductFormModal } from '../components/ProductFormModal';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDate } from '../utils/format';
import { getErrorMessage, getValidationErrors } from '../utils/http';

const emptyFormState = {
  isOpen: false,
  mode: 'create',
  product: null,
};

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active only' },
  { value: 'inactive', label: 'Inactive only' },
];

function getAllergenCode(allergen) {
  return (allergen.icon ?? allergen.name).slice(0, 2).toUpperCase();
}

function getStockMeta(product) {
  const quantity = Number(product.stock_quantity ?? 0);
  const unitLabel = `${quantity} unit${quantity === 1 ? '' : 's'}`;

  switch (product.stock_state) {
    case 'out':
      return {
        label: 'Out of stock',
        summary: 'No units left',
        detail: 'Replenishment needed before this item can be served again.',
      };
    case 'low':
      return {
        label: 'Low stock',
        summary: `${unitLabel} left`,
        detail: `${unitLabel} remaining in inventory.`,
      };
    default:
      return {
        label: 'In stock',
        summary: `${unitLabel} available`,
        detail: `${unitLabel} ready for service.`,
      };
  }
}

export function ProductsPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [formState, setFormState] = useState(emptyFormState);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const importInputRef = useRef(null);

  const deferredSearch = useDeferredValue(search);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const allergensQuery = useQuery({
    queryKey: ['allergens'],
    queryFn: getAllergens,
  });

  const productsQuery = useQuery({
    queryKey: ['products', page, deferredSearch, categoryId, status],
    queryFn: () =>
      getProducts({
        page,
        per_page: 8,
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(status !== 'all' ? { status } : {}),
      }),
  });

  const products = productsQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const allergens = allergensQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0] ?? null;
  const activeOnPage = products.filter((product) => product.is_active).length;
  const averagePrice = products.length
    ? products.reduce((sum, product) => sum + Number(product.price), 0) / products.length
    : 0;
  const activeFiltersCount = [Boolean(deferredSearch), Boolean(categoryId), status !== 'all'].filter(Boolean).length;
  const hasActiveFilters = activeFiltersCount > 0;
  const activeRatio = products.length ? Math.round((activeOnPage / products.length) * 100) : 0;
  const selectedCategoryName = categories.find((category) => String(category.id) === categoryId)?.name;
  const selectedStockMeta = selectedProduct ? getStockMeta(selectedProduct) : null;

  const metricCards = [
    {
      label: 'Tracked products',
      value: meta?.total ?? 0,
      hint: categories.length ? `Across ${categories.length} menu categories` : 'No categories yet',
      tone: 'teal',
      icon: PackageSearch,
      trend: `${meta?.current_page ?? 1}/${meta?.last_page ?? 1} pages`,
    },
    {
      label: 'Visible selection',
      value: products.length,
      hint: hasActiveFilters ? 'Current filtered result set' : 'Showing the live catalog feed',
      tone: 'blue',
      icon: SlidersHorizontal,
      trend: hasActiveFilters ? `${activeFiltersCount} active filters` : 'No filters applied',
    },
    {
      label: 'Live now',
      value: activeOnPage,
      hint: `${activeRatio}% of visible products are active`,
      tone: activeRatio >= 60 ? 'green' : 'amber',
      icon: BadgeCheck,
      trend: activeRatio >= 60 ? 'Healthy availability' : 'Needs attention',
    },
    {
      label: 'Average ticket',
      value: formatCurrency(averagePrice || 0),
      hint: products.length ? 'Average on visible products' : 'No pricing data available',
      tone: 'violet',
      icon: Wallet2,
      trend: averagePrice >= 12 ? 'Premium mix' : 'Accessible pricing',
    },
  ];

  const saveProductMutation = useMutation({
    mutationFn: ({ mode, payload, productId }) =>
      mode === 'create' ? createProduct(payload) : updateProduct(productId, payload),
    onSuccess: (product) => {
      setFormState(emptyFormState);
      setFormError('');
      setValidationErrors({});
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedProductId(product.id);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, 'Unable to save the product.'));
      setValidationErrors(getValidationErrors(error));
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: importProductsCsv,
    onSuccess: (data) => {
      setImportSuccess(`${data.imported_count} product${data.imported_count === 1 ? '' : 's'} imported successfully.`);
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['allergens'] });
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    },
    onError: (error) => {
      setImportSuccess('');
      setFormError(getErrorMessage(error, 'Unable to import the CSV file.'));
    },
  });

  function openCreateModal() {
    setFormError('');
    setImportSuccess('');
    setValidationErrors({});
    setFormState({
      isOpen: true,
      mode: 'create',
      product: null,
    });
  }

  function openEditModal(product) {
    setFormError('');
    setImportSuccess('');
    setValidationErrors({});
    setFormState({
      isOpen: true,
      mode: 'edit',
      product,
    });
  }

  function handleSubmitProduct(payload) {
    saveProductMutation.mutate({
      mode: formState.mode,
      payload,
      productId: formState.product?.id,
    });
  }

  function resetFilters() {
    startTransition(() => {
      setPage(1);
      setSearch('');
      setCategoryId('');
      setStatus('all');
    });
  }

  async function handleExportCsv() {
    try {
      const blob = await exportProductsCsv({
        ...(deferredSearch ? { search: deferredSearch } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
        ...(status !== 'all' ? { status } : {}),
      });
      const objectUrl = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = 'products-export.csv';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setImportSuccess('');
      setFormError(getErrorMessage(error, 'Unable to export products right now.'));
    }
  }

  function handleImportFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setFormError('');
    setImportSuccess('');
    importProductsMutation.mutate(file);
  }

  return (
    <div className="page-stack">
      <section className="metrics-grid">
        {metricCards.map((card) => {
          const Icon = card.icon;

          return (
            <article key={card.label} className={`metric-card metric-card--${card.tone}`}>
              <div className="metric-card__head">
                <span className="metric-card__icon">
                  <Icon size={18} />
                </span>
                <span className="metric-card__trend">{card.trend}</span>
              </div>
              <div className="metric-card__body">
                <small>{card.label}</small>
                <strong>{card.value}</strong>
                <p>{card.hint}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel-card filter-toolbar">
        <div className="panel-card__header">
          <div>
            <p className="section-tag">Catalog workspace</p>
            <h3>Find products, shape the result set, and jump into details.</h3>
          </div>
          <div className="filter-toolbar__actions">
            {hasActiveFilters ? (
              <button type="button" className="btn btn-light rounded-pill" onClick={resetFilters}>
                <FilterX size={16} />
                <span>Reset</span>
              </button>
            ) : null}
            {isAdmin ? (
              <>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="toolbar-file-input"
                  onChange={handleImportFileChange}
                />
                <button
                  type="button"
                  className="btn btn-light rounded-pill"
                  onClick={() => importInputRef.current?.click()}
                  disabled={importProductsMutation.isPending}
                >
                  <Upload size={16} />
                  <span>{importProductsMutation.isPending ? 'Importing...' : 'Import CSV'}</span>
                </button>
                <button type="button" className="btn btn-light rounded-pill" onClick={handleExportCsv}>
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
                <button type="button" className="btn btn-dark rounded-pill" onClick={openCreateModal}>
                  <CirclePlus size={16} />
                  <span>Add product</span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className="filter-toolbar__grid">
          <label className="search-shell">
            <Search size={18} />
            <input
              type="search"
              className="search-shell__input"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => {
                  setPage(1);
                  setSearch(value);
                });
              }}
              placeholder="Search by product name"
            />
          </label>

          <label className="filter-select">
            <span>Category</span>
            <select
              className="form-select"
              value={categoryId}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => {
                  setPage(1);
                  setCategoryId(value);
                });
              }}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-select">
            <span>Status</span>
            <select
              className="form-select"
              value={status}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => {
                  setPage(1);
                  setStatus(value);
                });
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-toolbar__summary">
          <div className="filter-toolbar__chips">
            <span className="filter-chip">
              <PackageSearch size={14} />
              {meta?.total ?? 0} tracked
            </span>
            {deferredSearch ? (
              <span className="filter-chip">
                <Search size={14} />
                "{deferredSearch}"
              </span>
            ) : null}
            {selectedCategoryName ? (
              <span className="filter-chip">
                <FolderTree size={14} />
                {selectedCategoryName}
              </span>
            ) : null}
            {status !== 'all' ? (
              <span className="filter-chip">
                <BadgeCheck size={14} />
                {status === 'active' ? 'Active' : 'Inactive'}
              </span>
            ) : null}
          </div>
          <span className="filter-toolbar__results">
            {products.length} result{products.length === 1 ? '' : 's'} on this page
          </span>
        </div>
      </section>

      {(productsQuery.isLoading || categoriesQuery.isLoading || allergensQuery.isLoading) ? (
        <LoadingBlock label="Loading the product workspace..." />
      ) : null}
      {productsQuery.isError ? <div className="alert alert-danger">{getErrorMessage(productsQuery.error)}</div> : null}
      {allergensQuery.isError ? <div className="alert alert-danger">{getErrorMessage(allergensQuery.error)}</div> : null}
      {formError ? <div className="alert alert-danger">{formError}</div> : null}
      {importSuccess ? <div className="alert alert-success">{importSuccess}</div> : null}

      {!productsQuery.isLoading && !products.length ? (
        <section className="empty-card">
          <h3>No products match this view</h3>
          <p>Try a wider filter range or create a new menu item to populate the catalog.</p>
        </section>
      ) : null}

      {products.length ? (
        <section className="content-grid">
          <div className="list-panel">
            <div className="list-panel__header">
              <div>
                <p className="section-tag">Product feed</p>
                <h3>Interactive product cards</h3>
              </div>
              <span className="list-panel__count">{meta?.total ?? products.length} total</span>
            </div>

            <div className="product-feed">
              {products.map((product) => (
                (() => {
                  const stockMeta = getStockMeta(product);

                  return (
                    <article
                      key={product.id}
                      className={`product-item ${selectedProduct?.id === product.id ? 'product-item--active' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedProductId(product.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedProductId(product.id);
                        }
                      }}
                    >
                      <div className="product-item__media">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} />
                        ) : (
                          <div className="product-item__placeholder">
                            <UtensilsCrossed size={18} />
                            <span>Menu visual ready</span>
                          </div>
                        )}
                      </div>

                      <div className="product-item__content">
                        <div className="product-item__meta">
                          <div className="product-item__badges">
                            <span className="product-chip">{product.category?.name ?? 'Uncategorized'}</span>
                            <span className={`stock-pill stock-pill--${product.stock_state}`}>{stockMeta.label}</span>
                          </div>
                          <StatusBadge active={product.is_active} />
                        </div>

                        <div className="product-item__title-row">
                          <strong>{product.name}</strong>
                          <span className="product-item__price">{formatCurrency(product.price)}</span>
                        </div>

                        <p className="product-item__description">
                          {product.description || 'Add a short menu description to improve readability.'}
                        </p>

                        {product.allergens?.length ? (
                          <div className="allergen-strip">
                            {product.allergens.slice(0, 3).map((allergen) => (
                              <span key={allergen.id} className="allergen-token" title={allergen.name}>
                                <span className="allergen-token__icon">{getAllergenCode(allergen)}</span>
                                <span>{allergen.name}</span>
                              </span>
                            ))}
                            {product.allergens.length > 3 ? (
                              <span className="allergen-token allergen-token--more">+{product.allergens.length - 3}</span>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="product-item__footer">
                          <span>Updated {formatDate(product.updated_at)}</span>
                          <span>{product.modifiers?.length ? `${product.modifiers.length} modifiers` : stockMeta.summary}</span>
                        </div>
                      </div>

                      {isAdmin ? (
                        <div className="product-item__actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-light rounded-pill"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(product);
                            }}
                          >
                            <Pencil size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(product);
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Archive</span>
                          </button>
                        </div>
                      ) : null}
                    </article>
                  );
                })()
              ))}
            </div>

            <Pagination meta={meta} onPageChange={setPage} />
          </div>

          <aside className="detail-panel">
            {selectedProduct ? (
              <>
                <div className="detail-panel__hero">
                  <div className="detail-panel__header-block">
                    <p className="section-tag">Product details</p>
                    <h3>{selectedProduct.name}</h3>
                    <p className="detail-panel__supporting">
                      Selected from the catalog feed. Use this panel to review content, stock, status, and media quality.
                    </p>
                  </div>
                  <div className="detail-panel__hero-badges">
                    <span className={`stock-pill stock-pill--${selectedProduct.stock_state}`}>{selectedStockMeta?.label}</span>
                    <StatusBadge active={selectedProduct.is_active} />
                  </div>
                </div>

                <div className="detail-panel__image">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} />
                  ) : (
                    <div className="detail-panel__empty-media">
                      <UtensilsCrossed size={22} />
                      <strong>Photo space is ready</strong>
                      <span>Add an image to make this menu item easier to scan.</span>
                    </div>
                  )}
                </div>

                {isAdmin ? (
                  <div className="detail-panel__actions">
                    <button type="button" className="btn btn-dark rounded-pill" onClick={() => openEditModal(selectedProduct)}>
                      <Pencil size={15} />
                      <span>Edit product</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger rounded-pill"
                      onClick={() => setDeleteTarget(selectedProduct)}
                    >
                      <Trash2 size={15} />
                      <span>Archive product</span>
                    </button>
                  </div>
                ) : null}

                <div className="detail-facts detail-facts--grid">
                  <div>
                    <span>Category</span>
                    <strong>{selectedProduct.category?.name ?? 'Uncategorized'}</strong>
                  </div>
                  <div>
                    <span>Price</span>
                    <strong>{formatCurrency(selectedProduct.price)}</strong>
                  </div>
                  <div>
                    <span>Stock level</span>
                    <strong>{selectedStockMeta?.summary}</strong>
                  </div>
                  <div>
                    <span>Inventory state</span>
                    <strong>{selectedStockMeta?.label}</strong>
                  </div>
                  <div>
                    <span>Updated</span>
                    <strong>{formatDate(selectedProduct.updated_at)}</strong>
                  </div>
                  <div>
                    <span>Product ID</span>
                    <strong>#{selectedProduct.id}</strong>
                  </div>
                </div>

                <section className="detail-copy">
                  <p className="section-tag">Inventory</p>
                  <p className="detail-panel__description">{selectedStockMeta?.detail}</p>
                </section>

                {selectedProduct.allergens?.length ? (
                  <section className="detail-copy">
                    <p className="section-tag">Allergens</p>
                    <div className="allergen-strip allergen-strip--detail">
                      {selectedProduct.allergens.map((allergen) => (
                        <span key={allergen.id} className="allergen-token allergen-token--detail">
                          <span className="allergen-token__icon">{getAllergenCode(allergen)}</span>
                          <span>{allergen.name}</span>
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                {selectedProduct.modifiers?.length ? (
                  <section className="detail-copy">
                    <p className="section-tag">Modifiers</p>
                    <div className="modifier-summary">
                      {selectedProduct.modifiers.map((modifier) => (
                        <div key={modifier.id} className="modifier-summary__item">
                          <span>{modifier.name}</span>
                          <strong>
                            {modifier.price_adjustment > 0 ? '+' : ''}
                            {formatCurrency(modifier.price_adjustment)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="detail-copy">
                  <p className="section-tag">Description</p>
                  <p className="detail-panel__description">
                    {selectedProduct.description || 'No description yet. Add a short summary to help staff and managers scan the menu faster.'}
                  </p>
                </section>
              </>
            ) : null}
          </aside>
        </section>
      ) : null}

      {formState.isOpen ? (
        <ProductFormModal
          key={`${formState.mode}-${formState.product?.id ?? 'new'}`}
          allergens={allergens}
          categories={categories}
          isOpen={formState.isOpen}
          isSaving={saveProductMutation.isPending}
          mode={formState.mode}
          onClose={() => {
            setFormState(emptyFormState);
            setFormError('');
            setValidationErrors({});
          }}
          onSubmit={handleSubmitProduct}
          product={formState.product}
          validationErrors={validationErrors}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Archive"
        isOpen={Boolean(deleteTarget)}
        isPending={deleteProductMutation.isPending}
        message={
          deleteTarget
            ? `The product "${deleteTarget.name}" will be soft deleted and removed from the active workflow.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteProductMutation.mutate(deleteTarget.id)}
        title="Archive this product?"
      />
    </div>
  );
}
