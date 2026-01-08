import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(token ? 'reset' : 'request');

  async function handleRequestReset(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const r = await apiFetch('/api/admin/admin-users/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!r.ok) {
        throw new Error('Failed to request password reset');
      }

      const body = await r.json();
      setMessage({ 
        type: 'success', 
        text: body.message || 'If the email exists, a reset link has been sent',
      });
      
      // In dev, show the reset URL
      if (body.resetUrl) {
        setMessage(prev => ({
          ...prev,
          text: `${prev.text}\n\nDEV MODE: ${body.resetUrl}`
        }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
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
      const r = await apiFetch('/api/admin/admin-users/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        const errorMessages = {
          'INVALID_TOKEN': 'Invalid reset link',
          'TOKEN_ALREADY_USED': 'This reset link has already been used',
          'TOKEN_EXPIRED': 'This reset link has expired',
          'PASSWORD_TOO_SHORT': 'Password must be at least 8 characters',
        };
        throw new Error(errorMessages[body?.error] || body?.error || 'Failed to reset password');
      }

      setMessage({ 
        type: 'success', 
        text: 'Password reset successfully! Redirecting to login...' 
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
            {step === 'request' ? 'Request Password Reset' : 'Reset Password'}
          </h2>
          <p className="subdued" style={{ textAlign: 'center' }}>
            {step === 'request'
              ? "Enter your email address and we'll send you a link to reset your password."
              : 'Enter your new password below.'}
          </p>
        </div>

        {message && (
          <div className={message.type === 'error' ? 'auth-error' : 'pill'} style={{ whiteSpace: 'pre-wrap' }}>
            {message.text}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestReset} className="auth-form">
            <label className="auth-field">
              <span className="auth-label">Email Address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={loading}
                autoComplete="username"
                inputMode="email"
              />
            </label>

            <div className="auth-actions" style={{ justifyContent: 'center' }}>
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>

            <div className="auth-links">
              Remember your password? <Link to="/login">Sign in</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <label className="auth-field">
              <span className="auth-label">New Password</span>
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
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <div className="auth-links">
              <Link to="/login">Back to login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
