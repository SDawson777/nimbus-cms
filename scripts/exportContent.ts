import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import {createClient} from '@sanity/client'

dotenv.config()

async function main() {
  const outDir = path.join(process.cwd(), 'backups')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive: true})

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const outFile = path.join(outDir, `export-${date}.json`)

  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || '2023-07-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })

  // Types we consider relevant for export
  const types = [
    'greenhouseArticle',
    'faqGroup',
    'legalDoc',
    'deal',
    'product',
    'organization',
    'brand',
    'store',
    'contentMetric',
  ]

  console.log('Exporting types:', types.join(', '))

  const results: Record<string, any[]> = {}

  for (const t of types) {
    const q = `*[_type == "${t}"]` // simple full export per type
    console.log('Querying', t)
    try {
      const docs = await client.fetch(q)
      results[t] = docs || []
      console.log(`  fetched ${results[t].length} ${t}`)
    } catch (err) {
      console.error('failed to fetch', t, err)
      results[t] = []
    }
  }

  // Also export any other top-level docs (safety)
  try {
    const others = await client.fetch('*[!(_type in $types)]', {types})
    results.__others = others || []
  } catch (err) {
    // ignore
  }

  fs.writeFileSync(
    outFile,
    JSON.stringify({exportedAt: new Date().toISOString(), results}, null, 2),
  )
  console.log('Wrote', outFile)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
