import React from "react";

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button style={{ margin: 6, padding: "8px 12px" }} onClick={onClick}>
      {label}
    </button>
  );
}

export default function QuickActions() {
  return (
    <div style={{ padding: 12 }}>
      <h3>Quick Actions</h3>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <ActionButton
          label="Create Product"
          onClick={() => (window.location.href = "/desk/product;create")}
        />
        <ActionButton
          label="Create Article"
          onClick={() => (window.location.href = "/desk/article;create")}
        />
        <ActionButton
          label="Upload Images"
          onClick={() => (window.location.href = "/a/media")}
        />
        <ActionButton
          label="Manage Tenants"
          onClick={() => (window.location.href = "/desk/tenant")}
        />
        <ActionButton
          label="View API Routes"
          onClick={() => window.open("/docs", "_blank")}
        />
      </div>
    </div>
  );
}
