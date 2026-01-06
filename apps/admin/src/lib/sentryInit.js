export async function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  try {
    await loadSentryCdn();
    if (!window.Sentry) {
      console.warn('Sentry CDN not available; skipping init');
      return;
    }

    // Enterprise-grade Sentry config for Admin SPA
    window.Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_APP_ENV || 'production',
      release: import.meta.env.VITE_APP_VERSION || undefined,

      // Performance monitoring: capture transaction traces
      tracesSampleRate: 0.1, // 10% sample rate for traces

      // Session replay: capture user interactions on error + always 5% of sessions
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,

      // Integrations: browser tracing + replay
      integrations: [
        new window.Sentry.BrowserTracing(),
        new window.Sentry.Replay({ maskAllText: true, blockAllMedia: true }),
      ],

      // PII scrubbing: remove sensitive data before sending
      beforeSend(event, hint) {
        if (!event) return null;

        // Scrub authorization headers
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
          delete event.request.headers['X-Auth-Token'];
          delete event.request.headers['X-CSRF-Token'];
        }

        // Scrub cookies
        if (event.request?.cookies) {
          event.request.cookies = '[scrubbed]';
        }

        // Scrub URL query params that may contain tokens/secrets
        if (event.request?.url) {
          event.request.url = sanitizeUrl(event.request.url);
        }

        // Scrub breadcrumb data
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((crumb) => {
            if (crumb.data) {
              const cleaned = { ...crumb.data };
              ['token', 'password', 'secret', 'key', 'auth'].forEach((field) => {
                if (field in cleaned) cleaned[field] = '[scrubbed]';
              });
              return { ...crumb, data: cleaned };
            }
            return crumb;
          });
        }

        return event;
      },
    });

    // Set user context if available
    const admin = sessionStorage.getItem('admin');
    if (admin) {
      try {
        const { email } = JSON.parse(admin);
        window.Sentry.setUser({ email });
      } catch {}
    }

    // Global error handler for unhandled errors
    window.__captureAppError = (err, info) => {
      try {
        window.Sentry.captureException(err, { extra: info, level: 'error' });
      } catch (e) {}
    };

    console.info('Sentry initialized (CDN) for admin UI', {
      env: import.meta.env.VITE_APP_ENV,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.05,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (e) {
    console.warn('Sentry failed to initialize', e);
  }
}

function loadSentryCdn() {
  return new Promise((resolve, reject) => {
    if (window.Sentry) return resolve();
    const script = document.createElement('script');
    // Bundle includes tracing + replay integrations
    script.src = 'https://browser.sentry-cdn.com/7.97.0/bundle.tracing.replay.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

function sanitizeUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    u.search = '';
    u.hash = '';
    return u.toString();
  } catch {
    return String(url).split('?')[0].split('#')[0];
  }
}
