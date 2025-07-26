// jars-cms/server.ts
import express from 'express'
import dotenv from 'dotenv'
import greenhouseRoutes from './backend/routes/greenhouse'
import adminRoutes from './backend/routes/admin'
import contentRoutes from './backend/routes/content'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4010

app.use(express.json())
app.use('/api/greenhouse', greenhouseRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/v1/content', contentRoutes)

app.listen(PORT, () => {
  console.log(`📚 Jars CMS API running at http://localhost:${PORT}`)
})
