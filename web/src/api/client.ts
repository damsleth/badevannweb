import type { MetaResponse, TemperatureListResponse, TopResponse } from '../types.js'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  return (await response.json()) as T
}

export function getMeta(): Promise<MetaResponse> {
  return fetchJson<MetaResponse>('/api/meta')
}

export function getTemperatures(): Promise<TemperatureListResponse> {
  return fetchJson<TemperatureListResponse>('/api/temperatures')
}

export function getTop(limit = 10): Promise<TopResponse> {
  return fetchJson<TopResponse>(`/api/top?limit=${limit}`)
}
