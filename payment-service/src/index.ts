import express, { Application, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import checkoutRoutes from './routes/checkout.js'
import webhookRoutes from './routes/webhook.js'
import statusRoutes from './routes/status.js'

const app: Application = express()
const PORT = process.env.PORT || 3002
const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  })
})

// Routes
app.use('/api/orders', checkoutRoutes)
app.use('/webhook', webhookRoutes)
app.use('/api/orders', statusRoutes)

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack)
  res.status(500).json({
    error: 'Internal Server Error',
    message: NODE_ENV === 'development' ? err.message : undefined,
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
  })
})

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   Payment Service started successfully         ║
║   Environment: ${NODE_ENV.padEnd(30)}║
║   Port: ${String(PORT).padEnd(38)}║
║   Timestamp: ${new Date().toISOString()}  ║
╚════════════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

export default app
