import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { getPublicMenu } from '../api/publicMenu';
import { formatCurrency } from '../utils/format';
import { getErrorMessage } from '../utils/http';
import { LoadingBlock } from '../components/LoadingBlock';

export function PublicMenuPage() {
  const [activeCategory, setActiveCategory] = useState(null);

  const menuQuery = useQuery({
    queryKey: ['publicMenu'],
    queryFn: getPublicMenu,
  });

  if (menuQuery.isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <LoadingBlock label="Loading menu..." />
      </div>
    );
  }

  if (menuQuery.isError) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light text-center p-4">
        <div className="alert alert-danger shadow-sm border-0">
          <i className="bi bi-exclamation-triangle-fill fs-3 d-block mb-3"></i>
          <h4>Unable to load the menu</h4>
          <p className="mb-0">{getErrorMessage(menuQuery.error)}</p>
          <button 
            className="btn btn-outline-danger mt-3 rounded-pill px-4"
            onClick={() => menuQuery.refetch()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const categories = menuQuery.data?.data || [];
  
  // Set default category
  if (categories.length > 0 && activeCategory === null) {
    setActiveCategory(categories[0].id);
  }

  if (categories.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light text-center p-4">
        <div className="text-muted">
          <i className="bi bi-cup-hot-fill fs-1 d-block mb-3 opacity-50"></i>
          <h2>Menu Empty</h2>
          <p>We are still preparing our menu. Please check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-menu-container bg-light min-vh-100 pb-5">
      {/* Header */}
      <div className="bg-white shadow-sm sticky-top">
        <div className="container py-3 text-center">
          <h1 className="h4 mb-0 fw-bold">Our Menu</h1>
        </div>
        
        {/* Category Navigation Scroll */}
        <div className="container px-0">
          <div className="d-flex overflow-auto px-3 py-2 category-scroll no-scrollbar" style={{ whiteSpace: 'nowrap', gap: '8px', scrollbarWidth: 'none' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`btn rounded-pill px-4 py-2 fw-medium ${activeCategory === cat.id ? 'btn-dark' : 'btn-outline-secondary border-0 bg-light'}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`category-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="container mt-4 px-3 px-md-4">
        {categories.map((category) => (
          <div key={category.id} id={`category-${category.id}`} className="mb-5 menu-section">
            <h2 className="h5 fw-bold mb-4 pb-2 border-bottom">{category.name}</h2>
            
            <div className="row g-4">
              {category.products.map((product) => (
                <div key={product.id} className="col-12 col-md-6 col-lg-4">
                  <div className="card h-100 border-0 shadow-sm recipe-card overflow-hidden">
                    {product.image_path && (
                      <div className="position-relative" style={{ height: '200px', backgroundColor: '#f8f9fa' }}>
                        <img 
                          src={product.image_path} 
                          alt={product.name}
                          className="w-100 h-100 object-fit-cover"
                        />
                      </div>
                    )}
                    
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h3 className="h6 fw-bold mb-0 text-dark flex-grow-1 pe-3">{product.name}</h3>
                        <span className="fw-bold text-primary">{formatCurrency(product.price)}</span>
                      </div>
                      
                      {product.description && (
                         <p className="text-secondary small mb-3 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {product.description}
                         </p>
                      )}

                      {/* Modifiers & Allergens Row */}
                      <div className="mt-auto d-flex flex-wrap gap-2 pt-2 border-top">
                        {product.modifiers?.length > 0 && (
                          <div className="dropdown w-100 mb-2">
                            <button className="btn btn-sm btn-light w-100 text-start d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <span className="small text-muted"><i className="bi bi-plus-circle me-1"></i> {product.modifiers.length} Customizations</span>
                              <i className="bi bi-chevron-down small"></i>
                            </button>
                            <ul className="dropdown-menu w-100 shadow-sm border-0 py-1">
                              {product.modifiers.map(mod => (
                                <li key={mod.id} className="dropdown-item d-flex justify-content-between small px-3 py-2">
                                  <span>{mod.name}</span>
                                  <span className="text-muted">{mod.price_adjustment > 0 ? `+${formatCurrency(mod.price_adjustment)}` : formatCurrency(mod.price_adjustment)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {product.allergens?.map(allergen => (
                          <span key={allergen.id} className="badge bg-light text-dark border fw-normal" title={allergen.name}>
                            <span className="me-1">{(allergen.icon || allergen.name).slice(0, 2).toUpperCase()}</span>
                            {allergen.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Style overrides for hiding scrollbar on category nav */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .recipe-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .recipe-card:hover { transform: translateY(-4px); box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important; }
      `}} />
    </div>
  );
}
