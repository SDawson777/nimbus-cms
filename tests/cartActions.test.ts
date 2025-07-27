import {describe, it, expect} from 'vitest'
import {applyAction} from '../jars-cms/backend/routes/cart'

describe('applyAction', () => {
  it('adds new items to the cart', () => {
    const cart = {items: [] as any[]}
    applyAction(cart, {type: 'add', variantId: 'v1', storeId: 's1', quantity: 2})
    expect(cart.items).toEqual([{variantId: 'v1', storeId: 's1', quantity: 2}])
  })

  it('updates item quantity when existing', () => {
    const cart = {items: [{variantId: 'v1', storeId: 's1', quantity: 1}]}
    applyAction(cart, {type: 'update', variantId: 'v1', storeId: 's1', quantity: 5})
    expect(cart.items[0].quantity).toBe(5)
  })
})
