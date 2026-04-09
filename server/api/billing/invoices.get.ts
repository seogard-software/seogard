import { Payment, OrgMember } from '../../database/models'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)

  // Get the user's active org
  const orgId = getHeader(event, 'x-org-id')
  if (!orgId) {
    throw createError({ statusCode: 400, message: 'Organization requise' })
  }

  // Verify membership
  const membership = await OrgMember.findOne({ orgId, userId }).lean()
  if (!membership) {
    throw createError({ statusCode: 403, message: 'Accès refusé' })
  }

  const invoices = await Payment.find({ orgId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('amount currency status pagesCount invoicePdfUrl periodStart periodEnd createdAt')
    .lean()

  return { invoices }
})
