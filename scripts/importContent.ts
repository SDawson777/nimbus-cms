import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import {createClient} from '@sanity/client'

dotenv.config()

async function main() {
  const filePath = path.resolve(process.cwd(), process.argv.slice(2)[0])
  const argv = process.argv.slice(2)
  if (argv.length === 0) {
    console.error('Usage: importContent.ts <path-to-export.json> [--dry-run] [--force]')
    process.exit(2)
  }
  // filePath derived from argv[0]
  // const filePath = path.resolve(process.cwd(), argv[0])
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath)
    process.exit(2)
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw)
  const results = parsed.results || parsed

  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET!,
    apiVersion: process.env.SANITY_API_VERSION || '2023-07-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })

  const dryRun = argv.includes('--dry-run') || argv.includes('-n')
  const force = argv.includes('--force') || argv.includes('-f')

  // Iterate types and upsert docs
  for (const key of Object.keys(results)) {
    if (key === '__others') continue
    const docs = results[key] || []
    console.log(`Importing ${docs.length} docs for type ${key}`)
    for (const doc of docs) {
      try {
        // Favor existing _id. If not present but slug.current exists, generate an id to keep idempotency
        let id = doc._id
        if (!id) {
          const slug =
            (doc.slug && (doc.slug.current || doc.slug)) || doc.contentSlug || doc._key || undefined
          if (slug) id = `${doc._type || key}-${String(slug).replace(/[^a-zA-Z0-9-_.]/g, '-')}`
        }

        if (dryRun) {
          // Report what would happen
          if (id) {
            const exists = await client.getDocument(id)
            if (exists && !force) console.log('[dry-run] skip existing', id)
            else if (exists && force) console.log('[dry-run] would replace', id)
            else console.log('[dry-run] would create', id)
          } else {
            console.log('[dry-run] would create new (no id) for', doc._type)
          }
          continue
        }

        if (id) {
          if (!force) {
            const exists = await client.getDocument(id)
            if (exists) {
              // skip unless forced
              continue
            }
          }
          await client.createOrReplace({...doc, _id: id})
        } else {
          await client.create(doc)
        }
      } catch (err) {
        console.error('failed to import doc', doc._id || doc.slug || '', err)
      }
    }
  }

  console.log('Import complete')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
