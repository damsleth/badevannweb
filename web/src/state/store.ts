import { getMeta, getTemperatures } from '../api/client.js'
import type { BeachTemperature, MetaResponse, SortType } from '../types.js'

export interface Filters {
  q: string
  county: string
  municipality: string
  sort: SortType
}

export interface AppState {
  loading: boolean
  error: string | null
  stale: boolean
  updatedAt: string | null
  meta: MetaResponse | null
  allItems: BeachTemperature[]
  visibleItems: BeachTemperature[]
  topItems: BeachTemperature[]
  selectedId: number | null
  filters: Filters
}

const defaultFilters: Filters = {
  q: '',
  county: '',
  municipality: '',
  sort: 'temperature_desc'
}

function fold(value: string): string {
  return value.toLocaleLowerCase('nb-NO').trim()
}

function sortItems(items: BeachTemperature[], sort: SortType): BeachTemperature[] {
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

function filterItems(items: BeachTemperature[], filters: Filters): BeachTemperature[] {
  let result = [...items]

  if (filters.q) {
    const needle = fold(filters.q)
    result = result.filter((item) => fold(item.location.name).includes(needle))
  }

  if (filters.county) {
    const county = fold(filters.county)
    result = result.filter((item) => fold(item.location.region?.name ?? '') === county)
  }

  if (filters.municipality) {
    const municipality = fold(filters.municipality)
    result = result.filter((item) => fold(item.location.subregion?.name ?? '') === municipality)
  }

  return sortItems(result, filters.sort)
}

function withDerived(state: AppState): AppState {
  const visibleItems = filterItems(state.allItems, state.filters)
  const topItems = [...visibleItems].sort((a, b) => b.temperature - a.temperature).slice(0, 10)

  const hasSelected = state.selectedId
    ? visibleItems.some((item) => item.id === state.selectedId)
    : false

  return {
    ...state,
    visibleItems,
    topItems,
    selectedId: hasSelected ? state.selectedId : visibleItems[0]?.id ?? null
  }
}

export class BadevannStore extends EventTarget {
  private state: AppState = {
    loading: false,
    error: null,
    stale: false,
    updatedAt: null,
    meta: null,
    allItems: [],
    visibleItems: [],
    topItems: [],
    selectedId: null,
    filters: defaultFilters
  }

  getState(): AppState {
    return this.state
  }

  subscribe(listener: () => void): () => void {
    this.addEventListener('change', listener)
    return () => this.removeEventListener('change', listener)
  }

  private setState(nextState: AppState): void {
    this.state = nextState
    this.dispatchEvent(new Event('change'))
  }

  async initialize(): Promise<void> {
    this.setState({ ...this.state, loading: true, error: null })

    try {
      const [meta, temperatures] = await Promise.all([getMeta(), getTemperatures()])
      const next = withDerived({
        ...this.state,
        loading: false,
        error: null,
        stale: temperatures.stale,
        updatedAt: temperatures.updatedAt,
        meta,
        allItems: temperatures.items,
        selectedId: temperatures.items[0]?.id ?? null
      })

      this.setState(next)
    } catch (_error) {
      this.setState({
        ...this.state,
        loading: false,
        error: 'Klarte ikke hente badevannsdata. Proev igjen snart.'
      })
    }
  }

  updateFilters(patch: Partial<Filters>): void {
    const next = withDerived({
      ...this.state,
      filters: {
        ...this.state.filters,
        ...patch
      }
    })

    this.setState(next)
  }

  selectBeach(id: number): void {
    this.setState({
      ...this.state,
      selectedId: id
    })
  }
}

export function getSelectedBeach(state: AppState): BeachTemperature | null {
  if (state.selectedId === null) {
    return null
  }
  return state.visibleItems.find((item) => item.id === state.selectedId) ?? null
}
