import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

const STORAGE_KEY = "nimbus.sanity.dataset";

// Default fallback values
const defaultState = {
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || "ygbu28p2",
  datasets: [], // Will be fetched dynamically
  activeDataset: "",
  isLoading: true,
};

const DatasetContext = createContext({
  projectId: "",
  datasets: [],
  activeDataset: "",
  isLoading: true,
  setProjectId: () => {},
  addDataset: () => {},
  removeDataset: () => {},
  setActiveDataset: () => {},
  refreshDatasets: () => {},
});

/**
 * Fetch available datasets from Sanity Management API
 */
async function fetchDatasetsFromSanity(projectId) {
  if (!projectId) {
    console.warn("No Sanity project ID configured");
    return [];
  }

  try {
    const apiUrl = import.meta.env.VITE_NIMBUS_API_URL || "http://localhost:8080";
    const baseUrl = apiUrl.replace(/\/api.*$/, "");
    const response = await fetch(
      `${baseUrl}/api/datasets`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch datasets: ${response.status}`);
    }

    const data = await response.json();
    // Return array of dataset names
    return data.datasets || [];
  } catch (err) {
    console.warn("Unable to fetch datasets from API:", err.message);
    return [];
  }
}

export function DatasetProvider({ children) {
  const [state, setState] = useState(defaultState);

  // Load persisted state from localStorage
  useEffect(() => {
    const loadedState = loadState();
    setState((prev) => ({
      ...prev,
      ...loadedState,
      isLoading: true, // Will fetch datasets next
    }));
  }, []);

  // Fetch available datasets from Sanity on mount
  useEffect(() => {
    let mounted = true;

    async function loadDatasets() {
      const projectId =
        state.projectId ||
        import.meta.env.VITE_SANITY_PROJECT_ID ||
        "ygbu28p2";
      
      const datasets = await fetchDatasetsFromSanity(projectId);

      if (!mounted) return;

      if (datasets.length > 0) {
        setState((prev) => {
          // Use persisted activeDataset if it exists in fetched datasets
          const validActiveDataset =
            datasets.includes(prev.activeDataset) ? prev.activeDataset : datasets[0];

          return {
            ...prev,
            projectId,
            datasets,
            activeDataset: validActiveDataset,
            isLoading: false,
          };
        });
      } else {
        // Fallback to saved state if fetch fails
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    }

    loadDatasets();

    return () => {
      mounted = false;
    };
  }, []); // Run once on mount

  // Persist state changes to localStorage
  useEffect(() => {
    if (!state.isLoading) {
      persist(state);
    }
  }, [state]);

  const refreshDatasets = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    const datasets = await fetchDatasetsFromSanity(state.projectId);
    
    if (datasets.length > 0) {
      setState((prev) => {
        const validActiveDataset =
          datasets.includes(prev.activeDataset) ? prev.activeDataset : datasets[0];
        
        return {
          ...prev,
          datasets,
          activeDataset: validActiveDataset,
          isLoading: false,
        };
      });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.projectIdw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      datasets:
        Array.isArray(parsed?.datasets) && parsed.datasets.length > 0
          ? parsed.datasets
          : defaultState.datasets,
      activeDataset:
      isLoading: state.isLoading,
      setProjectId,
      addDataset,
      removeDataset,
      setActiveDataset,
      refreshDatasets,
    }),
    [state, setProjectId, addDataset, removeDataset, setActiveDataset, refreshDatasets
    return defaultState;
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Unable to persist dataset prefs", err);
  }
}

export function DatasetProvider({ children }) {
  const [state, setState] = useState(defaultState);, isLoading, refreshDatasets } =
    useDatasetConfig();

  if (isLoading) {
    return (
      <div
        style={{
          padding: "8px 12px",
          fontSize: 14,
          color: "#9ca3af",
        }}
      >
        Loading datasets...
      </div>
    );
  }

  if (datasets.length === 0) {
    return (
      <div
        style={{
          padding: "8px 12px",
          fontSize: 14,
          color: "#ef4444",
        }}
      >
        No datasets available
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <select
        value={activeDataset}
        onChange={(e) => setActiveDataset(e.target.value)}
        style={{
          padding: "8px 12px",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          fontSize: 14,
          background: "rgba(255,255,255,0.06)",
          color: "#e5e7eb",
          cursor: "pointer",
          outline: "none",
          minWidth: "140px",
          boxShadow: "0 8px 24px rgba(5, 8, 30, 0.25)",
        }}
        aria-label="Active dataset"
      >
        {datasets.map((dataset) => (
          <option key={dataset} value={dataset} style={{ color: "#111827" }}>
            {dataset}
          </option>
        ))}
      </select>
      <button
        onClick={refreshDatasets}
        style={{
          padding: "8px 12px",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "10px",
          fontSize: 14,
          background: "rgba(255,255,255,0.06)",
          color: "#e5e7eb",
          cursor: "pointer",
          outline: "none",
          boxShadow: "0 8px 24px rgba(5, 8, 30, 0.25)",
        }}
        title="Refresh datasets"
        aria-label="Refresh datasets"
      >
        ↻
      </button>
    </div
  }, []);

  const removeDataset = useCallback((dataset) => {
    setState((prev) => {
      const nextDatasets = prev.datasets.filter((d) => d !== dataset);
      if (nextDatasets.length === 0) {
        return {
          ...prev,
          datasets: defaultState.datasets,
          activeDataset: defaultState.activeDataset,
        };
      }
      const isRemovingActive = prev.activeDataset === dataset;
      return {
        ...prev,
        datasets: nextDatasets,
        activeDataset: isRemovingActive ? nextDatasets[0] : prev.activeDataset,
      };
    });
  }, []);

  const setActiveDataset = useCallback((dataset) => {
    setState((prev) => ({ ...prev, activeDataset: dataset }));
  }, []);

  const value = useMemo(
    () => ({
      projectId: state.projectId,
      datasets: state.datasets,
      activeDataset: state.activeDataset,
      setProjectId,
      addDataset,
      removeDataset,
      setActiveDataset,
    }),
    [state, setProjectId, addDataset, removeDataset, setActiveDataset],
  );

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  );
}

export function useDatasetConfig() {
  const ctx = useContext(DatasetContext);
  if (!ctx)
    throw new Error("useDatasetConfig must be used within DatasetProvider");
  return ctx;
}

export function DatasetSelector() {
  const { datasets, activeDataset, setActiveDataset } = useDatasetConfig();

  return (
    <select
      value={activeDataset}
      onChange={(e) => setActiveDataset(e.target.value)}
      style={{
        padding: "8px 12px",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "10px",
        fontSize: 14,
        background: "rgba(255,255,255,0.06)",
        color: "#e5e7eb",
        cursor: "pointer",
        outline: "none",
        minWidth: "140px",
        boxShadow: "0 8px 24px rgba(5, 8, 30, 0.25)",
      }}
      aria-label="Active dataset"
    >
      {datasets.map((dataset) => (
        <option key={dataset} value={dataset} style={{ color: "#111827" }}>
          {dataset}
        </option>
      ))}
    </select>
  );
}
