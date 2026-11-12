import { beforeEach, describe, expect, it, vi } from 'vitest'
import { distanceKm } from './badevann-app.js'

const beach = (id: number, name: string, temperature: number, time: string, municipality: string, county: string, lat: number, lon: number) => ({
  id,
  temperature,
  time,
  location: {
    name,
    urlPath: `Norge/${county}/${municipality}/${name}`,
    position: { lat, lon },
    region: { name: county },
    subregion: { name: municipality },
    category: { name: 'Badeplass' }
  },
  sourceDisplayName: null,
  emoji: '',
  bucket: 'cool'
})

const fakeTemperatures = {
  updatedAt: '2026-03-04T10:00:00.000Z',
  stale: false,
  total: 3,
  count: 3,
  items: [
    beach(1, 'Sørenga', 16, '2026-03-04T10:00:00+01:00', 'Oslo', 'Oslo', 59.9, 10.75),
    beach(2, 'Kalvøya', 9, '2026-03-03T10:00:00+01:00', 'Bærum', 'Akershus', 59.88, 10.52),
    beach(3, 'Bygdøy', 19, '2026-03-02T10:00:00+01:00', 'Oslo', 'Oslo', 59.91, 10.68)
  ]
}

beforeEach(() => {
  document.body.innerHTML = ''
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => fakeTemperatures }) as Response) as typeof fetch
})

async function mount(): Promise<void> {
  await import('./badevann-app.js')
  document.body.innerHTML = '<badevann-app></badevann-app>'
  await new Promise((resolve) => setTimeout(resolve))
}

const names = () => Array.from(document.querySelectorAll('.list-row .name')).map((el) => el.textContent)

function search(value: string): void {
  const input = document.querySelector<HTMLInputElement>('input#q')!
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('badevann app', () => {
  it('lists warmest first', async () => {
    await mount()
    expect(names()).toEqual(['Bygdøy', 'Sørenga', 'Kalvøya'])
  })

  it('search matches name and municipality', async () => {
    await mount()
    search('sør')
    expect(names()).toEqual(['Sørenga'])
    search('bærum')
    expect(names()).toEqual(['Kalvøya'])
  })

  it('shows empty state', async () => {
    await mount()
    search('finnes ikke')
    expect(document.querySelector('.empty')?.textContent).toContain('Fant ingen badeplasser')
  })

  it('sorts by distance after using position', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 59.89, longitude: 10.5 } } as GeolocationPosition)
      }
    })
    await mount()
    document.querySelector<HTMLButtonElement>('.locate-pill')!.click()
    expect(document.querySelector<HTMLSelectElement>('#sort')!.value).toBe('distance')
    expect(names()).toEqual(['Kalvøya', 'Bygdøy', 'Sørenga'])
    expect(document.querySelector('.list-row .meta')?.textContent).toMatch(/\d,\d km/)
  })

  it('renders error state', async () => {
    global.fetch = vi.fn(async () => {
      throw new Error('network error')
    }) as typeof fetch
    await mount()
    expect(document.querySelector('.status')?.textContent).toContain('Klarte ikke hente badevannsdata')
  })

  it('distanceKm: Oslo–Bergen is about 305 km', () => {
    expect(Math.round(distanceKm({ lat: 59.91, lon: 10.75 }, { lat: 60.39, lon: 5.32 }))).toBeGreaterThan(300)
    expect(Math.round(distanceKm({ lat: 59.91, lon: 10.75 }, { lat: 60.39, lon: 5.32 }))).toBeLessThan(310)
  })
})
