import express from 'express'
import fs from 'fs'
import path from 'path'

const router = express.Router()

const cartsFile = path.resolve(__dirname, '../data/carts.json')
const ordersFile = path.resolve(__dirname, '../data/orders.json')
const inventoryFile = path.resolve(__dirname, '../data/inventory.json')

function readJSON(file: string) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return Array.isArray(file) ? [] : {}
  }
}

function writeJSON(file: string, data: any) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

const lastOrder: Record<string, number> = {}

router.post('/order', (req, res) => {
  const {userId, contact, payment, storeId} = req.body
  if (!userId || !contact || !payment || !storeId)
    return res.status(400).json({error: 'Missing fields'})

  const now = Date.now()
  if (lastOrder[userId] && now - lastOrder[userId] < 30000) {
    return res.status(429).json({error: 'rate_limited'})
  }

  const carts = readJSON(cartsFile)
  const cart = carts[userId]
  if (!cart || cart.items.length === 0) return res.status(400).json({error: 'cart_empty'})

  const inventory = readJSON(inventoryFile)
  const storeInv = inventory[storeId] || {}

  for (const item of cart.items) {
    const inv = storeInv[item.variantId]
    if (!inv || inv.stock < item.quantity) {
      return res.status(400).json({error: 'out_of_stock', variantId: item.variantId})
    }
  }

  for (const item of cart.items) {
    const inv = storeInv[item.variantId]
    inv.stock -= item.quantity
  }
  inventory[storeId] = storeInv
  writeJSON(inventoryFile, inventory)

  const orders = readJSON(ordersFile)
  const orderId = `ord-${Date.now()}`
  orders.push({orderId, userId, contact, payment, items: cart.items, storeId})
  writeJSON(ordersFile, orders)

  delete carts[userId]
  writeJSON(cartsFile, carts)

  lastOrder[userId] = now
  res.json({success: true, orderId})
})

export default router
