import express from 'express'
import fs from 'fs'
import path from 'path'
import {getClient} from '../sanityClient'
import {
  FALLBACK_FAQ,
  FALLBACK_LEGAL,
  FALLBACK_ARTICLES,
  FALLBACK_FILTERS,
} from '../fallback'

const queriesDir = path.resolve(__dirname, '../../queries')
const faqQuery = fs.readFileSync(path.join(queriesDir, 'getFAQ.groq'), 'utf8')
const legalQuery = fs.readFileSync(path.join(queriesDir, 'getLegalContent.groq'), 'utf8')
const articlesQuery = fs.readFileSync(path.join(queriesDir, 'getArticles.groq'), 'utf8')
const filtersQuery = fs.readFileSync(path.join(queriesDir, 'getFilters.groq'), 'utf8')

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

router.get('/faq', async (req, res) => {
  try {
    const client = getClient(usePreview(req))
    const data = await client.fetch(faqQuery)
    setCaching(res)
    res.json(data)
  } catch {
    res.json(FALLBACK_FAQ)
  }
})

router.get('/legal', async (req, res) => {
  try {
    const client = getClient(usePreview(req))
    const data = await client.fetch(legalQuery)
    setCaching(res)
    res.json(data)
  } catch {
    res.json(FALLBACK_LEGAL)
  }
})

router.get('/articles', async (req, res) => {
  try {
    const client = getClient(usePreview(req))
    const data = await client.fetch(articlesQuery)
    setCaching(res)
    res.json(data)
  } catch {
    res.json(FALLBACK_ARTICLES)
  }
})

router.get('/articles/:slug', async (req, res) => {
  try {
    const client = getClient(usePreview(req))
    const article = await client.fetch(
      '*[_type == "article" && slug.current == $slug][0]',
      {slug: req.params.slug},
    )
    setCaching(res)
    res.json(article)
  } catch {
    res.status(404).json({error: 'Article not found'})
  }
})

router.get('/filters', async (req, res) => {
  try {
    const client = getClient(usePreview(req))
    const data = await client.fetch(filtersQuery)
    setCaching(res)
    res.json(data)
  } catch {
    res.json(FALLBACK_FILTERS)
  }
})

export default router
