import type { BadevannDataset, DataClient, DatasetResult, RawBeachTemperature } from '../types.js'

export class UpstreamUnavailableError extends Error {
  status = 503

  constructor(message = 'Kunne ikke hente data fra badevann/yr') {
    super(message)
    this.name = 'UpstreamUnavailableError'
  }
}

type LoaderResult = {
  timestamp?: number
  beaches?: string[]
  counties?: string[]
  municipalities?: string[]
  temperatures?: unknown[]
  Timestamp?: number
  Beaches?: string[]
  Counties?: string[]
  Municipalities?: string[]
  Data?: unknown[]
}

type Loader = () => Promise<LoaderResult>

interface CacheEntry {
  fetchedAt: number
  dataset: BadevannDataset
}

interface CreateClientOptions {
  ttlMs?: number
  now?: () => number
  loader?: Loader
}

let isInitialized = false

async function defaultLoader(): Promise<LoaderResult> {
  const config = await import('badevann/src/core/config.js')
  const dataService = await import('badevann/src/services/dataService.js')

  if (!isInitialized) {
    await config.loadSettings()
    await config.updateSetting('cacheTimeout', 0)
    isInitialized = true
  }

  return dataService.getTemperatureData()
}

function normalizeDataset(data: LoaderResult): BadevannDataset {
  const rawTemperatures = data.temperatures ?? data.Data ?? []
  const temperatures = rawTemperatures.filter(
    (item): item is RawBeachTemperature =>
      typeof item === 'object' &&
      item !== null &&
      'id' in item &&
      'temperature' in item &&
      'time' in item &&
      'location' in item
  )

  return {
    timestamp: data.timestamp ?? data.Timestamp ?? Date.now(),
    beaches: data.beaches ?? data.Beaches ?? [],
    counties: data.counties ?? data.Counties ?? [],
    municipalities: data.municipalities ?? data.Municipalities ?? [],
    temperatures
  }
}

export function createBadevannClient(options?: CreateClientOptions): DataClient {
  const ttlMs = options?.ttlMs ?? Number(process.env.API_CACHE_TTL_MS ?? 900000)
  const now = options?.now ?? (() => Date.now())
  const loader = options?.loader ?? defaultLoader

  let cache: CacheEntry | undefined
  let inFlight: Promise<DatasetResult> | undefined

  const refresh = async (): Promise<DatasetResult> => {
    try {
      const loaded = await loader()
      const dataset = normalizeDataset(loaded)
      cache = {
        fetchedAt: now(),
        dataset
      }

      return {
        dataset,
        stale: false,
        cacheAgeMs: 0
      }
    } catch (error) {
      if (cache) {
        return {
          dataset: cache.dataset,
          stale: true,
          cacheAgeMs: now() - cache.fetchedAt
        }
      }

      throw new UpstreamUnavailableError(
        error instanceof Error ? error.message : 'Ukjent feil ved henting av data'
      )
    }
  }

  return {
    async getDataset(forceRefresh = false): Promise<DatasetResult> {
      const cacheValid = cache ? now() - cache.fetchedAt < ttlMs : false

      if (!forceRefresh && cache && cacheValid) {
        return {
          dataset: cache.dataset,
          stale: false,
          cacheAgeMs: now() - cache.fetchedAt
        }
      }

      if (!inFlight) {
        inFlight = refresh().finally(() => {
          inFlight = undefined
        })
      }

      return inFlight
    }
  }
}

export const badevannClient = createBadevannClient()
