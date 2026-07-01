import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/orders/[id]/status
 * Get the current status of an order
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id: string,
 *     order_status: string,
 *     payment_status: string,
 *     final_price: number,
 *     customer_email: string,
 *     created_at: string,
 *     qris_code?: string,
 *     qris_image_url?: string,
 *     items: Array<any>,
 *     pricing_breakdown: {
 *       subtotal: number,
 *       ppn: number,
 *       subtotal_with_ppn: number,
 *       xendit_fee: number,
 *       final_price: number
 *     }
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: orderId } = await params

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch order by ID
    const { data: order, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        tenant_id,
        customer_email,
        customer_name,
        customer_phone,
        items,
        subtotal,
        ppn,
        subtotal_with_ppn,
        xendit_fee,
        final_price,
        qris_code,
        qris_image_url,
        payment_status,
        order_status,
        promo_code,
        discount_amount,
        created_at,
        updated_at
      `
      )
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Ownership check: merchant owner of tenant OR customer who placed the order
    const { data: tenant } = await supabase.from('tenants').select('owner_id').eq('id', order.tenant_id).single()
    const isMerchantOwner = tenant?.owner_id === user.id
    const isOrderCustomer = order.customer_email === user.email
    if (!isMerchantOwner && !isOrderCustomer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Return order details with pricing breakdown
    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        tenant_id: order.tenant_id,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        items: order.items,
        order_status: order.order_status,
        payment_status: order.payment_status,
        final_price: order.final_price,
        qris_code: order.qris_code,
        qris_image_url: order.qris_image_url,
        promo_code: order.promo_code,
        discount_amount: order.discount_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
        pricing_breakdown: {
          subtotal: order.subtotal,
          ppn: order.ppn,
          subtotal_with_ppn: order.subtotal_with_ppn,
          xendit_fee: order.xendit_fee,
          final_price: order.final_price,
        },
      },
    })
  } catch (err) {
    console.error('GET /api/orders/[id] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/orders/[id]
 * Update order status (for internal use - merchant dashboard or webhook handler)
 *
 * Request body:
 * {
 *   order_status?: string,
 *   payment_status?: string,
 *   notes?: string
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: orderId } = await params
    const body = await request.json()

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    const { order_status, payment_status, notes } = body

    // Validate at least one field is being updated
    if (!order_status && !payment_status && !notes) {
      return NextResponse.json(
        { error: 'At least one field (order_status, payment_status, notes) must be provided' },
        { status: 400 }
      )
    }

    // Validate status values if provided
    const validOrderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    const validPaymentStatuses = ['pending', 'processing', 'completed', 'failed', 'expired']

    if (order_status && !validOrderStatuses.includes(order_status)) {
      return NextResponse.json(
        { error: `order_status must be one of: ${validOrderStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return NextResponse.json(
        { error: `payment_status must be one of: ${validPaymentStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Merchant ownership check, only tenant owner can update orders
    const { data: orderForAuth } = await supabase.from('orders').select('tenant_id').eq('id', orderId).single()
    if (orderForAuth) {
      const { data: tenantForAuth } = await supabase.from('tenants').select('owner_id').eq('id', orderForAuth.tenant_id).single()
      if (tenantForAuth?.owner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (order_status) {
      updateData.order_status = order_status
    }
    if (payment_status) {
      updateData.payment_status = payment_status
    }
    if (notes) {
      updateData.notes = String(notes).trim()
    }

    // Update order
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(
        `
        id,
        tenant_id,
        customer_email,
        items,
        subtotal,
        ppn,
        subtotal_with_ppn,
        xendit_fee,
        final_price,
        payment_status,
        order_status,
        created_at,
        updated_at
      `
      )
      .single()

    if (error || !updatedOrder) {
      if (error?.code === 'PGRST116') {
        // No rows updated
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      console.error('Update order error:', error)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedOrder.id,
        payment_status: updatedOrder.payment_status,
        order_status: updatedOrder.order_status,
        final_price: updatedOrder.final_price,
        updated_at: updatedOrder.updated_at,
      },
    })
  } catch (err) {
    console.error('PUT /api/orders/[id] error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
