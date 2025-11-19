/** @vitest-environment jsdom */

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import React from 'react'
import {createRoot} from 'react-dom/client'

import Articles from '../apps/admin/src/pages/Articles.jsx'

let container: HTMLElement | null = null
let root: any = null

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  // mock fetch
  // @ts-ignore
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

describe('Articles admin UI', () => {
  it('loads and updates when channel selector changes', async () => {
    // helper to poll for a condition
    async function waitFor(fn: () => boolean, timeout = 1000) {
      const start = Date.now()
      while (Date.now() - start < timeout) {
        if (fn()) return
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 10))
      }
      throw new Error('timed out waiting for condition')
    }

    // initial (All) load
    // @ts-ignore
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          _id: 'a1',
          title: 'All Article',
          publishedAt: '2024-01-01',
          status: 'published',
          channels: undefined,
        },
      ],
    })

    root.render(React.createElement(Articles))
    await waitFor(() => container!.innerHTML.includes('All Article'))

    // prepare response for mobile channel
    // @ts-ignore
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          _id: 'm1',
          title: 'Mobile Article',
          publishedAt: '2024-01-02',
          status: 'published',
          channels: ['mobile'],
        },
      ],
    })

    // find select and change value
    const select = container!.querySelector('select') as HTMLSelectElement
    expect(select).toBeTruthy()
    select.value = 'mobile'
    select.dispatchEvent(new Event('change', {bubbles: true}))

    // wait for updated content to appear
    await waitFor(() => container!.innerHTML.includes('Mobile Article'))

    expect(container!.innerHTML).toContain('Mobile Article')
    // ensure All Article is not present in the mobile view
    expect(container!.innerHTML).not.toContain('All Article')
  })
})
