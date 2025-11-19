/** @vitest-environment jsdom */

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import React from 'react'
import {createRoot} from 'react-dom/client'

import ThemePage from '../apps/admin/src/pages/Theme.jsx'

let container: HTMLElement | null = null
let root: any = null

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  // mock fetch
  globalThis.fetch = vi.fn()
})

afterEach(() => {
  try {
    if (root) root.unmount()
  } catch (e) {}
  if (container && container.parentNode) container.parentNode.removeChild(container)
  container = null
  // @ts-ignore
  globalThis.fetch = undefined
})

describe('ThemePage UI', () => {
  it('loads paginated configs when List configs is clicked', async () => {
    // mock the paginated configs response
    // first call will be to /api/admin/theme/configs
    // @ts-ignore
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{id: 't1', brand: 'b1', accentColor: '#abc'}],
        total: 1,
        page: 1,
        perPage: 10,
      }),
    })

    root.render(React.createElement(ThemePage))
    // wait a tick for render
    await new Promise((r) => setTimeout(r, 0))

    // set brand input
    const brandInput = container!.querySelector(
      'input[placeholder="brand slug"]',
    ) as HTMLInputElement
    expect(brandInput).toBeTruthy()
    brandInput.value = 'b1'
    brandInput.dispatchEvent(new Event('input', {bubbles: true}))

    // click the List configs button
    const buttons = Array.from(container!.querySelectorAll('button'))
    const listBtn = buttons.find((b) => /List configs/.test(b.textContent || ''))
    expect(listBtn).toBeTruthy()
    listBtn!.dispatchEvent(new MouseEvent('click', {bubbles: true}))

    // wait a tick for async
    await new Promise((r) => setTimeout(r, 0))

    // assert that the table contains our item id
    expect(container!.innerHTML).toContain('t1')
    expect(container!.innerHTML).toContain('b1')
  })
})
