import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CircleOff,
  FolderTree,
  LayoutDashboard,
  PackageSearch,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../api/dashboard';
import { LoadingBlock } from '../components/LoadingBlock';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/http';

export function DashboardPage() {
  const { isAdmin, user } = useAuth();
  const statsQuery = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
  });

  const stats = statsQuery.data ?? {
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
    total_categories: 0,
    in_stock_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
  };

  const activeRatio = stats.total_products
    ? Math.round((stats.active_products / stats.total_products) * 100)
    : 0;
  const inactiveRatio = 100 - activeRatio;
  const inventoryAlerts = stats.low_stock_products + stats.out_of_stock_products;

  const metricCards = [
    {
      label: 'Tracked products',
      value: stats.total_products,
      hint: 'Products currently managed in the catalog',
      trend: `${stats.total_categories} categories`,
      tone: 'teal',
      icon: PackageSearch,
    },
    {
      label: 'Active now',
      value: stats.active_products,
      hint: 'Visible and available in the current menu',
      trend: activeRatio ? `${activeRatio}% live` : 'No live items',
      tone: 'green',
      icon: BadgeCheck,
    },
    {
      label: 'Inactive items',
      value: stats.inactive_products,
      hint: 'Hidden items waiting for review or relaunch',
      trend: stats.inactive_products ? 'Needs attention' : 'Nothing pending',
      tone: 'amber',
      icon: CircleOff,
    },
    {
      label: 'Category map',
      value: stats.total_categories,
      hint: 'Menu structure ready for scaling and cleanup',
      trend: stats.total_categories ? 'Organized' : 'Start grouping items',
      tone: 'blue',
      icon: FolderTree,
    },
  ];

  return (
    <div className="page-stack">
      <section className="panel-card dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="section-tag">
            <LayoutDashboard size={14} />
            Menu overview
          </p>
          <h3>Welcome back, {user?.name?.split(' ')[0] ?? 'manager'}.</h3>
          <p>
            This dashboard gives you a quick read on product visibility, menu structure, and what needs action before
            service starts.
          </p>
        </div>

        <div className="dashboard-hero__chips">
          <span className="filter-chip">{isAdmin ? 'Admin workflow enabled' : 'Read-only session'}</span>
          <span className="filter-chip">{stats.total_products} products tracked</span>
          <span className="filter-chip">{inventoryAlerts ? `${inventoryAlerts} inventory alerts` : 'Inventory stable'}</span>
        </div>
      </section>

      {statsQuery.isLoading ? <LoadingBlock label="Loading dashboard insights..." /> : null}
      {statsQuery.isError ? <div className="alert alert-danger">{getErrorMessage(statsQuery.error)}</div> : null}

      {!statsQuery.isLoading ? (
        <>
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

          <section className="dashboard-grid">
            <article className="panel-card insight-panel">
              <div className="panel-card__header">
                <div>
                  <p className="section-tag">Menu health</p>
                  <h3>Catalog availability snapshot</h3>
                </div>
                <span className="list-panel__count">{activeRatio}% active</span>
              </div>

              <div className="dashboard-health">
                <div className="dashboard-health__ring-wrap">
                  <div className="dashboard-health__ring" style={{ '--dashboard-progress': `${activeRatio}%` }}>
                    <div className="dashboard-health__ring-center">
                      <strong>{activeRatio}%</strong>
                      <span>live</span>
                    </div>
                  </div>
                </div>

                <div className="dashboard-health__details">
                  <div className="dashboard-health__item">
                    <div>
                      <strong>Active products</strong>
                      <p>Ready for the menu right now.</p>
                    </div>
                    <span>{stats.active_products}</span>
                  </div>
                  <div className="progress-rail">
                    <span className="progress-rail__fill progress-rail__fill--teal" style={{ width: `${activeRatio}%` }} />
                  </div>

                  <div className="dashboard-health__item">
                    <div>
                      <strong>Inactive products</strong>
                      <p>Not currently visible to staff or customers.</p>
                    </div>
                    <span>{stats.inactive_products}</span>
                  </div>
                  <div className="progress-rail">
                    <span
                      className="progress-rail__fill progress-rail__fill--amber"
                      style={{ width: `${stats.total_products ? inactiveRatio : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </article>

            <article className="panel-card dashboard-actions">
              <div className="panel-card__header">
                <div>
                  <p className="section-tag">Quick actions</p>
                  <h3>Jump into the next task</h3>
                </div>
              </div>

              <div className="dashboard-actions__grid">
                <Link to="/products" className="dashboard-link">
                  <span className="dashboard-link__icon">
                    <PackageSearch size={18} />
                  </span>
                  <span className="dashboard-link__body">
                    <strong>Open products</strong>
                    <small>Review pricing, visibility, and media.</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/categories" className="dashboard-link">
                  <span className="dashboard-link__icon">
                    <FolderTree size={18} />
                  </span>
                  <span className="dashboard-link__body">
                    <strong>Open categories</strong>
                    <small>Clean up menu sections and assignments.</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/inventory" className="dashboard-link">
                  <span className="dashboard-link__icon">
                    <Boxes size={18} />
                  </span>
                  <span className="dashboard-link__body">
                    <strong>Open inventory</strong>
                    <small>Review thresholds, low stock, and urgent restocks.</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              <div className="dashboard-summary">
                <div className="dashboard-summary__item">
                  <span>Coverage</span>
                  <strong>{stats.total_products ? `${activeRatio}% catalog live` : 'No products yet'}</strong>
                </div>
                <div className="dashboard-summary__item">
                  <span>Structure</span>
                  <strong>{stats.total_categories} category groups available</strong>
                </div>
                <div className="dashboard-summary__item">
                  <span>Inventory</span>
                  <strong>{inventoryAlerts ? `${inventoryAlerts} products need stock attention` : 'No stock alerts right now'}</strong>
                </div>
              </div>
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
