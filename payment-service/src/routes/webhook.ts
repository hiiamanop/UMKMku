import { Router, Request, Response } from 'express'
import { verifyXenditSignature } from '../middleware/xendit-verify.js'
import { OrderService } from '../services/order-service.js'

const router = Router()
const orderService = new OrderService()

interface XenditWebhookPayload extends Request {
  body: {
    id: string
    external_id: string
    status: string
    paid_at: string
    amount: number
    payer_email: string
    xendit_signature: string
  }
}

/**
 * POST /webhook/xendit
 * Handle Xendit invoice paid callback
 * Signature verification required
 */
router.post('/xendit', verifyXenditSignature, async (req: XenditWebhookPayload, res: Response) => {
  try {
    const { id: xendit_invoice_id, external_id: order_id, status, paid_at } = req.body

    console.log(`[WEBHOOK] Processing Xendit payment - Order: ${order_id}, Status: ${status}`)

    // Update order status in Supabase
    if (status === 'PAID') {
      await orderService.updateOrder(order_id, {
        payment_status: 'completed',
        xendit_invoice_id,
        paid_at: new Date(paid_at),
      })

      console.log(`[WEBHOOK] Order ${order_id} marked as paid`)
    } else if (status === 'EXPIRED') {
      await orderService.updateOrder(order_id, {
        payment_status: 'expired',
      })

      console.log(`[WEBHOOK] Order ${order_id} payment expired`)
    }

    // Acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Webhook processed',
      order_id,
      status,
    })
  } catch (error) {
    console.error('[WEBHOOK] Error processing Xendit callback:', error)
    // Return 200 to prevent Xendit from retrying, but log the error
    return res.status(200).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
