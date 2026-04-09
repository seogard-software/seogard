import { Schema, model } from 'mongoose'

const paymentSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
  stripeInvoiceId: { type: String, required: true, unique: true },
  stripePaymentIntentId: { type: String, default: null },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'eur' },
  status: {
    type: String,
    enum: ['succeeded', 'failed', 'pending', 'refunded'],
    required: true,
  },
  pagesCount: { type: Number, default: null },
  invoicePdfUrl: { type: String, default: null },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
}, { timestamps: true })

paymentSchema.index({ orgId: 1, createdAt: -1 })

export const Payment = model('Payment', paymentSchema)
