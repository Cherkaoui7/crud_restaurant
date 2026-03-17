import {
  ArrowRight,
  Boxes,
  ChevronRight,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Package2,
  Settings2,
  ShieldCheck,
  Tags,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { InteractiveBrandMark } from './InteractiveBrandMark';

const navigationItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Vue globale du catalogue',
  },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: Boxes,
    description: 'Stock alerts and restock watch',
  },
  {
    to: '/products',
    label: 'Produits',
    icon: Package2,
    description: 'Catalogue, prix et disponibilite',
  },
  {
    to: '/categories',
    label: 'Categories',
    icon: Tags,
    description: 'Organisation du menu',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: Settings2,
    description: 'Compte et securite',
  },
];

const pageMeta = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Monitor product visibility, category coverage, and overall menu health.',
  },
  '/products': {
    title: 'Catalogue produits',
    subtitle: 'Oversee menu items, pricing, availability, and product visuals.',
  },
  '/inventory': {
    title: 'Inventory watch',
    subtitle: 'Track low-stock thresholds, urgent restocks, and stock health across the menu.',
  },
  '/categories': {
    title: 'Gestion des categories',
    subtitle: 'Keep the menu structure clean, consistent, and easy to scale.',
  },
  '/profile': {
    title: 'Profile',
    subtitle: 'Update account details and strengthen your sign-in security.',
  },
};

export function AppShell() {
  const location = useLocation();
  const { isAdmin, logout, user } = useAuth();
  const currentPage = pageMeta[location.pathname] ?? {
    title: 'Restaurant Dashboard',
    subtitle: 'Operational overview for your restaurant menu.',
  };

  return (
    <div className="app-shell">
      <aside className="shell-sidebar">
        <div className="brand-panel">
          <div className="brand-panel__eyebrow">
            <LayoutGrid size={16} />
            Resto Manager
          </div>
          <InteractiveBrandMark compact label="Resto Signal" showMeta={false} />
          <div className="brand-panel__identity">
            <strong className="brand-panel__signal">Resto Signal</strong>
            <span className="brand-panel__signal-note">Interactive 3D brand mark</span>
          </div>
          <h1 className="brand-panel__title">Restaurant menu control center.</h1>
          <p className="brand-panel__copy">
            Manage products, categories, pricing, and availability from one dashboard.
          </p>
          <NavLink to="/dashboard" className="btn btn-brand rounded-pill brand-panel__cta">
            <span>Start managing</span>
            <ArrowRight size={16} />
          </NavLink>
        </div>

        <nav className="shell-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-tile ${isActive ? 'nav-tile--active' : ''}`
                }
              >
                <span className="nav-tile__icon">
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <span className="nav-tile__arrow">
                  <ChevronRight size={16} />
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <div className="sidebar-note__header">
            <span className={`role-pill ${isAdmin ? 'role-pill--admin' : 'role-pill--employee'}`}>
              {isAdmin ? 'Admin access' : 'Read only'}
            </span>
            <span className="sidebar-note__icon">
              <ShieldCheck size={16} />
            </span>
          </div>
          <strong className="sidebar-note__title">{isAdmin ? 'Privileges enabled' : 'Protected browsing'}</strong>
          <p>
            {isAdmin
              ? 'Create, edit, archive, and organize the entire menu from one place.'
              : 'Browse the live catalog safely without changing menu data.'}
          </p>
        </div>
      </aside>

      <main className="shell-main">
        <header className="shell-topbar">
          <div className="shell-topbar__intro">
            <p className="shell-topbar__label">Tableau de bord</p>
            <h2 className="shell-topbar__title">{currentPage.title}</h2>
            <p className="shell-topbar__subtitle">{currentPage.subtitle}</p>
          </div>

          <div className="shell-topbar__actions">
            <div className="user-chip">
              <span className="user-chip__avatar">{user?.name?.charAt(0) ?? 'R'}</span>
              <div>
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
              </div>
            </div>

            <button type="button" className="btn btn-outline-dark rounded-pill" onClick={logout}>
              <LogOut size={16} />
              <span>Deconnexion</span>
            </button>
          </div>
        </header>

        <div className="shell-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
