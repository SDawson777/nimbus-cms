import React, { useEffect, useState } from "react";
import Card from "../design-system/Card";
import { apiJson } from "../lib/api";

export default function UndoPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [executing, setExecuting] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    const { ok, data, error } = await apiJson('/api/v1/nimbus/undo/events?limit=200');
    if (!ok) {
      setError(error || 'Failed to load events');
      setLoading(false);
      return;
    }
    setEvents(data || []);
    setLoading(false);
  }

  async function preview(id) {
    const { ok, data } = await apiJson(`/api/v1/nimbus/undo/events/${id}/preview-undo`, { method: 'POST' });
    if (!ok) return alert('Failed to generate preview');
    alert(JSON.stringify(data.inverse, null, 2));
  }

  async function execute(id) {
    if (!confirm('Queue this undo operation for execution? This will not automatically apply external changes.')) return;
    setExecuting(id);
    const { ok, data, error } = await apiJson(`/api/v1/nimbus/undo/events/${id}/execute`, { method: 'POST', body: JSON.stringify({ requestedBy: 'ui-admin' }) });
    if (!ok) {
      setExecuting(null);
      alert(error || 'Failed to enqueue execution');
      return;
    }
    alert('Queued: ' + data.queuedId);
    setExecuting(null);
    loadEvents();
  }

  return (
    <div className="page-shell" style={{ padding: 16 }}>
      <div className="page-header">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Undo / Redo Events</h1>
          <p className="subdued">Review recorded events and queue safe undos for operator review.</p>
        </div>
      </div>

      <Card>
        {loading && <p className="metric-subtle">Loading events…</p>}
        {error && <p className="metric-subtle" style={{ color: 'var(--danger)' }}>{String(error)}</p>}
        {!loading && events.length === 0 && <p className="metric-subtle">No events recorded yet.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((ev) => (
            <li key={ev.id} style={{ borderBottom: '1px solid var(--muted)', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{ev.action}</div>
                  <div className="metric-subtle">{ev.resource} {ev.resourceId ? `· ${ev.resourceId}` : ''} · {new Date(ev.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <button className="ghost" onClick={() => preview(ev.id)}>Preview</button>
                  <button className="primary" disabled={executing === ev.id} onClick={() => execute(ev.id)} style={{ marginLeft: 8 }}>Queue</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
