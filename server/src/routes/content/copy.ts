import { Router } from 'express'
import { z } from 'zod'
import { fetchCMS } from '../../lib/cms'

export const copyRouter = Router()

copyRouter.get('/', async (req, res) => {
  const { context } = z
    .object({
      context: z.enum([
        'onboarding',
        'emptyStates',
        'awards',
        'accessibility',
        'dataTransparency'
      ])
    })
    .parse(req.query)
  const items = await fetchCMS(
    '*[_type=="appCopy" && context==$ctx]{key,text}[0...100]',
    { ctx: context }
  )
  res.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=300')
  res.json(items)
})

