# Task Status

## Completed In This Pass

### Planning

- Added a roadmap file at `IMPLEMENTATION_ROADMAP.md`
- Ordered the requested feature set into phased delivery
- Chose inventory management as the first implementation slice because stock support already existed

### Backend

- Added `low_stock_threshold` to products
- Updated product validation, model casting, API resource output, CSV import, and CSV export
- Added inventory-aware dashboard stats
- Added a new authenticated endpoint: `GET /api/inventory/alerts`
- Seeded products with threshold values so inventory alerts are visible in demo data

### Frontend

- Added a new Inventory page and sidebar navigation entry
- Added inventory API integration
- Updated the dashboard with inventory alert visibility and a quick link to inventory
- Extended the product create/edit modal with:
  - stock quantity
  - low-stock threshold
  - live stock-state feedback
- Extended the products page with:
  - inventory filter
  - stock threshold visibility in product details
  - stock badges in the list and detail panel

### Verification

- `php artisan migrate --force`
- `php artisan db:seed --force`
- `php artisan test`
- `npm run lint`
- `npm run build`

## Still Missing From The Roadmap

### Phase 1

- Public read-only menu
- QR code generation for the public menu

### Phase 2

- Order management
- Advanced sales analytics

### Phase 3

- Discounts and promotions
- Recipe and ingredient tracking
- Staff management
- Email notifications
- Product bundles

### Phase 4

- Dark mode
- Mobile and tablet workflow enhancements
- Advanced search
- Backup and restore
- Audit log

## Recommended Next Step

Implement the public menu next, then attach QR code generation to that public route. That keeps phase 1 coherent and unlocks customer-facing value before moving into order management.
