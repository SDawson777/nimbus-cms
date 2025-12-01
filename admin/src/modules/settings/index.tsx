import React from 'react'
import {Routes, Route, Link} from 'react-router-dom'
import ThemeSettings from './ThemeSettings'
import ApiKeys from './ApiKeys'
import WorkspaceConfig from './WorkspaceConfig'
import {useState} from 'react'
import Tabs from '../../design-system/ui/Tabs'
import Card from '../../design-system/ui/Card'

export default function Settings(){
  const [active, setActive] = useState('theme')
  return (
    <div>
      <h1>Settings</h1>
      <div style={{display:'flex',gap:12,marginBottom:12}}>
        <Link to="/settings/theme">Theme</Link>
        <Link to="/settings/api">API Keys</Link>
        <Link to="/settings/workspace">Workspace</Link>
      </div>
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
