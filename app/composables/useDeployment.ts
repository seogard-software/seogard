export function useDeployment() {
  const config = useRuntimeConfig()
  const isSelfHosted = computed(() => String(config.public.selfHosted) === 'true')
  const isCloud = computed(() => !isSelfHosted.value)

  return { isSelfHosted, isCloud }
}
