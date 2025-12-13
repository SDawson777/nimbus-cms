import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
    <div
      className="card"
      style={{ maxWidth: 520, margin: "5rem auto", padding: "28px" }}
    >
      <h2 style={{ marginBottom: 8 }}>Admin Login</h2>
      <p style={{ marginTop: 0, color: "#9ca3af" }}>
        Secure your workspace. Use the provided test credentials for buyer demos
        or connect your SSO-backed admin endpoint.
      </p>
      <form onSubmit={submit} style={{ display: "grid", gap: "14px" }}>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>Email</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={TEST_USER.email}
            autoComplete="username"
          />
        </label>
        <label style={{ display: "grid", gap: "6px" }}>
          <span>Password</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={TEST_USER.password}
              autoComplete="current-password"
              style={{ flex: 1 }}
            />
            <label style={{ fontSize: 12, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <span>Show</span>
            </label>
          </div>
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button type="submit" className="primary">
            Sign in
          </button>
          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
            Demo user: <strong>{TEST_USER.email}</strong> /{" "}
            <strong>{TEST_USER.password}</strong>
          </div>
        </div>
        {error && <div style={{ color: "#f87171" }}>{error}</div>}
      </form>
    </div>
  );
}
