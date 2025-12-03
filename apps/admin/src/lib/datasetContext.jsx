import React, {createContext, useContext, useEffect, useMemo, useState, useCallback} from 'react'

const STORAGE_KEY = 'nimbus.sanity.dataset'

const defaultState = {
  projectId: '',
  datasets: ['production', 'staging'],
  activeDataset: 'production',
}

const DatasetContext = createContext({
  projectId: '',
  datasets: [],
  activeDataset: '',
  setProjectId: () => {},
  addDataset: () => {},
  removeDataset: () => {},
  setActiveDataset: () => {},
})

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return {
      ...defaultState,
      ...parsed,
      datasets: Array.isArray(parsed?.datasets) && parsed.datasets.length > 0 ? parsed.datasets : defaultState.datasets,
      activeDataset: parsed?.activeDataset || parsed?.datasets?.[0] || defaultState.activeDataset,
    }
  } catch (err) {
    console.warn('Unable to parse dataset prefs', err)
    return defaultState
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (err) {
    console.warn('Unable to persist dataset prefs', err)
  }
}

export function DatasetProvider({children}) {
  const [state, setState] = useState(defaultState)

  useEffect(() => {
    setState(loadState())
  }, [])

  useEffect(() => {
    persist(state)
  }, [state])

  const setProjectId = useCallback((projectId) => {
    setState((prev) => ({...prev, projectId}))
  }, [])

  const addDataset = useCallback((dataset) => {
    const trimmed = (dataset || '').trim()
    if (!trimmed) return
    setState((prev) => {
      if (prev.datasets.includes(trimmed)) return prev
      const nextDatasets = [...prev.datasets, trimmed]
      return {
        ...prev,
        datasets: nextDatasets,
        activeDataset: prev.activeDataset || trimmed,
      }
    })
  }, [])

  const removeDataset = useCallback((dataset) => {
    setState((prev) => {
      const nextDatasets = prev.datasets.filter((d) => d !== dataset)
      if (nextDatasets.length === 0) {
        return {...prev, datasets: defaultState.datasets, activeDataset: defaultState.activeDataset}
      }
      const isRemovingActive = prev.activeDataset === dataset
      return {
        ...prev,
        datasets: nextDatasets,
        activeDataset: isRemovingActive ? nextDatasets[0] : prev.activeDataset,
      }
    })
  }, [])

  const setActiveDataset = useCallback((dataset) => {
    setState((prev) => ({...prev, activeDataset: dataset}))
  }, [])

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
  )

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

export function useDatasetConfig() {
  const ctx = useContext(DatasetContext)
  if (!ctx) throw new Error('useDatasetConfig must be used within DatasetProvider')
  return ctx
}

export function DatasetSelector() {
  const {datasets, activeDataset, setActiveDataset} = useDatasetConfig()

  return (
    <select
      value={activeDataset}
      onChange={(e) => setActiveDataset(e.target.value)}
      style={{
        padding: '8px 12px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        fontSize: 14,
        background: 'rgba(255,255,255,0.06)',
        color: '#e5e7eb',
        cursor: 'pointer',
        outline: 'none',
        minWidth: '140px',
        boxShadow: '0 8px 24px rgba(5, 8, 30, 0.25)',
      }}
      aria-label="Active dataset"
    >
      {datasets.map((dataset) => (
        <option key={dataset} value={dataset} style={{color: '#111827'}}>
          {dataset}
        </option>
      ))}
    </select>
  )
}
