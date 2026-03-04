declare module 'badevann/src/services/dataService.js' {
  export function getTemperatureData(): Promise<{
    timestamp?: number
    beaches?: string[]
    counties?: string[]
    municipalities?: string[]
    temperatures?: Array<unknown>
    Timestamp?: number
    Beaches?: string[]
    Counties?: string[]
    Municipalities?: string[]
    Data?: Array<unknown>
  }>
}

declare module 'badevann/src/core/config.js' {
  export function loadSettings(): Promise<unknown>
  export function getSettings(): { cacheTimeout?: number }
  export function updateSetting(key: string, value: unknown): Promise<boolean>
}

declare module 'badevann/src/utils/constants.js' {
  export const TEMP_THRESHOLDS: {
    HOT: number
    WARM: number
    PLEASANT: number
    COMFORTABLE: number
    COOL: number
    COLD: number
  }
}
