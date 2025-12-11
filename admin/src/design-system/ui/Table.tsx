import React from "react";

export type Column<T> = {
  key: keyof T;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
};

export default function Table<T extends Record<string, any>>({
  columns,
  data,
}: {
  columns: Column<T>[];
  data: T[];
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "var(--color-muted)" }}>
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.key)}
                style={{
                  textAlign: "left",
                  padding: "12px 16px",
                  fontWeight: 600,
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              {columns.map((c) => (
                <td key={String(c.key)} style={{ padding: "12px 16px" }}>
                  {c.render
                    ? c.render(row[c.key], row)
                    : String(row[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
