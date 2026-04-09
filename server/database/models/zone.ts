import { Schema, model, Types } from 'mongoose'
import { patternsToRegexSource } from '../../../shared/utils/zone'

const zoneSchema = new Schema({
  siteId: { type: Types.ObjectId, ref: 'Site', required: true, index: true },
  name: { type: String, default: null },
  patterns: { type: [String], required: true },
  isDefault: { type: Boolean, default: false },
  _patternsRegex: { type: String },
  createdBy: { type: Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

// Pre-compile regex on save for efficient MongoDB queries
zoneSchema.pre('save', function () {
  if (this.isModified('patterns')) {
    this._patternsRegex = patternsToRegexSource(this.patterns)
  }
})

zoneSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate() as any
  if (update?.patterns || update?.$set?.patterns) {
    const patterns = update.patterns || update.$set.patterns
    const regexSource = patternsToRegexSource(patterns)
    if (update.$set) {
      update.$set._patternsRegex = regexSource
    }
    else {
      this.set('_patternsRegex', regexSource)
    }
  }
})

// findOne({ siteId, isDefault: true }) — lookup zone par defaut
zoneSchema.index({ siteId: 1, isDefault: 1 })

export const Zone = model('Zone', zoneSchema)
