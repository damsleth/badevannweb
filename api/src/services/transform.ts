import type { BeachTemperature, RawBeachTemperature, TemperatureBucket } from '../types.js'

export interface Thresholds {
  HOT: number
  WARM: number
  PLEASANT: number
  COMFORTABLE: number
  COOL: number
  COLD: number
}

const defaultThresholds: Thresholds = {
  HOT: 25,
  WARM: 22,
  PLEASANT: 20,
  COMFORTABLE: 17,
  COOL: 15,
  COLD: 10
}

export function getBucketAndEmoji(
  temperature: number,
  thresholds: Thresholds = defaultThresholds
): { bucket: TemperatureBucket; emoji: string } {
  if (temperature >= thresholds.HOT) {
    return { bucket: 'hot', emoji: '🥵' }
  }
  if (temperature >= thresholds.WARM) {
    return { bucket: 'warm', emoji: '😎' }
  }
  if (temperature >= thresholds.PLEASANT) {
    return { bucket: 'pleasant', emoji: '😁' }
  }
  if (temperature >= thresholds.COMFORTABLE) {
    return { bucket: 'comfortable', emoji: '😊' }
  }
  if (temperature >= thresholds.COOL) {
    return { bucket: 'cool', emoji: '😑' }
  }

  return { bucket: 'cold', emoji: temperature >= thresholds.COLD ? '🥶' : '⛄️' }
}

export function toBeachTemperature(
  item: RawBeachTemperature,
  thresholds: Thresholds = defaultThresholds
): BeachTemperature {
  const { bucket, emoji } = getBucketAndEmoji(item.temperature, thresholds)

  return {
    id: item.id,
    temperature: item.temperature,
    time: item.time,
    location: item.location,
    sourceDisplayName: item.sourceDisplayName ?? null,
    emoji,
    bucket
  }
}

export function toBeachTemperatures(
  items: RawBeachTemperature[],
  thresholds: Thresholds = defaultThresholds
): BeachTemperature[] {
  return items.map((item) => toBeachTemperature(item, thresholds))
}
