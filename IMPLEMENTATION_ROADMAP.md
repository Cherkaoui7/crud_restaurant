# Resto Manager Implementation Roadmap

## Current Goal

Upgrade the product manager into a broader restaurant operations platform in phased releases, starting with inventory management because the app already tracks product stock.

## Phase Order

### Phase 1

- Inventory management
  - Add configurable low-stock thresholds per product
  - Surface low-stock and out-of-stock alerts
  - Add an inventory-focused dashboard or page for managers
- Public menu
  - Expose a read-only customer menu without authentication
  - Reuse active product data already managed in the admin
- QR codes
  - Generate QR links to the public menu once the public route exists

### Phase 2

- Order management
  - Create orders
  - Track order status
  - Link order lines to products
- Advanced analytics
  - Sales summaries
  - Popular items
  - Revenue trends

### Phase 3

- Discounts and promotions
- Recipe and ingredient management
- Staff management
- Email notifications
- Product bundles

### Phase 4

- Dark mode
- Tablet and kitchen-oriented responsive workflow
- Advanced search
- Backup and restore
- Audit log

## Implementation Status

- Completed previously
  - Dashboard
  - Profile management
  - Allergens and modifiers
  - CSV import and export
  - Product stock quantity and stock-state display
- In progress now
  - Inventory thresholds and alert workflow
- Not started
  - Public menu
  - QR code generation
  - Order management
  - Advanced analytics
  - All remaining roadmap items
