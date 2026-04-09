export type StripeSubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete'

export type PaymentStatus = 'succeeded' | 'failed' | 'pending' | 'refunded'

export interface Subscription {
  _id: string
  orgId: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripeStatus: StripeSubscriptionStatus

  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  createdAt: string
  updatedAt: string
}

export interface Payment {
  _id: string
  orgId: string
  subscriptionId: string
  stripeInvoiceId: string
  stripePaymentIntentId: string | null
  amount: number
  currency: string
  status: PaymentStatus
  pagesCount: number | null
  invoicePdfUrl: string | null
  periodStart: string
  periodEnd: string
  createdAt: string
  updatedAt: string
}
