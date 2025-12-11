import { useContext } from "react";
import { TenantContext } from "../modules/tenants/TenantContext";

export function useTenant() {
  const ctx = useContext(TenantContext);
  return ctx;
}
