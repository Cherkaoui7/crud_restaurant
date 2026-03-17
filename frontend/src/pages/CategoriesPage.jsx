import { startTransition, useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  CirclePlus,
  FilterX,
  FolderTree,
  Layers3,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../api/categories';
import { CategoryFormModal } from '../components/CategoryFormModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingBlock } from '../components/LoadingBlock';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, getValidationErrors } from '../utils/http';

const emptyModalState = {
  isOpen: false,
  mode: 'create',
  category: null,
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState(emptyModalState);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formError, setFormError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const deferredSearch = useDeferredValue(search);

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const categories = categoriesQuery.data?.data ?? [];
  const visibleCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(deferredSearch.toLowerCase()),
  );
  const usedCategories = categories.filter((category) => Number(category.product_count) > 0).length;
  const emptyCategories = categories.length - usedCategories;
  const totalProductsLinked = categories.reduce((sum, category) => sum + Number(category.product_count), 0);
  const averageProductsPerCategory = categories.length ? (totalProductsLinked / categories.length).toFixed(1) : '0.0';
  const maxCount = Math.max(...categories.map((category) => Number(category.product_count)), 1);

  const metricCards = [
    {
      label: 'Category map',
      value: categories.length,
      hint: 'Distinct sections in your menu',
      trend: `${visibleCategories.length} visible`,
      icon: FolderTree,
      tone: 'teal',
    },
    {
      label: 'In use',
      value: usedCategories,
      hint: 'Categories linked to at least one product',
      trend: usedCategories === categories.length ? 'Fully assigned' : 'Can be improved',
      icon: BadgeCheck,
      tone: 'green',
    },
    {
      label: 'Ready to clean',
      value: emptyCategories,
      hint: 'Unused categories that can be archived',
      trend: emptyCategories ? 'Maintenance pending' : 'Clean structure',
      icon: Layers3,
      tone: 'amber',
    },
    {
      label: 'Avg products',
      value: averageProductsPerCategory,
      hint: 'Average products per category',
      trend: `${totalProductsLinked} linked products`,
      icon: FolderTree,
      tone: 'blue',
    },
  ];

  const saveCategoryMutation = useMutation({
    mutationFn: ({ mode, payload, categoryId }) =>
      mode === 'create' ? createCategory(payload) : updateCategory(categoryId, payload),
    onSuccess: () => {
      setModalState(emptyModalState);
      setFormError('');
      setValidationErrors({});
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      setFormError(getErrorMessage(error, 'Unable to save the category.'));
      setValidationErrors(getValidationErrors(error));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  function openCreateModal() {
    setFormError('');
    setValidationErrors({});
    setModalState({
      isOpen: true,
      mode: 'create',
      category: null,
    });
  }

  function openEditModal(category) {
    setFormError('');
    setValidationErrors({});
    setModalState({
      isOpen: true,
      mode: 'edit',
      category,
    });
  }

  function resetSearch() {
    startTransition(() => {
      setSearch('');
    });
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
            <p className="section-tag">Category system</p>
            <h3>Search, organize, and prune the menu structure.</h3>
          </div>
          <div className="filter-toolbar__actions">
            {deferredSearch ? (
              <button type="button" className="btn btn-light rounded-pill" onClick={resetSearch}>
                <FilterX size={16} />
                <span>Reset</span>
              </button>
            ) : null}
            {isAdmin ? (
              <button type="button" className="btn btn-dark rounded-pill" onClick={openCreateModal}>
                <CirclePlus size={16} />
                <span>Add category</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="filter-toolbar__grid filter-toolbar__grid--single">
          <label className="search-shell">
            <Search size={18} />
            <input
              type="search"
              className="search-shell__input"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                startTransition(() => {
                  setSearch(value);
                });
              }}
              placeholder="Search categories"
            />
          </label>
        </div>

        <div className="filter-toolbar__summary">
          <div className="filter-toolbar__chips">
            <span className="filter-chip">
              <FolderTree size={14} />
              {categories.length} total
            </span>
            {deferredSearch ? (
              <span className="filter-chip">
                <Search size={14} />
                "{deferredSearch}"
              </span>
            ) : null}
          </div>
          <span className="filter-toolbar__results">
            {visibleCategories.length} result{visibleCategories.length === 1 ? '' : 's'}
          </span>
        </div>
      </section>

      {categoriesQuery.isLoading ? <LoadingBlock label="Loading category structure..." /> : null}
      {categoriesQuery.isError ? <div className="alert alert-danger">{getErrorMessage(categoriesQuery.error)}</div> : null}
      {formError ? <div className="alert alert-danger">{formError}</div> : null}

      <section className="categories-grid categories-grid--enhanced">
        {visibleCategories.map((category) => {
          const count = Number(category.product_count);
          const fillWidth = `${Math.max(10, Math.round((count / maxCount) * 100))}%`;

          return (
            <article key={category.id} className="category-card category-card--enhanced">
              <div className="category-card__top">
                <span className="category-card__icon">
                  <FolderTree size={18} />
                </span>
                <div className="category-card__heading">
                  <p className="section-tag">Category</p>
                  <h3>{category.name}</h3>
                </div>
                <span className="count-badge">{count} products</span>
              </div>

              <p className="category-card__copy">
                {count > 0
                  ? 'This category is active in the menu and currently linked to live products.'
                  : 'No products are assigned yet. This category is ready for cleanup or future use.'}
              </p>

              <div className="category-card__meter">
                <div className="category-card__meter-meta">
                  <span>{count > 0 ? 'Usage intensity' : 'Unused slot'}</span>
                  <strong>{count > 0 ? `${count} linked items` : '0 linked items'}</strong>
                </div>
                <div className="category-card__meter-track">
                  <span style={{ width: fillWidth }} />
                </div>
              </div>

              {isAdmin ? (
                <div className="category-card__actions">
                  <button type="button" className="btn btn-light rounded-pill" onClick={() => openEditModal(category)}>
                    <Pencil size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger rounded-pill"
                    onClick={() => setDeleteTarget(category)}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}

        {!categoriesQuery.isLoading && !visibleCategories.length ? (
          <article className="empty-card">
            <h3>No category matches this search</h3>
            <p>Try a different keyword or create a new category to expand the menu map.</p>
          </article>
        ) : null}
      </section>

      {modalState.isOpen ? (
        <CategoryFormModal
          key={`${modalState.mode}-${modalState.category?.id ?? 'new'}`}
          category={modalState.category}
          isOpen={modalState.isOpen}
          isSaving={saveCategoryMutation.isPending}
          mode={modalState.mode}
          onClose={() => {
            setModalState(emptyModalState);
            setFormError('');
            setValidationErrors({});
          }}
          onSubmit={(payload) =>
            saveCategoryMutation.mutate({
              mode: modalState.mode,
              payload,
              categoryId: modalState.category?.id,
            })
          }
          validationErrors={validationErrors}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Delete"
        isOpen={Boolean(deleteTarget)}
        isPending={deleteCategoryMutation.isPending}
        message={
          deleteTarget
            ? `The category "${deleteTarget.name}" will be deleted if it is no longer assigned to products.`
            : ''
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteCategoryMutation.mutate(deleteTarget.id)}
        title="Delete this category?"
      />
    </div>
  );
}
