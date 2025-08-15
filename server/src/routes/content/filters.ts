import { Router } from 'express'
import { fetchCMS } from '../../lib/cms'

export const filtersRouter = Router()

filtersRouter.get('/', async (_req, res) => {
  const catsQuery =
    '*[_type=="shopCategory" && active==true] | order(weight asc){name,"slug":slug.current,iconRef,weight}'
  const filtersQuery = `*[_type=="shopFilter"] | order(name asc){
    name, "slug":slug.current, type,
    "options":options[active==true] | order(weight asc){label,value}
  }`
  const [categories, filters] = await Promise.all([
    fetchCMS(catsQuery, {}),
    fetchCMS(filtersQuery, {})
  ])
  res.set('Cache-Control', 'public, max-age=43200, stale-while-revalidate=300')
  res.json({ categories, filters })
})

