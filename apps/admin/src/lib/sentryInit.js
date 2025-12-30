export async function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  try {
    await loadSentryCdn();
    if (!window.Sentry) {
      console.warn('Sentry CDN not available; skipping init');
      return;
    }
    window.Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new window.Sentry.BrowserTracing()],
      tracesSampleRate: 0.1,
      release: import.meta.env.VITE_APP_VERSION || undefined,
    });
    window.__captureAppError = (err, info) => {
      try {
        window.Sentry.captureException(err, { extra: info });
      } catch (e) {}
    };
    console.info('Sentry initialized (CDN) for admin UI');
  } catch (e) {
    console.warn('Sentry failed to initialize', e);
  }
}

function loadSentryCdn() {
  return new Promise((resolve, reject) => {
    if (window.Sentry) return resolve();
    const script = document.createElement('script');
    // Bundle includes tracing integration
    script.src = 'https://browser.sentry-cdn.com/7.97.0/bundle.tracing.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}
