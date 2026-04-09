import { Schema, model, Types } from 'mongoose'

const organizationSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  ownerId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  logoUrl: { type: String, default: null },
  ssoProvider: { type: String, enum: ['saml', null], default: null },
  samlEntryPoint: { type: String, default: null },
  samlCertificate: { type: String, default: null },
  samlIssuer: { type: String, default: null },
  enforceSSO: { type: Boolean, default: false },
  allowedDomains: [{ type: String }],
}, { timestamps: true })

export const Organization = model('Organization', organizationSchema)
