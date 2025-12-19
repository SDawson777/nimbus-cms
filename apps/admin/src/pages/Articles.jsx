import React, { useEffect, useState } from "react";
import { apiJson } from "../lib/api";
import { useTenant } from "../lib/tenantContext";

const CHANNELS = ["", "mobile", "web", "kiosk", "email", "ads"];

export default function Articles() {
  const [items, setItems] = useState([]);
  const [channel, setChannel] = useState("");
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  const { tenantId } = useTenant();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const q = channel
          ? `/api/admin/articles?channel=${encodeURIComponent(channel)}`
          : "/api/admin/articles";
        const { ok, data, aborted } = await apiJson(
          q,
          { signal: controller.signal },
          [],
        );
        if (aborted || controller.signal.aborted) return;
        if (ok) {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => controller.abort();
  }, [channel, tenantId]);

  return (
    <div style={{ padding: 20 }}>
      <h1>Articles</h1>
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <h2 style={{ marginTop: 0 }}>AI Generate + Save Draft</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Prompt (optional)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <div>
            <button
              className="primary"
              disabled={saving || !title.trim()}
              onClick={async () => {
                setSaving(true);
                const { ok, data, error } = await apiJson('/api/v1/nimbus/ai/drafts', {
                  method: 'POST',
                  body: JSON.stringify({ title: title.trim(), prompt: prompt.trim() || undefined }),
                });
                setSaving(false);
                if (!ok) {
                  alert(error || 'Failed to generate draft');
                  return;
                }
                if (data?.studioUrl) window.open(data.studioUrl, '_blank');
                setTitle('');
                setPrompt('');
                // Refresh list
                const q = channel ? `/api/admin/articles?channel=${encodeURIComponent(channel)}` : '/api/admin/articles';
                const res = await apiJson(q, {}, []);
                if (res.ok) setItems(Array.isArray(res.data) ? res.data : []);
              }}
            >
              {saving ? 'Generating…' : 'Generate + Save Draft'}
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Channel:</label>
        <select value={channel} onChange={(e) => setChannel(e.target.value)}>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c === "" ? "All" : c}
            </option>
          ))}
        </select>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Published</th>
            <th>Status</th>
            <th>Channels</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d._id}>
              <td>{d.title}</td>
              <td>{d.publishedAt}</td>
              <td>{d.status}</td>
              <td>
                {Array.isArray(d.channels) && d.channels.length
                  ? d.channels.join(", ")
                  : "Global"}
              </td>
              <td>
                <a href="/studio" target="_blank" rel="noreferrer">
                  Open in Studio
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
