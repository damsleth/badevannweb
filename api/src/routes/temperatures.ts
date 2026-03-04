import { Router } from 'express'
import { z } from 'zod'
import type { DataClient, TemperatureListResponse, TopResponse } from '../types.js'
import { applyTemperatureQuery, type SortType as APISortType } from '../services/query.js'
import { toBeachTemperatures } from '../services/transform.js'

const sortSchema = z.enum([
  'temperature_desc',
  'temperature_asc',
  'name_asc',
  'newest_desc'
])

const limitSchema = z.preprocess((value) => {
  if (value === undefined || value === '') {
    return undefined
  }
  if (typeof value === 'string') {
    return Number(value)
  }
  return value
}, z.number().int().min(1).max(5000).optional())

const temperatureQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  county: z.string().trim().min(1).optional(),
  municipality: z.string().trim().min(1).optional(),
  sort: sortSchema.default('temperature_desc'),
  limit: limitSchema
})

const topQuerySchema = z.object({
  limit: limitSchema.default(10)
})

export function createTemperatureRouter(dataClient: DataClient): Router {
  const router = Router()

  router.get('/temperatures', async (req, res, next) => {
    try {
      const query = temperatureQuerySchema.parse(req.query)
      const { dataset, stale } = await dataClient.getDataset()

      const transformed = toBeachTemperatures(dataset.temperatures)
      const result = applyTemperatureQuery(transformed, {
        q: query.q,
        county: query.county,
        municipality: query.municipality,
        sort: query.sort as APISortType,
        limit: query.limit
      })

      const payload: TemperatureListResponse = {
        updatedAt: new Date(dataset.timestamp).toISOString(),
        stale,
        total: transformed.length,
        count: result.length,
        items: result
      }

      res.json(payload)
    } catch (error) {
      next(error)
    }
  })

  router.get('/top', async (req, res, next) => {
    try {
      const query = topQuerySchema.parse(req.query)
      const { dataset, stale } = await dataClient.getDataset()

      const transformed = toBeachTemperatures(dataset.temperatures)
      const result = applyTemperatureQuery(transformed, {
        sort: 'temperature_desc',
        limit: query.limit
      })

      const payload: TopResponse = {
        updatedAt: new Date(dataset.timestamp).toISOString(),
        stale,
        count: result.length,
        items: result
      }

      res.json(payload)
    } catch (error) {
      next(error)
    }
  })

  return router
}
