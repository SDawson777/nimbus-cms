import React, {useEffect, useState} from 'react'
import Tabs from '../design-system/Tabs'
import Card from '../design-system/Card'
import Input from '../design-system/Input'
import Select from '../design-system/Select'
import Button from '../design-system/Button'
import {useDatasetConfig} from '../lib/datasetContext'

const UI_STORAGE_KEY = 'nimbus_admin_ui'
const DEFAULT_UI = {
  theme: 'auto',
  accent: '#8b5cf6',
  density: 'balanced',
  surfaces: 'glass',
}

function loadUiPrefs() {
  try {
    return {...DEFAULT_UI, ...(JSON.parse(localStorage.getItem(UI_STORAGE_KEY)) || {})}
  } catch (e) {
    return DEFAULT_UI
  }
}

function persistUiPrefs(prefs) {
  try {
    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(prefs))
  } catch (e) {
    /* no-op */
  }
}

function applyUiTokens(prefs) {
  const root = document.documentElement
  root.dataset.theme = prefs.theme
  root.style.setProperty('--accent-solid', prefs.accent)
  root.style.setProperty('--accent', `linear-gradient(135deg, ${prefs.accent} 0%, #22d3ee 100%)`)
  root.style.setProperty('--card', prefs.surfaces === 'glass' ? 'rgba(12, 20, 36, 0.85)' : '#0c1424')
  root.style.setProperty('--panel-padding', prefs.density === 'compact' ? '12px 12px' : prefs.density === 'spacious' ? '18px 20px' : '14px 16px')
  root.style.setProperty('--section-gap', prefs.density === 'compact' ? '12px' : prefs.density === 'spacious' ? '20px' : '16px')
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('experience')

  const tabs = [
    {id: 'experience', label: 'Experience'},
    {id: 'content', label: 'Content & API'},
    {id: 'workspace', label: 'Workspace & Access'},
  ]

  return (
    <div className="settings-shell">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Control surface</p>
          <h1>Admin Settings</h1>
          <p className="subdued">
            Align admin and CMS behaviors across datasets, surfaces, and authentication. Everything here
            is safe for handoff—no mystery switches.
          </p>
        </div>
        <div className="settings-badges">
          <span className="pill">Enterprise-ready</span>
          <span className="pill">Multi-tenant</span>
          <span className="pill">AI-assisted</span>
        </div>
      </div>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <Card>
        {activeTab === 'experience' && <ExperienceSettings />}
        {activeTab === 'content' && <ApiKeysSettings />}
        {activeTab === 'workspace' && <WorkspaceSettings />}
      </Card>
    </div>
  )
}

