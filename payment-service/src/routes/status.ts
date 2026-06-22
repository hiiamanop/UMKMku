import { Router, Request, Response } from 'express'
import { OrderService } from '../services/order-service.js'

const router = Router()
const orderService = new OrderService()

/**
 * GET /api/orders/:order_id/status
 * Get current payment status of an order
 */
router.get('/:order_id/status', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.params

    if (!order_id) {
      return res.status(400).json({
        error: 'Missing required parameter: order_id',
      })
    }

    // Fetch order from Supabase
    const order = await orderService.getOrder(order_id)

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        order_id,
      })
    }

    return res.status(200).json({
      success: true,
      order_id: order.id,
      tenant_slug: order.tenant_slug,
      payment_status: order.payment_status,
      total_amount: order.total_amount,
      created_at: order.created_at,
      paid_at: order.paid_at,
      xendit_invoice_id: order.xendit_invoice_id,
      qr_code_url: order.qr_code_url,
    })
  } catch (error) {
    console.error('Status check error:', error)
    return res.status(500).json({
      error: 'Failed to fetch order status',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
