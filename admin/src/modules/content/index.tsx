import React, {useEffect, useState} from 'react'
import Table from '@/design-system/ui/Table'
import {api} from '@/lib/api'
import {ArticleSchema} from '@/lib/zod-validators'

export default function ContentIndex(){
  const [items,setItems] = useState<any[]>([])
  useEffect(()=>{
    (async()=>{
      try{
        const res = await api.get('/api/admin/articles')
        const arr = Array.isArray(res) ? res : []
        setItems(arr.filter((x)=> ArticleSchema.safeParse(x).success))
      }catch(e){
        console.warn(e)
      }
    })()
  },[])
  return (
    <div>
      <h1>Articles</h1>
      <Table columns={[{key:'title',label:'Title'},{key:'status',label:'Status'},{key:'publishedAt',label:'Published'}]} data={items} />
    </div>
  )
}
