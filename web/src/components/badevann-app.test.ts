import { beforeEach, describe, expect, it, vi } from 'vitest'
import './bv-filter-bar.js'
import './bv-toplist.js'
import './bv-temperature-list.js'
import './bv-beach-detail.js'
import './bv-status-bar.js'
import './badevann-app.js'

const fakeMeta = {
  updatedAt: '2026-03-04T10:00:00.000Z',
  stale: false,
  counts: {
    beaches: 3,
    counties: 2,
    municipalities: 2
  },
  counties: ['Oslo', 'Akershus'],
  municipalities: ['Oslo', 'Bærum']
}

const fakeTemperatures = {
  updatedAt: '2026-03-04T10:00:00.000Z',
  stale: false,
  total: 3,
  count: 3,
  items: [
    {
      id: 1,
      temperature: 16,
      time: '2026-03-04T10:00:00+01:00',
      location: {
        name: 'Sørenga',
        urlPath: 'Norge/Oslo/Oslo',
        position: { lat: 1, lon: 1 },
        region: { name: 'Oslo' },
        subregion: { name: 'Oslo' },
        category: { name: 'Bydel' }
      },
      sourceDisplayName: null,
      emoji: '😑',
      bucket: 'cool'
    },
    {
      id: 2,
      temperature: 9,
      time: '2026-03-03T10:00:00+01:00',
      location: {
        name: 'Kalvøya',
        urlPath: 'Norge/Akershus/Baerum',
        position: { lat: 1, lon: 1 },
        region: { name: 'Akershus' },
        subregion: { name: 'Bærum' },
        category: { name: 'Oy' }
      },
      sourceDisplayName: null,
      emoji: '⛄️',
      bucket: 'cold'
    },
    {
      id: 3,
      temperature: 19,
      time: '2026-03-02T10:00:00+01:00',
      location: {
        name: 'Bygdøy',
        urlPath: 'Norge/Oslo/Oslo',
        position: { lat: 1, lon: 1 },
        region: { name: 'Oslo' },
        subregion: { name: 'Oslo' },
        category: { name: 'Bydel' }
      },
      sourceDisplayName: null,
      emoji: '😊',
      bucket: 'comfortable'
    }
  ]
}

beforeEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''

  global.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url

    if (url.includes('/api/meta')) {
      return {
        ok: true,
        json: async () => fakeMeta
      } as Response
    }

    if (url.includes('/api/temperatures')) {
      return {
        ok: true,
        json: async () => fakeTemperatures
      } as Response
    }

    return {
      ok: false,
      status: 500,
      json: async () => ({})
    } as Response
  }) as typeof fetch
})

async function flushAppLoad(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('badevann app components', () => {
  it('search input updates list after debounce', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<badevann-app></badevann-app>'
    await flushAppLoad()

    const input = document.querySelector<HTMLInputElement>('input#q')
    expect(input).toBeTruthy()

    input!.value = 'sør'
    input!.dispatchEvent(new Event('input', { bubbles: true }))

    await vi.advanceTimersByTimeAsync(260)
    await Promise.resolve()

    const listRows = document.querySelectorAll('.list-row')
    expect(listRows.length).toBe(1)
    expect(listRows[0]?.textContent).toContain('Sørenga')
  })

  it('filter change recalculates list', async () => {
    document.body.innerHTML = '<badevann-app></badevann-app>'
    await flushAppLoad()

    const select = document.querySelector<HTMLSelectElement>('select#county')
    select!.value = 'Akershus'
    select!.dispatchEvent(new Event('change', { bubbles: true }))
    await Promise.resolve()

    const rows = document.querySelectorAll('.list-row')
    expect(rows.length).toBe(1)
    expect(rows[0]?.textContent).toContain('Kalvøya')
  })

  it('clicking a row opens detail panel with correct data', async () => {
    document.body.innerHTML = '<badevann-app></badevann-app>'
    await flushAppLoad()

    const target = Array.from(document.querySelectorAll<HTMLButtonElement>('.list-row')).find((button) =>
      button.textContent?.includes('Kalvøya')
    )

    target?.click()
    await Promise.resolve()

    const detail = document.querySelector('bv-beach-detail')
    expect(detail?.textContent).toContain('Kalvøya')
  })

  it('top list shows hottest beach first', async () => {
    document.body.innerHTML = '<badevann-app></badevann-app>'
    await flushAppLoad()

    const firstTop = document.querySelector('bv-toplist .top-row .name')
    expect(firstTop?.textContent).toContain('Bygdøy')
  })

  it('renders empty and error states', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('network error')
    }) as typeof fetch

    document.body.innerHTML = '<badevann-app></badevann-app>'
    await flushAppLoad()

    const status = document.querySelector('bv-status-bar')
    expect(status?.textContent).toContain('Klarte ikke hente badevannsdata')
  })
})
