import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { LockKeyhole, UtensilsCrossed } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { InteractiveBrandMark } from '../components/InteractiveBrandMark';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/http';

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: 'admin@restaurant.test',
    password: 'password',
  });
  const [errorMessage, setErrorMessage] = useState('');

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      const destination = location.state?.from ?? '/dashboard';
      navigate(destination, { replace: true });
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error, 'Connexion impossible.'));
    },
  });

  function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    loginMutation.mutate(form);
  }

  return (
    <div className="login-layout">
      <section className="login-hero">
        <div className="login-hero__badge">
          <UtensilsCrossed size={16} />
          Restaurant dashboard
        </div>
        <h1 className="login-hero__title">Gerez le menu, les prix et la disponibilite depuis une seule interface.</h1>
        <p className="login-hero__copy">
          Concu pour les restaurants qui veulent garder leur catalogue propre, rapide a mettre a jour et simple a
          consulter sur mobile comme sur desktop.
        </p>

        <InteractiveBrandMark label="Restaurant Motion Logo" />

        <div className="hero-credentials">
          <div>
            <span>Admin</span><br></br>
            <strong>admin@restaurant.test / password</strong>
          </div>
          <div>
            <span>Employe</span>
            <strong>employee@restaurant.test / password</strong>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card__header">
            <div className="login-card__icon">
              <LockKeyhole size={20} />
            </div>
            <div>
              <p className="section-tag">Connexion</p>
              <h2>Acceder au back-office</h2>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleSubmit}>
            <div>
              <label className="form-label">Adresse e-mail</label>
              <input
                type="email"
                className="form-control"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </div>

            <div>
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-control"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>

            {errorMessage ? <div className="alert alert-danger mb-0">{errorMessage}</div> : null}

            <button type="submit" className="btn btn-dark btn-lg rounded-pill" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
