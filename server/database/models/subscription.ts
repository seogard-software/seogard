import { Schema, model } from 'mongoose'

const subscriptionSchema = new Schema({
  orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
  stripeCustomerId: { type: String, default: null, sparse: true },
  stripeSubscriptionId: { type: String, default: null, sparse: true },
  stripeStatus: {
    type: String,
    enum: ['trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'],
    default: 'trialing',
  },

  currentPeriodStart: { type: Date, default: null },
  currentPeriodEnd: { type: Date, default: null },
}, { timestamps: true })

export const Subscription = model('Subscription', subscriptionSchema)
