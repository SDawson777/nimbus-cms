import React, {createContext, useContext, useEffect, useState} from 'react'

const KEY = 'nimbus.activeTenant'

const Ctx = createContext<{tenantId?:string, setTenantId:(id?:string)=>void}>({tenantId:undefined, setTenantId:()=>{}})

export function TenantProvider({children}:{children:React.ReactNode}){
  const [tenantId,setTenantId] = useState<string|undefined>(undefined)
  useEffect(()=>{ 
    const saved = localStorage.getItem(KEY)
    if(saved) setTenantId(saved)
  },[])
  const set = (id?:string)=>{ 
    setTenantId(id)
    if(id) localStorage.setItem(KEY,id)
    else localStorage.removeItem(KEY)
  }
  return <Ctx.Provider value={{tenantId, setTenantId:set}}>{children}</Ctx.Provider>
}

export const useTenant = ()=> useContext(Ctx)

export function WorkspaceSelector(){
  const {tenantId,setTenantId} = useTenant()
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <span style={{fontSize:12,color:'#6B7280'}}>Workspace:</span>
      <select value={tenantId||''} onChange={(e)=> setTenantId(e.target.value||undefined)} style={{
        padding:'4px 8px',
        border:'1px solid #D1D5DB',
        borderRadius:4,
        fontSize:13,
        background:'white'
      }}>
        <option value="">Global</option>
        <option value="tenant-a">Tenant A</option>
        <option value="tenant-b">Tenant B</option>
        <option value="tenant-c">Tenant C</option>
      </select>
    </div>
  )
}
