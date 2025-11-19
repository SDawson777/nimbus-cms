import {Router} from 'express'

export const contentRouter = Router()
// add `?preview=true` or `X-Preview: true` passthrough for studio live preview
// single source of truth for preview mode used by all content routes
contentRouter.use((req, _res, next) => {
  // Preview can be enabled via query or header. If PREVIEW_SECRET is set,
  // require the matching secret via `?secret=...` or `X-Preview-Secret` header.
  const previewQuery = req.query && req.query.preview === 'true'
  const previewHeader = String(req.header('X-Preview') || '').toLowerCase() === 'true'

  const previewSecretEnv = process.env.PREVIEW_SECRET
  const querySecret = req.query && String((req.query as any).secret || '')
  const headerSecret = String(req.header('X-Preview-Secret') || '')

  const querySecretValid = !previewSecretEnv || querySecret === previewSecretEnv
  const headerSecretValid = !previewSecretEnv || headerSecret === previewSecretEnv

  ;(req as any).preview = (previewQuery && querySecretValid) || (previewHeader && headerSecretValid)
  next()
})

import {legalRouter} from './legal'
import {faqsRouter} from './faqs'
import {articlesRouter} from './articles'
import {filtersRouter} from './filters'
import {copyRouter} from './copy'
import {dealsRouter} from './deals'
import themeRouter from './theme'

contentRouter.use('/legal', legalRouter)
contentRouter.use('/faqs', faqsRouter)
// Mobile-canonical FAQ aliases
contentRouter.use('/fa_q', faqsRouter)
contentRouter.use('/faq', faqsRouter)
contentRouter.use('/articles', articlesRouter)
contentRouter.use('/filters', filtersRouter)
contentRouter.use('/copy', copyRouter)
contentRouter.use('/deals', dealsRouter)
contentRouter.use('/theme', themeRouter)
