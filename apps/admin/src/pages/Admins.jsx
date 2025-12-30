import React, { useEffect, useState } from 'react';
import { t } from '../lib/i18n';

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch('/api/admin/users/admins');
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
      const r = await fetch('/api/admin/users/admins/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error || r.statusText || 'invite failed');
      }
      const body = await r.json();
      setMessage({ type: 'success', text: t('invite_sent') });
      setAdmins((s) => [...s, body.admin].filter(Boolean));
      setEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
  }

  async function updateAdmin(id, updates) {
    setMessage(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
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
    if (!confirm(t('confirm_delete_admin'))) return;
    setMessage(null);
    try {
      const r = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('delete failed');
      setAdmins((s) => s.filter((a) => a.id !== id));
      setMessage({ type: 'success', text: t('deleted') });
    } catch (err) {
      setMessage({ type: 'error', text: String(err) });
    }
  }

  return (
    <div className="card" style={{ maxWidth: 900, margin: '1rem auto' }}>
      <h2 style={{ marginTop: 0 }}>{t('admins_title')}</h2>
      {message && (
        <div style={{ marginBottom: 8 }} className={message.type === 'error' ? 'alert-error' : 'alert-success'}>
          {message.text}
        </div>
      )}
      <form onSubmit={invite} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('invite_placeholder')} />
        <button className="primary" type="submit">{t('invite')}</button>
      </form>
      {loading ? (
        <p>{t('loading')}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th>Email</th>
              <th>Role</th>
              <th>Scope</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.email}>
                <td>{a.email}</td>
                <td>{a.role}</td>
                <td>{[a.organizationSlug, a.brandSlug, a.storeSlug].filter(Boolean).join(' / ')}</td>
                <td>
                  <button
                    onClick={() => {
                      const newRole = prompt('Role', a.role) || a.role;
                      if (newRole && newRole !== a.role) updateAdmin(a.id, { role: newRole });
                    }}
                    className="ghost"
                    aria-label={`Edit ${a.email}`}
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => deleteAdmin(a.id)}
                    className="ghost"
                    aria-label={`Delete ${a.email}`}
                    style={{ marginLeft: 8 }}
                  >
                    {t('delete')}
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
