import { describe, expect, it, vi } from 'vitest'
import { createBadevannClient, UpstreamUnavailableError } from './badevannClient.js'

function buildPayload() {
  return {
    Timestamp: Date.now(),
    Beaches: ['Sørenga'],
    Counties: ['Oslo'],
    Municipalities: ['Oslo'],
    Data: [
      {
        id: 1,
        temperature: 10,
        time: '2026-03-04T10:00:00+01:00',
        location: {
          name: 'Sørenga',
          urlPath: 'Norge/Oslo/Oslo',
          position: { lat: 59.9, lon: 10.7 },
          region: { name: 'Oslo' },
          subregion: { name: 'Oslo' },
          category: { name: 'Bydel' }
        }
      }
    ]
  }
}

describe('badevann client caching', () => {
  it('deduplicates concurrent refresh calls and uses cache within ttl', async () => {
    const loader = vi.fn(async () => buildPayload())

    let currentTime = 1000
    const client = createBadevannClient({
      ttlMs: 15 * 60 * 1000,
      now: () => currentTime,
      loader
    })

    await Promise.all([client.getDataset(), client.getDataset(), client.getDataset()])

    expect(loader).toHaveBeenCalledTimes(1)

    currentTime += 1000
    await client.getDataset()

    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('returns stale cache when refresh fails and cache exists', async () => {
    const loader = vi
      .fn()
      .mockResolvedValueOnce(buildPayload())
      .mockRejectedValueOnce(new Error('upstream down'))

    let currentTime = 1000
    const client = createBadevannClient({
      ttlMs: 1,
      now: () => currentTime,
      loader
    })

    await client.getDataset()
    currentTime = 5000
    const stale = await client.getDataset()

    expect(stale.stale).toBe(true)
    expect(stale.dataset.temperatures).toHaveLength(1)
  })

  it('throws 503-style error when no cache and upstream fails', async () => {
    const loader = vi.fn(async () => {
      throw new Error('upstream down')
    })

    const client = createBadevannClient({ loader })

    await expect(client.getDataset()).rejects.toBeInstanceOf(UpstreamUnavailableError)
  })
})