function ExperienceSettings() {
  const [uiPrefs, setUiPrefs] = useState(DEFAULT_UI)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const prefs = loadUiPrefs()
    setUiPrefs(prefs)
    applyUiTokens(prefs)
  }, [])

  function update(key, value) {
    setUiPrefs((prev) => ({...prev, [key]: value}))
  }

  function save() {
    persistUiPrefs(uiPrefs)
    applyUiTokens(uiPrefs)
    setStatus('Applied to Admin + Studio surfaces')
    setTimeout(() => setStatus(''), 2800)
  }

  function reset() {
    setUiPrefs(DEFAULT_UI)
    persistUiPrefs(DEFAULT_UI)
    applyUiTokens(DEFAULT_UI)
    setStatus('Reset to Nimbus defaults')
    setTimeout(() => setStatus(''), 2400)
  }

  return (
    <div className="settings-grid">
      <div className="settings-panel">
        <h3>Experience</h3>
        <p className="subdued">
          Update how the Admin shell looks and feels. Changes push to CMS and Admin instantly via shared
          tokens—great for client theming or environment previews.
        </p>

        <Select
          label="Theme"
          value={uiPrefs.theme}
          onChange={(e) => update('theme', e.target.value)}
          options={[
            {value: 'auto', label: 'Auto (respect OS)'},
            {value: 'light', label: 'Light'},
            {value: 'dark', label: 'Dark'},
          ]}
        />

        <div className="field-row">
          <label className="field">
            <span className="field-label">Accent</span>
            <input
              type="color"
              value={uiPrefs.accent}
              onChange={(e) => update('accent', e.target.value)}
              style={{height: 42, width: 90, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)'}}
            />
          </label>

          <Select
            label="Density"
            value={uiPrefs.density}
            onChange={(e) => update('density', e.target.value)}
            options={[
              {value: 'compact', label: 'Compact'},
              {value: 'balanced', label: 'Balanced'},
              {value: 'spacious', label: 'Spacious'},
            ]}
          />
        </div>

        <Select
          label="Surface style"
          value={uiPrefs.surfaces}
          onChange={(e) => update('surfaces', e.target.value)}
          options={[
            {value: 'glass', label: 'Glassmorphic (default)'},
            {value: 'solid', label: 'Solid enterprise panels'},
          ]}
        />

        <div className="action-row">
          <Button variant="primary" onClick={save}>
            Save & apply
          </Button>
          <Button variant="ghost" onClick={reset}>
            Reset
          </Button>
          {status && <span className="status-chip">{status}</span>}
        </div>
      </div>

      <div className="settings-preview">
        <div className="preview-card">
          <p className="eyebrow">Live preview</p>
          <h4>Suite chrome</h4>
          <p className="subdued">
            Navigation, dashboards, and CMS editors share these tokens. Accent + density updates propagate
            to every card, nav surface, and CTA.
          </p>
          <div className="preview-grid">
            <div className="preview-pill">Navigation</div>
            <div className="preview-pill">Metrics</div>
            <div className="preview-pill">Content</div>
            <div className="preview-pill">AI concierge</div>
            <div className="preview-pill">Compliance</div>
            <div className="preview-pill">Analytics</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiKeysSettings() {
  const {
    projectId,
    datasets,
    activeDataset,
    setProjectId,
    addDataset,
    removeDataset,
    setActiveDataset,
  } = useDatasetConfig()
  const [datasetDraft, setDatasetDraft] = useState('')

  return (
    <div className="settings-grid">
      <div className="settings-panel">
        <h3>Content & API</h3>
        <p className="subdued">
          Point the Admin and Studio at the right Sanity project + datasets. Changes persist locally and
          keep your preview tiers aligned (production, staging, UAT, client-specific).
        </p>

        <Input
          label="Sanity Project ID"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          placeholder="Enter project ID"
          hint="Found in your Sanity project settings"
        />

        <div className="field-row">
          <Input
            label="Add dataset"
            value={datasetDraft}
            onChange={(e) => setDatasetDraft(e.target.value)}
            placeholder="production, staging, qa..."
          />
          <Button
            variant="primary"
            onClick={() => {
              addDataset(datasetDraft)
              setDatasetDraft('')
            }}
            disabled={!datasetDraft.trim()}
            style={{whiteSpace: 'nowrap'}}
          >
            Add dataset
          </Button>
        </div>

        <div className="dataset-chips">
          {datasets.map((ds) => (
            <div key={ds} className={`dataset-chip ${ds === activeDataset ? 'is-active' : ''}`}>
              <div>
                <p className="eyebrow">Dataset</p>
                <strong>{ds}</strong>
              </div>
              <div className="chip-actions">
                <Button variant="ghost" onClick={() => setActiveDataset(ds)} disabled={ds === activeDataset}>
                  {ds === activeDataset ? 'Active' : 'Activate'}
                </Button>
                <Button variant="ghost" onClick={() => removeDataset(ds)} disabled={datasets.length <= 1}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Select
          label="Active dataset"
          value={activeDataset}
          onChange={(e) => setActiveDataset(e.target.value)}
          options={datasets.map((ds) => ({value: ds, label: ds}))}
        />
        <p className="subdued">
          Admin dashboards, content tables, AI concierge signals, and compliance widgets will read from the
          active dataset above.
        </p>
      </div>

      <div className="settings-preview">
        <div className="preview-card stack">
          <p className="eyebrow">Alignment</p>
          <h4>API posture</h4>
          <p className="subdued">
            Project + dataset settings are shared across Admin & CMS. Keep production safe while letting
            buyers tour staging or demo sandboxes with the same chrome.
          </p>
          <div className="preview-grid muted">
            <div className="preview-pill">Project ID: {projectId || 'not set'}</div>
            <div className="preview-pill">Active dataset: {activeDataset}</div>
            <div className="preview-pill">AI concierge: synced</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState('Nimbus HQ')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')

  return (
    <div className="settings-grid">
      <div className="settings-panel">
        <h3>Workspace & Access</h3>
        <p className="subdued">
          Label the workspace, default language, and timezone buyers will see on login. Admin routes already
          require authentication; demo credentials stay available for safe previews.
        </p>

        <Input
          label="Workspace Name"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder="My Workspace"
        />

        <Select
          label="Language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={[
            {value: 'en', label: 'English'},
            {value: 'es', label: 'Spanish'},
            {value: 'fr', label: 'French'},
          ]}
        />

        <Select
          label="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          options={[
            {value: 'UTC', label: 'UTC'},
            {value: 'America/New_York', label: 'Eastern Time'},
            {value: 'America/Los_Angeles', label: 'Pacific Time'},
          ]}
        />

        <div className="action-row">
          <Button variant="primary">Save Configuration</Button>
          <Button variant="ghost">Cancel</Button>
        </div>
      </div>

      <div className="settings-preview">
        <div className="preview-card stack">
          <p className="eyebrow">Security posture</p>
          <h4>Login guard</h4>
          <p className="subdued">
            All admin routes are protected. Buyers can test with the demo account before wiring SSO or your
            production auth provider.
          </p>
          <div className="preview-grid muted">
            <div className="preview-pill">Email: demo@nimbus.app</div>
            <div className="preview-pill">Password: Nimbus!Demo123</div>
            <div className="preview-pill">Role: ORG_ADMIN</div>
          </div>
        </div>
      </div>
    </div>
  )
}
