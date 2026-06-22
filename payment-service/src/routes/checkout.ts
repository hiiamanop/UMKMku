import { Router, Request, Response } from 'express'
import { XenditClient } from '../services/xendit-client.js'
import { OrderService } from '../services/order-service.js'

const router = Router()
const xendit = new XenditClient()
const orderService = new OrderService()

interface CheckoutRequest extends Request {
  body: {
    tenant_slug: string
    cart_items: Array<{
      product_id: string
      quantity: number
      price: number
    }>
    customer_email: string
    customer_phone: string
    customer_name: string
  }
}

/**
 * POST /api/orders/:tenant_slug/checkout
 * Create payment order and generate Xendit QRIS
 */
router.post('/:tenant_slug/checkout', async (req: CheckoutRequest, res: Response) => {
  try {
    const { tenant_slug } = req.params
    const { cart_items, customer_email, customer_phone, customer_name } = req.body

    // Validation
    if (!tenant_slug || !cart_items || !customer_email) {
      return res.status(400).json({
        error: 'Missing required fields: tenant_slug, cart_items, customer_email',
      })
    }

    // Calculate total
    const total_amount = cart_items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    // Create order in Supabase
    const order = await orderService.createOrder({
      tenant_slug,
      cart_items,
      customer_email,
      customer_phone,
      customer_name,
      total_amount,
    })

    // Generate Xendit QRIS
    const xenditResponse = await xendit.createQRISInvoice({
      external_id: order.id,
      amount: total_amount,
      payer_email: customer_email,
      description: `Order from ${tenant_slug}`,
      items: cart_items.map((item) => ({
        name: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
    })

    // Update order with Xendit invoice ID
    await orderService.updateOrder(order.id, {
      xendit_invoice_id: xenditResponse.id,
      qr_code_url: xenditResponse.qr_code_url,
    })

    return res.status(201).json({
      success: true,
      order_id: order.id,
      tenant_slug,
      total_amount,
      qr_code_url: xenditResponse.qr_code_url,
      xendit_invoice_id: xenditResponse.id,
      expires_at: xenditResponse.expires_at,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return res.status(500).json({
      error: 'Failed to create checkout',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

export default router
