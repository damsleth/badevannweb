import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import type { DataClient } from './types.js'
import { badevannClient } from './services/badevannClient.js'
import { createHealthRouter } from './routes/health.js'
import { createMetaRouter } from './routes/meta.js'
import { createTemperatureRouter } from './routes/temperatures.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

interface CreateAppOptions {
  dataClient?: DataClient
}

export function createApp(options?: CreateAppOptions) {
  const app = express()
  const dataClient = options?.dataClient ?? badevannClient

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'

  app.use(
    cors({
      origin: corsOrigin
    })
  )

  app.use(express.json())
  app.use(morgan('dev'))

  app.use('/api/health', createHealthRouter())
  app.use('/api/meta', createMetaRouter(dataClient))
  app.use('/api', createTemperatureRouter(dataClient))

  // Production: serve the built web app from the same process
  if (process.env.WEB_DIST) {
    app.use(express.static(process.env.WEB_DIST))
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
