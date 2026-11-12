export type SortType = 'temperature_desc' | 'temperature_asc' | 'distance' | 'newest_desc' | 'name_asc'

export interface Position {
  lat: number
  lon: number
}

export interface BeachTemperature {
  id: number
  temperature: number
  time: string
  location: {
    id?: string
    name: string
    urlPath: string
    position: Position
    region?: { id?: string; name?: string } | null
    subregion?: { id?: string; name?: string } | null
    category?: { id?: string; name?: string } | null
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
