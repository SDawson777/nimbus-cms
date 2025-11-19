import 'dotenv/config'
import app from './index'

const PORT = Number(process.env.PORT || 4010)

app.listen(PORT, () => {
  console.log(`JARS CMS API listening on port ${PORT}`)
})

export default app
