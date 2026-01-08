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
    <div className="card" style={{ maxWidth: 480, margin: '4rem auto', padding: '2rem' }}>
      <h2 style={{ marginTop: 0, textAlign: 'center' }}>Accept Admin Invitation</h2>
      
      {message && (
        <div 
          style={{ 
            marginBottom: 16, 
            padding: 12, 
            borderRadius: 4,
            backgroundColor: message.type === 'error' ? '#fee2e2' : '#d1fae5',
            color: message.type === 'error' ? '#b91c1c' : '#065f46',
            border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {!token ? (
        <p style={{ textAlign: 'center', color: '#666' }}>
          Invalid invitation link. Please contact your administrator.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ color: '#666', fontSize: 14, textAlign: 'center' }}>
            Set a password to activate your admin account
          </p>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>
              Password
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
            {loading ? 'Creating Account...' : 'Activate Account'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#666', marginTop: 8 }}>
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </form>
      )}
    </div>
  );
}
