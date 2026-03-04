import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import type { ApiErrorResponse } from '../types.js'

interface HttpError extends Error {
  status?: number
}

export function notFoundHandler(_req: Request, res: Response): void {
  const payload: ApiErrorResponse = {
    error: {
      code: 'NOT_FOUND',
      message: 'Fant ikke ressursen du etterspurte.'
    }
  }

  res.status(404).json(payload)
}

export function errorHandler(
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    const payload: ApiErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ugyldige query-parametre.',
        details: error.issues
      }
    }

    res.status(400).json(payload)
    return
  }

  const status = error.status ?? 500
  const code = status === 503 ? 'UPSTREAM_UNAVAILABLE' : 'INTERNAL_SERVER_ERROR'

  const payload: ApiErrorResponse = {
    error: {
      code,
      message:
        status === 503
          ? 'Tjenesten klarte ikke hente data fra upstream.'
          : 'Uventet feil i API-et.'
    }
  }

  const logPayload = {
    level: 'error',
    status,
    name: error.name,
    message: error.message,
    stack: error.stack
  }

  console.error(JSON.stringify(logPayload))
  res.status(status).json(payload)
}
