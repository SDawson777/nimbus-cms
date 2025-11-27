import React, {useState} from 'react'
import Tabs from '@/design-system/ui/Tabs'
import Card from '@/design-system/ui/Card'
import Button from '@/design-system/ui/Button'
import Input from '@/design-system/ui/Input'
import Select from '@/design-system/ui/Select'

function ThemeSettings(){
  return (
    <div style={{display:'grid',gap:16}}>
      <h3>Theme Settings</h3>
      <Select label="Color Scheme">
        <option>Light</option>
        <option>Dark</option>
        <option>Auto</option>
      </Select>
      <Select label="Primary Color">
        <option>Nimbus Blue</option>
        <option>Emerald</option>
        <option>Purple</option>
      </Select>
      <Button>Save Theme</Button>
    </div>
  )
}

function ApiKeys(){
  return (
    <div style={{display:'grid',gap:16}}>
      <h3>API Keys</h3>
      <Input label="Sanity Project ID" defaultValue="ygbu28p2" />
      <Input label="Sanity Dataset" defaultValue="production" />
      <Input label="API Secret" type="password" placeholder="••••••••" />
      <Button>Update Keys</Button>
    </div>
  )
}

function WorkspaceConfig(){
  return (
    <div style={{display:'grid',gap:16}}>
      <h3>Workspace Configuration</h3>
      <Input label="Workspace Name" defaultValue="Nimbus HQ" />
      <Input label="Default Language" defaultValue="en-US" />
      <Select label="Timezone">
        <option>UTC</option>
        <option>America/New_York</option>
        <option>Europe/London</option>
      </Select>
      <Button>Save Config</Button>
    </div>
  )
}

export default function SettingsIndex(){
  const [active, setActive] = useState('theme')
  return (
    <div style={{padding:24}}>
      <h1 style={{marginBottom:24}}>Settings</h1>
      <Tabs tabs={[
        {id:'theme', label:'Theme'},
        {id:'api', label:'API Keys'},
        {id:'workspace', label:'Workspace'}
      ]} activeId={active} onChange={setActive} />
      <Card>
        {active==='theme' && <ThemeSettings />}
        {active==='api' && <ApiKeys />}
        {active==='workspace' && <WorkspaceConfig />}
      </Card>
    </div>
  )
}
