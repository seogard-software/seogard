import { User } from '../../database/models'

export default defineEventHandler(async () => {
  const count = await User.countDocuments()
  return { needsSetup: count === 0 }
})
