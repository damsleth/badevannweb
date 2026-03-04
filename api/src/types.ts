export type TemperatureBucket = 'hot' | 'warm' | 'pleasant' | 'comfortable' | 'cool' | 'cold'

export interface RawLocation {
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

export interface RawBeachTemperature {
  id: number
  temperature: number
  time: string
  location: RawLocation
  sourceDisplayName?: string | null
}

export interface BadevannDataset {
  timestamp: number
  beaches: string[]
  counties: string[]
  municipalities: string[]
  temperatures: RawBeachTemperature[]
}

export interface BeachTemperature {
  id: number
  temperature: number
  time: string
  location: RawLocation
  sourceDisplayName?: string | null
  emoji: string
  bucket: TemperatureBucket
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

export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface DatasetResult {
  dataset: BadevannDataset
  stale: boolean
  cacheAgeMs: number
}

export interface DataClient {
  getDataset: (forceRefresh?: boolean) => Promise<DatasetResult>
}
