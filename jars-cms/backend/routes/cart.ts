import express from 'express'
import fs from 'fs'
import path from 'path'
import inventoryRouter from './inventory'

const router = express.Router()

const cartsFile = path.resolve(__dirname, '../data/carts.json')
const pendingFile = path.resolve(__dirname, '../data/pending.json')
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

function readInventory() {
  return readJSON(inventoryFile)
}

router.get('/cart', (req, res) => {
  const userId = req.query.userId as string
  if (!userId) return res.status(400).json({error: 'userId required'})
  const carts = readJSON(cartsFile)
  const cart = carts[userId] || {items: [], promo: null}
  const inventory = readInventory()

  let subtotal = 0
  const items = cart.items.map((it: any) => {
    const storeInv = inventory[it.storeId] || {}
    const inv = storeInv[it.variantId] || {price: 0, stock: 0}
    const isLowStock = inv.stock > 0 && inv.stock <= 5
    const isSoldOut = inv.stock <= 0
    const price = inv.price
    subtotal += price * it.quantity
    return {...it, price, stock: inv.stock, isLowStock, isSoldOut}
  })

  res.json({items, promo: cart.promo, subtotal})
})

export function applyAction(cart: any, action: any) {
  const {variantId, storeId, quantity} = action
  const idx = cart.items.findIndex((i: any) => i.variantId === variantId && i.storeId === storeId)
  switch (action.type) {
    case 'add':
      if (idx >= 0) cart.items[idx].quantity += quantity || 1
      else cart.items.push({variantId, storeId, quantity: quantity || 1})
      break
    case 'remove':
      if (idx >= 0) cart.items.splice(idx, 1)
      break
    case 'update':
      if (idx >= 0) cart.items[idx].quantity = quantity
      break
  }
}

router.post('/cart/update', (req, res) => {
  const {userId, offline, ...action} = req.body
  if (!userId) return res.status(400).json({error: 'userId required'})

  if (offline) {
    const queue = readJSON(pendingFile)
    queue.push(req.body)
    writeJSON(pendingFile, queue)
    return res.json({queued: true})
  }

  const carts = readJSON(cartsFile)
  const cart = carts[userId] || {items: []}
  applyAction(cart, action)
  carts[userId] = cart
  writeJSON(cartsFile, carts)
  res.json({success: true, cart})
})

router.post('/cart/apply-promo', (req, res) => {
  const {userId, code} = req.body
  if (!userId || !code) return res.status(400).json({error: 'userId and code required'})
  const carts = readJSON(cartsFile)
  const cart = carts[userId] || {items: []}
  const promos: Record<string, number> = {SAVE10: 0.1, SAVE20: 0.2}
  if (!promos[code]) return res.status(400).json({error: 'Invalid promo'})
  cart.promo = {code, discount: promos[code]}
  carts[userId] = cart
  writeJSON(cartsFile, carts)
  res.json({success: true, cart})
})

export default router
