import type { TemperatureListResponse } from '../types.js'

export async function getTemperatures(): Promise<TemperatureListResponse> {
  const response = await fetch('/api/temperatures')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for /api/temperatures`)
  }
  return (await response.json()) as TemperatureListResponse
}
