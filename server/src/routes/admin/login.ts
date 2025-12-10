import {Router} from 'express'
import {setAdminSession} from '../../middleware/session'

const router = Router()

router.post('/', async (req, res) => {
  const {email, password} = req.body

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL!
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!

  if (!email || !password) {
    return res.status(400).json({error: 'Missing credentials'})
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({error: 'Invalid credentials'})
  }

  setAdminSession(res, {email})

  return res.json({ok: true})
})

export default router
