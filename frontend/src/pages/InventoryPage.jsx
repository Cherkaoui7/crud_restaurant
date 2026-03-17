import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, BadgeCheck, CircleOff, Package2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getInventoryAlerts } from '../api/inventory';
import { LoadingBlock } from '../components/LoadingBlock';
import { StatusBadge } from '../components/StatusBadge';
import { getErrorMessage } from '../utils/http';

function getStockMeta(product) {
  const quantity = Number(product.stock_quantity ?? 0);

  switch (product.stock_state) {
    case 'out':
      return {
        label: 'Out of stock',
        detail: 'Restock before this item can return to service.',
      };
    case 'low':
      return {
        label: 'Low stock',
        detail: `${quantity} left before the threshold is exceeded further.`,
      };
    default:
      return {
        label: 'In stock',
        detail: `${quantity} available for service.`,
      };
  }
}

export function InventoryPage() {
  const inventoryQuery = useQuery({
    queryKey: ['inventory', 'alerts'],
    queryFn: getInventoryAlerts,
  });

  const inventory = inventoryQuery.data ?? {
    total_products: 0,
    in_stock_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    urgent_products: [],
  };

  const urgentProducts = inventory.urgent_products ?? [];
  const alertsCount = inventory.low_stock_products + inventory.out_of_stock_products;

  const metricCards = [
    {
      label: 'Tracked inventory',
      value: inventory.total_products,
      hint: 'Products monitored for stock and threshold state',
      tone: 'teal',
      icon: Package2,
      trend: 'Inventory watch enabled',
    },
    {
      label: 'Healthy stock',
      value: inventory.in_stock_products,
      hint: 'Products currently above their low-stock threshold',
      tone: 'green',
      icon: BadgeCheck,
      trend: alertsCount ? `${alertsCount} alerts open` : 'No alerts open',
    },
    {
      label: 'Low stock',
      value: inventory.low_stock_products,
      hint: 'Products that need restocking soon',
      tone: 'amber',
      icon: AlertTriangle,
      trend: inventory.low_stock_products ? 'Restock queue active' : 'No low stock items',
    },
    {
      label: 'Out of stock',
      value: inventory.out_of_stock_products,
      hint: 'Products already unavailable in inventory',
      tone: 'violet',
      icon: CircleOff,
      trend: inventory.out_of_stock_products ? 'Immediate action needed' : 'Nothing blocked',
    },
  ];

  return (
    <div className="page-stack">
      <section className="panel-card inventory-hero">
        <div className="inventory-hero__copy">
          <p className="section-tag">Inventory watch</p>
          <h3>Stay ahead of stock issues before service slows down.</h3>
          <p>
            Track low-stock thresholds, review urgent products, and jump back into the catalog to update quantities or
            restock decisions.
          </p>
        </div>

        <div className="dashboard-hero__chips">
          <span className="filter-chip">{inventory.total_products} monitored items</span>
          <span className="filter-chip">{alertsCount ? `${alertsCount} active alerts` : 'All items healthy'}</span>
        </div>
      </section>

      {inventoryQuery.isLoading ? <LoadingBlock label="Loading inventory alerts..." /> : null}
      {inventoryQuery.isError ? <div className="alert alert-danger">{getErrorMessage(inventoryQuery.error)}</div> : null}

      {!inventoryQuery.isLoading ? (
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

          <section className="content-grid">
            <div className="list-panel inventory-panel">
              <div className="list-panel__header">
                <div>
                  <p className="section-tag">Restock queue</p>
                  <h3>Products that need inventory attention</h3>
                </div>
                <span className="list-panel__count">{urgentProducts.length} urgent</span>
              </div>

              {urgentProducts.length ? (
                <div className="inventory-alert-list">
                  {urgentProducts.map((product) => {
                    const stockMeta = getStockMeta(product);

                    return (
                      <article key={product.id} className="inventory-alert-item">
                        <div className="inventory-alert-item__content">
                          <div className="inventory-alert-item__header">
                            <div>
                              <p className="inventory-alert-item__eyebrow">{product.category?.name ?? 'Uncategorized'}</p>
                              <h4>{product.name}</h4>
                            </div>
                            <div className="inventory-alert-item__badges">
                              <span className={`stock-pill stock-pill--${product.stock_state}`}>{stockMeta.label}</span>
                              <StatusBadge active={product.is_active} />
                            </div>
                          </div>

                          <p className="inventory-alert-item__copy">{stockMeta.detail}</p>

                          <div className="inventory-alert-item__facts">
                            <span>Stock: {product.stock_quantity}</span>
                            <span>Threshold: {product.low_stock_threshold}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <section className="empty-card">
                  <h3>No inventory alerts</h3>
                  <p>All products are currently above their configured low-stock threshold.</p>
                </section>
              )}
            </div>

            <aside className="detail-panel inventory-side-panel">
              <div className="detail-panel__header-block">
                <p className="section-tag">Manager actions</p>
                <h3>Keep inventory aligned with the live menu</h3>
                <p className="detail-panel__supporting">
                  Review threshold settings in the product form and update stock counts as deliveries or kitchen usage
                  change through the day.
                </p>
              </div>

              <div className="detail-facts detail-facts--grid">
                <div>
                  <span>Healthy items</span>
                  <strong>{inventory.in_stock_products}</strong>
                </div>
                <div>
                  <span>Low stock</span>
                  <strong>{inventory.low_stock_products}</strong>
                </div>
                <div>
                  <span>Out of stock</span>
                  <strong>{inventory.out_of_stock_products}</strong>
                </div>
                <div>
                  <span>Open alerts</span>
                  <strong>{alertsCount}</strong>
                </div>
              </div>

              <div className="inventory-side-panel__links">
                <Link to="/products" className="dashboard-link">
                  <span className="dashboard-link__icon">
                    <Package2 size={18} />
                  </span>
                  <span className="dashboard-link__body">
                    <strong>Open products</strong>
                    <small>Update stock quantities and thresholds in the product workflow.</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>

                <Link to="/dashboard" className="dashboard-link">
                  <span className="dashboard-link__icon">
                    <BadgeCheck size={18} />
                  </span>
                  <span className="dashboard-link__body">
                    <strong>Back to dashboard</strong>
                    <small>Return to the broader menu and availability overview.</small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </aside>
          </section>
        </>
      ) : null}
    </div>
  );
}
