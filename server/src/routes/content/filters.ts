import {Router} from 'express'
import {fetchCMS} from '../../lib/cms'

export const filtersRouter = Router()

filtersRouter.get('/', async (req, res) => {
  const {org, brand, store} = req.query || {}
  // legacy queries (categories + filters) with optional tenant scoping
  let tenantFilter = ''
  if (brand) tenantFilter += ' && references(*[_type=="brand" && slug.current==$brand]._id)'
  if (store) tenantFilter += ' && references(*[_type=="store" && slug.current==$store]._id)'
  if (org) tenantFilter += ' && references(*[_type=="organization" && slug.current==$org]._id)'

  const catsQuery = `*[_type=="shopCategory" && active==true ${tenantFilter}] | order(weight asc){name,"slug":slug.current,iconRef,weight}`
  const filtersQuery = `*[_type=="shopFilter" ${tenantFilter}] | order(name asc){
    name, "slug":slug.current, type,
    "options":options[active==true] | order(weight asc){label,value}
  }`

  // If this is a legacy mount (/api/v1), return the legacy shape: { categories, filters }
  if (String(req.baseUrl || '').startsWith('/api/v1')) {
    const [categories, filters] = await Promise.all([
      fetchCMS(catsQuery, {brand, store, org}),
      fetchCMS(filtersQuery, {brand, store, org}),
    ])
    res.set('Cache-Control', 'public, max-age=43200, stale-while-revalidate=300')
    return res.json({categories, filters})
  }

  // Mobile shape: flatten filters to ShopFilter[] -> { id, label }
  const filters = await fetchCMS(filtersQuery, {brand, store, org})
  const filtersArr = Array.isArray(filters) ? filters : []
  const mapped = filtersArr.map((f: any) => ({id: f.slug || f.name, label: f.name}))
  res.set('Cache-Control', 'public, max-age=43200, stale-while-revalidate=300')
  res.json(mapped)
})
