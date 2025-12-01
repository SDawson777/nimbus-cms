import React from 'react'
import {Routes, Route, Navigate} from 'react-router-dom'
import Dashboard from '@/modules/dashboard'
import ContentIndex from '@/modules/content'
import DealsIndex from '@/modules/deals'
import LegalIndex from '@/modules/legal'
import TenantsIndex from '@/modules/tenants'
import SettingsIndex from '@/modules/settings'

export default function RoutesView() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/content/articles" element={<ContentIndex />} />
      <Route path="/content/deals" element={<DealsIndex />} />
      <Route path="/content/legal" element={<LegalIndex />} />
      <Route path="/tenants" element={<TenantsIndex />} />
      <Route path="/settings/*" element={<SettingsIndex />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
