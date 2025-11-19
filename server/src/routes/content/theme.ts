import {Router} from 'express'
import {z} from 'zod'
import {fetchCMS} from '../../lib/cms'

export const themeRouter = Router()

// GET /content/theme?brand=brandSlug
themeRouter.get('/', async (req, res) => {
  const {brand} = z.object({brand: z.string().optional()}).parse(req.query)

  // Resolve theme by brand slug with optional store-level override merging.
  if (!brand) return res.status(400).json({error: 'MISSING_BRAND'})
  try {
    // fetch store override if store provided
    const store = String((req.query as any).store || '').trim() || undefined
    let storeTheme: any = null
    if (store) {
      const sq = `*[_type=="themeConfig" && brand->slug.current==$brand && store->slug.current==$store][0]{"brand":brand->slug.current, primaryColor, secondaryColor, backgroundColor, textColor, "logoUrl":logo.asset->url, logoUrl, typography}`
      storeTheme = await fetchCMS(sq, {brand, store}, {preview: (req as any).preview})
    }
    const bq = `*[_type=="themeConfig" && brand->slug.current==$brand && !defined(store)][0]{"brand":brand->slug.current, primaryColor, secondaryColor, backgroundColor, textColor, "logoUrl":logo.asset->url, logoUrl, typography}`
    const brandTheme = await fetchCMS(bq, {brand}, {preview: (req as any).preview})

    const merged: any = Object.assign({}, brandTheme || {})
    if (storeTheme) {
      // override brand fields with store-specific values when present
      for (const k of Object.keys(storeTheme)) {
        const val: any = (storeTheme as any)[k]
        if (val !== undefined && val !== null) merged[k] = val
      }
    }
    if (!merged || Object.keys(merged).length === 0)
      return res.status(404).json({error: 'NOT_FOUND'})
    res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600')
    res.json(merged)
    return
  } catch (err) {
    console.error('failed to fetch theme', err)
    return res.status(500).json({error: 'FAILED'})
  }
})

export default themeRouter
