import dotenv from 'dotenv'
import {createClient} from '@sanity/client'

dotenv.config()

async function main() {
  const src = process.env.SANITY_SOURCE_DATASET
  const tgt = process.env.SANITY_TARGET_DATASET
  if (!src || !tgt) {
    console.error('Set SANITY_SOURCE_DATASET and SANITY_TARGET_DATASET in env')
    process.exit(2)
  }

  const projectId = process.env.SANITY_PROJECT_ID!
  // source client uses preview token if provided, target needs a token with write access
  const srcClient = createClient({
    projectId,
    dataset: src,
    apiVersion: process.env.SANITY_API_VERSION || '2023-07-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })
  const tgtClient = createClient({
    projectId,
    dataset: tgt,
    apiVersion: process.env.SANITY_API_VERSION || '2023-07-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false,
  })

  console.log(`Promoting from ${src} to ${tgt}`)

  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run') || argv.includes('-n')
  const force = argv.includes('--force') || argv.includes('-f')

  // Page through source dataset to avoid loading all docs into memory.
  const pageSize = 1000
  let offset = 0
  let fetched = 0
  let totalProcessed = 0
  let toCreate = 0
  let toReplace = 0
  let skipped = 0

  while (true) {
    const batch = await srcClient.fetch(
      `*[] | order(_createdAt asc)[${offset}...${offset + pageSize}]`,
    )
    if (!batch || batch.length === 0) break
    fetched += batch.length
    console.log(`Fetched batch ${offset}..${offset + batch.length} (${batch.length})`)

    for (const d of batch) {
      totalProcessed++
      if (!d || !d._type) continue
      try {
        if (!d._id) {
          // If no _id, generate a fallback id to make operation deterministic
          d._id = `${d._type}-${String(d._key || d.slug || d._createdAt || totalProcessed).replace(/[^a-zA-Z0-9-_.]/g, '-')}`
        }

        if (dryRun) {
          // Check existence only to report
          const exists = await tgtClient.getDocument(d._id)
          if (exists) {
            skipped++
            if (force) toReplace++
          } else {
            toCreate++
          }
          continue
        }

        if (!force) {
          const exists = await tgtClient.getDocument(d._id)
          if (exists) {
            skipped++
            continue
          }
        }

        if (d._id) {
          // createOrReplace will upsert by id
          await tgtClient.createOrReplace(d)
          if (force) toReplace++
          else toCreate++
        } else {
          await tgtClient.create(d)
          toCreate++
        }
      } catch (err) {
        console.error('failed to promote doc', d._id || d._type, err)
      }
    }

    offset += pageSize
  }

  console.log(
    `Promotion summary: fetched=${fetched} processed=${totalProcessed} created=${toCreate} replaced=${toReplace} skipped=${skipped}`,
  )
  if (dryRun) console.log('Dry-run mode: no changes were written to target dataset')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
