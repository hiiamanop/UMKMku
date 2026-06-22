'use server'

import { createClient } from '@/lib/supabase/server'
import type { Order } from '@/lib/supabase/types'

export interface AnalyticsMetrics {
  totalRevenue: number
  totalOrders: number
  topProducts: Array<{
    id: string
    name: string
    quantity: number
    revenue: number
  }>
  repeatCustomerRate: number
  ordersByDate: Array<{
    date: string
    count: number
    revenue: number
  }>
  revenueTrend: Array<{
    date: string
    revenue: number
  }>
}

/**
 * Get analytics metrics for a tenant (last 30 days)
 */
export async function getAnalyticsMetrics(
  tenantId: string
): Promise<AnalyticsMetrics | null> {
  const supabase = await createClient()

  try {
    // Get 30-day cutoff date
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const cutoffDate = thirtyDaysAgo.toISOString()

    // Fetch all orders for the tenant in the last 30 days
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('payment_status', 'completed')
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: true })

    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return null
    }

    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        topProducts: [],
        repeatCustomerRate: 0,
        ordersByDate: [],
        revenueTrend: [],
      }
    }

    // Calculate metrics from orders
    const metrics = calculateMetrics(orders as Order[])

    return metrics
  } catch (error) {
    console.error('Error getting analytics metrics:', error)
    return null
  }
}

function calculateMetrics(orders: Order[]): AnalyticsMetrics {
  // Calculate total revenue and orders
  const totalRevenue = orders.reduce((sum, order) => sum + order.final_price, 0)
  const totalOrders = orders.length

  // Calculate top products
  const productMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >()

  orders.forEach((order) => {
    order.items.forEach((item: any) => {
      const productId = item.product_id
      const current = productMap.get(productId) || {
        name: item.product_name || 'Unknown',
        quantity: 0,
        revenue: 0,
      }
      current.quantity += item.quantity || 1
      current.revenue += (item.price_at_purchase || 0) * (item.quantity || 1)
      productMap.set(productId, current)
    })
  })

  const topProducts = Array.from(productMap.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // Calculate repeat customer rate
  const emailCounts = new Map<string, number>()
  orders.forEach((order) => {
    const email = order.customer_email
    emailCounts.set(email, (emailCounts.get(email) || 0) + 1)
  })

  const repeatCustomers = Array.from(emailCounts.values()).filter(
    (count) => count > 1
  ).length
  const repeatCustomerRate =
    totalOrders > 0 ? Math.round((repeatCustomers / emailCounts.size) * 100) : 0

  // Calculate orders by date
  const dateMap = new Map<
    string,
    { count: number; revenue: number }
  >()

  orders.forEach((order) => {
    const date = new Date(order.created_at)
    const dateStr = date.toISOString().split('T')[0]
    const current = dateMap.get(dateStr) || { count: 0, revenue: 0 }
    current.count += 1
    current.revenue += order.final_price
    dateMap.set(dateStr, current)
  })

  const ordersByDate = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      ...data,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Revenue trend (same as ordersByDate but for line chart)
  const revenueTrend = ordersByDate

  return {
    totalRevenue,
    totalOrders,
    topProducts,
    repeatCustomerRate,
    ordersByDate,
    revenueTrend,
  }
}
