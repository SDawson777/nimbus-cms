import { Router } from 'express'

export const contentRouter = Router()
// add `?preview=true` passthrough for studio live preview
contentRouter.use((req, _res, next) => {
  ;(req as any).preview = req.query.preview === 'true'
  next()
})

import { legalRouter } from './legal'
import { faqsRouter } from './faqs'
import { articlesRouter } from './articles'
import { filtersRouter } from './filters'
import { copyRouter } from './copy'
import { dealsRouter } from './deals'

contentRouter.use('/legal', legalRouter)
contentRouter.use('/faqs', faqsRouter)
contentRouter.use('/articles', articlesRouter)
contentRouter.use('/filters', filtersRouter)
contentRouter.use('/copy', copyRouter)
contentRouter.use('/deals', dealsRouter)