import { Router } from 'express'
import type { DataClient, MetaResponse } from '../types.js'

export function createMetaRouter(dataClient: DataClient): Router {
  const router = Router()

  router.get('/', async (_req, res, next) => {
    try {
      const { dataset, stale } = await dataClient.getDataset()

      const payload: MetaResponse = {
        updatedAt: new Date(dataset.timestamp).toISOString(),
        stale,
        counts: {
          beaches: dataset.beaches.length,
          counties: dataset.counties.length,
          municipalities: dataset.municipalities.length
        },
        counties: dataset.counties,
        municipalities: dataset.municipalities
      }

      res.json(payload)
    } catch (error) {
      next(error)
    }
  })

  return router
}
