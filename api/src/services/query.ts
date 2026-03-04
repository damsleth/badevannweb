import type { BeachTemperature } from '../types.js'

export type SortType =
  | 'temperature_desc'
  | 'temperature_asc'
  | 'name_asc'
  | 'newest_desc'

export interface TemperatureQuery {
  q?: string
  county?: string
  municipality?: string
  sort: SortType
  limit?: number
}

function fold(text: string): string {
  return text.toLocaleLowerCase('nb-NO').trim()
}

export function applyTemperatureQuery(
  items: BeachTemperature[],
  query: TemperatureQuery
): BeachTemperature[] {
  let result = [...items]

  if (query.q) {
    const search = fold(query.q)
    result = result.filter((item) => fold(item.location.name).includes(search))
  }

  if (query.county) {
    const county = fold(query.county)
    result = result.filter((item) => fold(item.location.region?.name ?? '') === county)
  }

  if (query.municipality) {
    const municipality = fold(query.municipality)
    result = result.filter(
      (item) => fold(item.location.subregion?.name ?? '') === municipality
    )
  }

  result = sortItems(result, query.sort)

  if (query.limit) {
    const cappedLimit = Math.max(1, Math.min(5000, query.limit))
    result = result.slice(0, cappedLimit)
  }

  return result
}

export function sortItems(items: BeachTemperature[], sort: SortType): BeachTemperature[] {
  const sorted = [...items]

  switch (sort) {
    case 'temperature_asc':
      return sorted.sort((a, b) => a.temperature - b.temperature)
    case 'name_asc':
      return sorted.sort((a, b) =>
        a.location.name.localeCompare(b.location.name, 'nb-NO', { sensitivity: 'base' })
      )
    case 'newest_desc':
      return sorted.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    case 'temperature_desc':
    default:
      return sorted.sort((a, b) => b.temperature - a.temperature)
  }
}
