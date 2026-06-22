import axios, { AxiosInstance } from 'axios'

interface QRISInvoiceParams {
  external_id: string
  amount: number
  payer_email: string
  description: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

interface QRISInvoiceResponse {
  id: string
  qr_code_url: string
  expires_at: string
  status: string
}

export class XenditClient {
  private client: AxiosInstance
  private baseURL = 'https://api.xendit.co'

  constructor() {
    const apiKey = process.env.XENDIT_API_KEY

    if (!apiKey) {
      throw new Error('XENDIT_API_KEY environment variable is required')
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      auth: {
        username: apiKey,
        password: '',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Create a QRIS invoice for payment
   * https://developers.xendit.co/api-reference/#create-qr-code
   */
  async createQRISInvoice(params: QRISInvoiceParams): Promise<QRISInvoiceResponse> {
    try {
      const payload = {
        external_id: params.external_id,
        amount: params.amount,
        payer_email: params.payer_email,
        description: params.description,
        items: params.items,
        // QRIS specific
        type: 'QRIS',
        currency: 'IDR',
        channel_code: 'QRIS', // Xendit's standard QRIS channel
      }

      const response = await this.client.post('/qr_codes', payload)

      return {
        id: response.data.id,
        qr_code_url: response.data.qr_code,
        expires_at: response.data.expires_at,
        status: response.data.status,
      }
    } catch (error) {
      console.error('Xendit QRIS creation failed:', error)
      throw new Error(
        `Failed to create QRIS invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Fetch invoice details from Xendit
   */
  async getInvoiceDetails(invoice_id: string) {
    try {
      const response = await this.client.get(`/invoices/${invoice_id}`)
      return response.data
    } catch (error) {
      console.error('Xendit invoice fetch failed:', error)
      throw new Error(
        `Failed to fetch invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Expire an invoice (cancel it)
   */
  async expireInvoice(invoice_id: string) {
    try {
      const response = await this.client.patch(`/invoices/${invoice_id}/expire`)
      return response.data
    } catch (error) {
      console.error('Xendit invoice expiry failed:', error)
      throw new Error(
        `Failed to expire invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
