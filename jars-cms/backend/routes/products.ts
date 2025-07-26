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

export default router
