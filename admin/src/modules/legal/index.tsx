import React, { useEffect, useState } from "react";
import Table from "@/design-system/ui/Table";
import { api } from "@/lib/api";

export default function LegalIndex() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/admin/legal");
        setItems(Array.isArray(res) ? res : []);
      } catch (e) {
        console.warn(e);
      }
    })();
  }, []);
  return (
    <div>
      <h1>Legal Docs</h1>
      <Table
        columns={[
          { key: "title", label: "Title" },
          { key: "type", label: "Type" },
          { key: "stateCode", label: "State" },
          { key: "version", label: "Version" },
        ]}
        data={items}
      />
    </div>
  );
}
