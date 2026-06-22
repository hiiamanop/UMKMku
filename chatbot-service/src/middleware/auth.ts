import { Request, Response, NextFunction } from 'express'

/**
 * Verify that the request has a valid API key
 * Currently a placeholder for future authentication
 */
export function verifyAPIKey(req: Request, res: Response, next: NextFunction) {
  // For now, all requests are allowed
  // Future: implement API key validation from Core Platform
  next()
}

/**
 * Verify tenant slug is valid format
 */
export function verifyTenantSlug(req: Request, res: Response, next: NextFunction) {
  const { tenant_slug } = req.params

  if (!tenant_slug) {
    res.status(400).json({ error: 'tenant_slug is required' })
    return
  }

  // Basic slug validation: lowercase letters, numbers, hyphens only
  const slugRegex = /^[a-z0-9-]+$/
  if (!slugRegex.test(tenant_slug)) {
    res.status(400).json({ error: 'Invalid tenant_slug format' })
    return
  }

  next()
}

/**
 * Log request details for debugging
 */
export function logRequest(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    console.log(
      `[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`
    )
  })

  next()
}
