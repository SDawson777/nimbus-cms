import React, {useState} from 'react'
import Tabs from '../design-system/Tabs'
import Card from '../design-system/Card'
import Input from '../design-system/Input'
import Select from '../design-system/Select'
import Button from '../design-system/Button'
import {useDatasetConfig} from '../lib/datasetContext'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('theme')

  const tabs = [
    {id: 'theme', label: 'Theme'},
    {id: 'api', label: 'API Keys'},
    {id: 'workspace', label: 'Workspace'},
  ]

  return (
    <div style={{padding: 20}}>
      <h1 style={{marginBottom: 24}}>Settings</h1>

      <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />

      <Card>
        {activeTab === 'theme' && <ThemeSettings />}
        {activeTab === 'api' && <ApiKeysSettings />}
        {activeTab === 'workspace' && <WorkspaceSettings />}
      </Card>
    </div>
  )
}

function ThemeSettings() {
  const [colorScheme, setColorScheme] = useState('light')

  return (
    <div style={{display: 'grid', gap: 20, maxWidth: 500}}>
      <h3 style={{marginTop: 0}}>Theme Settings</h3>

      <Select
        label="Color Scheme"
        value={colorScheme}
        onChange={(e) => setColorScheme(e.target.value)}
        options={[
          {value: 'light', label: 'Light'},
          {value: 'dark', label: 'Dark'},
          {value: 'auto', label: 'Auto'},
        ]}
      />

      <div style={{display: 'flex', gap: 8}}>
        <Button variant="primary">Save Changes</Button>
        <Button variant="ghost">Reset</Button>
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
    <div style={{display: 'grid', gap: 20, maxWidth: 500}}>
      <h3 style={{marginTop: 0}}>API Keys</h3>

      <Input
        label="Sanity Project ID"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        placeholder="Enter project ID"
        hint="Found in your Sanity project settings"
      />

      <div style={{display: 'grid', gap: 12}}>
        <div style={{display: 'flex', gap: 10, alignItems: 'flex-end'}}>
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

        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          {datasets.map((ds) => (
            <div
              key={ds}
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                border: ds === activeDataset ? '1px solid var(--accent-solid)' : '1px solid rgba(255,255,255,0.08)',
                background:
                  ds === activeDataset
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(34,211,238,0.18))'
                    : 'rgba(255,255,255,0.04)',
                color: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 12px 32px rgba(6,9,20,0.35)',
              }}
            >
              <span style={{fontWeight: 700}}>{ds}</span>
              <Button variant="ghost" onClick={() => setActiveDataset(ds)} disabled={ds === activeDataset}>
                {ds === activeDataset ? 'Active' : 'Activate'}
              </Button>
              <Button variant="ghost" onClick={() => removeDataset(ds)} disabled={datasets.length <= 1}>
                Remove
              </Button>
            </div>
          ))}
        </div>

        <div style={{display: 'grid', gap: 6, maxWidth: 360}}>
          <label htmlFor="active-dataset" style={{color: '#cbd5e1', fontWeight: 600}}>
            Active dataset
          </label>
          <Select
            id="active-dataset"
            value={activeDataset}
            onChange={(e) => setActiveDataset(e.target.value)}
            options={datasets.map((ds) => ({value: ds, label: ds}))}
          />
          <p style={{margin: 0, color: '#94a3b8'}}>
            Switch between datasets instantly—ideal for production, staging, or client-specific environments.
          </p>
        </div>
      </div>
    </div>
  )
}

function WorkspaceSettings() {
  const [workspaceName, setWorkspaceName] = useState('')
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')

  return (
    <div style={{display: 'grid', gap: 20, maxWidth: 500}}>
      <h3 style={{marginTop: 0}}>Workspace Configuration</h3>

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

      <div style={{display: 'flex', gap: 8}}>
        <Button variant="primary">Save Configuration</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
    </div>
  )
}
