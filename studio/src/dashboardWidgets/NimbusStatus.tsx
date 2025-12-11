import React, {useEffect, useState} from 'react';

export default function NimbusStatus() {
  const [status, setStatus] = useState<any>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/v1/status');
        const json = await res.json().catch(() => ({}));
        setStatus({
          env: json?.env || process.env.NODE_ENV || 'unknown',
          time: new Date().toISOString(),
          dataset: process.env.SANITY_STUDIO_DATASET || 'nimbus_demo',
        });
      } catch (e) {
        setStatus({error: String(e)});
      }
    }
    load();
  }, []);

  return (
    <div style={{padding: 12}}>
      <h3>Nimbus Status</h3>
      <dl>
        <dt>Environment</dt>
        <dd>{status.env}</dd>
        <dt>Dataset</dt>
        <dd>{status.dataset}</dd>
        <dt>Time</dt>
        <dd>{status.time}</dd>
        <dt>Sync</dt>
        <dd>{status.sync ? 'OK' : 'Unknown'}</dd>
      </dl>
    </div>
  );
}
