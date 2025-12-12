import React, { useEffect, useState } from "react";

export default function EditorialAI() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/nimbus/content/trending?window=7");
        const json = await res.json().catch(() => null);
        setData(json || { products: [], articles: [], suggestions: [] });
      } catch (e) {
        setData({ error: String(e) });
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <h3>Editorial AI</h3>
      <p>Trending products (7d):</p>
      <ul>
        {(data?.products || []).slice(0, 5).map((p: any) => (
          <li key={p.id || p.slug}>{p.name || p.slug}</li>
        ))}
      </ul>
      <p>Top articles:</p>
      <ul>
        {(data?.articles || []).slice(0, 5).map((a: any) => (
          <li key={a.id || a.slug}>{a.title || a.slug}</li>
        ))}
      </ul>
      <p>Suggested topics:</p>
      <ol>
        {(
          data?.suggestions || [
            "Sustainability",
            "Product Use",
            "Industry Trends",
          ]
        )
          .slice(0, 3)
          .map((s: any, i: number) => (
            <li key={i}>{s}</li>
          ))}
      </ol>
    </div>
  );
}
