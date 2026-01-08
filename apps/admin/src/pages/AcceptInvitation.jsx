import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Invalid invitation link - missing token' });
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setLoading(true);
    try {
      const r = await apiFetch('/api/admin/admin-users/accept-invitation', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const errorMessages = {
          'INVITATION_NOT_FOUND': 'Invalid invitation link',
          'INVITATION_ALREADY_USED': 'This invitation has already been used',
          'INVITATION_EXPIRED': 'This invitation has expired',
          'PASSWORD_TOO_SHORT': 'Password must be at least 8 characters',
        };
        throw new Error(errorMessages[body?.error] || body?.error || 'Failed to accept invitation');
      }

      const body = await r.json();
      setMessage({ 
        type: 'success', 
        text: `Account created successfully! Welcome, ${body.email}. Redirecting to login...` 
      });
      
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-header">
          <p className="eyebrow">Nimbus Admin</p>
          <h2 className="auth-title" style={{ textAlign: 'center' }}>
            Accept Admin Invitation
          </h2>
          <p className="subdued" style={{ textAlign: 'center' }}>
            Set a password to activate your admin account.
          </p>
        </div>

        {message && (
          <div className={message.type === 'error' ? 'auth-error' : 'pill'} style={{ whiteSpace: 'pre-wrap' }}>
            {message.text}
          </div>
        )}

        {!token ? (
          <p className="subdued" style={{ textAlign: 'center' }}>
            Invalid invitation link. Please contact your administrator.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-field">
              <span className="auth-label">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                disabled={loading}
                autoComplete="new-password"
              />
            </label>

            <label className="auth-field">
              <span className="auth-label">Confirm Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                disabled={loading}
                autoComplete="new-password"
              />
            </label>

            <div className="auth-actions" style={{ justifyContent: 'center' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Activate Account'}
              </button>
            </div>

            <div className="auth-links">
              Already have an account? <a href="/login">Sign in</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
