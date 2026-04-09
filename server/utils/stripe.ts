import Stripe from 'stripe'
import { createLogger } from './logger'

const log = createLogger('web', 'api.stripe')

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    log.warn('STRIPE_SECRET_KEY not configured, Stripe disabled')
    return null
  }

  stripeInstance = new Stripe(key)
  return stripeInstance
}
