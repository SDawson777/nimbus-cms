import {Router} from 'express'
import path from 'path'

const router = Router()

// Serve a minimal admin login page useful for preview/dev
router.get('/admin-login', (_req, res) => {
  const filePath = path.join(__dirname, '..', 'static', 'admin-login.html')
  res.sendFile(filePath)
})

export default router
