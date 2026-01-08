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
    <div className="card" style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem' }}>
      <h2 style={{ marginTop: 0, textAlign: 'center' }}>
        {step === 'request' ? 'Request Password Reset' : 'Reset Password'}
      </h2>
      
      {message && (
        <div 
          style={{ 
            marginBottom: 16, 
            padding: 12, 
            borderRadius: 4,
            backgroundColor: message.type === 'error' ? '#fee2e2' : '#d1fae5',
            color: message.type === 'error' ? '#b91c1c' : '#065f46',
            border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.text}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequestReset} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
            Enter your email address and we'll send you a link to reset your password
          </p>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{ width: '100%', padding: 8 }}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="primary" 
            disabled={loading}
            style={{ width: '100%', padding: 12 }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 8 }}>
            Remember your password? <Link to="/login">Sign in</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
            Enter your new password below
          </p>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
              New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              style={{ width: '100%', padding: 8 }}
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              style={{ width: '100%', padding: 8 }}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="primary" 
            disabled={loading}
            style={{ width: '100%', padding: 12 }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 8 }}>
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      )}
    </div>
  );
}
