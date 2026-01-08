import React, { useState } from "react";
import { t } from "../lib/i18n";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAdmin } from "../lib/adminContext";
import { apiFetch } from "../lib/api";
import { safeJson } from "../lib/safeJson";

const TEST_USER = {
  email: "demo@nimbus.app",
  password: "Nimbus!Demo123",
  profile: {
    name: "Nimbus Demo Admin",
    role: "ORG_ADMIN",
    organizationSlug: "demo-org",
  },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();
  const location = useLocation();
  const { refresh: refreshAdmin, setLocalAdmin } = useAdmin();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await apiFetch("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        // Call refresh and retry once if admin not populated (addresses occasional double-login)
        await refreshAdmin();
        const adminCheck = await refreshAdmin();
        if (!adminCheck) {
          // Try one more time after short delay
          await new Promise((r) => setTimeout(r, 250));
          await refreshAdmin();
        }
        nav(location.state?.from || "/dashboard");
        return;
      }

      const body = await safeJson(res, {});
      const apiError = body?.error || "Login failed";

      if (email === TEST_USER.email && password === TEST_USER.password) {
        setLocalAdmin({
          email: TEST_USER.email,
          name: TEST_USER.profile.name,
          role: TEST_USER.profile.role,
          organizationSlug: TEST_USER.profile.organizationSlug,
        });
        nav(location.state?.from || "/dashboard");
        return;
      }

      setError(apiError);
    } catch (err) {
      if (email === TEST_USER.email && password === TEST_USER.password) {
        setLocalAdmin({
          email: TEST_USER.email,
          name: TEST_USER.profile.name,
          role: TEST_USER.profile.role,
          organizationSlug: TEST_USER.profile.organizationSlug,
        });
        nav(location.state?.from || "/dashboard");
        return;
      }
      setError("Network error");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="auth-header">
          <p className="eyebrow">Nimbus Admin</p>
          <h2 className="auth-title">Admin Login</h2>
          <p className="subdued">
            Secure your workspace. Use the provided demo credentials for buyer
            testing or connect your SSO-backed admin endpoint.
          </p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span className="auth-label">{t("label_email")}</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={TEST_USER.email}
              autoComplete="username"
              inputMode="email"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">{t("label_password")}</span>
            <div className="auth-password-row">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={TEST_USER.password}
                autoComplete="current-password"
              />
              <label className="auth-show">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                />
                <span>Show</span>
              </label>
            </div>
          </label>

          <div className="auth-actions">
            <button type="submit" className="btn">
              {t("sign_in")}
            </button>
            <div className="auth-demo pill">
              {t("demo_user")}: <strong>{TEST_USER.email}</strong> /{" "}
              <strong>{TEST_USER.password}</strong>
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-links">
            <Link to="/reset-password">Forgot password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
