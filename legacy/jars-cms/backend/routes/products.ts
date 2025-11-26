import express from 'express'
import fs from 'fs'
import path from 'path'
import {getClient} from '../sanityClient'
import {FALLBACK_PRODUCTS} from '../fallback'

const queriesDir = path.resolve(__dirname, '../../queries')
const productsQuery = fs.readFileSync(path.join(queriesDir, 'getProducts.groq'), 'utf8')

const router = express.Router()

function setCaching(res: express.Response) {
  if (process.env.NODE_ENV === 'production') {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=30')
  }
}

function usePreview(req: express.Request) {
  return (
    req.query.preview === 'true' &&
    req.headers.authorization === `Bearer ${process.env.SANITY_PREVIEW_TOKEN}`
  )
}

router.get('/products', async (req, res) => {
  try {
    const client = getClient(usePreview(req))
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const offset = (page - 1) * pageSize

    const query = `${productsQuery}[${offset}...${offset + pageSize}]`
    const data = await client.fetch(query)
    setCaching(res)
    res.json({results: data, page, pageSize})
  } catch {
    res.json({results: FALLBACK_PRODUCTS})
  }
})

router.get('/products/:id', async (req, res) => {
  const id = req.params.id
  const storeId = req.query.storeId as string
  try {
    const client = getClient(usePreview(req))
    const query = `*[_type == "product" && _id == "${id}"][0]`
    const product = await client.fetch(query)
    const inventoryData = fs.existsSync(path.resolve(__dirname, '../data/inventory.json'))
      ? JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/inventory.json'), 'utf8'))
      : {}
    const invStore = (inventoryData as any)[storeId] || {}
    const inv = invStore[id] || {price: 0, stock: 0}
    const isLowStock = inv.stock > 0 && inv.stock <= 5
    const isSoldOut = inv.stock <= 0
    setCaching(res)
    res.json({...product, inventory: {...inv, isLowStock, isSoldOut}})
  } catch {
    res.status(404).json({error: 'Not found'})
  }
})

export default router
