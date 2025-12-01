import React, {createContext, useContext, useEffect, useState} from 'react'

const KEY = 'nimbus.activeTenant'

const Ctx = createContext<{tenantId?:string, setTenantId:(id?:string)=>void}>({tenantId:undefined, setTenantId:()=>{}})

export function TenantProvider({children}:{children:React.ReactNode}){
  const [tenantId,setTenantId] = useState<string|undefined>(undefined)
  useEffect(()=>{ setTenantId(localStorage.getItem(KEY) || undefined) },[])
  const set = (id?:string)=>{ setTenantId(id); if(id) localStorage.setItem(KEY,id); else localStorage.removeItem(KEY)}
  return <Ctx.Provider value={{tenantId, setTenantId:set}}>{children}</Ctx.Provider>
}
export const useTenant = ()=> useContext(Ctx)

export function WorkspaceSelector(){
  const {tenantId,setTenantId} = useTenant()
  return (
    <select value={tenantId||''} onChange={(e)=> setTenantId(e.target.value||undefined)}>
      <option value="">Global workspace</option>
      <option value="tenant-a">Tenant A</option>
      <option value="tenant-b">Tenant B</option>
    </select>
  )
}
