import express from 'express'
import fs from 'fs'
import path from 'path'

const router = express.Router()

const dataFile = path.resolve(__dirname, '../data/inventory.json')

function readInventory() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  } catch {
    return {}
  }
}

function writeInventory(data: Record<string, any>) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2))
}

router.put('/inventory/bulk-update', (req, res) => {
  const updates = req.body
  if (!Array.isArray(updates)) {
    return res.status(400).json({error: 'Invalid payload'})
  }
  const inventory = readInventory()
  for (const item of updates) {
    const {storeId, variantId, price, stock} = item
    if (!storeId || !variantId) continue
    if (!inventory[storeId]) inventory[storeId] = {}
    inventory[storeId][variantId] = {price, stock}
  }
  writeInventory(inventory)
  res.json({success: true})
})

router.get('/inventory/:storeId?', (_req, res) => {
  const inventory = readInventory()
  const storeId = _req.params.storeId
  if (storeId) {
    res.json(inventory[storeId] || {})
  } else {
    res.json(inventory)
  }
})

export default router
