import express from 'express'
import {client} from '../../sanity/sanityClient'

const router = express.Router()

router.get('/products', async (_req, res) => {
  try {
    const products = await client.fetch(
      `*[_type == "product"]{_id,name,slug,price,effects,productType->{title},availability,image}`,
    )
    res.json(products)
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch products'})
  }
})

router.get('/drops', async (_req, res) => {
  try {
    const drops = await client.fetch(
      `*[_type == "drop"]{_id,title,dropDate,highlight,products[]->{_id,name,slug}}`,
    )
    res.json(drops)
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch drops'})
  }
})

router.get('/banners', async (_req, res) => {
  try {
    const banners = await client.fetch(
      `*[_type == "banner" && active == true]{_id,title,image,ctaText,ctaLink}`,
    )
    res.json(banners)
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch banners'})
  }
})

router.get('/stores', async (_req, res) => {
  try {
    const stores = await client.fetch(`*[_type == "store"]{_id,name,location,address,phone,hours}`)
    res.json(stores)
  } catch (err) {
    res.status(500).json({error: 'Failed to fetch stores'})
  }
})

export default router
