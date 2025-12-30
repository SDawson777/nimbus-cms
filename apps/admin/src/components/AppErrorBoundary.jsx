import React from "react";
import { t } from "../lib/i18n";

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App crash captured by boundary", { error, info });
    try {
      // If Sentry or a capture function is exposed, forward the error for server-side tracking
      // eslint-disable-next-line no-undef
      if (typeof window !== 'undefined' && typeof window.__captureAppError === 'function') {
        // eslint-disable-next-line no-undef
        window.__captureAppError(error, info);
      }
    } catch (e) {
      // ignore reporting failures
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="card"
          style={{ margin: "2rem auto", maxWidth: 560, padding: "2rem" }}
        >
          <h2 style={{ marginTop: 0 }}>{t('something_wrong')}</h2>
          <p style={{ color: "#6b7280" }}>
            We hit a snag rendering this view. Refresh the page or return to the
            dashboard. If the issue persists, clear cached data or contact
            support with the timestamp below.
          </p>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Timestamp: {new Date().toISOString()}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={this.handleReset} className="primary">
              {t('reload')}
            </button>
            <button onClick={() => window.location.assign("/dashboard")}>
              {t('go_to_dashboard')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
