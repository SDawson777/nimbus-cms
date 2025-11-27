import React, {createContext, useContext, useState} from 'react'
const Ctx = createContext<{tenantId?:string, setTenantId:(id?:string)=>void}>({tenantId:undefined, setTenantId:()=>{}})
export function TenantProvider({children}:{children:React.ReactNode}){
  const [tenantId,setTenantId] = useState<string|undefined>(undefined)
  return <Ctx.Provider value={{tenantId, setTenantId}}>{children}</Ctx.Provider>
}
export const useTenant = ()=> useContext(Ctx)
export function WorkspaceSelector(){
  const {tenantId,setTenantId} = useTenant()
  return (
    <select value={tenantId||''} onChange={(e)=> setTenantId(e.target.value||undefined)}>
      <option value="">Global workspace</option>
    </select>
  )
}
