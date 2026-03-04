import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import type { DataClient, DatasetResult } from '../src/types.js'

function buildDatasetResult(stale = false): DatasetResult {
  return {
    stale,
    cacheAgeMs: 0,
    dataset: {
      timestamp: Date.parse('2026-03-04T10:00:00Z'),
      beaches: ['Sørenga', 'Kalvøya'],
      counties: ['Oslo', 'Akershus'],
      municipalities: ['Oslo', 'Bærum'],
      temperatures: [
        {
          id: 1,
          temperature: 15,
          time: '2026-03-04T10:00:00+01:00',
          location: {
            name: 'Sørenga',
            urlPath: 'Norge/Oslo/Oslo',
            position: { lat: 59.9, lon: 10.7 },
            region: { name: 'Oslo' },
            subregion: { name: 'Oslo' },
            category: { name: 'Bydel' }
          },
          sourceDisplayName: null
        },
        {
          id: 2,
          temperature: 9,
          time: '2026-03-03T10:00:00+01:00',
          location: {
            name: 'Kalvøya',
            urlPath: 'Norge/Akershus/Baerum',
            position: { lat: 59.8, lon: 10.5 },
            region: { name: 'Akershus' },
            subregion: { name: 'Bærum' },
            category: { name: 'Oy' }
          },
          sourceDisplayName: null
        }
      ]
    }
  }
}

class FakeDataClient implements DataClient {
  constructor(private readonly result: DatasetResult, private readonly shouldThrow = false) {}

  async getDataset(): Promise<DatasetResult> {
    if (this.shouldThrow) {
      const error = new Error('bad upstream') as Error & { status?: number }
      error.status = 503
      throw error
    }

    return this.result
  }
}

describe('api integration', () => {
  it('GET /api/health returns 200', async () => {
    const app = createApp({ dataClient: new FakeDataClient(buildDatasetResult()) })
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('GET /api/meta returns counties and municipalities', async () => {
    const app = createApp({ dataClient: new FakeDataClient(buildDatasetResult()) })
    const response = await request(app).get('/api/meta')

    expect(response.status).toBe(200)
    expect(response.body.counties.length).toBeGreaterThan(0)
    expect(response.body.municipalities.length).toBeGreaterThan(0)
  })

  it('GET /api/temperatures applies filters and limit', async () => {
    const app = createApp({ dataClient: new FakeDataClient(buildDatasetResult()) })
    const response = await request(app)
      .get('/api/temperatures')
      .query({ municipality: 'Oslo', limit: 1, sort: 'temperature_desc' })

    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)
    expect(response.body.items[0].location.name).toBe('Sørenga')
  })

  it('GET /api/temperatures returns validation error for invalid sort', async () => {
    const app = createApp({ dataClient: new FakeDataClient(buildDatasetResult()) })
    const response = await request(app).get('/api/temperatures').query({ sort: 'invalid_sort' })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('GET /api/top returns descending temperatures', async () => {
    const app = createApp({ dataClient: new FakeDataClient(buildDatasetResult()) })
    const response = await request(app).get('/api/top').query({ limit: 1 })

    expect(response.status).toBe(200)
    expect(response.body.items).toHaveLength(1)
    expect(response.body.items[0].temperature).toBe(15)
  })

  it('returns stale=true when data client serves stale dataset', async () => {
    const app = createApp({ dataClient: new FakeDataClient(buildDatasetResult(true)) })
    const response = await request(app).get('/api/temperatures')

    expect(response.status).toBe(200)
    expect(response.body.stale).toBe(true)
  })

  it('returns 503 when data client fails without cache', async () => {
    const app = createApp({ dataClient: new FakeDataClient(buildDatasetResult(), true) })
    const response = await request(app).get('/api/temperatures')

    expect(response.status).toBe(503)
    expect(response.body.error.code).toBe('UPSTREAM_UNAVAILABLE')
  })
})
