import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="screen-loader">
      <h1 className="mb-3">Page introuvable</h1>
      <p className="mb-4">Le contenu demande n'existe pas ou plus.</p>
      <Link to="/products" className="btn btn-dark rounded-pill">
        Revenir au catalogue
      </Link>
    </div>
  );
}
