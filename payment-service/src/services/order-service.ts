import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

interface OrderItem {
  product_id: string
  quantity: number
  price: number
}

interface CreateOrderParams {
  tenant_slug: string
  cart_items: OrderItem[]
  customer_email: string
  customer_phone: string
  customer_name: string
  total_amount: number
}

interface OrderUpdateParams {
  xendit_invoice_id?: string
  qr_code_url?: string
  payment_status?: string
  paid_at?: Date
}

interface Order {
  id: string
  tenant_slug: string
  customer_email: string
  customer_phone: string
  customer_name: string
  total_amount: number
  payment_status: string
  xendit_invoice_id?: string
  qr_code_url?: string
  created_at: string
  paid_at?: string
}

export class OrderService {
  private supabase

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required')
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  /**
   * Create a new order in the database
   */
  async createOrder(params: CreateOrderParams): Promise<Order> {
    try {
      const orderId = randomUUID()

      const { error } = await this.supabase.from('orders').insert([
        {
          id: orderId,
          tenant_slug: params.tenant_slug,
          customer_email: params.customer_email,
          customer_phone: params.customer_phone,
          customer_name: params.customer_name,
          total_amount: params.total_amount,
          cart_items: params.cart_items,
          payment_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        throw new Error(`Failed to insert order: ${error.message}`)
      }

      console.log(`[ORDER] Created order ${orderId} for tenant ${params.tenant_slug}`)

      return {
        id: orderId,
        tenant_slug: params.tenant_slug,
        customer_email: params.customer_email,
        customer_phone: params.customer_phone,
        customer_name: params.customer_name,
        total_amount: params.total_amount,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Order creation error:', error)
      throw error
    }
  }

  /**
   * Retrieve an order by ID
   */
  async getOrder(order_id: string): Promise<Order | null> {
    try {
      const { data, error } = await this.supabase.from('orders').select('*').eq('id', order_id).single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null
        }
        throw new Error(`Failed to fetch order: ${error.message}`)
      }

      return data as Order
    } catch (error) {
      console.error('Order fetch error:', error)
      throw error
    }
  }

  /**
   * Update an order's payment status and metadata
   */
  async updateOrder(order_id: string, updates: OrderUpdateParams): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id)
        .select('*')
        .single()

      if (error) {
        throw new Error(`Failed to update order: ${error.message}`)
      }

      console.log(`[ORDER] Updated order ${order_id}`, updates)

      return data as Order
    } catch (error) {
      console.error('Order update error:', error)
      throw error
    }
  }

  /**
   * List orders for a tenant
   */
  async getTenantOrders(tenant_slug: string, limit: number = 50, offset: number = 0) {
    try {
      const { data, error, count } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('tenant_slug', tenant_slug)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Failed to fetch tenant orders: ${error.message}`)
      }

      return {
        orders: data as Order[],
        total: count,
      }
    } catch (error) {
      console.error('Tenant orders fetch error:', error)
      throw error
    }
  }

  /**
   * Mark order as paid (called from webhook)
   */
  async markOrderAsPaid(order_id: string, xendit_invoice_id: string, paid_at: Date) {
    return this.updateOrder(order_id, {
      xendit_invoice_id,
      payment_status: 'completed',
      paid_at,
    })
  }
}
