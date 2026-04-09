export function isSelfHosted(): boolean {
  return String(process.env.NUXT_PUBLIC_SELF_HOSTED) === 'true'
}
