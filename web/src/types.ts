export type SortType =
  | 'temperature_desc'
  | 'temperature_asc'
  | 'name_asc'
  | 'newest_desc'

export interface BeachTemperature {
  id: number
  temperature: number
  time: string
  location: {
    name: string
    urlPath: string
    position: {
      lat: number
      lon: number
    }
    region?: {
      id?: string
      name?: string
    } | null
    subregion?: {
      id?: string
      name?: string
    } | null
    category?: {
      id?: string
      name?: string
    } | null
  }
  sourceDisplayName?: string | null
  emoji: string
  bucket: 'hot' | 'warm' | 'pleasant' | 'comfortable' | 'cool' | 'cold'
}

export interface TemperatureListResponse {
  updatedAt: string
  stale: boolean
  total: number
  count: number
  items: BeachTemperature[]
}

export interface TopResponse {
  updatedAt: string
  stale: boolean
  count: number
  items: BeachTemperature[]
}

export interface MetaResponse {
  updatedAt: string
  stale: boolean
  counts: {
    beaches: number
    counties: number
    municipalities: number
  }
  counties: string[]
  municipalities: string[]
}
