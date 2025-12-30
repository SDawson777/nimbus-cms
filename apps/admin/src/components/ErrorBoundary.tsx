import React from "react";
import { t } from "../lib/i18n";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("App crash captured by boundary", { error, info });
    try {
      if (
        typeof window !== "undefined" &&
        typeof (window as any).__captureAppError === "function"
      ) {
        (window as any).__captureAppError(error, info);
      }
    } catch {
      // ignore reporting failures
    }
  }

  private handleReset = () => {
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
          <h2 style={{ marginTop: 0 }}>{t("something_wrong")}</h2>
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
              {t("reload")}
            </button>
            <button onClick={() => window.location.assign("/dashboard")}>
              {t("go_to_dashboard")}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
