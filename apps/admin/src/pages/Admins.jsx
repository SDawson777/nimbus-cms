import React, { useEffect, useState } from 'react';
import { t } from '../lib/i18n';
import { apiFetch } from '../lib/api';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'EDITOR',
    organizationSlug: '',
    brandSlug: '',
    storeSlug: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const r = await apiFetch('/api/admin/admin-users');
        if (!r.ok) throw new Error('failed to fetch admins');
        const data = await r.json();
        setAdmins(data.admins || []);
      } catch (e) {
        setMessage({ type: 'error', text: String(e) });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function invite(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const r = await apiFetch('/api/admin/admin-users/invite', {
        method: 'POST',
        body: JSON.stringify(inviteForm),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || r.statusText || 'invite failed');
      }
      const body = await r.json();
      setMessage({ 
        type: 'success', 
        text: `${t('invite_sent')} - Invitation URL: ${body.invitationUrl}` 
      });
      setShowInviteModal(false);
      setInviteForm({
        email: '',
        role: 'EDITOR',
        organizationSlug: '',
        brandSlug: '',
        storeSlug: '',
      });
      // Reload admins list
      const reloadR = await apiFetch('/api/admin/admin-users');
      if (reloadR.ok) {
        const data = await reloadR.json();
        setAdmins(data.admins || []);
      }
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
  }

  async function updateAdmin(id, updates) {
    setMessage(null);
    try {
      const r = await apiFetch(`/api/admin/admin-users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || r.statusText || 'update failed');
      }
      const body = await r.json();
      setAdmins((s) => s.map((a) => (a.id === id ? body.admin : a)));
      setMessage({ type: 'success', text: 'Updated' });
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
  }

  async function deleteAdmin(id) {
    if (!confirm(t('confirm_delete_admin') || 'Are you sure you want to revoke access for this admin?')) return;
    setMessage(null);
    try {
      const r = await apiFetch(`/api/admin/admin-users/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('delete failed');
      setAdmins((s) => s.filter((a) => a.id !== id));
      setMessage({ type: 'success', text: t('deleted') || 'Admin access revoked' });
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
  }

  async function resendInvitation(id) {
    setMessage(null);
    try {
      const r = await apiFetch(`/api/admin/admin-users/${id}/resend-invitation`, { method: 'POST' });
      if (!r.ok) throw new Error('resend failed');
      const body = await r.json();
      setMessage({ 
        type: 'success', 
        text: `Invitation resent - URL: ${body.invitationUrl}` 
      });
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
  }

  return (
    <div className="card" style={{ maxWidth: 1200, margin: '1rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>{t('admins_title') || 'Admin Users'}</h2>
        <button className="primary" onClick={() => setShowInviteModal(true)}>
          {t('invite_admin') || 'Invite Admin'}
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: 8, padding: 12, borderRadius: 4 }} className={message.type === 'error' ? 'alert-error' : 'alert-success'}>
          {message.text}
        </div>
      )}

      {showInviteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: 8,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ marginTop: 0 }}>Invite Admin User</h3>
            <form onSubmit={invite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Email *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="admin@example.com"
                  style={{ width: '100%', padding: 8 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Role *</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  style={{ width: '100%', padding: 8 }}
                >
                  <option value="OWNER">Owner (Full Access)</option>
                  <option value="ORG_ADMIN">Org Admin (Manage Organization)</option>
                  <option value="EDITOR">Editor (Edit Content)</option>
                  <option value="VIEWER">Viewer (Read Only)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Organization Slug</label>
                <input
                  type="text"
                  value={inviteForm.organizationSlug}
                  onChange={(e) => setInviteForm({ ...inviteForm, organizationSlug: e.target.value })}
                  placeholder="demo-operator"
                  style={{ width: '100%', padding: 8 }}
                />
                <small style={{ color: '#666' }}>Leave empty for system-wide access</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Brand Slug</label>
                <input
                  type="text"
                  value={inviteForm.brandSlug}
                  onChange={(e) => setInviteForm({ ...inviteForm, brandSlug: e.target.value })}
                  placeholder="mountain-fresh"
                  style={{ width: '100%', padding: 8 }}
                />
                <small style={{ color: '#666' }}>Limit access to specific brand</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Store Slug</label>
                <input
                  type="text"
                  value={inviteForm.storeSlug}
                  onChange={(e) => setInviteForm({ ...inviteForm, storeSlug: e.target.value })}
                  placeholder="sf-mission"
                  style={{ width: '100%', padding: 8 }}
                />
                <small style={{ color: '#666' }}>Limit access to specific store</small>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="submit" className="primary">Send Invitation</button>
                <button type="button" onClick={() => setShowInviteModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>{t('loading') || 'Loading...'}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px 8px' }}>Email</th>
              <th style={{ padding: '12px 8px' }}>Role</th>
              <th style={{ padding: '12px 8px' }}>Organization</th>
              <th style={{ padding: '12px 8px' }}>Brand</th>
              <th style={{ padding: '12px 8px' }}>Store</th>
              <th style={{ padding: '12px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 8px' }}>{a.email}</td>
                <td style={{ padding: '12px 8px' }}>
                  <select
                    value={a.role}
                    onChange={(e) => updateAdmin(a.id, { role: e.target.value })}
                    style={{ padding: '4px 8px', fontSize: '14px' }}
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ORG_ADMIN">Org Admin</option>
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                </td>
                <td style={{ padding: '12px 8px' }}>{a.organizationSlug || '-'}</td>
                <td style={{ padding: '12px 8px' }}>{a.brandSlug || '-'}</td>
                <td style={{ padding: '12px 8px' }}>{a.storeSlug || '-'}</td>
                <td style={{ padding: '12px 8px' }}>
                  <button
                    onClick={() => resendInvitation(a.id)}
                    className="ghost"
                    style={{ marginRight: 8, fontSize: '12px', padding: '4px 8px' }}
                    title="Resend invitation email"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => deleteAdmin(a.id)}
                    className="ghost"
                    style={{ color: '#c00', fontSize: '12px', padding: '4px 8px' }}
                    title="Revoke admin access"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
