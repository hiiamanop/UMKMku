import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import healthRouter from './routes/health.js'
import chatRouter from './routes/chat.js'

const app: Express = express()
const port = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/health', healthRouter)
app.use('/api/chat', chatRouter)

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  })
})

// Start server
app.listen(port, () => {
  console.log(`[Chatbot Service] Server running on port ${port}`)
  console.log(`[Chatbot Service] AI Provider: ${process.env.AI_PROVIDER}`)
  console.log(`[Chatbot Service] Environment: ${process.env.NODE_ENV}`)
})

export default app
