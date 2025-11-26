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

router.get('/personalization/home', async (req, res) => {
  const include = req.query.recommendations === 'true'
  try {
    let recommendations: unknown[] = []
    if (include) {
      const client = getClient(usePreview(req))
      recommendations = await client.fetch(`${productsQuery}[0...4]`)
    }
    setCaching(res)
    res.json({recommendations})
  } catch {
    const recommendations = include ? FALLBACK_PRODUCTS.slice(0, 4) : []
    res.json({recommendations})
  }
})

export default router
