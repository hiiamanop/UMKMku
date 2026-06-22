import { Request, Response, NextFunction } from 'express'
import { createHmac } from 'crypto'

/**
 * Verify Xendit webhook signature
 * Xendit sends X-XENDIT-WEBHOOK-TOKEN header with HMAC-SHA256 signature
 * https://developers.xendit.co/api-reference/#verify-webhook-signature
 */
export function verifyXenditSignature(req: Request, res: Response, next: NextFunction): void {
  try {
    const webhookToken = req.get('X-XENDIT-WEBHOOK-TOKEN')
    const callbackToken = req.get('X-CALLBACK-TOKEN')
    const rawBody = JSON.stringify(req.body)

    // Xendit uses the API key as the webhook secret
    const secret = process.env.XENDIT_API_KEY

    if (!secret) {
      console.error('[WEBHOOK] XENDIT_API_KEY not configured')
      res.status(500).json({
        error: 'Webhook verification not configured',
      })
      return
    }

    // Compute expected signature
    // Xendit uses: HMAC-SHA256(request_body, api_key)
    const expectedSignature = createHmac('sha256', secret).update(rawBody).digest('hex')

    // Compare signatures
    // Note: Xendit might send signature in different header depending on API version
    const receivedSignature = webhookToken || callbackToken

    if (!receivedSignature) {
      console.warn('[WEBHOOK] No signature header found')
      res.status(401).json({
        error: 'Missing webhook signature',
      })
      return
    }

    // Constant-time comparison to prevent timing attacks
    const isValid = constantTimeCompare(receivedSignature, expectedSignature)

    if (!isValid) {
      console.warn('[WEBHOOK] Invalid webhook signature')
      res.status(401).json({
        error: 'Invalid webhook signature',
      })
      return
    }

    console.log('[WEBHOOK] Signature verified successfully')
    next()
  } catch (error) {
    console.error('[WEBHOOK] Signature verification error:', error)
    res.status(500).json({
      error: 'Signature verification failed',
    })
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}
