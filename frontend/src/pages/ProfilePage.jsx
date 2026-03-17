import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { BadgeCheck, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { updatePassword, updateProfile } from '../api/profile';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage, getValidationErrors } from '../utils/http';

export function ProfilePage() {
  const { refreshUser, user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileValidation, setProfileValidation] = useState({});
  const [passwordValidation, setPasswordValidation] = useState({});

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async () => {
      await refreshUser();
      setProfileError('');
      setProfileValidation({});
      setProfileSuccess('Profile updated successfully.');
    },
    onError: (error) => {
      setProfileSuccess('');
      setProfileError(getErrorMessage(error, 'Unable to update the profile.'));
      setProfileValidation(getValidationErrors(error));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: updatePassword,
    onSuccess: () => {
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      setPasswordError('');
      setPasswordValidation({});
      setPasswordSuccess('Password updated successfully.');
    },
    onError: (error) => {
      setPasswordSuccess('');
      setPasswordError(getErrorMessage(error, 'Unable to update the password.'));
      setPasswordValidation(getValidationErrors(error));
    },
  });

  function submitProfile(event) {
    event.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    profileMutation.mutate(profileForm);
  }

  function submitPassword(event) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    passwordMutation.mutate(passwordForm);
  }

  return (
    <div className="page-stack">
      <section className="panel-card profile-hero">
        <div className="profile-hero__copy">
          <p className="section-tag">
            <UserRound size={14} />
            Profile settings
          </p>
          <h3>Manage your account and access security.</h3>
          <p>Update your identity details, keep your login secure, and make sure account data stays current.</p>
        </div>

        <div className="profile-hero__badge">
          <span className="user-chip__avatar">{user?.name?.charAt(0) ?? 'R'}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.role}</small>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <article className="panel-card profile-card">
          <div className="panel-card__header">
            <div>
              <p className="section-tag">Identity</p>
              <h3>Profile details</h3>
            </div>
            <span className="list-panel__count">Visible to your session</span>
          </div>

          <form className="stack-form" onSubmit={submitProfile}>
            <div className="modal-field">
              <label className="field-label" htmlFor="profile-name">
                Full name
              </label>
              <input
                id="profile-name"
                type="text"
                className={`form-control ${profileValidation.name ? 'is-invalid' : ''}`}
                value={profileForm.name}
                onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Restaurant manager"
              />
              {profileValidation.name ? <div className="invalid-feedback d-block">{profileValidation.name[0]}</div> : null}
            </div>

            <div className="modal-field">
              <label className="field-label" htmlFor="profile-email">
                Email address
              </label>
              <input
                id="profile-email"
                type="email"
                className={`form-control ${profileValidation.email ? 'is-invalid' : ''}`}
                value={profileForm.email}
                onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="manager@restaurant.test"
              />
              {profileValidation.email ? (
                <div className="invalid-feedback d-block">{profileValidation.email[0]}</div>
              ) : null}
            </div>

            {profileError ? <div className="alert alert-danger">{profileError}</div> : null}
            {profileSuccess ? <div className="alert alert-success">{profileSuccess}</div> : null}

            <div className="profile-actions">
              <button type="submit" className="btn btn-dark rounded-pill" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </article>

        <article className="panel-card profile-card">
          <div className="panel-card__header">
            <div>
              <p className="section-tag">Security</p>
              <h3>Password update</h3>
            </div>
            <span className="list-panel__count">Required for account safety</span>
          </div>

          <form className="stack-form" onSubmit={submitPassword}>
            <div className="modal-field">
              <label className="field-label" htmlFor="current-password">
                Current password
              </label>
              <input
                id="current-password"
                type="password"
                className={`form-control ${passwordValidation.current_password ? 'is-invalid' : ''}`}
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, current_password: event.target.value }))
                }
                placeholder="Enter your current password"
              />
              {passwordValidation.current_password ? (
                <div className="invalid-feedback d-block">{passwordValidation.current_password[0]}</div>
              ) : null}
            </div>

            <div className="modal-field">
              <label className="field-label" htmlFor="new-password">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                className={`form-control ${passwordValidation.password ? 'is-invalid' : ''}`}
                value={passwordForm.password}
                onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Minimum 8 characters"
              />
              {passwordValidation.password ? (
                <div className="invalid-feedback d-block">{passwordValidation.password[0]}</div>
              ) : null}
            </div>

            <div className="modal-field">
              <label className="field-label" htmlFor="confirm-password">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                className={`form-control ${passwordValidation.password ? 'is-invalid' : ''}`}
                value={passwordForm.password_confirmation}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, password_confirmation: event.target.value }))
                }
                placeholder="Repeat the new password"
              />
            </div>

            {passwordError ? <div className="alert alert-danger">{passwordError}</div> : null}
            {passwordSuccess ? <div className="alert alert-success">{passwordSuccess}</div> : null}

            <div className="profile-actions">
              <button type="submit" className="btn btn-dark rounded-pill" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Saving...' : 'Save password'}
              </button>
            </div>
          </form>
        </article>
      </section>

      <section className="profile-grid">
        <article className="panel-card profile-note">
          <div className="profile-note__icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3>Account protection</h3>
            <p>Changing your password does not sign out existing sessions automatically. Rotate it when access changes.</p>
          </div>
        </article>

        <article className="panel-card profile-note">
          <div className="profile-note__icon profile-note__icon--alt">
            <KeyRound size={18} />
          </div>
          <div>
            <h3>Security baseline</h3>
            <p>Use a unique password for the back-office and keep account email details up to date for recovery.</p>
          </div>
        </article>

        <article className="panel-card profile-note">
          <div className="profile-note__icon profile-note__icon--success">
            <BadgeCheck size={18} />
          </div>
          <div>
            <h3>Role visibility</h3>
            <p>Your current role is <strong>{user?.role}</strong>. Access rights remain enforced by the API.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
