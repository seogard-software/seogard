import { createPersonalOrg } from '../../utils/org-create'

export default defineEventHandler(async (event) => {
  const userId = requireAuth(event)
  const log = useRequestLog(event, 'api.organizations')
  const body = await readBody(event)

  if (!body?.name) {
    throw createError({ statusCode: 400, message: 'Nom requis' })
  }

  // Cr\u00e9ation canonique (orga + membership owner + subscription trial + client Stripe).
  const org = await createPersonalOrg({ userId, name: body.name })

  log.info({ userId, orgId: org._id, orgName: org.name }, 'organization created')

  return org
})
