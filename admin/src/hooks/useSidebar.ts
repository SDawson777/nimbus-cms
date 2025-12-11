import { useState } from "react";

export function useSidebar() {
  const [open, setOpen] = useState(true);
  return { open, toggle: () => setOpen((v) => !v), setOpen };
}
