import express from 'express'
import dotenv from 'dotenv'
import greenhouseRoutes from '../routes/greenhouse'
import adminRoutes from '../routes/admin'
import contentRoutes from '../routes/content'
import productsRoutes from '../routes/products'
import personalizationRoutes from '../routes/personalization'
import inventoryRoutes from '../routes/inventory'
import cartRoutes from '../routes/cart'
import orderRoutes from '../routes/order'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4010

app.use(express.json())
app.use('/api/greenhouse', greenhouseRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/v1/content', contentRoutes)
app.use('/api/v1', productsRoutes)
app.use('/api/v1', personalizationRoutes)
app.use('/api/v1', inventoryRoutes)
app.use('/api/v1', cartRoutes)
app.use('/api/v1', orderRoutes)

app.listen(PORT, () => {
  console.log(`\uD83D\uDCDA Jars CMS API running at http://localhost:${PORT}`)
})

export default app
