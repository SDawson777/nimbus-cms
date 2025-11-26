import express from 'express'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import {content} from './routes/content'

const app = express()
app.use(cors({origin: (process.env.CMS_CORS_ORIGINS?.split(',') || ['*']).map((s) => s.trim())}))
app.use(compression())
app.use(express.json())
app.use(morgan('tiny'))

app.get('/health', (_req, res) => res.json({ok: true, dataset: process.env.SANITY_DATASET}))
app.use('/api/v1/content', content)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => console.log(`[jars-cms-api] :${port}`))
