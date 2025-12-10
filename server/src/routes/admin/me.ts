import {Router} from 'express'
import {requireAdmin} from '../../middleware/session'

const router = Router()

router.get('/', requireAdmin, (req, res) => {
  res.json({
    email: (req as any).admin.email,
    role: 'admin',
  })
})

export default router
