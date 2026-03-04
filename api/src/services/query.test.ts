import { describe, expect, it } from 'vitest'
import { applyTemperatureQuery, sortItems } from './query.js'
import type { BeachTemperature } from '../types.js'

const data: BeachTemperature[] = [
  {
    id: 1,
    temperature: 15,
    time: '2026-03-03T10:00:00+01:00',
    location: {
      name: 'Sørenga',
      urlPath: 'Norge/Oslo/Oslo',
      position: { lat: 59.9, lon: 10.7 },
      region: { name: 'Oslo' },
      subregion: { name: 'Oslo' },
      category: { name: 'Bydel' }
    },
    sourceDisplayName: null,
    bucket: 'cool',
    emoji: '😑'
  },
  {
    id: 2,
    temperature: 11,
    time: '2026-03-02T10:00:00+01:00',
    location: {
      name: 'Kalvøya',
      urlPath: 'Norge/Akershus/Baerum',
      position: { lat: 59.8, lon: 10.5 },
      region: { name: 'Akershus' },
      subregion: { name: 'Bærum' },
      category: { name: 'Oy' }
    },
    sourceDisplayName: null,
    bucket: 'cold',
    emoji: '🥶'
  },
  {
    id: 3,
    temperature: 18,
    time: '2026-03-04T10:00:00+01:00',
    location: {
      name: 'Bygdøy',
      urlPath: 'Norge/Oslo/Oslo',
      position: { lat: 59.9, lon: 10.6 },
      region: { name: 'Oslo' },
      subregion: { name: 'Oslo' },
      category: { name: 'Bydel' }
    },
    sourceDisplayName: null,
    bucket: 'comfortable',
    emoji: '😊'
  }
]

describe('query service', () => {
  it('finds by search text case-insensitively with Norwegian characters', () => {
    const result = applyTemperatureQuery(data, {
      q: 'sØR',
      sort: 'temperature_desc'
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.location.name).toBe('Sørenga')
  })

  it('filters by county and municipality together', () => {
    const result = applyTemperatureQuery(data, {
      county: 'oslo',
      municipality: 'oslo',
      sort: 'temperature_desc'
    })

    expect(result).toHaveLength(2)
  })

  it('sorts by each supported sort mode', () => {
    expect(sortItems(data, 'temperature_desc')[0]?.temperature).toBe(18)
    expect(sortItems(data, 'temperature_asc')[0]?.temperature).toBe(11)
    expect(sortItems(data, 'name_asc')[0]?.location.name).toBe('Bygdøy')
    expect(sortItems(data, 'newest_desc')[0]?.time).toBe('2026-03-04T10:00:00+01:00')
  })

  it('limits to max count', () => {
    const result = applyTemperatureQuery(data, {
      sort: 'temperature_desc',
      limit: 2
    })

    expect(result).toHaveLength(2)
  })
})
