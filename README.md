# CRUD Restaurant Product Manager

A comprehensive web application for managing restaurant products, categories, and menus. Built with **Laravel API (PHP)**, **SQLite**, and **React**.

## 🚀 Features

The application provides a fully-featured dashboard and management system with two main roles:
- `admin`: Full CRUD access to all features (Dashboard, Products, Categories, Profile).
- `employee`: Read-only access to view the menu and dashboard stats.

### Core Modules
- **📊 Analytics Dashboard**: A landing page providing high-level statistics on total products, active/inactive items, and total categories.
- **🍔 Advanced Product Management**:
  - Full CRUD operations with soft deletes and image uploads.
  - Tag products with **Allergens** (e.g., Gluten, Dairy) with visual icons.
  - Add **Modifiers & Sizes** (e.g., "Large upsize +$2.00").
  - Filter, search, and pagination.
- **📂 Category Management**: Create and manage categories. Categories cannot be deleted if they are linked to existing products.
- **📥 Import / Export**: Quickly download the product catalog as a CSV, or upload a CSV to create products in bulk.
- **👤 User Profiles**: Manage account details and change passwords directly from the app.
- **✨ Modern UI/UX**: Built with React Query for instant data fetching, featuring a polished custom design system with rich micro-animations.

## 🛠️ Tech Stack

- **Backend**: Laravel 12 + SQLite + Sanctum (Token Auth)
- **Frontend**: React 19 + Vite + React Query + Custom CSS UI

---

## 💻 Installation & Setup

### 1. Backend (Laravel)

```powershell
cd backend
composer install
Copy-Item .env.example .env -Force
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve
```
*The API starts by default on `http://127.0.0.1:8000`.*

### 2. Frontend (React)

```powershell
cd frontend
npm install
Copy-Item .env.example .env -Force
npm run dev
```
*The React Vite app starts by default on `http://127.0.0.1:5173`.*

---

## 🔑 Demonstration Accounts

If you ran the database seeder (`php artisan migrate:fresh --seed`), the following test accounts are available:

- **Admin**: `admin@restaurant.test` / `password`
- **Employee**: `employee@restaurant.test` / `password`

---

## 🔌 Core API Routes

### Authentication & Profile
- `POST /api/login`
- `GET /api/me`
- `POST /api/logout`
- `PUT /api/profile`
- `PUT /api/profile/password`

### Dashboard & Analytics
- `GET /api/dashboard/stats`

### Products & Categories
- `GET /api/products` (Supports `page`, `search`, `category_id`, `status`)
- `POST /api/products` (Multipart form-data for images, allergens, & modifiers)
- `GET/POST /api/products/export/csv` & `/api/products/import/csv`
- `GET /api/categories` & `GET /api/allergens`

---

## 💾 Data Architecture

- **`categories`**: `id`, `name`
- **`allergens`**: `id`, `name`, `icon`
- **`products`**: `id`, `name`, `description`, `price`, `category_id`, `image_path`, `is_active`
- **`product_modifiers`**: `id`, `product_id`, `name`, `price_adjustment`
- **`allergen_product`**: Pivot table mapping Many-to-Many products and allergens.
- **`users`**: `id`, `name`, `email`, `role`, `password`

---

## 🧪 Testing & Verification

### Run Backend Tests
```powershell
cd backend
php artisan test
```

### Run Frontend Linter & Build
```powershell
cd frontend
npm run lint
npm run build
```
