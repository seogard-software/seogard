import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, default: null },
  name: { type: String, default: null },
  avatarUrl: { type: String, default: null },
  authProvider: { type: String, enum: ['local', 'google', 'microsoft', 'github'], default: 'local' },
  oauthProviderId: { type: String, default: null },
  totpSecret: { type: String, default: null },
  totpEnabled: { type: Boolean, default: false },
  backupCodes: [{ type: String }],
  trialEndsAt: { type: Date, default: null },
  acceptedTermsAt: { type: Date, default: null },
  acceptedTermsVersion: { type: String, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpiresAt: { type: Date, default: null },
}, { timestamps: true })

export const User = model('User', userSchema)
