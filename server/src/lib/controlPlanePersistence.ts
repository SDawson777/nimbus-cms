import fs from "fs/promises";
import path from "path";

export type PersistedControlPlaneState<
  TTenant,
  TStore,
  TTheme,
  TBehavior,
  TAudit,
> = {
  tenants: TTenant[];
  stores: TStore[];
  themes: TTheme[];
  behaviors: TBehavior[];
  auditLog: TAudit[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_PATH = path.join(DATA_DIR, "control-plane.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readControlPlaneState<
  TTenant,
  TStore,
  TTheme,
  TBehavior,
  TAudit,
>(
  fallback: PersistedControlPlaneState<
    TTenant,
    TStore,
    TTheme,
    TBehavior,
    TAudit
  >,
) {
  await ensureDir();
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw) as PersistedControlPlaneState<
      TTenant,
      TStore,
      TTheme,
      TBehavior,
      TAudit
    >;
  } catch (err: any) {
    if (err?.code === "ENOENT") return fallback;
    throw err;
  }
}

export async function writeControlPlaneState<
  TTenant,
  TStore,
  TTheme,
  TBehavior,
  TAudit,
>(
  state: PersistedControlPlaneState<TTenant, TStore, TTheme, TBehavior, TAudit>,
) {
  await ensureDir();
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2), "utf8");
}
