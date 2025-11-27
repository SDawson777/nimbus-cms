import React from 'react'
import {Link, useLocation} from 'react-router-dom'
import Home from '@/assets/icons/Home'
import Document from '@/assets/icons/Document'
import Users from '@/assets/icons/Users'
import Settings from '@/assets/icons/Settings'

const navItems = [
  {label:'Dashboard', href:'/dashboard', Icon:Home},
  {label:'Articles', href:'/content/articles', Icon:Document},
  {label:'Deals', href:'/content/deals', Icon:Document},
  {label:'Legal Docs', href:'/content/legal', Icon:Document},
  {label:'Tenants', href:'/tenants', Icon:Users},
  {label:'Settings', href:'/settings', Icon:Settings},
]

export default function Sidebar(){
  const {pathname} = useLocation()
  return (
    <aside style={{width:240,background:'#111827',color:'white',padding:'16px 0'}}>
      <div style={{padding:'0 16px',marginBottom:24,fontWeight:700,fontSize:18}}>Nimbus</div>
      <nav style={{display:'grid',gap:4}}>
        {navItems.map(({label,href,Icon})=>{
          const active = pathname.startsWith(href)
          return (
            <Link key={href} to={href} style={{
              display:'flex',alignItems:'center',gap:12,padding:'10px 16px',
              color:active?'white':'#9CA3AF',
              background:active?'rgba(255,255,255,0.1)':'transparent',
              textDecoration:'none',
              borderLeft:active?'3px solid #3F7AFC':'3px solid transparent'
            }}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
