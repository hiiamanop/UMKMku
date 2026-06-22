import { Router, Request, Response } from 'express'

const router = Router()

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'chatbot-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: {
      provider: process.env.AI_PROVIDER,
      nodeEnv: process.env.NODE_ENV,
    },
  })
})

export default router
