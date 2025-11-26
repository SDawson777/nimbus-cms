// jars-cms/backend/routes/greenhouse.ts
import express from 'express'
import {client} from '../../sanity/sanityClient'

const router = express.Router()

router.get('/articles', async (_req, res) => {
  try {
    const data =
      await client.fetch(`*[_type == "article" && published == true] | order(publishedAt desc){
      _id, title, slug, excerpt, mainImage, publishedAt
    }`)
    res.json(data)
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch articles'})
  }
})

router.get('/articles/:slug', async (req, res) => {
  try {
    const {slug} = req.params
    const data = await client.fetch(
      `*[_type == "article" && slug.current == $slug][0]{
      _id, title, slug, body, publishedAt, categories[]-> { title }, mainImage
    }`,
      {slug},
    )
    res.json(data)
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch article'})
  }
})

export default router
